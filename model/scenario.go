package model

type TemplateEntry struct {
	ID       int64
	Name     string
	Template Template
}

type Template struct {
	UsersAdd           []string
	UsersKeep          []string
	UsersRemove        []string
	GroupMembersAdd    map[string]string
	GroupMembersKeep   map[string]string
	GroupMembersRemove map[string]string
}

type Finding struct {
	Value   int64
	Hidden  bool
	Message string
}

type Report struct {
	TeamID   int64
	HostID   int64
	Findings []Finding
}

type TeamSummary struct {
	ID   int64
	Name string
}

type Team struct {
	ID      int64
	Name    string
	POC     string
	Email   string
	Enabled bool
	Key     string
}

type Scenario struct {
	ID            int64
	Name          string
	Description   string
	Enabled       bool
	HostTemplates map[int64][]int64
}

type ScenarioLatestScore struct {
	TeamID    int64
	TeamName  string
	Timestamp int64
	Score     int64
}

type ScenarioScore struct {
	ScenarioID int64
	TeamID     int64
	HostID     int64
	Timestamp  int64
	Score      int64
}

type ScenarioTimeline struct {
	ScenarioID int64
	TeamID     int64
	HostID     int64
	Timestamps []int64
	Scores     []int64
}
