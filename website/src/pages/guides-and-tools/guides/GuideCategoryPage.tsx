import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import { GuideCategoryTabs } from '../../../components/guides/GuideCategoryTabs';
import { GuideSidebar } from '../../../components/guides/GuideSidebar';
import { MarkdownRenderer } from '../../../components/guides/MarkdownRenderer';
import guidesService from '../../../services/guidesService';
import type { CategoriesMap } from './types';
import { capitalize } from './types';

const GuideCategoryPage = () => {
  const { category = '' } = useParams();
  const location = useLocation();
  useDocumentTitle(`${capitalize(category)} - Guides`);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoriesMap>({});
  const [content, setContent] = useState('');

  // Extract sub-path from URL (empty for category overview, populated for specific guide)
  const subPath = location.pathname.replace(`/guides/${category}/`, '').replace(`/guides/${category}`, '');

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesResponse, contentResponse] = await Promise.all([
        guidesService.getCategories(),
        guidesService.getGuideContent(category, subPath),
      ]);

      // Guides controller wraps response in { success, data }
      const catData = (categoriesResponse as unknown as { data?: CategoriesMap }).data ?? categoriesResponse as unknown as CategoriesMap;
      setCategories(catData);
      setContent(contentResponse.html || contentResponse.content || contentResponse.markdown || '');
    } catch {
      setError('Failed to load guide content. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [category, subPath]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        onRetry={fetchContent}
        loadingMessage={`Loading ${category} guides...`}
      >
        <GuideCategoryTabs categories={categories} activeCategory={category} />

        <div className="guide-content-layout">
          <div className="guide-content-layout__sidebar">
            {categories[category] && (
              <GuideSidebar
                structure={categories[category].structure || null}
                category={category}
              />
            )}
          </div>

          <div className="guide-content-layout__main">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </AutoStateContainer>
    </div>
  );
};

export default GuideCategoryPage;
