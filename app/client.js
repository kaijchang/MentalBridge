const mp = require("mental-poker");
const shuffle = require("lodash.shuffle");
const io = require("socket.io-client");
var $ = require("jquery-browserify");

const socket = io.connect();

socket.on("join", msg => {
    console.log(msg + " has joined!");
});

socket.on("leave", msg => {
    console.log(msg + " has left!");
});

socket.on("position", msg => {
	console.log("We're sitting in " + msg + "!");
});
