// Proof of Concept

const mp = require("mental-poker");
const shuffle = require("lodash.shuffle");

// based on https://github.com/kripod/mental-poker

const config = mp.createConfig(52);

const player1 = mp.createPlayer(config);
const player2 = mp.createPlayer(config);

const player3 = mp.createPlayer(config);
const player4 = mp.createPlayer(config);

const cardCodewords = mp.createDeck(
  [player1, player2, player3, player4].map(player => player.cardCodewordFragments),
);

let deck = cardCodewords;

// shuffle

deck = mp.encryptDeck(shuffle(deck), player1.keyPairs[config.cardCount].privateKey);
deck = mp.encryptDeck(shuffle(deck), player2.keyPairs[config.cardCount].privateKey);
deck = mp.encryptDeck(shuffle(deck), player3.keyPairs[config.cardCount].privateKey);
deck = mp.encryptDeck(shuffle(deck), player4.keyPairs[config.cardCount].privateKey);

// locking

deck = mp.encryptDeck(
  mp.decryptDeck(deck, player1.keyPairs[config.cardCount].privateKey),
  player1.keyPairs.map(keyPair => keyPair.privateKey),
);

deck = mp.encryptDeck(
  mp.decryptDeck(deck, player2.keyPairs[config.cardCount].privateKey),
  player2.keyPairs.map(keyPair => keyPair.privateKey),
);

deck = mp.encryptDeck(
  mp.decryptDeck(deck, player3.keyPairs[config.cardCount].privateKey),
  player3.keyPairs.map(keyPair => keyPair.privateKey),
);

deck = mp.encryptDeck(
  mp.decryptDeck(deck, player4.keyPairs[config.cardCount].privateKey),
  player4.keyPairs.map(keyPair => keyPair.privateKey),
);

// deal

//                   #1  #2  #3  #4
const dealedCards = [[], [], [], []];

deck.forEach(cardEncrypted => {
    const cardDecrypted = mp.decryptCard(
        cardEncrypted,
        [player1, player2, player3, player4].map(player => player.keyPairs[deck.indexOf(cardEncrypted)].privateKey),
    );

    const codewordIndex = cardCodewords.findIndex(cardCodeword =>
        cardCodeword.equals(cardDecrypted),
    );

    dealedCards[deck.indexOf(cardEncrypted) % 4].push(codewordIndex);
});

console.log(dealedCards);
