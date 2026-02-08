import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import contentService from '../../services/contentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/**
 * Content Editor Page
 * Form for adding and editing content
 */
const ContentEditorPage = () => {
  const { category, action, path } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isEditMode = action === 'edit';
  const contentPath = path || '';
  
  const [formData, setFormData] = useState({
    title: '',
    content: '# New Content\n\nEnter your content here...',
    fileName: ''
  });
  
  const [parentPath, setParentPath] = useState('');
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  
  const previewRef = useRef(null);
  const editorRef = useRef(null);

  // Extract parent path from query params
  useEffect(() => {
    if (!isEditMode) {
      const params = new URLSearchParams(location.search);
      const parent = params.get('parent') || '';
      setParentPath(parent);
    }
  }, [location.search, isEditMode]);

  // Fetch category data and content if in edit mode
  useEffect(() => {
    fetchCategoryData();
    
    if (isEditMode && contentPath) {
      fetchContent();
    } else {
      setLoading(false);
    }
  }, [category, isEditMode, contentPath]);

  // Update preview when content changes
  useEffect(() => {
    if (previewRef.current) {
      updatePreview();
    }
  }, [formData.content, activeTab]);

  // Fetch category data
  const fetchCategoryData = async () => {
    try {
      const data = await contentService.getCategories();
      
      if (!data[category]) {
        setError(`Category "${category}" not found`);
        return;
      }
      
      setCategoryData(data[category]);
    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Failed to load category data. Please try again.');
    }
  };

  // Fetch content for editing
  const fetchContent = async () => {
    try {
      setLoading(true);
      
      const data = await contentService.getContent(category, contentPath);
      
      if (!data.success) {
        setError('Failed to load content. Please try again.');
        setLoading(false);
        return;
      }
      
      // Extract title from content (first h1)
      const titleMatch = data.content.match(/^# (.+)$/m);
      const title = titleMatch ? titleMatch[1] : '';
      
      // Remove title from content if found
      let contentWithoutTitle = data.content;
      if (titleMatch) {
        contentWithoutTitle = data.content.replace(/^# .+\n+/, '');
      }
      
      // Extract filename from path
      const pathParts = contentPath.split('/');
      const fileName = pathParts[pathParts.length - 1].replace(/\.md$/, '');
      
      setFormData({
        title,
        content: contentWithoutTitle,
        fileName
      });
      
      // Set parent path
      if (pathParts.length > 1) {
        const parentPathParts = pathParts.slice(0, -1);
        setParentPath(parentPathParts.join('/'));
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(`Failed to load content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update preview
  const updatePreview = () => {
    if (activeTab !== 'preview' || !previewRef.current) return;
    
    // Simple markdown to HTML conversion for preview
    let html = formData.content
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
      .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    html = `<h1>${formData.title}</h1><p>${html}</p>`;
    
    previewRef.current.innerHTML = html;
  };

  // Insert markdown syntax
  const insertMarkdown = (prefix, suffix = '') => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    const newContent = 
      formData.content.substring(0, start) + 
      prefix + selectedText + suffix + 
      formData.content.substring(end);
    
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
    
    // Set cursor position after insertion
    setTimeout(() => {
      editor.focus();
      editor.setSelectionRange(
        start + prefix.length, 
        end + prefix.length
      );
    }, 0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.fileName.trim() && !isEditMode) {
      setError('Filename is required');
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare content with title
      const finalContent = `# ${formData.title}\n\n${formData.content}`;
      
      // Determine save path
      let savePath;
      if (isEditMode) {
        savePath = contentPath;
      } else {
        savePath = parentPath 
          ? `${parentPath}/${formData.fileName}` 
          : formData.fileName;
      }
      
      // Save content
      const result = await contentService.saveContent(
        category, 
        savePath, 
        { 
          content: finalContent,
          title: formData.title
        }
      );
      
      if (result.success) {
        // Navigate back to category page
        const redirectPath = parentPath 
          ? `/admin/content/${category}?path=${parentPath}` 
          : `/admin/content/${category}`;
        
        navigate(redirectPath, { 
          state: { 
            successMessage: `Content ${isEditMode ? 'updated' : 'created'} successfully` 
          } 
        });
      } else {
        setError('Failed to save content. Please try again.');
      }
    } catch (err) {
      console.error('Error saving content:', err);
      setError(`Failed to save content: ${err.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">
            {isEditMode ? 'Edit Content' : `Add New ${categoryData?.name || 'Content'}`}
          </h1>
          <p className="admin-dashboard-subtitle">
            {isEditMode 
              ? `Editing: ${contentPath}` 
              : `Creating new content in: ${parentPath || 'Root'}`}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="admin-alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-actions">
          <Link
            to={parentPath
              ? `/admin/content/${category}?path=${parentPath}`
              : `/admin/content/${category}`
            }
            className="button secondary"
          >
            <i className="fas fa-arrow-left"></i> Back to Content
          </Link>
        </div>

        {/* Content Form */}
        {loading ? (
          <LoadingSpinner message={isEditMode ? "Loading content..." : "Preparing editor..."} />
        ) : (
          <div className="bulk-monster-add-form">
            <form onSubmit={handleSubmit} className="reroller-content">
              <div className="admin-form-group">
                <label htmlFor="title" className="admin-form-label">
                  Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="admin-form-input"
                  placeholder="Enter content title"
                  disabled={saving}
                  required
                />
              </div>

              {!isEditMode && (
                <div className="admin-form-group">
                  <label htmlFor="fileName" className="admin-form-label">
                    Filename <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="fileName"
                    name="fileName"
                    value={formData.fileName}
                    onChange={handleChange}
                    className="admin-form-input"
                    placeholder="Enter filename (without .md extension)"
                    disabled={saving}
                    required
                  />
                  <div className="admin-form-hint">
                    Use only letters, numbers, hyphens, and underscores. The .md extension will be added automatically.
                  </div>
                </div>
              )}

              {/* Editor Tabs */}
              <div className="admin-tabs">
                <button 
                  type="button"
                  className={`admin-tab${activeTab === 'editor' ? 'active' : ''}`}
                  onClick={() => setActiveTab('editor')}
                >
                  <i className="fas fa-edit"></i> Editor
                </button>
                <button 
                  type="button"
                  className={`admin-tab${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  <i className="fas fa-eye"></i> Preview
                </button>
              </div>

              {/* Editor Tab */}
              <div className={`admin-tab-content${activeTab === 'editor' ? 'active' : ''}`}>
                <div className="admin-form-group">
                  <label htmlFor="content" className="admin-form-label">
                    Content (Markdown)
                  </label>
                  <div className="admin-editor-toolbar">
                    <button type="button" className="button primary" onClick={() => insertMarkdown('# ')}>H1</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('## ')}>H2</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('### ')}>H3</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('**', '**')}>Bold</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('*', '*')}>Italic</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('[', '](url)')}>Link</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('- ')}>List</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('1. ')}>Numbered</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('> ')}>Quote</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('```\n', '\n```')}>Code</button>
                    <button type="button" className="button primary" onClick={() => insertMarkdown('---\n')}>Divider</button>
                  </div>
                  <textarea
                    id="content"
                    name="content"
                    ref={editorRef}
                    value={formData.content}
                    onChange={handleChange}
                    className="admin-form-input"
                    rows="20"
                    disabled={saving}
                  ></textarea>
                </div>
              </div>

              {/* Preview Tab */}
              <div className={`admin-tab-content${activeTab === 'preview' ? 'active' : ''}`}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Content Preview</label>
                  <div className="admin-preview" ref={previewRef}></div>
                </div>
              </div>

              <div className="admin-form-actions">
                <Link
                  to={parentPath
                    ? `/admin/content/${category}?path=${parentPath}`
                    : `/admin/content/${category}`
                  }
                  className="button secondary"
                  disabled={saving}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="button primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> {isEditMode ? 'Update Content' : 'Create Content'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentEditorPage;
