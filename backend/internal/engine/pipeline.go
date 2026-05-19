package engine

type Pipeline struct {
	State *EndpointState
}

func NewPipeline() *Pipeline {
	return &Pipeline{
		State: &EndpointState{
			RRIndex: make(map[string]int),
		},
	}
}

func (p *Pipeline) Execute(req *Request, config *Config) *EngineResult {
	result := &EngineResult{
		Trace:        []TraceStep{},
		Mutations:    []Mutation{},
		Warnings:     []Warning{},
		Errors:       []EngineError{},
		NegativeTrace: []NegativeTrace{},
	}

	if err := Normalize(req); err != nil {
		result.Errors = append(result.Errors, *err)
		result.Trace = append(result.Trace, TraceStep{
			Step:   "normalize",
			Result: "failed",
			Reason: err.Message,
		})
		return result
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "normalize",
		Result: "passed",
		Reason: "request normalized successfully",
	})

	listener, err := matchListener(req, config)
	if err != nil {
		result.Errors = append(result.Errors, *err)
		result.Trace = append(result.Trace, TraceStep{
			Step:   "listener_match",
			Result: "failed",
			Reason: err.Message,
		})
		return result
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "listener_match",
		Result: "matched",
		Reason: "listener " + listener.Name + " matched on port " + itoa(listener.Port),
	})

	vh, err := matchVirtualHost(req, config)
	if err != nil {
		result.Errors = append(result.Errors, *err)
		result.Trace = append(result.Trace, TraceStep{
			Step:   "virtual_host_match",
			Result: "failed",
			Reason: err.Message,
		})
		return result
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "virtual_host_match",
		Result: "matched",
		Reason: "virtual host " + vh.Name + " matched domain " + req.Host,
	})

	candidates, negative := collectCandidateRoutes(req, vh, config)
	result.NegativeTrace = negative

	if len(candidates) == 0 {
		result.Trace = append(result.Trace, TraceStep{
			Step:   "route_match",
			Result: "failed",
			Reason: "no routes matched",
		})
		result.Errors = append(result.Errors, EngineError{
			Type:    "NO_ROUTE",
			Message: "no route matched for the request",
		})
		return result
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "route_match",
		Result: "matched",
		Reason: itoa(len(candidates)) + " candidate routes found",
	})

	selected, warning := rankAndSelect(candidates)
	if selected == nil {
		result.Errors = append(result.Errors, EngineError{
			Type:    "NO_ROUTE",
			Message: "no route selected after ranking",
		})
		return result
	}
	if warning != nil {
		result.Warnings = append(result.Warnings, *warning)
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "route_select",
		Result: "selected",
		Reason: "route " + selected.ID + " selected",
	})

	result.Trace = append(result.Trace, TraceStep{
		Step:   "filter_execution",
		Result: "started",
		Reason: "executing filter chain for route " + selected.ID,
	})

	executeFilters(selected, req, config, result)
	if result.Rejected {
		return result
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "filter_execution",
		Result: "completed",
		Reason: "all filters passed",
	})

	clusterName, err := resolveBackend(selected, req, config)
	if err != nil {
		result.Errors = append(result.Errors, *err)
		result.Trace = append(result.Trace, TraceStep{
			Step:   "backend_resolve",
			Result: "failed",
			Reason: err.Message,
		})
		return result
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "backend_resolve",
		Result: "resolved",
		Reason: "backend cluster: " + clusterName,
	})

	endpoint, err := selectEndpoint(clusterName, config, p.State)
	if err != nil {
		result.Errors = append(result.Errors, *err)
		result.Trace = append(result.Trace, TraceStep{
			Step:   "endpoint_select",
			Result: "failed",
			Reason: err.Message,
		})
		return result
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "endpoint_select",
		Result: "selected",
		Reason: "endpoint: " + endpoint,
	})

	result.Final = &FinalResult{
		Route:    selected.ID,
		Cluster:  clusterName,
		Endpoint: endpoint,
	}

	result.Trace = append(result.Trace, TraceStep{
		Step:   "complete",
		Result: "success",
		Reason: "request processed successfully",
	})

	return result
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	neg := false
	if n < 0 {
		neg = true
		n = -n
	}
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}
