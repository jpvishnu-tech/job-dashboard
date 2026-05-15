/**
 * socket.service.js
 * ─────────────────────────────────────────────────────────────────────────
 * Socket.IO server — single instance shared across the whole backend.
 *
 * Room convention:
 *   user:<userId>       – every authenticated user joins this room
 *
 * Events the server EMITS to clients:
 *   notification:new          { notification }
 *   notification:unreadCount  { count }
 *   applicant:new             { application, job }   → recruiter room
 *
 * Events the server LISTENS for from clients:
 *   notification:markRead     { notificationId }
 *   notification:markAllRead  (no payload)
 *   ping                      → replies with pong (heartbeat check)
 */

import { Server } from 'socket.io';
import jwt         from 'jsonwebtoken';
import User        from '../models/User.js';
import Notification from '../models/Notification.js';

let io = null;

// ── Auth middleware for socket handshake ──────────────────────────────────

async function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('AUTH_MISSING'));

  // 1. Try Express JWT (fast, no network call)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('_id role name email');
    if (user) {
      socket.userId   = String(user._id);
      socket.userRole = user.role;
      socket.userName = user.name;
      return next();
    }
  } catch {
    // Not a JWT — fall through
  }

  // 2. Try Firebase ID token
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return next(new Error('AUTH_FAILED'));

  try {
    const fbRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken: token }),
      },
    );
    const fbData = await fbRes.json();
    if (!fbRes.ok || !fbData.users?.[0]) return next(new Error('AUTH_FAILED'));

    const { localId, email } = fbData.users[0];
    const user = await User.findOne({
      $or: [{ firebaseUid: localId }, { email: email?.toLowerCase() }],
    }).select('_id role name email');

    if (!user) return next(new Error('USER_NOT_FOUND'));
    socket.userId   = String(user._id);
    socket.userRole = user.role;
    socket.userName = user.name;
    return next();
  } catch {
    return next(new Error('AUTH_FAILED'));
  }
}

// ── Server initialisation ─────────────────────────────────────────────────

export function initSocket(httpServer) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

  io = new Server(httpServer, {
    cors: {
      origin:      allowedOrigins,
      credentials: true,
    },
    transports:          ['websocket', 'polling'],
    pingTimeout:          20000,
    pingInterval:         25000,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    const room = `user:${socket.userId}`;
    socket.join(room);
    console.log(`[socket] ${socket.userName} (${socket.userId}) connected — joined ${room}`);

    // ── Client-initiated events ───────────────────────────────────────────

    socket.on('notification:markRead', async ({ notificationId }) => {
      try {
        await Notification.findOneAndUpdate(
          { _id: notificationId, user: socket.userId },
          { read: true, readAt: new Date() },
        );
        const count = await Notification.countDocuments({ user: socket.userId, read: false });
        socket.emit('notification:unreadCount', { count });
      } catch {
        // ignore
      }
    });

    socket.on('notification:markAllRead', async () => {
      try {
        await Notification.updateMany(
          { user: socket.userId, read: false },
          { read: true, readAt: new Date() },
        );
        socket.emit('notification:unreadCount', { count: 0 });
      } catch {
        // ignore
      }
    });

    socket.on('ping', () => socket.emit('pong'));

    socket.on('disconnect', (reason) => {
      console.log(`[socket] ${socket.userId} disconnected — ${reason}`);
    });
  });

  console.log('[socket] Socket.IO server initialised');
  return io;
}

// ── Emit helpers (used by controllers/services) ───────────────────────────

/** Returns the live Socket.IO instance (null before initSocket is called). */
export function getIO() { return io; }

/**
 * emitToUser(userId, event, data)
 * Sends `event` to ALL sockets belonging to userId.
 */
export function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${String(userId)}`).emit(event, data);
}

/**
 * Convenience: push a pre-saved Notification document to the owner.
 * Also sends an updated unread count.
 */
export async function pushNotification(notificationDoc) {
  if (!io) return;
  const userId = String(notificationDoc.user);
  io.to(`user:${userId}`).emit('notification:new', notificationDoc.toJSON?.() ?? notificationDoc);

  try {
    const count = await Notification.countDocuments({ user: userId, read: false });
    io.to(`user:${userId}`).emit('notification:unreadCount', { count });
  } catch {
    // non-critical
  }
}
