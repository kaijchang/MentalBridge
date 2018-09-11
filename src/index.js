import React from "react";
import ReactDOM from "react-dom";

import * as mp from "mental-poker";
import arrayBufferToBuffer from "arraybuffer-to-buffer";

import { subscribeToGameStart, subscribeToPositions, subscribeToJoin, subscribeToLeave, subscribeToCodeWords, sendCodeWords } from "./sockets";

class Player extends React.Component {
	render() {
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
			deck: [],
			North: {
				codeWords: [],
				status: "Empty"
			},
			East: {
				codeWords: [],
				status: "Empty"
			},
			South: {
				codeWords: [],
				status: "Empty"
			},
			West: {
				codeWords: [],
				status: "Empty"
			}
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
			if (this.state.gameStatus === "Waiting for Players") {
				this.setState({
					gameStatus: "Sending Codewords",
					self: mp.createPlayer(mp.createConfig(52))
				});

				console.log("Sending Codewords");

				subscribeToCodeWords((codeWords, playerPosition) => {
					if (this.state[playerPosition].codeWords.length === 0) {
						this.setState({
							[playerPosition]: Object.assign({}, this.state[playerPosition], {codeWords: codeWords.map(codeWord => arrayBufferToBuffer(codeWord))})
						});

						if (this.state.North.codeWords.length === 52 && this.state.East.codeWords.length === 52 && this.state.South.codeWords.length === 52 && this.state.West.codeWords.length === 52) {
							this.setState({
								status: "Shuffling",
								deck: mp.createDeck([this.state.North.codeWords, this.state.East.codeWords, this.state.South.codeWords, this.state.West.codeWords])
							});

							console.log("Shuffling");
						}
					}
				});

				sendCodeWords(this.state.self.cardCodewordFragments);
			}
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
