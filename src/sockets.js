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

export { subscribeToGameStart, subscribeToPositions, subscribeToJoin, subscribeToLeave };
