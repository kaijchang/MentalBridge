# Mental Bridge based on Mental Poker

[![CodeFactor](https://www.codefactor.io/repository/github/kajchang/mental-bridge/badge)](https://www.codefactor.io/repository/github/kajchang/mental-bridge)

Purely educational Mental Bridge using a [mental poker library](https://github.com/kripod/mental-poker).

The game has no resistance against malicious players sending malformed messages or players dropping out of the game, because only that player has the keys for their cards, so no other player can pick them up and continue play.

This project has a minimal backend in the form of a  NodeJS server to synchronize the players and relay game messages through Socket.IO, but the server never holds secure information. It could feasibly be replaced in the future by a smart contract that could also implement escrows to protect against dropped/malicious players.

The frontend is written in React because of how state-based it is and how much data we're storing in the DOM because of the fact that all the game's logic occurs client-side and because I wanted to learn a new framework.


## Installation

Cloning this repository:

```bash
git clone https://github.com/kajchang/mental-bridge.git
cd mental-bridge
```

Install all dependencies with `npm install`, and start the server with `npm run dev` to start the NodeJS server and react-scripts development tools.

## Thanks

- [Mental Poker Implementation in JS by kripod](https://github.com/kripod/mental-poker)
- [CSS Playing Cards by selfthinker](https://github.com/selfthinker/CSS-Playing-Cards) (Modified Slightly)
