// Custom properties not exposed by OpenAPI schema should be defined here

import { ApiSchemas } from 'network/oncall-api/api.types';

export type CustomApiSchemas = {
  Webhook: {
    last_response_log?: {
      timestamp: string;
      url: string;
      request_trigger: string;
      request_headers: string;
      request_data: string;
      status_code: string;
      content: string;
      event_data: string;
    };
  };
  AlertReceiveChannelIntegrationOptions: {
    value: ApiSchemas['AlertReceiveChannel']['integration'];
  };
};
