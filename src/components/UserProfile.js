import React, { useEffect, useState } from 'react';
import PurchaseHistory from './PurchaseHistory';
import SalesHistory from './SalesHistory';

const UserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/user'); // Adjust the API endpoint as necessary
                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleProfileUpdate = async (updatedUser) => {
        try {
            const response = await fetch('/api/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedUser),
            });
            const data = await response.json();
            setUser(data);
        } catch (error) {
            console.error('Error updating user profile:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="user-profile">
            <h2>User Profile</h2>
            {user && (
                <div>
                    <h3>{user.name}</h3>
                    <p>Email: {user.email}</p>
                    <button onClick={() => handleProfileUpdate({ ...user, name: 'New Name' })}>
                        Edit Profile
                    </button>
                </div>
            )}
            <PurchaseHistory />
            <SalesHistory />
        </div>
    );
};

export default UserProfile;