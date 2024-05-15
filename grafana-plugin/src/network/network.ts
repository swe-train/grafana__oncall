import { config as GrafanaRuntimeConfig } from '@grafana/runtime';
import axios from 'axios';
import qs from 'query-string';

import { FaroHelper } from 'utils/faro';

export const API_PROXY_PREFIX = 'api/plugins/grafana-oncall-app/resources';
export const API_PATH_PREFIX = '/api/internal/v1';

const instance = axios.create();

instance.interceptors.request.use(function (config) {
  // Do something before request is sent
  config.paramsSerializer = {
    serialize: (params) => {
      return qs.stringify(params, { arrayFormat: 'none' });
    },
  };

  config.validateStatus = (status) => {
    return status >= 200 && status < 300; // default
  };
  config.headers.set('X-Idempotency-Key', `${Date.now()}-${Math.random()}`);
  config.headers.set('X-Grafana-Context', `{"UserId": "${GrafanaRuntimeConfig.bootData.user.id}"}`);

  return {
    ...config,
  };
});

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
  params?: any;
  data?: any;
  withCredentials?: boolean;
  validateStatus?: (status: number) => boolean;
  headers?: {
    [key: string]: string | number;
  };
}

export const isNetworkError = axios.isAxiosError;

export const makeRequest = async <RT = any>(path: string, config: RequestConfig) => {
  const { method = 'GET', params, data, validateStatus } = config;

  const url = `${API_PROXY_PREFIX}${API_PATH_PREFIX}${path}`;
  const otel = FaroHelper.faro?.api?.getOTEL();

  if (FaroHelper.faro && otel) {
    const tracer = otel.trace.getTracer('default');
    let span = otel.trace.getActiveSpan();

    if (!span) {
      span = tracer.startSpan('http-request');
      span.setAttribute('page_url', document.URL.split('//')[1]);
    }

    return otel.context.with(otel.trace.setSpan(otel.context.active(), span), async () => {
      FaroHelper.faro.api.pushEvent('Sending request', { url });

      try {
        const response = await instance({
          method,
          url,
          params,
          data,
          validateStatus,
        });
        FaroHelper.faro.api.pushEvent('Request completed', { url });
        span.end();
        return response.data as RT;
      } catch (ex) {
        FaroHelper.faro.api.pushEvent('Request failed', { url });
        FaroHelper.faro.api.pushError(ex);
        span.end();
        throw ex;
      }
    });
  }

  try {
    const response = await instance({
      method,
      url,
      params,
      data,
      validateStatus,
    });

    FaroHelper.faro?.api.pushEvent('Request completed', { url });
    return response.data as RT;
  } catch (ex) {
    FaroHelper.faro?.api.pushEvent('Request failed', { url });
    FaroHelper.faro?.api.pushError(ex);
    throw ex;
  }
};
