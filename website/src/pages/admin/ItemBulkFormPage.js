import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import itemsApi from '../../services/itemsApi';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

const ItemBulkFormPage = () => {
  const navigate = useNavigate();

  // Form state
  const [items, setItems] = useState([
    {
      name: '',
      description: '',
      image_url: '',
      category: '',
      type: '',
      rarity: '',
      effect: '',
      base_price: 0
    }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [rarities, setRarities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, typesResponse, raritiesResponse] = await Promise.all([
        itemsApi.getCategories(),
        itemsApi.getTypes(),
        itemsApi.getRarities()
      ]);

      setCategories(categoriesResponse.data);
      setTypes(typesResponse.data);
      setRarities(raritiesResponse.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to fetch filter options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Handle form input changes
  const handleChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'base_price' ? (value === '' ? 0 : parseInt(value)) : value
    };
    setItems(updatedItems);
  };

  // Add a new item form
  const addItem = () => {
    setItems([
      ...items,
      {
        name: '',
        description: '',
        image_url: '',
        category: items[0].category, // Copy category from first item
        type: items[0].type, // Copy type from first item
        rarity: items[0].rarity, // Copy rarity from first item
        effect: '',
        base_price: 0
      }
    ]);
  };

  // Remove an item form
  const removeItem = (index) => {
    if (items.length === 1) {
      toast.error('You must have at least one item');
      return;
    }

    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    let errorMessage = '';

    items.forEach((item, index) => {
      if (!item.name.trim()) {
        isValid = false;
        errorMessage = `Item #${index + 1} is missing a name`;
      }

      if (!item.category.trim()) {
        isValid = false;
        errorMessage = `Item #${index + 1} is missing a category`;
      }

      if (item.base_price < 0) {
        isValid = false;
        errorMessage = `Item #${index + 1} has a negative price`;
      }
    });

    if (!isValid) {
      toast.error(errorMessage);
    }

    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await itemsApi.createBulkItems(items);
      toast.success(`${items.length} items created successfully`);
      navigate('/admin/items');
    } catch (error) {
      console.error('Error creating items in bulk:', error);
      toast.error(error.response?.data?.message || 'Failed to create items');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/items');
  };

  // Handle paste from CSV
  const handlePasteFromCsv = () => {
    const csvText = prompt('Paste CSV data here (format: name,description,category,type,rarity,effect,base_price,image_url)');
    
    if (!csvText) return;
    
    try {
      const rows = csvText.trim().split('\n');
      const newItems = rows.map(row => {
        const [name, description, category, type, rarity, effect, base_price, image_url] = row.split(',').map(val => val.trim());
        return {
          name: name || '',
          description: description || '',
          category: category || '',
          type: type || '',
          rarity: rarity || '',
          effect: effect || '',
          base_price: isNaN(parseInt(base_price)) ? 0 : parseInt(base_price),
          image_url: image_url || ''
        };
      });
      
      if (newItems.length > 0) {
        setItems(newItems);
        toast.success(`Imported ${newItems.length} items from CSV`);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV data. Please check the format.');
    }
  };

  if (loading) {
    return (
      <div>
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>Bulk Add Items</h1>
        <button className="button primary" onClick={handlePasteFromCsv}>
          <i className="fas fa-paste"></i> Paste from CSV
        </button>
      </div>

      <div className="bulk-monster-add-form">
        <form onSubmit={handleSubmit} className="reroller-content">
          {items.map((item, index) => (
            <div key={index} className="admin-bulk-item-form">
              <div className="admin-bulk-item-header">
                <h3>Item #{index + 1}</h3>
                <button
                  type="button"
                  className="button danger"
                  onClick={() => removeItem(index)}
                >
                  <i className="fas fa-trash"></i> Remove
                </button>
              </div>

              <div className="reroller-content">
                <div className="admin-form-column">
                  <FormInput
                    label="Name"
                    value={item.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    required
                  />

                  <FormTextarea
                    label="Description"
                    value={item.description || ''}
                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                    rows={2}
                  />

                  <FormSelect
                    label="Category"
                    value={item.category}
                    onChange={(e) => handleChange(index, 'category', e.target.value)}
                    options={[
                      { value: '', label: 'Select Category' },
                      ...categories.map(category => ({ value: category, label: category })),
                      { value: 'new', label: '+ Add New Category' }
                    ]}
                    required
                  />

                  {item.category === 'new' && (
                    <FormInput
                      label="New Category"
                      value={item.new_category || ''}
                      onChange={(e) => {
                        handleChange(index, 'new_category', e.target.value);
                        handleChange(index, 'category', e.target.value);
                      }}
                      required
                    />
                  )}
                </div>

                <div className="admin-form-column">
                  <FormSelect
                    label="Type"
                    value={item.type || ''}
                    onChange={(e) => handleChange(index, 'type', e.target.value)}
                    options={[
                      { value: '', label: 'None' },
                      ...types.map(type => ({ value: type, label: type })),
                      { value: 'new', label: '+ Add New Type' }
                    ]}
                  />

                  {item.type === 'new' && (
                    <FormInput
                      label="New Type"
                      value={item.new_type || ''}
                      onChange={(e) => {
                        handleChange(index, 'new_type', e.target.value);
                        handleChange(index, 'type', e.target.value);
                      }}
                    />
                  )}

                  <FormSelect
                    label="Rarity"
                    value={item.rarity || ''}
                    onChange={(e) => handleChange(index, 'rarity', e.target.value)}
                    options={[
                      { value: '', label: 'None' },
                      ...rarities.map(rarity => ({ value: rarity, label: rarity })),
                      { value: 'new', label: '+ Add New Rarity' }
                    ]}
                  />

                  {item.rarity === 'new' && (
                    <FormInput
                      label="New Rarity"
                      value={item.new_rarity || ''}
                      onChange={(e) => {
                        handleChange(index, 'new_rarity', e.target.value);
                        handleChange(index, 'rarity', e.target.value);
                      }}
                    />
                  )}

                  <FormInput
                    label="Effect"
                    value={item.effect || ''}
                    onChange={(e) => handleChange(index, 'effect', e.target.value)}
                  />

                  <FormInput
                    label="Price"
                    type="number"
                    value={item.base_price}
                    onChange={(e) => handleChange(index, 'base_price', e.target.value)}
                  />

                  <FormInput
                    label="Image URL"
                    value={item.image_url || ''}
                    onChange={(e) => handleChange(index, 'image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {index < items.length - 1 && <hr className="admin-form-divider" />}
            </div>
          ))}

          <div className="admin-form-actions" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="button primary"
              onClick={addItem}
            >
              <i className="fas fa-plus"></i> Add Another Item
            </button>
          </div>

          <div className="admin-form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>Save All Items</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemBulkFormPage;
