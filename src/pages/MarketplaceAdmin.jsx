import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMarketplace } from '../context/MarketplaceContext'
import { Trash2, Eye, ArrowLeft, AlertCircle, CheckCircle, XCircle, Users, Package } from 'lucide-react'

const MarketplaceAdmin = () => {
  const { currentUser, fetchAllUsers, approveUser, rejectUser } = useAuth()
  const { fetchAllItems, deleteItem, approveItem, rejectItem, loading } = useMarketplace()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('items') // 'items' or 'users'
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [deleting, setDeleting] = useState(null)
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      loadItems()
      loadUsers()
    }
  }, [currentUser])

  const loadItems = async () => {
    const allItems = await fetchAllItems()
    setItems(allItems)
  }

  const loadUsers = async () => {
    const allUsers = await fetchAllUsers()
    setUsers(allUsers)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(price)
  }

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
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

  const handleApproveItem = async (itemId) => {
    setProcessing(itemId)
    const result = await approveItem(itemId)
    setProcessing(null)

    if (result.success) {
      loadItems()
    } else {
      alert('Failed to approve item: ' + result.error)
    }
  }

  const handleRejectItem = async (itemId) => {
    const reason = prompt('Enter rejection reason (optional):')
    if (reason === null) return // User cancelled

    setProcessing(itemId)
    const result = await rejectItem(itemId, reason)
    setProcessing(null)

    if (result.success) {
      loadItems()
    } else {
      alert('Failed to reject item: ' + result.error)
    }
  }

  const handleApproveUser = async (userId) => {
    setProcessing(userId)
    const result = await approveUser(userId)
    setProcessing(null)

    if (result.success) {
      loadUsers()
    } else {
      alert('Failed to approve user: ' + result.error)
    }
  }

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user?')) {
      return
    }

    setProcessing(userId)
    const result = await rejectUser(userId)
    setProcessing(null)

    if (result.success) {
      loadUsers()
    } else {
      alert('Failed to reject user: ' + result.error)
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You must be logged in to access the admin panel.</p>
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

  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need admin privileges to access this page.</p>
          <Link
            to="/marketplace"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  const pendingItems = items.filter(item => item.status === 'pending')
  const activeItems = items.filter(item => item.status === 'active')
  const rejectedItems = items.filter(item => item.status === 'rejected')

  const pendingUsers = users.filter(user => user.status === 'pending')
  const approvedUsers = users.filter(user => user.status === 'approved')
  const rejectedUsers = users.filter(user => user.status === 'rejected')

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

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === 'items'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="w-5 h-5 inline-block mr-2" />
              Items ({pendingItems.length} pending)
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-semibold border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5 inline-block mr-2" />
              Users ({pendingUsers.length} pending)
            </button>
          </div>

          {activeTab === 'items' ? (
            <>
              <div className="mb-6 flex gap-4">
                <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm font-semibold text-yellow-800">Pending: {pendingItems.length}</span>
                </div>
                <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-semibold text-green-800">Active: {activeItems.length}</span>
                </div>
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm font-semibold text-red-800">Rejected: {rejectedItems.length}</span>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading items...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No items found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seller
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.imageUrls && item.imageUrls.length > 0 ? (
                              <img
                                src={item.imageUrls[0]}
                                alt={item.title}
                                className="h-16 w-16 object-cover rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling?.classList.remove('hidden')
                                }}
                                loading="lazy"
                              />
                            ) : null}
                            <div className={`h-16 w-16 bg-gray-200 rounded flex items-center justify-center ${item.imageUrls && item.imageUrls.length > 0 ? 'hidden' : ''}`}>
                              <span className="text-2xl">📦</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            {formatPrice(item.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.sellerName || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : item.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {item.views || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Link
                                to={`/marketplace/item/${item.id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              {item.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveItem(item.id)}
                                    disabled={processing === item.id}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectItem(item.id)}
                                    disabled={processing === item.id}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDelete(item.id)}
                                disabled={deleting === item.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-6 flex gap-4">
                <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-sm font-semibold text-yellow-800">Pending: {pendingUsers.length}</span>
                </div>
                <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-semibold text-green-800">Approved: {approvedUsers.length}</span>
                </div>
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-sm font-semibold text-red-800">Rejected: {rejectedUsers.length}</span>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No users found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role || 'user'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : user.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              {user.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveUser(user.id)}
                                    disabled={processing === user.id}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectUser(user.id)}
                                    disabled={processing === user.id}
                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MarketplaceAdmin
