package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
	"strings"
)

type OnCallPluginSettingsJSONData struct {
	OnCallAPIURL string `json:"onCallApiUrl"`
	StackID      int    `json:"stackId,omitempty"`
	OrgID        int    `json:"orgId,omitempty"`
}

type XInstanceContextJSONData struct {
	StackId      string `json:"stack_id,omitempty"`
	OrgId        string `json:"org_id,omitempty"`
	GrafanaToken string `json:"grafana_token"`
}

type OnCallPluginSettings struct {
	OnCallAPIURL string
	StackID      int
	OrgID        int
	GrafanaToken string
	OnCallToken  string
	GrafanaURL   string
}

func OnCallSettingsFromContext(ctx context.Context) (OnCallPluginSettings, error) {
	pluginContext := httpadapter.PluginConfigFromContext(ctx)
	var settings OnCallPluginSettings
	err := json.Unmarshal(pluginContext.AppInstanceSettings.JSONData, &settings)
	if err != nil {
		err = fmt.Errorf("OnCallSettingsFromContext: json.Unmarshal: %w", err)
		log.DefaultLogger.Error(err.Error())
		return settings, err
	}

	settings.OnCallToken = strings.TrimSpace(pluginContext.AppInstanceSettings.DecryptedSecureJSONData["onCallApiToken"])

	cfg := backend.GrafanaConfigFromContext(ctx)
	settings.GrafanaURL, err = cfg.AppURL()
	if err != nil {
		return settings, err
	}

	if cfg.FeatureToggles().IsEnabled("externalServiceAccounts") {
		settings.GrafanaToken, err = cfg.PluginAppClientSecret()
		if err != nil {
			return settings, err
		}
	} else {
		settings.GrafanaToken = strings.TrimSpace(pluginContext.AppInstanceSettings.DecryptedSecureJSONData["grafanaToken"])
	}

	return settings, nil
}
