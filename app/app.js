const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const path = require("path");

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

			players[playerPosition] = socket.id;

			io.to("players").emit("join", playerPosition);
			io.to("spectators").emit("join", playerPosition);

			socket.emit("position", playerPosition);
			socket.join("players");

			console.log(players);

			socket.on("disconnect", () => {
				delete players[playerPosition];

				io.emit("leave", playerPosition);

				console.log(players);
			});
		} else {
			socket.join("spectators");
		}
	});
});

server.listen(3000);
