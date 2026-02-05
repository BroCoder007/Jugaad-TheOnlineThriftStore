import React, { useState, useEffect } from 'react';
import ItemList from './components/ItemList';
import ChatComponent from './components/ChatComponent';
import axios from 'axios';

const App = () => {
    const [view, setView] = useState('home');
    const [user, setUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [activeChat, setActiveChat] = useState(null);

    // Login Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Register Form State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    // Sell Item Form State
    const [itemTitle, setItemTitle] = useState('');
    const [itemDesc, setItemDesc] = useState('');
    const [itemPrice, setItemPrice] = useState('');
    const [itemCategory, setItemCategory] = useState('Electronics');
    const [itemImage, setItemImage] = useState(''); // Base64 string

    useEffect(() => {
        // Check for SSO token in URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const name = params.get('name');
        const id = params.get('id');

        if (token && name && id) {
            setUser({ id: parseInt(id), name, email: '' });
            window.history.replaceState({}, document.title, "/");
            alert(`Welcome back, ${name}!`);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/login', { email, password });
            setUser(res.data);
            setShowLoginModal(false);
            setEmail('');
            setPassword('');
            alert(`Welcome back, ${res.data.name}!`);
        } catch (err) {
            alert('Login failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/register', {
                name: regName,
                email: regEmail,
                password: regPassword
            });
            setUser({ id: res.data.id, name: res.data.name, email: res.data.email });
            setShowRegisterModal(false);
            setRegName('');
            setRegEmail('');
            setRegPassword('');
            alert('Registration successful! You are now logged in.');
        } catch (err) {
            alert('Registration failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setItemImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSellItem = async (e) => {
        e.preventDefault();
        if (!user) return alert('You must be logged in');

        try {
            await axios.post('/api/items', {
                title: itemTitle,
                description: itemDesc,
                price: parseInt(itemPrice),
                category: itemCategory,
                seller_id: user.id,
                image: itemImage
            });
            alert('Item posted successfully!');
            setView('home');
            setItemTitle('');
            setItemDesc('');
            setItemPrice('');
            setItemImage('');
            window.location.reload();
        } catch (err) {
            alert('Failed to post item: ' + err.message);
        }
    };

    const handleLogout = () => {
        setUser(null);
        setView('home');
        setActiveChat(null);
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    const handleChatStart = (item) => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }
        // In this MVP, we only support Buyer -> Seller chat initiation via item card
        // If I am not the seller, I want to chat with the seller
        const partnerId = item.seller_id;
        const partnerName = item.seller_name; // Assuming item has seller_name
        setActiveChat({
            itemId: item.id,
            itemTitle: item.title,
            partnerId: partnerId,
            partnerName: partnerName
        });
    };

    return (
        <div className="container">
            <div className="header">
                <nav className="nav" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea', cursor: 'pointer' }} onClick={() => setView('home')}>JUGAAD</div>
                    <div className="nav-buttons" style={{ display: 'flex', gap: '10px' }}>
                        {!user ? (
                            <>
                                <button className="btn btn-primary" onClick={() => setShowLoginModal(true)}>Login</button>
                                <button className="btn btn-secondary" onClick={() => setShowRegisterModal(true)}>Register</button>
                            </>
                        ) : (
                            <>
                                <span style={{ alignSelf: 'center', fontWeight: 'bold' }}>Welcome, {user.name}</span>
                                <button className="btn btn-accent" onClick={() => setView('sell')}>Sell Item</button>
                                <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
                            </>
                        )}
                    </div>
                </nav>
            </div>

            <div className="main-content" style={{ padding: '20px' }}>
                {/* Chat Overlay */}
                {activeChat && user && (
                    <ChatComponent
                        currentUser={user}
                        partnerId={activeChat.partnerId}
                        partnerName={activeChat.partnerName}
                        itemId={activeChat.itemId}
                        itemTitle={activeChat.itemTitle}
                        onClose={() => setActiveChat(null)}
                    />
                )}

                {showLoginModal && (
                    <div className="chat-overlay" style={{ display: 'block' }} onClick={() => setShowLoginModal(false)}>
                        <div className="chat-window" style={{ height: 'auto', padding: '20px' }} onClick={e => e.stopPropagation()}>
                            <div className="chat-header">
                                <h3>Login</h3>
                                <button className="btn btn-primary" onClick={() => setShowLoginModal(false)}>×</button>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <form onSubmit={handleLogin}>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Password</label>
                                        <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                                </form>
                                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                    <p>OR</p>
                                    <button onClick={handleGoogleLogin} className="btn" style={{ background: '#db4437', color: 'white', width: '100%' }}>
                                        Sign in with Google
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showRegisterModal && (
                    <div className="chat-overlay" style={{ display: 'block' }} onClick={() => setShowRegisterModal(false)}>
                        <div className="chat-window" style={{ height: 'auto', padding: '20px' }} onClick={e => e.stopPropagation()}>
                            <div className="chat-header">
                                <h3>Register</h3>
                                <button className="btn btn-primary" onClick={() => setShowRegisterModal(false)}>×</button>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <form onSubmit={handleRegister}>
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input className="form-input" type="text" value={regName} onChange={e => setRegName(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-input" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Password</label>
                                        <input className="form-input" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
                                    </div>
                                    <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Register</button>
                                </form>
                                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                    <p>OR</p>
                                    <button onClick={handleGoogleLogin} className="btn" style={{ background: '#db4437', color: 'white', width: '100%' }}>
                                        Sign in with Google
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'home' && <ItemList currentUser={user} onChat={handleChatStart} />}

                {view === 'sell' && (
                    <div className="section">
                        <h2 className="section-title">Sell Your Item</h2>
                        <form onSubmit={handleSellItem} style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <div className="form-group">
                                <label className="form-label">Item Title</label>
                                <input className="form-input" type="text" value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="What are you selling?" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows="3" value={itemDesc} onChange={e => setItemDesc(e.target.value)} placeholder="Describe your item" required></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price (₹)</label>
                                <input className="form-input" type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} placeholder="Enter price" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-input" value={itemCategory} onChange={e => setItemCategory(e.target.value)}>
                                    <option>Electronics</option>
                                    <option>Furniture</option>
                                    <option>Clothing</option>
                                    <option>Books</option>
                                    <option>Sports</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Item Image</label>
                                <input className="form-input" type="file" accept="image/*" onChange={handleImageChange} />
                                {itemImage && <img src={itemImage} alt="Preview" style={{ marginTop: '10px', maxHeight: '150px', borderRadius: '8px' }} />}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-accent">Post Item</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setView('home')}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
