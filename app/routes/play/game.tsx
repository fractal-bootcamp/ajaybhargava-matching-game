import { useEffect, useState } from "react";
import type { Route } from "../../+types/root";
import type { Card, GridPosition } from "../../types/game";
import { initializeGame } from "../../utils/gameUtils";
import { CardGrid } from "../../components/CardGrid";
import { useLoaderData } from "react-router";
import { socket } from "~/server/socket";

export async function loader({ params }: Route.LoaderArgs) {
	if (!params.id) throw new Error("Game ID is required.");
	return { roomId: params.id };
}

export default function Play() {
	const { roomId } = useLoaderData<typeof loader>();
	const [gameState, setGameState] = useState(() =>
		initializeGame(5, [
			{ name: "P1", score: 0 },
			{ name: "P2", score: 0 },
		]),
	);

	useEffect(() => {
		socket.on("gameUpdate", (serverState) => {
			setGameState(serverState);
		});
		socket.on("NotYourTurn", () => {
			console.log("Not your turn! Stop it.");
		});
	}, []);

	const handleCardClick = (card: Card, position: GridPosition) => {
		if (!roomId) {
			console.warn("Card clicked but no room ID available");
			return;
		}
		socket.emit("playerMove", roomId, card, position, socket.id);
	};

	return (
		<div className="flex flex-col items-center gap-4 p-4">
			{/* Player info */}
			<div className="flex gap-8 mb-4">
				{gameState.players.map((player, index) => (
					<div
						key={player.name}
						className={`text-2xl ${index === gameState.currentPlayer ? "font-extrabold" : "font-extralight"}`}
					>
						{player.name}: {player.score}
					</div>
				))}
			</div>

			<CardGrid gameState={gameState} onCardClick={handleCardClick} />
		</div>
	);
}
