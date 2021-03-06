package model

import "github.com/dgrijalva/jwt-go"

// Action asdf
type Action struct {
	Type        ActionType
	Description string
	Command     string
	Args        []string
}

// Answer asdf
type Answer struct {
	Operator OperatorType
	Value    interface{}
	Points   int
}

// AnswerResult asdf
type AnswerResult struct {
	Description string
	Points      int
}

// AuditAnswerResults asdf
type AuditAnswerResults struct {
	ScenarioID     uint64
	TeamID         uint64
	HostToken      string
	Timestamp      int64
	CheckResultsID uint64
	Score          int
	AnswerResults  []AnswerResult
}

// AuditCheckResults asdf
type AuditCheckResults struct {
	ScenarioID         uint64
	HostToken          string
	Timestamp          int64
	CheckResults       []string
	ChecksLastModified string
}

// AuditQueueEntry asdf
type AuditQueueEntry struct {
	ID        uint64
	Body      AuditCheckResults
	Timestamp int64
	Source    string
}

// ClaimsAuth asdf
type ClaimsAuth struct {
	jwt.StandardClaims
	UserID uint64
	Roles  []Role
}

// ClaimsTeam asdf
type ClaimsTeam struct {
	jwt.StandardClaims
	TeamID uint64
}

// HostTokenRequest asdf
type HostTokenRequest struct {
	ScenarioID uint64
	Hostname   string
}

// HostTokenRegistration asdf
type HostTokenRegistration struct {
	HostToken string
	TeamKey   string
}

// LoginTeam asdf
type LoginTeam struct {
	TeamKey string
}

// LoginUser asdf
type LoginUser struct {
	Username string
	Password string
}

// Report asdf
type Report struct {
	Timestamp     int64
	AnswerResults []AnswerResult
}

// ReportTimeline asdf
type ReportTimeline struct {
	Timestamps []int64
	Scores     []int
}

// Scenario asdf
type Scenario struct {
	ID          uint64
	Name        string
	Description string
	Enabled     bool
}

// ScenarioHost asdf
type ScenarioHost struct {
	Answers []Answer
	Checks  []Action
	Config  []Action
}

// ScenarioScore asdf
type ScenarioScore struct {
	TeamID    uint64
	TeamName  string
	Hostname  string
	Score     int
	Timestamp int64
}

// ScenarioSummary asdf
type ScenarioSummary struct {
	ID      uint64
	Name    string
	Enabled bool
}

// Team asdf
type Team struct {
	ID      uint64
	Name    string
	POC     string
	Email   string
	Enabled bool
	Key     string
}

// TeamSummary asdf
type TeamSummary struct {
	ID      uint64
	Name    string
	Enabled bool
}

// User asdf
type User struct {
	ID       uint64
	Username string
	Password string
	Enabled  bool
	Email    string
}

// UserSummary asdf
type UserSummary struct {
	ID       uint64
	Username string
}
