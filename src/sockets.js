import openSocket from "socket.io-client";
var socket = openSocket("http://localhost:8000");

// subscribe

function subscribeToGameStart(callback) {
	socket.on("start", callback);
}

function subscribeToPositions(callback) {
	socket.on("positions", (otherPlayers, playerPosition) => {
		callback(otherPlayers, playerPosition);
	});
}

function subscribeToJoin(callback) {
	socket.on("join", (pos) => {
		callback(pos);
	});
}

function subscribeToLeave(callback) {
	socket.on("leave", (pos) => {
		callback(pos);
	});
}

function subscribeToCodeWords(callback) {
	socket.on("codeWords", (codeWords, playerPosition) => {
		callback(codeWords, playerPosition);
	});
}

function subscribeToShuffledDeck(callback) {
	socket.on("shuffledDeck", (shuffledDeck, playerPosition) => {
		callback(shuffledDeck, playerPosition);
	});
}

function subscribeToLockedDeck(callback) {
	socket.on("lockedDeck", (lockedDeck, playerPosition) => {
		callback(lockedDeck, playerPosition);
	});
}

// send

function sendCodeWords(codeWords) {
	socket.emit("codeWords", codeWords);
}

function sendShuffledDeck(shuffledDeck) {
	socket.emit("shuffledDeck", shuffledDeck);
}

function sendLockedDeck(lockedDeck) {
	socket.emit("lockedDeck", lockedDeck);
}

export { subscribeToGameStart, subscribeToPositions, subscribeToJoin, subscribeToLeave, subscribeToCodeWords, sendCodeWords, subscribeToShuffledDeck, sendShuffledDeck, subscribeToLockedDeck, sendLockedDeck };
