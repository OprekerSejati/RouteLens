package engine

type Method string

const (
	GET    Method = "GET"
	POST   Method = "POST"
	PUT    Method = "PUT"
	DELETE Method = "DELETE"
)

type PathType string

const (
	PathExact  PathType = "exact"
	PathPrefix PathType = "prefix"
	PathRegex  PathType = "regex"
)

type HeaderType string

const (
	HeaderExact   HeaderType = "exact"
	HeaderRegex   HeaderType = "regex"
	HeaderPresence HeaderType = "presence"
)

type BackendType string

const (
	BackendSingle   BackendType = "single"
	BackendWeighted BackendType = "weighted"
)

type FilterType string

const (
	FilterAuth      FilterType = "auth"
	FilterRateLimit FilterType = "rate_limit"
	FilterRewrite   FilterType = "rewrite"
	FilterHeaderMod FilterType = "header_mod"
)

type Protocol string

const (
	HTTP  Protocol = "HTTP"
	HTTPS Protocol = "HTTPS"
)

type Request struct {
	Method   Method            `json:"method"`
	Host     string            `json:"host"`
	Path     string            `json:"path"`
	Headers  map[string]string `json:"headers"`
	Port     int               `json:"port"`
	Protocol Protocol          `json:"protocol"`
}

type Listener struct {
	Name      string   `json:"name"`
	Port      int      `json:"port"`
	Protocol  Protocol `json:"protocol"`
	Hostnames []string `json:"hostnames"`
}

type VirtualHost struct {
	Name    string   `json:"name"`
	Domains []string `json:"domains"`
	Routes  []string `json:"routes"`
}

type PathMatch struct {
	Type  PathType `json:"type"`
	Value string   `json:"value"`
}

type HeaderMatch struct {
	Name  string     `json:"name"`
	Type  HeaderType `json:"type"`
	Value string     `json:"value"`
}

type Backend struct {
	Type     BackendType  `json:"type"`
	Clusters []ClusterRef `json:"clusters"`
}

type ClusterRef struct {
	Name   string `json:"name"`
	Weight int    `json:"weight,omitempty"`
}

type Route struct {
	ID        string         `json:"id"`
	Priority  int            `json:"priority"`
	CreatedAt int64          `json:"createdAt"`
	Match     RouteMatch     `json:"match"`
	Filters   []string       `json:"filters"`
	Backend   Backend        `json:"backend"`
}

type RouteMatch struct {
	Path    PathMatch     `json:"path"`
	Method  []Method      `json:"method"`
	Headers []HeaderMatch `json:"headers"`
}

type Filter struct {
	ID     string     `json:"id"`
	Type   FilterType `json:"type"`
	Config map[string]any `json:"config"`
}

type Cluster struct {
	Name      string   `json:"name"`
	Endpoints []string `json:"endpoints"`
}

type Config struct {
	Listeners    []Listener    `json:"listeners" yaml:"listeners"`
	VirtualHosts []VirtualHost `json:"virtualHosts" yaml:"virtualHosts"`
	Routes       []Route       `json:"routes" yaml:"routes"`
	Filters      []Filter      `json:"filters" yaml:"filters"`
	Clusters     []Cluster     `json:"clusters" yaml:"clusters"`
}

type TraceStep struct {
	Step   string `json:"step"`
	Result string `json:"result"`
	Reason string `json:"reason"`
}

type NegativeTrace struct {
	Route  string `json:"route"`
	Reason string `json:"reason"`
}

type Mutation struct {
	Type   string `json:"type"`
	Before string `json:"before"`
	After  string `json:"after"`
}

type Warning struct {
	Type   string   `json:"type"`
	Routes []string `json:"routes,omitempty"`
	Detail string   `json:"detail,omitempty"`
}

type EngineError struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type EngineResult struct {
	Final        *FinalResult   `json:"final,omitempty"`
	Trace        []TraceStep    `json:"trace"`
	Mutations    []Mutation     `json:"mutations"`
	Rejected     bool           `json:"rejected"`
	RejectStatus int            `json:"rejectStatus,omitempty"`
	Warnings     []Warning      `json:"warnings"`
	Errors       []EngineError  `json:"errors"`
	NegativeTrace []NegativeTrace `json:"negativeTrace"`
}

type FinalResult struct {
	Route    string `json:"route"`
	Cluster  string `json:"cluster"`
	Endpoint string `json:"endpoint"`
}
