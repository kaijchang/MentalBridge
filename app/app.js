const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const path = require("path");


app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

server.listen(3000);
