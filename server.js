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
  console.log("✅ SOCKET CONNECTED:", socket.id);

  bids.forEach((bid) => {
    socket.emit("bidUpdate", { amount: bid.amount });
  });

  socket.onAny((event, data) => {
    console.log("📩 EVENT:", event, data);
  });

  socket.on("joinAdmin", () => {
    socket.join("admins");
    bids.forEach((bid) => socket.emit("adminBidUpdate", bid));
  });

  io.on("connection", (socket) => {
    console.log("✅ SOCKET CONNECTED:", socket.id);

    socket.on("placeBid", (data) => {
      console.log("🔥 BID RECEIVED:", data);
    });
  });


  socket.on("placeBid", (data) => {
    const bid = {
      user: data.user,
      amount: data.amount,
      time: new Date().toLocaleTimeString(),
    };

    bids.push(bid);

    io.emit("bidUpdate", { amount: bid.amount });
    io.to("admins").emit("adminBidUpdate", bid);
  });
  socket.on("adminBidCleared", () => {
    document.getElementById("adminBids").innerHTML = "";
  });

  socket.on("clearBids", () => {
    bids = [];
    console.log("🧹 All bids cleared by admin");

    io.emit("clearBidList");
    io.to("admins").emit("adminBidCleared");
  });

});
function clearAllBids() {
  socket.emit("clearBids");
}


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

