# MARKET KUMASI Marketplace

A modern online marketplace similar to eBay, built with React and Firebase. Users can create accounts, post items (phones, cars, appliances, etc.), browse listings, and contact sellers.

## Features

- ✅ User authentication (register/login)
- ✅ Browse items by category
- ✅ Search functionality
- ✅ Create and manage listings
- ✅ Image uploads (up to 5 images per item)
- ✅ Item detail pages with image gallery
- ✅ User dashboard (My Items)
- ✅ Admin panel for managing all items
- ✅ Responsive design
- ✅ Modern UI with Tailwind CSS

## Categories

- 📱 Phones
- 🚗 Cars
- 🔌 Appliances
- 💻 Electronics
- 🛋️ Furniture
- 👕 Clothing
- 📚 Books
- 📦 Other

## Tech Stack

- **Frontend**: React 18, React Router
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Build Tool**: Vite

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   - Firebase config is already set up in `src/config/firebase.js` with project: `market-kumasi`
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Enable Storage
   - Set up Firestore security rules (see FIREBASE_RULES.md)

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Firebase Setup

See `FIREBASE_RULES.md` for detailed Firestore and Storage security rules.

## Creating an Admin User

### Quick Setup:
1. **Register the account** through the app at `/marketplace/register`
   - Email: brains494@icloud.com
   - Password: Brains123.#
   - Name: ibrahim mohammed

2. **Go to Firebase Console** → Firestore Database → `users` collection

3. **Find the user document** (by email or user ID from Firebase Authentication)

4. **Edit the document** and set:
   - `role: "admin"` (string)
   - `status: "approved"` (string)

5. **Save** - The user can now login and access `/marketplace/admin`

For detailed instructions, see [ADMIN_SETUP.md](./ADMIN_SETUP.md)

## Project Structure

```
marketkumasi/
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase configuration
│   ├── context/
│   │   ├── AuthContext.jsx      # Authentication context
│   │   └── MarketplaceContext.jsx # Marketplace data context
│   ├── pages/
│   │   ├── MarketplaceHome.jsx  # Homepage with listings
│   │   ├── CreateListing.jsx    # Create new listing
│   │   ├── ItemDetail.jsx       # Item detail page
│   │   ├── MyItems.jsx          # User's items dashboard
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration page
│   │   └── MarketplaceAdmin.jsx # Admin panel
│   ├── App.jsx                  # Main app component with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## License

MIT

