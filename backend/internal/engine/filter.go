package engine

import (
	"fmt"
	"strings"
)

func executeFilters(route *Route, req *Request, config *Config, result *EngineResult) {
	for _, filterID := range route.Filters {
		f := findFilter(filterID, config)
		if f == nil {
			continue
		}

		switch f.Type {
		case FilterAuth:
			executeAuth(f, result)
		case FilterRewrite:
			executeRewrite(f, req, result)
		case FilterHeaderMod:
			executeHeaderMod(f, req, result)
		case FilterRateLimit:
			executeRateLimit(f, result)
		}

		if result.Rejected {
			return
		}
	}
}

func findFilter(id string, config *Config) *Filter {
	for i := range config.Filters {
		if config.Filters[i].ID == id {
			return &config.Filters[i]
		}
	}
	return nil
}

func executeAuth(f *Filter, result *EngineResult) {
	reject, _ := f.Config["reject"].(bool)
	if reject {
		status := 401
		if s, ok := f.Config["status"].(float64); ok {
			status = int(s)
		}
		result.Rejected = true
		result.RejectStatus = status
		result.Trace = append(result.Trace, TraceStep{
			Step:   "filter_auth",
			Result: "rejected",
			Reason: fmt.Sprintf("auth filter rejected with status %d", status),
		})
		return
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "filter_auth",
		Result: "passed",
		Reason: "auth filter passed",
	})
}

func executeRewrite(f *Filter, req *Request, result *EngineResult) {
	from, _ := f.Config["from"].(string)
	to, _ := f.Config["to"].(string)
	if from == "" || to == "" {
		return
	}

	before := req.Path
	req.Path = strings.Replace(req.Path, from, to, 1)
	result.Mutations = append(result.Mutations, Mutation{
		Type:   "rewrite",
		Before: before,
		After:  req.Path,
	})
	result.Trace = append(result.Trace, TraceStep{
		Step:   "filter_rewrite",
		Result: "modified",
		Reason: fmt.Sprintf("rewrote %s → %s", from, to),
	})
}

func executeHeaderMod(f *Filter, req *Request, result *EngineResult) {
	action, _ := f.Config["action"].(string)
	key, _ := f.Config["key"].(string)
	value, _ := f.Config["value"].(string)

	key = strings.ToLower(key)
	before := req.Headers[key]

	switch action {
	case "add", "set":
		req.Headers[key] = value
	case "remove":
		delete(req.Headers, key)
	}

	result.Mutations = append(result.Mutations, Mutation{
		Type:   "header_mod",
		Before: before,
		After:  value,
	})
	result.Trace = append(result.Trace, TraceStep{
		Step:   "filter_header_mod",
		Result: "modified",
		Reason: fmt.Sprintf("%s header %s", action, key),
	})
}

func executeRateLimit(f *Filter, result *EngineResult) {
	limited, _ := f.Config["limited"].(bool)
	if limited {
		result.Rejected = true
		result.RejectStatus = 429
		result.Trace = append(result.Trace, TraceStep{
			Step:   "filter_rate_limit",
			Result: "rejected",
			Reason: "rate limit exceeded (429)",
		})
		return
	}
	result.Trace = append(result.Trace, TraceStep{
		Step:   "filter_rate_limit",
		Result: "passed",
		Reason: "rate limit not exceeded",
	})
}

func resolveBackend(route *Route, req *Request, config *Config) (string, *EngineError) {
	if len(route.Backend.Clusters) == 0 {
		return "", &EngineError{
			Type:    "NO_CLUSTER",
			Message: "no clusters defined for route: " + route.ID,
		}
	}

	if route.Backend.Type == BackendSingle {
		return route.Backend.Clusters[0].Name, nil
	}

	return resolveWeighted(route, req)
}

func resolveWeighted(route *Route, req *Request) (string, *EngineError) {
	totalWeight := 0
	for _, c := range route.Backend.Clusters {
		totalWeight += c.Weight
	}
	if totalWeight == 0 {
		return route.Backend.Clusters[0].Name, nil
	}

	h := deterministicHash(req.Host + req.Path)
	bucket := h % uint64(totalWeight)

	cumulative := 0
	for _, c := range route.Backend.Clusters {
		cumulative += c.Weight
		if bucket < uint64(cumulative) {
			return c.Name, nil
		}
	}

	return route.Backend.Clusters[0].Name, nil
}

func deterministicHash(s string) uint64 {
	var h uint64 = 14695981039346656037
	for i := 0; i < len(s); i++ {
		h ^= uint64(s[i])
		h *= 1099511628211
	}
	return h
}

func selectEndpoint(clusterName string, config *Config, state *EndpointState) (string, *EngineError) {
	cluster := findCluster(clusterName, config)
	if cluster == nil {
		return "", &EngineError{
			Type:    "NO_CLUSTER",
			Message: "cluster not found: " + clusterName,
		}
	}
	if len(cluster.Endpoints) == 0 {
		return "", &EngineError{
			Type:    "NO_ENDPOINT",
			Message: "no endpoints in cluster: " + clusterName,
		}
	}

	if state.RRIndex == nil {
		state.RRIndex = make(map[string]int)
	}

	idx := state.RRIndex[clusterName]
	endpoint := cluster.Endpoints[idx%len(cluster.Endpoints)]
	state.RRIndex[clusterName] = idx + 1

	return endpoint, nil
}

func findCluster(name string, config *Config) *Cluster {
	for i := range config.Clusters {
		if config.Clusters[i].Name == name {
			return &config.Clusters[i]
		}
	}
	return nil
}

type EndpointState struct {
	RRIndex map[string]int
}
