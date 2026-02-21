import type { Monster } from '@services/monsterService';
import type { GalleryImage } from '../useMonsterDetail';

interface GalleryTabProps {
  monster: Monster;
  galleryImages: GalleryImage[];
  handleImageClick: (src: string, alt: string) => void;
}

export const GalleryTab = ({ monster, galleryImages, handleImageClick }: GalleryTabProps) => {
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
          {galleryImages.length > 0
            ? galleryImages.map((image, index) => {
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
