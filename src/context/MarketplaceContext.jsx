import { createContext, useContext, useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../config/firebase'

const MarketplaceContext = createContext()

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext)
  if (!context) {
    throw new Error('useMarketplace must be used within MarketplaceProvider')
  }
  return context
}

export const MarketplaceProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [categories] = useState([
    { id: 'phones', name: 'Phones', icon: '📱' },
    { id: 'cars', name: 'Cars', icon: '🚗' },
    { id: 'appliances', name: 'Appliances', icon: '🔌' },
    { id: 'electronics', name: 'Electronics', icon: '💻' },
    { id: 'furniture', name: 'Furniture', icon: '🛋️' },
    { id: 'clothing', name: 'Clothing', icon: '👕' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'other', name: 'Other', icon: '📦' }
  ])

  // Fetch all items
  const fetchItems = async (categoryFilter = null, searchTerm = '') => {
    setLoading(true)
    try {
      const itemsRef = collection(db, 'marketplaceItems')
      // Use simpler query without orderBy to avoid index requirement
      // We'll sort client-side instead
      const q = query(itemsRef, where('status', '==', 'active'))
      
      const snapshot = await getDocs(q)
      let itemsData = []
      
      snapshot.forEach(doc => {
        const data = doc.data()
        itemsData.push({ id: doc.id, ...data })
      })

      console.log(`Fetched ${itemsData.length} active items from Firestore`)

      // Sort by createdAt client-side (newest first)
      itemsData.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        return bTime - aTime // Descending order (newest first)
      })

      // Apply filters
      if (categoryFilter) {
        itemsData = itemsData.filter(item => item.category === categoryFilter)
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        itemsData = itemsData.filter(item => 
          item.title?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.location?.toLowerCase().includes(term)
        )
      }

      console.log(`After filters: ${itemsData.length} items`)
      setItems(itemsData)
    } catch (error) {
      console.error('Error fetching items:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      // Show the error message to help debug
      if (error.code === 'failed-precondition') {
        console.error('Firestore index required. Check the error message above for the index creation link.')
      }
      // Try to fetch all items as fallback (without status filter) for debugging
      try {
        console.log('Attempting fallback: fetching all items...')
        const itemsRef = collection(db, 'marketplaceItems')
        const fallbackSnapshot = await getDocs(itemsRef)
        const allItems = []
        fallbackSnapshot.forEach(doc => {
          const data = doc.data()
          console.log(`Found item: ${doc.id}, status: ${data.status}, title: ${data.title}`)
          allItems.push({ id: doc.id, ...data })
        })
        console.log(`Fallback: Found ${allItems.length} total items in database`)
        // Filter for active items
        const activeItems = allItems.filter(item => item.status === 'active')
        console.log(`Fallback: ${activeItems.length} items have status='active'`)
        setItems(activeItems)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setItems([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch single item
  const fetchItem = async (itemId) => {
    try {
      const itemDoc = await getDoc(doc(db, 'marketplaceItems', itemId))
      if (itemDoc.exists()) {
        return { id: itemDoc.id, ...itemDoc.data() }
      }
      return null
    } catch (error) {
      console.error('Error fetching item:', error)
      return null
    }
  }

  // Fetch user's items
  const fetchUserItems = async (userId) => {
    setLoading(true)
    try {
      const itemsRef = collection(db, 'marketplaceItems')
      // Use simpler query without orderBy to avoid index requirement
      const q = query(itemsRef, where('sellerId', '==', userId))
      const snapshot = await getDocs(q)
      
      const itemsData = []
      snapshot.forEach(doc => {
        itemsData.push({ id: doc.id, ...doc.data() })
      })
      
      // Sort client-side by createdAt (newest first)
      itemsData.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        return bTime - aTime
      })
      
      return itemsData
    } catch (error) {
      console.error('Error fetching user items:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Upload image to Firebase Storage
  const uploadImage = async (file, itemId) => {
    try {
      const imageRef = ref(storage, `marketplace/${itemId}/${Date.now()}_${file.name}`)
      await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(imageRef)
      return downloadURL
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  // Create new item listing
  const createItem = async (itemData, images, userId, sellerName, sellerEmail) => {
    setLoading(true)
    try {
      // Create item document first
      const newItem = {
        title: itemData.title,
        description: itemData.description,
        price: parseFloat(itemData.price),
        category: itemData.category,
        location: itemData.location,
        condition: itemData.condition || 'used',
        sellerId: userId,
        sellerName: sellerName,
        sellerEmail: sellerEmail,
        status: 'pending', // Items need admin approval before being published
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        imageUrls: [],
        views: 0
      }

      const docRef = await addDoc(collection(db, 'marketplaceItems'), newItem)

      // Upload images
      const imageUrls = []
      if (images && images.length > 0) {
        for (const image of images) {
          const url = await uploadImage(image, docRef.id)
          imageUrls.push(url)
        }
        
        // Update item with image URLs
        await updateDoc(doc(db, 'marketplaceItems', docRef.id), {
          imageUrls: imageUrls
        })
      }

      await fetchItems()
      return { success: true, itemId: docRef.id }
    } catch (error) {
      console.error('Error creating item:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Delete image from storage
  const deleteImage = async (imageUrl) => {
    try {
      // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[ENCODED_PATH]?[QUERY]
      // Extract the path from the URL
      const url = new URL(imageUrl)
      const pathMatch = url.pathname.match(/\/o\/(.+)/)
      
      if (pathMatch) {
        // Decode the path (Firebase uses %2F for /)
        const encodedPath = pathMatch[1]
        const decodedPath = decodeURIComponent(encodedPath)
        const imageRef = ref(storage, decodedPath)
        await deleteObject(imageRef)
      } else {
        console.warn('Could not extract path from image URL:', imageUrl)
      }
      return { success: true }
    } catch (error) {
      console.error('Error deleting image:', error)
      // If image doesn't exist in storage, that's okay - continue
      return { success: true } // Return success to allow deletion from array even if storage delete fails
    }
  }

  // Update item
  const updateItem = async (itemId, updates, newImages = [], imagesToDelete = []) => {
    setLoading(true)
    try {
      const itemDoc = await getDoc(doc(db, 'marketplaceItems', itemId))
      const currentData = itemDoc.data()
      let existingImages = currentData?.imageUrls || []
      
      // Delete images from storage if specified
      if (imagesToDelete && imagesToDelete.length > 0) {
        for (const imageUrl of imagesToDelete) {
          await deleteImage(imageUrl)
        }
        // Remove deleted images from array
        existingImages = existingImages.filter(url => !imagesToDelete.includes(url))
      }

      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
        imageUrls: existingImages
      }

      // Upload new images if provided
      if (newImages && newImages.length > 0) {
        const newImageUrls = []
        for (const image of newImages) {
          const url = await uploadImage(image, itemId)
          newImageUrls.push(url)
        }
        updateData.imageUrls = [...existingImages, ...newImageUrls]
      }

      // If status was active and item is being edited, set back to pending for review
      if (currentData?.status === 'active' && !updates.status) {
        updateData.status = 'pending'
      }

      await updateDoc(doc(db, 'marketplaceItems', itemId), updateData)
      await fetchItems()
      return { success: true }
    } catch (error) {
      console.error('Error updating item:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Approve item (admin only)
  const approveItem = async (itemId) => {
    setLoading(true)
    try {
      await updateDoc(doc(db, 'marketplaceItems', itemId), {
        status: 'active',
        approvedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      await fetchItems()
      return { success: true }
    } catch (error) {
      console.error('Error approving item:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Reject item (admin only)
  const rejectItem = async (itemId, reason = '') => {
    setLoading(true)
    try {
      await updateDoc(doc(db, 'marketplaceItems', itemId), {
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: Timestamp.now()
      })
      await fetchItems()
      return { success: true }
    } catch (error) {
      console.error('Error rejecting item:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Delete item
  const deleteItem = async (itemId) => {
    setLoading(true)
    try {
      await deleteDoc(doc(db, 'marketplaceItems', itemId))
      await fetchItems()
      return { success: true }
    } catch (error) {
      console.error('Error deleting item:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Increment views
  const incrementViews = async (itemId) => {
    try {
      const itemDoc = await getDoc(doc(db, 'marketplaceItems', itemId))
      const currentViews = itemDoc.data()?.views || 0
      await updateDoc(doc(db, 'marketplaceItems', itemId), {
        views: currentViews + 1
      })
    } catch (error) {
      console.error('Error incrementing views:', error)
    }
  }

  // Fetch all items for admin
  const fetchAllItems = async () => {
    setLoading(true)
    try {
      const itemsRef = collection(db, 'marketplaceItems')
      // Fetch all items without orderBy, sort client-side
      const snapshot = await getDocs(itemsRef)
      
      const itemsData = []
      snapshot.forEach(doc => {
        itemsData.push({ id: doc.id, ...doc.data() })
      })
      
      // Sort client-side by createdAt (newest first)
      itemsData.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        return bTime - aTime
      })
      
      return itemsData
    } catch (error) {
      console.error('Error fetching all items:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const value = {
    items,
    categories,
    loading,
    fetchItems,
    fetchItem,
    fetchUserItems,
    fetchAllItems,
    createItem,
    updateItem,
    deleteItem,
    deleteImage,
    approveItem,
    rejectItem,
    incrementViews
  }

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
}

