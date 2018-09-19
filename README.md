# Mental Bridge based on Mental Poker

[![CodeFactor](https://www.codefactor.io/repository/github/kajchang/mental-bridge/badge)](https://www.codefactor.io/repository/github/kajchang/mental-bridge)

Purely educational implementation of Mental Bridge using a [mental poker library](https://github.com/kripod/mental-poker). I have no formal education or experience in cryptography.

The game has no resistance against malicious players sending malformed messages or players dropping out of the game, because only that player has the keys for their cards, so no other player can pick them up and continue play.

This project has a minimal backend in the form of a NodeJS server to synchronize the players and relay game messages through Socket.IO, but the server never holds secure information. It could feasibly be replaced in the future by a smart contract that could also implement escrows to protect against dropped/malicious players.

The frontend is written in React because the client-side has to store all of the game state and React makes it easy to do this, while writing it the first time in jQuery wasn't optimal and I also wanted to learn a new framework.

The implementation uses the basic principles of mental poker and applies them to bridge in order to deal the cards collision-free and without anyone or the server knowing anyone elses cards. Deciding the first bidder is done through a commitment scheme where each user commits a random number and the sum of the numbers mod the range of the random numbers determines the first bidder. 

(I don't know if it's best to use numbers because someone could choose artifically high or low so the result will fall in their desired range, probably better to commit a boolean + a nonce, and the odd one out goes first, and it's retried if it splits two two.)

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
