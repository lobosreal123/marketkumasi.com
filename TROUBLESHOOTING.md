# Troubleshooting Guide

## Registration 400 Error

If you're getting a 400 error when creating the first user, check the following:

### 1. Enable Firebase Authentication

**Problem**: Email/Password authentication is not enabled

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `market-kumasi`
3. Click **Authentication** in left sidebar
4. Click **Sign-in method** tab
5. Find **Email/Password** provider
6. Click on it and **Enable** it
7. Click **Save**

### 2. Check Firestore Security Rules

**Problem**: Security rules might be blocking user creation

**Solution**:
1. Go to Firebase Console → **Firestore Database** → **Rules** tab
2. Make sure your rules include:

```javascript
match /users/{userId} {
  // Allow creating user documents during registration
  allow create: if isAuthenticated() && request.auth.uid == userId && 
    request.resource.data.email == request.auth.token.email;
  
  // User can read/write their own document
  allow read, write: if isAuthenticated() && request.auth.uid == userId;
  
  // Admins can read all users
  allow read: if isAdmin();
  
  // Admins can update any user
  allow update: if isAdmin();
}
```

3. Click **Publish** to save rules

### 3. Check Browser Console

**Problem**: Need to see detailed error information

**Solution**:
1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Try registering again
4. Look for error messages that start with:
   - `❌ Firebase Auth error:`
   - `❌ Firestore error:`
   - These will tell you exactly what's wrong

### 4. Verify Firebase Configuration

**Problem**: Firebase config might be incorrect

**Check**:
1. Open `src/config/firebase.js`
2. Verify `projectId` matches your Firebase project: `market-kumasi`
3. Verify `apiKey` is correct
4. Check browser console for config errors

### 5. Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/operation-not-allowed` | Email/Password not enabled | Enable in Firebase Console |
| `permission-denied` | Firestore rules blocking | Update security rules |
| `auth/email-already-in-use` | Email exists | Use different email |
| `auth/weak-password` | Password too short | Use 6+ characters |
| `auth/invalid-email` | Invalid email format | Check email format |
| `unavailable` | Firebase service down | Try again later |

### 6. Step-by-Step Registration Debug

The code now logs each step:
- ✅ Step 1: Creating Firebase Auth user
- ✅ Step 2: Updating profile  
- ✅ Step 3: Creating Firestore document

Check the console to see which step fails.

### 7. Manual First User Creation (Alternative)

If registration keeps failing, you can create the first user manually:

1. Go to Firebase Console → **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Add user**
5. Copy the **User UID**
6. Go to **Firestore Database** → `users` collection
7. Add document with the UID as document ID
8. Add fields:
   - `email`: (user email)
   - `name`: (user name)
   - `role`: `"admin"` or `"user"`
   - `status`: `"approved"`
   - `createdAt`: (current timestamp)

Then the user can login directly.

---

## Still Having Issues?

1. **Check browser console** - Full error details are logged
2. **Check Firebase Console** - Look for errors in Authentication and Firestore
3. **Verify all services are enabled**:
   - ✅ Authentication (Email/Password)
   - ✅ Firestore Database
   - ✅ Storage
4. **Check network tab** - See the actual HTTP request/response

