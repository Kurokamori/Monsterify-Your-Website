import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';


const ShopForm = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const isEditMode = shopId !== 'new';
  
  const [formData, setFormData] = useState({
    shop_id: '',
    name: '',
    description: '',
    flavor_text: '',
    banner_image: '',
    category: '',
    price_modifier: 1.0,
    is_constant: 1,
    is_active: 1,
    visibility_condition: ''
  });
  
  const [visibilityConditions, setVisibilityConditions] = useState({
    days_of_week: [],
    start_date: '',
    end_date: '',
    random_chance: 0,
    manually_enabled: true
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  
  // Fetch shop data if in edit mode
  useEffect(() => {
    const fetchShopData = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/admin/shop-manager/${shopId}`);
        const shopData = response.data.data;
        
        setFormData({
          shop_id: shopData.shop_id,
          name: shopData.name,
          description: shopData.description || '',
          flavor_text: shopData.flavor_text || '',
          banner_image: shopData.banner_image || '',
          category: shopData.category,
          price_modifier: shopData.price_modifier || 1.0,
          is_constant: shopData.is_constant,
          is_active: shopData.is_active,
          visibility_condition: shopData.visibility_condition || ''
        });
        
        // Parse visibility condition if exists
        if (shopData.visibility_condition) {
          try {
            const condition = JSON.parse(shopData.visibility_condition);
            setVisibilityConditions({
              days_of_week: condition.days_of_week || [],
              start_date: condition.start_date || '',
              end_date: condition.end_date || '',
              random_chance: condition.random_chance || 0,
              manually_enabled: condition.manually_enabled !== false
            });
          } catch (e) {
            console.error('Error parsing visibility condition:', e);
          }
        }
        
        // Set image preview
        if (shopData.banner_image) {
          setImagePreview(shopData.banner_image);
        }
        
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Failed to load shop data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchShopData();
  }, [shopId, isEditMode]);
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked ? 1 : 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle visibility condition change
  const handleVisibilityChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'days_of_week') {
      const day = parseInt(value);
      let updatedDays;
      
      if (checked) {
        updatedDays = [...visibilityConditions.days_of_week, day];
      } else {
        updatedDays = visibilityConditions.days_of_week.filter(d => d !== day);
      }
      
      setVisibilityConditions(prev => ({
        ...prev,
        days_of_week: updatedDays
      }));
    } else if (type === 'checkbox') {
      setVisibilityConditions(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'random_chance') {
      setVisibilityConditions(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setVisibilityConditions(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'dusk_and_dawn');
    
    try {
      setLoading(true);
      
      // Upload to Cloudinary
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dusk-and-dawn';
      console.log('ShopForm: Using Cloudinary cloud name:', cloudName);
      console.log('ShopForm: Environment variables:', {
        REACT_APP_CLOUDINARY_CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
        NODE_ENV: process.env.NODE_ENV
      });
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const data = await response.json();
      
      if (data.secure_url) {
        setFormData(prev => ({
          ...prev,
          banner_image: data.secure_url
        }));
        
        setImagePreview(data.secure_url);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // Prepare visibility condition
      let visibilityConditionJson = '';
      
      if (formData.is_constant === 0) {
        const condition = {
          ...visibilityConditions
        };
        
        // Clean up empty values
        if (condition.days_of_week.length === 0) delete condition.days_of_week;
        if (!condition.start_date || !condition.end_date) {
          delete condition.start_date;
          delete condition.end_date;
        }
        if (condition.random_chance <= 0) delete condition.random_chance;
        
        visibilityConditionJson = JSON.stringify(condition);
      }
      
      // Prepare data for submission
      const shopData = {
        ...formData,
        visibility_condition: visibilityConditionJson
      };
      
      // Submit form
      if (isEditMode) {
        await api.put(`/admin/shop-manager/${shopId}`, shopData);
      } else {
        await api.post('/admin/shop-manager', shopData);
      }
      
      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/admin/shop-manager');
      }, 2000);
      
    } catch (err) {
      console.error('Error saving shop:', err);
      setError(err.response?.data?.message || 'Failed to save shop. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && isEditMode) {
    return <LoadingSpinner message="Loading shop data..." />;
  }
  
  return (
    <div className="shop-form-container">
      <div className="shop-form-header">
        <h1>{isEditMode ? 'Edit Shop' : 'Add New Shop'}</h1>
      </div>
      
      {error && <ErrorMessage message={error} />}
      
      {success && (
        <div className="success-message">
          Shop {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
        </div>
      )}
      
      <form className="shop-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="shop_id">Shop ID</label>
            <input
              type="text"
              id="shop_id"
              name="shop_id"
              value={formData.shop_id}
              onChange={handleInputChange}
              required
              disabled={isEditMode}
              placeholder="e.g., apothecary"
            />
            <small>Unique identifier for the shop. Use lowercase letters, numbers, and underscores only.</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Shop Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g., Apothecary"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the shop"
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="flavor_text">Flavor Text</label>
            <textarea
              id="flavor_text"
              name="flavor_text"
              value={formData.flavor_text}
              onChange={handleInputChange}
              placeholder="Flavor text displayed at the top of the shop page"
              rows="3"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category</option>
              <option value="berries">Berries</option>
              <option value="pastries">Pastries</option>
              <option value="evolution">Evolution Items</option>
              <option value="helditems">Held Items</option>
              <option value="balls">Pokeballs</option>
              <option value="eggs">Eggs</option>
              <option value="antiques">Antiques</option>
              <option value="ALL">All Items</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="price_modifier">Price Modifier</label>
            <input
              type="number"
              id="price_modifier"
              name="price_modifier"
              value={formData.price_modifier}
              onChange={handleInputChange}
              step="0.1"
              min="0.1"
              max="10"
              required
            />
            <small>Multiplier for item prices. 1.0 = normal price, 0.5 = half price, 2.0 = double price.</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="banner_image">Banner Image</label>
            <div className="image-upload-container">
              <input
                type="file"
                id="banner_image"
                name="banner_image_file"
                onChange={handleImageUpload}
                accept="image/*"
              />
              <input
                type="text"
                name="banner_image"
                value={formData.banner_image}
                onChange={handleInputChange}
                placeholder="Or enter image URL directly"
              />
            </div>
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Banner preview" />
              </div>
            )}
          </div>
        </div>
        
        <div className="form-section">
          <h2>Shop Visibility</h2>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_constant"
                checked={formData.is_constant === 1}
                onChange={handleInputChange}
              />
              Constant Shop (Always Visible)
            </label>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active === 1}
                onChange={handleInputChange}
              />
              Active
            </label>
          </div>
          
          {formData.is_constant === 0 && (
            <div className="visibility-conditions">
              <h3>Visibility Conditions</h3>
              
              <div className="form-group">
                <label>Days of Week</label>
                <div className="days-of-week">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                    <label key={index} className="day-checkbox">
                      <input
                        type="checkbox"
                        name="days_of_week"
                        value={index}
                        checked={visibilityConditions.days_of_week.includes(index)}
                        onChange={handleVisibilityChange}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-group date-range">
                <label>Date Range</label>
                <div className="date-inputs">
                  <div>
                    <label htmlFor="start_date">Start Date</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={visibilityConditions.start_date}
                      onChange={handleVisibilityChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="end_date">End Date</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={visibilityConditions.end_date}
                      onChange={handleVisibilityChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="random_chance">Random Chance (0-1)</label>
                <input
                  type="number"
                  id="random_chance"
                  name="random_chance"
                  value={visibilityConditions.random_chance}
                  onChange={handleVisibilityChange}
                  step="0.1"
                  min="0"
                  max="1"
                />
                <small>Probability of shop appearing (0 = never, 1 = always)</small>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="manually_enabled"
                    checked={visibilityConditions.manually_enabled}
                    onChange={handleVisibilityChange}
                  />
                  Manually Enabled
                </label>
              </div>
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => navigate('/admin/shop-manager')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={loading || success}
          >
            {loading ? 'Saving...' : 'Save Shop'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShopForm;
