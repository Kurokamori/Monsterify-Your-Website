import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AdminTrainerSelector from '../../components/admin/AdminTrainerSelector';

const ItemManagement = () => {
  // State for single trainer item addition
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('items');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State for bulk trainer item addition
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [bulkItemName, setBulkItemName] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [bulkCategory, setBulkCategory] = useState('items');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');

  // State for item suggestions
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bulkShowSuggestions, setBulkShowSuggestions] = useState(false);

  // State for monthly distribution
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState('');
  const [monthlySuccess, setMonthlySuccess] = useState('');

  // State for give all trainers
  const [allTrainersItemName, setAllTrainersItemName] = useState('');
  const [allTrainersQuantity, setAllTrainersQuantity] = useState(1);
  const [allTrainersCategory, setAllTrainersCategory] = useState('items');
  const [allTrainersLoading, setAllTrainersLoading] = useState(false);
  const [allTrainersError, setAllTrainersError] = useState('');
  const [allTrainersSuccess, setAllTrainersSuccess] = useState('');
  const [allTrainersShowSuggestions, setAllTrainersShowSuggestions] = useState(false);

  // Fetch item suggestions when component mounts
  useEffect(() => {
    fetchItemSuggestions();
  }, []);

  // Fetch item suggestions based on category
  const fetchItemSuggestions = async (selectedCategory = 'items') => {
    try {
      const response = await api.get(`/items?category=${selectedCategory}`);
      if (response.data.success) {
        setItemSuggestions(response.data.data.map(item => item.name));
      }
    } catch (err) {
      console.error('Error fetching item suggestions:', err);
    }
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    fetchItemSuggestions(newCategory);
  };

  // Handle bulk category change
  const handleBulkCategoryChange = (e) => {
    const newCategory = e.target.value;
    setBulkCategory(newCategory);
    fetchItemSuggestions(newCategory);
  };

  // Handle all trainers category change
  const handleAllTrainersCategoryChange = (e) => {
    const newCategory = e.target.value;
    setAllTrainersCategory(newCategory);
    fetchItemSuggestions(newCategory);
  };

  // Handle item name change
  const handleItemNameChange = (e) => {
    setItemName(e.target.value);
    setShowSuggestions(true);
  };

  // Handle bulk item name change
  const handleBulkItemNameChange = (e) => {
    setBulkItemName(e.target.value);
    setBulkShowSuggestions(true);
  };

  // Handle item suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setItemName(suggestion);
    setShowSuggestions(false);
  };

  // Handle bulk item suggestion selection
  const handleBulkSuggestionSelect = (suggestion) => {
    setBulkItemName(suggestion);
    setBulkShowSuggestions(false);
  };

  // Handle all trainers item name change
  const handleAllTrainersItemNameChange = (e) => {
    setAllTrainersItemName(e.target.value);
    setAllTrainersShowSuggestions(true);
  };

  // Handle all trainers item suggestion selection
  const handleAllTrainersSuggestionSelect = (suggestion) => {
    setAllTrainersItemName(suggestion);
    setAllTrainersShowSuggestions(false);
  };

  // Add item to single trainer
  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!selectedTrainer) {
      setError('Please select a trainer');
      return;
    }

    if (!itemName.trim()) {
      setError('Please enter an item name');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await api.post(`/admin/item-management/trainers/${selectedTrainer.value}`, {
        itemName,
        quantity,
        category
      });

      if (response.data.success) {
        setSuccess(`Successfully added ${quantity} ${itemName} to ${selectedTrainer.label}`);
        toast.success(`Added ${quantity} ${itemName} to ${selectedTrainer.label}`);
        
        // Reset form
        setItemName('');
        setQuantity(1);
      } else {
        setError(response.data.message || 'Failed to add item to trainer');
      }
    } catch (err) {
      console.error('Error adding item to trainer:', err);
      setError(err.response?.data?.message || 'An error occurred while adding item to trainer');
    } finally {
      setLoading(false);
    }
  };

  // Add item to multiple trainers
  const handleBulkAddItem = async (e) => {
    e.preventDefault();
    
    if (selectedTrainers.length === 0) {
      setBulkError('Please select at least one trainer');
      return;
    }

    if (!bulkItemName.trim()) {
      setBulkError('Please enter an item name');
      return;
    }

    if (bulkQuantity <= 0) {
      setBulkError('Quantity must be greater than 0');
      return;
    }

    try {
      setBulkLoading(true);
      setBulkError('');
      setBulkSuccess('');

      const response = await api.post('/admin/item-management/trainers', {
        trainerIds: selectedTrainers.map(trainer => trainer.value),
        itemName: bulkItemName,
        quantity: bulkQuantity,
        category: bulkCategory
      });

      if (response.data.success) {
        setBulkSuccess(`Successfully added ${bulkQuantity} ${bulkItemName} to ${selectedTrainers.length} trainers`);
        toast.success(`Added ${bulkQuantity} ${bulkItemName} to ${selectedTrainers.length} trainers`);
        
        // Reset form
        setSelectedTrainers([]);
        setBulkItemName('');
        setBulkQuantity(1);
      } else {
        setBulkError(response.data.message || 'Failed to add item to trainers');
      }
    } catch (err) {
      console.error('Error adding item to trainers:', err);
      setBulkError(err.response?.data?.message || 'An error occurred while adding item to trainers');
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle monthly distribution
  const handleMonthlyDistribution = async () => {
    try {
      setMonthlyLoading(true);
      setMonthlyError('');
      setMonthlySuccess('');

      const response = await api.post('/scheduled-tasks/manual/monthly-distribution');

      if (response.data.success) {
        setMonthlySuccess('Monthly distribution completed successfully!');
        toast.success('Monthly distribution completed successfully!');
      } else {
        setMonthlyError(response.data.message || 'Failed to run monthly distribution');
      }
    } catch (err) {
      console.error('Error running monthly distribution:', err);
      setMonthlyError(err.response?.data?.message || 'An error occurred while running monthly distribution');
    } finally {
      setMonthlyLoading(false);
    }
  };

  // Handle give item to all trainers
  const handleGiveAllTrainers = async (e) => {
    e.preventDefault();

    if (!allTrainersItemName.trim()) {
      setAllTrainersError('Please enter an item name');
      return;
    }

    if (allTrainersQuantity <= 0) {
      setAllTrainersError('Quantity must be greater than 0');
      return;
    }

    try {
      setAllTrainersLoading(true);
      setAllTrainersError('');
      setAllTrainersSuccess('');

      const response = await api.post('/admin/item-management/all-trainers', {
        itemName: allTrainersItemName,
        quantity: allTrainersQuantity,
        category: allTrainersCategory
      });

      if (response.data.success) {
        setAllTrainersSuccess(`Successfully added ${allTrainersQuantity} ${allTrainersItemName} to all trainers`);
        toast.success(`Added ${allTrainersQuantity} ${allTrainersItemName} to all trainers`);

        // Reset form
        setAllTrainersItemName('');
        setAllTrainersQuantity(1);
      } else {
        setAllTrainersError(response.data.message || 'Failed to add item to all trainers');
      }
    } catch (err) {
      console.error('Error adding item to all trainers:', err);
      setAllTrainersError(err.response?.data?.message || 'An error occurred while adding item to all trainers');
    } finally {
      setAllTrainersLoading(false);
    }
  };

  return (
    <Container className="item-management-container">
      <h1 className="map-header">Item Management</h1>
      <p className="page-description">Add items to trainers' inventories</p>

      <Row>
        {/* Single Trainer Item Addition */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Add Item to Trainer</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleAddItem}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Trainer</Form.Label>
                  <AdminTrainerSelector
                    selectedTrainerId={selectedTrainer?.value}
                    onChange={(trainer) => setSelectedTrainer(trainer)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Item Category</Form.Label>
                  <Form.Select value={category} onChange={handleCategoryChange}>
                    <option value="items">General Items</option>
                    <option value="berries">Berries</option>
                    <option value="balls">Poké Balls</option>
                    <option value="medicine">Medicine</option>
                    <option value="key_items">Key Items</option>
                    <option value="tms">TMs</option>
                    <option value="antiques">Antiques</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3 item-input-container">
                  <Form.Label>Item Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={itemName}
                    onChange={handleItemNameChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Enter item name"
                  />
                  {showSuggestions && itemSuggestions.length > 0 && (
                    <div className="item-suggestions">
                      {itemSuggestions
                        .filter(suggestion => suggestion.toLowerCase().includes(itemName.toLowerCase()))
                        .slice(0, 5)
                        .map((suggestion, index) => (
                          <div
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleSuggestionSelect(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Add Item'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Bulk Trainer Item Addition */}
        <Col md={6}>
          <Card>
            <Card.Header>Add Item to Multiple Trainers</Card.Header>
            <Card.Body>
              {bulkError && <Alert variant="danger">{bulkError}</Alert>}
              {bulkSuccess && <Alert variant="success">{bulkSuccess}</Alert>}

              <Form onSubmit={handleBulkAddItem}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Trainers</Form.Label>
                  <AdminTrainerSelector
                    isMulti
                    selectedTrainerId={selectedTrainers.map(t => t.value)}
                    onChange={(trainers) => setSelectedTrainers(trainers)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Item Category</Form.Label>
                  <Form.Select value={bulkCategory} onChange={handleBulkCategoryChange}>
                    <option value="items">General Items</option>
                    <option value="berries">Berries</option>
                    <option value="balls">Poké Balls</option>
                    <option value="medicine">Medicine</option>
                    <option value="key_items">Key Items</option>
                    <option value="tms">TMs</option>
                    <option value="antiques">Antiques</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3 item-input-container">
                  <Form.Label>Item Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={bulkItemName}
                    onChange={handleBulkItemNameChange}
                    onBlur={() => setTimeout(() => setBulkShowSuggestions(false), 200)}
                    onFocus={() => setBulkShowSuggestions(true)}
                    placeholder="Enter item name"
                  />
                  {bulkShowSuggestions && itemSuggestions.length > 0 && (
                    <div className="item-suggestions">
                      {itemSuggestions
                        .filter(suggestion => suggestion.toLowerCase().includes(bulkItemName.toLowerCase()))
                        .slice(0, 5)
                        .map((suggestion, index) => (
                          <div
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleBulkSuggestionSelect(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={bulkLoading}
                  className="w-100"
                >
                  {bulkLoading ? <LoadingSpinner size="sm" /> : 'Add Item to Selected Trainers'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Admin Tools Row */}
      <Row className="mt-4">
        {/* Monthly Distribution */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Monthly Distribution</Card.Header>
            <Card.Body>
              {monthlyError && <Alert variant="danger">{monthlyError}</Alert>}
              {monthlySuccess && <Alert variant="success">{monthlySuccess}</Alert>}

              <p className="text-muted">
                Manually trigger the monthly distribution of Legacy Leeway, Daycare Day Pass, and Mission Mandate to all trainers.
              </p>

              <Button
                variant="warning"
                onClick={handleMonthlyDistribution}
                disabled={monthlyLoading}
                className="w-100"
              >
                {monthlyLoading ? <LoadingSpinner size="sm" /> : 'Run Monthly Distribution'}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Give Item to All Trainers */}
        <Col md={6}>
          <Card>
            <Card.Header>Give Item to All Trainers</Card.Header>
            <Card.Body>
              {allTrainersError && <Alert variant="danger">{allTrainersError}</Alert>}
              {allTrainersSuccess && <Alert variant="success">{allTrainersSuccess}</Alert>}

              <Form onSubmit={handleGiveAllTrainers}>
                <Form.Group className="mb-3">
                  <Form.Label>Item Category</Form.Label>
                  <Form.Select value={allTrainersCategory} onChange={handleAllTrainersCategoryChange}>
                    <option value="items">General Items</option>
                    <option value="berries">Berries</option>
                    <option value="balls">Poké Balls</option>
                    <option value="medicine">Medicine</option>
                    <option value="key_items">Key Items</option>
                    <option value="keyitems">Key Items</option>
                    <option value="tms">TMs</option>
                    <option value="antiques">Antiques</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3 item-input-container">
                  <Form.Label>Item Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={allTrainersItemName}
                    onChange={handleAllTrainersItemNameChange}
                    onBlur={() => setTimeout(() => setAllTrainersShowSuggestions(false), 200)}
                    onFocus={() => setAllTrainersShowSuggestions(true)}
                    placeholder="Enter item name"
                  />
                  {allTrainersShowSuggestions && itemSuggestions.length > 0 && (
                    <div className="item-suggestions">
                      {itemSuggestions
                        .filter(suggestion => suggestion.toLowerCase().includes(allTrainersItemName.toLowerCase()))
                        .slice(0, 5)
                        .map((suggestion, index) => (
                          <div
                            key={index}
                            className="suggestion-item"
                            onClick={() => handleAllTrainersSuggestionSelect(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={allTrainersQuantity}
                    onChange={(e) => setAllTrainersQuantity(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </Form.Group>

                <Button
                  variant="danger"
                  type="submit"
                  disabled={allTrainersLoading}
                  className="w-100"
                >
                  {allTrainersLoading ? <LoadingSpinner size="sm" /> : 'Give to All Trainers'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ItemManagement;
