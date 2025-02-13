// Grid Size
export type Grid = 3 | 4 | 5;

// Card Suit
export type Suit = "C" | "D" | "H" | "S";

// Card Value
export type NumericValue = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type FaceValue = "J" | "Q" | "K" | "A";
export type Value = NumericValue | FaceValue;

// Card
export type Card = `${Value}${Suit}`;

// Position in the grid
export type GridPosition = [number, number];

// Players
export type Player = {
	name: string;
	score: number;
};

// Grid State
export type GridState = {
	size: Grid;
	grid: Card[][];
	cards: Card[];
};

// Card State
export type CardState = {
	card: Card;
	position: GridPosition;
};

// Game State
export type GameState = {
	grid: GridState;
	selectedCards: CardState[];
	matchedCards: CardState[];
	players: Player[];
	currentPlayer: number;
};
