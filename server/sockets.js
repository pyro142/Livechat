//Socket handling
module.exports = function setupSockets(io) {

    const customers = {} //Object to store connected users and their socket IDs
    const agents = {} //Object to store connected users and their socket IDs
    const chatRooms = {} //Not used yet - Object to store active chat rooms and their participants
    const chatHistory = {} //Object to store chat history for each customer socket ID

    //New Socket Connection
    io.on("connection", (socket) => {
        //Agent connects
        socket.on("new-agent", ({ username }) => {
        console.log(`Agent ${username} connected with socket ID: ${socket.id}`);
        agents[socket.id] = {
        username,
        socketId: socket.id
    };

        //Send them the list of open chats (customer sockets & info)
        socket.emit("chat-list", Object.values(customers));
        });

        //Customer Connects
        socket.on("new-customer", ({ email, customerName }) => {
            customers[socket.id] = {
                email,
                customerName,
                socketId: socket.id
            };
            console.log(`Customer ${customerName} connected with socket ID: ${socket.id}`);
            //Notify all agents of the new chat
            io.emit("chat-list", Object.values(customers));
            //customer joins their own room
            socket.join(socket.id);
        });

        //Agent joins a chat room
        socket.on("join-chat", ({ customerSocketId }) => {
            console.log(`Agent ${socket.id} joining chat with customer socket ID: ${customerSocketId}`);

            //Leave any other chats
            if (socket.currentChat) {
                socket.leave(socket.currentChat);
                console.log(`Agent ${socket.id} left room: ${socket.currentChat}`);
            }
            socket.join(customerSocketId);//Join a room named after the customer's socket ID

            //remember current chat for the agent
            socket.currentChat = customerSocketId;

            //retrieve chat history for this customer and send to agent
            const history = chatHistory[customerSocketId] || [];
            socket.emit("chat-history", history);

        });

        //Agent sends a message
        socket.on("agent-message", ( {message } ) => {
            //recall current chat
            const room = socket.currentChat;
            if (!room) {
                console.log("Agent tried to send message without joining chat");
            return;
            }
            console.log(`Received message from agent ${socket?.id}: ${message.text} at ${message?.time}`);
            socket.to(room).emit("agent-message", {message}); //Send the message to the specific customer based on socket ID
            console.log(`Broadcasted message to customer with socket ID: ${room}`);

            //Chat hisotry in memory p1
            chatHistory[room] = chatHistory[room] || []; //if chathistory[] array isnt true (doesnt exist) then create it
            chatHistory[room].push({
                sender: "agent",
                text: message.text,
                time: message.time
            });
        });

        //Customer sends a message 
        socket.on("customer-message", ({message}) => {
            console.log(`Received message from customer ${socket?.id}: ${message.text} at ${message.time}`);
            //Send the message to all agents in the room named after the customer's socket ID
            io.to(socket.id).emit("customer-message", {message});
            console.log(`Broadcasted ${message.text} to agents in room: ${socket.id}`);
            console.log("Room members:", io.sockets.adapter.rooms.get(socket.id));
 
            //Chat Histroy in memory p2
            chatHistory[socket.id] = chatHistory[socket.id] || []; //if chathistory[] array isnt true (doesnt exist) then create it
            chatHistory[socket.id].push({
                sender: "customer",
                text: message.text,
                time: message.time
            });
            
        });

        //Handle disconnections
        socket.on("disconnect", () => {
            if (customers[socket.id]) {
                console.log(`Customer ${customers[socket.id].customerName} disconnected`);
                delete customers[socket.id];
                io.emit("chat-list", Object.values(customers));
            } else if (agents[socket.id]) {
                console.log(`Agent ${agents[socket.id].username} disconnected`);
                delete agents[socket.id];
            }
        });
    })
}

