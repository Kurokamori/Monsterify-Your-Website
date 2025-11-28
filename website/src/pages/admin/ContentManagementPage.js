import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import contentService from '../../services/contentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/**
 * Content Management Page
 * Displays content categories and allows navigation to content items
 */
const ContentManagementPage = () => {
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch all content categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await contentService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load content categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Count files and directories in a structure
  const countItems = (structure) => {
    if (!structure) return { files: 0, directories: 0 };

    let fileCount = structure.files ? structure.files.length : 0;
    let dirCount = structure.directories ? structure.directories.length : 0;

    // Count items in subdirectories
    if (structure.directories) {
      structure.directories.forEach(dir => {
        if (dir.children) {
          const subCounts = countItems(dir.children);
          fileCount += subCounts.files;
          dirCount += subCounts.directories;
        }
      });
    }

    return { files: fileCount, directories: dirCount };
  };

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">Content Management</h1>
          <p className="admin-dashboard-subtitle">
            Manage guides, lore, and other content
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="admin-alert success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="admin-alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-actions">
          <Link to="/admin" className="admin-button secondary">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
        </div>

        {/* Content Categories */}
        {loading ? (
          <LoadingSpinner message="Loading content categories..." />
        ) : (
          <div className="admin-grid">
            {Object.keys(categories).map(key => {
              const category = categories[key];
              const counts = countItems(category.structure);

              return (
                <div className="admin-card" key={key}>
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">{category.name}</h2>
                  </div>
                  <div className="admin-card-body">
                    <div className="admin-card-stats">
                      <div className="admin-stat">
                        <span className="admin-stat-value">{counts.files}</span>
                        <span className="admin-stat-label">Files</span>
                      </div>
                      <div className="admin-stat">
                        <span className="admin-stat-value">{counts.directories}</span>
                        <span className="admin-stat-label">Directories</span>
                      </div>
                    </div>
                    <p className="admin-card-description">
                      Manage {category.name.toLowerCase()} content including pages, articles, and documentation.
                    </p>
                    <div className="admin-card-actions">
                      <Link
                        to={`/admin/content/${key}`}
                        className="admin-button"
                      >
                        <i className="fas fa-folder-open"></i> Browse Content
                      </Link>
                      <Link
                        to={`/admin/content/${key}/add`}
                        className="admin-button secondary"
                      >
                        <i className="fas fa-plus"></i> Add New
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagementPage;
