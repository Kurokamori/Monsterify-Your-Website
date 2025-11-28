import React, { useState, useRef } from 'react';

/**
 * A component for uploading files to Cloudinary
 *
 * @param {Object} props - Component props
 * @param {Function} props.onUploadSuccess - Function to call when upload is successful
 * @param {Function} props.onUploadError - Function to call when upload fails
 * @param {string} props.uploadPreset - Cloudinary upload preset
 * @param {string} props.folder - Cloudinary folder to upload to
 * @param {string} props.acceptedFileTypes - Accepted file types (e.g., 'image/*')
 * @param {number} props.maxFileSize - Maximum file size in bytes
 * @param {string} props.buttonText - Text to display on the upload button
 * @param {string} props.initialImageUrl - Initial image URL to display
 * @param {boolean} props.disabled - Whether the uploader is disabled
 */
const FileUpload = ({
  onUploadSuccess,
  onUploadError,
  uploadPreset = 'dusk_and_dawn',
  folder = 'uploads',
  acceptedFileTypes = 'image/*',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  buttonText = 'Upload Image',
  initialImageUrl = null,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Update preview URL when initialImageUrl changes
  React.useEffect(() => {
    setPreviewUrl(initialImageUrl);
  }, [initialImageUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > maxFileSize) {
      setError(`File size exceeds the maximum limit of ${Math.round(maxFileSize / (1024 * 1024))}MB`);
      return;
    }

    // Check file type
    if (!file.type.match(acceptedFileTypes.replace('*', ''))) {
      setError(`Invalid file type. Please upload ${acceptedFileTypes}`);
      return;
    }

    // Clear previous errors
    setError(null);

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload the file
    uploadFile(file);

    // Reset the file input
    e.target.value = null;
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);

      // Create an XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      // Use the cloud name from environment variables or fallback to 'dusk-and-dawn'
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dusk-and-dawn';
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`, true);

      // Track upload progress
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      };

      // Handle response
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setIsUploading(false);
          if (onUploadSuccess) {
            onUploadSuccess(response.secure_url);
          }
        } else {
          setError('Upload failed. Please try again.');
          setIsUploading(false);
          if (onUploadError) {
            onUploadError('Upload failed');
          }
        }
      };

      // Handle errors
      xhr.onerror = () => {
        setError('Upload failed. Please check your internet connection and try again.');
        setIsUploading(false);
        if (onUploadError) {
          onUploadError('Network error');
        }
      };

      // Send the request
      xhr.send(formData);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsUploading(false);
      if (onUploadError) {
        onUploadError(err.message);
      }
    }
  };

  const handleButtonClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (onUploadSuccess) {
      onUploadSuccess(null);
    }
  };

  return (
    <div className={`file-upload ${disabled ? 'disabled' : ''}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFileTypes}
        className="file-input"
        disabled={disabled || isUploading}
      />

      {previewUrl ? (
        <div className="preview-container">
          <img
            src={previewUrl}
            alt="Preview"
            className="preview-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/default_image.png';
            }}
          />
          {!disabled && !isUploading && (
            <div className="preview-actions">
              <button
                type="button"
                className="change-image-button"
                onClick={handleButtonClick}
              >
                <i className="fas fa-exchange-alt"></i> Change
              </button>
              <button
                type="button"
                className="remove-image-button"
                onClick={handleRemoveImage}
              >
                <i className="fas fa-trash-alt"></i> Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="upload-button"
          onClick={handleButtonClick}
          disabled={disabled || isUploading}
        >
          <i className="fas fa-cloud-upload-alt"></i>
          <span>{buttonText}</span>
        </button>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">{uploadProgress}% Uploaded</div>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
