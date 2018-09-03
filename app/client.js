const mp = require("mental-poker");
const shuffle = require("lodash.shuffle");
const io = require("socket.io-client");
const $ = require("jquery-browserify");
const arrayBufferToBuffer = require("arraybuffer-to-buffer");

const socket = io.connect();

// Game Variables

let deck;
let playerPosition;
let playerToShuffle;
let playerToLock;

const nextCardinals = {
	"North": "East",
	"East": "South",
	"South": "West",
	"West": "North"
}

const players = {
	"North": {},
	"East": {},
	"South": {},
	"West": {}
}

const config = mp.createConfig(52);

var status = "Waiting for Players";

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
	
			console.log(codeWordBuffer);
	
			if (Object.keys(players).filter(player => players[player]["codeWords"] !== undefined).length == 4) {
				deck = mp.createDeck(Object.keys(players).map(player => players[player]["codeWords"]));
	
				status = "Shuffling";
				console.log(deck);
				console.log("Shuffling!");
	
				playerToShuffle = "North";
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

							playerToLock = "North";
							var locks = 0;

							socket.on("lockedDeck", msg => {
								if (msg[1] == playerToLock && status == "Locking") {
									deck = msg[0].map(card => arrayBufferToBuffer(card));

									playerToLock = nextCardinals[msg[1]];

									locks++;

									if (locks != 4 && playerToLock == playerPosition) {
										deck = mp.encryptDeck(deck, self_.keyPairs.map(keyPair => keyPair.privateKey));
										socket.emit("lockedDeck", deck);
									} else if (locks == 4) {
										status = "Dealing";
										console.log(deck);
										console.log("Dealing!");
									}
								}
							});

							if (playerToLock == playerPosition) {
								deck = mp.encryptDeck(deck, self_.keyPairs.map(keyPair => keyPair.privateKey));
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
