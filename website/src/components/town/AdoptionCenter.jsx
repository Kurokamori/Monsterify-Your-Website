import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import adoptionService from '../../services/adoptionService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import Pagination from '../common/Pagination';
import TypeBadge from '../monsters/TypeBadge';
import AttributeBadge from '../monsters/AttributeBadge';
import TrainerSelector from '../common/TrainerSelector';


const AdoptionCenter = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const currentUserId = currentUser?.discord_id;

  // State for adoption center data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adopts, setAdopts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  // State for user trainers
  const [userTrainers, setUserTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [trainerDaypasses, setTrainerDaypasses] = useState({});

  // State for adoption modal
  const [selectedAdopt, setSelectedAdopt] = useState(null);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [monsterName, setMonsterName] = useState('');
  const [adoptionLoading, setAdoptionLoading] = useState(false);
  const [adoptionSuccess, setAdoptionSuccess] = useState(false);
  const [adoptionError, setAdoptionError] = useState('');
  const [adoptedMonster, setAdoptedMonster] = useState(null);

  // State for berry and pastry modals
  const [showBerryModal, setShowBerryModal] = useState(false);
  const [showPastryModal, setShowPastryModal] = useState(false);
  const [selectedBerry, setSelectedBerry] = useState('');
  const [selectedPastry, setSelectedPastry] = useState('');
  const [berryLoading, setBerryLoading] = useState(false);
  const [pastryLoading, setPastryLoading] = useState(false);
  const [berryError, setBerryError] = useState('');
  const [pastryError, setPastryError] = useState('');
  const [availableBerries, setAvailableBerries] = useState({});
  const [availablePastries, setAvailablePastries] = useState({});

  // State for view options
  const [showCurrentMonthOnly, setShowCurrentMonthOnly] = useState(true);
  const [monthsWithData, setMonthsWithData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Load adopts and user trainers on component mount
  useEffect(() => {
    fetchData();
  }, [pagination.page, showCurrentMonthOnly, selectedYear, selectedMonth]);

  // Load user trainers when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTrainers(currentUserId);
    }
  }, [isAuthenticated, currentUserId]);

  // Fetch adoption center data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch months with data
      if (monthsWithData.length === 0) {
        await fetchMonthsWithData();
      }

      // Fetch adopts based on view options
      let response;
      if (showCurrentMonthOnly) {
        response = await adoptionService.getCurrentMonthAdopts({
          page: pagination.page,
          limit: pagination.limit
        });
      } else {
        response = await adoptionService.getAdoptsByYearAndMonth(
          selectedYear,
          selectedMonth,
          {
            page: pagination.page,
            limit: pagination.limit
          }
        );
      }

      if (response.success) {
        setAdopts(response.adopts || []);
        setPagination({
          ...pagination,
          total: response.total || 0,
          totalPages: response.pagination?.totalPages || 1
        });
      } else {
        setError('Failed to load adoption data');
      }
    } catch (err) {
      console.error('Error fetching adoption center data:', err);
      setError('Failed to load adoption center data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch months with adoption data
  const fetchMonthsWithData = async () => {
    try {
      const response = await adoptionService.getMonthsWithData();
      if (response.success) {
        setMonthsWithData(response.months || []);
      }
    } catch (err) {
      console.error('Error fetching months with data:', err);
    }
  };

  // Fetch user trainers
  const fetchUserTrainers = async (userId) => {
    try {
      const response = await trainerService.getUserTrainers(userId);
      if (response.success) {
        const trainers = response.trainers || [];
        setUserTrainers(trainers);

        if (trainers.length > 0) {
          setSelectedTrainer(trainers[0].id.toString());
          await checkTrainerDaypasses(trainers);
        }
      }
    } catch (err) {
      console.error('Error fetching user trainers:', err);
    }
  };

  // Check daycare daypasses for each trainer
  const checkTrainerDaypasses = async (trainers) => {
    try {
      const daypasses = {};

      for (const trainer of trainers) {
        const response = await adoptionService.checkDaycareDaypass(trainer.id);
        if (response.success) {
          daypasses[trainer.id] = {
            hasDaypass: response.hasDaypass,
            daypassCount: response.daypassCount
          };
        }
      }

      setTrainerDaypasses(daypasses);
    } catch (err) {
      console.error('Error checking trainer daypasses:', err);
    }
  };

  // Fetch available berries for a trainer
  const fetchAvailableBerries = async (trainerId) => {
    try {
      const response = await fetch(`/api/adoption/berries/${trainerId}`);
      const data = await response.json();

      if (data.success) {
        setAvailableBerries(data.berries || {});
        return data.berries || {};
      } else {
        console.error('Error fetching berries:', data.message);
        return {};
      }
    } catch (err) {
      console.error('Error fetching berries:', err);
      return {};
    }
  };

  // Fetch available pastries for a trainer
  const fetchAvailablePastries = async (trainerId) => {
    try {
      const response = await fetch(`/api/adoption/pastries/${trainerId}`);
      const data = await response.json();

      if (data.success) {
        setAvailablePastries(data.pastries || {});
        return data.pastries || {};
      } else {
        console.error('Error fetching pastries:', data.message);
        return {};
      }
    } catch (err) {
      console.error('Error fetching pastries:', err);
      return {};
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  // Handle view option change
  const handleViewOptionChange = (showCurrent) => {
    setShowCurrentMonthOnly(showCurrent);
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // Handle month selection change
  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split('-').map(Number);
    setSelectedYear(year);
    setSelectedMonth(month);
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // Handle adopt click
  const handleAdoptClick = (adopt) => {
    setSelectedAdopt(adopt);
    setMonsterName(adopt.species1);
    setAdoptionSuccess(false);
    setAdoptionError('');
    setShowAdoptModal(true);
  };

  // Handle adopt submit
  const handleAdoptSubmit = async () => {
    if (!selectedTrainer) {
      setAdoptionError('Please select a trainer');
      return;
    }

    if (!monsterName.trim()) {
      setAdoptionError('Please enter a name for your new monster');
      return;
    }

    try {
      setAdoptionLoading(true);
      setAdoptionError('');

      // Find the selected trainer to get the Discord user ID
      const selectedTrainerObj = userTrainers.find(trainer => trainer.id.toString() === selectedTrainer.toString());
      const discordUserId = selectedTrainerObj?.discord_user_id || currentUserId;

      console.log('Adopting with Discord user ID:', discordUserId);
      console.log('Selected trainer:', selectedTrainerObj);
      console.log('Current user ID:', currentUserId);

      const response = await adoptionService.claimAdopt(
        selectedAdopt.id,
        selectedTrainer, // selectedTrainer is already a number from TrainerSelector
        monsterName,
        discordUserId
      );

      if (response.success) {
        setAdoptionSuccess(true);
        setAdoptedMonster(response.monster || null);

        // Fetch available berries and pastries for the selected trainer
        await fetchAvailableBerries(selectedTrainer);
        await fetchAvailablePastries(selectedTrainer);

        fetchData();
        fetchUserTrainers(currentUserId);
      } else {
        setAdoptionError(response.message || 'Failed to adopt monster');
      }
    } catch (err) {
      console.error('Error adopting monster:', err);
      setAdoptionError(err.response?.data?.message || 'Failed to adopt monster. Please try again.');
    } finally {
      setAdoptionLoading(false);
    }
  };

  // Close adopt modal
  const closeAdoptModal = () => {
    setShowAdoptModal(false);
    setSelectedAdopt(null);
    setMonsterName('');
    setAdoptionSuccess(false);
    setAdoptionError('');
    setAdoptedMonster(null);
  };

  // Open berry modal
  const openBerryModal = () => {
    if (!adoptedMonster) return;
    setShowBerryModal(true);
    setSelectedBerry('');
    setBerryError('');
  };

  // Close berry modal
  const closeBerryModal = () => {
    setShowBerryModal(false);
    setSelectedBerry('');
    setBerryError('');
  };

  // Open pastry modal
  const openPastryModal = () => {
    if (!adoptedMonster) return;
    setShowPastryModal(true);
    setSelectedPastry('');
    setPastryError('');
  };

  // Close pastry modal
  const closePastryModal = () => {
    setShowPastryModal(false);
    setSelectedPastry('');
    setPastryError('');
  };

  // Handle using a berry
  const handleUseBerry = async () => {
    if (!selectedBerry || !adoptedMonster) {
      setBerryError('Please select a berry to use.');
      return;
    }

    try {
      setBerryLoading(true);
      setBerryError('');

      const response = await adoptionService.useBerry(
        adoptedMonster.id,
        selectedBerry,
        parseInt(selectedTrainer)
      );

      if (response.success && response.monster) {
        setAdoptedMonster(response.monster);
        closeBerryModal();
      } else {
        setBerryError(response.message || 'Failed to apply berry.');
      }
    } catch (error) {
      console.error('Error using berry:', error);
      setBerryError('An error occurred while applying the berry.');
    } finally {
      setBerryLoading(false);
    }
  };

  // Handle using a pastry
  const handleUsePastry = async () => {
    if (!selectedPastry || !adoptedMonster) {
      setPastryError('Please select a pastry to use.');
      return;
    }

    try {
      setPastryLoading(true);
      setPastryError('');

      const response = await adoptionService.usePastry(
        adoptedMonster.id,
        selectedPastry,
        parseInt(selectedTrainer)
      );

      if (response.success && response.monster) {
        setAdoptedMonster(response.monster);
        closePastryModal();
      } else {
        setPastryError(response.message || 'Failed to apply pastry.');
      }
    } catch (error) {
      console.error('Error using pastry:', error);
      setPastryError('An error occurred while applying the pastry.');
    } finally {
      setPastryLoading(false);
    }
  };

  // Get month name
  const getMonthName = (month) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
  };

  // Render loading state
  if (loading && !showAdoptModal) {
    return <LoadingSpinner message="Loading adoption center..." />;
  }

  // Render error state
  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="adoption-center-container">
      <div className="adoption-center-controls">
        <div className="view-options">
          <button
            className={`view-option-button ${showCurrentMonthOnly ? 'active' : ''}`}
            onClick={() => handleViewOptionChange(true)}
          >
            Current Month
          </button>
          <button
            className={`view-option-button ${!showCurrentMonthOnly ? 'active' : ''}`}
            onClick={() => handleViewOptionChange(false)}
          >
            All Months
          </button>
        </div>

        {!showCurrentMonthOnly && monthsWithData.length > 0 && (
          <div className="month-selector">
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={handleMonthChange}
            >
              {monthsWithData.map((data) => (
                <option key={`${data.year}-${data.month}`} value={`${data.year}-${data.month}`}>
                  {getMonthName(data.month)} {data.year}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {adopts.length === 0 ? (
        <div className="no-adopts-message">
          <p>No monsters available for adoption at this time.</p>
        </div>
      ) : (
        <>
          <div className="adopts-grid">
            {adopts.map((adopt) => (
              <div
                key={adopt.id}
                className="adopt-card"
                onClick={() => handleAdoptClick(adopt)}
              >
                <div className="adopt-species">
                  <h3>{adopt.species1}</h3>
                  {adopt.species2 && <h4>+ {adopt.species2}</h4>}
                  {adopt.species3 && <h4>+ {adopt.species3}</h4>}
                </div>

                <div className="adopt-types">
                  <TypeBadge type={adopt.type1} />
                  {adopt.type2 && <TypeBadge type={adopt.type2} />}
                  {adopt.type3 && <TypeBadge type={adopt.type3} />}
                  {adopt.type4 && <TypeBadge type={adopt.type4} />}
                  {adopt.type5 && <TypeBadge type={adopt.type5} />}
                </div>

                {adopt.attribute && (
                  <div className="adopt-attribute">
                    <AttributeBadge attribute={adopt.attribute} />
                  </div>
                )}

                <div className="adopt-action">
                  <button className="adopt-button">
                    Adopt
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Adoption Modal */}
      <Modal
        isOpen={showAdoptModal}
        onClose={closeAdoptModal}
        title={adoptionSuccess ? "Adoption Successful!" : "Adopt Monster"}
      >
        {adoptionSuccess ? (
          <div className="adoption-success">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <p>
              Congratulations! You have successfully adopted {monsterName}.
              Take good care of your new monster!
            </p>

            {adoptedMonster && (
              <div className="adoption-actions">
                <button
                  className="berry-button"
                  onClick={openBerryModal}
                  disabled={Object.keys(availableBerries).length === 0}
                >
                  <i className="fas fa-apple-alt"></i> Use Berries
                </button>

                <button
                  className="pastry-button"
                  onClick={openPastryModal}
                  disabled={Object.keys(availablePastries).length === 0}
                >
                  <i className="fas fa-cookie"></i> Use Pastries
                </button>
              </div>
            )}

            <button
              className="modal-button primary"
              onClick={closeAdoptModal}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="adoption-form">
            {selectedAdopt && (
              <>
                <div className="adopt-details">
                  <h3>Monster Details</h3>
                  <div className="adopt-species-details">
                    <p><strong>Species:</strong> {selectedAdopt.species1}</p>
                    {selectedAdopt.species2 && <p><strong>+ Species:</strong> {selectedAdopt.species2}</p>}
                    {selectedAdopt.species3 && <p><strong>+ Species:</strong> {selectedAdopt.species3}</p>}
                  </div>

                  <div className="adopt-types-details">
                    <p><strong>Types:</strong></p>
                    <div className="types-list">
                      <TypeBadge type={selectedAdopt.type1} />
                      {selectedAdopt.type2 && <TypeBadge type={selectedAdopt.type2} />}
                      {selectedAdopt.type3 && <TypeBadge type={selectedAdopt.type3} />}
                      {selectedAdopt.type4 && <TypeBadge type={selectedAdopt.type4} />}
                      {selectedAdopt.type5 && <TypeBadge type={selectedAdopt.type5} />}
                    </div>
                  </div>

                  {selectedAdopt.attribute && (
                    <div className="adopt-attribute-details">
                      <p><strong>Attribute:</strong></p>
                      <AttributeBadge attribute={selectedAdopt.attribute} />
                    </div>
                  )}
                </div>

                <div className="adoption-inputs">
                  <div className="form-group">
                    <label htmlFor="monster-name">Monster Name:</label>
                    <input
                      type="text"
                      id="monster-name"
                      value={monsterName}
                      onChange={(e) => setMonsterName(e.target.value)}
                      placeholder="Enter a name for your new monster"
                    />
                  </div>

                  <div className="form-group">
                    <TrainerSelector
                      selectedTrainerId={selectedTrainer}
                      onChange={setSelectedTrainer}
                      trainers={userTrainers.map(trainer => ({
                        ...trainer,
                        disabled: !trainerDaypasses[trainer.id]?.hasDaypass,
                        name: `${trainer.name} (${trainerDaypasses[trainer.id]?.hasDaypass
                          ? `${trainerDaypasses[trainer.id]?.daypassCount} Daypass(es)`
                          : 'No Daypasses'})`
                      }))}
                    />
                  </div>

                  {adoptionError && (
                    <div className="adoption-error">
                      {adoptionError}
                    </div>
                  )}

                  <div className="adoption-actions">
                    <button
                      className="modal-button secondary"
                      onClick={closeAdoptModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="modal-button primary"
                      onClick={handleAdoptSubmit}
                      disabled={adoptionLoading || !selectedTrainer || !monsterName.trim()}
                    >
                      {adoptionLoading ? 'Adopting...' : 'Adopt Monster'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Berry Modal */}
      <Modal
        isOpen={showBerryModal}
        onClose={closeBerryModal}
        title="Use Berries"
      >
        <div className="berry-modal-content">
          <p>Select a berry to use on your monster:</p>

          <div className="berry-list">
            <div className="berry-category">
              <h4>Species Modification</h4>
              <div className="berry-items">
                {Object.keys(availableBerries).map(berry => (
                  <button
                    key={berry}
                    className={`berry-item ${selectedBerry === berry ? 'selected' : ''}`}
                    onClick={() => setSelectedBerry(berry)}
                  >
                    <span className="berry-name">{berry}</span>
                    <span className="berry-count">x{availableBerries[berry]}</span>
                  </button>
                ))}

                {Object.keys(availableBerries).length === 0 && (
                  <p className="no-items-message">No berries available</p>
                )}
              </div>
            </div>
          </div>

          {berryError && (
            <div className="berry-error">
              {berryError}
            </div>
          )}

          <div className="berry-actions">
            <button
              className="modal-button secondary"
              onClick={closeBerryModal}
            >
              Cancel
            </button>
            <button
              className="modal-button primary"
              onClick={handleUseBerry}
              disabled={berryLoading || !selectedBerry}
            >
              {berryLoading ? 'Applying...' : 'Use Berry'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Pastry Modal */}
      <Modal
        isOpen={showPastryModal}
        onClose={closePastryModal}
        title="Use Pastries"
      >
        <div className="pastry-modal-content">
          <p>Select a pastry to use on your monster:</p>

          <div className="pastry-list">
            <div className="pastry-category">
              <h4>Species Modification</h4>
              <div className="pastry-items">
                {Object.keys(availablePastries).map(pastry => (
                  <button
                    key={pastry}
                    className={`pastry-item ${selectedPastry === pastry ? 'selected' : ''}`}
                    onClick={() => setSelectedPastry(pastry)}
                  >
                    <span className="pastry-name">{pastry}</span>
                    <span className="pastry-count">x{availablePastries[pastry]}</span>
                  </button>
                ))}

                {Object.keys(availablePastries).length === 0 && (
                  <p className="no-items-message">No pastries available</p>
                )}
              </div>
            </div>
          </div>

          {pastryError && (
            <div className="pastry-error">
              {pastryError}
            </div>
          )}

          <div className="pastry-actions">
            <button
              className="modal-button secondary"
              onClick={closePastryModal}
            >
              Cancel
            </button>
            <button
              className="modal-button primary"
              onClick={handleUsePastry}
              disabled={pastryLoading || !selectedPastry}
            >
              {pastryLoading ? 'Applying...' : 'Use Pastry'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdoptionCenter;
