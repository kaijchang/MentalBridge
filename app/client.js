const mp = require("mental-poker");
const shuffle = require("lodash.shuffle");
const io = require("socket.io-client");

const socket = io.connect();

socket.on("join", msg => {
    console.log(msg + " has joined!");
});

socket.on("leave", msg => {
    console.log(msg + " has left!");
});
