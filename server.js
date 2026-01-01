const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let bids = [];

app.get("/", (req, res) => {
  res.send("Bidding server is running");
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("joinAdmin", () => {
    socket.join("admins");
    bids.forEach((bid) => socket.emit("adminBidUpdate", bid));
  });

  socket.on("placeBid", (data) => {
    const bid = {
      user: data.user,
      amount: data.amount,
      time: new Date().toLocaleTimeString(),
    };

    bids.push(bid);

    // Users: anonymous
    io.emit("bidUpdate", { amount: bid.amount });

    // Admin: full details
    io.to("admins").emit("adminBidUpdate", bid);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
