const mp = require("mental-poker");
const shuffle = require("lodash.shuffle");
const io = require("socket.io-client");
const $ = require("jquery");
const arrayBufferToBuffer = require("arraybuffer-to-buffer");

const socket = io.connect();

// Bootstrap

window.jQuery = $;

require("bootstrap");
require("../node_modules/bootstrap/dist/css/bootstrap.css");
require("../node_modules/@fortawesome/fontawesome-free/css/all.css");

// Game Variables

var assembledCodeWords;
var deck;
var playerPosition;
var hand;
var self_;

const players = {
    "North": {},
    "East": {},
    "South": {},
    "West": {}
}

const config = mp.createConfig(52);

var status = "Waiting for Players";

const cards = [];

["spades", "hearts", "diams", "clubs"].forEach(suit => {
    for (let rank = 2; rank <= 14; rank++) {
        if (rank <= 10) {
            cards.push([String(rank), suit]);
        } else if (rank == 11) {
            cards.push(["j", suit]);
        } else if (rank == 12) {
            cards.push(["q", suit]);
        } else if (rank == 13) {
            cards.push(["k", suit]);
        } else if (rank == 14) {
            cards.push(["a", suit]);
        }
    }
});

const nextCardinals = {
    "North": "East",
    "East": "South",
    "South": "West",
    "West": "North"
}

// Socket Events

socket.on("join", pos => {
    console.log(pos + " has joined!");
    $("#" + pos + " > .card-header").html('<i class="fas fa-user"></i> Occupied - ' + pos);
});

socket.on("leave", pos => {
    console.log(pos + " has left!");
    $("#" + pos + " > .card-header").html('<i class="far fa-user"></i> Empty - ' + pos);
});

socket.on("positions", msg => {
    if (msg[1] !== null) {
        console.log("We're sitting in " + msg[1] + "!");

        var currentCardinal = msg[1];

        $("[name='Bottom']").attr("id", currentCardinal);

        $("[name='Left']").attr("id", nextCardinals[currentCardinal]);
        currentCardinal = nextCardinals[currentCardinal];

        $("[name='Top']").attr("id", nextCardinals[currentCardinal]);
        currentCardinal = nextCardinals[currentCardinal];

        $("[name='Right']").attr("id", nextCardinals[currentCardinal]);
    }

    msg[0].forEach(pos => {
        $("#" + pos + " > .card-header").html('<i class="fas fa-user"></i> Occupied - ' + pos);
    });

    if (msg[1] !== null) {
        $("#" + msg[1] + " > .card-header").html('<i class="fas fa-user"></i> Me - ' + msg[1]);
        playerPosition = msg[1];
    }
});

socket.on("start", () => {
    self_ = mp.createPlayer(config);

    socket.emit("codeWords", self_.cardCodewordFragments);

    status = "Assembling CodeWords";
    console.log("Assembling CodeWords!");

    socket.on("codeWords", msg => {
        if (status == "Assembling CodeWords") {
            const codeWordBuffer = msg[0].map(codeWord => arrayBufferToBuffer(codeWord));

            players[msg[1]]["codeWords"] = codeWordBuffer;

            if (Object.keys(players).filter(player => players[player]["codeWords"] !== undefined).length == 4) {
                assembledCodeWords = mp.createDeck(Object.keys(players).map(player => players[player]["codeWords"]));
                deck = assembledCodeWords;

                status = "Shuffling";
                console.log(deck);
                console.log("Shuffling!");

                var playerToShuffle = "North";
                var shuffles = 0;

                socket.on("shuffledDeck", msg => {
                    if (msg[1] == playerToShuffle && status == "Shuffling") {
                        deck = msg[0].map(card => arrayBufferToBuffer(card));

                        playerToShuffle = nextCardinals[msg[1]];

                        shuffles++;

                        if (shuffles != 4 && playerToShuffle == playerPosition) {
                            deck = mp.encryptDeck(shuffle(deck), self_.keyPairs[config.cardCount].privateKey);
                            socket.emit("shuffledDeck", deck);
                        } else if (shuffles == 4) {
                            status = "Locking";
                            console.log(deck);
                            console.log("Locking!");

                            var playerToLock = "North";
                            var locks = 0;

                            socket.on("lockedDeck", msg => {
                                if (msg[1] == playerToLock && status == "Locking") {
                                    deck = msg[0].map(card => arrayBufferToBuffer(card));

                                    playerToLock = nextCardinals[msg[1]];

                                    locks++;

                                    if (locks != 4 && playerToLock == playerPosition) {
                                        deck = mp.encryptDeck(
                                            deck = mp.decryptDeck(deck, self_.keyPairs[config.cardCount].privateKey),
                                            self_.keyPairs.map(keyPair => keyPair.privateKey),
                                        );
                                        socket.emit("lockedDeck", deck);
                                    } else if (locks == 4) {
                                        status = "Dealing";
                                        console.log(deck);
                                        console.log("Dealing!");

                                        socket.emit("cardKeys", self_.keyPairs.map(key => {
                                            if (self_.keyPairs.indexOf(key) <= (Object.keys(players).indexOf(playerPosition) + 1) * 13 - 1 && self_.keyPairs.indexOf(key) >= Object.keys(players).indexOf(playerPosition) * 13) {
                                                return null;
                                            } else {
                                                return key.privateKey;
                                            }
                                        }));

                                        var keyPairs = 0;

                                        socket.on("cardKeys", msg => {
                                            if (players[msg[1]]["keys"] == undefined) {
                                                players[msg[1]]["keys"] = msg[0].map(key => {
                                                    if (key === null) {
                                                        return key;
                                                    } else {
                                                        return arrayBufferToBuffer(key);
                                                    }
                                                });

                                                if (Object.keys(players).filter(player => players[player]["keys"] !== undefined).length == 4) {
                                                    hand = [];

                                                    deck.filter(card => deck.indexOf(card) <= (Object.keys(players).indexOf(playerPosition) + 1) * 13 - 1 && deck.indexOf(card) >= Object.keys(players).indexOf(playerPosition) * 13).forEach(card => {
                                                        const cardDecrypted = mp.decryptCard(
                                                            card,
                                                            Object.keys(players).map(player => {
                                                                if (player == playerPosition) {
                                                                    return self_.keyPairs[deck.indexOf(card)].privateKey;
                                                                } else {
                                                                    return players[player]["keys"][deck.indexOf(card)];
                                                                }
                                                            })
                                                        );

                                                        const codeWordIndex = assembledCodeWords.findIndex(cardCodeword =>
                                                            cardCodeword.equals(cardDecrypted)
                                                        );

                                                        hand.push(codeWordIndex);
                                                    });

                                                    status = "Playing";
                                                    console.log(hand);
                                                    console.log("Playing!");

                                                    Object.keys(players).forEach(player => {
                                                        if (player != playerPosition) {
                                                            for (let x = 0; x < 13; x ++) {
                                                                $('<li><span class="card back">*</span></li>')
                                                                    .hide()
                                                                    .appendTo("#" + player + " > .card-body > .playingCards > .hand")
                                                                    .show("normal");
                                                            }
                                                        } else {
                                                            hand.forEach(card => {
                                                                const cardInDeck = cards[card];
                                                                $(`<li>
                                                                    <span class="card rank-` + cardInDeck[0] + ` ` + cardInDeck[1] +`">
                                                                        <span class="rank">` + cardInDeck[0] + `</span>
                                                                        <span class="suit">&` + cardInDeck[1] + `;</span>
                                                                    </span>
                                                                   </li>`)
                                                                    .hide()
                                                                    .appendTo("#" + player + " > .card-body > .playingCards > .hand")
                                                                    .show("normal");
                                                            });
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            });

                            if (playerToLock == playerPosition) {
                                deck = mp.encryptDeck(
                                    mp.decryptDeck(deck, self_.keyPairs[config.cardCount].privateKey), 
                                    self_.keyPairs.map(keyPair => keyPair.privateKey),
                                );
                                socket.emit("lockedDeck", deck);
                            }
                        }
                    }
                });

                if (playerToShuffle == playerPosition) {
                    deck = mp.encryptDeck(shuffle(deck), self_.keyPairs[config.cardCount].privateKey);
                    socket.emit("shuffledDeck", deck);
                }
            }
        }
    });
});
