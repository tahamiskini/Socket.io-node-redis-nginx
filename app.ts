import express, { Request, Response } from "express";
import { Server, Socket } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import cors from "cors";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { v4 as uuid } from "uuid";

const app = express();

const serverId = uuid();

const PORT = 8080;

const socketUsers: Record<string, string> = {};

// health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("success");
});
const pubClient = createClient({
  url: "redis://redis:6379", // redis docker container url
});
const subClient = pubClient.duplicate();
// Socket setup
pubClient.on("ready", () => {
  console.log({
    message: "Publisher connected to redis and ready to use",
  });
});
subClient.on("ready", () => {
  console.log({
    message: "Subscriber connected to redis and ready to use",
  });
});

pubClient.on("error", () => console.log(`Publisher Client Error`));
subClient.on("error", () => console.log(`Subscriber Client Error`));

(async () => {
  // wait for redis connections
  await Promise.all([pubClient.connect(), subClient.connect()]);

  const server = app.listen(PORT, () => {
    console.log("server Id - ", serverId);

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

  io.adapter(createAdapter(pubClient, subClient));

  // for socketIO default admin panel to monitor socket clients and events
  instrument(io, {
    auth: false,
    mode: "development",
    readonly: true,
  });

  io.on("connection", async (socket: Socket) => {
    try {
      // get roomId and userId from connection query string

      const roomId = socket.handshake.query["roomId"];
      const userId = socket.handshake.query["userId"];

      if (!roomId || !userId) {
        console.log("roomId/userId not found");
        socket.emit("error", { message: "provide roomId/userId" });
        socket.disconnect();
        return;
      }
      console.log("connected to socket server", serverId);
      socketUsers[`${userId}`] = socket.id;

      // join room
      socket.join(roomId);
      socket.emit("message", { message: "joined room", userId, roomId });

      // on message send message to room
      socket.on("message", (data) => {
        console.log("message on server", serverId);

        // socket.to does not send event to sender of the message in the room.. only to others in room
        // socket.to(roomId).emit("message",data)

        // io.to sends events to everyone in that room including the sender
        io.to(roomId).emit("message", data);
      });

      socket.on("disconnect", () => {
        delete socketUsers[`${userId}`];
        console.log("disconnected ", socket.id);
      });
    } catch (error) {
      console.log("error --- ", error);
    }
  });
})();
