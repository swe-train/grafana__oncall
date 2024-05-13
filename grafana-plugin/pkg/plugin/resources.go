package plugin

import (
	"encoding/json"
	"fmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"net/http"
	"strings"
)

type appInstanceSettingsJSONData struct {
	URL string `json:"backendUrl"`
}

type Settings struct {
	URL         string
	AccessToken string
	APIKey      string
}

// curl -X GET -H "Accept: application/json"  http://oncall:oncall@localhost:3000/api/plugins/grafana-oncall-app/resources/ping | jq

// handlePing is an example HTTP GET resource that returns a {"message": "ok"} JSON response.
func (a *App) handlePing(w http.ResponseWriter, req *http.Request) {
	w.Header().Add("Content-Type", "application/json")

	cfg := backend.GrafanaConfigFromContext(req.Context())
	saToken, err := cfg.PluginAppClientSecret()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	msg := fmt.Sprintf(`{"message":  "%s"}`, saToken)
	if _, err := w.Write([]byte(msg)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// handleEcho is an example HTTP POST resource that accepts a JSON with a "message" key and
// returns to the client whatever it is sent.
func (a *App) handleEcho(w http.ResponseWriter, req *http.Request) {
	if req.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Message string `json:"message"`
	}
	if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Add("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(body); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func LoadSettings(req *backend.CallResourceRequest) (Settings, error) {
	settings := Settings{}
	var appInstanceSettings appInstanceSettingsJSONData
	err := json.Unmarshal(req.PluginContext.AppInstanceSettings.JSONData, &appInstanceSettings)
	if err != nil {
		err = fmt.Errorf("LoadSettings: json.Unmarshal: %w", err)
		log.DefaultLogger.Error(err.Error())
		return settings, err
	}

	settings.AccessToken = strings.TrimSpace(req.PluginContext.AppInstanceSettings.DecryptedSecureJSONData["accessToken"])
	settings.APIKey = strings.TrimSpace(req.PluginContext.AppInstanceSettings.DecryptedSecureJSONData["apiKey"])
	settings.URL = appInstanceSettings.URL

	// Ensure that the settings.URL is always suffixed with a slash if needed.
	if !strings.HasSuffix(settings.URL, "/") {
		settings.URL = settings.URL + "/"
	}

	return settings, nil
}

func (a *App) handleOnCall(w http.ResponseWriter, req *http.Request) {
	log.DefaultLogger.Error("Forwarding proxy. The requested URL is: %s", req.URL.Path)
}

// registerRoutes takes a *http.ServeMux and registers some HTTP handlers.
func (a *App) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/ping", a.handlePing)
	mux.HandleFunc("/echo", a.handleEcho)
	mux.HandleFunc("/api/internal/v1/", a.handleOnCall)
}
