export const NotificationPolicies = {
  name: 'User Notification Policy List',
  description: '',
  renders: ['application/json', 'text/html'],
  parses: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
  actions: {
    POST: {
      id: { type: 'string', required: false, read_only: true, label: 'Id' },
      step: {
        type: 'choice',
        required: false,
        read_only: false,
        label: 'Step',
        choices: [
          { value: 0, display_name: 'Wait' },
          { value: 1, display_name: 'Notify by' },
        ],
      },
      order: { type: 'integer', required: false, read_only: true, label: 'Order' },
      notify_by: {
        type: 'choice',
        required: false,
        read_only: false,
        label: 'Notify by',
        choices: [
          { value: 0, display_name: 0 },
          { value: 1, display_name: 1 },
          { value: 2, display_name: 2 },
          { value: 3, display_name: 3 },
          { value: 5, display_name: 5 },
          { value: 6, display_name: 6 },
          { value: 8, display_name: 8 },
        ],
      },
      wait_delay: {
        type: 'choice',
        required: false,
        read_only: false,
        label: 'Wait delay',
        choices: [
          { value: '60.0', display_name: '1 min' },
          { value: '300.0', display_name: '5 min' },
          { value: '900.0', display_name: '15 min' },
          { value: '1800.0', display_name: '30 min' },
          { value: '3600.0', display_name: '60 min' },
        ],
      },
      important: { type: 'boolean', required: false, read_only: false, label: 'Important' },
      user: { type: 'field', required: false, read_only: false, label: 'User' },
      prev_step: { type: 'string', required: false, read_only: false, label: 'Prev step' },
    },
  },
};
