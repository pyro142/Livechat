const socket = io('http://localhost:3000')
//insitialzi variables from dom
const messageContainer = document.querySelector('.message-container')
const messageForm = document.querySelector('.send-container')
const messageInput = document.querySelector('.message-input-field')

//Bring customer details from form
const customerName = sessionStorage.getItem("customerName");
const customerEmail = sessionStorage.getItem("customerEmail");

if (!customerName || !customerEmail) {
    console.error("Customer details missing, redirecting to form page");
    window.location.href = "index.html";
} else {

    console.log("Customer details loaded:", customerName, customerEmail);
    socket.emit("new-customer", {
        customerName,
        email: customerEmail
    });
}


//When the user submits a message
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
        socket.emit('customer-message',  ({message})); //Send to server
        appendMessage({ 
            text: `You: ${message.text}`, 
            time: message.time 
        }, 'customer');

    console.log(`${message.text} Message Emit sent successfully at ${message.time}`);
    } catch (err) {
        console.error("Error sending emit:", err);
        appendMessage({ text: `You: Failed to send`, time: '' }, 'customer') //Append the message to the chat container
    }   

    messageInput.value = '' //Clear the txtbox after sending the message
})

//Inbound message from agent
socket.on("agent-message", ({message}) => {
    console.log(`Received message from agent: ${message?.text} at ${message?.time}`);
    console.log("Message object:", message);
    appendMessage({ 
            text: message?.text, 
            time: message?.time 
        }, 'agent');

})


// Update chat with new message (user messages)
function appendMessage(message, type = "customer") {
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