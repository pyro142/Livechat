const socket = io('http://localhost:3000')
const connStatus = document.getElementById('connStatus');
const chatListElement = document.querySelector(".chat-list")
const messageInput = document.querySelector('.message-input-field')
const messageForm = document.querySelector('.send-container')
const messageContainer = document.querySelector('.message-container')


//say hi to server
try {
    socket.emit("new-agent", { username: "Admin" });
    console.log("new-agent Emit sent successfully");
} catch (err) {
    console.error("Error sending emit:", err);
}

//get the chat list
socket.on("chat-list", (chatList) => {
    console.log("Received chat list:", chatList);
    chatListElement.innerHTML = "" //Clear the list before appending new items
    chatList.forEach(chat => {
        //Populate the sidebar
        createChatItem(chat)


        //Handle click on chat list item
        container.addEventListener("click", () => {
            //For now just log the socket ID, later we will use this to join a private room for the chat
            console.log(`Clicked on chat with socket ID: ${chat.socketId}`);
            switchChats(chat.socketId);
        });
    });
});

//Inbound message from customer
socket.on("customer-message", ({message}) => {
    console.log(`Received message from customer: ${message?.text} at ${message?.time}`);

    appendMessage({
        text: message?.text,
        time: message?.time
    }, "customer");
});

//sending a message
messageForm.addEventListener('submit', e => {   
    e.preventDefault() //Prevents page refreshing when form submits
    const messageText = messageInput.value.trim(); // get the text
    if (messageText === "") {
        return; // Don't send empty messages
    }
    const message = {
        text: messageText,
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    try {
        socket.emit('agent-message', { message }); //Send to server
        appendMessage({ 
            text: `You: ${message.text}`, 
            time: message.time 
        }, 'agent');

    console.log(`${message.text} Message Emit sent successfully at ${message.time}`);
    } catch (err) {
        console.error("Error sending emit:", err);
        appendMessage({ text: `You: Failed to send`, time: '' }, 'agent') //Append the message to the chat container
    }   

    messageInput.value = '' //Clear the txtbox after sending the message
})

//Switching between chats
function switchChats(customerSocketId) {
    //Leave current room and join new room based on socketId
    console.log(`Switching to chat with socket ID: ${customerSocketId}`);
    //For now just clear the message container, later we will load the chat history for the selected chat
    messageContainer.innerHTML = "";
    socket.emit("join-chat", { customerSocketId });
    console.log(`${socket.id} emitted join-chat for socket ID: ${customerSocketId}`);
    
}
//retrieve chat hiistroy
socket.on("chat-history", (history) => {
    console.log("Received chat history:", history);
    history.forEach(message => {
        if (message.sender === "agent") {
            appendMessage({
                text: message.text,
                time: message.time
            }, "agent");
        } else if (message.sender === "customer") {
            appendMessage({
                text: message.text,
                time: message.time
            }, "customer");
        }
    });
});



// Update chat with new message (user messages)
function appendMessage(message, type = "agent") {
    const messageElement = document.createElement("li");
    messageElement.classList.add("message", type);

    // Determine text and time
    const text = typeof message === 'object' && message.text ? message.text : message;
    const time = typeof message === 'object' && message.time ? message.time : '';

    // Add timestamp if it exists
    if (time) {
        const timeSpan = document.createElement("span");
        timeSpan.classList.add("message-time");
        timeSpan.innerText = time;
        messageElement.appendChild(timeSpan);
    }

    // Add message text
    const textSpan = document.createElement("span");
    textSpan.classList.add("message-text");
    textSpan.innerText = text;
    messageElement.appendChild(textSpan);

    // Append to container and scroll
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;

    console.log("Appended user message:", text, time);
}

function setConnectionStatus(text) {
  connStatus.textContent = text;
}

function createChatItem(chat) {
    //make a single li with sub elements to contain the info we want to idsplay
    const container = document.createElement('li');
    const titleRow = document.createElement('div');
    const name = document.createElement('span');
    const badge = document.createElement('span');
    const dot = document.createElement('span');
    const badgeLabel = document.createElement('span');
    const preview = document.createElement('div');

    //poulated & style the elements
    container.className = 'chat-item';
    container.dataset.chatId = chat.id;
    titleRow.className = 'title';
    name.textContent = chat.title;
    badge.className = 'badge'; //online status badge
    dot.className = 'badge-dot' + (chat.activeUserConnected && !chat.archived ? ' online' : '');
    badgeLabel.textContent = chat.archived ? 'archived' : (chat.activeUserConnected ? 'online' : 'idle');
    badge.appendChild(dot);
    badge.appendChild(badgeLabel);
    titleRow.appendChild(name);
    titleRow.appendChild(badge);
    preview.className = 'preview';
    preview.textContent = chat.lastMessagePreview || (chat.archived ? 'No messages' : 'New chat');
    container.appendChild(titleRow);
    container.appendChild(preview);
    container.addEventListener('click', () => selectChat(chat.id));

    return container;
}
