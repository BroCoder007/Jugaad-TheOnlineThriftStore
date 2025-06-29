// Application state
let currentUser = null;
let items = [];
let wantAds = [];
let currentChat = null;
let chatMessages = {};
let userSettings = {
    theme: 'light',
    emailNotifications: true,
    bidNotifications: true,
    priceDropNotifications: false,
    showOnlineStatus: false,
    allowDirectMessages: true,
    showPurchaseHistory: false,
    autoRefresh: true,
    soundNotifications: false,
    itemsPerPage: 24,
    displayName: '',
    location: ''
};

let purchases = []; // {item, review}
let sales = [];     // {item, chosenBidder, reviews:[]}
let reviewTarget = null;

// Sample data
const sampleItems = [
    {
        id: 1,
        title: "iPhone 12 Pro",
        description: "Excellent condition, all accessories included",
        price: 45000,
        category: "Electronics",
        seller: "John Doe",
        bids: [
            { bidder: "Alice", amount: 42000 },
            { bidder: "Bob", amount: 44000 }
        ]
    },
    {
        id: 2,
        title: "Wooden Study Table",
        description: "Solid wood, perfect for home office",
        price: 8000,
        category: "Furniture",
        seller: "Jane Smith",
        bids: [
            { bidder: "Charlie", amount: 7500 }
        ]
    },
    {
        id: 3,
        title: "Mountain Bike",
        description: "21-speed bike, recently serviced",
        price: 15000,
        category: "Sports",
        seller: "Mike Johnson",
        bids: []
    }
];

const sampleWantAds = [
    {
        id: 1,
        title: "Gaming Laptop",
        description: "Looking for a gaming laptop under 80k",
        budget: 80000,
        poster: "Tech Gamer"
    },
    {
        id: 2,
        title: "Baby Stroller",
        description: "Need a good condition baby stroller",
        budget: 5000,
        poster: "New Parent"
    }
];

// Settings functions
function loadUserSettings() {
    document.getElementById('displayName').value = userSettings.displayName || (currentUser ? currentUser.name : '');
    document.getElementById('userLocation').value = userSettings.location;
    document.getElementById('emailNotifications').checked = userSettings.emailNotifications;
    document.getElementById('bidNotifications').checked = userSettings.bidNotifications;
    document.getElementById('priceDropNotifications').checked = userSettings.priceDropNotifications;
    document.getElementById('showOnlineStatus').checked = userSettings.showOnlineStatus;
    document.getElementById('allowDirectMessages').checked = userSettings.allowDirectMessages;
    document.getElementById('showPurchaseHistory').checked = userSettings.showPurchaseHistory;
    document.getElementById('autoRefresh').checked = userSettings.autoRefresh;
    document.getElementById('soundNotifications').checked = userSettings.soundNotifications;
    document.getElementById('itemsPerPage').value = userSettings.itemsPerPage;
    updateThemeButtons();
}

function updateThemeButtons() {
    document.getElementById('lightBtn').style.background = userSettings.theme === 'light' ? 'linear-gradient(45deg, #43e97b, #38f9d7)' : '';
    document.getElementById('darkBtn').style.background = userSettings.theme === 'dark' ? 'linear-gradient(45deg, #43e97b, #38f9d7)' : '';
    document.getElementById('contrastBtn').style.background = userSettings.theme === 'high-contrast' ? 'linear-gradient(45deg, #43e97b, #38f9d7)' : '';
}

function toggleTheme(theme) {
    userSettings.theme = theme;
    applyTheme(theme);
    updateThemeButtons();
}

function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('dark-mode', 'high-contrast');
    switch (theme) {
        case 'dark':
            body.classList.add('dark-mode');
            break;
        case 'high-contrast':
            body.classList.add('high-contrast');
            break;
        default:
            break;
    }
}

function changePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    if (!current || !newPass || !confirm) {
        alert('Please fill all password fields');
        return;
    }
    if (newPass !== confirm) {
        alert('New passwords do not match');
        return;
    }
    if (newPass.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    alert('Password changed successfully!');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function updateProfile() {
    const displayName = document.getElementById('displayName').value;
    const location = document.getElementById('userLocation').value;
    if (displayName) {
        userSettings.displayName = displayName;
        userSettings.location = location;
        document.getElementById('userStatus').innerHTML = `👋 Welcome back, ${displayName}!`;
        alert('Profile updated successfully!');
    } else {
        alert('Display name is required');
    }
}

function saveSettings() {
    userSettings.emailNotifications = document.getElementById('emailNotifications').checked;
    userSettings.bidNotifications = document.getElementById('bidNotifications').checked;
    userSettings.priceDropNotifications = document.getElementById('priceDropNotifications').checked;
    userSettings.showOnlineStatus = document.getElementById('showOnlineStatus').checked;
    userSettings.allowDirectMessages = document.getElementById('allowDirectMessages').checked;
    userSettings.showPurchaseHistory = document.getElementById('showPurchaseHistory').checked;
    userSettings.autoRefresh = document.getElementById('autoRefresh').checked;
    userSettings.soundNotifications = document.getElementById('soundNotifications').checked;
    userSettings.itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    alert('All settings saved successfully!');
    if (userSettings.autoRefresh) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        userSettings = {
            theme: 'light',
            emailNotifications: true,
            bidNotifications: true,
            priceDropNotifications: false,
            showOnlineStatus: false,
            allowDirectMessages: true,
            showPurchaseHistory: false,
            autoRefresh: true,
            soundNotifications: false,
            itemsPerPage: 24,
            displayName: currentUser ? currentUser.name : '',
            location: ''
        };
        applyTheme('light');
        loadUserSettings();
        alert('Settings reset to default!');
    }
}

let autoRefreshInterval = null;

function startAutoRefresh() {
    if (autoRefreshInterval) return;
    autoRefreshInterval = setInterval(() => {
        console.log('Auto-refreshing listings...');
    }, 30000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

function init() {
    items = [...sampleItems];
    wantAds = [...sampleWantAds];
    renderItems();
    renderWantAds();
    hideAllSections();
}

// Navigation functions
function hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
        if (section.id !== 'itemsSection' && section.id !== 'wantAdsSection') {
            section.classList.add('hidden');
        }
    });
}

function showLogin() {
    hideAllSections();
    document.getElementById('loginSection').classList.remove('hidden');
}

function showRegister() {
    hideAllSections();
    document.getElementById('registerSection').classList.remove('hidden');
}

function showPostItem() {
    if (!currentUser) {
        alert('Please login first!');
        showLogin();
        return;
    }
    hideAllSections();
    document.getElementById('postItemSection').classList.remove('hidden');
}

function showSettings() {
    if (!currentUser) {
        alert('Please login first!');
        showLogin();
        return;
    }
    hideAllSections();
    document.getElementById('settingsSection').classList.remove('hidden');
    loadUserSettings();
}

function showWantAd() {
    if (!currentUser) {
        alert('Please login first!');
        showLogin();
        return;
    }
    hideAllSections();
    document.getElementById('wantAdSection').classList.remove('hidden');
}

function showPurchases() {
    hideAllSections();
    renderPurchases();
    document.getElementById('purchasesSection').classList.remove('hidden');
}

function showSales() {
    hideAllSections();
    renderSales();
    document.getElementById('salesSection').classList.remove('hidden');
}

// Authentication functions
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    if (email && password) {
        currentUser = { email, name: email.split('@')[0] };
        document.getElementById('userStatus').innerHTML = `👋 Welcome back, ${currentUser.name}!`;
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('settingsBtn').style.display = 'inline-block';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('purchasesBtn').style.display = 'inline-block';
        document.getElementById('salesBtn').style.display = 'inline-block';
        hideAllSections();
        alert('Login successful!');
        applyTheme(userSettings.theme);
    } else {
        alert('Please enter both email and password');
    }
}

function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    if (name && email && password) {
        currentUser = { email, name };
        document.getElementById('userStatus').innerHTML = `👋 Welcome, ${currentUser.name}!`;
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('settingsBtn').style.display = 'inline-block';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('purchasesBtn').style.display = 'inline-block';
        document.getElementById('salesBtn').style.display = 'inline-block';
        hideAllSections();
        alert('Registration successful!');
        applyTheme(userSettings.theme);
    } else {
        alert('Please fill all fields');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('userStatus').innerHTML = '👋 Welcome to JUGAAD! Please login to start buying and selling.';
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('registerBtn').style.display = 'inline-block';
    document.getElementById('settingsBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('purchasesBtn').style.display = 'none';
    document.getElementById('salesBtn').style.display = 'none';
    hideAllSections();
    alert('Logged out successfully!');
}

// Item posting functions
function postItem() {
    const title = document.getElementById('itemTitle').value;
    const description = document.getElementById('itemDescription').value;
    const price = document.getElementById('itemPrice').value;
    const category = document.getElementById('itemCategory').value;
    if (title && description && price) {
        const newItem = {
            id: items.length + 1,
            title,
            description,
            price: parseInt(price),
            category,
            seller: currentUser.name,
            bids: []
        };
        items.unshift(newItem);
        renderItems();
        hideAllSections();
        alert('Item posted successfully!');
        document.getElementById('itemTitle').value = '';
        document.getElementById('itemDescription').value = '';
        document.getElementById('itemPrice').value = '';
    } else {
        alert('Please fill all required fields');
    }
}

function postWantAd() {
    const title = document.getElementById('wantTitle').value;
    const description = document.getElementById('wantDescription').value;
    const budget = document.getElementById('wantBudget').value;
    if (title && description && budget) {
        const newWantAd = {
            id: wantAds.length + 1,
            title,
            description,
            budget: parseInt(budget),
            poster: currentUser.name
        };
        wantAds.unshift(newWantAd);
        renderWantAds();
        hideAllSections();
        alert('Want ad posted successfully!');
        document.getElementById('wantTitle').value = '';
        document.getElementById('wantDescription').value = '';
        document.getElementById('wantBudget').value = '';
    } else {
        alert('Please fill all required fields');
    }
}

// Rendering functions
function renderItems() {
    const grid = document.getElementById('itemsGrid');
    grid.innerHTML = '';
    items.forEach(item => {
        const highestBid = item.bids.length > 0 ? Math.max(...item.bids.map(b => b.amount)) : 0;
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card fade-in';
        itemCard.innerHTML = `
            <div class="item-image">📱</div>
            <div class="item-title">${item.title}</div>
            <div class="item-price">₹${item.price.toLocaleString()}</div>
            <div class="item-description">${item.description}</div>
            ${item.bids.length > 0 ? `<div class="bid-info">Highest Bid: ₹${highestBid.toLocaleString()} (${item.bids.length} bids)</div>` : ''}
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="openChat(${item.id}, '${item.title}', '${item.seller}')">Chat & Bid</button>
                ${currentUser && currentUser.name === item.seller ? `<button class="btn btn-secondary" onclick="viewBids(${item.id})">View Bids</button>` : ''}
            </div>
        `;
        grid.appendChild(itemCard);
    });
}

function renderWantAds() {
    const grid = document.getElementById('wantAdsGrid');
    grid.innerHTML = '';
    wantAds.forEach(ad => {
        const adCard = document.createElement('div');
        adCard.className = 'item-card fade-in';
        adCard.innerHTML = `
            <div class="item-image">💭</div>
            <div class="item-title">${ad.title}</div>
            <div class="item-price">Budget: ₹${ad.budget.toLocaleString()}</div>
            <div class="item-description">${ad.description}</div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-accent" onclick="openChat('want_${ad.id}', '${ad.title}', '${ad.poster}')">Contact Buyer</button>
            </div>
        `;
        grid.appendChild(adCard);
    });
}

// Review modal logic
function openReviewModal(itemId) {
    reviewTarget = purchases.find(p => p.item.id === itemId);
    document.getElementById('reviewModal').style.display = 'block';
}
function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('reviewText').value = '';
}
function submitReview() {
    const text = document.getElementById('reviewText').value.trim();
    const rating = document.getElementById('reviewRating').value;
    if (!reviewTarget || !text) {
        alert('Please write a review.');
        return;
    }
    reviewTarget.review = { text, rating };
    closeReviewModal();
    renderPurchases();
    alert('Review submitted!');
}

// Chat functions
function openChat(itemId, itemTitle, otherUser) {
    if (!currentUser) {
        alert('Please login first!');
        showLogin();
        return;
    }
    currentChat = { itemId, itemTitle, otherUser };
    document.getElementById('chatTitle').textContent = `${itemTitle} - Chat with ${otherUser}`;
    document.getElementById('chatOverlay').style.display = 'block';
    if (!chatMessages[itemId]) {
        chatMessages[itemId] = [
            { sender: otherUser, text: `Hi! I'm interested in "${itemTitle}". Can we discuss the price?`, timestamp: new Date() }
        ];
    }
    renderChatMessages();
    // Add a "Buy Now" button for buyers
    if (currentUser && currentUser.name !== otherUser) {
        document.getElementById('chatTitle').innerHTML +=
            ` <button class="btn btn-accent" style="font-size:0.8em;" onclick="markAsBought(items.find(i=>i.id==${itemId}))">Buy Now</button>`;
    }
}

function closeChat() {
    document.getElementById('chatOverlay').style.display = 'none';
    currentChat = null;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (text && currentChat) {
        if (!chatMessages[currentChat.itemId]) {
            chatMessages[currentChat.itemId] = [];
        }
        chatMessages[currentChat.itemId].push({
            sender: currentUser.name,
            text: text,
            timestamp: new Date()
        });
        input.value = '';
        renderChatMessages();
        // Simulate response after a delay
        setTimeout(() => {
            const responses = [
                "That sounds reasonable!",
                "Can you do a bit better on the price?",
                "I'm interested! When can we meet?",
                "Let me think about it and get back to you.",
                "That works for me!"
            ];
            chatMessages[currentChat.itemId].push({
                sender: currentChat.otherUser,
                text: responses[Math.floor(Math.random() * responses.length)],
                timestamp: new Date()
            });
            renderChatMessages();
        }, 1000 + Math.random() * 2000);
    }
}

function renderChatMessages() {
    const container = document.getElementById('chatMessages');
    const messages = chatMessages[currentChat.itemId] || [];
    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender === currentUser.name ? 'sent' : 'received'}">
            <strong>${msg.sender}:</strong> ${msg.text}
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function viewBids(itemId) {
    const item = items.find(i => i.id === itemId);
    if (item && item.bids.length > 0) {
        const bidsList = item.bids
            .sort((a, b) => b.amount - a.amount)
            .map(bid => `${bid.bidder}: ₹${bid.amount.toLocaleString()}`)
            .join('\n');
        alert(`Bids for ${item.title}:\n\n${bidsList}\n\nContact the highest bidder to proceed!`);
    } else {
        alert('No bids yet for this item.');
    }
}

// Simulate a purchase (for demo: buyer can "buy" from chat window)
function markAsBought(item) {
    if (!purchases.find(p => p.item.id === item.id)) {
        purchases.push({ item, review: null });
        alert('Added to your purchases!');
    }
}

// Simulate a sale (for demo: seller can "choose" a bidder)
function chooseBidder(itemId, bidder) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    let sale = sales.find(s => s.item.id === itemId);
    if (!sale) {
        sale = { item, chosenBidder: bidder, reviews: [] };
        sales.push(sale);
    } else {
        sale.chosenBidder = bidder;
    }
    alert(`You chose ${bidder} as the buyer!`);
}

// Render purchases with review option
function renderPurchases() {
    const grid = document.getElementById('purchasesGrid');
    if (purchases.length === 0) {
        grid.innerHTML = "<p>You haven't bought anything yet.</p>";
        return;
    }
    grid.innerHTML = purchases.map(p => `
        <div class="item-card fade-in">
            <div class="item-title">${p.item.title}</div>
            <div class="item-description">${p.item.description}</div>
            <div class="item-price">₹${p.item.price.toLocaleString()}</div>
            <div>Seller: ${p.item.seller}</div>
            ${p.review ? `<div>⭐ ${p.review.rating} <br>${p.review.text}</div>` :
            `<button class="btn btn-accent" onclick="openReviewModal(${p.item.id})">Leave Review</button>`}
        </div>
    `).join('');
}

// Render sales with option to choose bidder and see reviews
function renderSales() {
    const grid = document.getElementById('salesGrid');
    const mySales = items.filter(i => i.seller === currentUser.name);
    if (mySales.length === 0) {
        grid.innerHTML = "<p>You haven't sold anything yet.</p>";
        return;
    }
    grid.innerHTML = mySales.map(item => {
        const sale = sales.find(s => s.item.id === item.id);
        const chosen = sale && sale.chosenBidder ? sale.chosenBidder : null;
        const reviews = sale && sale.reviews.length ? sale.reviews.map(r => `<div>⭐ ${r.rating} <br>${r.text}</div>`).join('') : '';
        return `
        <div class="item-card fade-in">
            <div class="item-title">${item.title}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-price">₹${item.price.toLocaleString()}</div>
            <div>Bids: ${item.bids.length}</div>
            ${chosen ? `<div>Sold to: <b>${chosen}</b></div>` : renderBidderButtons(item)}
            ${reviews}
        </div>
        `;
    }).join('');
}

function renderBidderButtons(item) {
    if (!item.bids.length) return "<div>No bids yet.</div>";
    return item.bids.map(bid =>
        `<button class="btn btn-primary" onclick="chooseBidder(${item.id},'${bid.bidder}')">Choose ${bid.bidder} (₹${bid.amount})</button>`
    ).join(' ');
}

// Initialize the application
init();

// For standalone login/signup pages (if you use them)
const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '/jugaad-marketplace/' || window.location.pathname === '/jugaad-marketplace/index.html';
const isLogin = window.location.pathname.endsWith('login.html');
const isSignup = window.location.pathname.endsWith('signup.html');

if (isLogin) {
    window.login = function () {
        alert('Login successful! Redirecting...');
        window.location.href = "index.html";
    }
}
if (isSignup) {
    window.register = function () {
        alert('Registration successful! Redirecting...');
        window.location.href = "index.html";
    }
}