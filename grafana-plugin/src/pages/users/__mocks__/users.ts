import { User } from 'models/user/user.types';

export const users = {
  count: 6,
  next: null,
  previous: null,
  results: [
    {
      pk: 'UZGKMPKMSIANC',
      organization: {
        pk: 'O648WVI5IYWF6',
        name: 'Self-Hosted Organization',
      },
      current_team: null,
      email: 'admin@localhost',
      username: 'oncall',
      name: '',
      role: 0,
      avatar: '/avatar/46d229b033af06a191ff2267bca9ae56',
      avatar_full: 'http://localhost:3000/avatar/46d229b033af06a191ff2267bca9ae56',
      timezone: 'Europe/Bucharest',
      working_hours: {
        monday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        tuesday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        wednesday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        thursday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        friday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        saturday: [],
        sunday: [],
      },
      unverified_phone_number: null,
      verified_phone_number: null,
      slack_user_identity: null,
      telegram_configuration: null,
      messaging_backends: {
        MOBILE_APP: {
          connected: false,
        },
        MOBILE_APP_CRITICAL: {
          connected: false,
        },
        EMAIL: {
          email: 'admin@localhost',
        },
      },
      permissions: [
        'update_incidents',
        'update_own_settings',
        'view_other_users',
        'update_alert_receive_channels',
        'update_escalation_policies',
        'update_notification_policies',
        'update_general_log_channel_id',
        'update_other_users_settings',
        'update_integrations',
        'update_schedules',
        'update_custom_actions',
        'update_api_tokens',
        'update_teams',
        'update_maintenances',
        'update_global_settings',
        'send_demo_alert',
      ],
      notification_chain_verbal: {
        default: '',
        important: '',
      },
      cloud_connection_status: 0,
      hide_phone_number: false,
    },
    {
      pk: 'U7XDD959C31RQ',
      organization: {
        pk: 'O648WVI5IYWF6',
        name: 'Self-Hosted Organization',
      },
      current_team: null,
      email: 'rares.mardare+viewer@grafana.com',
      username: 'rares.mardare+viewer@grafana.com',
      name: '',
      role: 2,
      avatar: '/avatar/19545c37f53858c7fce628e387705163',
      avatar_full: 'http://localhost:3000/avatar/19545c37f53858c7fce628e387705163',
      timezone: null,
      working_hours: {
        monday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        tuesday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        wednesday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        thursday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        friday: [
          {
            start: '09:00:00',
            end: '17:00:00',
          },
        ],
        saturday: [],
        sunday: [],
      },
      unverified_phone_number: null,
      verified_phone_number: null,
      slack_user_identity: null,
      telegram_configuration: null,
      messaging_backends: {
        MOBILE_APP: {
          connected: false,
        },
        MOBILE_APP_CRITICAL: {
          connected: false,
        },
        EMAIL: {
          email: 'rares.mardare+viewer@grafana.com',
        },
      },
      permissions: [],
      notification_chain_verbal: {
        default: '',
        important: '',
      },
      cloud_connection_status: 0,
      hide_phone_number: false,
    },
  ] as User[],
};
