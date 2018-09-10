import React from "react";
import ReactDOM from "react-dom";

import * as mp from "mental-poker";
import { subscribeToGameStart, subscribeToPositions, subscribeToJoin, subscribeToLeave } from "./sockets";

class Player extends React.Component {
	render () {
		return (
			<div>
				{this.props.position} - {this.props.status}
			</div>
		)
	}
}

class Game extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			gameStatus: "Waiting for Players",
			self: {},
			North: {status: "Empty"},
			East: {status: "Empty"},
			South: {status: "Empty"},
			West: {status: "Empty"}
		};

		subscribeToPositions((otherPlayers, playerPosition) => {
			this.setState({
  				[playerPosition]: Object.assign({}, this.state[playerPosition], {status: "Self"})
			});

			otherPlayers.forEach(pos => {
				this.setState({
  					[pos]: Object.assign({}, this.state[pos], {status: "Occupied"})
				});
			});
		});

		subscribeToGameStart(() => {
			const player =  mp.createPlayer(mp.createConfig(52));

			this.setState({
				gameStatus: "Sending Codewords",
				self: player
			});
		});

		subscribeToJoin((pos) => {
			this.setState({
  				[pos]: Object.assign({}, this.state[pos], {status: "Occupied"})
			});
		});

		subscribeToLeave((pos) => {
			this.setState({
  				[pos]: Object.assign({}, this.state[pos], {status: "Empty"})
			});
		});
	}

	render() {
		return (
			<div>
				<Player
					position="North"
					status={this.state.North.status}
				/>
				<Player
					position="East"
					status={this.state.East.status}
				/>
				<Player
					position="South"
					status={this.state.South.status}
				/>
				<Player
					position="West"
					status={this.state.West.status}
				/>
			</div>
		)
	}
}

ReactDOM.render(
  <Game/>,
  document.getElementById("root")
);
