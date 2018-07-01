'use strict';

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <Hosts />

        <Templates />

        <CreateTemplate />
      </div>
    );
  }
}

class Hosts extends React.Component {
  constructor() {
    super();
    this.state = {hosts: []};
  }

  componentDidMount() {    
    var url = '/hosts';
    var t = this;
  
    fetch(url)
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then(function(data) {
      t.setState({hosts: data})
    });
  }

  render() {
    return (
      <div className="Hosts">
        <strong>Hosts</strong>
        <ul>
          {this.state.hosts.map(host => {
            return <li>{host.ID} - {host.Hostname} - {host.OS}</li>
          })}
        </ul>
      </div>
    );
  }
}

class Templates extends React.Component {
  constructor() {
    super();
    this.state = {templates: []};
  }

  componentDidMount() {
    var url = "/templates";
    var t = this;
  
    fetch(url)
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then(function(data) {
      t.setState({templates: data})
    });
  }

  deleteTemplate(id) {
    var url = "/templates/" + id;

    fetch(url, {
      method: 'DELETE'
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      window.location.reload();
    });
  }

  render() {
    let rows = [];
    for (let i = 0; i < this.state.templates.length; i++) {
      let entry = this.state.templates[i];
      Object.keys(entry).map(id => {
        rows.push(<li key={id}>{id} - {entry[id].Name}<button onClick={this.deleteTemplate.bind(this, id)}>-</button></li>);
      });
    }
    return (
      <div className="Templates">
        <strong>Templates</strong>
        <ul>{rows}</ul>
      </div>
    );
  }
}

class CreateTemplate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      templates: {}
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.state.templates[event.target.name] = event.target.value;
  }

  handleSubmit(event) {
    event.preventDefault();

    if (Object.keys(this.state.templates) == 0) {
      return;
    }

    var url = "/templates";

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.state.templates)
    })
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      window.location.reload();
    });
  }

  toggleModal = () => {
    this.setState({
      showModal: !this.state.showModal
    })
  }

  render() {
    return (
      <div className="CreateTemplate">
        <button onClick={this.toggleModal}>Create Template</button>
        
        <TemplateModal show={this.state.showModal} onClose={this.toggleModal} change={this.handleChange} submit={this.handleSubmit}/>
      </div>
    );
  }
}

class TemplateModal extends React.Component {
  render() {
    if (!this.props.show) {
      return null;
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
      padding: 30
    }

    return (
      <div className="background" style={backgroundStyle}>
        <div className="modal" style={modalStyle}>
          <form onChange={this.props.change} onSubmit={this.props.submit}>
            <label htmlFor="Name">Name</label>
            <input name="Name" />
            <br />
            <button type="submit">Submit</button>
            <button onClick={this.props.onClose}>Cancel</button>
          </form>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));