import { useState, useRef, useEffect, ChangeEvent } from 'react';

interface FileUploadProps {
  onUploadSuccess?: (url: string | null) => void;
  onUploadError?: (error: string) => void;
  uploadPreset?: string;
  folder?: string;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  buttonText?: string;
  initialImageUrl?: string | null;
  disabled?: boolean;
  cloudName?: string;
}

export function FileUpload({
  onUploadSuccess,
  onUploadError,
  uploadPreset = 'dusk_and_dawn',
  folder = 'uploads',
  acceptedFileTypes = 'image/*',
  maxFileSize = 10 * 1024 * 1024,
  buttonText = 'Upload Image',
  initialImageUrl = null,
  disabled = false,
  cloudName = 'dusk-and-dawn',
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(initialImageUrl);
  }, [initialImageUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxFileSize) {
      setError(`File size exceeds the maximum limit of ${Math.round(maxFileSize / (1024 * 1024))}MB`);
      return;
    }

    const typePattern = acceptedFileTypes.replace('*', '');
    if (!file.type.match(typePattern)) {
      setError(`Invalid file type. Please upload ${acceptedFileTypes}`);
      return;
    }

    setError(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    uploadFile(file);

    e.target.value = '';
  };

  const uploadFile = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        setIsUploading(false);
        onUploadSuccess?.(response.secure_url);
      } else {
        setError('Upload failed. Please try again.');
        setIsUploading(false);
        onUploadError?.('Upload failed');
      }
    };

    xhr.onerror = () => {
      setError('Upload failed. Please check your internet connection and try again.');
      setIsUploading(false);
      onUploadError?.('Network error');
    };

    xhr.send(formData);
  };

  const handleButtonClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onUploadSuccess?.(null);
  };

  return (
    <div className={`file-upload${disabled ? ' disabled' : ''}`}>
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
          <div className="image-container medium rounded">
            <img
              src={previewUrl}
              alt="Preview"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/default_image.png';
              }}
            />
          </div>
          {!disabled && !isUploading && (
            <div className="container center gap-small">
              <button
                type="button"
                className="button primary small"
                onClick={handleButtonClick}
              >
                <i className="fa-solid fa-exchange-alt" /> Change
              </button>
              <button
                type="button"
                className="button danger small"
                onClick={handleRemoveImage}
              >
                <i className="fa-solid fa-trash-alt" /> Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="button primary"
          onClick={handleButtonClick}
          disabled={disabled || isUploading}
        >
          <i className="fa-solid fa-cloud-upload-alt" />
          <span>{buttonText}</span>
        </button>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="progress">
            <div
              className="progress-fill primary"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="progress-label">{uploadProgress}%</span>
        </div>
      )}

      {error && (
        <div className="alert error small">
          <i className="fa-solid fa-exclamation-circle" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
