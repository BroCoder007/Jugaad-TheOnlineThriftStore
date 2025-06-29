import React, { useEffect, useState } from 'react';
import { fetchItems } from '../utils/api';

const ItemList = () => {
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

    if (loading) {
        return <div>Loading items...</div>;
    }

    if (error) {
        return <div>Error fetching items: {error}</div>;
    }

    return (
        <div className="item-list">
            <h2>Items for Sale</h2>
            <div className="items-grid">
                {items.map(item => (
                    <div key={item.id} className="item-card">
                        <div className="item-image">
                            <img src={item.image} alt={item.title} />
                        </div>
                        <h3 className="item-title">{item.title}</h3>
                        <p className="item-description">{item.description}</p>
                        <p className="item-price">Price: ₹{item.price}</p>
                        <button className="btn" onClick={() => handleBid(item.id)}>Bid</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const handleBid = (itemId) => {
    // Logic for handling bids goes here
    alert(`Bid placed for item ID: ${itemId}`);
};

export default ItemList;