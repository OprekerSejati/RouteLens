package engine

import (
	"fmt"
	"strings"
)

type Conflict struct {
	Type    string   `json:"type"`
	Routes  []string `json:"routes,omitempty"`
	Message string   `json:"message"`
}

func DetectConflicts(config *Config) []Conflict {
	var conflicts []Conflict

	routeMap := make(map[string]*Route)
	for i := range config.Routes {
		routeMap[config.Routes[i].ID] = &config.Routes[i]
	}

	for i := 0; i < len(config.Routes); i++ {
		for j := i + 1; j < len(config.Routes); j++ {
			a, b := &config.Routes[i], &config.Routes[j]

			if routesOverlap(a, b) {
				conflicts = append(conflicts, Conflict{
					Type:    "AMBIGUOUS_ROUTE",
					Routes:  []string{a.ID, b.ID},
					Message: fmt.Sprintf("routes %s and %s have overlapping match conditions", a.ID, b.ID),
				})
			}

			if routesDuplicate(a, b) {
				conflicts = append(conflicts, Conflict{
					Type:    "DUPLICATE_MATCH",
					Routes:  []string{a.ID, b.ID},
					Message: fmt.Sprintf("routes %s and %s have identical match conditions", a.ID, b.ID),
				})
			}
		}
	}

	for i := range config.VirtualHosts {
		vh := &config.VirtualHosts[i]
		for _, routeID := range vh.Routes {
			if _, exists := routeMap[routeID]; !exists {
				conflicts = append(conflicts, Conflict{
					Type:    "UNREACHABLE_ROUTE",
					Routes:  []string{routeID},
					Message: fmt.Sprintf("route %s referenced by virtual host %s but not defined", routeID, vh.Name),
				})
			}
		}
	}

	for i := range config.Routes {
		r := &config.Routes[i]
		for _, filterID := range r.Filters {
			found := false
			for j := range config.Filters {
				if config.Filters[j].ID == filterID {
					found = true
					break
				}
			}
			if !found {
				conflicts = append(conflicts, Conflict{
					Type:    "UNREACHABLE_ROUTE",
					Routes:  []string{r.ID},
					Message: fmt.Sprintf("route %s references undefined filter %s", r.ID, filterID),
				})
			}
		}
	}

	return conflicts
}

func routesOverlap(a, b *Route) bool {
	if a.Match.Path.Type != b.Match.Path.Type {
		return false
	}

	pathOverlap := false
	switch a.Match.Path.Type {
	case PathExact:
		pathOverlap = a.Match.Path.Value == b.Match.Path.Value
	case PathPrefix:
		pathOverlap = strings.HasPrefix(a.Match.Path.Value, b.Match.Path.Value) ||
			strings.HasPrefix(b.Match.Path.Value, a.Match.Path.Value)
	case PathRegex:
		pathOverlap = a.Match.Path.Value == b.Match.Path.Value
	}

	if !pathOverlap {
		return false
	}

	if !methodsOverlap(a.Match.Method, b.Match.Method) {
		return false
	}

	if !headersOverlap(a.Match.Headers, b.Match.Headers) {
		return false
	}

	return true
}

func routesDuplicate(a, b *Route) bool {
	if a.Match.Path.Type != b.Match.Path.Type || a.Match.Path.Value != b.Match.Path.Value {
		return false
	}

	if len(a.Match.Method) != len(b.Match.Method) {
		return false
	}
	methodSet := make(map[Method]bool)
	for _, m := range a.Match.Method {
		methodSet[m] = true
	}
	for _, m := range b.Match.Method {
		if !methodSet[m] {
			return false
		}
	}

	if len(a.Match.Headers) != len(b.Match.Headers) {
		return false
	}
	for i := range a.Match.Headers {
		if a.Match.Headers[i] != b.Match.Headers[i] {
			return false
		}
	}

	return true
}

func methodsOverlap(a, b []Method) bool {
	if len(a) == 0 || len(b) == 0 {
		return true
	}
	set := make(map[Method]bool)
	for _, m := range a {
		set[m] = true
	}
	for _, m := range b {
		if set[m] {
			return true
		}
	}
	return false
}

func headersOverlap(a, b []HeaderMatch) bool {
	if len(a) == 0 || len(b) == 0 {
		return true
	}

	for _, ha := range a {
		for _, hb := range b {
			if ha.Name == hb.Name {
				return true
			}
		}
	}
	return true
}
