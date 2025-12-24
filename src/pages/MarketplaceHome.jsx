import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { useAuth } from '../context/AuthContext'
import { Search, MapPin, Eye, LogOut, User } from 'lucide-react'

const MarketplaceHome = () => {
  const { items, categories, loading, fetchItems } = useMarketplace()
  const { currentUser, logout } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchItems(selectedCategory, searchTerm)
  }, [selectedCategory, searchTerm])

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
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/marketplace'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/marketplace" className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              MARKET KUMASI
            </Link>
            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <Link to="/marketplace/my-items" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    My Items
                  </Link>
                  <Link to="/marketplace/create" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Sell Item
                  </Link>
                  {currentUser.role === 'admin' && (
                    <Link to="/marketplace/admin" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                      Admin
                    </Link>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{currentUser.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/marketplace/login" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    Login
                  </Link>
                  <Link to="/marketplace/register" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                selectedCategory === null
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Items
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-2">No active items found.</p>
            {currentUser && currentUser.role === 'admin' && (
              <p className="text-sm text-gray-500 mb-4">
                Items need admin approval before they appear in the marketplace. Check the admin panel to approve pending items.
              </p>
            )}
            {currentUser && (
              <Link
                to="/marketplace/create"
                className="mt-4 inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                List Your First Item
              </Link>
            )}
            {!currentUser && (
              <p className="text-sm text-gray-500 mt-4">
                <Link to="/marketplace/register" className="text-green-600 hover:underline">Sign up</Link> to start listing items
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Found {items.length} {items.length === 1 ? 'item' : 'items'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map(item => (
                <Link
                  key={item.id}
                  to={`/marketplace/item/${item.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group relative"
                >
                  <div className="relative aspect-square bg-gray-200 overflow-hidden">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <img
                        src={item.imageUrls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{item.views || 0}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default MarketplaceHome

