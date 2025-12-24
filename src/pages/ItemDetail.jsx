import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMarketplace } from '../context/MarketplaceContext'
import { MapPin, Eye, User, Mail, Calendar, Edit, Trash2, ArrowLeft, Lock } from 'lucide-react'

const ItemDetail = () => {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { fetchItem, deleteItem, incrementViews, loading } = useMarketplace()
  const [item, setItem] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [itemLoading, setItemLoading] = useState(true)

  useEffect(() => {
    const loadItem = async () => {
      setItemLoading(true)
      const itemData = await fetchItem(itemId)
      if (itemData) {
        setItem(itemData)
        
        // Only increment views if user is logged in
        if (currentUser) {
          await incrementViews(itemId)
        } else {
          // Show login prompt for non-logged-in users
          setShowLoginPrompt(true)
        }
      }
      setItemLoading(false)
    }
    loadItem()
  }, [itemId, currentUser])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(price)
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return
    }

    setDeleting(true)
    const result = await deleteItem(itemId)
    setDeleting(false)

    if (result.success) {
      navigate('/marketplace')
    } else {
      alert('Failed to delete item: ' + result.error)
    }
  }

  const isOwner = currentUser && item && item.sellerId === currentUser.uid

  // Show loading state while fetching item
  if (itemLoading || (!item && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading item...</p>
        </div>
      </div>
    )
  }

  // Only show "Item Not Found" after loading is complete and item is still null
  if (!item && !itemLoading && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Item Not Found</h2>
          <p className="text-gray-600 mb-6">The item you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/marketplace"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  // Show login prompt for non-logged-in users
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </Link>

          <div className="bg-white rounded-lg shadow-md overflow-hidden relative">
            {/* Blurred preview of item */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8 opacity-40 blur-sm">
              <div>
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <img
                      src={item.imageUrls[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-6xl">📦</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
                <div className="text-3xl font-bold text-green-600 mb-4">
                  {formatPrice(item.price)}
                </div>
                <p className="text-gray-600">{item.location}</p>
              </div>
            </div>

            {/* Login prompt overlay - centered */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
              <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4 text-center border-2 border-green-200">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Create Account to View Details</h2>
                <p className="text-gray-600 mb-6">
                  Sign up or log in to see full item details, contact the seller, and view all images.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/marketplace/register"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Create Account
                  </Link>
                  <Link
                    to="/marketplace/login"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Login
                  </Link>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Already have an account? <Link to="/marketplace/login" className="text-green-600 hover:underline font-semibold">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8">
            <div>
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4 relative">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  <>
                    <img
                      src={item.imageUrls[selectedImageIndex]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image load error:', item.imageUrls[selectedImageIndex])
                        e.target.style.display = 'none'
                        const fallback = e.target.nextElementSibling
                        if (fallback) fallback.classList.remove('hidden')
                      }}
                      loading="lazy"
                    />
                    <div className="hidden w-full h-full flex items-center justify-center text-gray-400 absolute inset-0">
                      <span className="text-6xl">📦</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-6xl">📦</span>
                  </div>
                )}
              </div>
              {item.imageUrls && item.imageUrls.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {item.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 relative ${
                        selectedImageIndex === index
                          ? 'border-green-600'
                          : 'border-gray-300'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`${item.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Thumbnail load error:', url)
                          e.target.style.display = 'none'
                        }}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
                  <div className="text-3xl font-bold text-green-600 mb-4">
                    {formatPrice(item.price)}
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/marketplace/edit/${itemId}`)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span>{item.views || 0} views</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span>Listed on {formatDate(item.createdAt)}</span>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Seller Information</h2>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{item.sellerName || 'Seller'}</span>
                  </div>
                  {item.sellerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <a
                        href={`mailto:${item.sellerEmail}?subject=Inquiry about ${item.title}`}
                        className="text-green-600 hover:underline"
                      >
                        {item.sellerEmail}
                      </a>
                    </div>
                  )}
                </div>
                <button
                  className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  onClick={() => {
                    if (item.sellerEmail) {
                      window.location.href = `mailto:${item.sellerEmail}?subject=Inquiry about ${item.title}`
                    }
                  }}
                >
                  Contact Seller
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemDetail

