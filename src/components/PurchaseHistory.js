import React, { useEffect, useState } from 'react';
import { fetchPurchaseHistory } from '../utils/api';
import ReviewSystem from './ReviewSystem';

const PurchaseHistory = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getPurchaseHistory = async () => {
            try {
                const data = await fetchPurchaseHistory();
                setPurchases(data);
            } catch (error) {
                console.error('Error fetching purchase history:', error);
            } finally {
                setLoading(false);
            }
        };

        getPurchaseHistory();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="purchase-history">
            <h2>Your Purchase History</h2>
            {purchases.length === 0 ? (
                <p>You have not made any purchases yet.</p>
            ) : (
                <ul>
                    {purchases.map((purchase) => (
                        <li key={purchase.id}>
                            <h3>{purchase.itemTitle}</h3>
                            <p>Price: ₹{purchase.price}</p>
                            <p>Date: {new Date(purchase.date).toLocaleDateString()}</p>
                            <ReviewSystem purchaseId={purchase.id} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default PurchaseHistory;