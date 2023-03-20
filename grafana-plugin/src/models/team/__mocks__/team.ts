import { Team } from '../team.types';

// @ts-ignore
export const team: Team = {
  pk: 'O648WVI5IYWF6',
  name: 'Self-Hosted Organization',
  slack_team_identity: null,
  maintenance_mode: null,
  maintenance_till: null,
  slack_channel: null,
  limits: {
    period_title: 'Daily limit',
    limits_to_show: [{ limit_title: 'Phone Calls & SMS', total: 200, left: 200 }],
    show_limits_warning: false,
    warning_text: 'You almost have exceeded the limit of phone calls and sms: 200 of 200 left.',
    show_limits_popup: false,
  },
  archive_alerts_from: '1970-01-01',
  is_resolution_note_required: false,
  env_status: { telegram_configured: false, twilio_configured: false },
  banner: { title: null, body: null },
};
