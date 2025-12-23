// Image utility functions for handling various formats including HEIC

/**
 * Convert HEIC/HEIF image to JPEG/PNG using browser APIs
 * Note: Native browser support for HEIC is limited. 
 * For full support, consider using heic2any library: npm install heic2any
 */
export const convertHeicToJpeg = async (file) => {
  // Check if file is HEIC/HEIF
  const isHeic = file.type === 'image/heic' || 
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif')

  if (!isHeic) {
    // Not HEIC, return original file
    return file
  }

  console.log('Attempting to convert HEIC file:', file.name)

  // Try using browser's ImageDecoder API (Chrome/Edge 94+)
  if (typeof ImageDecoder !== 'undefined') {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const decoder = new ImageDecoder({ 
        data: arrayBuffer, 
        type: 'image/heic' 
      })
      
      const { image } = await decoder.decode()
      
      const canvas = document.createElement('canvas')
      canvas.width = image.displayWidth
      canvas.height = image.displayHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0)
      
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const jpegFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            console.log('HEIC converted successfully using ImageDecoder')
            resolve(jpegFile)
          } else {
            console.warn('ImageDecoder conversion failed - blob is null')
            // Return original file instead of rejecting
            resolve(file)
          }
        }, 'image/jpeg', 0.92)
      })
    } catch (error) {
      console.warn('ImageDecoder API failed, trying canvas fallback:', error.message)
      // Fall through to try basic canvas conversion
    }
  } else {
    console.log('ImageDecoder not available, trying canvas conversion')
  }

  // Fallback: Try basic canvas conversion (may not work for HEIC)
  try {
    const converted = await convertWithCanvas(file)
    console.log('HEIC converted successfully using canvas')
    return converted
  } catch (error) {
    console.warn('Canvas conversion also failed for HEIC:', error.message)
    console.log('Allowing HEIC file through without conversion. File will be uploaded as-is.')
    // Always return the original file - never throw
    return file
  }
}

/**
 * Basic canvas conversion (works for standard formats, limited HEIC support)
 */
const convertWithCanvas = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const jpegFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(jpegFile)
          } else {
            reject(new Error('Canvas conversion failed'))
          }
        }, 'image/jpeg', 0.92)
      }
      img.onerror = () => {
        reject(new Error('Could not load image for conversion'))
      }
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Validate and process image file
 * Converts HEIC to JPEG if needed, validates file type and size
 */
export const processImageFile = async (file, maxSizeMB = 10) => {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new Error(`Image size exceeds ${maxSizeMB}MB limit. Please compress or resize the image.`)
  }

  // Check if HEIC and convert
  const isHeic = file.type === 'image/heic' || 
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif')

  if (isHeic) {
    try {
      const convertedFile = await convertHeicToJpeg(file)
      console.log('HEIC converted to JPEG successfully')
      return convertedFile
    } catch (error) {
      // If conversion fails, allow the file through anyway
      // The browser might be able to display it (Safari) or it can be uploaded
      console.warn('HEIC conversion failed, allowing file through:', error)
      // Return original file - it might work in Safari or can still be uploaded
      return file
    }
  }

  // For non-HEIC files, just validate
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif'
  ]

  const supportedExtensions = /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i

  // If file has no type but has valid extension, accept it
  if (!file.type && file.name.match(supportedExtensions)) {
    return file
  }

  // Validate type
  if (file.type && !supportedTypes.includes(file.type.toLowerCase()) && 
      !file.name.match(supportedExtensions)) {
    throw new Error('Unsupported image format. Please use JPEG, PNG, WebP, GIF, or HEIC.')
  }

  return file
}

/**
 * Create a preview URL for an image file
 */
export const createImagePreview = (file) => {
  return URL.createObjectURL(file)
}

/**
 * Revoke preview URL to free memory
 */
export const revokeImagePreview = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

