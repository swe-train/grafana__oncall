package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
	"io"
	"net/http"
	"net/url"
	"strconv"
)

type UserJSONData struct {
	UserID int `json:"UserId"`
}

func SetXInstanceContextHeader(settings OnCallPluginSettings, req *http.Request) error {
	xInstanceContext := XInstanceContextJSONData{
		StackId:      strconv.Itoa(settings.StackID),
		OrgId:        strconv.Itoa(settings.OrgID),
		GrafanaToken: settings.GrafanaToken,
	}
	xInstanceContextHeader, err := json.Marshal(xInstanceContext)
	if err != nil {
		return err
	}
	req.Header.Set("X-Instance-Context", string(xInstanceContextHeader))
	return nil
}

func SetAuthorizationHeader(settings OnCallPluginSettings, req *http.Request) {
	req.Header.Set("Authorization", settings.OnCallToken)
}

func SetUserHeader(ctx context.Context, _ *http.Request) {
	user := httpadapter.UserFromContext(ctx)
	log.DefaultLogger.Info(fmt.Sprintf("User %+v", user))
	// TODO: Get ID & permissions for user
}

func (a *App) handleOnCall(w http.ResponseWriter, req *http.Request) {
	proxyMethod := req.FormValue("method")
	if proxyMethod == "" {
		proxyMethod = req.Method
	}
	proxyBody := req.FormValue("body")
	var bodyReader io.Reader
	if proxyBody != "" {
		bodyReader = bytes.NewReader([]byte(proxyBody))
	}

	onCallPluginSettings, err := OnCallSettingsFromContext(req.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	log.DefaultLogger.Info(fmt.Sprintf("OnCallSettings %+v", onCallPluginSettings))

	reqURL, err := url.JoinPath(onCallPluginSettings.OnCallAPIURL, req.URL.Path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	proxyReq, err := http.NewRequest(proxyMethod, reqURL, bodyReader)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	proxyReq.Header = req.Header
	SetUserHeader(req.Context(), proxyReq)
	SetAuthorizationHeader(onCallPluginSettings, proxyReq)
	err = SetXInstanceContextHeader(onCallPluginSettings, proxyReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if proxyMethod == "POST" || proxyMethod == "PUT" {
		proxyReq.Header.Set("Content-Type", "application/json")
	}

	res, err := a.httpClient.Do(proxyReq)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer res.Body.Close()

	for name, values := range res.Header {
		for _, value := range values {
			w.Header().Add(name, value)
		}
	}
	w.WriteHeader(res.StatusCode)
	io.Copy(w, res.Body)
}

// registerRoutes takes a *http.ServeMux and registers some HTTP handlers.
func (a *App) registerRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/internal/v1/", a.handleOnCall)
}
