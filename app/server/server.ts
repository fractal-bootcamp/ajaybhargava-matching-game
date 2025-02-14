import express  from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import cors from 'cors';
import type { GameState, Card, GridPosition } from '../types/game';
import { handleCardSelection, initializeGame } from '~/utils/gameUtils';
import type { GameRoom, Lobby, Player } from '~/types/lobby';
import { v4 as uuidv4 } from 'uuid';

// Deployment Port
const PORT = process.env.PORT || 3001;

// Server Deployable Game State
const gameState: GameState = initializeGame(5, [
    {
        name: 'Player 1',
        score: 0,
    },
    {
        name: 'Player 2',
        score: 0,
    },
]);

const GameLobby: Lobby = {
    rooms: new Map<string, GameRoom>()
};

// Initialize Express Server
const app = express();
// Non Socket Server
app.use(cors({ 
    origin: ['http://localhost:5173', `${import.meta.env.VITE_NETLIFY_DOMAIN}`, `${import.meta.env.VITE_RENDER_PUBLIC_URL}`, "*"],
    credentials: true 
}));
app.get('/', (req, res) => { 
    res.send("Hello World.")
})
const HttpServer = createServer(app);
const io = new Server(HttpServer, {
    cors: {
        origin: ['http://localhost:5173', `${import.meta.env.VITE_NETLIFY_DOMAIN}`, `${import.meta.env.VITE_RENDER_PUBLIC_URL}`, "*"],
        methods: ['GET', 'POST'],
    },
})

// Add reset timer function on server
function resetSelectedCards(roomId: string) {
    const room = GameLobby.rooms.get(roomId);
    if (room?.gameState) {
        room.gameState = {
            ...room.gameState,
            selectedCards: []
        };
        io.to(roomId).emit('gameUpdate', room.gameState);
    }
    else {
        console.log("Room not found");
    }
}

io.on('connection', (socket) => {
    socket.on('getRooms', () => {
        const roomStatuses: Record<string, Omit<GameRoom, 'gameState'>> = {};
        for (const [id, room] of GameLobby.rooms) {
            roomStatuses[id] = {
                roomId: room.roomId,
                players: room.players,
                status: room.status,
                maxPlayers: room.maxPlayers,
                gamesize: room.gamesize
            };
        }
        
        socket.emit('roomList', 
            Array.from(GameLobby.rooms.keys()),
            roomStatuses
        );
    });
    socket.on('newGame', (newGame: boolean, Size: number) => {
        const identifier = uuidv4();
        const matchGame: GameRoom = {
            roomId: identifier,
            players: [],
            gameState: null,
            status: 'waiting',
            maxPlayers: 2,
            gamesize: Size as 3 | 4 | 5,
        }
        if (newGame) {
            GameLobby.rooms.set(identifier, matchGame);
            socket.emit("newGameCreated", identifier);
        }
    });

    socket.on('gamePlayer', (roomId: string, playerName: string) => {
        const room = GameLobby.rooms.get(roomId);
        
        if (!room) {
            console.log(`Room ${roomId} not found`);
            socket.emit("error", "Room not found");
            return;
        }
        
        // Check if player name already exists in room
        if (room.players.some(p => p.name === playerName)) {
            socket.emit("error", "Player name already taken in this room");
            return;
        }
        
        // Check if room is full
        if (room.players.length >= room.maxPlayers) {
            socket.emit("error", "Room is full");
            return;
        }

        const newPlayer: Player = {
            socketId: socket.id,
            name: playerName,
            isReady: true,
                spectator: room ? room.players.length >= room.maxPlayers : false
            }
            room.players.push(newPlayer);
        socket.join(roomId);
        
        console.log(`Added player ${playerName} to room ${roomId}. Current players: ${room.players.length}`);

        // Update room status
        if (room.players.length === room.maxPlayers) {
            const playerNames = room.players.map(player => ({
                name: player.name,
                score: 0
            }));
            room.status = "ready";
            room.gameState = initializeGame(room.gamesize, playerNames);
            io.to(roomId).emit('gameUpdate', room.gameState);
        } else {
            room.status = "waiting";
        }
        
        // Emit room status to all players in room. 
        io.to(roomId).emit('roomUpdate', roomId, {
            roomId,
            players: room.players,
            status: room.status,
            maxPlayers: room.maxPlayers,
            gamesize: room.gamesize
        });
    });
    socket.on('playerMove', (roomId: string, card: Card, position: GridPosition, socketId: string) => {
        const room = GameLobby.rooms.get(roomId);
        if (!room || !room.gameState) {
            console.log('Room validation failed:', { 
                roomExists: !!room, 
                hasGameState: room ? !!room.gameState : false 
            });
            socket.emit('error', 'Room not found nor game is initialized');
            return;
        }

        // Find the player index based on socket ID
        const playerIndex = room.players.findIndex(player => player.socketId === socketId);
        const isCurrentPlayer = playerIndex === room.gameState.currentPlayer;

        if (!isCurrentPlayer) {
            const playerName = room.players[playerIndex]?.name || 'Unknown player';
            const currentPlayerName = room.players[room.gameState.currentPlayer]?.name || 'Unknown player';
            console.log(`Move rejected: ${playerName} attempted to play out of turn. Current player should be ${currentPlayerName}`);
            socket.emit('NotYourTurn');
            return;
        }

        room.gameState = handleCardSelection(room.gameState, card, position);        
        io.to(roomId).emit('gameUpdate', room.gameState);
        if (room.gameState.selectedCards.length === 2) {
            setTimeout(() => {
                resetSelectedCards(roomId);
            }, 500);
        }
    });
})

HttpServer.listen(PORT, () => {
    console.log(`🚀 Backend is listening on http://localhost:${PORT}`)
})