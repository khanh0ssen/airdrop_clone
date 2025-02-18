const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let users = [];

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("findPeers", () => {
        users.push(socket.id);
        if (users.length > 1) {
            io.to(users[0]).emit("peerFound", users[1]);
            io.to(users[1]).emit("peerFound", users[0]);
        }
    });

    socket.on("sendOffer", ({ offer, to }) => {
        io.to(to).emit("receiveOffer", { offer, from: socket.id });
    });

    socket.on("sendAnswer", ({ answer, to }) => {
        io.to(to).emit("receiveAnswer", { answer });
    });

    socket.on("sendCandidate", ({ candidate, to }) => {
        io.to(to).emit("receiveCandidate", { candidate });
    });

    socket.on("disconnect", () => {
        users = users.filter((user) => user !== socket.id);
        console.log("User disconnected:", socket.id);
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
