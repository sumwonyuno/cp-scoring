package agent

import (
	"io"
	"log"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"github.com/netwayfind/cp-scoring/model"
)

func GetState() model.State {
	host := GetCurrentHost()

	state := model.GetNewStateTemplate()
	errors := make([]string, 0)
	users, err := host.GetUsers()
	if err == nil {
		state.Users = users
	} else {
		errors = append(errors, "ERROR: unable to get users; "+err.Error())
	}
	groups, err := host.GetGroups()
	if err == nil {
		state.Groups = groups
	} else {
		errors = append(errors, "ERROR: cannot get groups; "+err.Error())
	}
	processes, err := host.GetProcesses()
	if err == nil {
		state.Processes = processes
	} else {
		errors = append(errors, "ERROR: cannot get processes; "+err.Error())
	}
	software, err := host.GetSoftware()
	if err == nil {
		state.Software = software
	} else {
		errors = append(errors, "ERROR: cannot get software; "+err.Error())
	}
	conns, err := host.GetNetworkConnections()
	if err == nil {
		state.NetworkConnections = conns
	} else {
		errors = append(errors, "ERROR: cannot get network connections; "+err.Error())
	}
	state.Errors = errors
	tasks, err := host.GetScheduledTasks()
	if err == nil {
		state.ScheduledTasks = tasks
	} else {
		errors = append(errors, "ERROR: cannot get scheduled tasks;"+err.Error())
	}
	profiles, err := host.GetWindowsFirewallProfiles()
	if err == nil {
		state.WindowsFirewallProfiles = profiles
	} else {
		errors = append(errors, "ERROR: cannot get Windows firewall profiles;"+err.Error())
	}
	rules, err := host.GetWindowsFirewallRules()
	if err == nil {
		state.WindowsFirewallRules = rules
	} else {
		errors = append(errors, "ERROR: cannot get Windows firewall rules;"+err.Error())
	}
	settings, err := host.GetWindowsSettings()
	if err == nil {
		state.WindowsSettings = settings
	} else {
		errors = append(errors, "ERROR: cannot get Windows settings;"+err.Error())
	}
	return state
}

func GetCurrentHost() model.CurrentHost {
	if runtime.GOOS == "linux" {
		return hostLinux{}
	} else if runtime.GOOS == "windows" {
		version, err := getPowerShellVersion()
		if err != nil {
			version = ""
		}
		cmd := "Get-WmiObject Win32_operatingsystem | % caption"
		descBytes, err := exec.Command("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", "-command", cmd).Output()
		if err != nil {
			descBytes = make([]byte, 0)
		}
		desc := string(descBytes)
		isServer := false
		if strings.Contains(desc, "Server") {
			isServer = true
		}
		return hostWindows{
			PowerShellVersion: version,
			Description:       desc,
			IsServer:          isServer,
		}
	} else {
		log.Fatal("ERROR: unsupported platform: " + runtime.GOOS)
		return nil
	}
}

func copyFile(srcPath string, dstPath string) {
	src, err := os.Open(srcPath)
	if err != nil {
		log.Fatalln("Unable to open source file;", err)
	}
	defer src.Close()
	dst, err := os.Create(dstPath)
	if err != nil {
		log.Fatalln("Unable to open destination file;", err)
	}
	defer dst.Close()
	_, err = io.Copy(dst, src)
	if err != nil {
		log.Fatalln("Unable to copy file;", err)
	}
}
