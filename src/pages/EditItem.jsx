import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMarketplace } from '../context/MarketplaceContext'
import { Upload, X, Loader, ArrowLeft, Save } from 'lucide-react'
import { processImageFile, createImagePreview, revokeImagePreview } from '../utils/imageUtils'

const EditItem = () => {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { fetchItem, updateItem, loading } = useMarketplace()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'phones',
    location: '',
    condition: 'used'
  })
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])
  const [error, setError] = useState('')
  const [processingImages, setProcessingImages] = useState(false)

  useEffect(() => {
    loadItem()
  }, [itemId])

  const loadItem = async () => {
    const item = await fetchItem(itemId)
    if (item) {
      if (item.sellerId !== currentUser?.uid && currentUser?.role !== 'admin') {
        navigate('/marketplace')
        return
      }

      setFormData({
        title: item.title || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        category: item.category || 'phones',
        location: item.location || '',
        condition: item.condition || 'used'
      })
      setExistingImages(item.imageUrls || [])
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files)
    e.target.value = ''
    
    const totalImages = existingImages.length + newImages.length + files.length
    if (totalImages > 5) {
      setError('You can have maximum 5 images')
      return
    }

    setError('')
    setProcessingImages(true)

    try {
      const processedFiles = []
      const newPreviews = []
      const errors = []

      for (const file of files) {
        try {
          const processedFile = await processImageFile(file, 10)
          processedFiles.push(processedFile)
          const previewUrl = createImagePreview(processedFile)
          newPreviews.push(previewUrl)
        } catch (fileError) {
          errors.push(`${file.name}: ${fileError.message || 'Processing failed'}`)
        }
      }

      if (errors.length > 0) {
        setError(errors.join('. '))
      }

      if (processedFiles.length > 0) {
        setNewImages([...newImages, ...processedFiles])
        setNewImagePreviews([...newImagePreviews, ...newPreviews])
      }
    } catch (error) {
      setError(error.message || 'Failed to process images')
    } finally {
      setProcessingImages(false)
    }
  }

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  const removeNewImage = (index) => {
    revokeImagePreview(newImagePreviews[index])
    setNewImages(newImages.filter((_, i) => i !== index))
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    if (!formData.description.trim()) {
      setError('Description is required')
      return
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required')
      return
    }
    if (!formData.location.trim()) {
      setError('Location is required')
      return
    }

    const updates = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      location: formData.location,
      condition: formData.condition
    }

    // Get images to delete (existing images that were removed)
    const item = await fetchItem(itemId)
    const originalImages = item?.imageUrls || []
    const imagesToDelete = originalImages.filter(url => !existingImages.includes(url))

    const result = await updateItem(itemId, updates, newImages, imagesToDelete)

    if (result.success) {
      navigate(`/marketplace/item/${itemId}`)
    } else {
      setError(result.error || 'Failed to update listing')
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You must be logged in to edit listings.</p>
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(`/marketplace/item/${itemId}`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Item
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-3xl font-bold mb-6">Edit Listing</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (GHS) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="phones">📱 Phones</option>
                  <option value="cars">🚗 Cars</option>
                  <option value="appliances">🔌 Appliances</option>
                  <option value="electronics">💻 Electronics</option>
                  <option value="furniture">🛋️ Furniture</option>
                  <option value="clothing">👕 Clothing</option>
                  <option value="books">📚 Books</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="used">Used</option>
                  <option value="fair">Fair</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images (Max 5 total)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {/* Existing images */}
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square group">
                    <img
                      src={url}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* New image previews */}
                {newImagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative aspect-square group">
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-green-300"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                      New
                    </div>
                  </div>
                ))}

                {/* Add image button */}
                {existingImages.length + newImages.length < 5 && !processingImages && (
                  <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-500 transition">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Add Photo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={processingImages}
                    />
                  </label>
                )}

                {processingImages && (
                  <div className="aspect-square border-2 border-dashed border-green-500 rounded-lg flex items-center justify-center bg-green-50">
                    <div className="text-center">
                      <Loader className="w-8 h-8 mx-auto text-green-600 mb-2 animate-spin" />
                      <span className="text-sm text-green-600">Processing...</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {existingImages.length + newImages.length} of 5 images
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(`/marketplace/item/${itemId}`)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditItem

