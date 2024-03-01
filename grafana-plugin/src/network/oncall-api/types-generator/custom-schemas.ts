// Custom properties not exposed by OpenAPI schema should be defined here

import { ApiSchemas } from 'network/oncall-api/api.types';

export type CustomApiSchemas = {
  AlertReceiveChannelIntegrationOptions: {
    value: ApiSchemas['AlertReceiveChannel']['integration'];
  };
};
