import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Singleton socket instance
export const socket = io(URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
});

socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
