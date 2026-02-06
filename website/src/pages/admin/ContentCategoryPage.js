import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import contentService from '../../services/contentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/**
 * Content Category Page
 * Displays content structure for a specific category
 */
const ContentCategoryPage = () => {
  const { category } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [categoryData, setCategoryData] = useState(null);
  const [structure, setStructure] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // New directory modal state
  const [showNewDirModal, setShowNewDirModal] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [creatingDir, setCreatingDir] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Extract path from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const path = params.get('path') || '';
    setCurrentPath(path);
  }, [location.search]);

  // Fetch category data on component mount or when category/path changes
  useEffect(() => {
    fetchCategoryData();
  }, [category, currentPath]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch category data
  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await contentService.getCategories();
      
      if (!data[category]) {
        setError(`Category "${category}" not found`);
        setLoading(false);
        return;
      }
      
      setCategoryData(data[category]);
      
      // Navigate to the current path in the structure
      let currentStructure = data[category].structure;
      
      if (currentPath) {
        const pathParts = currentPath.split('/').filter(Boolean);
        
        for (const part of pathParts) {
          if (currentStructure.directories) {
            const dir = currentStructure.directories.find(d => d.path === part);
            if (dir && dir.children) {
              currentStructure = dir.children;
            } else {
              break;
            }
          }
        }
      }
      
      setStructure(currentStructure);
    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Failed to load category data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new directory
  const handleCreateDirectory = async () => {
    if (!newDirName.trim()) return;
    
    try {
      setCreatingDir(true);
      
      await contentService.createDirectory(category, currentPath, newDirName.trim());
      
      setSuccessMessage(`Directory "${newDirName}" created successfully`);
      setNewDirName('');
      setShowNewDirModal(false);
      
      // Refresh the data
      fetchCategoryData();
    } catch (err) {
      console.error('Error creating directory:', err);
      setError(`Failed to create directory: ${err.response?.data?.message || err.message}`);
    } finally {
      setCreatingDir(false);
    }
  };

  // Handle deleting content
  const handleDeleteContent = async () => {
    if (!deleteItem) return;
    
    try {
      setDeleting(true);
      
      const path = currentPath 
        ? `${currentPath}/${deleteItem.path}` 
        : deleteItem.path;
      
      await contentService.deleteContent(category, path);
      
      setSuccessMessage(`${deleteItem.isDirectory ? 'Directory' : 'File'} "${deleteItem.name}" deleted successfully`);
      setDeleteItem(null);
      setShowDeleteModal(false);
      
      // Refresh the data
      fetchCategoryData();
    } catch (err) {
      console.error('Error deleting content:', err);
      setError(`Failed to delete content: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (item, isDirectory) => {
    setDeleteItem({ ...item, isDirectory });
    setShowDeleteModal(true);
  };

  // Navigate to a directory
  const navigateToDirectory = (dir) => {
    const newPath = currentPath ? `${currentPath}/${dir.path}` : dir.path;
    navigate(`/admin/content/${category}?path=${newPath}`);
  };

  // Navigate to parent directory
  const navigateToParent = () => {
    if (!currentPath) return;
    
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    
    const parentPath = pathParts.join('/');
    navigate(`/admin/content/${category}${parentPath ? `?path=${parentPath}` : ''}`);
  };

  // Get breadcrumb items
  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    
    const pathParts = currentPath.split('/').filter(Boolean);
    let currentBreadcrumbPath = '';
    
    return pathParts.map((part, index) => {
      currentBreadcrumbPath = currentBreadcrumbPath 
        ? `${currentBreadcrumbPath}/${part}` 
        : part;
      
      return {
        name: part,
        path: currentBreadcrumbPath,
        isLast: index === pathParts.length - 1
      };
    });
  };

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">
            {categoryData?.name || 'Content'} Management
          </h1>
          <p className="admin-dashboard-subtitle">
            Manage content files and directories
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
          <Link to="/admin/content" className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to Categories
          </Link>
          <div>
            <button
              className="button secondary mr-2"
              onClick={() => setShowNewDirModal(true)}
            >
              <i className="fas fa-folder-plus"></i> New Directory
            </button>
            <Link
              to={`/admin/content/${category}/add${currentPath ? `?parent=${currentPath}` : ''}`}
              className="button primary"
            >
              <i className="fas fa-file-plus"></i> New File
            </Link>
          </div>
        </div>

        {/* Breadcrumbs */}
        {currentPath && (
          <div className="admin-breadcrumbs">
            <button 
              className="admin-breadcrumb-item"
              onClick={() => navigate(`/admin/content/${category}`)}
            >
              <i className="fas fa-home"></i> Root
            </button>
            {getBreadcrumbs().map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                <span className="admin-breadcrumb-separator">/</span>
                {crumb.isLast ? (
                  <span className="admin-breadcrumb-item active">{crumb.name}</span>
                ) : (
                  <button 
                    className="admin-breadcrumb-item"
                    onClick={() => navigate(`/admin/content/${category}?path=${crumb.path}`)}
                  >
                    {crumb.name}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content Structure */}
        {loading ? (
          <LoadingSpinner message="Loading content structure..." />
        ) : (
          <div className="admin-content-structure">
            {currentPath && (
              <div className="admin-content-item" onClick={navigateToParent}>
                <div className="admin-content-icon">
                  <i className="fas fa-level-up-alt"></i>
                </div>
                <div className="admin-content-name">
                  ../ (Parent Directory)
                </div>
                <div className="admin-content-actions">
                  {/* No actions for parent directory */}
                </div>
              </div>
            )}

            {/* Directories */}
            {structure?.directories?.map(dir => (
              <div className="admin-content-item" key={dir.path}>
                <div className="admin-content-icon" onClick={() => navigateToDirectory(dir)}>
                  <i className="fas fa-folder"></i>
                </div>
                <div className="admin-content-name" onClick={() => navigateToDirectory(dir)}>
                  {dir.name}/
                </div>
                <div className="admin-content-actions">
                  <button 
                    className="button danger sm"
                    onClick={() => openDeleteModal(dir, true)}
                    title="Delete Directory"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}

            {/* Files */}
            {structure?.files?.map(file => (
              <div className="admin-content-item" key={file.path}>
                <div className="admin-content-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="admin-content-name">
                  {file.name}
                </div>
                <div className="admin-content-actions">
                  <Link 
                    to={`/admin/content/${category}/edit/${currentPath ? `${currentPath}/` : ''}${file.path}`}
                    className="button info sm"
                    title="Edit File"
                  >
                    <i className="fas fa-edit"></i>
                  </Link>
                  <button 
                    className="button danger sm"
                    onClick={() => openDeleteModal(file, false)}
                    title="Delete File"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}

            {(!structure?.directories?.length && !structure?.files?.length) && (
              <div className="admin-content-empty">
                <i className="fas fa-folder-open"></i>
                <p>This directory is empty</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Directory Modal */}
      {showNewDirModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Create New Directory</h2>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label htmlFor="dirName" className="admin-form-label">
                  Directory Name
                </label>
                <input
                  type="text"
                  id="dirName"
                  className="admin-form-input"
                  value={newDirName}
                  onChange={(e) => setNewDirName(e.target.value)}
                  placeholder="Enter directory name"
                  disabled={creatingDir}
                />
                <div className="admin-form-hint">
                  Use only letters, numbers, hyphens, and underscores.
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={() => setShowNewDirModal(false)}
                className="button secondary"
                disabled={creatingDir}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDirectory}
                className="button primary"
                disabled={!newDirName.trim() || creatingDir}
              >
                {creatingDir ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creating...
                  </>
                ) : (
                  'Create Directory'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Confirm Deletion</h2>
            </div>
            <div className="admin-modal-body">
              <p>
                Are you sure you want to delete the {deleteItem.isDirectory ? 'directory' : 'file'}{' '}
                <strong>{deleteItem.name}</strong>?
              </p>
              {deleteItem.isDirectory && (
                <p className="admin-modal-warning">
                  This will delete all files and subdirectories within this directory.
                </p>
              )}
              <p className="admin-modal-warning">
                This action cannot be undone.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="button secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteContent}
                className="button danger"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCategoryPage;
