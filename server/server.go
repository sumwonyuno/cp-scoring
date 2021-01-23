package main

import (
	"flag"
	"io/ioutil"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/netwayfind/cp-scoring/model"
)

// to be set by build
var version string

func main() {
	// set seed
	rand.Seed(time.Now().UTC().UnixNano())

	// default path
	ex, err := os.Executable()
	if err != nil {
		log.Fatal("ERROR: unable to get executable", err)
	}
	dirWork := filepath.Dir(ex)

	// program arguments
	var askVersion bool
	flag.StringVar(&dirWork, "dir_work", dirWork, "working directory path")
	flag.BoolVar(&askVersion, "version", false, "get version number")
	flag.Parse()

	// version
	if askVersion {
		log.Println("Version: " + version)
		os.Exit(0)
	}

	dirConfig := path.Join(dirWork, "config")
	dirData := path.Join(dirWork, "data")
	dirResults := path.Join(dirData, "results")
	dirUI := path.Join(dirWork, "ui")

	// read config file
	fileConfig := path.Join(dirConfig, "server.conf")
	log.Printf("Reading config file %s\n", fileConfig)
	bytesConfig, err := ioutil.ReadFile(fileConfig)
	if err != nil {
		log.Fatal("ERROR: unable to read config file;", err)
	}
	var port string
	var dbURL string
	var bytesJwtSecret []byte
	for _, line := range strings.Split(string(bytesConfig), "\n") {
		line = strings.TrimSpace(line)
		if len(line) == 0 {
			continue
		}
		if strings.HasPrefix(line, "#") {
			continue
		}

		tokens := strings.Split(line, " ")
		if tokens[0] == "port" {
			port = tokens[1]
		} else if tokens[0] == "db_url" {
			dbURL = tokens[1]
		} else if tokens[0] == "jwt_secret" {
			bytesJwtSecret = []byte(tokens[1])
		} else {
			log.Fatalf("ERROR: unknown config file setting %s\n", tokens[0])
		}
	}

	backingStore, err := getBackingStore("postgres", dbURL)
	if err != nil {
		log.Fatal(err)
	}
	apiHandler := APIHandler{
		BackingStore: backingStore,
		jwtSecret:    bytesJwtSecret,
		dirResults:   dirResults,
	}

	// generate default user if no users
	users, err := apiHandler.BackingStore.userSelectAll()
	if err != nil {
		log.Fatal("Could not get users list;", err)
	}
	if len(users) == 0 {
		log.Println("Creating default user")
		if err != nil {
			log.Fatal("ERROR: cannot generate password hash;", err)
		}
		user := model.User{
			Username: "admin",
			Password: "admin",
			Enabled:  true,
			Email:    "",
		}
		_, err := apiHandler.BackingStore.userInsert(user)
		if err != nil {
			log.Fatal("ERROR: cannot save default user;", err)
		}
	}

	log.Println("Creating results directory")
	err = os.MkdirAll(dirResults, 0700)
	if err != nil {
		log.Fatalln("Unable to set up directory "+dirResults+";", err)
	}

	// async audit
	go func() {
		for {
			files, err := ioutil.ReadDir(dirResults)
			if err != nil {
				log.Println("ERROR: cannot read results directory;", err)
			}
			if len(files) > 0 {
				log.Println("Processing results")
				for _, file := range files {
					filePath := path.Join(dirResults, file.Name())
					log.Println("Auditing file " + filePath)
					err := apiHandler.auditResult(filePath)
					if err != nil {
						log.Println("ERROR: unable to audit file;", err)
					}
					log.Println("DELETING " + filePath)
					os.Remove(filePath)
				}
			}
			time.Sleep(10 * time.Second)
		}
	}()

	// API routing
	r := mux.NewRouter().StrictSlash(true)
	r.Use(apiHandler.middlewareLog)
	r.HandleFunc("/", apiHandler.redirectToUI).Methods("GET")
	r.PathPrefix("/public").Handler(http.FileServer(http.Dir(dirWork)))
	r.PathPrefix("/static").Handler(http.FileServer(http.Dir(dirUI)))
	r.PathPrefix("/ui").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, dirUI+"/index.html")
	})

	apiRouter := r.PathPrefix("/api").Subrouter()
	apiRouter.HandleFunc("/", apiHandler.readAPIRoot).Methods("GET")
	apiRouter.HandleFunc("/version", apiHandler.readAPIVersion).Methods("GET")

	// audit, no auth
	auditRouter := apiRouter.PathPrefix("/audit").Subrouter()
	auditRouter.HandleFunc("/", apiHandler.audit).Methods("POST")

	// host-token, no auth
	hostTokenRouter := apiRouter.PathPrefix("/host-token").Subrouter()
	hostTokenRouter.HandleFunc("/request", apiHandler.requestHostToken).Methods("POST")
	hostTokenRouter.HandleFunc("/register", apiHandler.registerHostToken).Methods("POST")

	// login, no auth
	loginRouter := apiRouter.PathPrefix("/login").Subrouter()
	loginRouter.HandleFunc("/", apiHandler.checkLoginUser).Methods("GET")
	loginRouter.HandleFunc("/", apiHandler.loginUser).Methods("POST")

	// login-team, no auth
	loginTeamRouter := apiRouter.PathPrefix("/login-team").Subrouter()
	loginTeamRouter.HandleFunc("/", apiHandler.checkLoginTeam).Methods("GET")
	loginTeamRouter.HandleFunc("/", apiHandler.loginTeam).Methods("POST")

	// logout, auth required
	logoutRouter := apiRouter.PathPrefix("/logout").Subrouter()
	logoutRouter.Use(apiHandler.middlewareAuth)
	logoutRouter.HandleFunc("/", apiHandler.logoutUser).Methods("POST")

	// logout-team, auth required
	logoutTeamRouter := apiRouter.PathPrefix("/logout-team").Subrouter()
	logoutTeamRouter.Use(apiHandler.middlewareTeam)
	logoutTeamRouter.HandleFunc("/", apiHandler.logoutTeam).Methods("POST")

	// scenarios, auth required
	scenarioRouter := apiRouter.PathPrefix("/scenarios").Subrouter()
	scenarioRouter.Use(apiHandler.middlewareAuth)
	scenarioRouter.HandleFunc("/", apiHandler.readScenarios).Methods("GET")
	scenarioRouter.HandleFunc("/", apiHandler.createScenario).Methods("POST")
	scenarioRouter.HandleFunc("/{id:[0-9]+}", apiHandler.deleteScenario).Methods("DELETE")
	scenarioRouter.HandleFunc("/{id:[0-9]+}", apiHandler.readScenario).Methods("GET")
	scenarioRouter.HandleFunc("/{id:[0-9]+}", apiHandler.updateScenario).Methods("PUT")
	scenarioRouter.HandleFunc("/{id:[0-9]+}/hosts", apiHandler.readScenarioHosts).Methods("GET")
	scenarioRouter.HandleFunc("/{id:[0-9]+}/hosts", apiHandler.updateScenarioHosts).Methods("PUT")
	scenarioRouter.HandleFunc("/{id:[0-9]+}/config", apiHandler.readScenarioConfig).Methods("GET")

	// report, team required
	reportRouter := apiRouter.PathPrefix("/report").Subrouter()
	reportRouter.Use(apiHandler.middlewareTeam)
	reportRouter.HandleFunc("/{id:[0-9]+}", apiHandler.readScenarioReport).Methods("GET")
	reportRouter.HandleFunc("/{id:[0-9]+}/hostnames", apiHandler.readScenarioReportHostnames).Methods("GET")
	reportRouter.HandleFunc("/{id:[0-9]+}/timeline", apiHandler.readScenarioReportTimeline).Methods("GET")

	// scenario-desc, no auth
	scenarioDescRouter := apiRouter.PathPrefix("/scenario-desc").Subrouter()
	scenarioDescRouter.HandleFunc("/{id:[0-9]+}", apiHandler.readScenario).Methods("GET")

	// scenario-checks, no auth
	scenarioChecksRouter := apiRouter.PathPrefix("/scenario-checks").Subrouter()
	scenarioChecksRouter.HandleFunc("/{id:[0-9]+}", apiHandler.readScenarioChecks).Methods("GET")

	// scoreboard, no auth
	scoreboardRouter := apiRouter.PathPrefix("/scoreboard").Subrouter()
	scoreboardRouter.HandleFunc("/scenarios", apiHandler.readScoreboardScenarios).Methods("GET")
	scoreboardRouter.HandleFunc("/scenarios/{id:[0-9]+}", apiHandler.readScoreboardForScenario).Methods("GET")

	// teams, auth required
	teamRouter := apiRouter.PathPrefix("/teams").Subrouter()
	teamRouter.Use(apiHandler.middlewareAuth)
	teamRouter.HandleFunc("/", apiHandler.readTeams).Methods("GET")
	teamRouter.HandleFunc("/", apiHandler.createTeam).Methods("POST")
	teamRouter.HandleFunc("/{id:[0-9]+}", apiHandler.deleteTeam).Methods("DELETE")
	teamRouter.HandleFunc("/{id:[0-9]+}", apiHandler.readTeam).Methods("GET")
	teamRouter.HandleFunc("/{id:[0-9]+}", apiHandler.updateTeam).Methods("PUT")

	// users, auth required
	userRouter := apiRouter.PathPrefix("/users").Subrouter()
	userRouter.Use(apiHandler.middlewareAuth)
	userRouter.HandleFunc("/", apiHandler.readUsers).Methods("GET")
	userRouter.HandleFunc("/", apiHandler.createUser).Methods("POST")
	userRouter.HandleFunc("/{id:[0-9]+}", apiHandler.deleteUser).Methods("DELETE")
	userRouter.HandleFunc("/{id:[0-9]+}", apiHandler.readUser).Methods("GET")
	userRouter.HandleFunc("/{id:[0-9]+}", apiHandler.updateUser).Methods("PUT")
	userRouter.HandleFunc("/{id:[0-9]+}/roles", apiHandler.readUserRoles).Methods("GET")
	userRouter.HandleFunc("/{id:[0-9]+}/roles", apiHandler.updateUserRoles).Methods("PUT")

	log.Println("Ready to serve requests")
	addr := "0.0.0.0:" + port
	l, err := net.Listen("tcp4", addr)
	if err != nil {
		log.Fatal(err)
	}

	err = http.Serve(l, r)
	if err != nil {
		log.Fatal("ERROR: cannot start server;", err)
	}

}
