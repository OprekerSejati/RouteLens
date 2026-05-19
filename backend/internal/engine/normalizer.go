package engine

import (
	"strings"
)

func Normalize(req *Request) *EngineError {
	req.Host = strings.ToLower(req.Host)

	path := req.Path
	path = strings.ReplaceAll(path, "//", "/")
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	req.Path = path

	normalizedHeaders := make(map[string]string, len(req.Headers))
	for k, v := range req.Headers {
		normalizedHeaders[strings.ToLower(k)] = v
	}
	req.Headers = normalizedHeaders

	if req.Host == "" || req.Path == "" {
		return &EngineError{
			Type:    "INVALID_REQUEST",
			Message: "host and path are required",
		}
	}

	return nil
}
