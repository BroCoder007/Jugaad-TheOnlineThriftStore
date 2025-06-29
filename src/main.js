// This file initializes the JUGAAD Marketplace application, sets up event listeners, fetches initial data, and renders components to the DOM.

import { ItemList } from './components/ItemList.js';
import { PurchaseHistory } from './components/PurchaseHistory.js';
import { SalesHistory } from './components/SalesHistory.js';
import { UserProfile } from './components/UserProfile.js';
import { ChatInterface } from './components/ChatInterface.js';

// Function to render the main components
function renderApp() {
    const appContainer = document.getElementById('app');

    // Render Item List
    const itemList = new ItemList();
    appContainer.appendChild(itemList.render());

    // Render Purchase History
    const purchaseHistory = new PurchaseHistory();
    appContainer.appendChild(purchaseHistory.render());

    // Render Sales History
    const salesHistory = new SalesHistory();
    appContainer.appendChild(salesHistory.render());

    // Render User Profile
    const userProfile = new UserProfile();
    appContainer.appendChild(userProfile.render());

    // Render Chat Interface
    const chatInterface = new ChatInterface();
    appContainer.appendChild(chatInterface.render());
}

// Fetch initial data and render the application
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
});