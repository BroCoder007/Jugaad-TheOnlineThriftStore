// This file contains utility functions for making API calls to the backend.
// It exports functions for fetching items, user data, purchase history, and submitting reviews.

const API_BASE_URL = 'https://api.jugaadmarketplace.com'; // Replace with your actual API base URL

export const fetchItems = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/items`);
        if (!response.ok) {
            throw new Error('Failed to fetch items');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const fetchUserData = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const fetchPurchaseHistory = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/purchases`);
        if (!response.ok) {
            throw new Error('Failed to fetch purchase history');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const fetchSalesHistory = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/sales`);
        if (!response.ok) {
            throw new Error('Failed to fetch sales history');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const submitReview = async (itemId, reviewData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewData),
        });
        if (!response.ok) {
            throw new Error('Failed to submit review');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};