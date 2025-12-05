const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {cors:{origin:"*"}});

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

let rooms = {};

io.on('connection', socket=>{
    console.log("Player connected:", socket.id);

    socket.on('joinRoom', roomId=>{
        if(!rooms[roomId]) rooms[roomId] = [];
        rooms[roomId].push(socket.id);
        socket.join(roomId);
        io.to(roomId).emit('players', rooms[roomId]);
    });

    socket.on('updatePaddle', data=>{
        socket.to(data.room).emit('updatePaddle', {id:socket.id, x:data.x});
    });

    socket.on('ballUpdate', data=>{
        socket.to(data.room).emit('ballUpdate', data);
    });

    socket.on('disconnect', ()=>{
        for(let room in rooms){
            rooms[room] = rooms[room].filter(id => id!==socket.id);
            io.to(room).emit('players', rooms[room]);
        }
        console.log("Player disconnected:", socket.id);
    });
});

http.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
