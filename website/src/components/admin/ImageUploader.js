import React, { useState } from 'react';

const ImageUploader = ({ images = [], onChange, maxImages = 4, required = false }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Basic URL validation
    try {
      new URL(newImageUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    if (images.includes(newImageUrl.trim())) {
      setError('This image URL has already been added');
      return;
    }

    const updatedImages = [...images, newImageUrl.trim()];
    onChange(updatedImages);
    setNewImageUrl('');
    setError('');
  };

  const handleRemoveImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onChange(updatedImages);
  };

  const handleMoveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onChange(updatedImages);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      handleMoveImage(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddImage();
    }
  };

  return (
    <div className="image-uploader">
      <div className="add-image-section">
        <div className="add-image-group">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            className="form-input"
            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
          />
          <button
            type="button"
            className="button primary"
            onClick={handleAddImage}
            disabled={images.length >= maxImages}
          >
            <i className="fas fa-plus"></i>
            Add Image
          </button>
        </div>
        
        <div className="upload-info">
          <p>
            <i className="fas fa-info-circle"></i>
            Add {required ? 'required' : 'up to'} {maxImages} image{maxImages > 1 ? 's' : ''} by URL. 
            {images.length > 1 && ' Drag to reorder.'}
          </p>
          {images.length > 0 && (
            <p>
              <strong>Primary image:</strong> The first image will be used as the main display image.
            </p>
          )}
        </div>

        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="images-preview">
          <h5>
            Images ({images.length}/{maxImages})
            {images.length > 1 && <small> - Drag to reorder</small>}
          </h5>
          
          <div className="images-grid">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className={`image-item${index === 0 ? 'primary' : ''}${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="image-container">
                  <img 
                    src={imageUrl} 
                    alt={`Preview ${index + 1}`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="image-error" style={{ display: 'none' }}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Failed to load</span>
                  </div>
                  
                  {index === 0 && (
                    <div className="primary-badge">
                      <i className="fas fa-star"></i>
                      Primary
                    </div>
                  )}
                  
                  <div className="image-actions">
                    {index > 0 && (
                      <button
                        type="button"
                        className="button secondary icon sm"
                        onClick={() => handleMoveImage(index, index - 1)}
                        title="Move up"
                      >
                        <i className="fas fa-arrow-up"></i>
                      </button>
                    )}

                    {index < images.length - 1 && (
                      <button
                        type="button"
                        className="button secondary icon sm"
                        onClick={() => handleMoveImage(index, index + 1)}
                        title="Move down"
                      >
                        <i className="fas fa-arrow-down"></i>
                      </button>
                    )}

                    <button
                      type="button"
                      className="button danger icon sm"
                      onClick={() => handleRemoveImage(index)}
                      title="Remove image"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                
                <div className="image-url">
                  <small>{imageUrl}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {required && images.length === 0 && (
        <div className="required-notice">
          <i className="fas fa-exclamation-circle"></i>
          At least one image is required
        </div>
      )}
    </div>
  );
};

export default ImageUploader;