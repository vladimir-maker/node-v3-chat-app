const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage, generateLocationMessage } = require("./utils/message");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const pathDirectoryPublic = path.join(__dirname, "../public");

app.use(express.static(pathDirectoryPublic));

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("onMessage", generateMessage("Admin", "Wellcome"));
    socket.broadcast
      .to(user.room)
      .emit(
        "onMessage",
        generateMessage("Admin", `${user.username}has joined`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  socket.on("sendMessage", (messageInput, callback) => {
    const user = getUser(socket.id);

    const filter = new Filter();

    if (filter.isProfane(messageInput)) {
      return callback("Profane does not allowed!!!");
    }
    io.to(user.room).emit(
      "onMessage",
      generateMessage(user.username, messageInput)
    );
    callback();
  });

  socket.on("sendLocation", (position, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https:/google.com/maps?q=${position.longitude},${position.latitude}`
      )
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "onMessage",
        generateMessage("Admin", `${user.username} has left`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on the port ${port}`);
});

const ana = generateLocationMessage("jova", "www");
console.log(ana);
