# Firebase Security Rules for MARKET KUMASI Marketplace

## Firestore Database Rules

Go to **Firestore Database** → **Rules** tab in Firebase Console and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection - user can read/write their own document
    match /users/{userId} {
      // User can read/write their own document
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
      
      // Admins can read all user documents (for user management)
      allow read: if isAdmin();
      
      // Admins can update any user document (for approval/rejection/role changes)
      allow update: if isAdmin();
      
      // Allow creating user documents during registration
      // IMPORTANT: This allows authenticated users to create their own user document
      allow create: if isAuthenticated() && request.auth.uid == userId && 
        request.resource.data.email == request.auth.token.email;
    }
    
    // Marketplace items collection
    match /marketplaceItems/{itemId} {
      // Anyone can read active items (public browsing)
      // Authenticated users can read all items (including inactive for their own items)
      allow read: if resource.data.status == 'active' || isAuthenticated();
      
      // Authenticated users can create new listings
      allow create: if isAuthenticated() && 
        request.resource.data.sellerId == request.auth.uid;
      
      // Users can update/delete their own items
      // Admins can update/delete any item
      allow update, delete: if isAuthenticated() && 
        (resource.data.sellerId == request.auth.uid || isAdmin());
    }
  }
}
```

## Storage Rules

Go to **Storage** → **Rules** tab in Firebase Console and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Marketplace images
    match /marketplace/{itemId}/{allPaths=**} {
      // Anyone can read images (for displaying listings)
      allow read: if true;
      
      // Only authenticated users can upload images
      // Note: The app validates item ownership before allowing uploads
      allow write: if request.auth != null;
    }
  }
}
```

## Setup Checklist

Make sure you've enabled these services in Firebase Console:

- [ ] **Authentication** - Enable Email/Password sign-in method
- [ ] **Firestore Database** - Create database and set rules above
- [ ] **Storage** - Enable storage and set rules above
- [ ] **Analytics** - Already enabled (optional, but configured)

## Creating an Admin User

After a user registers through the app:

1. Go to **Firestore Database** → **users** collection
2. Find the user document (by their user ID from Firebase Authentication)
3. Edit the document and add a field: `role` with value `"admin"` (as a string)
4. Save

The admin will then have access to the admin panel at `/marketplace/admin`

## Testing the Rules

After setting up the rules, test them:

1. **Public Access**: Try to read active marketplace items (should work)
2. **Authenticated Access**: Login and try to create a listing (should work)
3. **Admin Access**: Login as admin and try to delete any item (should work)
4. **Image Upload**: Login and try to upload an image when creating a listing (should work)

## Important Notes

- The rules use helper functions for cleaner, more maintainable code
- Admin checks verify the user document exists before checking role
- Marketplace items can be read by anyone if status is 'active'
- Users can only modify their own items (admins can modify any)
- Storage rules allow public reads but require authentication for writes
- Always test rules in the Firebase Console Rules Playground before deploying
