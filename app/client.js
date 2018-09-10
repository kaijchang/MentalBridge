const mp = require("mental-poker");
const shuffle = require("lodash.shuffle");
const io = require("socket.io-client");
const $ = require("jquery");
const arrayBufferToBuffer = require("arraybuffer-to-buffer");

const socket = io.connect();

// Bootstrap / FontAwesome

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

["spades", "hearts", "clubs", "diams"].forEach(suit => {
    for (let rank = 14; rank >= 2; rank--) {
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

socket.on("positions", (otherPlayers, selfPosition) => {
    if (selfPosition !== null) {
        console.log("We're sitting in " + selfPosition + "!");

        var currentCardinal = selfPosition;

        $("[name='Bottom']").attr("id", currentCardinal);

        $("[name='Left']").attr("id", nextCardinals[currentCardinal]);
        currentCardinal = nextCardinals[currentCardinal];

        $("[name='Top']").attr("id", nextCardinals[currentCardinal]);
        currentCardinal = nextCardinals[currentCardinal];

        $("[name='Right']").attr("id", nextCardinals[currentCardinal]);
    }

    otherPlayers.forEach(pos => {
        $("#" + pos + " > .card-header").html('<i class="fas fa-user"></i> Occupied - ' + pos);
    });

    if (selfPosition !== null) {
        $("#" + selfPosition + " > .card-header").html('<i class="fas fa-user"></i> Me - ' + selfPosition);
        playerPosition = selfPosition;
    }
});

socket.on("start", () => {
    self_ = mp.createPlayer(config);

    socket.emit("codeWords", self_.cardCodewordFragments);

    status = "Assembling CodeWords";
    console.log("Assembling CodeWords!");

    socket.on("codeWords", (codeWords, senderPosition) => {
        if (players[senderPosition]["codeWords"] === undefined && status == "Assembling CodeWords") {
            const codeWordBuffer = codeWords.map(codeWord => arrayBufferToBuffer(codeWord));
            players[senderPosition]["codeWords"] = codeWordBuffer;
            if (Object.keys(players).filter(player => players[player]["codeWords"] !== undefined).length == 4) {
                assembledCodeWords = mp.createDeck(Object.keys(players).map(player => players[player]["codeWords"]));
                deck = assembledCodeWords;

                status = "Shuffling";
                console.log(deck);
                console.log("Shuffling!");

                var playerToShuffle = "North";
                var shuffles = 0;

                socket.on("shuffledDeck", (shuffledDeck, senderPosition) => {
                    if (senderPosition == playerToShuffle && status == "Shuffling") {
                        deck = shuffledDeck.map(card => arrayBufferToBuffer(card));

                        playerToShuffle = nextCardinals[senderPosition];

                        shuffles++;

                        if (shuffles != 4 && playerToShuffle == playerPosition) {
                            deck = mp.encryptDeck(
                                shuffle(deck),
                                self_.keyPairs[config.cardCount].privateKey
                            );
                            socket.emit("shuffledDeck", deck);
                        } else if (shuffles == 4) {
                            status = "Locking";
                            console.log(deck);
                            console.log("Locking!");

                            var playerToLock = "North";
                            var locks = 0;

                            socket.on("lockedDeck", (lockedDeck, senderPosition) => {
                                if (senderPosition == playerToLock && status == "Locking") {
                                    deck = lockedDeck.map(card => arrayBufferToBuffer(card));

                                    playerToLock = nextCardinals[senderPosition];

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
                                            let indexOfPlayer = Object.keys(players).indexOf(playerPosition);

                                            if (self_.keyPairs.indexOf(key) <= (indexOfPlayer + 1) * 13 - 1 && self_.keyPairs.indexOf(key) >= indexOfPlayer * 13) {
                                                return null;
                                            } else {
                                                return key.privateKey;
                                            }
                                        }));

                                        var keyPairs = 0;

                                        socket.on("cardKeys", (cardKeys, senderPosition) => {
                                            if (players[senderPosition]["keys"] === undefined && status == "Dealing") {
                                                players[senderPosition]["keys"] = cardKeys.map(key => {
                                                    if (key === null) {
                                                        return key;
                                                    } else {
                                                        return arrayBufferToBuffer(key);
                                                    }
                                                });

                                                if (Object.keys(players).filter(player => players[player]["keys"] !== undefined).length == 4) {
                                                    hand = [];

                                                    let indexOfPlayer = Object.keys(players).indexOf(playerPosition);

                                                    deck.filter(card => deck.indexOf(card) <= (indexOfPlayer + 1) * 13 - 1 && deck.indexOf(card) >= indexOfPlayer * 13).forEach(card => {
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

                                                    status = "Bidding";
                                                    console.log(hand);
                                                    console.log("Bidding!");

                                                    Object.keys(players).forEach(player => {
                                                        if (player != playerPosition) {
                                                            for (let x = 0; x < 13; x ++) {
                                                                $('<li><span class="card back">*</span></li>')
                                                                    .hide()
                                                                    .appendTo("#" + player + " > .card-body > .playingCards > .hand")
                                                                    .show("normal");
                                                            }
                                                        } else {
                                                            hand.sort((a, b) => a - b).forEach(card => {
                                                                const cardInDeck = cards[card];
                                                                $(`<li>
                                                                    <a class="card rank-` + cardInDeck[0] + ` ` + cardInDeck[1] +`">
                                                                        <span class="rank">` + cardInDeck[0] + `</span>
                                                                        <span class="suit">&` + cardInDeck[1] + `;</span>
                                                                    </a>
                                                                   </li>`)
                                                                    .hide()
                                                                    .appendTo("#" + player + " > .card-body > .playingCards > .hand")
                                                                    .show("normal");
                                                            });
                                                        }
                                                    });

                                                    // replace with some deterministically random, provably fair generator in the future
                                                    var playerToBid = "North";

                                                    $("#" + playerPosition)
                                                        .parent()
                                                        .parent()
                                                        .find(".col")
                                                        .last()
                                                        .append(`<div class="card" id="biddingbox">
                                                                    <div class="card-body">
                                                                        <div class="bidding-level mt-1">
                                                                            <button type="button" class="btn btn-dark" id="one-level">1</button>
                                                                            <div class="suits">
                                                                                <button type="button" class="btn btn-light">&spades;</button>
                                                                                <button type="button" class="btn btn-light">&hearts;</button>
                                                                                <button type="button" class="btn btn-light">&diams;</button>
                                                                                <button type="button" class="btn btn-light">&clubs;</button>
                                                                            </div>
                                                                        </div>
                                                                        <div class="bidding-level mt-1">
                                                                            <button type="button" class="btn btn-dark" id="two-level">2</button>
                                                                            <div class="suits">
                                                                                <button type="button" class="btn btn-light">&spades;</button>
                                                                                <button type="button" class="btn btn-light">&hearts;</button>
                                                                                <button type="button" class="btn btn-light">&diams;</button>
                                                                                <button type="button" class="btn btn-light">&clubs;</button>
                                                                            </div>
                                                                        </div>
                                                                        <div class="bidding-level mt-1">
                                                                            <button type="button" class="btn btn-dark" id="three-level">3</button>
                                                                            <div class="suits">
                                                                                <button type="button" class="btn btn-light">&spades;</button>
                                                                                <button type="button" class="btn btn-light">&hearts;</button>
                                                                                <button type="button" class="btn btn-light">&diams;</button>
                                                                                <button type="button" class="btn btn-light">&clubs;</button>
                                                                            </div>
                                                                        </div>
                                                                        <div class="bidding-level mt-1">
                                                                            <button type="button" class="btn btn-dark" id="four-level">4</button>
                                                                            <div class="suits">
                                                                                <button type="button" class="btn btn-light">&spades;</button>
                                                                                <button type="button" class="btn btn-light">&hearts;</button>
                                                                                <button type="button" class="btn btn-light">&diams;</button>
                                                                                <button type="button" class="btn btn-light">&clubs;</button>
                                                                            </div>
                                                                        </div>
                                                                        <div class="bidding-level mt-1">
                                                                            <button type="button" class="btn btn-dark" id="five-level">5</button>
                                                                            <div class="suits">
                                                                                <button type="button" class="btn btn-light">&spades;</button>
                                                                                <button type="button" class="btn btn-light">&hearts;</button>
                                                                                <button type="button" class="btn btn-light">&diams;</button>
                                                                                <button type="button" class="btn btn-light">&clubs;</button>
                                                                            </div>
                                                                        </div>
                                                                        <div class="bidding-level mt-1">
                                                                            <button type="button" class="btn btn-dark" id="six-level">6</button>
                                                                            <div class="suits">
                                                                                <button type="button" class="btn btn-light">&spades;</button>
                                                                                <button type="button" class="btn btn-light">&hearts;</button>
                                                                                <button type="button" class="btn btn-light">&diams;</button>
                                                                                <button type="button" class="btn btn-light">&clubs;</button>
                                                                            </div>
                                                                        </div>
                                                                        <div class="bidding-level mt-1">
                                                                            <button type="button" class="btn btn-dark" id="seven-level">7</button>
                                                                            <div class="suits">
                                                                                <button type="button" class="btn btn-light">&spades;</button>
                                                                                <button type="button" class="btn btn-light">&hearts;</button>
                                                                                <button type="button" class="btn btn-light">&diams;</button>
                                                                                <button type="button" class="btn btn-light">&clubs;</button>
                                                                            </div>
                                                                        </div>

                                                                        <div class="mt-1">
                                                                            <button type="button" class="btn btn-success" id="pass">Pass</button>
                                                                            <button type="button" class="btn btn-danger" id="double">Double</button>
                                                                        </div>
                                                                    </div>
                                                                    <h5 class="card-header">
                                                                        Bidding Box
                                                                    </h5>
                                                                </div>`);

                                                    $($($(".row")[1]).find(".col")[1])
                                                        .append(`<div id="bids">
                                                                    <table class="table table-bordered">
                                                                        <thead>
                                                                          <tr>
                                                                            <th scope="col">North</th>
                                                                            <th scope="col">East</th>
                                                                            <th scope="col">South</th>
                                                                            <th scope="col">West</th>
                                                                          </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                          <tr>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                          </tr>
                                                                          <tr>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                          </tr>
                                                                          <tr>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                          </tr>
                                                                          <tr>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                          </tr>
                                                                          <tr>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                          </tr>
                                                                          <tr>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                            <td></td>
                                                                          </tr>
                                                                        </tbody>
                                                                    </table>
                                                                 </div>`);

                                                    $.each($(".bidding-level > .suits > button"), (_, button) => {
                                                        $(button).click(() => {
                                                            socket.emit("bid", [parseInt($(button).parent().parent().find(".btn-dark").text()), $(button).text()]);

                                                            $.each($("#biddingbox").find("button"), (_, button) => {
                                                                $(button).attr("disabled", true);
                                                            });

                                                            $.each($("#biddingbox").find(".bidding-level"), (_, level) => {
                                                                $(level).addClass("disabled");
                                                            });
                                                        });
                                                    });

                                                    $("#pass").click(() => {
                                                        socket.emit("bid", "pass");

                                                        $.each($("#biddingbox").find("button"), (_, button) => {
                                                            $(button).attr("disabled", true);
                                                        });

                                                        $.each($("#biddingbox").find(".bidding-level"), (_, level) => {
                                                            $(level).addClass("disabled");
                                                        });
                                                    });

                                                    $("#double").click(() => {
                                                        socket.emit("bid", "double");

                                                        $.each($("#biddingbox").find("button"), (_, button) => {
                                                            $(button).attr("disabled", true);
                                                        });

                                                        $.each($("#biddingbox").find(".bidding-level"), (_, level) => {
                                                            $(level).addClass("disabled");
                                                        });
                                                    });


                                                    socket.on("bid", (bid, senderPosition) => {
                                                        if (status == "Bidding" && playerToBid == senderPosition) {
                                                            for (let tr of $("tbody > tr").toArray()) {
                                                                var found = false;

                                                                for (let td of $(tr).find("td").toArray()) {
                                                                    let numberInRow = $(tr).find("td").toArray().findIndex(node => node.isSameNode(td));
                                                                    let indexOfPlayer = Object.keys(nextCardinals).indexOf(playerToBid);

                                                                    if ((numberInRow % indexOfPlayer === 0 || numberInRow === playerToBid) && $(td).text() === "") {
                                                                        found = true;

                                                                        $(td).text(typeof(bid) === "object" ? bid.join(" ") : bid);

                                                                        break;
                                                                    }
                                                                }

                                                                if (found) {
                                                                    break;
                                                                }
                                                            }

                                                            playerToBid = nextCardinals[playerToBid];

                                                            if (playerToBid == playerPosition) {
                                                                $.each($("#biddingbox").find("button"), (_, button) => {
                                                                    $(button).attr("disabled", false);
                                                                });

                                                                $.each($("#biddingbox").find(".bidding-level"), (_, level) => {
                                                                    $(level).removeClass("disabled");
                                                                });
                                                            }
                                                        }
                                                    });

                                                    if (playerToBid != playerPosition) {
                                                        $.each($("#biddingbox").find("button"), (_, button) => {
                                                            $(button).attr("disabled", true);
                                                        });

                                                        $.each($("#biddingbox").find(".bidding-level"), (_, level) => {
                                                            $(level).addClass("disabled");
                                                        });
                                                    }
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
                    deck = mp.encryptDeck(
                        shuffle(deck),
                        self_.keyPairs[config.cardCount].privateKey,
                    );
                    socket.emit("shuffledDeck", deck);
                }
            }
        }   
    });
});
