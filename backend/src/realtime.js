import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initializeRealtime = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ??
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) return next(new Error("Authentication required."));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
      if (payload.role !== "customer") {
        return next(new Error("Invalid account type."));
      }

      socket.accountId = Number(payload.sub);
      next();
    } catch {
      next(new Error("Invalid or expired session."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`account:${socket.accountId}`);
  });

  return io;
};

export const emitAppointmentChanged = (accountId, payload) => {
  io?.to(`account:${accountId}`).emit("appointment:changed", payload);
};
