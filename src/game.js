import React from "react";
import { Container, Row, Col, Card, CardBody, CardHeader } from "reactstrap";

import * as mp from "mental-poker";
import shuffle from "lodash.shuffle";

import arrayBufferToBuffer from "arraybuffer-to-buffer";
import { sha256 } from "js-sha256";

import * as api from "./api";
import { cardinalMap, partnerMap, cards, suitMap} from "./constants";


class PlayingCard extends React.Component {
    render() {
        const card = this.props.value === null ? <span className="card back">*</span> : <a className={ "card rank-" + cards[this.props.value][0] + " " + cards[this.props.value][1] }><span className="rank">{ cards[this.props.value][0] }</span><span className="suit">{ suitMap[cards[this.props.value][1]] }</span></a>;

        return (
            <li>
                { card }
            </li>
        )
    }
}


class Hand extends React.Component {
    render() {
        const cards = this.props.cards.reduce((boolean, card) => boolean && card === null, true) ? this.props.cards : this.props.cards.sort((a, b) => a - b);

        return (
            <div className="playingCards">
                <ul className="hand">
                    { cards.map((card, i) => <PlayingCard value={card} key={i}/>) }
                </ul>
            </div>
        )
    }
}

class Player extends React.Component {
    render() {
        return (
            <Col>
                <Card>
                    <CardBody>
                        <Hand
                            cards={this.props.cards}
                        />
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
            dealerSecret: "",
            North: {
                codeWords: [],
                cardKeys: [],
                cards: [],
                dealerCommitment: "",
                status: "Empty"
            },
            East: {
                codeWords: [],
                cardKeys: [],
                cards: [],
                dealerCommitment: "",
                status: "Empty"
            },
            South: {
                codeWords: [],
                cardKeys: [],
                cards: [],
                dealerCommitment: "",
                status: "Empty"
            },
            West: {
                codeWords: [],
                cardKeys: [],
                cards: [],
                dealerCommitment: "",
                status: "Empty"
            }
        };

        api.subscribeToPositions((otherPlayers, playerPosition) => {
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

        api.subscribeToGameStart(() => {
            if (this.state.gameStatus === "Waiting for Players") {
                this.setState({
                    gameStatus: "Sending Codewords",
                    self: mp.createPlayer(this.state.config)
                });

                console.log(this.state.gameStatus);

                api.sendCodeWords(this.state.self.cardCodewordFragments);
            }
        });


        api.subscribeToCodeWords((codeWords, playerPosition) => {
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

                        api.sendShuffledDeck(this.state.deck);
                    }
                }
            }
        });


        api.subscribeToShuffledDeck((shuffledDeck, playerPosition) => {
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

                        api.sendLockedDeck(this.state.deck);
                    }

                } else if (this.state.turn === this.state.playerPosition) {
                    this.setState({
                        deck: mp.encryptDeck(shuffle(this.state.deck), this.state.self.keyPairs[this.state.config.cardCount].privateKey)
                    });

                    api.sendShuffledDeck(this.state.deck);
                }
            }
        });

        api.subscribeToLockedDeck((lockedDeck, playerPosition) => {
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

                    api.sendCardKeys(this.state.self.keyPairs.map(key => {
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

                    api.sendLockedDeck(this.state.deck);
                }
            }
        });

                                        
        api.subscribeToCardKeys((cardKeys, playerPosition) => {
            if (this.state.gameStatus === "Dealing") {
                this.setState({
                    [playerPosition]: Object.assign({}, this.state[playerPosition], {cardKeys: cardKeys.map(key => key === null ? null : arrayBufferToBuffer(key))})
                });

                if (this.state.North.cardKeys.length === 53 && this.state.East.cardKeys.length === 53 && this.state.South.cardKeys.length === 53 && this.state.West.cardKeys.length === 53) {
                    const indexOfPlayer = Object.keys(cardinalMap).indexOf(this.state.playerPosition);

                    const hand = this.state.deck.filter(card => this.state.deck.indexOf(card) <= (indexOfPlayer + 1) * 13 - 1 && this.state.deck.indexOf(card) >= indexOfPlayer * 13).map(card => {
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

                        return mp.createDeck([this.state.North.codeWords, this.state.East.codeWords, this.state.South.codeWords, this.state.West.codeWords]).findIndex(cardCodeword =>
                            cardCodeword.equals(cardDecrypted)
                        );
                    });

                    this.setState({
                        hand: hand,
                        gameStatus: "Determining Dealer",
                        dealerSecret: Math.random() * 1e16,
                        [this.state.playerPosition]: Object.assign({}, this.state[playerPosition], {cards: hand}),
                        [partnerMap[this.state.playerPosition]]: Object.assign({}, this.state[partnerMap[this.state.playerPosition]], {cards: Array(13).fill(null)}),
                        [cardinalMap[this.state.playerPosition]]: Object.assign({}, this.state[cardinalMap[this.state.playerPosition]], {cards: Array(13).fill(null)}),
                        [partnerMap[cardinalMap[this.state.playerPosition]]]: Object.assign({}, this.state[partnerMap[cardinalMap[this.state.playerPosition]]], {cards: Array(13).fill(null)})
                    });

                    console.log(this.state.gameStatus);

                    console.log(this.state.hand);

                    api.sendDealerCommitment(sha256(String(this.state.dealerSecret)));
                }
            }
        });

        api.subscribeToDealerCommitment((dealerCommitment, playerPosition) => {
            if (this.state.gameStatus === "Determining Dealer") {
                this.setState({
                    [playerPosition]: Object.assign({}, this.state[playerPosition], {dealerCommitment: dealerCommitment})
                });

                if (this.state.North.dealerCommitment.length === 64 && this.state.East.dealerCommitment.length === 64 && this.state.South.dealerCommitment.length === 64 && this.state.West.dealerCommitment.length === 64) {
                    this.setState({
                        gameStatus: "Revealing Commitments"
                    });

                    console.log(this.state.gameStatus);

                    api.sendRevealedCommitment(this.state.dealerSecret);
                }
            }
        });

        api.subscribeToRevealedCommitment((revealedCommitment, playerPosition) => {
            if (this.state.gameStatus === "Revealing Commitments" && sha256(String(revealedCommitment)) === this.state[playerPosition].dealerCommitment) {
                this.setState({
                    [playerPosition]: Object.assign({}, this.state[playerPosition], {dealerCommitment: revealedCommitment})
                });

                if (typeof(this.state.North.dealerCommitment) === "number" && typeof(this.state.East.dealerCommitment) === "number" && typeof(this.state.South.dealerCommitment) === "number" && typeof(this.state.West.dealerCommitment) === "number") {
                    this.setState({
                        gameStatus: "Bidding"
                    });

                    console.log(this.state.gameStatus);

                    const magicNumber = Object.keys(cardinalMap).map(pos => this.state[pos].dealerCommitment).reduce((sum, revealedCommitment) => sum += revealedCommitment, 0) % 1e16;

                    console.log(magicNumber);

                    if (magicNumber >= 0 && magicNumber <= 2.5e15) {
                        this.setState({
                            turn: "North"
                        });
                    } else if (magicNumber > 2.5e15 && magicNumber <= 5e15) {
                        this.setState({
                            turn: "East"
                        });
                    } else if (magicNumber > 5e15 && magicNumber <= 7.5e15) {
                        this.setState({
                            turn: "South"
                        });
                    } else if (magicNumber > 7.5e15 && magicNumber <= 1e16) {
                        this.setState({
                            turn: "West"
                        });
                    }

                    console.log(this.state.turn + " Bids First");
                }
            }
        });

        api.subscribeToJoin(pos => {
            this.setState({
                [pos]: Object.assign({}, this.state[pos], {status: "Occupied"})
            });
        });

        api.subscribeToLeave(pos => {
            this.setState({
                [pos]: Object.assign({}, this.state[pos], {status: "Empty"})
            });
        });
    }

    render() {
        const self_ = this.state.playerPosition;

        return (
            <Container fluid={true}>
                <Row>
                    <Col></Col>
                    <Player
                        position={ partnerMap[self_] }
                        status={ this.state[partnerMap[self_]] === undefined ? "" : this.state[partnerMap[self_]].status }
                        cards={ this.state[partnerMap[self_]] === undefined ? [] : this.state[partnerMap[self_]].cards }
                    />
                    <Col></Col>
                </Row>
                <Row>
                    <Player
                        position={ cardinalMap[self_] }
                        status={ this.state[cardinalMap[self_]] === undefined ? "" : this.state[cardinalMap[self_]].status }
                        cards={ this.state[cardinalMap[self_]] === undefined ? [] : this.state[cardinalMap[self_]].cards }
                    />
                    <Col></Col>
                    <Player
                        position={ partnerMap[cardinalMap[self_]] }
                        status={ this.state[partnerMap[cardinalMap[self_]]] === undefined ? "" : this.state[partnerMap[cardinalMap[self_]]].status }
                        cards={ this.state[partnerMap[cardinalMap[self_]]] === undefined ? [] : this.state[partnerMap[cardinalMap[self_]]].cards }
                    />
                </Row>
                <Row>
                    <Col></Col>
                    <Player
                        position={ self_ }
                        status={ this.state[self_] === undefined ? "" : this.state[self_].status }
                        cards={ this.state[self_] === undefined ? [] : this.state[self_].cards }
                    />
                    <Col></Col>
                </Row>
            </Container>
        )
    }
}
