import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import guidesService from '../../../services/guidesService';
import type { GuideDetailData, RelatedGuide, GuideDetailCategory } from '../../../services/guidesService';

const DEFAULT_IMAGE = '/images/default_guide.png';

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.src = DEFAULT_IMAGE;
};

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

const GuideDetailPage = () => {
  const { guideId = '' } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<GuideDetailData | null>(null);
  const [relatedGuides, setRelatedGuides] = useState<RelatedGuide[]>([]);
  const [categories, setCategories] = useState<GuideDetailCategory[]>([]);

  useDocumentTitle(guide?.title ? `${guide.title} - Guides` : 'Guide Detail');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [guideResult, relatedResult, categoriesResult] = await Promise.allSettled([
        guidesService.getGuideDetail(guideId),
        guidesService.getRelatedGuides(guideId),
        guidesService.getDetailCategories(),
      ]);

      if (guideResult.status === 'fulfilled') {
        setGuide(guideResult.value);
      } else {
        setError('Failed to load guide details. Please try again later.');
        return;
      }

      if (relatedResult.status === 'fulfilled') setRelatedGuides(relatedResult.value);
      if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value);
    } catch {
      setError('Failed to load guide details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [guideId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCategoryName = (categoryId: string): string =>
    categories.find((c) => c.id === categoryId)?.name || categoryId;

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        onRetry={fetchData}
        loadingMessage="Loading guide..."
      >
        <button className="button secondary" onClick={() => navigate('/guides')}>
          <i className="fas fa-arrow-left" /> Back to Guides
        </button>

        {guide && (
          <>
            <div className="guide-detail__hero">
              <img
                src={guide.image_url || DEFAULT_IMAGE}
                alt={guide.title}
                className="guide-detail__hero-image"
                onError={handleImageError}
              />
              <div className="guide-detail__hero-overlay">
                <span className="guide-detail__category-badge">
                  {getCategoryName(guide.category)}
                </span>
                <h1>{guide.title}</h1>
                <div className="guide-detail__meta">
                  <span>
                    <i className="fas fa-user" /> {guide.author}
                  </span>
                  <span>
                    <i className="fas fa-calendar-alt" /> {formatDate(guide.date_published)}
                  </span>
                  <span>
                    <i className="fas fa-clock" /> {guide.read_time}
                  </span>
                </div>
              </div>
            </div>

            <div className="guide-detail__body">
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: guide.content }}
              />
            </div>

            {relatedGuides.length > 0 && (
              <div className="guide-detail__related">
                <h2>Related Guides</h2>
                <div className="guide-detail__related-grid">
                  {relatedGuides.map((related) => (
                    <div className="guide-detail__related-card" key={related.id}>
                      <img
                        src={related.image_url || DEFAULT_IMAGE}
                        alt={related.title}
                        className="guide-detail__related-image"
                        onError={handleImageError}
                      />
                      <div className="guide-detail__related-content">
                        <span className="guide-detail__category-badge">
                          {getCategoryName(related.category)}
                        </span>
                        <h3>{related.title}</h3>
                        <p>{related.description}</p>
                        <div className="guide-detail__meta">
                          <span>
                            <i className="fas fa-user" /> {related.author}
                          </span>
                          <span>
                            <i className="fas fa-clock" /> {related.read_time}
                          </span>
                        </div>
                        <Link to={`/guides/detail/${related.id}`} className="button primary">
                          Read Guide
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </AutoStateContainer>
    </div>
  );
};

export default GuideDetailPage;
