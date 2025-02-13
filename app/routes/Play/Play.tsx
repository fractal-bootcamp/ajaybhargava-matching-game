import { useEffect, useState } from "react";
import type { Route } from "../../+types/root";
import type { Card, GridPosition } from "../../types/game";
import { initializeGame } from "../../utils/gameUtils";
import { CardGrid } from "../../components/CardGrid";
import { io } from "socket.io-client";
import { useLoaderData } from "react-router";

const socket = io(`${import.meta.env.VITE_RENDER_PUBLIC_URL}`);

export async function loader({ params }: Route.LoaderArgs) {
	if (!params.id) throw new Error("Game ID is required.");
	const identifier = params.id;
	return identifier;
}

export default function Play() {
	const roomIdentifier = useLoaderData<typeof loader>();
	console.log(roomIdentifier);
	const [gameState, setGameState] = useState(() =>
		initializeGame(5, [
			{ name: "P1", score: 0 },
			{ name: "P2", score: 0 },
		]),
	);
	useEffect(() => {
		// Join a Room Socket
		const handleRoomJoin = (identifier: string) => {
			socket.emit("gamePlayer", identifier, "P1");
			socket.emit("gamePlayer", identifier, "P2");
		};
		// Listen for game updates
		const handleGameUpdate = (serverState: typeof gameState) => {
			console.log("Received game update:", serverState);
			setGameState(serverState);
		};

		socket.on("newGameCreated", handleRoomJoin);
		socket.on("gameUpdate", handleGameUpdate);
		socket.on("connect", () => {
			console.log("Connected to socket server");
		});
	}, []);

	// Action That Handles the CardClick
	const handleCardClick = (card: Card, position: GridPosition) => {
		if (roomIdentifier) {
			console.log("Emitting playerMove:", { roomIdentifier, card, position });
			socket.emit("playerMove", roomIdentifier, card, position);
		} else {
			console.warn("Card clicked but no room ID available");
		}
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

			{/* Needs modifying when lobby concept is introduced. */}
			<CardGrid gameState={gameState} onCardClick={handleCardClick} />
		</div>
	);
}
