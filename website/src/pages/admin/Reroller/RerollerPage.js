import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import rerollerService from '../../../services/rerollerService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const RerollerPage = () => {
  // Roll type state
  const [rollType, setRollType] = useState('monster');

  // User selection state
  const [users, setUsers] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Monster configuration
  const [monsterCount, setMonsterCount] = useState(1);

  // Item configuration
  const [itemCount, setItemCount] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([
    'berries', 'pastries', 'evolution', 'helditems', 'balls', 'antiques'
  ]);

  // Gift configuration
  const [giftLevels, setGiftLevels] = useState(10);

  // Claim limits
  const [monsterClaimLimit, setMonsterClaimLimit] = useState(null);
  const [itemClaimLimit, setItemClaimLimit] = useState(null);

  // Notes
  const [notes, setNotes] = useState('');

  // Results state
  const [session, setSession] = useState(null);
  const [rolledMonsters, setRolledMonsters] = useState([]);
  const [rolledItems, setRolledItems] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Item categories
  const itemCategories = rerollerService.getItemCategories();

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data.users || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  // Filter users by search
  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Handle category toggle
  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Toggle all categories
  const toggleAllCategories = () => {
    const defaultCategories = itemCategories.filter(c => c.default).map(c => c.value);
    if (selectedCategories.length === defaultCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(defaultCategories);
    }
  };

  // Calculate gift roll counts
  const giftCounts = rerollerService.calculateGiftCounts(giftLevels);

  // Generate roll
  const handleGenerateRoll = async () => {
    if (!targetUserId) {
      setError('Please select a target user');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const sessionData = {
        rollType,
        targetUserId: parseInt(targetUserId),
        notes
      };

      if (rollType === 'monster') {
        sessionData.monsterCount = monsterCount;
        sessionData.monsterClaimLimit = monsterClaimLimit;
      } else if (rollType === 'item') {
        sessionData.itemCount = itemCount;
        sessionData.itemParams = { categories: selectedCategories };
        sessionData.itemClaimLimit = itemClaimLimit;
      } else if (rollType === 'combined') {
        sessionData.monsterCount = monsterCount;
        sessionData.itemCount = itemCount;
        sessionData.itemParams = { categories: selectedCategories };
        sessionData.monsterClaimLimit = monsterClaimLimit;
        sessionData.itemClaimLimit = itemClaimLimit;
      } else if (rollType === 'gift') {
        sessionData.giftLevels = giftLevels;
      }

      const response = await rerollerService.createSession(sessionData);
      setSession(response.data);
      setRolledMonsters(response.data.rolledMonsters || []);
      setRolledItems(response.data.rolledItems || []);
      setSuccess('Roll generated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate roll');
    } finally {
      setLoading(false);
    }
  };

  // Reroll entire session
  const handleRerollAll = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await rerollerService.rerollAll(session.id);
      setSession(response.data);
      setRolledMonsters(response.data.rolledMonsters || []);
      setRolledItems(response.data.rolledItems || []);
      setSuccess('All results rerolled!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reroll');
    } finally {
      setLoading(false);
    }
  };

  // Reroll single result
  const handleRerollResult = async (type, index) => {
    if (!session) return;

    try {
      const response = await rerollerService.rerollResult(session.id, type, index);
      setSession(response.data);
      setRolledMonsters(response.data.rolledMonsters || []);
      setRolledItems(response.data.rolledItems || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reroll result');
    }
  };

  // Delete single result
  const handleDeleteResult = async (type, index) => {
    if (!session) return;

    try {
      const response = await rerollerService.deleteResult(session.id, type, index);
      setSession(response.data);
      setRolledMonsters(response.data.rolledMonsters || []);
      setRolledItems(response.data.rolledItems || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete result');
    }
  };

  // Open edit modal
  const handleEditResult = (type, index, data) => {
    setEditModal({ type, index, data: { ...data } });
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!session || !editModal) return;

    try {
      const response = await rerollerService.updateResult(
        session.id,
        editModal.type,
        editModal.index,
        editModal.data
      );
      setSession(response.data);
      setRolledMonsters(response.data.rolledMonsters || []);
      setRolledItems(response.data.rolledItems || []);
      setEditModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update result');
    }
  };

  // Update claim limits
  const handleUpdateClaimLimits = async () => {
    if (!session) return;

    try {
      await rerollerService.updateSession(session.id, {
        monsterClaimLimit,
        itemClaimLimit
      });
      setSuccess('Claim limits updated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update claim limits');
    }
  };

  // Copy link to clipboard
  const copyLink = () => {
    if (!session) return;
    const link = rerollerService.buildClaimUrl(session.token);
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Render monster card
  const renderMonsterCard = (monster, index) => (
    <div key={index} className="result-card">
      <img
        src={monster.image_url || monster.species1_img || '/images/monsters/default.png'}
        alt={monster.species1}
        className="result-card-image"
        onError={(e) => { e.target.src = '/images/monsters/default.png'; }}
      />
      <div className="result-card-name">{monster.species1}</div>
      {monster.species2 && (
        <div className="result-card-details">+ {monster.species2}</div>
      )}
      <div className="type-badges">
        {monster.type1 && <span className="type-badge">{monster.type1}</span>}
        {monster.type2 && <span className="type-badge">{monster.type2}</span>}
        {monster.type3 && <span className="type-badge">{monster.type3}</span>}
      </div>
      <div className="result-card-actions">
        <button
          className="button primary"
          onClick={() => handleEditResult('monster', index, monster)}
        >
          Edit
        </button>
        <button
          className="button primary"
          onClick={() => handleRerollResult('monster', index)}
        >
          Reroll
        </button>
        <button
          className="button danger"
          onClick={() => handleDeleteResult('monster', index)}
        >
          Delete
        </button>
      </div>
    </div>
  );

  // Render item card
  const renderItemCard = (item, index) => (
    <div key={index} className="result-card">
      <img
        src={item.image_url || '/images/items/default_item.png'}
        alt={item.name}
        className="result-card-image"
        onError={(e) => { e.target.src = '/images/items/default_item.png'; }}
      />
      <div className="result-card-name">{item.name}</div>
      <div className="result-card-details">
        {item.category} {item.quantity > 1 && `x${item.quantity}`}
      </div>
      <div className="result-card-actions">
        <button
          className="button primary"
          onClick={() => handleEditResult('item', index, item)}
        >
          Edit
        </button>
        <button
          className="button primary"
          onClick={() => handleRerollResult('item', index)}
        >
          Reroll
        </button>
        <button
          className="button danger"
          onClick={() => handleDeleteResult('item', index)}
        >
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="reroller-container">
      <div className="reroller-header">
        <h1>Reroller</h1>
        <p>Create custom rolls for players and generate claim links</p>
        <Link to="/admin/reroller/sessions" className="button secondary reroller-sessions-link">
          View All Sessions
        </Link>
      </div>

      {/* Roll Type Tabs */}
      <div className="roll-type-tabs">
        <button
          className={`roll-type-tab ${rollType === 'monster' ? 'active' : ''}`}
          onClick={() => setRollType('monster')}
        >
          Monster
        </button>
        <button
          className={`roll-type-tab ${rollType === 'item' ? 'active' : ''}`}
          onClick={() => setRollType('item')}
        >
          Item
        </button>
        <button
          className={`roll-type-tab ${rollType === 'combined' ? 'active' : ''}`}
          onClick={() => setRollType('combined')}
        >
          Combined
        </button>
        <button
          className={`roll-type-tab ${rollType === 'gift' ? 'active' : ''}`}
          onClick={() => setRollType('gift')}
        >
          Gift
        </button>
        <button
          className={`roll-type-tab ${rollType === 'birthday' ? 'active' : ''}`}
          onClick={() => setRollType('birthday')}
        >
          Birthday
        </button>
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <div className="reroller-content">
        {/* Configuration Panel */}
        <div className="config-panel">
          <div className="panel-header">
            <h2>Configuration</h2>
          </div>

          {/* Target User */}
          <div className="config-section">
            <h3><i className="fas fa-user"></i> Target User</h3>
            <div className="user-selector">
              <div className="user-search">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="">Select a user...</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.display_name || user.username} ({user.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monster Config - show for monster, combined */}
          {(rollType === 'monster' || rollType === 'combined') && (
            <div className="config-section">
              <h3><i className="fas fa-dragon"></i> Monster Settings</h3>
              <div className="quantity-control">
                <button
                  className="button primary"
                  onClick={() => setMonsterCount(Math.max(1, monsterCount - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  className="quantity-input"
                  value={monsterCount}
                  onChange={(e) => setMonsterCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="20"
                />
                <button
                  className="button primary"
                  onClick={() => setMonsterCount(Math.min(20, monsterCount + 1))}
                >
                  +
                </button>
                <span className="quantity-suffix">monsters</span>
              </div>
            </div>
          )}

          {/* Item Config - show for item, combined */}
          {(rollType === 'item' || rollType === 'combined') && (
            <div className="config-section">
              <h3><i className="fas fa-box"></i> Item Settings</h3>
              <div className="quantity-control quantity-control-block">
                <button
                  className="button primary"
                  onClick={() => setItemCount(Math.max(1, itemCount - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  className="quantity-input"
                  value={itemCount}
                  onChange={(e) => setItemCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="20"
                />
                <button
                  className="button primary"
                  onClick={() => setItemCount(Math.min(20, itemCount + 1))}
                >
                  +
                </button>
                <span className="quantity-suffix">items</span>
              </div>

              <label className="reroller-field-label">
                Categories
              </label>
              <div className="category-buttons">
                <button
                  className={`button filter ${selectedCategories.length === itemCategories.filter(c => c.default).length ? 'selected' : ''}`}
                  onClick={toggleAllCategories}
                >
                  All Default
                </button>
                {itemCategories.map(cat => (
                  <button
                    key={cat.value}
                    className={`button filter ${selectedCategories.includes(cat.value) ? 'selected' : ''}`}
                    onClick={() => toggleCategory(cat.value)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gift Config - show for gift */}
          {rollType === 'gift' && (
            <div className="config-section">
              <h3><i className="fas fa-gift"></i> Gift Settings</h3>
              <div className="gift-level-input">
                <input
                  type="number"
                  value={giftLevels}
                  onChange={(e) => setGiftLevels(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  placeholder="Enter gift levels..."
                />
                <div className="gift-preview">
                  <strong>Preview:</strong> {giftCounts.monsterCount} monster(s), {giftCounts.itemCount} item(s)
                </div>
              </div>
            </div>
          )}

          {/* Birthday Config - show for birthday */}
          {rollType === 'birthday' && (
            <div className="config-section">
              <h3><i className="fas fa-birthday-cake"></i> Birthday Settings</h3>
              <div className="birthday-info">
                <p className="reroller-help-text">
                  Birthday preset automatically rolls:
                </p>
                <ul className="reroller-help-list">
                  <li><strong>10 Items</strong> - Random from all categories</li>
                  <li><strong>10 Monsters</strong> - Base stage only, no legendaries</li>
                </ul>
                <p className="reroller-help-note">
                  Uses the target user's monster table preferences.
                </p>
              </div>
            </div>
          )}

          {/* Claim Limits - show for non-gift and non-birthday */}
          {rollType !== 'gift' && rollType !== 'birthday' && (
            <div className="config-section">
              <h3><i className="fas fa-lock"></i> Claim Limits</h3>
              <div className="claim-limits">
                {(rollType === 'monster' || rollType === 'combined') && (
                  <div className="limit-group">
                    <label>Monster Limit</label>
                    <select
                      value={monsterClaimLimit === null ? 'all' : monsterClaimLimit}
                      onChange={(e) => setMonsterClaimLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
                    >
                      <option value="all">All</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(rollType === 'item' || rollType === 'combined') && (
                  <div className="limit-group">
                    <label>Item Limit</label>
                    <select
                      value={itemClaimLimit === null ? 'all' : itemClaimLimit}
                      onChange={(e) => setItemClaimLimit(e.target.value === 'all' ? null : parseInt(e.target.value))}
                    >
                      <option value="all">All</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="config-section">
            <h3><i className="fas fa-sticky-note"></i> Notes (Optional)</h3>
            <textarea
              className="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this roll..."
            />
          </div>

          {/* Generate Button */}
          <div className="action-buttons">
            <button
              className="button primary"
              onClick={handleGenerateRoll}
              disabled={loading || !targetUserId}
            >
              {loading ? 'Generating...' : 'Generate Roll'}
            </button>
            {session && (
              <button
                className="button secondary"
                onClick={handleRerollAll}
                disabled={loading}
              >
                Reroll All
              </button>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          <div className="panel-header">
            <h2>Results</h2>
            {session && (
              <button className="button secondary" onClick={handleUpdateClaimLimits}>
                Update Limits
              </button>
            )}
          </div>

          {!session ? (
            <div className="empty-results">
              <i className="fas fa-dice"></i>
              <p>Configure the roll settings and click "Generate Roll" to see results</p>
            </div>
          ) : (
            <>
              {/* Monster Results */}
              {rolledMonsters.length > 0 && (
                <div className="results-section">
                  <h3>
                    Monsters ({rolledMonsters.length})
                    {session.monsterClaimLimit && (
                      <span className="reroller-info-value">
                        - Limit: {session.monsterClaimLimit}
                      </span>
                    )}
                  </h3>
                  <div className="results-grid">
                    {rolledMonsters.map((monster, index) => renderMonsterCard(monster, index))}
                  </div>
                </div>
              )}

              {/* Item Results */}
              {rolledItems.length > 0 && (
                <div className="results-section">
                  <h3>
                    Items ({rolledItems.length})
                    {session.itemClaimLimit && (
                      <span className="reroller-info-value">
                        - Limit: {session.itemClaimLimit}
                      </span>
                    )}
                  </h3>
                  <div className="results-grid">
                    {rolledItems.map((item, index) => renderItemCard(item, index))}
                  </div>
                </div>
              )}

              {/* Generated Link */}
              <div className="link-section">
                <h3><i className="fas fa-link"></i> Claim Link</h3>
                <div className="link-display">
                  <input
                    type="text"
                    className="link-input"
                    value={rerollerService.buildClaimUrl(session.token)}
                    readOnly
                  />
                  <button className="button success" onClick={copyLink}>
                    <i className={copiedLink ? 'fas fa-check' : 'fas fa-copy'}></i>
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="reroller-info-note">
                  Send this link to {users.find(u => u.id === parseInt(targetUserId))?.display_name || 'the player'} to claim their rewards.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="edit-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit {editModal.type === 'monster' ? 'Monster' : 'Item'}</h3>

            {editModal.type === 'monster' ? (
              <>
                <div className="edit-form-group">
                  <label>Species 1</label>
                  <input
                    type="text"
                    value={editModal.data.species1 || ''}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, species1: e.target.value }
                    })}
                  />
                </div>
                <div className="edit-form-group">
                  <label>Species 2</label>
                  <input
                    type="text"
                    value={editModal.data.species2 || ''}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, species2: e.target.value }
                    })}
                  />
                </div>
                <div className="edit-form-group">
                  <label>Type 1</label>
                  <input
                    type="text"
                    value={editModal.data.type1 || ''}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, type1: e.target.value }
                    })}
                  />
                </div>
                <div className="edit-form-group">
                  <label>Type 2</label>
                  <input
                    type="text"
                    value={editModal.data.type2 || ''}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, type2: e.target.value }
                    })}
                  />
                </div>
                <div className="edit-form-group">
                  <label>Image URL</label>
                  <input
                    type="text"
                    value={editModal.data.image_url || ''}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, image_url: e.target.value }
                    })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="edit-form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    value={editModal.data.name || ''}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, name: e.target.value }
                    })}
                  />
                </div>
                <div className="edit-form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    value={editModal.data.category || ''}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, category: e.target.value }
                    })}
                  />
                </div>
                <div className="edit-form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={editModal.data.quantity || 1}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      data: { ...editModal.data, quantity: parseInt(e.target.value) || 1 }
                    })}
                    min="1"
                  />
                </div>
              </>
            )}

            <div className="edit-modal-actions">
              <button className="button secondary" onClick={() => setEditModal(null)}>
                Cancel
              </button>
              <button className="button primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RerollerPage;
