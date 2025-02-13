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
const ORIGINS = [
    'http://localhost:3001',
    ...(import.meta.env.VITE_NETLIFY_DOMAIN ? [import.meta.env.VITE_NETLIFY_DOMAIN] : [])
  ];
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
    origin: ORIGINS, 
    credentials: true 
}));
app.get('/', (req, res) => { 
    res.send("Hello World.")
})
const HttpServer = createServer(app);
const io = new Server(HttpServer, {
    cors: {
        origin: ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true, 
    },
})

// Add reset timer function on server
function resetSelectedCards(roomId: string) {
    const room = GameLobby.rooms.get(roomId);
    if (room) {
        room.gameState = {
            ...gameState,
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
            console.log(`Created new game room: ${identifier}`);
            socket.emit("newGameCreated", identifier);
        }
    });

    socket.on('gamePlayer', (roomId: string, playerName: string) => {
        console.log(`Player ${playerName} attempting to join room ${roomId}`);
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
            console.log(`Room ${roomId} is full and ready to start`);
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
        
        // Emit room status to all players in the room. 
        io.to(roomId).emit('roomUpdate', roomId, {
            roomId,
            players: room.players,
            status: room.status,
            maxPlayers: room.maxPlayers,
            gamesize: room.gamesize
        });
    });
    socket.emit('gameUpdate', gameState); 
    socket.on('playerMove', (roomId: string, card: Card, position: GridPosition) => {
        console.log(`Player move in room ${roomId}:`, { card, position });
        const room = GameLobby.rooms.get(roomId);
        console.log(room);
        
        if (!room || !room.gameState) {
            socket.emit('error', 'Room not found nor game is initialized');
            return;
        }

        // Update the game state for the specific room
        room.gameState = handleCardSelection(room.gameState, card, position);
        io.to(roomId).emit('gameUpdate', room.gameState);

        // If two cards are selected, start the reset timer
        if (room.gameState.selectedCards.length === 2) {
            setTimeout(() => {
                resetSelectedCards(roomId);
            }, 500);
        }
    });

    // Disconnect Game
    socket.on('disconnect', () => {
        console.log("Player Disconnected", socket.id);
    })
})

HttpServer.listen(PORT, () => {
    console.log(`🚀 Backend is listening on {http://localhost:${PORT}}`)
})