package engine

import "fmt"

func (r *EngineResult) FormatTrace() string {
	output := ""
	for _, t := range r.Trace {
		output += fmt.Sprintf("%s: %s (%s)\n", t.Step, t.Result, t.Reason)
	}
	return output
}

func (r *EngineResult) HasError() bool {
	return len(r.Errors) > 0
}

func (r *EngineResult) ErrorSummary() string {
	if !r.HasError() {
		return "no errors"
	}
	out := ""
	for _, e := range r.Errors {
		out += fmt.Sprintf("[%s] %s\n", e.Type, e.Message)
	}
	return out
}
