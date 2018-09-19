import openSocket from "socket.io-client";
var socket = openSocket("http://localhost:8000");

// subscribe

export function subscribeToGameStart(callback) {
	socket.on("start", callback);
}

export function subscribeToPositions(callback) {
	socket.on("positions", (otherPlayers, playerPosition) => {
		callback(otherPlayers, playerPosition);
	});
}

export function subscribeToJoin(callback) {
	socket.on("join", (pos) => {
		callback(pos);
	});
}

export function subscribeToLeave(callback) {
	socket.on("leave", (pos) => {
		callback(pos);
	});
}

export function subscribeToCodeWords(callback) {
	socket.on("codeWords", (codeWords, playerPosition) => {
		callback(codeWords, playerPosition);
	});
}

export function subscribeToShuffledDeck(callback) {
	socket.on("shuffledDeck", (shuffledDeck, playerPosition) => {
		callback(shuffledDeck, playerPosition);
	});
}

export function subscribeToLockedDeck(callback) {
	socket.on("lockedDeck", (lockedDeck, playerPosition) => {
		callback(lockedDeck, playerPosition);
	});
}

export function subscribeToCardKeys(callback) {
	socket.on("cardKeys", (cardKeys, playerPosition) => {
		callback(cardKeys, playerPosition);
	});
}

export function subscribeToDealerCommitment(callback) {
	socket.on("dealerCommitment", (dealerCommitment, playerPosition) => {
		callback(dealerCommitment, playerPosition);
	});
}

export function subscribeToRevealedCommitment(callback) {
	socket.on("revealedCommitment", (revealedCommitment, playerPosition) => {
		callback(revealedCommitment, playerPosition);
	});
}

// send

export function sendCodeWords(codeWords) {
	socket.emit("codeWords", codeWords);
}

export function sendShuffledDeck(shuffledDeck) {
	socket.emit("shuffledDeck", shuffledDeck);
}

export function sendLockedDeck(lockedDeck) {
	socket.emit("lockedDeck", lockedDeck);
}

export function sendCardKeys(cardKeys) {
	socket.emit("cardKeys", cardKeys);
}

export function sendDealerCommitment(dealerCommitment) {
	socket.emit("dealerCommitment", dealerCommitment);
}

export function sendRevealedCommitment(revealedCommitment) {
	socket.emit("revealedCommitment", revealedCommitment);
}
