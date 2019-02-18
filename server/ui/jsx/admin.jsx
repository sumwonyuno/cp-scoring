'use strict';

const Plot = createPlotlyComponent(Plotly);

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      authenticated: false,
      page: null,
      id: null,
      lastUpdatedTeams: 0,
      lastUpdatedHosts: 0
    }

    this.authCallback = this.authCallback.bind(this);
    this.setPage = this.setPage.bind(this);
    this.logout = this.logout.bind(this);
  }

  authCallback(statusCode) {
    if (statusCode == 200) {
      this.setState({
        authenticated: true
      });
    }
    else {
      this.setState({
        authenticated: false
      })
    }    
  }

  logout() {
    let url = "/logout"
    fetch(url, {
      credentials: 'same-origin',
      method: "DELETE"
    })
    .then(function(_) {
      this.setState({
        authenticated: false
      })
    }.bind(this));
  }

  componentDidMount() {
    // check if logged in by visiting the following URL
    let url = "/templates";
    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      this.authCallback(response.status);
    }.bind(this));

    // track which page to be on
    let i = window.location.hash.indexOf('#');
    let hash = window.location.hash.slice(i + 1);
    this.setPage(hash);
    // handle browser back/forward
    window.onhashchange = (e) => {
        let i = e.newURL.indexOf('#');
        let hash = e.newURL.slice(i + 1);
        this.setPage(hash);
    };
  }

  setPage(hash) {
    let parts = hash.split("/")
    let page = parts[0];
    let id = null;
    if (parts.length >= 2) {
      id = parts[1];
    }
    this.setState({
      page: page,
      id: id
    })
  }

  updateTeamCallback() {
    this.setState({
      lastUpdatedTeams: Date.now()
    })
  }

  updateHostCallback() {
    this.setState({
      lastUpdatedHosts: Date.now()
    })
  }

  render() {
    if (!this.state.authenticated) {
      return (
        <div className="App">
          <Login callback={this.authCallback}/>
        </div>
      );
    }

    // default page is empty
    let page = (<React.Fragment></React.Fragment>)
    let content = (<React.Fragment></React.Fragment>)
    if (this.state.page == "teams") {
      page = (<Teams lastUpdated={this.state.lastUpdatedTeams}/>);
      content = (<TeamEntry id={this.state.id} updateCallback={this.updateTeamCallback.bind(this)}/>);
    }
    else if (this.state.page == "hosts") {
      page = (<Hosts lastUpdated={this.state.lastUpdatedHosts}/>);
      content = (<HostEntry id={this.state.id} updateCallback={this.updateHostCallback.bind(this)}/>);
    }
    else if (this.state.page == "templates") {
      page = (<Templates />);
    }
    else if (this.state.page == "scenarios") {
      page = (<Scenarios />);
    }

    return (
      <div className="App">
        <div className="heading">
          <h1>cp-scoring</h1>
        </div>
        <div className="navbar">
          <a className="nav-button" href="#teams">Teams</a>
          <a className="nav-button" href="#hosts">Hosts</a>
          <a className="nav-button" href="#templates">Templates</a>
          <a className="nav-button" href="#scenarios">Scenarios</a>
          <button className="right" onClick={this.logout}>Logout</button>
        </div>
        <div className="toc">
          {page}
        </div>
        <div className="content">
          {content}
        </div>
      </div>
    );
  }
}

class Login extends React.Component {
  constructor() {
    super();
    this.state = {
      username: "",
      password: "",
      messages: ""
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    let value = event.target.value;
    this.setState({
      ...this.state.credentials,
      [event.target.name]: value
    });
  }

  handleSubmit(event) {
    event.preventDefault();

    if (this.state.username.length == 0 || this.state.password.length == 0) {
      return;
    }

    var url = "/login";

    fetch(url, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: "username=" + this.state.username + "&password=" + this.state.password
    })
    .then(function(response) {
      this.props.callback(response.status);
      if (response.status >= 400) {
        this.setState({
          messages: "Rejected login. Try again."
        });
      }
    }.bind(this));
  }

  render() {
    return (
      <div className="login">
        {this.state.messages}
        <form onChange={this.handleChange} onSubmit={this.handleSubmit}>
          <label htmlFor="username">Username</label>
          <input name="username" required="required"></input>
          <br />
          <label htmlFor="password">Password</label>
          <input name="password" type="password" required="required"></input>
          <br />
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }
}

const backgroundStyle = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  padding: 50
}

const modalStyle = {
  backgroundColor: 'white',
  padding: 30,
  maxHeight: '100%',
  overflowY: 'auto',
}

class BasicModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.defaultState();

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.setValue = this.setValue.bind(this);
  }

  defaultState() {
    return {
      subject: {}
    }
  }

  setValue(key, value) {
    this.setState({
      subject: {
        ...this.props.subject,
        ...this.state.subject,
        [key]: value
      }
    });
  }

  handleChange(event) {
    let value = event.target.value;
    if (event.target.type == 'checkbox') {
      value = event.target.checked;
    }
    this.setState({
      subject: {
        ...this.props.subject,
        ...this.state.subject,
        [event.target.name]: value
      }
    });
  }

  handleSubmit(event) {
    event.preventDefault();

    if (Object.keys(this.state.subject) == 0) {
      return;
    }

    var url = "/" + this.props.subjectClass;
    if (this.props.subjectID != null) {
      url += "/" + this.props.subjectID;
    }

    fetch(url, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.subject)
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      this.props.submit();
      this.setState(this.defaultState());
    }.bind(this));
  }

  handleClose() {
    this.props.onClose();
    this.setState(this.defaultState());
  }
  
  render() {
    if (!this.props.show) {
      return null;
    }

    return (
      <div className="background" style={backgroundStyle}>
        <div className="modal" style={modalStyle}>
          <label htmlFor="ID">ID</label>
          <input name="ID" defaultValue={this.props.subjectID} disabled></input>
          <br />
          <form onChange={this.handleChange} onSubmit={this.handleSubmit}>
            {this.props.children}
            <br />
            <button type="submit">Submit</button>
            <button type="button" onClick={this.handleClose}>Cancel</button>
          </form>
        </div>
      </div>
    );
  }
}

class Teams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      teams: []
    }
  }

  componentDidMount() {
    this.populateTeams();
  }

  componentWillReceiveProps(_) {
    this.populateTeams();
  }

  populateTeams() {
    var url = '/teams';
  
    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then(function(data) {
      this.setState({
        teams: data
      });
    }.bind(this));
  }

  render() {
    let rows = [];
    for (let i = 0; i < this.state.teams.length; i++) {
      let team = this.state.teams[i];
      rows.push(
        <li key={team.ID}>
          <a href={"#teams/" + team.ID}>[{team.ID}] {team.Name}</a>
        </li>
      );
    }

    return (
      <div className="Teams">
        <strong>Teams</strong>
        <ul>{rows}</ul>
      </div>
    );
  }
}

class TeamEntry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      team: {}
    }

    this.getTeam = this.getTeam.bind(this);
  }

  static newKey() {
    return Math.random().toString(16).substring(7);
  }

  componentDidMount() {
    if (this.props.id) {
      this.getTeam(this.props.id);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.id != nextProps.id) {
      this.getTeam(nextProps.id);
    }
  }

  newTeam() {
    window.location.href = "#teams";
    this.setState({
      team: {
        Name: "",
        POC: "",
        Email: "",
        Enabled: true,
        Key: TeamEntry.newKey()
      }
    });
  }

  getTeam(id) {
    if (id === null || id === undefined) {
      return;
    }

    let url = "/teams/" + id;

    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json()
    })
    .then(function(data) {
      this.setState({
        team: data
      });
    }.bind(this));
  }

  updateTeam(event) {
    let value = event.target.value;
    if (event.target.type == 'checkbox') {
      value = event.target.checked;
    }
    this.setState({
      team: {
        ...this.state.team,
        [event.target.name]: value
      }
    })
  }

  deleteTeam(id) {
    var url = "/teams/" + id;

    fetch(url, {
      credentials: 'same-origin',
      method: 'DELETE'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      this.props.updateCallback();
      this.setState({
        team: {}
      })
      window.location.href = "#teams";
    }.bind(this));
  }

  saveTeam(event) {
    event.preventDefault();

    var url = "/teams";
    if (this.state.team.ID != null) {
      url += "/" + this.state.team.ID;
    }

    fetch(url, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.team)
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      this.props.updateCallback();
      if (this.state.team.ID === null || this.state.team.ID === undefined) {
        // for new teams, response should be team ID
        response.text().then(function(id) {
          window.location.href = "#teams/" + id;
        });
      }
    }.bind(this));
  }

  regenKey() {
    let key = TeamEntry.newKey()
    this.setState({
      team: {
        ...this.state.team,
        Key: key
      }
    })
  }

  render() {
    let content = null;
    if (Object.entries(this.state.team).length != 0) {
      content = (
        <React.Fragment>
          <form onChange={this.updateTeam.bind(this)} onSubmit={this.saveTeam.bind(this)}>
          <label htmlFor="ID">ID</label>
          <input disabled value={this.state.team.ID || ""}/>
          <Item name="Name" value={this.state.team.Name}/>
          <Item name="POC" value={this.state.team.POC}/>
          <Item name="Email" type="email" value={this.state.team.Email}/>
          <Item name="Enabled" type="checkbox" checked={!!this.state.team.Enabled}/>
          <br />
          <details>
            <summary>Key</summary>
            <ul>
              <li>
                {this.state.team.Key}
                <button type="button" onClick={this.regenKey.bind(this)}>Regenerate</button>
              </li>
            </ul>
          </details>
          <br />
          <div>
            <button type="submit">Save</button>
            <button class="right" type="button" disabled={!this.state.team.ID} onClick={this.deleteTeam.bind(this, this.state.team.ID)}>Delete</button>
          </div>
        </form>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <button type="button" onClick={this.newTeam.bind(this)}>New Team</button>
        <hr />
        {content}
      </React.Fragment>
    );
  }
}

class Scenarios extends React.Component {
  constructor() {
    super();
    this.state = {
      scenarios: [],
      showModal: false,
      selectedScenario: {}
    }
    this.modal = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCallback = this.handleCallback.bind(this);
    this.mapItems = this.mapItems.bind(this);
    this.listItems = this.listItems.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    this.populateScenarios();
  }

  populateScenarios() {
    var url = '/scenarios';
  
    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then(function(data) {
      this.setState({scenarios: data})
    }.bind(this));
  }

  createScenario() {
    this.setState({
      selectedScenarioID: null,
      selectedScenario: {Enabled: true}
    });
    this.toggleModal();
  }

  editScenario(id) {
    let url = "/scenarios/" + id;

    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json()
    })
    .then(function(data) {
      this.setState({
        selectedScenarioID: id,
        selectedScenario: data
      });
      this.toggleModal();
    }.bind(this));
  }

  deleteScenario(id) {
    var url = "/scenarios/" + id;

    fetch(url, {
      credentials: 'same-origin',
      method: 'DELETE'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      this.populateScenarios();
    }.bind(this));
  }

  handleSubmit() {
    this.populateScenarios();
    this.toggleModal();
  }

  toggleModal() {
    this.setState({
      showModal: !this.state.showModal
    })
  }

  handleCallback(key, value) {
    this.modal.current.setValue(key, value);
  }

  mapItems(callback) {
    var url = "/hosts";

    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json()
    }.bind(this))
    .then(function(data) {
      let items = data.map(function(host) {
        return {
          ID: host.ID,
          Display: host.Hostname
        }
      });
      callback(items);
    });
  };

  listItems(callback) {
    var url = "/templates";

    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json()
    }.bind(this))
    .then(function(data) {
      let items = data.map(function(template) {
        return {
          ID: template.ID,
          Display: template.Name
        }
      });
      callback(items);
    });
  };

  render() {
    let rows = [];
    for (let i = 0; i < this.state.scenarios.length; i++) {
      let scenario = this.state.scenarios[i];
      rows.push(
        <li key={scenario.ID}>
          {scenario.Name}
          <button type="button" onClick={this.editScenario.bind(this, scenario.ID)}>Edit</button>
          <button type="button" onClick={this.deleteScenario.bind(this, scenario.ID)}>-</button>
        </li>
      );
    }

    return (
      <div className="Scenarios">
        <strong>Scenarios</strong>
        <p />
        <button onClick={this.createScenario.bind(this)}>Add Scenario</button>
        <BasicModal ref={this.modal} subjectClass="scenarios" subjectID={this.state.selectedScenarioID} subject={this.state.selectedScenario} show={this.state.showModal} onClose={this.toggleModal} submit={this.handleSubmit}>
          <Item name="Name" defaultValue={this.state.selectedScenario.Name}/>
          <Item name="Description" defaultValue={this.state.selectedScenario.Description}/>
          <Item name="Enabled" type="checkbox" defaultChecked={!!this.state.selectedScenario.Enabled}/>
          <ItemMap name="HostTemplates" label="Hosts" listLabel="Templates" defaultValue={this.state.selectedScenario.HostTemplates} callback={this.handleCallback} mapItems={this.mapItems} listItems={this.listItems}/>
        </BasicModal>
        <ul>{rows}</ul>
      </div>
    );
  }
}

class Hosts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hosts: []
    };
  }

  componentDidMount() {
    this.populateHosts();
  }

  componentWillReceiveProps(_) {
    this.populateHosts();
  }

  populateHosts() {
    var url = '/hosts';
  
    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then(function(data) {
      this.setState({hosts: data})
    }.bind(this));
  }

  render() {
    let rows = [];
    for (let i = 0; i < this.state.hosts.length; i++) {
      let host = this.state.hosts[i];
      rows.push(
        <li key={host.ID}>
          <a href={"#hosts/" + host.ID}>{host.Hostname} - {host.OS}</a>
        </li>
      );
    }
  
    return (
      <div className="Hosts">
        <strong>Hosts</strong>
        <ul>{rows}</ul>
      </div>
    );
  }
}

class HostEntry extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      host: {}
    }
  }

  componentDidMount() {
    this.getHost(this.props.id);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.id != newProps.id) {
      this.getHost(newProps.id);
    }
  }

  newHost() {
    window.location.href = "#hosts";
    this.setState({
      host: {
        Hostname: "",
        OS: ""
      }
    });
  }

  getHost(id) {
    if (id === null || id === undefined) {
      return;
    }

    let url = "/hosts/" + id;

    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json()
    })
    .then(function(data) {
      this.setState({
        host: data
      });
    }.bind(this));
  }

  updateHost(event) {
    let value = event.target.value;
    if (event.target.type == 'checkbox') {
      value = event.target.checked;
    }
    this.setState({
      host: {
        ...this.state.host,
        [event.target.name]: value
      }
    })
  }

  saveHost(event) {
    event.preventDefault();

    var url = "/hosts";
    if (this.state.host.ID != null) {
      url += "/" + this.state.host.ID;
    }

    fetch(url, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.host)
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      this.props.updateCallback();
      if (this.state.host.ID === null || this.state.host.ID === undefined) {
        // for new hosts, response should be host ID
        response.text().then(function(id) {
          window.location.href = "#hosts/" + id;
        });
      }
    }.bind(this));
  }

  deleteHost(id) {
    var url = "/hosts/" + id;

    fetch(url, {
      credentials: 'same-origin',
      method: 'DELETE'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      this.props.updateCallback();
      this.setState({
        host: {}
      })
      window.location.href = "#hosts";
    }.bind(this));
  }

  render() {
    let content = null;
    if (Object.entries(this.state.host).length != 0) {
      content = (
        <React.Fragment>
          <form onChange={this.updateHost.bind(this)} onSubmit={this.saveHost.bind(this)}>
          <label htmlFor="ID">ID</label>
          <input disabled value={this.state.host.ID || ""}/>
          <Item name="Hostname" type="text" value={this.state.host.Hostname}/>
          <Item name="OS" type="text" value={this.state.host.OS}/>
          <br />
          <div>
            <button type="submit">Save</button>
            <button class="right" type="button" disabled={!this.state.host.ID} onClick={this.deleteHost.bind(this, this.state.host.ID)}>Delete</button>
          </div>
        </form>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <button type="button" onClick={this.newHost.bind(this)}>New Host</button>
        <hr />
        {content}
      </React.Fragment>
    );
  }
}

class Templates extends React.Component {
  constructor() {
    super();
    this.state = {
      templates: [],
      showModal: false,
      selectedTemplate: {
        State: {}
      }
    };
    this.modal = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCallback = this.handleCallback.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    this.populateTemplates();
  }

  populateTemplates() {
    var url = "/templates";
  
    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then(function(data) {
      this.setState({templates: data})
    }.bind(this));
  }

  createTemplate() {
    this.setState({
      selectedTemplateID: null,
      selectedTemplate: {
        State: {}
      }
    });
    this.toggleModal();
  }

  editTemplate(id) {
    let url = "/templates/" + id;

    fetch(url, {
      credentials: 'same-origin'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json()
    })
    .then(function(data) {
      this.setState({
        selectedTemplateID: id,
        selectedTemplate: data
      });
      this.toggleModal();
    }.bind(this));
  }

  deleteTemplate(id) {
    var url = "/templates/" + id;

    fetch(url, {
      credentials: 'same-origin',
      method: 'DELETE'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      this.populateTemplates();
    }.bind(this));
  }

  handleSubmit() {
    this.populateTemplates();
    this.toggleModal();
  }

  toggleModal() {
    this.setState({
      showModal: !this.state.showModal
    })
  }

  handleCallback(key, value) {
    let state = {
      ...this.state.selectedTemplate.State,
      [key]: value
    }
    this.setState({
      selectedTemplate: {
        ...this.state.selectedTemplate,
        State: state
      }
    })
    this.modal.current.setValue("State", state);
  }

  render() {
    let rows = [];
    for (let i = 0; i < this.state.templates.length; i++) {
      let template = this.state.templates[i];
      rows.push(
        <li key={template.ID}>
          {template.Name}
          <button type="button" onClick={this.editTemplate.bind(this, template.ID)}>Edit</button>
          <button type="button" onClick={this.deleteTemplate.bind(this, template.ID)}>-</button>
        </li>
      );
    }

    return (
      <div className="Templates">
        <strong>Templates</strong>
        <p />
        <button onClick={this.createTemplate.bind(this)}>Add Template</button>
        <BasicModal ref={this.modal} subjectClass="templates" subjectID={this.state.selectedTemplateID} subject={this.state.selectedTemplate} show={this.state.showModal} onClose={this.toggleModal} submit={this.handleSubmit}>
          <Item name="Name" type="text" defaultValue={this.state.selectedTemplate.Name}/>
          <Users users={this.state.selectedTemplate.State.Users} callback={this.handleCallback}/>
          <Groups groups={this.state.selectedTemplate.State.Groups} callback={this.handleCallback}/>
          <Processes processes={this.state.selectedTemplate.State.Processes} callback={this.handleCallback}/>
          <Software software={this.state.selectedTemplate.State.Software} callback={this.handleCallback}/>
          <NetworkConnections conns={this.state.selectedTemplate.State.NetworkConnections} callback={this.handleCallback}/>
        </BasicModal>
        <ul>{rows}</ul>
      </div>
    );
  }
}

class ObjectState extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <React.Fragment>
        <label>State</label>
        <select value={this.props.value} onChange={this.props.onChange}>
          <option>Add</option>
          <option>Keep</option>
          <option>Remove</option>
        </select>
      </React.Fragment>
    )
  }
}

class Users extends React.Component {
  constructor(props) {
    super(props);

    let users = props.users;
    if (users === undefined || users === null) {
      users = [];
    }
    this.state = {
      users: users
    }

    this.addUser = this.addUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
  }

  addUser() {
    let empty = {
      Name: "",
      ObjectState: "Keep",
      AccountActive: true,
      PasswordExpires: true,
      // unix timestamp in seconds
      PasswordLastSet: Math.trunc(Date.now() / 1000)
    };
    let users = [
      ...this.state.users,
      empty
    ];
    this.setState({
      users: users
    });
    this.props.callback("Users", users)
  }

  removeUser(id) {
    let users = this.state.users.filter(function(_, index) {
      return index != id;
    });
    this.setState({
      users: users
    });
    this.props.callback("Users", users);
  }

  updateUser(id, field, event) {
    let updated = this.state.users;
    let value = event.target.value;
    if (event.target.type === "checkbox") {
      if (event.target.checked) {
        value = true;
      }
      else {
        value = false;
      }
    }
    if (event.target.type === "date") {
      value = Math.trunc(new Date(event.target.value).getTime() / 1000);
      if (Number.isNaN(value)) {
        return
      }
    }
    updated[id] = {
      ...updated[id],
      [field]: value
    }
    this.setState({
      users: updated
    })
    this.props.callback("Users", updated);
  }

  render() {
    let users = [];
    for (let i = 0; i < this.state.users.length; i++) {
      let user = this.state.users[i];
      let d = new Date(user.PasswordLastSet * 1000)
      let passwordLastSet = ("000" + d.getUTCFullYear()).slice(-4);
      passwordLastSet += "-";
      passwordLastSet += ("0" + (d.getUTCMonth() + 1)).slice(-2);
      passwordLastSet += "-";
      passwordLastSet += ("0" + d.getUTCDate()).slice(-2);
      let userOptions = null;
      if (user.ObjectState != "Remove") {
        userOptions = (
          <React.Fragment>
            <li>
              <label>Active</label>
              <input type="checkbox" checked={user.AccountActive} onChange={event=> this.updateUser(i, "AccountActive", event)}/>
            </li>
            <li>
              <label>Password Expires</label>
              <input type="checkbox" checked={user.PasswordExpires} onChange={event=> this.updateUser(i, "PasswordExpires", event)}/>
            </li>
            <li>
              <label>Password Last Set</label>
              <input type="date" value={passwordLastSet} onChange={event=> this.updateUser(i, "PasswordLastSet", event)}/>
            </li>
          </React.Fragment>
        );
      }
      users.push(
        <details key={i}>
          <summary>{user.Name}</summary>
          <button type="button" onClick={this.removeUser.bind(this, i)}>-</button>
          <ul>
            <li>
              <label>Name</label>
              <input type="text" value={user.Name} onChange={event=> this.updateUser(i, "Name", event)}/>
            </li>
            <li>
              <ObjectState value={user.ObjectState} onChange={event=> this.updateUser(i, "ObjectState", event)} />
            </li>
            {userOptions}
          </ul>
        </details>
      );
    }

    return (
      <details>
        <summary>Users</summary>
        <button type="button" onClick={this.addUser.bind(this)}>Add User</button>
        <ul>
          {users}
        </ul>
      </details>
    )
  }
}

class Groups extends React.Component {
  constructor(props) {
    super(props);
    
    let groups = props.groups;
    if (groups === undefined || groups === null) {
      groups = {};
    }
    this.state = {
      groups: groups
    }

    this.newGroupName = React.createRef();

    this.addGroup = this.addGroup.bind(this);
    this.addGroupMember = this.addGroupMember.bind(this);
    this.removeGroup = this.removeGroup.bind(this);
    this.removeGroupMember = this.removeGroupMember.bind(this);
    this.updateGroupMember = this.updateGroupMember.bind(this);
  }

  addGroup() {
    if (this.newGroupName.current === null) {
      return;
    }
    let groups = {
      ...this.state.groups,
      [this.newGroupName.current.value]: []
    };
    this.setState({
      groups: groups
    });
    this.props.callback("Groups", groups)
  }

  addGroupMember(groupName) {
    let group = this.state.groups[groupName];
    group.push({
      Name: "",
      ObjectState: "Keep"
    });
    let groups = {
      ...this.state.groups,
      [groupName]: group
    }
    this.setState({
      groups: groups
    })
    this.props.callback("Groups", groups)
  }

  removeGroup(groupName) {
    let groups = this.state.groups;
    delete groups[groupName];
    this.setState({
      groups: groups
    });
    this.props.callback("Groups", groups);
  }

  removeGroupMember(groupName, memberIndex) {
    let group = this.state.groups[groupName];
    group.splice(memberIndex, 1);
    let groups = {
      ...this.state.groups,
      [groupName]: group
    }
    this.setState({
      groups: groups
    });
    this.props.callback("Groups", groups);
  }

  updateGroupMember(groupName, memberIndex, key, value) {
    let group = this.state.groups[groupName];
    let member = group[memberIndex];
    member[key] = value
    let groups = {
      ...this.state.groups,
      [groupName]: group
    }
    this.setState({
      groups: groups
    });
    this.props.callback("Groups", groups);
  }

  render() {
    let groups = [];
    for (let groupName in this.state.groups) {
      let groupMembers = [];
      for (let i in this.state.groups[groupName]) {
        let member = this.state.groups[groupName][i];
        groupMembers.push(
          <details key={i}>
            <summary>{member.Name}</summary>
            <button type="button" onClick={this.removeGroupMember.bind(this, groupName, i)}>-</button>
            <ul>
              <li>
                <label>Name</label>
                <input type="text" value={member.Name} onChange={event=> this.updateGroupMember(groupName, i, "Name", event.target.value)}/>
              </li>
              <li>
                <ObjectState value={member.ObjectState} onChange={event=> this.updateGroupMember(groupName, i, "ObjectState", event.target.value)} />
              </li>
            </ul>
          </details>
        );
      }
      groups.push(
        <details key={groupName}>
          <summary>{groupName}</summary>
          <button type="button" onClick={this.removeGroup.bind(this, groupName)}>Remove Group</button>
          <br />
          <button type="button" onClick={event => this.addGroupMember(groupName, event)}>Add Group Member</button>
          <ul>
            {groupMembers}
          </ul>
        </details>
      );
    }

    return (
      <details>
        <summary>Groups</summary>
        <input ref={this.newGroupName}></input>
        <button type="button" onClick={this.addGroup.bind(this)}>Add Group</button>
        <ul>
          {groups}
        </ul>
      </details>
    )
  }
}

class Processes extends React.Component {
  constructor(props) {
    super(props);
    
    let processes = props.processes;
    if (processes === undefined || processes === null) {
      processes = [];
    }
    this.state = {
      processes: processes
    }

    this.addProcess = this.addProcess.bind(this);
    this.removeProcess = this.removeProcess.bind(this);
    this.updateProcess = this.updateProcess.bind(this);
  }

  addProcess() {
    let empty = {
      CommandLine: "",
      ObjectState: "Keep"
    };
    let processes = [
      ...this.state.processes,
      empty
    ];
    this.setState({
      processes: processes
    });
    this.props.callback("Processes", processes)
  }

  removeProcess(id) {
    let processes = this.state.processes.filter(function(_, index) {
      return index != id;
    });
    this.setState({
      processes: processes
    });
    this.props.callback("Processes", processes);
  }

  updateProcess(id, field, event) {
    let updated = this.state.processes;
    let value = event.target.value;
    updated[id] = {
      ...updated[id],
      [field]: value
    }
    this.setState({
      processes: updated
    })
    this.props.callback("Processes", updated);
  }

  render() {
    let processes = [];
    for (let i in this.state.processes) {
      let entry = this.state.processes[i];
      processes.push(
        <details key={i}>
          <summary>{entry.CommandLine}</summary>
          <button type="button" onClick={this.removeProcess.bind(this, i)}>-</button>
          <ul>
            <li>
              <label>Command line</label>
              <input type="text" value={entry.CommandLine} onChange={event=> this.updateProcess(i, "CommandLine", event)}></input>
            </li>
            <li>
              <ObjectState value={entry.ObjectState} onChange={event=> this.updateProcess(i, "ObjectState", event)} />
            </li>
          </ul>
        </details>
      );
    }

    return (
      <details>
        <summary>Processes</summary>
        <button type="button" onClick={this.addProcess.bind(this)}>Add Process</button>
        <ul>
          {processes}
        </ul>
      </details>
    )
  }
}

class Software extends React.Component {
  constructor(props) {
    super(props);
    
    let software = props.software;
    if (software === undefined || software === null) {
      software = [];
    }
    this.state = {
      software: software
    }

    this.addSoftware = this.addSoftware.bind(this);
    this.removeSoftware = this.removeSoftware.bind(this);
    this.updateSoftware = this.updateSoftware.bind(this);
  }

  addSoftware() {
    let empty = {
      Name: "",
      Version: "",
      ObjectState: "Keep"
    };
    let software = [
      ...this.state.software,
      empty
    ];
    this.setState({
      software: software
    });
    this.props.callback("Software", software)
  }

  removeSoftware(id) {
    let software = this.state.software.filter(function(_, index) {
      return index != id;
    });
    this.setState({
      software: software
    });
    this.props.callback("Software", software);
  }

  updateSoftware(id, field, event) {
    let updated = this.state.software;
    let value = event.target.value;
    updated[id] = {
      ...updated[id],
      [field]: value
    }
    this.setState({
      software: updated
    })
    this.props.callback("Software", updated);
  }

  render() {
    let software = [];
    for (let i in this.state.software) {
      let entry = this.state.software[i];
      software.push(
        <details key={i}>
          <summary>{entry.Name}</summary>
          <button type="button" onClick={this.removeSoftware.bind(this, i)}>-</button>
          <ul>
            <li>
              <label>Name</label>
              <input type="text" value={entry.Name} onChange={event=> this.updateSoftware(i, "Name", event)}></input>
            </li>
            <li>
              <label>Version</label>
              <input type="text" value={entry.Version} onChange={event=> this.updateSoftware(i, "Version", event)}></input>
            </li>
            <li>
              <ObjectState value={entry.ObjectState} onChange={event=> this.updateSoftware(i, "ObjectState", event)} />
            </li>
          </ul>
        </details>
      );
    }

    return (
      <details>
        <summary>Software</summary>
        <button type="button" onClick={this.addSoftware.bind(this)}>Add Software</button>
        <ul>
          {software}
        </ul>
      </details>
    )
  }
}

class NetworkConnections extends React.Component {
  constructor(props) {
    super(props);
    
    let conns = props.conns;
    if (conns === undefined || conns === null) {
      conns = [];
    }
    this.state = {
      conns: conns
    }

    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.update = this.update.bind(this);
  }

  add() {
    let empty = {
      Protocol: "",
      LocalAddress: "",
      LocalPort: "",
      RemoteAddress: "",
      RemotePort: "",
      ObjectState: "Keep"
    };
    let conns = [
      ...this.state.conns,
      empty
    ];
    this.setState({
      conns: conns
    });
    this.props.callback("NetworkConnections", conns)
  }

  remove(id) {
    let conns = this.state.conns.filter(function(_, index) {
      return index != id;
    });
    this.setState({
      conns: conns
    });
    this.props.callback("NetworkConnections", conns);
  }

  update(id, field, event) {
    let updated = this.state.conns;
    let value = event.target.value;
    updated[id] = {
      ...updated[id],
      [field]: value
    }
    this.setState({
      conns: updated
    })
    this.props.callback("NetworkConnections", updated);
  }

  render() {
    let conns = [];
    for (let i in this.state.conns) {
      let entry = this.state.conns[i];
      conns.push(
        <details key={i}>
          <summary>{entry.Protocol} {entry.LocalAddress} {entry.LocalPort} {entry.RemoteAddress} {entry.RemotePort}</summary>
          <button type="button" onClick={this.remove.bind(this, i)}>-</button>
          <ul>
            <li>
              <label>Protocol</label>
              <select value={entry.Protocol} onChange={event=> this.update(i, "Protocol", event)}>
                <option value=""></option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
              </select>
            </li>
            <li>
              <label>Local Address</label>
              <input type="text" value={entry.LocalAddress} onChange={event=> this.update(i, "LocalAddress", event)}></input>
            </li>
            <li>
              <label>Local Port</label>
              <input type="text" value={entry.LocalPort} onChange={event=> this.update(i, "LocalPort", event)}></input>
            </li>
            <li>
              <label>Remote Address</label>
              <input type="text" value={entry.RemoteAddress} onChange={event=> this.update(i, "RemoteAddress", event)}></input>
            </li>
            <li>
              <label>Remote Port</label>
              <input type="text" value={entry.RemotePort} onChange={event=> this.update(i, "RemotePort", event)}></input>
            </li>
            <li>
              <ObjectState value={entry.ObjectState} onChange={event=> this.update(i, "ObjectState", event)} />
            </li>
          </ul>
        </details>
      );
    }

    return (
      <details>
        <summary>Network Connections</summary>
        <button type="button" onClick={this.add.bind(this)}>Add Network Connection</button>
        <ul>
          {conns}
        </ul>
      </details>
    )
  }
}

class Item extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <label htmlFor={this.props.name}>{this.props.name}</label>
        <input name={this.props.name} type={this.props.type} value={this.props.value} checked={this.props.checked}></input>
      </div>
    )
  }
}

class ItemMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item: "",
      value: this.props.defaultValue,
      mapItems: [],
      listItems: []
    }

    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCallback = this.handleCallback.bind(this);
  }

  handleChange(event) {
    let value = Number(event.target.value)
    this.setState({
      item: value
    });
  }

  handleCallback(key, value) {
    let v = {
      ...this.state.value,
      [key]: value
    };
    this.setState({
      value: v
    });
    this.props.callback(this.props.name, v);
  }

  add() {
    if (!this.state.item) {
      return;
    }
    if (this.state.value && this.state.value[this.state.item] != null) {
      return;
    }

    let value = {
      ...this.state.value,
      [this.state.item]: []
    }
    this.setState({
      item: "",
      value: value
    })
    this.props.callback(this.props.name, value);
  }

  remove(id) {
    if (this.state.value == null) {
      return;
    }

    let value = {
      ...this.state.value,
      [id]: undefined
    }
    this.setState({
      value: value
    });
    this.props.callback(this.props.name, value);
  }

  componentWillMount() {
    this.props.mapItems((items) => {
      this.setState({
        mapItems: items
      });
    });
    this.props.listItems((items) => {
      this.setState({
        listItems: items
      });
    });
  }

  render() {
    let rows = [];
    if (this.state.value) {
      for (let i in this.state.value) {
        if (this.state.value[i] === undefined) {
          continue;
        }
        let text = i;
        let matches = this.state.mapItems.filter((obj) => {
          return obj.ID == i;
        });
        if (matches.length > 0) {
          text = matches[0].Display;
        }
        rows.push(
          <details key={i}>
            <summary>{text}</summary>
            <button type="button" onClick={this.remove.bind(this, i)}>-</button>
            <ul>
              <ItemList name={i} label={this.props.listLabel} type="select" listItems={this.state.listItems} defaultValue={this.state.value[i]} callback={this.handleCallback}/>
            </ul>
          </details>
        );
      }
    }

    let optionsMap = [];
    // empty selection
    optionsMap.push(
      <option disabled key="" value="">
      </option>
    );
    for (let i in this.state.mapItems) {
      let option = this.state.mapItems[i];
      // skip already selected
      if (this.state.value && this.state.value[option.ID] != null) {
        continue;
      }
      optionsMap.push(
        <option key={option.ID} value={option.ID}>
          {option.Display}
        </option>
      );
    }

    return (
      <div>
        <label>{this.props.label}</label>
        <ul>
          {rows}
          <select value={this.state.item} onChange={this.handleChange}>{optionsMap}</select>
          <button type="button" onClick={this.add}>+</button>
        </ul>
      </div>
    );
  }
}

class ItemList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item: "",
      value: this.props.defaultValue
    }

    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    let value = event.target.value;
    if (this.props.type === "select") {
      value = Number(value);
    }
    this.setState({
      item: value
    });
  }

  add() {
    if (!this.state.item) {
      return;
    }
    if (this.state.value && this.state.value.includes(this.state.item)) {
      return;
    }

    let value = null;
    if (this.state.value == null) {
      value = [this.state.item];
    }
    else  {
      value = [...this.state.value, this.state.item];
    }
    this.setState({
      item: "",
      value: value
    })
    this.props.callback(this.props.name, value);
  }

  remove(id) {
    if (this.state.value == null) {
      return;
    }

    let value = this.state.value.filter(function(_, index) {
      return index != id;
    });
    this.setState({
      value: value
    });
    this.props.callback(this.props.name, value);
  }

  render() {
    let rows = [];
    if (this.state.value) {
      for (let i in this.state.value) {
        let text = this.state.value[i];
        if (this.props.type === "select") {
          let matches = this.props.listItems.filter((obj) => {
            return obj.ID == text;
          });
          if (matches.length > 0) {
            text = matches[0].Display;
          }
        }
        rows.push(
          <li key={i}>
            {text}
            <button type="button" onClick={this.remove.bind(this, i)}>-</button>
          </li>
        );
      }
    }

    let input = (
      <input type={this.props.type} value={this.state.item} onChange={this.handleChange}></input>
    );
    if (this.props.type === "select") {
      let optionsList = [];
      // empty selection
      optionsList.push(
        <option disabled key="" value="">
        </option>
      );
      for (let i in this.props.listItems) {
        let option = this.props.listItems[i];
        // skip already selected
        if (this.state.value && this.state.value.indexOf(option.ID) != -1) {
          continue;
        }
        optionsList.push(
          <option key={option.ID} value={option.ID}>
            {option.Display}
          </option>
        );
      }
      input = (
        <select value={this.state.item} onChange={this.handleChange}>{optionsList}</select>
      );
    }

    return (
      <details>
        <summary>{this.props.label}</summary>
        <ul>
          {rows}
          {input}
          <button type="button" onClick={this.add}>+</button>
        </ul>
      </details>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));