import { useState, useMemo } from 'react';
import { useAuth } from '@contexts/useAuth';
import type { Trainer, AdditionalReference } from '@components/trainers/types/Trainer';
import type { TrainerGalleryImage } from '../useTrainerDetail';

interface AdditionalRefsTabProps {
  trainer: Trainer;
  galleryImages: TrainerGalleryImage[];
  handleImageClick: (src: string, alt: string) => void;
}

export const AdditionalRefsTab = ({ trainer, galleryImages, handleImageClick }: AdditionalRefsTabProps) => {
  const { currentUser } = useAuth();
  const [showMature, setShowMature] = useState(false);

  const contentSettings = currentUser?.content_settings;
  const matureEnabled = contentSettings?.mature_enabled ?? false;

  // Check if any gallery images are mature
  const hasMatureImages = useMemo(() =>
    galleryImages.some(img => img.is_mature === true),
    [galleryImages]
  );

  // Filter gallery images based on mature content settings
  const filteredGallery = useMemo(() => {
    if (!showMature) {
      return galleryImages.filter(img => img.is_mature !== true);
    }
    if (contentSettings) {
      return galleryImages.filter(img => {
        if (img.is_mature !== true) return true;
        const rating = img.content_rating;
        if (!rating) return true;
        return Object.entries(rating).some(([key, val]) =>
          val && contentSettings[key as keyof typeof contentSettings]
        );
      });
    }
    return galleryImages;
  }, [galleryImages, showMature, contentSettings]);

  let refs: AdditionalReference[] = [];
  try {
    refs = typeof trainer.additional_refs === 'string'
      ? JSON.parse(trainer.additional_refs)
      : trainer.additional_refs || [];
    if (!Array.isArray(refs)) refs = [];
  } catch {
    refs = [];
  }

  const hasNoContent = refs.length === 0 && filteredGallery.length === 0;

  return (
    <div className="trainer-detail__stats-section">
      <h2>Gallery & References</h2>

      {/* Mature content toggle */}
      {matureEnabled && hasMatureImages && (
        <button
          className={`button filter sm ${showMature ? 'active' : ''}`}
          onClick={() => setShowMature(prev => !prev)}
          style={{ marginBottom: '1rem' }}
        >
          <i className={`fas fa-${showMature ? 'eye-slash' : 'eye'}`}></i>
          {showMature ? ' Hide Mature Content' : ' Show Works Containing Mature Content'}
        </button>
      )}

      {/* Submission Gallery */}
      {filteredGallery.length > 0 && (
        <div className="additional-refs-container" style={{ marginBottom: '2rem' }}>
          <h3>Submissions</h3>
          <div className="monster-gallery-grid">
            {filteredGallery.map((image) => (
              <div className="monster-gallery-item" key={image.id}>
                <img
                  src={image.image_url}
                  alt={image.title || `Submission ${image.id}`}
                  className="monster-gallery-image"
                  onClick={() => handleImageClick(image.image_url, image.title || `Submission ${image.id}`)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/default_trainer.png';
                  }}
                />
                <div className="monster-gallery-caption">
                  {image.title || `Submission ${image.id}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional References */}
      {refs.length > 0 && (
        <div className="additional-refs-container">
          <h3>Additional References</h3>
          <div className="refs-grid">
            {refs.map((ref, index) => (
              <div className="adopt-card" key={ref.id || index}>
                {ref.url && (
                  <div className="additional-ref-image">
                    <img
                      src={ref.url}
                      alt={ref.title || `Reference ${index + 1}`}
                      onClick={() => handleImageClick(ref.url, ref.title || `Reference ${index + 1}`)}
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/default_trainer.png';
                      }}
                    />
                  </div>
                )}
                <div className="additional-ref-info">
                  {ref.title && <h3>{ref.title}</h3>}
                  {ref.description && <p>{ref.description}</p>}
                  {ref.artist && <p className="text-muted text-sm">Art by: {ref.artist}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasNoContent && (
        <div className="no-additional-refs">
          <i className="fas fa-images"></i>
          <p>No gallery images or additional references available.</p>
        </div>
      )}
    </div>
  );
};
