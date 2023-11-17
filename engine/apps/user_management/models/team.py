import typing

from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models, transaction

from apps.alerts.models import AlertReceiveChannel, ChannelFilter
from apps.metrics_exporter.helpers import metrics_add_integration_to_cache, metrics_bulk_update_team_label_cache
from apps.metrics_exporter.metrics_cache_manager import MetricsCacheManager
from common.public_primary_keys import generate_public_primary_key, increase_public_primary_key_length

if typing.TYPE_CHECKING:
    from django.db.models.manager import RelatedManager

    from apps.alerts.models import AlertGroupLogRecord
    from apps.grafana_plugin.helpers.client import GrafanaAPIClient
    from apps.schedules.models import CustomOnCallShift
    from apps.user_management.models import Organization, User


def generate_public_primary_key_for_team() -> str:
    prefix = "T"
    new_public_primary_key = generate_public_primary_key(prefix)

    failure_counter = 0
    while Team.objects.filter(public_primary_key=new_public_primary_key).exists():
        new_public_primary_key = increase_public_primary_key_length(
            failure_counter=failure_counter, prefix=prefix, model_name="Team"
        )
        failure_counter += 1

    return new_public_primary_key


class TeamManager(models.Manager["Team"]):
    @staticmethod
    def sync_for_organization(
        organization: "Organization", api_teams: typing.List["GrafanaAPIClient.Types.GrafanaTeam"]
    ) -> None:
        grafana_teams = {team["id"]: team for team in api_teams}
        existing_team_ids: typing.Set[int] = set(organization.teams.all().values_list("team_id", flat=True))

        # create missing teams
        teams_to_create = tuple(
            Team(
                organization_id=organization.pk,
                team_id=team["id"],
                name=team["name"],
                email=team["email"],
                avatar_url=team["avatarUrl"],
            )
            for team in grafana_teams.values()
            if team["id"] not in existing_team_ids
        )

        with transaction.atomic():
            organization.teams.bulk_create(teams_to_create, batch_size=5000)
            # Retrieve primary keys for the newly created users
            #
            # If the model’s primary key is an AutoField, the primary key attribute can only be retrieved
            # on certain databases (currently PostgreSQL, MariaDB 10.5+, and SQLite 3.35+).
            # On other databases, it will not be set.
            # https://docs.djangoproject.com/en/4.1/ref/models/querysets/#django.db.models.query.QuerySet.bulk_create
            created_teams = organization.teams.exclude(team_id__in=existing_team_ids)
            direct_paging_integrations_to_create = []
            for team in created_teams:
                alert_receive_channel = AlertReceiveChannel(
                    organization=organization,
                    team=team,
                    integration=AlertReceiveChannel.INTEGRATION_DIRECT_PAGING,
                    verbal_name=f"Direct paging ({team.name if team else 'No'} team)",
                )
                direct_paging_integrations_to_create.append(alert_receive_channel)
            AlertReceiveChannel.objects.bulk_create(direct_paging_integrations_to_create, batch_size=5000)
            created_direct_paging_integrations = (
                AlertReceiveChannel.objects.filter(
                    organization=organization,
                    integration=AlertReceiveChannel.INTEGRATION_DIRECT_PAGING,
                )
                .exclude(team__team_id__in=existing_team_ids)
                .exclude(team__isnull=True)
            )
            default_channel_filters_to_create = []
            for integration in created_direct_paging_integrations:
                channel_filter = ChannelFilter(
                    alert_receive_channel=integration,
                    filtering_term=None,
                    is_default=True,
                    order=0,
                )
                default_channel_filters_to_create.append(channel_filter)
            ChannelFilter.objects.bulk_create(default_channel_filters_to_create, batch_size=5000)

            # Add direct paging integrations to metrics cache
            for integration in direct_paging_integrations_to_create:
                metrics_add_integration_to_cache(integration)

        # delete excess teams and their direct paging integrations
        team_ids_to_delete = existing_team_ids - grafana_teams.keys()
        organization.alert_receive_channels.filter(
            team__team_id__in=team_ids_to_delete, integration=AlertReceiveChannel.INTEGRATION_DIRECT_PAGING
        ).delete()
        organization.teams.filter(team_id__in=team_ids_to_delete).delete()

        # collect teams diffs to update metrics cache
        metrics_teams_to_update: MetricsCacheManager.TeamsDiffMap = {}
        for team_id in team_ids_to_delete:
            metrics_teams_to_update = MetricsCacheManager.update_team_diff(
                metrics_teams_to_update, team_id, deleted=True
            )

        # update existing teams if any fields have changed
        teams_to_update = []
        for team in organization.teams.filter(team_id__in=existing_team_ids):
            grafana_team = grafana_teams[team.team_id]
            if (
                team.name != grafana_team["name"]
                or team.email != grafana_team["email"]
                or team.avatar_url != grafana_team["avatarUrl"]
            ):
                if team.name != grafana_team["name"]:
                    # collect teams diffs to update metrics cache
                    metrics_teams_to_update = MetricsCacheManager.update_team_diff(
                        metrics_teams_to_update, team.id, new_name=grafana_team["name"]
                    )
                team.name = grafana_team["name"]
                team.email = grafana_team["email"]
                team.avatar_url = grafana_team["avatarUrl"]
                teams_to_update.append(team)
        organization.teams.bulk_update(teams_to_update, ["name", "email", "avatar_url"], batch_size=5000)

        metrics_bulk_update_team_label_cache(metrics_teams_to_update, organization.id)


class Team(models.Model):
    current_team_users: "RelatedManager['User']"
    custom_on_call_shifts: "RelatedManager['CustomOnCallShift']"
    oncall_schedules: "RelatedManager['AlertGroupLogRecord']"
    users: "RelatedManager['User']"

    public_primary_key = models.CharField(
        max_length=20,
        validators=[MinLengthValidator(settings.PUBLIC_PRIMARY_KEY_MIN_LENGTH + 1)],
        unique=True,
        default=generate_public_primary_key_for_team,
    )

    objects = TeamManager()

    team_id = models.PositiveIntegerField()
    organization = models.ForeignKey(
        to="user_management.Organization",
        related_name="teams",
        on_delete=models.deletion.CASCADE,
    )
    users = models.ManyToManyField(to="user_management.User", related_name="teams")
    name = models.CharField(max_length=300)
    email = models.CharField(max_length=300, null=True, blank=True, default=None)
    avatar_url = models.URLField()

    # If is_sharing_resources_to_all is False only team members and admins can access it and it's resources
    # if it's True every oncall organization user can access it
    is_sharing_resources_to_all = models.BooleanField(default=False)
