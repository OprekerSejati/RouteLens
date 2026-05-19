package engine

import (
	"sort"
)

func rankAndSelect(routes []*Route) (*Route, *Warning) {
	if len(routes) == 0 {
		return nil, nil
	}

	sort.Slice(routes, func(i, j int) bool {
		return betterRoute(routes[i], routes[j])
	})

	if len(routes) > 1 {
		top := routes[0]
		next := routes[1]
		if routeEquality(top, next) {
			return top, &Warning{
				Type:   "AMBIGUOUS_ROUTE",
				Routes: []string{top.ID, next.ID},
			}
		}
	}

	return routes[0], nil
}

func betterRoute(a, b *Route) bool {
	aSpec := pathSpecificity(a.Match.Path)
	bSpec := pathSpecificity(b.Match.Path)
	if aSpec != bSpec {
		return aSpec > bSpec
	}

	if a.Match.Path.Value != b.Match.Path.Value {
		return len(a.Match.Path.Value) > len(b.Match.Path.Value)
	}

	if len(a.Match.Headers) != len(b.Match.Headers) {
		return len(a.Match.Headers) > len(b.Match.Headers)
	}

	if len(a.Match.Method) != len(b.Match.Method) {
		return len(a.Match.Method) < len(b.Match.Method)
	}

	if a.Priority != b.Priority {
		return a.Priority > b.Priority
	}

	return a.CreatedAt < b.CreatedAt
}

func pathSpecificity(p PathMatch) int {
	switch p.Type {
	case PathExact:
		return 3
	case PathPrefix:
		return 2
	case PathRegex:
		return 1
	default:
		return 0
	}
}

func routeEquality(a, b *Route) bool {
	return pathSpecificity(a.Match.Path) == pathSpecificity(b.Match.Path) &&
		len(a.Match.Path.Value) == len(b.Match.Path.Value) &&
		len(a.Match.Headers) == len(b.Match.Headers) &&
		len(a.Match.Method) == len(b.Match.Method) &&
		a.Priority == b.Priority &&
		a.CreatedAt == b.CreatedAt
}
