import React from "react";
import { Container, Row, Col, Card, CardBody, CardHeader } from "reactstrap";

import * as mp from "mental-poker";
import shuffle from "lodash.shuffle";

import arrayBufferToBuffer from "arraybuffer-to-buffer";

import { subscribeToGameStart, subscribeToPositions, subscribeToJoin, subscribeToLeave, subscribeToCodeWords, sendCodeWords, subscribeToShuffledDeck, sendShuffledDeck, subscribeToLockedDeck, sendLockedDeck, subscribeToCardKeys, sendCardKeys } from "./api";
import { cardinalMap, partnerMap } from "./constants";


class Player extends React.Component {
    render() {
        return (
            <Col>
                <Card>
                    <CardBody>
                    </CardBody>
                    <CardHeader>
                        {this.props.position} - {this.props.status}
                    </CardHeader>
                </Card>
            </Col>
        )
    }
}

export default class Game extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            gameStatus: "Waiting for Players",
            config: mp.createConfig(52),
            turn: "",
            playerPosition: "",
            hand: [],
            self: {},
            deck: [],
            North: {
                codeWords: [],
                cardKeys: [],
                status: "Empty"
            },
            East: {
                codeWords: [],
                cardKeys: [],
                status: "Empty"
            },
            South: {
                codeWords: [],
                cardKeys: [],
                status: "Empty"
            },
            West: {
                codeWords: [],
                cardKeys: [],
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

                sendCodeWords(this.state.self.cardCodewordFragments);
            }
        });


        subscribeToCodeWords((codeWords, playerPosition) => {
            if (this.state.gameStatus === "Sending Codewords" && this.state[playerPosition].codeWords.length === 0) {
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
                                                
                    if (this.state.turn === this.state.playerPosition) {
                        this.setState({
                            deck: mp.encryptDeck(shuffle(this.state.deck), this.state.self.keyPairs[this.state.config.cardCount].privateKey)
                        });

                        sendShuffledDeck(this.state.deck);
                    }
                }
            }
        });


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

                    sendCardKeys(this.state.self.keyPairs.map(key => {
                        const indexOfPlayer = Object.keys(cardinalMap).indexOf(this.state.playerPosition);
                        const indexOfKey = this.state.self.keyPairs.indexOf(key);

                        if (indexOfKey <= (indexOfPlayer + 1) * 13 - 1 && indexOfKey >= indexOfPlayer * 13) {
                            return null;
                        } else {
                            return key.privateKey;
                        }
                    }));

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

                                        
        subscribeToCardKeys((cardKeys, playerPosition) => {
            if (this.state.gameStatus === "Dealing") {
                this.setState({
                    [playerPosition]: Object.assign({}, this.state[playerPosition], {cardKeys: cardKeys.map(key => key === null ? null : arrayBufferToBuffer(key))})
                });

                if (this.state.North.cardKeys.length === 53 && this.state.East.cardKeys.length === 53 && this.state.South.cardKeys.length === 53 && this.state.West.cardKeys.length === 53) {
                    const hand = [];
                    const indexOfPlayer = Object.keys(cardinalMap).indexOf(this.state.playerPosition);

                    this.state.deck.filter(card => this.state.deck.indexOf(card) <= (indexOfPlayer + 1) * 13 - 1 && this.state.deck.indexOf(card) >= indexOfPlayer * 13).forEach(card => {
                        const cardDecrypted = mp.decryptCard(
                            card,
                            Object.keys(cardinalMap).map(player => {
                                if (player === this.state.playerPosition) {
                                    console.log()
                                    return this.state.self.keyPairs[this.state.deck.indexOf(card)].privateKey;
                                } else {
                                    return this.state[player].cardKeys[this.state.deck.indexOf(card)];
                                }
                            })
                        );

                        const codeWordIndex = mp.createDeck([this.state.North.codeWords, this.state.East.codeWords, this.state.South.codeWords, this.state.West.codeWords]).findIndex(cardCodeword =>
                            cardCodeword.equals(cardDecrypted)
                        );

                        hand.push(codeWordIndex);
                    });

                    this.setState({
                        hand: hand,
                        gameStatus: "Bidding"
                    });

                    console.log(this.state.gameStatus);

                    console.log(this.state.hand);
                }
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
        const self_ = this.state.playerPosition;

        return (
            <Container>
                <Row>
                    <Col></Col>
                    <Player
                        position={ partnerMap[self_] }
                        status={ this.state[partnerMap[self_]] === undefined ? "" : this.state[partnerMap[self_]].status }
                    />
                    <Col></Col>
                </Row>
                <Row>
                    <Player
                        position={ cardinalMap[self_] }
                        status={ this.state[cardinalMap[self_]] === undefined ? "" : this.state[cardinalMap[self_]].status }
                    />
                    <Col></Col>
                    <Player
                        position={ partnerMap[cardinalMap[self_]] }
                        status={ this.state[partnerMap[cardinalMap[self_]]] === undefined ? "" : this.state[partnerMap[cardinalMap[self_]]].status }
                    />
                </Row>
                <Row>
                    <Col></Col>
                    <Player
                        position={ self_ }
                        status={ this.state[self_] === undefined ? "" : this.state[self_].status }
                    />
                    <Col></Col>
                </Row>
            </Container>
        )
    }
}
