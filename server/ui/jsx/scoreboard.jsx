'use strict';

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <Scoreboard />
      </div>
    );
  }
}

class Scoreboard extends React.Component {
  constructor() {
    super();
    this.state = {
      scenarios: [],
      selectedScenarioName: null,
      scores: []
    }
  }

  populateScores(id) {
    if (id === undefined || id === null || !id) {
      return;
    }

    let url = '/scores/scenario/' + id;

    id = Number(id);
    let name = null;
    for (let i in this.state.scenarios) {
      let entry = this.state.scenarios[i];
      if (entry.ID === id) {
        name = entry.Name;
        break;
      }
    }
  
    fetch(url)
    .then(function(response) {
      if (response.status >= 400) {
        throw new Error("Bad response from server");
      }
      return response.json();
    })
    .then(function(data) {
      this.setState({
        selectedScenarioName: name,
        scores: data
      });
    }.bind(this));
  }

  getScenarios() {
    let url = '/scores/scenarios';
    
    fetch(url)
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

  componentDidMount() {
    this.getScenarios();
  }

  render() {
    let body = [];
    for (let i in this.state.scores) {
      let entry = this.state.scores[i];
      let lastUpdated = new Date(entry.Timestamp * 1000).toLocaleString();
      body.push(
        <tr key={i}>
          <td class="table-cell">{entry.TeamName}</td>
          <td class="table-cell">{entry.Score}</td>
          <td class="table-cell">{lastUpdated}</td>
        </tr>
      )
    }

    let scenarios = [];
    for (let i in this.state.scenarios) {
      let entry = this.state.scenarios[i];
      scenarios.push(
        <li id={i}>
          <a href="#" onClick={() => {this.populateScores(entry.ID)}}>{entry.Name}</a>
        </li>
      )
    }

    let content = null;

    if (this.state.selectedScenarioName != null) {
      content = (
        <React.Fragment>
        <h2>{this.state.selectedScenarioName}</h2>
        <p />
        <table>
          <thead>
            <tr>
              <th class="table-cell">Team Name</th>
              <th class="table-cell">Score</th>
              <th class="table-cell">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {body}
          </tbody>
        </table>
      </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <div className="heading">
          <h1>Scoreboard</h1>
        </div>
        <div className="toc" id="toc">
          <h4>Scenarios</h4>
          <ul>
            {scenarios}
          </ul>
        </div>
        <div className="content" id="content">
          {content}
        </div>
      </React.Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));