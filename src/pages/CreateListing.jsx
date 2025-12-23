import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMarketplace } from '../context/MarketplaceContext'
import { Upload, X, Loader, ArrowLeft } from 'lucide-react'
import { processImageFile, createImagePreview, revokeImagePreview } from '../utils/imageUtils'

const CreateListing = () => {
  const { currentUser } = useAuth()
  const { categories, createItem, loading } = useMarketplace()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'phones',
    location: '',
    condition: 'used'
  })
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [error, setError] = useState('')
  const [processingImages, setProcessingImages] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files)
    
    // Reset file input immediately
    e.target.value = ''
    
    if (images.length + files.length > 5) {
      setError('You can upload maximum 5 images')
      return
    }

    setError('')
    setProcessingImages(true)

    try {
      // Process each file (convert HEIC if needed, validate)
      const processedFiles = []
      const newPreviews = []
      const errors = []

      for (const file of files) {
        try {
          // Process file (will handle HEIC conversion if needed)
          const processedFile = await processImageFile(file, 10)
          
          // Check if it's still HEIC (conversion might have failed)
          const isStillHeic = processedFile.type === 'image/heic' || 
                             processedFile.type === 'image/heif' ||
                             processedFile.name.toLowerCase().endsWith('.heic') ||
                             processedFile.name.toLowerCase().endsWith('.heif')
          
          processedFiles.push(processedFile)
          
          // Try to create preview - might fail for HEIC in some browsers
          try {
            const previewUrl = createImagePreview(processedFile)
            newPreviews.push(previewUrl)
            
            // If it's HEIC, add a warning
            if (isStillHeic) {
              console.warn('HEIC file preview may not work in all browsers. File will still be uploaded.')
            }
          } catch (previewError) {
            console.warn('Could not create preview for', file.name, previewError)
            // Create a placeholder preview
            const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="45%25" text-anchor="middle" fill="%236b7280" font-size="14"%3EHEIC%3C/text%3E%3Ctext x="50%25" y="60%25" text-anchor="middle" fill="%239ca3af" font-size="12"%3EImage%3C/text%3E%3C/svg%3E'
            newPreviews.push(placeholder)
            if (isStillHeic) {
              errors.push(`${file.name}: Preview not available (HEIC), but file will be uploaded`)
            }
          }
        } catch (fileError) {
          console.error('Error processing file:', file, fileError)
          errors.push(`${file.name}: ${fileError.message || 'Processing failed'}`)
          continue
        }
      }

      if (errors.length > 0 && errors.length < files.length) {
        setError('Some images failed: ' + errors.join('. '))
      } else if (errors.length > 0 && processedFiles.length === 0) {
        setError('No images were added. ' + errors.join('. '))
      } else if (errors.length > 0) {
        setError(errors.join('. '))
      }

      if (processedFiles.length > 0) {
        setImages([...images, ...processedFiles])
        setImagePreviews([...imagePreviews, ...newPreviews])
      }
    } catch (error) {
      console.error('Error in handleImageChange:', error)
      setError(error.message || 'Failed to process images')
    } finally {
      setProcessingImages(false)
    }
  }

  const removeImage = (index) => {
    // Revoke the preview URL to free memory
    revokeImagePreview(imagePreviews[index])
    
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)
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
    if (images.length === 0) {
      setError('At least one image is required')
      return
    }

    if (!currentUser) {
      setError('You must be logged in to create a listing')
      return
    }

    const result = await createItem(
      formData,
      images,
      currentUser.uid,
      currentUser.name || 'Seller',
      currentUser.email || ''
    )

    if (result.success) {
      navigate(`/marketplace/item/${result.itemId}`)
      alert('Listing created successfully! Your item is pending admin approval and will be visible once approved.')
    } else {
      setError(result.error || 'Failed to create listing')
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You must be logged in to create a listing.</p>
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
          onClick={() => navigate('/marketplace')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-3xl font-bold mb-6">Create New Listing</h1>

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
                placeholder="e.g., iPhone 13 Pro Max 256GB"
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
                placeholder="Describe your item in detail..."
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
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
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
                  placeholder="e.g., Accra, Ghana"
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
                Images * (Max 5)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        console.error('Preview image error:', preview)
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af"%3EImage%3C/text%3E%3C/svg%3E'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {processingImages && (
                  <div className="aspect-square border-2 border-dashed border-green-500 rounded-lg flex items-center justify-center bg-green-50">
                    <div className="text-center">
                      <Loader className="w-8 h-8 mx-auto text-green-600 mb-2 animate-spin" />
                      <span className="text-sm text-green-600">Processing...</span>
                    </div>
                  </div>
                )}
                {images.length < 5 && !processingImages && (
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
              </div>
              {images.length > 0 && (
                <p className="text-sm text-gray-500">
                  {images.length} {images.length === 1 ? 'image' : 'images'} selected
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/marketplace')}
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
                    Creating...
                  </>
                ) : (
                  'Create Listing'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateListing

