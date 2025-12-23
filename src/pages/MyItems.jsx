import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMarketplace } from '../context/MarketplaceContext'
import { Plus, Edit, Trash2, Eye, MapPin, ArrowLeft } from 'lucide-react'

const MyItems = () => {
  const { currentUser } = useAuth()
  const { fetchUserItems, deleteItem, loading } = useMarketplace()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (currentUser) {
      loadItems()
    }
  }, [currentUser])

  const loadItems = async () => {
    const userItems = await fetchUserItems(currentUser.uid)
    setItems(userItems)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(price)
  }

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return
    }

    setDeleting(itemId)
    const result = await deleteItem(itemId)
    setDeleting(null)

    if (result.success) {
      loadItems()
    } else {
      alert('Failed to delete item: ' + result.error)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You must be logged in to view your items.</p>
          <button
            onClick={() => navigate('/marketplace/login')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Go to Login
          </button>
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

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Items</h1>
          <Link
            to="/marketplace/create"
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
            List New Item
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-6">You haven't listed any items yet.</p>
            <Link
              to="/marketplace/create"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              List Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <Link to={`/marketplace/item/${item.id}`}>
                  <div className="relative aspect-square bg-gray-200 overflow-hidden">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <img
                        src={item.imageUrls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          console.error('Image load error:', item.imageUrls[0])
                          e.target.style.display = 'none'
                          e.target.nextSibling?.classList.remove('hidden')
                        }}
                        loading="lazy"
                      />
                    ) : null}
                    {(!item.imageUrls || item.imageUrls.length === 0) && (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm font-semibold">
                      {formatPrice(item.price)}
                    </div>
                    {item.status === 'pending' && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm">
                        Under Review
                      </div>
                    )}
                    {item.status === 'rejected' && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                        Rejected
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Eye className="w-4 h-4" />
                    <span>{item.views || 0} views</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/marketplace/item/${item.id}`}
                      className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => navigate(`/marketplace/edit/${item.id}`)}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyItems

