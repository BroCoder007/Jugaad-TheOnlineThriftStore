import React, { useEffect, useState } from 'react';
import { fetchItems } from '../utils/api';

const ItemList = ({ currentUser, onChat }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getItems = async () => {
            try {
                const data = await fetchItems();
                setItems(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getItems();
    }, []);

    if (loading) return <div>Loading items...</div>;
    if (error) return <div>Error fetching items: {error}</div>;

    return (
        <div className="item-list">
            <h2>Items for Sale</h2>
            <div className="items-grid">
                {items.map(item => (
                    <div key={item.id} className="item-card">
                        <div className="item-image">
                            {item.image ?
                                <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                <span>No Image</span>
                            }
                        </div>
                        <h3 className="item-title">{item.title}</h3>
                        <p className="item-description">{item.description}</p>
                        <p className="item-price">Price: ₹{item.price}</p>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>Seller: {item.seller_name}</div>

                        {currentUser && currentUser.id !== item.seller_id ? (
                            <button className="btn btn-primary" onClick={() => onChat(item)}>Contact Seller</button>
                        ) : (
                            <button className="btn" disabled style={{ opacity: 0.5 }}>
                                {currentUser && currentUser.id === item.seller_id ? 'Your Item' : 'Login to Buy'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ItemList;