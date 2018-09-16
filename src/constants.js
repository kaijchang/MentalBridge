export const cardinalMap = {
	"North": "East",
	"East": "South",
	"South": "West",
	"West": "North"
};

export const partnerMap = {
	"North": "South",
	"South": "North",
	"East": "West",
	"West": "East"
}

export const suitMap = {
    "spades": "♠",
    "hearts": "♥",
    "diams": "♦",
    "clubs": "♣"
}

export const cards = [];

["spades", "hearts", "clubs", "diams"].forEach(suit => {
    for (let rank = 14; rank >= 2; rank--) {
        if (rank <= 10) {
            cards.push([String(rank), suit]);
        } else if (rank === 11) {
            cards.push(["j", suit]);
        } else if (rank === 12) {
            cards.push(["q", suit]);
        } else if (rank === 13) {
            cards.push(["k", suit]);
        } else if (rank === 14) {
            cards.push(["a", suit]);
        }
    }
});
