import React, { useEffect, useState } from 'react';
import { fetchSalesHistory } from '../utils/api';

const SalesHistory = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getSalesHistory = async () => {
            try {
                const data = await fetchSalesHistory();
                setSales(data);
            } catch (err) {
                setError('Failed to fetch sales history');
            } finally {
                setLoading(false);
            }
        };

        getSalesHistory();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h2>Your Sales History</h2>
            <ul>
                {sales.map((sale) => (
                    <li key={sale.id}>
                        <h3>{sale.itemTitle}</h3>
                        <p>Sold for: ₹{sale.price}</p>
                        <p>Date: {new Date(sale.date).toLocaleDateString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SalesHistory;