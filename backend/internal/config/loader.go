package config

import (
	"github.com/OprekerSejati/RouteLens/backend/internal/engine"
	"gopkg.in/yaml.v3"
)

func Parse(yamlData []byte) (*engine.Config, error) {
	var cfg engine.Config
	if err := yaml.Unmarshal(yamlData, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func MustParse(yamlData []byte) *engine.Config {
	cfg, err := Parse(yamlData)
	if err != nil {
		panic(err)
	}
	return cfg
}
