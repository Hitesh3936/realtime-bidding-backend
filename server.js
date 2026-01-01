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
let groups = {}; // groupCode -> bids array


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

  socket.on("createGroup", (groupCode) => {
    if (!groups[groupCode]) {
      groups[groupCode] = [];
      console.log("🆕 Group created:", groupCode);
    }

    socket.join(groupCode);
    socket.join("admins");

    socket.emit("groupCreated", groupCode);
  });

  socket.on("joinGroup", (groupCode) => {
    if (!groups[groupCode]) {
      socket.emit("invalidGroup");
      return;
    }

    socket.join(groupCode);

    // send old bids (amount only)
    groups[groupCode].forEach((bid) => {
      socket.emit("bidUpdate", { amount: bid.amount });
    });

    console.log("👤 User joined group:", groupCode);
  });

  socket.on("placeBid", ({ groupCode, user, amount }) => {
    const bid = {
      user,
      amount,
      time: new Date().toLocaleTimeString(),
    };

    groups[groupCode].push(bid);

    // users (anonymous)
    io.to(groupCode).emit("bidUpdate", { amount });

    // admin (full info)
    io.to("admins").emit("adminBidUpdate", { groupCode, ...bid });
  });

  socket.on("clearGroupBids", (groupCode) => {
    if (groups[groupCode]) {
      groups[groupCode] = [];
      io.to(groupCode).emit("clearBidList");
      io.to("admins").emit("adminBidCleared", groupCode);
    }
  });



  socket.on("clearBids", () => {
    console.log("🧹 Clear bids requested");

    bids = [];

    // notify all users
    io.emit("clearBidList");

    // notify admin
    io.to("admins").emit("adminBidCleared");
  });


});
function clearAllBids() {
  console.log("🧹 Clear button clicked");
  socket.emit("clearBids");
}

function createGroup() {
  const code = document.getElementById("groupCode").value;
  socket.emit("createGroup", code);
}

socket.on("groupCreated", (code) => {
  alert("Group created: " + code);
});

socket.on("adminBidUpdate", (bid) => {
  const li = document.createElement("li");
  li.innerText = `[${bid.groupCode}] ${bid.user} → ₹${bid.amount}`;
  document.getElementById("adminBids").appendChild(li);
});

let currentGroup = "";

function joinGroup() {
  currentGroup = document.getElementById("groupCode").value;
  socket.emit("joinGroup", currentGroup);
}

function bid() {
  socket.emit("placeBid", {
    groupCode: currentGroup,
    user: document.getElementById("name").value,
    amount: document.getElementById("amount").value,
  });
}

socket.on("invalidGroup", () => {
  alert("Invalid group code");
});




const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

