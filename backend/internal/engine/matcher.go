package engine

import (
	"regexp"
	"strings"
)

func matchListener(req *Request, config *Config) (*Listener, *EngineError) {
	for i := range config.Listeners {
		l := &config.Listeners[i]
		if req.Port == l.Port && req.Protocol == l.Protocol {
			return l, nil
		}
	}
	return nil, &EngineError{
		Type:    "NO_LISTENER",
		Message: "no listener matched for given port and protocol",
	}
}

func matchVirtualHost(req *Request, config *Config) (*VirtualHost, *EngineError) {
	var best *VirtualHost
	bestLen := -1

	for i := range config.VirtualHosts {
		vh := &config.VirtualHosts[i]
		for _, domain := range vh.Domains {
			if matchHost(req.Host, domain) {
				prefLen := len(domain)
				if prefLen > bestLen {
					best = vh
					bestLen = prefLen
				}
			}
		}
	}

	if best == nil {
		return nil, &EngineError{
			Type:    "NO_HOST_MATCH",
			Message: "no virtual host matched for host: " + req.Host,
		}
	}
	return best, nil
}

func matchHost(requestHost, domain string) bool {
	if strings.HasPrefix(domain, "*.") {
		suffix := domain[1:]
		return strings.HasSuffix(requestHost, suffix)
	}
	return requestHost == domain
}

func collectCandidateRoutes(req *Request, vh *VirtualHost, config *Config) ([]*Route, []NegativeTrace) {
	var candidates []*Route
	var negative []NegativeTrace

	for _, routeID := range vh.Routes {
		route := findRoute(routeID, config)
		if route == nil {
			continue
		}

		if matchRoute(req, route) {
			candidates = append(candidates, route)
		} else {
			reason := routeMatchFailureReason(req, route)
			negative = append(negative, NegativeTrace{
				Route:  route.ID,
				Reason: reason,
			})
		}
	}

	return candidates, negative
}

func findRoute(id string, config *Config) *Route {
	for i := range config.Routes {
		if config.Routes[i].ID == id {
			return &config.Routes[i]
		}
	}
	return nil
}

func matchRoute(req *Request, route *Route) bool {
	if !matchPath(req.Path, &route.Match.Path) {
		return false
	}
	if !matchMethod(req.Method, route.Match.Method) {
		return false
	}
	if !matchHeaders(req.Headers, route.Match.Headers) {
		return false
	}
	return true
}

func matchPath(requestPath string, pm *PathMatch) bool {
	switch pm.Type {
	case PathExact:
		return requestPath == pm.Value
	case PathPrefix:
		return strings.HasPrefix(requestPath, pm.Value)
	case PathRegex:
		matched, err := regexp.MatchString(pm.Value, requestPath)
		if err != nil {
			return false
		}
		return matched
	default:
		return false
	}
}

func matchMethod(requestMethod Method, methods []Method) bool {
	if len(methods) == 0 {
		return true
	}
	for _, m := range methods {
		if requestMethod == m {
			return true
		}
	}
	return false
}

func matchHeaders(requestHeaders map[string]string, headers []HeaderMatch) bool {
	if len(headers) == 0 {
		return true
	}
	for _, h := range headers {
		val, exists := requestHeaders[h.Name]
		switch h.Type {
		case HeaderExact:
			if !exists || val != h.Value {
				return false
			}
		case HeaderRegex:
			if !exists {
				return false
			}
			matched, err := regexp.MatchString(h.Value, val)
			if err != nil || !matched {
				return false
			}
		case HeaderPresence:
			if !exists {
				return false
			}
		}
	}
	return true
}

func routeMatchFailureReason(req *Request, route *Route) string {
	if !matchPath(req.Path, &route.Match.Path) {
		return "path mismatch"
	}
	if !matchMethod(req.Method, route.Match.Method) {
		return "method mismatch"
	}
	if !matchHeaders(req.Headers, route.Match.Headers) {
		return "header mismatch"
	}
	return "unknown"
}
