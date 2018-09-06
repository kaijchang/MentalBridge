# Mental Bridge based on Mental Poker

[![CodeFactor](https://www.codefactor.io/repository/github/kajchang/mental-bridge/badge)](https://www.codefactor.io/repository/github/kajchang/mental-bridge)

Purely educational Mental Bridge using a [mental poker library](https://github.com/kripod/mental-poker).

This project uses a NodeJS server to synchronize the players and relay the messages, but the server never holds secure information.

The game has no resistance against malicious players sending malformed messages or players dropping out of the game, because only that player has the keys for their cards, so no other player can pick them up and continue play.

## Installation

Cloning this repository:

```bash
git clone https://github.com/kajchang/mental-bridge.git
cd mental-bridge
```

Install all dependencies with `npm install --production`, and start the server with `npm start` and visit it at port 3000.

## Thanks

- [Mental Poker Implementation in JS by kripod](https://github.com/kripod/mental-poker)
- [CSS Playing Cards by selfthinker](https://github.com/selfthinker/CSS-Playing-Cards) (Modified Slightly)
