import type { GameState } from "./game";


// Lobby Types
export type Player = {
    socketId: string;
    name: string;
    isReady: boolean;
    spectator: boolean;
};

export type GameRoom = {
    roomId: string;
    players: Player[];
    gameState: GameState | null;  // null when game hasn't started
    status: 'waiting' | 'ready' | 'playing' | 'finished';
    maxPlayers: number;
    gamesize: 3 | 4 | 5;
};

export type Lobby = {
    rooms: Map<string, GameRoom>;
};























// export function createGameRoom(roomId: string): GameRoom {
//     return {
//         roomId,
//         players: [],
//         gameState: null,
//         status: 'waiting',
//         maxPlayers: 2,
//         addPlayer: function(player: Omit<Player, 'spectator'>) {
//             const activePlayers = this.players.filter(p => !p.spectator).length;
//             const newPlayer: Player = {
//                 ...player,
//                 spectator: activePlayers >= 2
//             };
//             this.players.push(newPlayer);
//         }
//     };
// }