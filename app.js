import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {Server} from 'socket.io';
const app = express();

const PORT = process.env.PORT || 4000
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const server =  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
const io = new Server(server);
io.on('connection', onConnected);
let socketSet = new Set();

function onConnected(socket) {
    console.log(socket.id);
    socketSet.add(socket.id);
    io.emit('clients-total', socketSet.size);
    socket.on('disconnect', () => {
        console.log("socket disconnected", socket.id);
        socketSet.delete(socket.id);
        io.emit('clients-total', socketSet.size);
    })
    socket.on('message', (data)=> {
        console.log(data);
        socket.broadcast.emit('chat-message', data);
    })
    socket.on('feedback', (data) =>{
        socket.broadcast.emit('feedback',data);
    })
}

app.use(express.static(path.join(__dirname, 'public')));


