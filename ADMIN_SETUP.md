# How to Create an Admin Account

## Method 1: Register and Update in Firestore (Recommended)

### Step 1: Register the Account
1. Go to your marketplace website
2. Navigate to `/marketplace/register`
3. Register with the following details:
   - **Name**: ibrahim mohammed
   - **Email**: brains494@icloud.com
   - **Password**: Brains123.#

### Step 2: Make it an Admin in Firestore

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `market-kumasi`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Data" tab

3. **Find the User Document**
   - Click on the `users` collection
   - Find the document with email `brains494@icloud.com`
   - Or look for the document ID that matches the user's UID (you can find this in Firebase Authentication)

4. **Edit the Document**
   - Click on the document to open it
   - Click the "Edit document" button (pencil icon)
   - Add/Update these fields:
     ```
     role: "admin" (string)
     status: "approved" (string)
     ```
   - Click "Update" to save

### Step 3: Verify
- The user should now be able to login and access the admin panel at `/marketplace/admin`

---

## Method 2: Using Firebase Authentication Directly (Alternative)

If you prefer to create the user directly in Firebase:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `market-kumasi`

2. **Create User in Authentication**
   - Click on "Authentication" in the left sidebar
   - Click "Add user" or "Users" tab → "Add user"
   - Enter:
     - Email: `brains494@icloud.com`
     - Password: `Brains123.#`
   - Click "Add user"

3. **Create User Document in Firestore**
   - Go to Firestore Database → `users` collection
   - Click "Add document"
   - Use the User UID (from Authentication) as the document ID
   - Add fields:
     ```
     email: "brains494@icloud.com" (string)
     name: "ibrahim mohammed" (string)
     role: "admin" (string)
     status: "approved" (string)
     createdAt: (timestamp - current date/time)
     ```
   - Click "Save"

---

## Important Notes

- **Admin users** can:
  - Approve/reject user registrations
  - Approve/reject marketplace items
  - Delete any items
  - Access the admin panel at `/marketplace/admin`

- **Security**: Only approved admins can access admin features. The system checks both `role: "admin"` AND `status: "approved"` (or the user must be an admin - admins are auto-approved).

- **First Admin**: For the first admin account, you'll need to set it manually in Firestore as shown above.

---

## Quick Reference: Firestore Document Structure

```json
{
  "email": "brains494@icloud.com",
  "name": "ibrahim mohammed",
  "role": "admin",
  "status": "approved",
  "createdAt": "2025-01-XX..."
}
```

