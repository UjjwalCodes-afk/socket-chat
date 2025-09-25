import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/chatapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// 🔹 Message Schema
const messageSchema = new mongoose.Schema({
    name: String,
    message: String,
    dateTime: { type: Date, default: Date.now },
    roomId: { type: String, required: true }   // added field
});

const Message = mongoose.model("Message", messageSchema);

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const io = new Server(server);
let socketSet = new Set();

io.on('connection', onConnected);

async function onConnected(socket) {
    console.log("Connected:", socket.id);
    socketSet.add(socket.id);

    // 🔹 Send old messages when user connects
    const messages = await Message.find().sort({ dateTime: 1 }).limit(20);
    socket.emit("load-messages", messages);

    io.emit('clients-total', socketSet.size);

    socket.on('disconnect', () => {
        console.log("Disconnected:", socket.id);
        socketSet.delete(socket.id);
        io.emit('clients-total', socketSet.size);
    });

    socket.on('message', async (data) => {
        console.log(data);

        // 🔹 Save message to MongoDB
        const newMessage = new Message(data);
        await newMessage.save();

        // Broadcast message
        socket.broadcast.emit('chat-message', data);
    });

    socket.on('feedback', (data) => {
        socket.broadcast.emit('feedback', data);
    });
}

app.use(express.static(path.join(__dirname, 'public')));
