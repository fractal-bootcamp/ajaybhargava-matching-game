// In play.tsx
import { io } from "socket.io-client";

export const socket = io(`${import.meta.env.VITE_RENDER_PUBLIC_URL}`, {
    transports: ['websocket'],
});
// export const socket = io("http://localhost:3001");