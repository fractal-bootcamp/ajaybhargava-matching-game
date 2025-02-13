import type { GameRoom } from "~/types/lobby";
import { NavLink } from "react-router";

interface RoomStatusProps {
	roomId: string;
	roomStatuses: Record<string, Omit<GameRoom, "gameState">>;
	onRoomJoin: (roomId: string) => void;
}

export function RoomStatuses({
	roomId,
	roomStatuses,
	onRoomJoin,
}: RoomStatusProps) {
	const roomStatus = roomStatuses[roomId];
	return (
		<div key={roomId} className="border p-4 rounded-lg">
			<div className="flex justify-between items-center">
				<div>
					<div>Room: {roomId}</div>
					<div className="text-sm text-gray-600">
						Status: {roomStatus?.status || "waiting"}
					</div>
					<div className="text-sm text-gray-600">
						Players:{" "}
						{roomStatus?.players?.map((player) => player.name).join(", ") ||
							"None"}
					</div>
				</div>
				{(!roomStatus || roomStatus.players.length < 2) && (
					<NavLink
						to={`/start/play/${roomId}`}
						onClick={() => onRoomJoin(roomId)}
						className="bg-green-500 text-white px-4 py-2 rounded"
					>
						Join
					</NavLink>
				)}
			</div>
		</div>
	);
}
