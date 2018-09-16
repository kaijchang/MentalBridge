import ReactDOM from "react-dom";
import React from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "./css/index.css";
import "./css/cards.css";

import Game from "./game.js";

ReactDOM.render(
  <Game/>,
  document.getElementById("root")
);
