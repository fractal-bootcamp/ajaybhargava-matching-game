import { useEffect, useState } from "react";
import type { GameRoom } from "~/types/lobby";
import type { Route } from "../+types/root";
import { RoomStatuses } from "~/components/GameLobby";
import { useNavigate } from "react-router";
import { socket } from "~/server/socket";

export default function Home() {
	const [rooms, setRooms] = useState<string[]>([]);
	const [playerName, setPlayerName] = useState("");
	const [roomStatuses, setRoomStatuses] = useState<
		Record<string, Omit<GameRoom, "gameState">>
	>({});
	const navigate = useNavigate();

	useEffect(() => {
		// Request initial room list
		socket.emit("getRooms");
		socket.on(
			"roomList",
			(
				roomIds: string[],
				statuses: Record<string, Omit<GameRoom, "gameState">>,
			) => {
				setRooms(roomIds);
				setRoomStatuses(statuses);
			},
		);

		// Update Room.
		socket.on(
			"roomUpdate",
			(roomId: string, status: Omit<GameRoom, "gameState">) => {
				setRoomStatuses((prev) => ({
					...prev,
					[roomId]: status,
				}));
			},
		);

		// Get Games
		socket.on("newGameCreated", (newRoomId: string) => {
			setRooms((prevRooms) => [...prevRooms, newRoomId]);
		});
	}, []);

	const handleCreateGame = () => {
		socket.emit("newGame", true, 5);
	};

	const handleJoinRoom = (roomId: string) => {
		if (!playerName.trim()) {
			alert("Please enter your name first!");
			return;
		}
		socket.emit("gamePlayer", roomId, playerName);
		navigate(`/start/${roomId}/play`);
	};

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<div className="mb-4">
				<input
					type="text"
					value={playerName}
					onChange={(e) => setPlayerName(e.target.value)}
					placeholder="Enter your name"
					className="border p-2 rounded"
				/>
			</div>

			{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
			<button
				onClick={handleCreateGame}
				className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
			>
				Create New Game
			</button>

			<div className="grid grid-cols-1 gap-4 w-full max-w-md">
				{rooms.map((roomId: string) => {
					return (
						<RoomStatuses
							key={roomId}
							roomId={roomId}
							roomStatuses={roomStatuses}
							onRoomJoin={handleJoinRoom}
							playerName={playerName}
						/>
					);
				})}
			</div>
		</div>
	);
}
