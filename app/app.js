const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const path = require("path");
var Buffer = require("buffer/").Buffer;


const players = {};
const positions = ["North", "East", "South", "West"];

app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use("/styles", express.static(path.join(__dirname, "styles")));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));


io.on("connection", socket => {
	io.in("players").clients((err, clients) => {
		if (clients.length < 4) {

			const availablePositions = positions.filter(position => !Object.keys(players).includes(position));
			const playerPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];

			io.to("players").emit("join", playerPosition);
			io.to("spectators").emit("join", playerPosition);

			socket.emit("positions", [Object.keys(players), playerPosition]);

			players[playerPosition] = socket.id;

			socket.join("players");

			console.log(players);

			socket.on("disconnect", () => {
				delete players[playerPosition];

				io.emit("leave", playerPosition);

				console.log(players);
			});

			socket.on("codeWords", codeWords => {
				io.to("players").emit("codeWords", [codeWords, playerPosition]);
			});

			socket.on("shuffledDeck", deck => {
				io.to("players").emit("deck", [deck, playerPosition]);
			});

			if (Object.keys(players).length == 4) {
				io.to("players").emit("start");
			}

		} else {
			socket.emit("positions", [Object.keys(players), null]);

			socket.join("spectators");
		}
	});
});

server.listen(3000);
