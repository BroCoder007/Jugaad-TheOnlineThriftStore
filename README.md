# JUGAAD Marketplace

Welcome to **JUGAAD Marketplace** – an online thrift store platform for buying and selling items in a smart, user-friendly environment. Users can browse listings, post items for sale, manage their purchase and sales history, leave reviews, and chat in real-time for negotiations and bidding.

## Features

- **User Authentication**: Secure login and registration.
- **Item Listings**: Browse, post, and bid on items for sale.
- **Purchase & Sales History**: Track your buying and selling activity.
- **Review System**: Leave and view reviews for purchased items.
- **Chat Interface**: Real-time chat for buyers and sellers.
- **Customizable Settings**: Personalize your experience with themes, notifications, and privacy options.

## Project Structure

```
Jugaad-TheOnlineThriftStore
├── public/
│   ├── app.js
│   ├── index.html
│   └── login.html
├── src/
│   ├── assets/
│   ├── main.js
│   ├── components/
│   │   ├── ChatInterface.js
│   │   ├── ItemList.js
│   │   ├── PurchaseHistory.js
│   │   ├── ReviewSystem.js
│   │   ├── SalesHistory.js
│   │   └── UserProfile.js
│   ├── style/
│   │   └── styles.css
│   └── utils/
│       └── api.js
├── .github/
│   └── workflows/
│       └── github-pages.yml
├── .gitattributes
└── README.md
```

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/BroCoder007/Jugaad-TheOnlineThriftStore.git
   cd Jugaad-TheOnlineThriftStore
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Run the application:**
   ```sh
   npm start
   ```

4. **Build for production:**
   ```sh
   npm run build
   ```

5. **Deploy to GitHub Pages:**
   - The project uses GitHub Actions for deployment.
   - See [.github/workflows/github-pages.yml](.github/workflows/github-pages.yml) for details.

## Main Components

- [`src/components/ItemList.js`](src/components/ItemList.js): Displays items for sale.
- [`src/components/PurchaseHistory.js`](src/components/PurchaseHistory.js): Shows user's purchases.
- [`src/components/SalesHistory.js`](src/components/SalesHistory.js): Shows user's sales.
- [`src/components/ReviewSystem.js`](src/components/ReviewSystem.js): Review and rating system.
- [`src/components/ChatInterface.js`](src/components/ChatInterface.js): Real-time chat between users.
- [`src/components/UserProfile.js`](src/components/UserProfile.js): User profile and settings.
- [`src/utils/api.js`](src/utils/api.js): API utility functions.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for improvements or new features.

## License

This project is licensed under the MIT License.

## Repository