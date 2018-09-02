const mp = require("mental-poker");
const shuffle = require("lodash.shuffle");
const io = require("socket.io-client");
const $ = require("jquery-browserify");
const arrayBufferToBuffer = require("arraybuffer-to-buffer");

let deck;

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

const socket = io.connect();

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
	}
});

socket.on("start", () => {
	self_ = mp.createPlayer(mp.createConfig(52));

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
				console.log("Shuffling!");
				console.log(deck);
			}
		}
	});
});
