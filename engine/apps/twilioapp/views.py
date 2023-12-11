import json
import logging

from django.core.cache import cache
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from twilio.request_validator import RequestValidator

from apps.alerts.models import AlertReceiveChannel
from apps.base.utils import live_settings
from apps.integrations.tasks import create_alert
from common.api_helpers.utils import create_engine_url

from .gather import process_gather_data
from .status_callback import update_twilio_call_status, update_twilio_sms_status

logger = logging.getLogger(__name__)


class AllowOnlyTwilio(BasePermission):
    # https://www.twilio.com/docs/usage/tutorials/how-to-secure-your-django-project-by-validating-incoming-twilio-requests
    # https://www.django-rest-framework.org/api-guide/permissions/
    def has_permission(self, request, view):
        request_account_sid = request.data.get("AccountSid")
        if not request_account_sid:
            return False

        from apps.twilioapp.models import TwilioAccount

        account = TwilioAccount.objects.filter(account_sid=request_account_sid).first()
        if account:
            return self.validate_request(request, account.account_sid, account.auth_token)

        return self.validate_request(request, live_settings.TWILIO_ACCOUNT_SID, live_settings.TWILIO_AUTH_TOKEN)

    def validate_request(self, request, expected_account_sid, auth_token):
        if auth_token:
            validator = RequestValidator(auth_token)
            location = create_engine_url(request.get_full_path())
            request_valid = validator.validate(
                request.build_absolute_uri(location=location),
                request.POST,
                request.META.get("HTTP_X_TWILIO_SIGNATURE", ""),
            )
            return request_valid
        else:
            return expected_account_sid == request.data["AccountSid"]


class HealthCheckView(APIView):
    def get(self, request):
        return Response("OK")


class GatherView(APIView):
    permission_classes = [AllowOnlyTwilio]

    def post(self, request):
        call_sid = request.POST.get("CallSid")
        digit = request.POST.get("Digits")
        response = process_gather_data(call_sid, digit)
        return HttpResponse(str(response), content_type="application/xml; charset=utf-8")


# Receive SMS Status Update from Twilio
class SMSStatusCallback(APIView):
    permission_classes = [AllowOnlyTwilio]

    def post(self, request):
        message_sid = request.POST.get("MessageSid")
        message_status = request.POST.get("MessageStatus")

        update_twilio_sms_status(message_sid=message_sid, message_status=message_status)
        return Response(data="", status=status.HTTP_204_NO_CONTENT)


# Receive Call Status Update from Twilio
class CallStatusCallback(APIView):
    permission_classes = [AllowOnlyTwilio]

    def post(self, request):
        call_sid = request.POST.get("CallSid")
        call_status = request.POST.get("CallStatus")

        update_twilio_call_status(call_sid=call_sid, call_status=call_status)
        return Response(data="", status=status.HTTP_204_NO_CONTENT)


class TwilioFlowGetEscalationTargets(APIView):
    def post(self, request):
        request_data = json.loads(request.body)
        flow_sid = request_data.get("sid")
        voice = request_data.get("voice", False)
        targets = []
        message = "Enter the number for a team or integration to escalate to:"
        if voice:
            message = "<break> Listen and enter the number for a team or integration to escalate to, followed by pound. <break>"
        index = 1
        for channel in AlertReceiveChannel.objects.filter(
            organization_id=5, integration__in=["direct_paging", "webhook"]
        ).order_by("verbal_name"):
            if voice:
                message += f"Press {index} for {channel.verbal_name}. <break>"
            else:
                message += f"\n{index} - {channel.verbal_name}"
            targets.append(channel.pk)
            index += 1
        cache.set(flow_sid, targets, timeout=600)
        return Response(data={"message": message}, status=status.HTTP_200_OK)


class TwilioFlowEscalate(APIView):
    def post(self, request):
        request_data = json.loads(request.body)
        flow_sid = request_data.get("sid")
        target_number = int(request_data.get("target"))
        targets = cache.get(flow_sid, [])
        channel_pk = targets[target_number - 1]
        timestamp = timezone.now().isoformat()
        create_alert.apply_async(
            [],
            {
                "title": None,
                "message": None,
                "image_url": None,
                "link_to_upstream_details": None,
                "alert_receive_channel_pk": channel_pk,
                "integration_unique_data": None,
                "raw_request_data": request_data,
                "received_at": timestamp,
            },
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
