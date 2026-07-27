import { io } from 'socket.io-client';
import { BASE_URL } from './api';

if (!import.meta.env.VITE_API_URL) {
  console.warn(
    '[Velvet Brew] VITE_API_URL is not set. ' +
    'Socket.IO will attempt to connect to http://localhost:3000 which will fail in production. ' +
    'Set VITE_API_URL in your Vercel environment variables and redeploy.'
  );
}

// Singleton socket instance — autoConnect:false prevents a stray
// localhost:3000 connection on cold page load when VITE_API_URL is missing.
export const socket = io(BASE_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
});

// Call this at the top of every useEffect that uses the socket.
// It is safe to call multiple times — subsequent calls are no-ops.
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
socket.on('disconnect', () => console.log('🔌 Socket disconnected'));
