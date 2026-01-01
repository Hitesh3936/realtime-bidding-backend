/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


const functions = require("firebase-functions");
const express = require("express");
const http = require("http");
const {Server} = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {origin: true},
});

const bids = [];

io.on("connection", (socket) => {
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

    io.emit("bidUpdate", {amount: bid.amount});
    io.to("admins").emit("adminBidUpdate", bid);
  });
});

exports.socket = functions.https.onRequest((req, res) => {
  server.emit("request", req, res);
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
