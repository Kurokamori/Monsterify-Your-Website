import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Select from 'react-select';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const LevelManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  // Single trainer/monster state
  const [trainers, setTrainers] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [levels, setLevels] = useState(1);
  const [coins, setCoins] = useState(50);
  const [reason, setReason] = useState('');
  const [useDefaultCoins, setUseDefaultCoins] = useState(true);

  // Bulk management state
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [selectedMonsters, setSelectedMonsters] = useState([]);
  const [bulkLevels, setBulkLevels] = useState(1);
  const [bulkCoins, setBulkCoins] = useState(50);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkUseDefaultCoins, setBulkUseDefaultCoins] = useState(true);

  // Fetch trainers and monsters on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch trainers (non-paginated)
        const trainersResponse = await api.get('/trainers/all');
        console.log('Trainers response:', trainersResponse);

        // Handle different API response formats
        if (trainersResponse.data && trainersResponse.data.success) {
          // Check if data is in trainers property or data property
          const trainersData = trainersResponse.data.trainers || trainersResponse.data.data || [];

          if (Array.isArray(trainersData)) {
            setTrainers(trainersData.map(trainer => ({
              value: trainer.id,
              label: `${trainer.name} (Level ${trainer.level || 1})`,
              data: trainer
            })));
          } else {
            console.error('Unexpected trainers data format:', trainersData);
            toast.error('Failed to parse trainers data');
          }
        } else {
          // Handle case where success is false
          console.error('Failed to fetch trainers:', trainersResponse.data?.message);
          toast.error('Failed to fetch trainers');
        }

        // Fetch monsters
        const monstersResponse = await api.get('/monsters');
        console.log('Monsters response:', monstersResponse);

        // Handle different API response formats
        if (monstersResponse.data && monstersResponse.data.success) {
          // Check if data is in monsters property or data property
          const monstersData = monstersResponse.data.monsters || monstersResponse.data.data || [];

          if (Array.isArray(monstersData)) {
            setMonsters(monstersData.map(monster => ({
              value: monster.id || monster.mon_id, // Handle both id formats
              label: `${monster.name} (Level ${monster.level || 1}) - ${monster.trainer_name || 'No Trainer'}`,
              data: monster
            })));
          } else {
            console.error('Unexpected monsters data format:', monstersData);
            toast.error('Failed to parse monsters data');
          }
        } else {
          // Handle case where success is false
          console.error('Failed to fetch monsters:', monstersResponse.data?.message);
          toast.error('Failed to fetch monsters');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load trainers and monsters. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update coins when levels change (if using default coins)
  useEffect(() => {
    if (useDefaultCoins) {
      setCoins(levels * 50);
    }
  }, [levels, useDefaultCoins]);

  // Update bulk coins when bulk levels change (if using default coins)
  useEffect(() => {
    if (bulkUseDefaultCoins) {
      setBulkCoins(bulkLevels * 50);
    }
  }, [bulkLevels, bulkUseDefaultCoins]);

  // Handle single trainer level up
  const handleTrainerLevelUp = async (e) => {
    e.preventDefault();

    if (!selectedTrainer) {
      toast.error('Please select a trainer');
      return;
    }

    if (levels <= 0) {
      toast.error('Levels must be a positive number');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(`/admin/level-management/trainers/${selectedTrainer.value}`, {
        levels,
        coins,
        reason
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // Reset form
        setSelectedTrainer(null);
        setLevels(1);
        setCoins(50);
        setReason('');
        setUseDefaultCoins(true);
      } else {
        toast.error(response.data.message || 'Failed to add levels to trainer');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error adding levels to trainer:', err);
      toast.error(err.response?.data?.message || 'An error occurred while adding levels to trainer');
      setLoading(false);
    }
  };

  // Handle single monster level up
  const handleMonsterLevelUp = async (e) => {
    e.preventDefault();

    if (!selectedMonster) {
      toast.error('Please select a monster');
      return;
    }

    if (levels <= 0) {
      toast.error('Levels must be a positive number');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(`/admin/level-management/monsters/${selectedMonster.value}`, {
        levels,
        reason
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // Reset form
        setSelectedMonster(null);
        setLevels(1);
        setReason('');
      } else {
        toast.error(response.data.message || 'Failed to add levels to monster');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error adding levels to monster:', err);
      toast.error(err.response?.data?.message || 'An error occurred while adding levels to monster');
      setLoading(false);
    }
  };

  // Handle bulk trainer level up
  const handleBulkTrainerLevelUp = async (e) => {
    e.preventDefault();

    if (selectedTrainers.length === 0) {
      toast.error('Please select at least one trainer');
      return;
    }

    if (bulkLevels <= 0) {
      toast.error('Levels must be a positive number');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/admin/level-management/trainers', {
        trainerIds: selectedTrainers.map(trainer => trainer.value),
        levels: bulkLevels,
        coins: bulkCoins,
        reason: bulkReason
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // Reset form
        setSelectedTrainers([]);
        setBulkLevels(1);
        setBulkCoins(50);
        setBulkReason('');
        setBulkUseDefaultCoins(true);
      } else {
        toast.error(response.data.message || 'Failed to add levels to trainers');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error adding levels to trainers:', err);
      toast.error(err.response?.data?.message || 'An error occurred while adding levels to trainers');
      setLoading(false);
    }
  };

  // Handle bulk monster level up
  const handleBulkMonsterLevelUp = async (e) => {
    e.preventDefault();

    if (selectedMonsters.length === 0) {
      toast.error('Please select at least one monster');
      return;
    }

    if (bulkLevels <= 0) {
      toast.error('Levels must be a positive number');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/admin/level-management/monsters', {
        monsterIds: selectedMonsters.map(monster => monster.value),
        levels: bulkLevels,
        reason: bulkReason
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // Reset form
        setSelectedMonsters([]);
        setBulkLevels(1);
        setBulkReason('');
      } else {
        toast.error(response.data.message || 'Failed to add levels to monsters');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error adding levels to monsters:', err);
      toast.error(err.response?.data?.message || 'An error occurred while adding levels to monsters');
      setLoading(false);
    }
  };

  if (loading && !trainers.length && !monsters.length) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="level-management">
      <div className="level-management-header">
        <h1>Level Management</h1>
        <p>Add levels and coins to trainers and monsters</p>
      </div>

      <Tabs selectedIndex={tabIndex} onSelect={index => setTabIndex(index)}>
        <TabList>
          <Tab>Single Trainer/Monster</Tab>
          <Tab>Bulk Management</Tab>
        </TabList>

        <TabPanel>
          <div className="level-management-tabs">
            <Tabs>
              <TabList>
                <Tab>Trainer</Tab>
                <Tab>Monster</Tab>
              </TabList>

              <TabPanel>
                <form onSubmit={handleTrainerLevelUp} className="level-management-form">
                  <div className="form-group">
                    <label>Select Trainer</label>
                    <Select
                      options={trainers}
                      value={selectedTrainer}
                      onChange={setSelectedTrainer}
                      placeholder="Search for a trainer..."
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div className="form-group">
                    <label>Levels to Add</label>
                    <input
                      type="number"
                      min="1"
                      value={levels}
                      onChange={e => setLevels(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="useDefaultCoins"
                        checked={useDefaultCoins}
                        onChange={e => setUseDefaultCoins(e.target.checked)}
                      />
                      <label htmlFor="useDefaultCoins">Use default coins (50 per level)</label>
                    </div>
                  </div>

                  {!useDefaultCoins && (
                    <div className="form-group">
                      <label>Coins to Add</label>
                      <input
                        type="number"
                        min="0"
                        value={coins}
                        onChange={e => setCoins(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Reason (Optional)</label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Reason for adding levels and coins"
                    />
                  </div>

                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Processing...' : 'Add Levels to Trainer'}
                  </button>
                </form>
              </TabPanel>

              <TabPanel>
                <form onSubmit={handleMonsterLevelUp} className="level-management-form">
                  <div className="form-group">
                    <label>Select Monster</label>
                    <Select
                      options={monsters}
                      value={selectedMonster}
                      onChange={setSelectedMonster}
                      placeholder="Search for a monster..."
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div className="form-group">
                    <label>Levels to Add</label>
                    <input
                      type="number"
                      min="1"
                      value={levels}
                      onChange={e => setLevels(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Reason (Optional)</label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="Reason for adding levels"
                    />
                  </div>

                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Processing...' : 'Add Levels to Monster'}
                  </button>
                </form>
              </TabPanel>
            </Tabs>
          </div>
        </TabPanel>

        <TabPanel>
          <div className="level-management-tabs">
            <Tabs>
              <TabList>
                <Tab>Trainers</Tab>
                <Tab>Monsters</Tab>
              </TabList>

              <TabPanel>
                <form onSubmit={handleBulkTrainerLevelUp} className="level-management-form">
                  <div className="form-group">
                    <label>Select Trainers</label>
                    <Select
                      options={trainers}
                      value={selectedTrainers}
                      onChange={setSelectedTrainers}
                      placeholder="Search for trainers..."
                      isSearchable
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div className="form-group">
                    <label>Levels to Add</label>
                    <input
                      type="number"
                      min="1"
                      value={bulkLevels}
                      onChange={e => setBulkLevels(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="bulkUseDefaultCoins"
                        checked={bulkUseDefaultCoins}
                        onChange={e => setBulkUseDefaultCoins(e.target.checked)}
                      />
                      <label htmlFor="bulkUseDefaultCoins">Use default coins (50 per level)</label>
                    </div>
                  </div>

                  {!bulkUseDefaultCoins && (
                    <div className="form-group">
                      <label>Coins to Add</label>
                      <input
                        type="number"
                        min="0"
                        value={bulkCoins}
                        onChange={e => setBulkCoins(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Reason (Optional)</label>
                    <textarea
                      value={bulkReason}
                      onChange={e => setBulkReason(e.target.value)}
                      placeholder="Reason for adding levels and coins"
                    />
                  </div>

                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Processing...' : 'Add Levels to Selected Trainers'}
                  </button>
                </form>
              </TabPanel>

              <TabPanel>
                <form onSubmit={handleBulkMonsterLevelUp} className="level-management-form">
                  <div className="form-group">
                    <label>Select Monsters</label>
                    <Select
                      options={monsters}
                      value={selectedMonsters}
                      onChange={setSelectedMonsters}
                      placeholder="Search for monsters..."
                      isSearchable
                      isMulti
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>

                  <div className="form-group">
                    <label>Levels to Add</label>
                    <input
                      type="number"
                      min="1"
                      value={bulkLevels}
                      onChange={e => setBulkLevels(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Reason (Optional)</label>
                    <textarea
                      value={bulkReason}
                      onChange={e => setBulkReason(e.target.value)}
                      placeholder="Reason for adding levels"
                    />
                  </div>

                  <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Processing...' : 'Add Levels to Selected Monsters'}
                  </button>
                </form>
              </TabPanel>
            </Tabs>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default LevelManagement;


