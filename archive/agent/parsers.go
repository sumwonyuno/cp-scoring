package agent

import (
	"bytes"
	"encoding/binary"
	"encoding/csv"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/netwayfind/cp-scoring/model"
	"gopkg.in/ini.v1"
)

func parseEtcPasswd(bs []byte) []model.User {
	users := make([]model.User, 0)
	for _, line := range strings.Split(string(bs), "\n") {
		tokens := strings.Split(line, ":")
		if len(tokens) != 7 {
			continue
		}
		username, id := tokens[0], tokens[2]
		var entry model.User
		entry.Name = username
		entry.ID = id
		users = append(users, entry)
	}
	return users
}

func parseEtcShadow(bs []byte) []model.User {
	users := make([]model.User, 0)
	for _, line := range strings.Split(string(bs), "\n") {
		tokens := strings.Split(line, ":")
		if len(tokens) != 9 {
			continue
		}
		username, passwordHash, unixDayPasswordLastChange, unixDayPasswordExpires, unixDayAccountDisabled := tokens[0], tokens[1], tokens[2], tokens[4], tokens[7]
		entry := model.User{}
		entry.Name = username

		// account active
		// user is locked if password hash entry starts with !
		// do not store the password hash
		// 33 (dec) is !
		if passwordHash[0] == 33 {
			entry.AccountActive = false
		} else {
			entry.AccountActive = true
		}
		// password last changed
		numDays, err := strconv.Atoi(unixDayPasswordLastChange)
		// should not have error
		if err == nil {
			// convert days to seconds (unix timestamp)
			entry.PasswordLastSet = int64(numDays * 86400)
		}
		// password expires
		if unixDayPasswordExpires == "99999" {
			entry.PasswordExpires = false
		} else {
			entry.PasswordExpires = true
		}
		// account expired
		if len(unixDayAccountDisabled) == 0 {
			entry.AccountExpires = false
		} else {
			entry.AccountExpires = true
		}

		// save changes
		users = append(users, entry)
	}
	return users
}

func mergeLinuxUsers(usersEtcPasswd []model.User, usersEtcShadow []model.User) []model.User {
	users := make([]model.User, 0)

	// turn into map
	usersMapEtcShadow := make(map[string]model.User)

	for _, entry := range usersEtcShadow {
		usersMapEtcShadow[entry.Name] = entry
	}

	// assume users exist in both /etc/passwd and /etc/shadow
	for _, entry := range usersEtcPasswd {
		entryShadow := usersMapEtcShadow[entry.Name]
		// set settings from shadow into entry
		entry.AccountActive = entryShadow.AccountActive
		entry.AccountExpires = entryShadow.AccountExpires
		entry.PasswordLastSet = entryShadow.PasswordLastSet
		entry.PasswordExpires = entryShadow.PasswordExpires

		users = append(users, entry)
	}

	return users
}

func fromHexStringPort(hexPort string) (string, error) {
	if len(hexPort) == 0 {
		return "", fmt.Errorf("Empty string")
	}

	bs := make([]byte, 2)
	_, err := hex.Decode(bs, []byte(hexPort))
	if err != nil {
		return "", err
	}
	num := binary.BigEndian.Uint16(bs)

	return strconv.Itoa(int(num)), nil
}

func fromHexStringIPv4(hexIP string) (string, error) {
	if len(hexIP) == 0 {
		return "", fmt.Errorf("Empty string")
	} else if len(hexIP) != 8 {
		return "", fmt.Errorf("Invalid number of bytes")
	}

	bs := make([]byte, 4)
	_, err := hex.Decode(bs, []byte(hexIP))
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%d.%d.%d.%d", bs[3], bs[2], bs[1], bs[0]), nil
}

func fromHexStringIPv6(hexIP string) (string, error) {
	if len(hexIP) == 0 {
		return "", fmt.Errorf("Empty string")
	} else if len(hexIP) != 32 {
		return "", fmt.Errorf("Invalid number of bytes")
	}

	bs := make([]byte, 16)
	_, err := hex.Decode(bs, []byte(hexIP))
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("%02X%02X:%02X%02X:%02X%02X:%02X%02X:%02X%02X:%02X%02X:%02X%02X:%02X%02X",
		bs[3], bs[2],
		bs[1], bs[0],
		bs[7], bs[6],
		bs[5], bs[4],
		bs[11], bs[10],
		bs[9], bs[8],
		bs[15], bs[14],
		bs[13], bs[12]), nil
}

func parseProcNet(protocol string, bs []byte) []model.NetworkConnection {
	conns := make([]model.NetworkConnection, 0)

	space := regexp.MustCompile("\\s+")

	for i, line := range strings.Split(string(bs), "\n") {
		// skip first line
		if i == 0 {
			continue
		}

		// remove duplicate spaces
		line = space.ReplaceAllString(line, " ")
		// remove leading and trailing spaces
		line = strings.TrimSpace(line)

		// based on spec
		tokens := strings.Split(line, " ")
		if len(tokens) < 9 {
			continue
		}

		var conn model.NetworkConnection
		conn.Protocol = protocol
		pid, err := strconv.ParseInt(tokens[8], 10, 64)
		if err == nil {
			conn.PID = pid
		}
		conn.State = model.GetNetworkConnectionStateLinux(tokens[3])

		localParts := strings.Split(tokens[1], ":")
		localAddress, err := fromHexStringIPv4(localParts[0])
		if err == nil {
			conn.LocalAddress = localAddress
		}
		localPort, err := fromHexStringPort(localParts[1])
		if err == nil {
			conn.LocalPort = localPort
		}

		remoteParts := strings.Split(tokens[2], ":")
		remoteAddress, err := fromHexStringIPv4(remoteParts[0])
		if err == nil {
			conn.RemoteAddress = remoteAddress
		}
		remotePort, err := fromHexStringPort(remoteParts[1])
		if err == nil {
			conn.RemotePort = remotePort
		}

		conns = append(conns, conn)
	}

	return conns
}

func parseProcNet6(protocol string, bs []byte) []model.NetworkConnection {
	conns := make([]model.NetworkConnection, 0)

	space := regexp.MustCompile("\\s+")

	for i, line := range strings.Split(string(bs), "\n") {
		// skip first line
		if i == 0 {
			continue
		}

		// remove duplicate spaces
		line = space.ReplaceAllString(line, " ")
		// remove leading and trailing spaces
		line = strings.TrimSpace(line)

		// based on spec
		tokens := strings.Split(line, " ")
		if len(tokens) < 9 {
			continue
		}

		var conn model.NetworkConnection
		conn.Protocol = protocol
		pid, err := strconv.ParseInt(tokens[8], 10, 64)
		if err == nil {
			conn.PID = pid
		}
		conn.State = model.GetNetworkConnectionStateLinux(tokens[3])

		localParts := strings.Split(tokens[1], ":")
		localAddress, err := fromHexStringIPv6(localParts[0])
		if err == nil {
			conn.LocalAddress = localAddress
		}
		localPort, err := fromHexStringPort(localParts[1])
		if err == nil {
			conn.LocalPort = localPort
		}

		remoteParts := strings.Split(tokens[2], ":")
		remoteAddress, err := fromHexStringIPv6(remoteParts[0])
		if err == nil {
			conn.RemoteAddress = remoteAddress
		}
		remotePort, err := fromHexStringPort(remoteParts[1])
		if err == nil {
			conn.RemotePort = remotePort
		}

		conns = append(conns, conn)
	}

	return conns
}

func parseEtcGroup(bs []byte) map[string][]model.GroupMember {
	groups := make(map[string][]model.GroupMember)
	for _, line := range strings.Split(string(bs), "\n") {
		tokens := strings.Split(line, ":")
		if len(tokens) != 4 {
			continue
		}
		group, membersStr := tokens[0], tokens[3]
		groups[group] = make([]model.GroupMember, 0)
		if len(membersStr) > 0 {
			for _, name := range strings.Split(membersStr, ",") {
				groups[group] = append(groups[group], model.GroupMember{Name: name})
			}
		}
	}

	return groups
}

func parseBinPs(bs []byte) []model.Process {
	processes := make([]model.Process, 0)

	var posPID int
	var posUser int
	var posCommand int
	for i, line := range strings.Split(string(bs), "\n") {
		if len(line) == 0 {
			continue
		}

		// get positions of columns (PID,user,command)
		if i == 0 {
			// PID is kept at 0, column is right justified
			posUser = strings.Index(line, "USER")
			posCommand = strings.Index(line, "COMMAND")
			// can't process without these
			if posUser == -1 || posCommand == -1 {
				break
			}
			continue
		}

		// can't continue if line is cut off
		if len(line) < posCommand {
			continue
		}

		var process model.Process
		pid, err := strconv.ParseInt(strings.TrimSpace(line[posPID:posUser]), 10, 64)
		if err == nil {
			process.PID = pid
		} else {
			// set PID to -1 if had error parsing
			process.PID = -1
		}
		process.User = strings.TrimSpace(line[posUser:posCommand])
		process.CommandLine = strings.TrimSpace(line[posCommand:])
		processes = append(processes, process)
	}

	return processes
}

func parseAptListInstalled(bs []byte) []model.Software {
	software := make([]model.Software, 0)

	for _, line := range strings.Split(string(bs), "\n") {
		if len(line) == 0 {
			continue
		}

		// split package information tokens
		tokens := strings.Split(line, " ")
		if len(tokens) != 4 {
			continue
		}
		pkgStr, version := tokens[0], tokens[1]
		pkg := strings.Split(pkgStr, "/")[0]
		var sw model.Software
		sw.Name = pkg
		sw.Version = version
		software = append(software, sw)
	}

	return software
}

func parseWindowsUsersGetLocalUser(bs []byte) []model.User {
	users := make([]model.User, 0)
	c := csv.NewReader(bytes.NewReader(bs))
	records, err := c.ReadAll()
	if err != nil {
		return users
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}
		// must have exactly 6 columns, or else ignore line
		if len(row) != 6 {
			continue
		}
		user := model.User{}
		// Name,SID,Enabled,AccountExpires,PasswordLastSet,PasswordExpires
		user.Name = row[0]
		user.ID = row[1]
		if row[2] == "True" {
			user.AccountActive = true
		} else if row[2] == "False" {
			user.AccountActive = false
		} else {
			user.AccountActive = false
		}
		if len(row[3]) == 0 {
			user.AccountExpires = false
		} else {
			user.AccountExpires = true
		}
		if len(row[4]) == 0 {
			// never expire is max value
			user.PasswordLastSet = math.MaxInt64
		} else {
			timezone, _ := time.Now().Zone()
			value := row[4] + " " + timezone
			layout := "1/2/2006 3:04:05 PM MST"
			t, err := time.Parse(layout, value)
			if err == nil {
				user.PasswordLastSet = t.Unix()
			}
		}
		if len(row[5]) == 0 {
			user.PasswordExpires = false
		} else {
			user.PasswordExpires = true
		}
		users = append(users, user)
	}

	return users
}

func parseWindowsUsersWin32UserAccount(bs []byte) []model.User {
	users := make([]model.User, 0)
	c := csv.NewReader(bytes.NewReader(bs))
	records, err := c.ReadAll()
	if err != nil {
		return users
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}
		// must have exactly 2 columns, or else ignore line
		if len(row) != 2 {
			continue
		}
		user := model.User{}
		// Name,SID
		user.Name = row[0]
		user.ID = row[1]
		users = append(users, user)
	}

	return users
}

func parseWindowsNetUser(bs []byte) model.User {
	var user model.User

	for _, line := range strings.Split(string(bs), "\r\n") {
		tokens := strings.Fields(line)
		if len(tokens) == 3 {
			if tokens[0] == "Account" && tokens[1] == "active" {
				if tokens[2] == "Yes" {
					user.AccountActive = true
				} else {
					user.AccountActive = false
				}
			} else if tokens[0] == "Account" && tokens[1] == "expires" {
				if tokens[2] == "Never" {
					user.AccountExpires = false
				} else {
					user.AccountExpires = true
				}
			} else if tokens[0] == "Password" && tokens[1] == "expires" {
				if tokens[2] == "Never" {
					user.PasswordExpires = false
				} else {
					user.PasswordExpires = true
				}
			}
		} else if len(tokens) == 6 {
			if tokens[0] == "Password" && tokens[1] == "last" && tokens[2] == "set" {
				timezone, _ := time.Now().Zone()
				value := tokens[3] + " " + tokens[4] + " " + tokens[5] + " " + timezone
				layout := "1/2/2006 3:04:05 PM MST"
				t, err := time.Parse(layout, value)
				if err == nil {
					user.PasswordLastSet = t.Unix()
				}
			}
		}
	}

	return user
}

func parseWindowsTCPNetConns(bs []byte) []model.NetworkConnection {
	conns := make([]model.NetworkConnection, 0)
	c := csv.NewReader(bytes.NewReader(bs))
	records, err := c.ReadAll()
	if err != nil {
		return conns
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 6 columns, or else ignore line
		if len(row) != 6 {
			continue
		}

		conn := model.NetworkConnection{}
		conn.Protocol = "TCP"
		// OwningProcess,State,LocalAddress,LocalPort,RemoteAddress,RemotePort
		pid, err := strconv.ParseInt(row[0], 10, 64)
		if err == nil {
			conn.PID = pid
		}
		conn.State = model.GetNetworkConnectionState(row[1])
		conn.LocalAddress = row[2]
		conn.LocalPort = row[3]
		conn.RemoteAddress = row[4]
		conn.RemotePort = row[5]

		conns = append(conns, conn)
	}

	return conns
}

func parseWindowsUDPNetConns(bs []byte) []model.NetworkConnection {
	conns := make([]model.NetworkConnection, 0)
	c := csv.NewReader(bytes.NewReader(bs))
	records, err := c.ReadAll()
	if err != nil {
		return conns
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 3 columns, or else ignore line
		if len(row) != 3 {
			continue
		}

		conn := model.NetworkConnection{}
		conn.Protocol = "UDP"
		// OwningProcess,LocalAddress,LocalPort
		pid, err := strconv.ParseInt(row[0], 10, 64)
		if err == nil {
			conn.PID = pid
		}
		conn.State = model.GetNetworkConnectionState(row[0])
		conn.LocalAddress = row[1]
		conn.LocalPort = row[2]

		conns = append(conns, conn)
	}

	return conns
}

func parseWindowsProcesses(bs []byte) []model.Process {
	processes := make([]model.Process, 0)

	r := csv.NewReader(bytes.NewReader(bs))
	records, err := r.ReadAll()
	if err != nil {
		return processes
	}
	hostname, _ := os.Hostname()
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 4 columns, or else ignore line
		if len(row) != 4 {
			continue
		}

		process := model.Process{}
		// ID,Username,Name,Path
		pid, _ := strconv.ParseInt(row[0], 10, 64)
		process.PID = pid
		// local account, remove hostname
		user := row[1]
		if strings.Index(row[1], hostname) != -1 {
			user = user[len(hostname)+1:]
		}
		process.User = user
		// prefer path, but use name if path empty
		if len(row[3]) > 0 {
			process.CommandLine = row[3]
		} else {
			process.CommandLine = row[2]
		}
		processes = append(processes, process)
	}

	return processes
}

func parseWindowsGroups(bs []byte) map[string][]model.GroupMember {
	groups := make(map[string][]model.GroupMember)

	r := csv.NewReader(bytes.NewReader(bs))
	records, err := r.ReadAll()
	if err != nil {
		return groups
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 2 columns, or else ignore line
		if len(row) != 2 {
			continue
		}

		// GroupComponent,PartComponent
		// parse out group and member
		// e.g. GroupComponent = \\DESKTOP\root\cimv2:Win32_Group.Domain="DESKTOP",Name="Administrators"
		// e.g. PartComponent = \\DESKTOP\root\cimv2:Win32_UserAccount.Domain="DESKTOP",Name="user"
		if len(row[0]) == 0 {
			// can't continue without group
			continue
		}
		if len(row[1]) == 0 {
			// can't continue without user
			continue
		}

		// group
		tokens := strings.Split(row[0], ",")
		// probably not expected format
		if len(tokens) != 2 {
			continue
		}
		token := tokens[1]
		// must have at least something in Name=""
		if len(token) <= 7 {
			continue
		}
		group := token[6 : len(token)-1]

		// user
		tokens = strings.Split(row[1], ",")
		// probably not in expected format
		if len(tokens) != 2 {
			continue
		}
		token = tokens[1]
		// must have at least something in Name=""
		if len(token) <= 7 {
			continue
		}
		name := token[6 : len(token)-1]

		g, present := groups[group]
		if !present {
			g = make([]model.GroupMember, 0)
		}
		g = append(g, model.GroupMember{Name: name})
		groups[group] = g
	}

	return groups
}

func parseWindowsSoftware(bs []byte) []model.Software {
	software := make([]model.Software, 0)

	r := csv.NewReader(bytes.NewReader(bs))
	records, err := r.ReadAll()
	if err != nil {
		return software
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 2 columns, or else ignore line
		if len(row) != 2 {
			continue
		}

		// don't add if empty name
		if len(row[0]) == 0 {
			continue
		}

		sw := model.Software{}
		//DisplayName,DisplayVersion
		sw.Name = row[0]
		sw.Version = row[1]

		software = append(software, sw)
	}

	return software
}

func parseWindowsFeatures(bs []byte) []model.Software {
	software := make([]model.Software, 0)

	r := csv.NewReader(bytes.NewReader(bs))
	records, err := r.ReadAll()
	if err != nil {
		return software
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 1 column, or else ignore line
		if len(row) != 1 {
			continue
		}

		// don't add if empty name
		if len(row[0]) == 0 {
			continue
		}

		sw := model.Software{}
		sw.Name = row[0]

		software = append(software, sw)
	}

	return software
}

func parsePowerShellVersion(bs []byte) string {
	r := csv.NewReader(bytes.NewReader(bs))
	records, err := r.ReadAll()
	if err != nil {
		return ""
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 1 columns, or else ignore line
		if len(row) != 1 {
			continue
		}

		// should just be one row left
		return row[0]
	}

	// no rows
	return ""
}

func parseWindowsScheduledTasks(bs []byte) []model.ScheduledTask {
	tasks := make([]model.ScheduledTask, 0)

	r := csv.NewReader(bytes.NewReader(bs))
	records, err := r.ReadAll()
	if err != nil {
		return tasks
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 3 columns, or else ignore line
		if len(row) != 3 {
			continue
		}

		// don't add if empty name
		if len(row[0]) == 0 {
			continue
		}

		task := model.ScheduledTask{}
		task.Name = row[0]
		task.Path = row[1]
		if row[2] == "Disabled" {
			task.Enabled = false
		} else if len(row[2]) == 0 {
			task.Enabled = false
		} else {
			task.Enabled = true
		}

		tasks = append(tasks, task)
	}

	return tasks
}

func parseWindowsFirewallProfiles(bs []byte) []model.WindowsFirewallProfile {
	profiles := make([]model.WindowsFirewallProfile, 0)

	r := csv.NewReader(bytes.NewReader(bs))
	records, err := r.ReadAll()
	if err != nil {
		return profiles
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 4 columns, or else ignore line
		if len(row) != 4 {
			continue
		}

		// don't add if empty name
		if len(row[0]) == 0 {
			continue
		}

		profile := model.WindowsFirewallProfile{}
		profile.Name = row[0]
		if row[1] == "True" {
			profile.Enabled = true
		} else {
			profile.Enabled = false
		}
		profile.DefaultInboundAction = row[2]
		profile.DefaultOutboundAction = row[3]

		profiles = append(profiles, profile)
	}

	return profiles
}

func parseWindowsFirewallRules(bs []byte) []model.WindowsFirewallRule {
	rules := make([]model.WindowsFirewallRule, 0)

	r := csv.NewReader(bytes.NewReader(bs))
	records, err := r.ReadAll()
	if err != nil {
		return rules
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 4 columns, or else ignore line
		if len(row) != 4 {
			continue
		}

		rule := model.WindowsFirewallRule{}
		rule.DisplayName = row[0]
		if row[1] == "True" {
			rule.Enabled = true
		} else {
			rule.Enabled = false
		}
		rule.Direction = row[2]
		rule.Action = row[3]

		rules = append(rules, rule)
	}

	return rules
}

func parseWindowsFirewallPortFilters(bs []byte) []model.WindowsFirewallRule {
	rules := make([]model.WindowsFirewallRule, 0)

	r := csv.NewReader(bytes.NewReader(bs))
	records, err := r.ReadAll()
	if err != nil {
		return rules
	}
	for i, row := range records {
		// header row
		if i == 0 {
			continue
		}

		// must have exactly 4 columns, or else ignore line
		if len(row) != 4 {
			continue
		}

		rule := model.WindowsFirewallRule{}
		rule.Protocol = row[0]
		rule.LocalPort = row[1]
		rule.RemoteAddress = row[2]
		rule.RemotePort = row[3]

		rules = append(rules, rule)
	}

	return rules
}

func mergeWindowsFirewallRules(fromRules []model.WindowsFirewallRule, fromPortFilters []model.WindowsFirewallRule) ([]model.WindowsFirewallRule, error) {
	if len(fromRules) != len(fromPortFilters) {
		return nil, errors.New("Mismatch Windows firewall rules results")
	}

	rules := make([]model.WindowsFirewallRule, len(fromRules))

	for i, rule := range fromRules {
		other := fromPortFilters[i]
		rule.Protocol = other.Protocol
		rule.LocalPort = other.LocalPort
		rule.RemoteAddress = other.RemoteAddress
		rule.RemotePort = other.RemotePort
		rules[i] = rule
	}

	return rules, nil
}

func addToSettings(section *ini.Section, key string, settings []model.WindowsSetting) []model.WindowsSetting {
	if !section.HasKey(key) {
		return settings
	}
	return append(settings, model.WindowsSetting{
		Key:   key,
		Value: section.Key(key).String(),
	})
}

func parseWindowsSecEdit(bs []byte) ([]model.WindowsSetting, error) {
	settings := make([]model.WindowsSetting, 0)

	cfg, err := ini.Load(bs)
	if err != nil {
		return settings, err
	}

	section := cfg.Section("System Access")
	settings = addToSettings(section, "MinimumPasswordAge", settings)
	settings = addToSettings(section, "MaximumPasswordAge", settings)
	settings = addToSettings(section, "MinimumPasswordLength", settings)
	settings = addToSettings(section, "PasswordComplexity", settings)
	settings = addToSettings(section, "PasswordHistorySize", settings)
	settings = addToSettings(section, "LockoutBadCount", settings)
	settings = addToSettings(section, "ResetLockoutCount", settings)
	settings = addToSettings(section, "LockoutDuration", settings)
	settings = addToSettings(section, "EnableAdminAccount", settings)
	settings = addToSettings(section, "EnableGuestAccount", settings)

	section = cfg.Section("Event Audit")
	settings = addToSettings(section, "AuditSystemEvents", settings)
	settings = addToSettings(section, "AuditLogonEvents", settings)
	settings = addToSettings(section, "AuditObjectAccess", settings)
	settings = addToSettings(section, "AuditPrivilegeUse", settings)
	settings = addToSettings(section, "AuditPolicyChange", settings)
	settings = addToSettings(section, "AuditAccountManage", settings)
	settings = addToSettings(section, "AuditProcessTracking", settings)
	settings = addToSettings(section, "AuditDSAccess", settings)
	settings = addToSettings(section, "AuditAccountLogon", settings)

	return settings, nil
}
