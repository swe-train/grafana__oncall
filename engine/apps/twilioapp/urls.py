from django.urls import path

from .views import (
    CallStatusCallback,
    GatherView,
    HealthCheckView,
    SMSStatusCallback,
    TwilioFlowEscalate,
    TwilioFlowGetEscalationTargets,
)

app_name = "twilioapp"

urlpatterns = [
    path("healthz", HealthCheckView.as_view()),
    path("gather/", GatherView.as_view(), name="gather"),
    path("sms_status_events/", SMSStatusCallback.as_view(), name="sms_status_events"),
    path("call_status_events/", CallStatusCallback.as_view(), name="call_status_events"),
    path("get_escalation_targets/", TwilioFlowGetEscalationTargets.as_view(), name="get_escalation_targets"),
    path("escalate/", TwilioFlowEscalate.as_view(), name="escalate"),
]
