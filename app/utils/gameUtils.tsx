import type { Card, Grid, Suit, Value, Player, GameState } from "../types/game";

// Shuffle any type of array
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

// Create a 2D Grid of Cards
export function create2DGrid(size: Grid, cards: Card[]): Card[][] {
	const grid: Card[][] = Array(4)
		.fill(null)
		.map(() => Array(size).fill(null));
	let cardIndex = 0;

	// Fill the grid row by row
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < size; j++) {
			if (cardIndex < cards.length) {
				grid[i][j] = cards[cardIndex];
				cardIndex++;
			}
		}
	}

	return grid;
}

// Game Actions
export function handleMatch(gameState: GameState): GameState {
	const { selectedCards, players, currentPlayer } = gameState;
	const newState = { ...gameState };

	// Need exactly 2 selected cards to validate a match
	if (selectedCards.length !== 2) {
		return newState;
	}

	// If there's a match, increase the current player's score
	if (selectedCards[0].card[0] === selectedCards[1].card[0]) {
		players[currentPlayer].score += 1;
		newState.matchedCards = [...newState.matchedCards, ...selectedCards];
		return newState;
	}

	// Only switch to next player if there's no match
	newState.currentPlayer = (currentPlayer + 1) % players.length;
	return newState;
}

function generateRequiredPairs(size: Grid): Card[] {
	const suits: Suit[] = ["C", "D", "H", "S"];
	const values: Value[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
	const allCards: Card[] = [];

	// Generate all possible cards
	for (const suit of suits) {
		for (const value of values) {
			allCards.push(`${value}${suit}` as Card);
		}
	}

	// Shuffle all cards
	const shuffledCards = shuffleArray(allCards);
	const requiredPairs: Card[] = [];
	const pairsNeeded = (4 * size) / 2; // Total grid size divided by 2 (for pairs)

	// Keep track of used values to ensure we get pairs
	const usedValues = new Set<string>();

	// Generate pairs
	for (const card of shuffledCards) {
		const cardValue = card[0];
		if (requiredPairs.length >= pairsNeeded * 2) break;

		if (!usedValues.has(cardValue)) {
			// Find all cards with the same value
			const pairOptions = shuffledCards.filter(
				(c) => c[0] === cardValue && c !== card,
			);

			if (pairOptions.length > 0) {
				requiredPairs.push(card, pairOptions[0]);
				usedValues.add(cardValue);
			}
		}
	}

	return shuffleArray(requiredPairs);
}

export function initializeGame(size: Grid, players: Player[]): GameState {
	const cards = generateRequiredPairs(size);

	return {
		grid: {
			size,
			cards,
			grid: create2DGrid(size, cards),
		},
		selectedCards: [],
		matchedCards: [],
		players,
		currentPlayer: 0,
	};
}

export function handleCardSelection(
	gameState: GameState,
	card: Card,
	position: [number, number],
): GameState {
	// If card is already matched or selected, don't do anything
	const isMatched = gameState.matchedCards.some((match) => match.card === card);
	const isSelected = gameState.selectedCards.some(
		(selected) =>
			selected.position[0] === position[0] &&
			selected.position[1] === position[1],
	);

	if (isMatched || isSelected || gameState.selectedCards.length >= 2) {
		return gameState;
	}

	// Add card to selected cards
	const newState = {
		...gameState,
		selectedCards: [...gameState.selectedCards, { card, position }],
	};

	// If we have 2 cards selected, handle the match
	if (newState.selectedCards.length === 2) {
		return handleMatch(newState);
	}

	return newState;
}
