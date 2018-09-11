import openSocket from "socket.io-client";
var socket = openSocket();

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

// send

function sendCodeWords(codeWords) {
	socket.emit("codeWords", codeWords);
}

export { subscribeToGameStart, subscribeToPositions, subscribeToJoin, subscribeToLeave, subscribeToCodeWords, sendCodeWords };
