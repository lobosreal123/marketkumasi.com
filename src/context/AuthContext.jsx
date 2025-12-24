import { createContext, useContext, useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth'
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, query, where } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Register new user
  const register = async (email, password, name) => {
    try {
      console.log('Starting registration for:', email)
      console.log('Firebase config check:', {
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
      })

      // Step 1: Create Firebase Auth user
      console.log('Step 1: Creating Firebase Auth user...')
      let userCredential
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
        console.log('✅ Firebase Auth user created:', userCredential.user.uid)
      } catch (authError) {
        console.error('❌ Firebase Auth error:', authError)
        console.error('Error code:', authError.code)
        console.error('Error message:', authError.message)
        throw authError
      }

      // Step 2: Update profile
      console.log('Step 2: Updating profile...')
      try {
        await updateProfile(userCredential.user, { displayName: name })
        console.log('✅ Profile updated')
      } catch (profileError) {
        console.error('❌ Profile update error:', profileError)
        // Continue anyway, profile update is not critical
      }
      
      // Step 3: Create user document in Firestore
      console.log('Step 3: Creating Firestore user document...')
      const userDoc = {
        email: email,
        name: name,
        role: 'user',
        status: 'pending', // Users need admin approval
        createdAt: new Date().toISOString()
      }
      
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc)
        console.log('✅ Firestore document created successfully')
      } catch (firestoreError) {
        console.error('❌ Firestore error:', firestoreError)
        console.error('Error code:', firestoreError.code)
        console.error('Error message:', firestoreError.message)
        
        // If Firestore fails but Auth succeeded, we still have a user
        // Delete the Auth user to keep things clean
        try {
          await userCredential.user.delete()
          console.log('Cleaned up Auth user due to Firestore error')
        } catch (deleteError) {
          console.error('Could not clean up Auth user:', deleteError)
        }
        
        throw firestoreError
      }
      
      console.log('✅ Registration completed successfully')
      return { 
        success: true, 
        message: 'Registration successful!'
      }
    } catch (error) {
      console.error('Registration failed with error:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      
      let errorMessage = 'Registration failed'
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already registered'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/Password authentication is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method'
      } else if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Check Firestore security rules. Error: ' + error.message
      } else if (error.code === 'unavailable') {
        errorMessage = 'Firebase service is temporarily unavailable. Please try again later.'
      } else {
        errorMessage = `Registration failed: ${error.message || error.code || 'Unknown error'}`
      }
      
      return { success: false, error: errorMessage, errorDetails: error }
    }
  }

  // Login with email and password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      
      let userData = {}
      if (userDoc.exists()) {
        userData = userDoc.data()
      }
      
          // Check if user is approved
          if (userData?.status !== 'approved' && userData?.role !== 'admin') {
            throw new Error('Your account is pending approval. Please contact an administrator.')
          }

          const user = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: userCredential.user.displayName || userData?.name || 'User',
            role: userData?.role || 'user',
            status: userData?.status || 'pending'
          }
      
      setCurrentUser(user)
      return { success: true, user }
    } catch (error) {
      let errorMessage = 'Login failed'
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      }
      return { success: false, error: errorMessage }
    }
  }

  // Logout
  const logout = async () => {
    try {
      await signOut(auth)
      setCurrentUser(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          let userData = {}
          if (userDoc.exists()) {
            userData = userDoc.data()
          }
          
          // Only set user if approved or admin
          if (userData?.status === 'approved' || userData?.role === 'admin') {
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || userData?.name || 'User',
              role: userData?.role || 'user',
              status: userData?.status || 'pending'
            })
          } else {
            setCurrentUser(null)
            await signOut(auth)
          }
        } catch (error) {
          console.error('Error loading user data:', error)
          setCurrentUser(null)
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Send password reset email
  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true, message: 'Password reset email sent. Please check your inbox.' }
    } catch (error) {
      let errorMessage = 'Failed to send password reset email'
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      }
      return { success: false, error: errorMessage }
    }
  }

  // Reset password with code
  const resetPassword = async (code, newPassword) => {
    try {
      await confirmPasswordReset(auth, code, newPassword)
      return { success: true, message: 'Password reset successfully' }
    } catch (error) {
      let errorMessage = 'Failed to reset password'
      if (error.code === 'auth/expired-action-code') {
        errorMessage = 'Reset code has expired. Please request a new one.'
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid reset code'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters'
      }
      return { success: false, error: errorMessage }
    }
  }

  // Verify password reset code
  const verifyResetCode = async (code) => {
    try {
      const email = await verifyPasswordResetCode(auth, code)
      return { success: true, email }
    } catch (error) {
      return { success: false, error: 'Invalid or expired reset code' }
    }
  }

  // Fetch all users (admin only)
  const fetchAllUsers = async () => {
    try {
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(usersRef)
      const users = []
      snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() })
      })
      return users
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  // Approve user (admin only)
  const approveUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      console.error('Error approving user:', error)
      return { success: false, error: error.message }
    }
  }

  // Reject user (admin only)
  const rejectUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      console.error('Error rejecting user:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    sendPasswordReset,
    resetPassword,
    verifyResetCode,
    fetchAllUsers,
    approveUser,
    rejectUser
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

