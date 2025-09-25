const socket = io();

const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

const messageTone = new Audio('/message-tone.mp3');

// Track typing timeout
let typingTimeout;

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

socket.on('clients-total', (data) => {
    clientsTotal.innerText = `Total Clients : ${data}`;
});

function sendMessage() {
    if (messageInput.value.trim() === '') return;

    const data = {
        name: nameInput.value,
        message: messageInput.value,
        dateTime: new Date()
    };

    socket.emit('message', data);
    addMessageToUi(true, data);
    messageInput.value = '';
}

socket.on('chat-message', (data) => {
    messageTone.play();
    addMessageToUi(false, data);
});

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

// 🔹 Typing indicator
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
