import { io } from 'socket.io-client';

let socket = null;

/**
 * connectSocket(getToken)
 * Connects to the Socket.IO server using the user's auth token.
 * `getToken` is an async function that returns a Firebase ID token string.
 * Safe to call multiple times — returns existing socket if already connected.
 */
export async function connectSocket(getToken) {
  if (socket?.connected) return socket;

  const token = await getToken();

  socket = io(window.location.origin, {
    auth:       { token },
    transports: ['websocket', 'polling'],
    reconnection:        true,
    reconnectionAttempts: 10,
    reconnectionDelay:    1000,
    reconnectionDelayMax: 10000,
  });

  // Refresh token on reconnect attempts (handles token expiry)
  socket.on('reconnect_attempt', async () => {
    try {
      socket.auth.token = await getToken();
    } catch {
      // If we can't get a token, let the reconnect fail naturally
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
