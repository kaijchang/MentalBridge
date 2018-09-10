import React from "react";
import ReactDOM from "react-dom";
import "./sockets.js";

class App extends React.Component {
	render() {
		return (
			<h1>Hello World</h1>
		)
	}
}

ReactDOM.render(
  <App/>,
  document.getElementById("root")
);
