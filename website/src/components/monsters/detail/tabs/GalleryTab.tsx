import { useState, useMemo } from 'react';
import { useAuth } from '@contexts/useAuth';
import type { Monster } from '@services/monsterService';
import type { GalleryImage } from '../useMonsterDetail';

interface GalleryTabProps {
  monster: Monster;
  galleryImages: GalleryImage[];
  handleImageClick: (src: string, alt: string) => void;
}

export const GalleryTab = ({ monster, galleryImages, handleImageClick }: GalleryTabProps) => {
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
  const filteredImages = useMemo(() => {
    if (!showMature) {
      return galleryImages.filter(img => img.is_mature !== true);
    }
    // When showing mature, filter by the user's enabled content types
    if (contentSettings) {
      return galleryImages.filter(img => {
        if (img.is_mature !== true) return true;
        // Check if the image's content_rating matches any of the user's enabled types
        const rating = img.content_rating as Record<string, boolean> | null | undefined;
        if (!rating) return true;
        return Object.entries(rating).some(([key, val]) =>
          val && contentSettings[key as keyof typeof contentSettings]
        );
      });
    }
    return galleryImages;
  }, [galleryImages, showMature, contentSettings]);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_mon.png';
  };

  const mainImage = (monster.img_link as string) || (monster.main_ref as string);

  return (
    <div className="town-square">
      <div className="trainer-detail__stats-section">
        <h2>Image Gallery</h2>

        {/* Mature content toggle - only show if user has mature_enabled AND there are mature images */}
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

        <div className="monster-gallery-grid">
          {/* Main Image */}
          {mainImage && (
            <div className="monster-gallery-item">
              <img
                src={mainImage}
                alt={`${monster.name} - Main Image`}
                className="monster-gallery-image"
                onClick={() => handleImageClick(mainImage, `${monster.name} - Main Image`)}
                onError={handleImgError}
              />
              <div className="monster-gallery-caption">Main Reference</div>
            </div>
          )}

          {/* Additional Images */}
          {filteredImages.length > 0
            ? filteredImages.map((image, index) => {
                const src =
                  image.url ||
                  image.image_url ||
                  image.img_link ||
                  (typeof image === 'string' ? image : '') ||
                  '/images/default_mon.png';

                return (
                  <div className="monster-gallery-item" key={index}>
                    <img
                      src={src}
                      alt={`${monster.name} - Image ${index + 1}`}
                      className="monster-gallery-image"
                      onClick={() =>
                        handleImageClick(src, `${monster.name} - Image ${index + 1}`)
                      }
                      onError={handleImgError}
                    />
                    <div className="monster-gallery-caption">
                      {image.caption || image.description || `Image ${index + 1}`}
                    </div>
                  </div>
                );
              })
            : !mainImage && (
                <div className="state-container__empty">
                  <i className="fas fa-images state-container__empty-icon"></i>
                  <p className="state-container__empty-message">No images available.</p>
                </div>
              )}
        </div>
      </div>
    </div>
  );
};
