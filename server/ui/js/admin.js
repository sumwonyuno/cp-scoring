'use strict';

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const Plot = createPlotlyComponent(Plotly);

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      authenticated: false
    };
    this.authCallback = this.authCallback.bind(this);
    this.logout = this.logout.bind(this);
  }

  authCallback(statusCode) {
    if (statusCode == 200) {
      this.setState({
        authenticated: true
      });
    } else {
      this.setState({
        authenticated: false
      });
    }
  }

  logout() {
    let url = "/logout";
    fetch(url, {
      credentials: 'same-origin',
      method: "DELETE"
    }).then(function (_) {
      this.setState({
        authenticated: false
      });
    }.bind(this));
  }

  componentDidMount() {
    // check if logged in by visiting the following URL
    let url = "/templates";
    fetch(url, {
      credentials: 'same-origin'
    }).then(function (response) {
      this.authCallback(response.status);
    }.bind(this));
  }

  render() {
    if (!this.state.authenticated) {
      return React.createElement("div", {
        className: "App"
      }, React.createElement(Login, {
        callback: this.authCallback
      }));
    }

    return React.createElement("div", {
      className: "App"
    }, React.createElement("button", {
      onClick: this.logout
    }, "Logout"), React.createElement("p", null), React.createElement(Teams, null), React.createElement(Hosts, null), React.createElement(Templates, null), React.createElement(Scenarios, null));
  }

}

class Login extends React.Component {
  constructor() {
    super();
    this.state = {
      username: "",
      password: "",
      messages: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    let value = event.target.value;
    this.setState(_objectSpread({}, this.state.credentials, {
      [event.target.name]: value
    }));
  }

  handleSubmit(event) {
    event.preventDefault();

    if (this.state.username.length == 0 || this.state.password.length == 0) {
      return;
    }

    var url = "/login";
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: "username=" + this.state.username + "&password=" + this.state.password
    }).then(function (response) {
      this.props.callback(response.status);

      if (response.status >= 400) {
        this.setState({
          messages: "Rejected login. Try again."
        });
      }
    }.bind(this));
  }

  render() {
    return React.createElement("div", {
      className: "login"
    }, this.state.messages, React.createElement("form", {
      onChange: this.handleChange,
      onSubmit: this.handleSubmit
    }, React.createElement("label", {
      htmlFor: "username"
    }, "Username"), React.createElement("input", {
      name: "username",
      required: "required"
    }), React.createElement("br", null), React.createElement("label", {
      htmlFor: "password"
    }, "Password"), React.createElement("input", {
      name: "password",
      type: "password",
      required: "required"
    }), React.createElement("br", null), React.createElement("button", {
      type: "submit"
    }, "Submit")));
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
};
const modalStyle = {
  backgroundColor: 'white',
  padding: 30,
  maxHeight: '100%',
  overflowY: 'auto'
};

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
    };
  }

  setValue(key, value) {
    this.setState({
      subject: _objectSpread({}, this.props.subject, this.state.subject, {
        [key]: value
      })
    });
  }

  handleChange(event) {
    let value = event.target.value;

    if (event.target.type == 'checkbox') {
      value = event.target.checked;
    }

    this.setState({
      subject: _objectSpread({}, this.props.subject, this.state.subject, {
        [event.target.name]: value
      })
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
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.subject)
    }).then(function (response) {
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

    return React.createElement("div", {
      className: "background",
      style: backgroundStyle
    }, React.createElement("div", {
      className: "modal",
      style: modalStyle
    }, React.createElement("label", {
      htmlFor: "ID"
    }, "ID"), React.createElement("input", {
      name: "ID",
      defaultValue: this.props.subjectID,
      disabled: true
    }), React.createElement("br", null), React.createElement("form", {
      onChange: this.handleChange,
      onSubmit: this.handleSubmit
    }, this.props.children, React.createElement("br", null), React.createElement("button", {
      type: "submit"
    }, "Submit"), React.createElement("button", {
      type: "button",
      onClick: this.handleClose
    }, "Cancel"))));
  }

}

class Teams extends React.Component {
  constructor() {
    super();
    this.state = {
      teams: [],
      showModal: false,
      selectedTeamID: null,
      selectedTeam: {}
    };
    this.modal = React.createRef();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.regenKey = this.regenKey.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    this.populateTeams();
  }

  populateTeams() {
    var url = '/teams';
    fetch(url).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    }).then(function (data) {
      this.setState({
        teams: data
      });
    }.bind(this));
  }

  newKey() {
    return Math.random().toString(16).substring(7);
  }

  createTeam() {
    this.setState({
      selectedTeamID: null,
      selectedTeam: {
        Enabled: true,
        Key: this.newKey()
      }
    });
    this.toggleModal();
  }

  editTeam(id) {
    let url = "/teams/" + id;
    fetch(url).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    }).then(function (data) {
      this.setState({
        selectedTeamID: id,
        selectedTeam: data
      });
      this.toggleModal();
    }.bind(this));
  }

  deleteTeam(id) {
    var url = "/teams/" + id;
    fetch(url, {
      method: 'DELETE'
    }).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      this.populateTeams();
    }.bind(this));
  }

  handleSubmit() {
    this.populateTeams();
    this.toggleModal();
  }

  toggleModal() {
    this.setState({
      showModal: !this.state.showModal
    });
  }

  regenKey() {
    let key = this.newKey();
    this.setState({
      selectedTeam: _objectSpread({}, this.state.selectedTeam, {
        Key: key
      })
    });
    this.modal.current.setValue("Key", key);
  }

  render() {
    let rows = [];

    for (let i = 0; i < this.state.teams.length; i++) {
      let team = this.state.teams[i];
      rows.push(React.createElement("li", {
        key: team.ID
      }, team.Name, React.createElement("button", {
        type: "button",
        onClick: this.editTeam.bind(this, team.ID)
      }, "Edit"), React.createElement("button", {
        type: "button",
        onClick: this.deleteTeam.bind(this, team.ID)
      }, "-")));
    }

    return React.createElement("div", {
      className: "Teams"
    }, React.createElement("strong", null, "Teams"), React.createElement("p", null), React.createElement("button", {
      onClick: this.createTeam.bind(this)
    }, "Add Team"), React.createElement(BasicModal, {
      ref: this.modal,
      subjectClass: "teams",
      subjectID: this.state.selectedTeamID,
      subject: this.state.selectedTeam,
      show: this.state.showModal,
      onClose: this.toggleModal,
      submit: this.handleSubmit
    }, React.createElement(Item, {
      name: "Name",
      defaultValue: this.state.selectedTeam.Name
    }), React.createElement(Item, {
      name: "POC",
      defaultValue: this.state.selectedTeam.POC
    }), React.createElement(Item, {
      name: "Email",
      type: "email",
      defaultValue: this.state.selectedTeam.Email
    }), React.createElement("label", {
      htmlFor: "Enabled"
    }, "Enabled"), React.createElement("input", {
      name: "Enabled",
      type: "checkbox",
      defaultChecked: !!this.state.selectedTeam.Enabled
    }), React.createElement("br", null), React.createElement("details", null, React.createElement("summary", null, "Key"), React.createElement("ul", null, React.createElement("li", null, this.state.selectedTeam.Key, React.createElement("button", {
      type: "button",
      onClick: this.regenKey.bind(this)
    }, "Regenerate"))))), React.createElement("ul", null, rows));
  }

}

class Scenarios extends React.Component {
  constructor() {
    super();
    this.state = {
      scenarios: [],
      showModal: false,
      selectedScenario: {}
    };
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
    fetch(url).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    }).then(function (data) {
      this.setState({
        scenarios: data
      });
    }.bind(this));
  }

  createScenario() {
    this.setState({
      selectedScenarioID: null,
      selectedScenario: {
        Enabled: true
      }
    });
    this.toggleModal();
  }

  editScenario(id) {
    let url = "/scenarios/" + id;
    fetch(url).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    }).then(function (data) {
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
      method: 'DELETE'
    }).then(function (response) {
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
    });
  }

  handleCallback(key, value) {
    this.modal.current.setValue(key, value);
  }

  mapItems(callback) {
    var url = "/hosts";
    fetch(url).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    }.bind(this)).then(function (data) {
      let items = data.map(function (host) {
        return {
          ID: host.ID,
          Display: host.Hostname
        };
      });
      callback(items);
    });
  }

  listItems(callback) {
    var url = "/templates";
    fetch(url).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    }.bind(this)).then(function (data) {
      let items = data.map(function (template) {
        return {
          ID: template.ID,
          Display: template.Name
        };
      });
      callback(items);
    });
  }

  render() {
    let rows = [];

    for (let i = 0; i < this.state.scenarios.length; i++) {
      let scenario = this.state.scenarios[i];
      rows.push(React.createElement("li", {
        key: scenario.ID
      }, scenario.Name, React.createElement("button", {
        type: "button",
        onClick: this.editScenario.bind(this, scenario.ID)
      }, "Edit"), React.createElement("button", {
        type: "button",
        onClick: this.deleteScenario.bind(this, scenario.ID)
      }, "-")));
    }

    return React.createElement("div", {
      className: "Scenarios"
    }, React.createElement("strong", null, "Scenarios"), React.createElement("p", null), React.createElement("button", {
      onClick: this.createScenario.bind(this)
    }, "Add Scenario"), React.createElement(BasicModal, {
      ref: this.modal,
      subjectClass: "scenarios",
      subjectID: this.state.selectedScenarioID,
      subject: this.state.selectedScenario,
      show: this.state.showModal,
      onClose: this.toggleModal,
      submit: this.handleSubmit
    }, React.createElement(Item, {
      name: "Name",
      defaultValue: this.state.selectedScenario.Name
    }), React.createElement(Item, {
      name: "Description",
      defaultValue: this.state.selectedScenario.Description
    }), React.createElement(Item, {
      name: "Enabled",
      type: "checkbox",
      defaultChecked: !!this.state.selectedScenario.Enabled
    }), React.createElement(ItemMap, {
      name: "HostTemplates",
      label: "Hosts",
      listLabel: "Templates",
      defaultValue: this.state.selectedScenario.HostTemplates,
      callback: this.handleCallback,
      mapItems: this.mapItems,
      listItems: this.listItems
    })), React.createElement("ul", null, rows));
  }

}

class Hosts extends React.Component {
  constructor() {
    super();
    this.state = {
      hosts: [],
      showModal: false,
      selectedHost: {}
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    this.populateHosts();
  }

  populateHosts() {
    var url = '/hosts';
    fetch(url).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    }).then(function (data) {
      this.setState({
        hosts: data
      });
    }.bind(this));
  }

  createHost() {
    this.setState({
      selectedHostID: null,
      selectedHost: {}
    });
    this.toggleModal();
  }

  editHost(id, host) {
    this.setState({
      selectedHostID: id,
      selectedHost: host
    });
    this.toggleModal();
  }

  deleteHost(id) {
    var url = "/hosts/" + id;
    fetch(url, {
      method: 'DELETE'
    }).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      this.populateHosts();
    }.bind(this));
  }

  handleSubmit() {
    this.populateHosts();
    this.toggleModal();
  }

  toggleModal() {
    this.setState({
      showModal: !this.state.showModal
    });
  }

  render() {
    let rows = [];

    for (let i = 0; i < this.state.hosts.length; i++) {
      let host = this.state.hosts[i];
      rows.push(React.createElement("li", {
        key: host.ID
      }, host.Hostname, " - ", host.OS, React.createElement("button", {
        type: "button",
        onClick: this.editHost.bind(this, host.ID, host)
      }, "Edit"), React.createElement("button", {
        type: "button",
        onClick: this.deleteHost.bind(this, host.ID)
      }, "-")));
    }

    return React.createElement("div", {
      className: "Hosts"
    }, React.createElement("strong", null, "Hosts"), React.createElement("p", null), React.createElement("button", {
      onClick: this.createHost.bind(this)
    }, "Add Host"), React.createElement(BasicModal, {
      subjectClass: "hosts",
      subjectID: this.state.selectedHostID,
      subject: this.state.selectedHost,
      show: this.state.showModal,
      onClose: this.toggleModal,
      submit: this.handleSubmit
    }, React.createElement(Item, {
      name: "Hostname",
      type: "text",
      defaultValue: this.state.selectedHost.Hostname
    }), React.createElement(Item, {
      name: "OS",
      type: "text",
      defaultValue: this.state.selectedHost.OS
    })), React.createElement("ul", null, rows));
  }

}

class Templates extends React.Component {
  constructor() {
    super();
    this.state = {
      templates: [],
      showModal: false,
      selectedTemplate: {
        Template: {}
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
    fetch(url).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    }).then(function (data) {
      this.setState({
        templates: data
      });
    }.bind(this));
  }

  createTemplate() {
    this.setState({
      selectedTemplateID: null,
      selectedTemplate: {
        Template: {}
      }
    });
    this.toggleModal();
  }

  editTemplate(id) {
    let url = "/templates/" + id;
    fetch(url).then(function (response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }

      return response.json();
    }).then(function (data) {
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
      method: 'DELETE'
    }).then(function (response) {
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
    });
  }

  handleCallback(key, value) {
    let template = _objectSpread({}, this.state.selectedTemplate.Template, {
      [key]: value
    });

    this.setState({
      selectedTemplate: _objectSpread({}, this.state.selectedTemplate, {
        Template: template
      })
    });
    this.modal.current.setValue("Template", template);
  }

  render() {
    let rows = [];

    for (let i = 0; i < this.state.templates.length; i++) {
      let template = this.state.templates[i];
      rows.push(React.createElement("li", {
        key: template.ID
      }, template.Name, React.createElement("button", {
        type: "button",
        onClick: this.editTemplate.bind(this, template.ID)
      }, "Edit"), React.createElement("button", {
        type: "button",
        onClick: this.deleteTemplate.bind(this, template.ID)
      }, "-")));
    }

    return React.createElement("div", {
      className: "Templates"
    }, React.createElement("strong", null, "Templates"), React.createElement("p", null), React.createElement("button", {
      onClick: this.createTemplate.bind(this)
    }, "Create Template"), React.createElement(BasicModal, {
      ref: this.modal,
      subjectClass: "templates",
      subjectID: this.state.selectedTemplateID,
      subject: this.state.selectedTemplate,
      show: this.state.showModal,
      onClose: this.toggleModal,
      submit: this.handleSubmit
    }, React.createElement(Item, {
      name: "Name",
      type: "text",
      defaultValue: this.state.selectedTemplate.Name
    }), React.createElement(Users, {
      users: this.state.selectedTemplate.Template.Users,
      callback: this.handleCallback
    }), React.createElement(Groups, {
      groups: this.state.selectedTemplate.Template.Groups,
      callback: this.handleCallback
    }), React.createElement(Processes, {
      processes: this.state.selectedTemplate.Template.Processes,
      callback: this.handleCallback
    }), React.createElement(Software, {
      software: this.state.selectedTemplate.Template.Software,
      callback: this.handleCallback
    }), React.createElement(NetworkConns, {
      conns: this.state.selectedTemplate.Template.NetworkConns,
      callback: this.handleCallback
    })), React.createElement("ul", null, rows));
  }

}

class ObjectState extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement(React.Fragment, null, React.createElement("label", null, "State"), React.createElement("select", {
      value: this.props.value,
      onChange: this.props.onChange
    }, React.createElement("option", null, "Add"), React.createElement("option", null, "Keep"), React.createElement("option", null, "Remove")));
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
    };
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
    let users = [...this.state.users, empty];
    this.setState({
      users: users
    });
    this.props.callback("Users", users);
  }

  removeUser(id) {
    let users = this.state.users.filter(function (_, index) {
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
      } else {
        value = false;
      }
    }

    if (event.target.type === "date") {
      value = Math.trunc(new Date(event.target.value).getTime() / 1000);

      if (Number.isNaN(value)) {
        return;
      }
    }

    updated[id] = _objectSpread({}, updated[id], {
      [field]: value
    });
    this.setState({
      users: updated
    });
    this.props.callback("Users", updated);
  }

  render() {
    let users = [];

    for (let i = 0; i < this.state.users.length; i++) {
      let user = this.state.users[i];
      let d = new Date(user.PasswordLastSet * 1000);
      let passwordLastSet = ("000" + d.getUTCFullYear()).slice(-4);
      passwordLastSet += "-";
      passwordLastSet += ("0" + (d.getUTCMonth() + 1)).slice(-2);
      passwordLastSet += "-";
      passwordLastSet += ("0" + d.getUTCDate()).slice(-2);
      let userOptions = null;

      if (user.ObjectState != "Remove") {
        userOptions = React.createElement(React.Fragment, null, React.createElement("li", null, React.createElement("label", null, "Active"), React.createElement("input", {
          type: "checkbox",
          checked: user.AccountActive,
          onChange: event => this.updateUser(i, "AccountActive", event)
        })), React.createElement("li", null, React.createElement("label", null, "Password Expires"), React.createElement("input", {
          type: "checkbox",
          checked: user.PasswordExpires,
          onChange: event => this.updateUser(i, "PasswordExpires", event)
        })), React.createElement("li", null, React.createElement("label", null, "Password Last Set"), React.createElement("input", {
          type: "date",
          value: passwordLastSet,
          onChange: event => this.updateUser(i, "PasswordLastSet", event)
        })));
      }

      users.push(React.createElement("details", {
        key: i
      }, React.createElement("summary", null, user.Name), React.createElement("button", {
        type: "button",
        onClick: this.removeUser.bind(this, i)
      }, "-"), React.createElement("ul", null, React.createElement("li", null, React.createElement("label", null, "Name"), React.createElement("input", {
        type: "text",
        value: user.Name,
        onChange: event => this.updateUser(i, "Name", event)
      })), React.createElement("li", null, React.createElement(ObjectState, {
        value: user.ObjectState,
        onChange: event => this.updateUser(i, "ObjectState", event)
      })), userOptions)));
    }

    return React.createElement("details", null, React.createElement("summary", null, "Users"), React.createElement("button", {
      type: "button",
      onClick: this.addUser.bind(this)
    }, "Add User"), React.createElement("ul", null, users));
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
    };
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

    let groups = _objectSpread({}, this.state.groups, {
      [this.newGroupName.current.value]: []
    });

    this.setState({
      groups: groups
    });
    this.props.callback("Groups", groups);
  }

  addGroupMember(groupName) {
    let group = this.state.groups[groupName];
    group.push({
      Name: "",
      ObjectState: "Keep"
    });

    let groups = _objectSpread({}, this.state.groups, {
      [groupName]: group
    });

    this.setState({
      groups: groups
    });
    this.props.callback("Groups", groups);
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

    let groups = _objectSpread({}, this.state.groups, {
      [groupName]: group
    });

    this.setState({
      groups: groups
    });
    this.props.callback("Groups", groups);
  }

  updateGroupMember(groupName, memberIndex, key, value) {
    let group = this.state.groups[groupName];
    let member = group[memberIndex];
    member[key] = value;

    let groups = _objectSpread({}, this.state.groups, {
      [groupName]: group
    });

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
        groupMembers.push(React.createElement("details", {
          key: i
        }, React.createElement("summary", null, member.Name), React.createElement("button", {
          type: "button",
          onClick: this.removeGroupMember.bind(this, groupName, i)
        }, "-"), React.createElement("ul", null, React.createElement("li", null, React.createElement("label", null, "Name"), React.createElement("input", {
          type: "text",
          value: member.Name,
          onChange: event => this.updateGroupMember(groupName, i, "Name", event.target.value)
        })), React.createElement("li", null, React.createElement(ObjectState, {
          value: member.ObjectState,
          onChange: event => this.updateGroupMember(groupName, i, "ObjectState", event.target.value)
        })))));
      }

      groups.push(React.createElement("details", {
        key: groupName
      }, React.createElement("summary", null, groupName), React.createElement("button", {
        type: "button",
        onClick: this.removeGroup.bind(this, groupName)
      }, "Remove Group"), React.createElement("br", null), React.createElement("button", {
        type: "button",
        onClick: event => this.addGroupMember(groupName, event)
      }, "Add Group Member"), React.createElement("ul", null, groupMembers)));
    }

    return React.createElement("details", null, React.createElement("summary", null, "Groups"), React.createElement("input", {
      ref: this.newGroupName
    }), React.createElement("button", {
      type: "button",
      onClick: this.addGroup.bind(this)
    }, "Add Group"), React.createElement("ul", null, groups));
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
    };
    this.addProcess = this.addProcess.bind(this);
    this.removeProcess = this.removeProcess.bind(this);
    this.updateProcess = this.updateProcess.bind(this);
  }

  addProcess() {
    let empty = {
      CommandLine: "",
      ObjectState: "Keep"
    };
    let processes = [...this.state.processes, empty];
    this.setState({
      processes: processes
    });
    this.props.callback("Processes", processes);
  }

  removeProcess(id) {
    let processes = this.state.processes.filter(function (_, index) {
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
    updated[id] = _objectSpread({}, updated[id], {
      [field]: value
    });
    this.setState({
      processes: updated
    });
    this.props.callback("Processes", updated);
  }

  render() {
    let processes = [];

    for (let i in this.state.processes) {
      let entry = this.state.processes[i];
      processes.push(React.createElement("details", {
        key: i
      }, React.createElement("summary", null, entry.CommandLine), React.createElement("button", {
        type: "button",
        onClick: this.removeProcess.bind(this, i)
      }, "-"), React.createElement("ul", null, React.createElement("li", null, React.createElement("label", null, "Command line"), React.createElement("input", {
        type: "text",
        value: entry.CommandLine,
        onChange: event => this.updateProcess(i, "CommandLine", event)
      })), React.createElement("li", null, React.createElement(ObjectState, {
        value: entry.ObjectState,
        onChange: event => this.updateProcess(i, "ObjectState", event)
      })))));
    }

    return React.createElement("details", null, React.createElement("summary", null, "Processes"), React.createElement("button", {
      type: "button",
      onClick: this.addProcess.bind(this)
    }, "Add Process"), React.createElement("ul", null, processes));
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
    };
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
    let software = [...this.state.software, empty];
    this.setState({
      software: software
    });
    this.props.callback("Software", software);
  }

  removeSoftware(id) {
    let software = this.state.software.filter(function (_, index) {
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
    updated[id] = _objectSpread({}, updated[id], {
      [field]: value
    });
    this.setState({
      software: updated
    });
    this.props.callback("Software", updated);
  }

  render() {
    let software = [];

    for (let i in this.state.software) {
      let entry = this.state.software[i];
      software.push(React.createElement("details", {
        key: i
      }, React.createElement("summary", null, entry.Name), React.createElement("button", {
        type: "button",
        onClick: this.removeSoftware.bind(this, i)
      }, "-"), React.createElement("ul", null, React.createElement("li", null, React.createElement("label", null, "Name"), React.createElement("input", {
        type: "text",
        value: entry.Name,
        onChange: event => this.updateSoftware(i, "Name", event)
      })), React.createElement("li", null, React.createElement("label", null, "Version"), React.createElement("input", {
        type: "text",
        value: entry.Version,
        onChange: event => this.updateSoftware(i, "Version", event)
      })), React.createElement("li", null, React.createElement(ObjectState, {
        value: entry.ObjectState,
        onChange: event => this.updateSoftware(i, "ObjectState", event)
      })))));
    }

    return React.createElement("details", null, React.createElement("summary", null, "Software"), React.createElement("button", {
      type: "button",
      onClick: this.addSoftware.bind(this)
    }, "Add Software"), React.createElement("ul", null, software));
  }

}

class NetworkConns extends React.Component {
  constructor(props) {
    super(props);
    let conns = props.conns;

    if (conns === undefined || conns === null) {
      conns = [];
    }

    this.state = {
      conns: conns
    };
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
    let conns = [...this.state.conns, empty];
    this.setState({
      conns: conns
    });
    this.props.callback("NetworkConns", conns);
  }

  remove(id) {
    let conns = this.state.conns.filter(function (_, index) {
      return index != id;
    });
    this.setState({
      conns: conns
    });
    this.props.callback("NetworkConns", conns);
  }

  update(id, field, event) {
    let updated = this.state.conns;
    let value = event.target.value;
    updated[id] = _objectSpread({}, updated[id], {
      [field]: value
    });
    this.setState({
      conns: updated
    });
    this.props.callback("NetworkConns", updated);
  }

  render() {
    let conns = [];

    for (let i in this.state.conns) {
      let entry = this.state.conns[i];
      conns.push(React.createElement("details", {
        key: i
      }, React.createElement("summary", null, entry.Protocol, " ", entry.LocalAddress, " ", entry.LocalPort, " ", entry.RemoteAddress, " ", entry.RemotePort), React.createElement("button", {
        type: "button",
        onClick: this.remove.bind(this, i)
      }, "-"), React.createElement("ul", null, React.createElement("li", null, React.createElement("label", null, "Protocol"), React.createElement("select", {
        value: entry.Protocol,
        onChange: event => this.update(i, "Protocol", event)
      }, React.createElement("option", {
        value: ""
      }), React.createElement("option", {
        value: "TCP"
      }, "TCP"), React.createElement("option", {
        value: "UDP"
      }, "UDP"))), React.createElement("li", null, React.createElement("label", null, "Local Address"), React.createElement("input", {
        type: "text",
        value: entry.LocalAddress,
        onChange: event => this.update(i, "LocalAddress", event)
      })), React.createElement("li", null, React.createElement("label", null, "Local Port"), React.createElement("input", {
        type: "text",
        value: entry.LocalPort,
        onChange: event => this.update(i, "LocalPort", event)
      })), React.createElement("li", null, React.createElement("label", null, "Remote Address"), React.createElement("input", {
        type: "text",
        value: entry.RemoteAddress,
        onChange: event => this.update(i, "RemoteAddress", event)
      })), React.createElement("li", null, React.createElement("label", null, "Remote Port"), React.createElement("input", {
        type: "text",
        value: entry.RemotePort,
        onChange: event => this.update(i, "RemotePort", event)
      })), React.createElement("li", null, React.createElement(ObjectState, {
        value: entry.ObjectState,
        onChange: event => this.update(i, "ObjectState", event)
      })))));
    }

    return React.createElement("details", null, React.createElement("summary", null, "Network Connections"), React.createElement("button", {
      type: "button",
      onClick: this.add.bind(this)
    }, "Add Network Connection"), React.createElement("ul", null, conns));
  }

}

class Item extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement("div", null, React.createElement("label", {
      htmlFor: this.props.name
    }, this.props.name), React.createElement("input", {
      name: this.props.name,
      type: this.props.type,
      defaultValue: this.props.defaultValue,
      defaultChecked: this.props.defaultChecked
    }));
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
    };
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCallback = this.handleCallback.bind(this);
  }

  handleChange(event) {
    let value = Number(event.target.value);
    this.setState({
      item: value
    });
  }

  handleCallback(key, value) {
    let v = _objectSpread({}, this.state.value, {
      [key]: value
    });

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

    let value = _objectSpread({}, this.state.value, {
      [this.state.item]: []
    });

    this.setState({
      value: value
    });
    this.props.callback(this.props.name, value);
  }

  remove(id) {
    if (this.state.value == null) {
      return;
    }

    let value = _objectSpread({}, this.state.value, {
      [id]: undefined
    });

    this.setState({
      value: value
    });
    this.props.callback(this.props.name, value);
  }

  componentWillMount() {
    this.props.mapItems(items => {
      this.setState({
        mapItems: items
      });
    });
    this.props.listItems(items => {
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
        let matches = this.state.mapItems.filter(obj => {
          return obj.ID == i;
        });

        if (matches.length > 0) {
          text = matches[0].Display;
        }

        rows.push(React.createElement("details", {
          key: i
        }, React.createElement("summary", null, text), React.createElement("button", {
          type: "button",
          onClick: this.remove.bind(this, i)
        }, "-"), React.createElement("ul", null, React.createElement(ItemList, {
          name: i,
          label: this.props.listLabel,
          type: "select",
          listItems: this.state.listItems,
          defaultValue: this.state.value[i],
          callback: this.handleCallback
        }))));
      }
    }

    let optionsMap = []; // empty selection

    optionsMap.push(React.createElement("option", {
      disabled: true,
      key: "",
      value: ""
    }));

    for (let i in this.state.mapItems) {
      let option = this.state.mapItems[i]; // skip already selected

      if (this.state.value && this.state.value[option.ID] != null) {
        continue;
      }

      optionsMap.push(React.createElement("option", {
        key: option.ID,
        value: option.ID
      }, option.Display));
    }

    return React.createElement("div", null, React.createElement("label", null, this.props.label), React.createElement("ul", null, rows, React.createElement("select", {
      value: this.state.item,
      onChange: this.handleChange
    }, optionsMap), React.createElement("button", {
      type: "button",
      onClick: this.add
    }, "+")));
  }

}

class ItemList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item: "",
      value: this.props.defaultValue
    };
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
    } else {
      value = [...this.state.value, this.state.item];
    }

    this.setState({
      value: value
    });
    this.props.callback(this.props.name, value);
  }

  remove(id) {
    if (this.state.value == null) {
      return;
    }

    let value = this.state.value.filter(function (_, index) {
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
          let matches = this.props.listItems.filter(obj => {
            return obj.ID == text;
          });

          if (matches.length > 0) {
            text = matches[0].Display;
          }
        }

        rows.push(React.createElement("li", {
          key: i
        }, text, React.createElement("button", {
          type: "button",
          onClick: this.remove.bind(this, i)
        }, "-")));
      }
    }

    let input = React.createElement("input", {
      type: this.props.type,
      value: this.state.item,
      onChange: this.handleChange
    });

    if (this.props.type === "select") {
      let optionsList = []; // empty selection

      optionsList.push(React.createElement("option", {
        disabled: true,
        key: "",
        value: ""
      }));

      for (let i in this.props.listItems) {
        let option = this.props.listItems[i]; // skip already selected

        if (this.state.value && this.state.value.indexOf(option.ID) != -1) {
          continue;
        }

        optionsList.push(React.createElement("option", {
          key: option.ID,
          value: option.ID
        }, option.Display));
      }

      input = React.createElement("select", {
        value: this.state.item,
        onChange: this.handleChange
      }, optionsList);
    }

    return React.createElement("details", null, React.createElement("summary", null, this.props.label), React.createElement("ul", null, rows, input, React.createElement("button", {
      type: "button",
      onClick: this.add
    }, "+")));
  }

}

ReactDOM.render(React.createElement(App, null), document.getElementById('app'));