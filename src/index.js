import React from "react";
import ReactDOM from "react-dom";

import * as mp from "mental-poker";
import shuffle from "lodash.shuffle";

import arrayBufferToBuffer from "arraybuffer-to-buffer";

import { subscribeToGameStart, subscribeToPositions, subscribeToJoin, subscribeToLeave, subscribeToCodeWords, sendCodeWords, subscribeToShuffledDeck, sendShuffledDeck, subscribeToLockedDeck, sendLockedDeck } from "./sockets";

const cardinalMap = {
	"North": "East",
	"East": "South",
	"South": "West",
	"West": "North"
};

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
			config: mp.createConfig(52),
			turn: "",
			playerPosition: "",
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
				playerPosition: playerPosition,
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
					self: mp.createPlayer(this.state.config)
				});

				console.log(this.state.gameStatus);

				subscribeToCodeWords((codeWords, playerPosition) => {
					if (this.state[playerPosition].codeWords.length === 0) {
						this.setState({
							[playerPosition]: Object.assign({}, this.state[playerPosition], {codeWords: codeWords.map(codeWord => arrayBufferToBuffer(codeWord))})
						});

						if (this.state.North.codeWords.length === 52 && this.state.East.codeWords.length === 52 && this.state.South.codeWords.length === 52 && this.state.West.codeWords.length === 52) {
							this.setState({
								gameStatus: "Shuffling",
								deck: mp.createDeck([this.state.North.codeWords, this.state.East.codeWords, this.state.South.codeWords, this.state.West.codeWords]),
								turn: "North"
							});

							console.log(this.state.gameStatus);

							subscribeToShuffledDeck((shuffledDeck, playerPosition) => {
								if (this.state.gameStatus === "Shuffling" && playerPosition === this.state.turn) {
									this.setState({
										deck: shuffledDeck.map(card => arrayBufferToBuffer(card)),
										turn: cardinalMap[this.state.turn]
									});

									if (this.state.turn === "North") {
										this.setState({
											gameStatus: "Locking"
										});

										console.log(this.state.gameStatus);

										subscribeToLockedDeck((lockedDeck, playerPosition) => {
											if (this.state.gameStatus === "Locking" && playerPosition === this.state.turn) {
												this.setState({
													deck: lockedDeck.map(card => arrayBufferToBuffer(card)),
													turn: cardinalMap[this.state.turn]
												});

												if (this.state.turn === "North") {
													this.setState({
														gameStatus: "Dealing"
													});

													console.log(this.state.gameStatus);

												} else if (this.state.turn === this.state.playerPosition) {
													this.setState({
														deck: mp.encryptDeck(
  																mp.decryptDeck(this.state.deck, this.state.self.keyPairs[this.state.config.cardCount].privateKey),
  																this.state.self.keyPairs.map(keyPair => keyPair.privateKey),
													  	)
													});

													sendLockedDeck(this.state.deck);
												}
											}
										});

										if (this.state.turn === this.state.playerPosition) {
											this.setState({
												deck: mp.encryptDeck(
  														mp.decryptDeck(this.state.deck, this.state.self.keyPairs[this.state.config.cardCount].privateKey),
  														this.state.self.keyPairs.map(keyPair => keyPair.privateKey),
												)
											});

											sendLockedDeck(this.state.deck);
										}

									} else if (this.state.turn === this.state.playerPosition) {
										this.setState({
											deck: mp.encryptDeck(shuffle(this.state.deck), this.state.self.keyPairs[this.state.config.cardCount].privateKey)
										});

										sendShuffledDeck(this.state.deck);
									}
								}
							});

							if (this.state.turn === this.state.playerPosition) {
								this.setState({
									deck: mp.encryptDeck(shuffle(this.state.deck), this.state.self.keyPairs[this.state.config.cardCount].privateKey)
								});

								sendShuffledDeck(this.state.deck);
							}
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
