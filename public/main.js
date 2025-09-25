const socket = io();

const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

const messageTone = new Audio('/message-tone.mp3');

// Track typing timeout
let typingTimeout;

// Store old messages silently
let oldMessages = [];

// Submit message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

// Update total clients
socket.on('clients-total', (data) => {
    clientsTotal.innerText = `Total Clients : ${data}`;
});

// 🔹 Load previous messages silently
socket.on('load-messages', (messages) => {
    oldMessages = messages; // store silently
});

// Send message
function sendMessage() {
    if (messageInput.value.trim() === '') return;

    const data = {
        name: nameInput.value,
        message: messageInput.value,
        dateTime: new Date(),
        roomId: "general" // 🔹 default room, or get dynamically
    };
    

    socket.emit('message', data);
    addMessageToUi(true, data);
    messageInput.value = '';
}

// Receive new messages from other users
socket.on('chat-message', (data) => {
    messageTone.play();
    addMessageToUi(false, data);
});

// Add message to UI
function addMessageToUi(isOwnMessage, data) {
    clearFeedBack();
    const element = `
    <li class="${isOwnMessage ? "message-right" : "message-left"}">
      <p class="message">
        ${data.message}
        <span>${data.name} : ${moment(data.dateTime).fromNow()}</span>
      </p>
    </li>
    `;
    messageContainer.innerHTML += element;
    scrollToBottom();
}

function scrollToBottom() {
    messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

// Typing indicator
messageInput.addEventListener('input', () => {
    socket.emit('feedback', {
        feedback: `${nameInput.value} is typing...`
    });

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
        socket.emit('feedback', { feedback: '' });
    }, 1500);
});

messageInput.addEventListener('blur', () => {
    socket.emit('feedback', { feedback: '' });
});

socket.on('feedback', (data) => {
    clearFeedBack();

    if (data.feedback) {
        const element = `
        <li class="message-feedback" id="feedback-element">
          <p class="feedback">✍️ ${data.feedback}</p>
        </li>
        `;
        messageContainer.innerHTML += element;
        scrollToBottom();
    }
});

function clearFeedBack() {
    const feedbackElement = document.getElementById('feedback-element');
    if (feedbackElement) {
        feedbackElement.remove();
    }
}

// 🔹 Optional: Button to show old messages
const loadOldBtn = document.getElementById('load-old');
if (loadOldBtn) {
    loadOldBtn.addEventListener('click', () => {
        oldMessages.forEach(msg => addMessageToUi(false, msg));
        oldMessages = []; // clear after showing
    });
}
