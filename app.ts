import express, { Request, Response, json } from "express";
import { Server, Socket } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import cors from "cors";

const app = express();

const PORT = 4000;

app.use(cors());
app.use(json());

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
    console.log("connected to socket server");

    socket.on("test", (data) => {
      console.log("this is test", data);
    });
  } catch (error) {
    console.log("error --- ", error);
  }
});
