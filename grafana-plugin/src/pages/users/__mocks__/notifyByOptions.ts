export const NotifyByOptions = [
  { value: 0, display_name: 'Slack mentions', slack_integration_required: true, telegram_integration_required: false },
  { value: 1, display_name: 'SMS ✉📲', slack_integration_required: false, telegram_integration_required: false },
  { value: 2, display_name: 'Phone call ☎', slack_integration_required: false, telegram_integration_required: false },
  { value: 3, display_name: 'Telegram 🤖', slack_integration_required: false, telegram_integration_required: true },
  { value: 5, display_name: 'Mobile push', slack_integration_required: false, telegram_integration_required: false },
  {
    value: 6,
    display_name: 'Mobile push important',
    slack_integration_required: false,
    telegram_integration_required: false,
  },
  { value: 8, display_name: 'Email', slack_integration_required: false, telegram_integration_required: false },
];
