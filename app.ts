import express, { Request, Response } from "express";
import { Server, Socket } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import cors from "cors";

const app = express();

const PORT = 8080;

const socketUsers: Record<string, string> = {};

// health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("success");
});

const server = app.listen(PORT, () => {
  console.log("server listening on port ", PORT);
});

// Socket setup

const io: Server = new Server(server, {
  transports: ["websocket"], // only accept websocket as transport not long-polling
  cors: {
    credentials: true,
    origin: "*",
  },
});

// for socketIO default admin panel to monitor socket clients and events
instrument(io, {
  auth: false,
  mode: "development",
  readonly: true,
});

io.on("connection", async (socket: Socket) => {
  try {
    //get roomId from connection

    const roomId = socket.handshake.query["roomId"];
    const userId = socket.handshake.query["userId"];

    if (!roomId || !userId) {
      console.log("roomId/userId not found");
      socket.emit("error", { message: "provide roomId/userId" });
      socket.disconnect();
      return;
    }
    console.log("connected to socket server");
    socketUsers[`${userId}`] = socket.id;

    //join room
    socket.join(roomId);
    socket.emit("message", { message: "joined room", roomId: roomId });

    // on message send message to room
    socket.on("message", (data: any) => {
      //socket.to does not send event to sender of the message in the room.. only to others in room
      // socket.to(roomId).emit("message",data)

      //io.to sends events to everyone in that room including the sender
      io.to(roomId).emit("message", data);
      socket.on("disconnect", () => {
        delete socketUsers[`${userId}`];
        console.log("disconnected ", socket.id);
      });
    });
  } catch (error) {
    console.log("error --- ", error);
  }
});
