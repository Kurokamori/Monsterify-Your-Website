import React, { useState, useEffect } from 'react';
import BackendFileUpload from '../common/BackendFileUpload';

const EvolutionEditor = ({ monsterId, evolutionData, onSave, onCancel, isOwner }) => {
  const [evolutionEntries, setEvolutionEntries] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    image: '',
    species1: '',
    species2: '',
    species3: '',
    type1: '',
    type2: '',
    type3: '',
    type4: '',
    type5: '',
    attribute: '',
    evolution_method: '',
    level: '',
    key: '',
    data: ''
  });
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (evolutionData && Array.isArray(evolutionData)) {
      setEvolutionEntries(evolutionData);
    } else {
      setEvolutionEntries([]);
    }
  }, [evolutionData]);

  const resetForm = () => {
    setFormData({
      image: '',
      species1: '',
      species2: '',
      species3: '',
      type1: '',
      type2: '',
      type3: '',
      type4: '',
      type5: '',
      attribute: '',
      evolution_method: '',
      level: '',
      key: '',
      data: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEntry = () => {
    const newEntry = {
      id: Date.now(), // Simple ID generation
      ...formData,
      order: evolutionEntries.length
    };
    
    setEvolutionEntries(prev => [...prev, newEntry]);
    resetForm();
  };

  const handleEditEntry = (index) => {
    setEditingIndex(index);
    setFormData({...evolutionEntries[index]});
  };

  const handleUpdateEntry = () => {
    const updatedEntries = [...evolutionEntries];
    updatedEntries[editingIndex] = {
      ...formData,
      id: evolutionEntries[editingIndex].id,
      order: evolutionEntries[editingIndex].order
    };
    
    setEvolutionEntries(updatedEntries);
    setEditingIndex(null);
    resetForm();
  };

  const handleDeleteEntry = (index) => {
    if (window.confirm('Are you sure you want to delete this evolution entry?')) {
      setEvolutionEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const reorderedEntries = [...evolutionEntries];
    const draggedEntry = reorderedEntries[draggedIndex];
    
    // Remove the dragged entry
    reorderedEntries.splice(draggedIndex, 1);
    
    // Insert it at the new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    reorderedEntries.splice(insertIndex, 0, draggedEntry);
    
    // Update order values
    reorderedEntries.forEach((entry, index) => {
      entry.order = index;
    });
    
    setEvolutionEntries(reorderedEntries);
    setDraggedIndex(null);
  };

  const handleSave = () => {
    // Sort by order before saving
    const sortedEntries = [...evolutionEntries].sort((a, b) => (a.order || 0) - (b.order || 0));
    onSave(sortedEntries);
  };

  const typeOptions = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
    'Steel', 'Fairy'
  ];

  const attributeOptions = [
    'Virus', 'Vaccine', 'Data', 'Free', 'Variable'
  ];

  if (!isOwner) {
    return (
      <div className="evolution-editor-container">
        <div className="access-denied">
          <i className="fas fa-lock"></i>
          <p>Only the monster's owner can edit evolution information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="evolution-editor-container">
      <div className="info-card">
        <h3>
          <i className="fas fa-dna"></i>
          Edit Evolution Information
        </h3>
        <p>Add, modify, delete, and reorganize evolution entries for this monster.</p>
      </div>

      {/* Evolution Entries List */}
      {evolutionEntries.length > 0 && (
        <div className="evolution-entries-list">
          <h4>Current Evolution Chain ({evolutionEntries.length} entries)</h4>
          <div className="change-details">
            {evolutionEntries.map((entry, index) => (
              <div
                key={entry.id}
                className={`evolution-entry-card ${editingIndex === index ? 'editing' : ''}`}
                draggable={editingIndex !== index}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="entry-drag-handle">
                  <i className="fas fa-grip-vertical"></i>
                  <span className="entry-order">#{index + 1}</span>
                </div>

                <div className="entry-preview">
                  {entry.image && (
                    <div className="image-container small">
                      <img
                        src={entry.image}
                        alt="Evolution"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="entry-info">
                    <div className="entry-species">
                      {[entry.species1, entry.species2, entry.species3]
                        .filter(Boolean)
                        .join(' / ') || 'Unnamed Species'}
                    </div>
                    <div className="entry-types">
                      {[entry.type1, entry.type2, entry.type3, entry.type4, entry.type5]
                        .filter(Boolean)
                        .map((type, i) => (
                          <span key={i} className={`badge type-${type.toLowerCase()}`}>
                            {type}
                          </span>
                        ))}
                    </div>
                    {entry.attribute && (
                      <div className="entry-attribute">
                        <span className={`badge attribute-${entry.attribute.toLowerCase()}`}>
                          {entry.attribute}
                        </span>
                      </div>
                    )}
                    {entry.evolution_method && (
                      <div className="entry-method">
                        <i className="fas fa-arrow-right"></i>
                        <span>{entry.evolution_method}</span>
                        {entry.level && <span> (Level {entry.level})</span>}
                        {entry.key && entry.data && <span> - {entry.key}: {entry.data}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="entry-actions">
                  <button
                    className="button secondary icon sm"
                    onClick={() => handleEditEntry(index)}
                    title="Edit this entry"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="button danger icon sm"
                    onClick={() => handleDeleteEntry(index)}
                    title="Delete this entry"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>

                {index < evolutionEntries.length - 1 && (
                  <div className="evolution-arrow">
                    <i className="fas fa-arrow-down"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="evolution-form-container">
        <h4>
          {editingIndex !== null ? 'Edit Evolution Entry' : 'Add New Evolution Entry'}
        </h4>
        
        <form className="town-square" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="form-group image-upload-group">
              <label>Evolution Image:</label>
              <div className="image-input-container">
                <BackendFileUpload
                  onUploadSuccess={(result) => {
                    if (result && result.secure_url) {
                      setFormData(prev => ({ ...prev, image: result.secure_url }));
                    }
                  }}
                  onUploadError={(error) => {
                    console.error('Image upload error:', error);
                    alert('Failed to upload image: ' + error);
                  }}
                  uploadEndpoint="/monsters/upload-image"
                  acceptedFileTypes="image/*"
                  maxFileSize={10 * 1024 * 1024}
                  buttonText="Upload Evolution Image"
                  initialImageUrl={formData.image}
                />
              </div>
              <div className="image-url-option">
                <label htmlFor="image-url">Or enter image URL:</label>
                <input
                  type="url"
                  id="image-url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.png"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h5>Species Information</h5>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="species1">Species 1:</label>
                <input
                  type="text"
                  id="species1"
                  name="species1"
                  value={formData.species1}
                  onChange={handleInputChange}
                  placeholder="Primary species name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="species2">Species 2 (optional):</label>
                <input
                  type="text"
                  id="species2"
                  name="species2"
                  value={formData.species2}
                  onChange={handleInputChange}
                  placeholder="Secondary species name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="species3">Species 3 (optional):</label>
                <input
                  type="text"
                  id="species3"
                  name="species3"
                  value={formData.species3}
                  onChange={handleInputChange}
                  placeholder="Tertiary species name"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h5>Type Information</h5>
            <div className="form-row">
              {[1, 2, 3, 4, 5].map(num => (
                <div className="form-group" key={num}>
                  <label htmlFor={`type${num}`}>Type {num}{num === 1 ? '' : ' (optional)'}:</label>
                  <select
                    id={`type${num}`}
                    name={`type${num}`}
                    value={formData[`type${num}`]}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Select Type --</option>
                    {typeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h5>Additional Properties</h5>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="attribute">Attribute:</label>
                <select
                  id="attribute"
                  name="attribute"
                  value={formData.attribute}
                  onChange={handleInputChange}
                >
                  <option value="">-- Select Attribute --</option>
                  {attributeOptions.map(attr => (
                    <option key={attr} value={attr}>{attr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h5>Evolution Method</h5>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="evolution_method">Evolution Method:</label>
                <input
                  type="text"
                  id="evolution_method"
                  name="evolution_method"
                  value={formData.evolution_method}
                  onChange={handleInputChange}
                  placeholder="e.g., Level up, Trade, Stone evolution"
                />
              </div>
              <div className="form-group">
                <label htmlFor="level">Level (optional):</label>
                <input
                  type="number"
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  placeholder="Required level"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="key">Item/Condition Key (optional):</label>
                <input
                  type="text"
                  id="key"
                  name="key"
                  value={formData.key}
                  onChange={handleInputChange}
                  placeholder="e.g., item, location, time"
                />
              </div>
              <div className="form-group">
                <label htmlFor="data">Item/Condition Data (optional):</label>
                <input
                  type="text"
                  id="data"
                  name="data"
                  value={formData.data}
                  onChange={handleInputChange}
                  placeholder="e.g., Aurora Evolution Stone, Mt. Silver, Night"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            {editingIndex !== null ? (
              <>
                <button
                  type="button"
                  className="button primary"
                  onClick={handleUpdateEntry}
                >
                  <i className="fas fa-save"></i>
                  Update Entry
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setEditingIndex(null);
                    resetForm();
                  }}
                >
                  <i className="fas fa-times"></i>
                  Cancel Edit
                </button>
              </>
            ) : (
              <button
                type="button"
                className="button primary"
                onClick={handleAddEntry}
              >
                <i className="fas fa-plus"></i>
                Add Evolution Entry
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Editor Actions */}
      <div className="evolution-editor-actions">
        <button
          className="button primary"
          onClick={handleSave}
        >
          <i className="fas fa-save"></i>
          Save Evolution Data
        </button>
        <button
          className="button secondary"
          onClick={onCancel}
        >
          <i className="fas fa-times"></i>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EvolutionEditor;