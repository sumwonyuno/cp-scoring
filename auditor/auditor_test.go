package auditor

import (
	"testing"

	"github.com/sumwonyuno/cp-scoring/model"
)

func checkFinding(t *testing.T, finding model.Finding, show bool, value int64, message string) {
	t.Log("---------------")
	t.Log(show)
	t.Log(finding.Show)
	t.Log(value)
	t.Log(finding.Value)
	t.Log(message)
	t.Log(finding.Message)
	if finding.Show != show {
		t.Fatal("Finding show does not match")
	}
	if finding.Value != value {
		t.Fatal("Finding value does not match")
	}
	if finding.Message != message {
		t.Fatal("Finding message does not match")
	}
}

func TestAuditUserPresent(t *testing.T) {
	// template account state not set
	templateUser := model.User{Name: "user1"}
	// account not present
	finding := auditUserObjectState(templateUser, false)
	checkFinding(t, finding, false, 0, "Unknown user account state: user1")
	// account present
	finding = auditUserObjectState(templateUser, true)
	checkFinding(t, finding, false, 0, "Unknown user account state: user1")

	// template account state add
	templateUser = model.User{Name: "user1", ObjectState: model.ObjectStateAdd}
	// account not present
	finding = auditUserObjectState(templateUser, false)
	checkFinding(t, finding, false, 0, "User not added: user1")
	// account present
	finding = auditUserObjectState(templateUser, true)
	checkFinding(t, finding, true, 1, "User added: user1")

	// template account state keep
	templateUser = model.User{Name: "user1", ObjectState: model.ObjectStateKeep}
	// account not present
	finding = auditUserObjectState(templateUser, false)
	checkFinding(t, finding, true, -1, "User not present: user1")
	// account present
	finding = auditUserObjectState(templateUser, true)
	checkFinding(t, finding, false, 0, "User present: user1")

	// template account state remove
	templateUser = model.User{Name: "user1", ObjectState: model.ObjectStateRemove}
	// account not present
	finding = auditUserObjectState(templateUser, false)
	checkFinding(t, finding, true, 1, "User removed: user1")
	// account present
	finding = auditUserObjectState(templateUser, true)
	checkFinding(t, finding, false, 0, "User not removed: user1")
}

func TestAuditUserActive(t *testing.T) {
	// template account active, user active
	templateUser := model.User{Name: "user1", AccountActive: true}
	user := model.User{Name: "user1", AccountActive: true}
	finding := auditUserAccountActive(templateUser, user)
	checkFinding(t, finding, true, 1, "User active: user1")

	// template account active, user not active
	templateUser = model.User{Name: "user1", AccountActive: true}
	user = model.User{Name: "user1", AccountActive: false}
	finding = auditUserAccountActive(templateUser, user)
	checkFinding(t, finding, true, -1, "User not active: user1")

	// template account not active, user active
	templateUser = model.User{Name: "user1", AccountActive: false}
	user = model.User{Name: "user1", AccountActive: true}
	finding = auditUserAccountActive(templateUser, user)
	checkFinding(t, finding, false, 0, "User active: user1")

	// template account not active, user not active
	templateUser = model.User{Name: "user1", AccountActive: false}
	user = model.User{Name: "user1", AccountActive: false}
	finding = auditUserAccountActive(templateUser, user)
	checkFinding(t, finding, true, 1, "User not active: user1")
}

func TestAuditUserExpire(t *testing.T) {
	// template account not expire, user not expire
	templateUser := model.User{Name: "user1", AccountExpires: false}
	user := model.User{Name: "user1", AccountExpires: false}
	finding := auditUserAccountExpire(templateUser, user)
	checkFinding(t, finding, false, 0, "User account does not expire: user1")

	// template account not expire, user expire
	templateUser = model.User{Name: "user1", AccountExpires: false}
	user = model.User{Name: "user1", AccountExpires: true}
	finding = auditUserAccountExpire(templateUser, user)
	checkFinding(t, finding, true, -1, "User account expires: user1")

	// template account expire, user not expire
	templateUser = model.User{Name: "user1", AccountExpires: true}
	user = model.User{Name: "user1", AccountExpires: false}
	finding = auditUserAccountExpire(templateUser, user)
	checkFinding(t, finding, false, 0, "User account does not expire: user1")

	// template account expire, user expire
	templateUser = model.User{Name: "user1", AccountExpires: true}
	user = model.User{Name: "user1", AccountExpires: true}
	finding = auditUserAccountExpire(templateUser, user)
	checkFinding(t, finding, true, 1, "User account expires: user1")
}

func TestAuditUserPasswordExpire(t *testing.T) {
	// temple password not expire, password not expire
	templateUser := model.User{Name: "user1", PasswordExpires: false}
	user := model.User{Name: "user1", PasswordExpires: false}
	finding := auditUserPasswordExpire(templateUser, user)
	checkFinding(t, finding, false, 0, "User password does not expire: user1")

	// temple password not expire, password expire
	templateUser = model.User{Name: "user1", PasswordExpires: false}
	user = model.User{Name: "user1", PasswordExpires: true}
	finding = auditUserPasswordExpire(templateUser, user)
	checkFinding(t, finding, true, -1, "User password expires: user1")

	// temple password expire, password not expire
	templateUser = model.User{Name: "user1", PasswordExpires: true}
	user = model.User{Name: "user1", PasswordExpires: false}
	finding = auditUserPasswordExpire(templateUser, user)
	checkFinding(t, finding, false, 0, "User password does not expire: user1")

	// temple password expire, password expire
	templateUser = model.User{Name: "user1", PasswordExpires: true}
	user = model.User{Name: "user1", PasswordExpires: true}
	finding = auditUserPasswordExpire(templateUser, user)
	checkFinding(t, finding, true, 1, "User password expires: user1")
}

func TestAuditUserPasswordChange(t *testing.T) {
	// password not changed
	templateUser := model.User{Name: "user1", PasswordLastSet: 10}
	user := model.User{Name: "user1", PasswordLastSet: 0}
	finding := auditUserPasswordChange(templateUser, user)
	checkFinding(t, finding, false, 0, "User password not changed: user1")

	// password changed
	templateUser = model.User{Name: "user1", PasswordLastSet: 10}
	user = model.User{Name: "user1", PasswordLastSet: 20}
	finding = auditUserPasswordChange(templateUser, user)
	checkFinding(t, finding, true, 1, "User password changed: user1")
}

func TestAuditUsers(t *testing.T) {
	state := model.State{}

	// no users in template, no users in state
	state.Users = make([]model.User, 0)
	template := model.Template{}
	findings := auditUsers(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}

	// no users in template, user in state
	state.Users = make([]model.User, 0)
	user := model.User{Name: "user1"}
	state.Users = append(state.Users, user)
	template = model.Template{}
	findings = auditUsers(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}

	// user to add in template, user in not state
	state.Users = make([]model.User, 0)
	template = model.Template{}
	template.Users = make([]model.User, 0)
	tUser := model.User{Name: "user1", ObjectState: model.ObjectStateAdd}
	template.Users = append(template.Users, tUser)
	findings = auditUsers(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "User not added: user1")

	// user to add in template, user in state
	state.Users = make([]model.User, 0)
	user = model.User{Name: "user1", AccountActive: true}
	state.Users = append(state.Users, user)
	template = model.Template{}
	template.Users = make([]model.User, 0)
	tUser = model.User{Name: "user1", ObjectState: model.ObjectStateAdd, AccountActive: true}
	template.Users = append(template.Users, tUser)
	findings = auditUsers(state, template)
	if len(findings) != 5 {
		t.Fatal("Expected 5 findings")
	}
	checkFinding(t, findings[0], true, 1, "User added: user1")
	checkFinding(t, findings[1], true, 1, "User active: user1")
	checkFinding(t, findings[2], false, 0, "User account does not expire: user1")
	checkFinding(t, findings[3], false, 0, "User password does not expire: user1")
	checkFinding(t, findings[4], false, 0, "User password not changed: user1")

	// user to keep in template, user in not state
	state.Users = make([]model.User, 0)
	template = model.Template{}
	template.Users = make([]model.User, 0)
	tUser = model.User{Name: "user1", ObjectState: model.ObjectStateKeep}
	template.Users = append(template.Users, tUser)
	findings = auditUsers(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, -1, "User not present: user1")

	// user to keep in template, user in state
	state.Users = make([]model.User, 0)
	user = model.User{Name: "user1", AccountActive: true}
	state.Users = append(state.Users, user)
	template = model.Template{}
	template.Users = make([]model.User, 0)
	tUser = model.User{Name: "user1", ObjectState: model.ObjectStateKeep, AccountActive: true}
	template.Users = append(template.Users, tUser)
	findings = auditUsers(state, template)
	if len(findings) != 5 {
		t.Fatal("Expected 5 findings")
	}
	// don't give indication that user should be kept
	checkFinding(t, findings[0], false, 0, "User present: user1")
	checkFinding(t, findings[1], false, 0, "User active: user1")
	// these are OK to show if user are kept
	checkFinding(t, findings[2], false, 0, "User account does not expire: user1")
	checkFinding(t, findings[3], false, 0, "User password does not expire: user1")
	checkFinding(t, findings[4], false, 0, "User password not changed: user1")

	// user to remove in template, user in not state
	state.Users = make([]model.User, 0)
	template = model.Template{}
	template.Users = make([]model.User, 0)
	tUser = model.User{Name: "user1", ObjectState: model.ObjectStateRemove}
	template.Users = append(template.Users, tUser)
	findings = auditUsers(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "User removed: user1")

	// user to remove in template, user in state
	state.Users = make([]model.User, 0)
	user = model.User{Name: "user1", AccountActive: true}
	state.Users = append(state.Users, user)
	template = model.Template{}
	template.Users = make([]model.User, 0)
	tUser = model.User{Name: "user1", ObjectState: model.ObjectStateRemove, AccountActive: true}
	template.Users = append(template.Users, tUser)
	findings = auditUsers(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "User not removed: user1")
}

func TestAuditSoftwareState(t *testing.T) {
	state := model.State{}
	empty := make([]model.Software, 0)
	notEmpty := append(empty, model.Software{Name: "sw", Version: "1.0.0"})

	// unknown software state, software not in state
	templateSoftware := model.Software{Name: "sw", Version: "1.0.0"}
	state.Software = empty
	finding := auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Unknown software state: sw, 1.0.0")
	// unknown software state, software in state
	state.Software = notEmpty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Unknown software state: sw, 1.0.0")
	// unknown software state, software different name
	templateSoftware = model.Software{Name: "ws", Version: "1.0.0"}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Unknown software state: ws, 1.0.0")
	// unknown software state, software different version
	templateSoftware = model.Software{Name: "sw", Version: "1.0.1"}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Unknown software state: sw, 1.0.1")

	// template software to add, software not in state
	templateSoftware = model.Software{Name: "sw", Version: "1.0.0", ObjectState: model.ObjectStateAdd}
	state.Software = empty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Software not added: sw, 1.0.0")
	// template software to add, software in state
	state.Software = notEmpty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, 1, "Software added: sw, 1.0.0")
	// template software to add, software different name
	templateSoftware = model.Software{Name: "ws", Version: "1.0.0", ObjectState: model.ObjectStateAdd}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Software not added: ws, 1.0.0")
	// template software to add, software different version
	templateSoftware = model.Software{Name: "sw", Version: "1.0.1", ObjectState: model.ObjectStateAdd}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Software not added: sw, 1.0.1")

	// template software to keep, software not in state
	templateSoftware = model.Software{Name: "sw", Version: "1.0.0", ObjectState: model.ObjectStateKeep}
	state.Software = empty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, -1, "Software not found: sw, 1.0.0")
	// template software to keep, software in state
	state.Software = notEmpty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Software found: sw, 1.0.0")
	// template software to keep, software different name
	templateSoftware = model.Software{Name: "ws", Version: "1.0.0", ObjectState: model.ObjectStateKeep}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, -1, "Software not found: ws, 1.0.0")
	// template software to keep, software different version
	templateSoftware = model.Software{Name: "sw", Version: "1.0.1", ObjectState: model.ObjectStateKeep}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, -1, "Software not found: sw, 1.0.1")

	// template software to remove, software not in state
	templateSoftware = model.Software{Name: "sw", Version: "1.0.0", ObjectState: model.ObjectStateRemove}
	state.Software = empty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, 1, "Software removed: sw, 1.0.0")
	// template software to remove, software in state
	state.Software = notEmpty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Software not removed: sw, 1.0.0")
	// template software to remove, software different name
	templateSoftware = model.Software{Name: "ws", Version: "1.0.0", ObjectState: model.ObjectStateRemove}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, 1, "Software removed: ws, 1.0.0")
	// template software to remove, software different version
	templateSoftware = model.Software{Name: "sw", Version: "1.0.1", ObjectState: model.ObjectStateRemove}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, 1, "Software removed: sw, 1.0.1")
}

func TestAuditSoftwareStateNameOnly(t *testing.T) {
	state := model.State{}
	empty := make([]model.Software, 0)
	notEmpty := append(empty, model.Software{Name: "sw", Version: "1.0.0"})

	// unknown software state, software not in state
	templateSoftware := model.Software{Name: "sw"}
	state.Software = empty
	finding := auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Unknown software state: sw")
	// unknown software state, software in state
	state.Software = notEmpty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Unknown software state: sw")
	// unknown software state, software different name
	templateSoftware = model.Software{Name: "ws"}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Unknown software state: ws")

	// template software to add, software not in state
	templateSoftware = model.Software{Name: "sw", ObjectState: model.ObjectStateAdd}
	state.Software = empty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Software not added: sw")
	// template software to add, software in state
	state.Software = notEmpty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, 1, "Software added: sw")
	// template software to add, software different name
	templateSoftware = model.Software{Name: "ws", ObjectState: model.ObjectStateAdd}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Software not added: ws")

	// template software to keep, software not in state
	templateSoftware = model.Software{Name: "sw", ObjectState: model.ObjectStateKeep}
	state.Software = empty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, -1, "Software not found: sw")
	// template software to keep, software in state
	state.Software = notEmpty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Software found: sw")
	// template software to keep, software different name
	templateSoftware = model.Software{Name: "ws", ObjectState: model.ObjectStateKeep}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, -1, "Software not found: ws")

	// template software to remove, software not in state
	templateSoftware = model.Software{Name: "sw", ObjectState: model.ObjectStateRemove}
	state.Software = empty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, 1, "Software removed: sw")
	// template software to remove, software in state
	state.Software = notEmpty
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, false, 0, "Software not removed: sw")
	// template software to remove, software different name
	templateSoftware = model.Software{Name: "ws", ObjectState: model.ObjectStateRemove}
	finding = auditSoftwareState(templateSoftware, state)
	checkFinding(t, finding, true, 1, "Software removed: ws")
}

func TestAuditSoftware(t *testing.T) {
	state := model.State{}
	sw := model.Software{Name: "sw", Version: "1.0.0"}

	// no software in template
	template := model.Template{}
	// software not in state
	state.Software = make([]model.Software, 0)
	findings := auditSoftware(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}
	// software in state
	state.Software = append(make([]model.Software, 0), sw)
	findings = auditSoftware(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}

	// template software to add
	template = model.Template{}
	templateSw := model.Software{Name: "sw", Version: "1.0.0", ObjectState: model.ObjectStateAdd}
	template.Software = append(make([]model.Software, 0), templateSw)
	// software not in state
	state.Software = make([]model.Software, 0)
	findings = auditSoftware(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Software not added: sw, 1.0.0")
	// template software to add, software in state
	state.Software = append(make([]model.Software, 0), sw)
	findings = auditSoftware(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "Software added: sw, 1.0.0")

	// template software to keep
	template = model.Template{}
	templateSw = model.Software{Name: "sw", Version: "1.0.0", ObjectState: model.ObjectStateKeep}
	template.Software = append(make([]model.Software, 0), templateSw)
	// software not in state
	state.Software = make([]model.Software, 0)
	findings = auditSoftware(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, -1, "Software not found: sw, 1.0.0")
	// software in state
	state.Software = append(make([]model.Software, 0), sw)
	findings = auditSoftware(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Software found: sw, 1.0.0")

	// template software to remove
	template = model.Template{}
	templateSw = model.Software{Name: "sw", Version: "1.0.0", ObjectState: model.ObjectStateRemove}
	template.Software = append(make([]model.Software, 0), templateSw)
	// software not in state
	state.Software = make([]model.Software, 0)
	findings = auditSoftware(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "Software removed: sw, 1.0.0")
	// software in state
	state.Software = append(make([]model.Software, 0), sw)
	findings = auditSoftware(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Software not removed: sw, 1.0.0")
}

func TestCompareNetworkConnection(t *testing.T) {
	templateConn := model.NetworkConnection{}
	conn := model.NetworkConnection{}
	if !compareNetworkConnection(templateConn, conn) {
		t.Fatal("Expected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP"}
	conn = model.NetworkConnection{}
	if compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP"}
	conn = model.NetworkConnection{Protocol: "TCP"}
	if !compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1"}
	conn = model.NetworkConnection{Protocol: "TCP"}
	if compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1"}
	conn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1"}
	if !compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525"}
	conn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1"}
	if compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525"}
	conn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525"}
	if !compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1"}
	conn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525"}
	if compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1"}
	conn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1"}
	if !compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1", RemotePort: "443"}
	conn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1"}
	if compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}

	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1", RemotePort: "443"}
	conn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1", RemotePort: "443"}
	if !compareNetworkConnection(templateConn, conn) {
		t.Fatal("Unexpected network connection matched")
	}
}
func TestAuditNetworkConnectionObjectState(t *testing.T) {
	state := model.State{}
	empty := make([]model.NetworkConnection, 0)
	notEmpty := append(empty, model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1", RemotePort: "443"})

	// unknown conn
	templateConn := model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1", RemotePort: "443"}
	// conn not in state
	state.NetworkConnections = empty
	finding := auditNetworkConnectionObjectState(templateConn, state)
	checkFinding(t, finding, false, 0, "Unknown network connection state: TCP 127.0.0.1:52525 192.168.1.1:443")
	// conn in state
	state.NetworkConnections = notEmpty
	finding = auditNetworkConnectionObjectState(templateConn, state)
	checkFinding(t, finding, false, 0, "Unknown network connection state: TCP 127.0.0.1:52525 192.168.1.1:443")

	// template conn add
	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1", RemotePort: "443", ObjectState: model.ObjectStateAdd}
	// conn not in state
	state.NetworkConnections = empty
	finding = auditNetworkConnectionObjectState(templateConn, state)
	checkFinding(t, finding, false, 0, "Network connection not added: TCP 127.0.0.1:52525 192.168.1.1:443")
	// conn in state
	state.NetworkConnections = notEmpty
	finding = auditNetworkConnectionObjectState(templateConn, state)
	checkFinding(t, finding, true, 1, "Network connection added: TCP 127.0.0.1:52525 192.168.1.1:443")

	// template conn keep
	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1", RemotePort: "443", ObjectState: model.ObjectStateKeep}
	// conn not in state
	state.NetworkConnections = empty
	finding = auditNetworkConnectionObjectState(templateConn, state)
	checkFinding(t, finding, true, -1, "Network connection not found: TCP 127.0.0.1:52525 192.168.1.1:443")
	// conn in state
	state.NetworkConnections = notEmpty
	finding = auditNetworkConnectionObjectState(templateConn, state)
	checkFinding(t, finding, false, 0, "Network connection found: TCP 127.0.0.1:52525 192.168.1.1:443")

	// template conn remove
	templateConn = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "52525", RemoteAddress: "192.168.1.1", RemotePort: "443", ObjectState: model.ObjectStateRemove}
	// conn not in state
	state.NetworkConnections = empty
	finding = auditNetworkConnectionObjectState(templateConn, state)
	checkFinding(t, finding, true, 1, "Network connection removed: TCP 127.0.0.1:52525 192.168.1.1:443")
	// conn in state
	state.NetworkConnections = notEmpty
	finding = auditNetworkConnectionObjectState(templateConn, state)
	checkFinding(t, finding, false, 0, "Network connection not removed: TCP 127.0.0.1:52525 192.168.1.1:443")
}

func TestAuditNetworkConnection(t *testing.T) {
	state := model.State{}
	nc := model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "8443"}

	// no network connection in template
	template := model.Template{}
	// network connection not in state
	state.NetworkConnections = make([]model.NetworkConnection, 0)
	findings := auditNetworkConnections(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}
	// network connection in state
	state.NetworkConnections = append(make([]model.NetworkConnection, 0), nc)
	findings = auditNetworkConnections(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}

	// network connection to add in template
	template = model.Template{}
	templateNC := model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "8443", ObjectState: model.ObjectStateAdd}
	template.NetworkConns = append(make([]model.NetworkConnection, 0), templateNC)
	// network connection not in state
	state.NetworkConnections = make([]model.NetworkConnection, 0)
	findings = auditNetworkConnections(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Network connection not added: TCP 127.0.0.1:8443 :")
	// network connection in state
	state.NetworkConnections = append(make([]model.NetworkConnection, 0), nc)
	findings = auditNetworkConnections(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "Network connection added: TCP 127.0.0.1:8443 :")

	// network connection to keep in template
	template = model.Template{}
	templateNC = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "8443", ObjectState: model.ObjectStateKeep}
	template.NetworkConns = append(make([]model.NetworkConnection, 0), templateNC)
	// network connection not in state
	state.NetworkConnections = make([]model.NetworkConnection, 0)
	findings = auditNetworkConnections(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, -1, "Network connection not found: TCP 127.0.0.1:8443 :")
	// network connection in state
	state.NetworkConnections = append(make([]model.NetworkConnection, 0), nc)
	findings = auditNetworkConnections(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Network connection found: TCP 127.0.0.1:8443 :")

	// network connection to remove in template
	template = model.Template{}
	templateNC = model.NetworkConnection{Protocol: "TCP", LocalAddress: "127.0.0.1", LocalPort: "8443", ObjectState: model.ObjectStateRemove}
	template.NetworkConns = append(make([]model.NetworkConnection, 0), templateNC)
	// network connection not in state
	state.NetworkConnections = make([]model.NetworkConnection, 0)
	findings = auditNetworkConnections(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "Network connection removed: TCP 127.0.0.1:8443 :")
	// network connection in state
	state.NetworkConnections = append(make([]model.NetworkConnection, 0), nc)
	findings = auditNetworkConnections(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Network connection not removed: TCP 127.0.0.1:8443 :")
}
func TestAuditProcessState(t *testing.T) {
	state := model.State{}
	empty := make([]model.Process, 0)
	notEmpty := append(empty, model.Process{CommandLine: "/bin/sh"})

	// unknown process state, process not in state
	templateProcess := model.Process{CommandLine: "/bin/sh"}
	state.Processes = empty
	finding := auditProcessState(templateProcess, state)
	checkFinding(t, finding, false, 0, "Unknown process state: /bin/sh")
	// unknown process state, process in state
	state.Processes = notEmpty
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, false, 0, "Unknown process state: /bin/sh")
	// unknown process state, process different name
	templateProcess = model.Process{CommandLine: "/bin/bash"}
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, false, 0, "Unknown process state: /bin/bash")

	// template process to add, process not in state
	templateProcess = model.Process{CommandLine: "/bin/sh", ObjectState: model.ObjectStateAdd}
	state.Processes = empty
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, false, 0, "Process not added: /bin/sh")
	// template process to add, process in state
	state.Processes = notEmpty
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, true, 1, "Process added: /bin/sh")
	// template process to add, process different name
	templateProcess = model.Process{CommandLine: "/bin/bash", ObjectState: model.ObjectStateAdd}
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, false, 0, "Process not added: /bin/bash")

	// template process to keep, process not in state
	templateProcess = model.Process{CommandLine: "/bin/sh", ObjectState: model.ObjectStateKeep}
	state.Processes = empty
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, true, -1, "Process not found: /bin/sh")
	// template process to keep, process in state
	state.Processes = notEmpty
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, false, 0, "Process found: /bin/sh")
	// template process to keep, process different name
	templateProcess = model.Process{CommandLine: "/bin/bash", ObjectState: model.ObjectStateKeep}
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, true, -1, "Process not found: /bin/bash")

	// template process to remove, process not in state
	templateProcess = model.Process{CommandLine: "/bin/sh", ObjectState: model.ObjectStateRemove}
	state.Processes = empty
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, true, 1, "Process removed: /bin/sh")
	// template process to remove, process in state
	state.Processes = notEmpty
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, false, 0, "Process not removed: /bin/sh")
	// template process to remove, process different name
	templateProcess = model.Process{CommandLine: "/bin/bash", ObjectState: model.ObjectStateRemove}
	finding = auditProcessState(templateProcess, state)
	checkFinding(t, finding, true, 1, "Process removed: /bin/bash")
}
func TestAuditProcesses(t *testing.T) {
	state := model.State{}
	process := model.Process{CommandLine: "/bin/sh"}
	empty := make([]model.Process, 0)
	notEmpty := append(empty, process)

	// no process in template
	template := model.Template{}
	// process not in state
	state.Processes = empty
	findings := auditProcesses(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}
	// process in state
	state.Processes = notEmpty
	findings = auditProcesses(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}

	// template process to add
	template = model.Template{}
	templateProcess := model.Process{CommandLine: "/bin/sh", ObjectState: model.ObjectStateAdd}
	template.Processes = append(make([]model.Process, 0), templateProcess)
	// process not in state
	state.Processes = empty
	findings = auditProcesses(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Process not added: /bin/sh")
	// template process to add, process in state
	state.Processes = notEmpty
	findings = auditProcesses(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "Process added: /bin/sh")

	// template process to keep
	template = model.Template{}
	templateProcess = model.Process{CommandLine: "/bin/sh", ObjectState: model.ObjectStateKeep}
	template.Processes = append(make([]model.Process, 0), templateProcess)
	// process not in state
	state.Processes = empty
	findings = auditProcesses(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, -1, "Process not found: /bin/sh")
	// process in state
	state.Processes = notEmpty
	findings = auditProcesses(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Process found: /bin/sh")

	// template process to remove
	template = model.Template{}
	templateProcess = model.Process{CommandLine: "/bin/sh", ObjectState: model.ObjectStateRemove}
	template.Processes = append(make([]model.Process, 0), templateProcess)
	// process not in state
	state.Processes = empty
	findings = auditProcesses(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "Process removed: /bin/sh")
	// process in state
	state.Processes = notEmpty
	findings = auditProcesses(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Process not removed: /bin/sh")
}

func TestAuditGroups(t *testing.T) {
	state := model.State{}
	state.Groups = make(map[string][]model.GroupMember)
	state.Groups["Users"] = append(make([]model.GroupMember, 0), model.GroupMember{Name: "user"})

	// no template members
	template := model.Template{}
	template.Groups = make(map[string][]model.GroupMember)
	findings := auditGroups(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}

	// empty template members
	template.Groups["Users"] = make([]model.GroupMember, 0)
	findings = auditGroups(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}

	// unknown state
	templateMember := model.GroupMember{Name: "user"}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Group Users, member unknown state: user")

	// group member to add
	// present
	templateMember = model.GroupMember{Name: "user", ObjectState: model.ObjectStateAdd}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "Group Users, member added: user")
	// not present
	templateMember = model.GroupMember{Name: "nobody", ObjectState: model.ObjectStateAdd}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Group Users, member not added: nobody")

	// group member to keep
	// present
	templateMember = model.GroupMember{Name: "user", ObjectState: model.ObjectStateKeep}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Group Users, member found: user")
	// not present
	templateMember = model.GroupMember{Name: "nobody", ObjectState: model.ObjectStateKeep}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, -1, "Group Users, member not found: nobody")

	// group member to remove
	// present
	templateMember = model.GroupMember{Name: "user", ObjectState: model.ObjectStateRemove}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Group Users, member not removed: user")
	// not present
	templateMember = model.GroupMember{Name: "nobody", ObjectState: model.ObjectStateRemove}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "Group Users, member removed: nobody")
}

func TestAuditGroupsNotPresent(t *testing.T) {
	state := model.State{}

	// no group members
	template := model.Template{}
	template.Groups = make(map[string][]model.GroupMember)
	findings := auditGroups(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}

	// empty group members
	template.Groups["Users"] = make([]model.GroupMember, 0)
	findings = auditGroups(state, template)
	if len(findings) != 0 {
		t.Fatal("Expected 0 findings")
	}

	// unknown state
	templateMember := model.GroupMember{Name: "user"}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Group Users, member unknown state: user")

	// group member to add
	templateMember = model.GroupMember{Name: "user", ObjectState: model.ObjectStateAdd}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], false, 0, "Group Users, member not added: user")

	// group member to keep
	templateMember = model.GroupMember{Name: "user", ObjectState: model.ObjectStateKeep}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, -1, "Group Users, member not found: user")

	// group member to remove
	templateMember = model.GroupMember{Name: "user", ObjectState: model.ObjectStateRemove}
	template.Groups["Users"] = append(make([]model.GroupMember, 0), templateMember)
	findings = auditGroups(state, template)
	if len(findings) != 1 {
		t.Fatal("Expected 1 findings")
	}
	checkFinding(t, findings[0], true, 1, "Group Users, member removed: user")
}
