import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../types/game';

export function useCardResetTimer(
	gameState: GameState,
	setGameState: Dispatch<SetStateAction<GameState>>,
	delay = 500
) {
	useEffect(() => {
		if (gameState.selectedCards.length === 2) {
			const timer = setTimeout(() => {
				setGameState((prevState) => ({
					...prevState,
					selectedCards: [],
				}));
			}, delay);

			return () => clearTimeout(timer);
		}
	}, [gameState.selectedCards, delay, setGameState]);
} 