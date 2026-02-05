import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ChatComponent = ({ currentUser, partnerId, partnerName, itemId, itemTitle, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const fetchMessages = async () => {
        try {
            const res = await axios.get('/api/messages', {
                params: {
                    itemId: itemId,
                    userId1: currentUser.id,
                    userId2: partnerId
                }
            });
            setMessages(res.data);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchMessages();

        // Polling for real-time updates (every 3 seconds)
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [itemId, partnerId]);

    useEffect(() => {
        // Scroll to bottom
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await axios.post('/api/messages', {
                item_id: itemId,
                sender_id: currentUser.id,
                receiver_id: partnerId,
                content: newMessage
            });
            setNewMessage('');
            fetchMessages(); // Update immediately
        } catch (err) {
            alert('Failed to send message');
        }
    };

    return (
        <div className="chat-overlay" style={{ display: 'block' }}>
            <div className="chat-window">
                <div className="chat-header">
                    <div>
                        <strong>Chatting with {partnerName}</strong>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Re: {itemTitle}</div>
                    </div>
                    <button className="btn btn-primary" onClick={onClose} style={{ padding: '5px 10px' }}>×</button>
                </div>

                <div className="chat-messages">
                    {messages.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>No messages yet. Say hi!</p>}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender_id === currentUser.id ? 'sent' : 'received'}`}>
                            <div className="message-content">{msg.content}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '4px' }}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="form-input"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary">Send</button>
                </form>
            </div>
        </div>
    );
};

export default ChatComponent;
