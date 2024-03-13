const express = require('express');
const app = express();
const http = require('http');
const { Server } = require("socket.io")
const cors = require('cors');
const { writeFileSync, readFileSync } = require('fs')

const path = './history.json';
const history = JSON.parse(readFileSync(path))

app.use(cors());

const server = http.createServer(app)

const port = 3000;

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on("join_room", (data) => {
    socket.join(data)
    if(history[data]) {
      socket.emit("recent_message", history[data])
    } else{
      socket.emit("recent_message", [])
    }
  })

  socket.on("send_message", (data) => {
    let newArr = history
    if(!newArr[data.room]) newArr[data.room] = []
    newArr[data.room].push(data)
    writeFileSync(path, JSON.stringify(newArr, null, 2), 'utf-8')
    socket.to(data.room).emit("received_message", data)
  }) 
})

app.get("/", (req, res) => {
  res.send("Hello world");
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${port}`);
});