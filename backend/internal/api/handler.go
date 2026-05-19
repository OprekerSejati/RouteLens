package api

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/OprekerSejati/RouteLens/backend/internal/config"
	"github.com/OprekerSejati/RouteLens/backend/internal/engine"
)

type SimulateRequest struct {
	Request engine.Request `json:"request"`
	Config  string         `json:"config"`
}

type SimulateResponse struct {
	Result    *engine.EngineResult `json:"result"`
	Conflicts []engine.Conflict    `json:"conflicts,omitempty"`
}

type AnalyzeResponse struct {
	Conflicts []engine.Conflict `json:"conflicts,omitempty"`
	Valid     bool              `json:"valid"`
	Error     string            `json:"error,omitempty"`
}

type Handler struct {
	pipeline *engine.Pipeline
}

func NewHandler() *Handler {
	return &Handler{
		pipeline: engine.NewPipeline(),
	}
}

func (h *Handler) Simulate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "only POST allowed")
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "cannot read body")
		return
	}
	defer r.Body.Close()

	var req SimulateRequest
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}

	cfg, err := config.Parse([]byte(req.Config))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid config: "+err.Error())
		return
	}

	result := h.pipeline.Execute(&req.Request, cfg)
	conflicts := engine.DetectConflicts(cfg)
	for _, c := range conflicts {
		result.Warnings = append(result.Warnings, engine.Warning{
			Type:   c.Type,
			Routes: c.Routes,
			Detail: c.Message,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SimulateResponse{Result: result, Conflicts: conflicts})
}

func (h *Handler) Validate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "only POST allowed")
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "cannot read body")
		return
	}
	defer r.Body.Close()

	cfg, err := config.Parse(body)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(AnalyzeResponse{
			Valid: false,
			Error: err.Error(),
		})
		return
	}

	conflicts := engine.DetectConflicts(cfg)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AnalyzeResponse{
		Conflicts: conflicts,
		Valid:     len(conflicts) == 0,
	})
}

func (h *Handler) Analyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "only POST allowed")
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, "cannot read body")
		return
	}
	defer r.Body.Close()

	cfg, err := config.Parse(body)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(AnalyzeResponse{
			Valid: false,
			Error: err.Error(),
		})
		return
	}

	conflicts := engine.DetectConflicts(cfg)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AnalyzeResponse{
		Conflicts: conflicts,
		Valid:     len(conflicts) == 0,
	})
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
