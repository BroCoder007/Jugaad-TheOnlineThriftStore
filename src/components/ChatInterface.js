import React, { useState, useEffect } from 'react';

const ChatInterface = ({ currentUser, otherUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        // Fetch chat history from the server or local storage
        fetchChatHistory();
    }, []);

    const fetchChatHistory = () => {
        // Simulate fetching chat history
        const chatHistory = [
            { sender: 'User1', text: 'Hello!' },
            { sender: 'User2', text: 'Hi there!' },
        ];
        setMessages(chatHistory);
    };

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message = {
                sender: currentUser.name,
                text: newMessage,
            };
            setMessages([...messages, message]);
            setNewMessage('');
            // Here you would also send the message to the server
        }
    };

    return (
        <div className="chat-interface">
            <div className="chat-header">
                <h2>Chat with {otherUser.name}</h2>
            </div>
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={msg.sender === currentUser.name ? 'message sent' : 'message received'}>
                        <strong>{msg.sender}: </strong>{msg.text}
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatInterface;