import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import adventureService from '../../services/adventureService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const AdventureList = ({ 
  status = 'active', 
  limit = 10, 
  showFilters = true,
  showPagination = true,
  trainerId = null,
  onAdventureSelected = null
}) => {
  const { currentUser } = useAuth();
  
  // State
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState(status);
  const [sortBy, setSortBy] = useState('newest');
  
  // Fetch adventures
  useEffect(() => {
    fetchAdventures();
  }, [page, statusFilter, sortBy, trainerId]);
  
  const fetchAdventures = async () => {
    try {
      setLoading(true);
      
      const params = {
        status: statusFilter,
        page,
        limit,
        sort: sortBy
      };
      
      let response;
      
      if (trainerId) {
        // Fetch adventures for a specific trainer
        response = await adventureService.getTrainerAdventures(trainerId, params);
      } else {
        // Fetch all adventures
        response = await adventureService.getAllAdventures(params);
      }
      
      setAdventures(response.adventures || []);
      setTotalPages(response.totalPages || 1);
      
    } catch (err) {
      console.error('Error fetching adventures:', err);
      setError('Failed to load adventures. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    setPage(1);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calculate time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval === 1 ? '1 year ago' : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval === 1 ? '1 month ago' : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? '1 day ago' : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
    }
    
    return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
  };
  
  // Handle adventure click
  const handleAdventureClick = (adventure) => {
    if (onAdventureSelected) {
      onAdventureSelected(adventure);
    }
  };
  
  // Render loading state
  if (loading && page === 1) {
    return <LoadingSpinner message="Loading adventures..." />;
  }
  
  // Render error state
  if (error && adventures.length === 0) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchAdventures}
      />
    );
  }
  
  // Fallback data for development
  const fallbackAdventures = [
    {
      id: 1,
      title: 'The Lost Temple',
      description: 'Explore the ancient temple hidden deep in the jungle to discover its secrets.',
      status: 'active',
      creator: {
        id: 1,
        name: 'Ash Ketchum'
      },
      max_encounters: 5,
      current_encounter_count: 2,
      is_custom: false,
      created_at: '2023-06-01T00:00:00Z',
      updated_at: '2023-06-15T00:00:00Z',
      participants_count: 3,
      encounters: [
        {
          id: 1,
          title: 'Entrance Guardian',
          description: 'A massive stone guardian blocks the entrance to the temple.'
        },
        {
          id: 2,
          title: 'Puzzle Chamber',
          description: 'A chamber filled with ancient puzzles that must be solved to proceed.'
        }
      ]
    },
    {
      id: 2,
      title: 'Mountain Expedition',
      description: 'Climb the treacherous mountain to find the legendary ice crystal.',
      status: 'active',
      creator: {
        id: 2,
        name: 'Misty'
      },
      max_encounters: 4,
      current_encounter_count: 1,
      is_custom: true,
      created_at: '2023-06-10T00:00:00Z',
      updated_at: '2023-06-12T00:00:00Z',
      participants_count: 2,
      encounters: [
        {
          id: 3,
          title: 'Base Camp',
          description: 'Establish a base camp at the foot of the mountain.'
        }
      ]
    },
    {
      id: 3,
      title: 'Underwater Ruins',
      description: 'Dive into the depths to explore the ruins of an ancient civilization.',
      status: 'completed',
      creator: {
        id: 1,
        name: 'Ash Ketchum'
      },
      max_encounters: 3,
      current_encounter_count: 3,
      is_custom: false,
      created_at: '2023-05-15T00:00:00Z',
      updated_at: '2023-05-30T00:00:00Z',
      completed_at: '2023-05-30T00:00:00Z',
      participants_count: 4,
      encounters: [
        {
          id: 4,
          title: 'Entrance Cavern',
          description: 'Find the underwater cavern that leads to the ruins.'
        },
        {
          id: 5,
          title: 'Main Hall',
          description: 'Explore the grand hall of the underwater palace.'
        },
        {
          id: 6,
          title: 'Treasure Chamber',
          description: 'Discover the hidden treasure chamber and its secrets.'
        }
      ]
    }
  ];
  
  const displayAdventures = adventures.length > 0 ? adventures : fallbackAdventures;
  
  return (
    <div className="form">
      {/* Filters */}
      {showFilters && (
        <div className="adventure-filters">
          <div className="set-item">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Adventures</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="set-item">
            <label htmlFor="sort-by">Sort By:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_participants">Most Participants</option>
              <option value="most_encounters">Most Encounters</option>
            </select>
          </div>
          
          <div className="filter-actions">
            <button 
              className="button filter apply"
              onClick={applyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Adventures List */}
      {displayAdventures.length === 0 ? (
        <div className="no-adventures">
          <p>No adventures found. Try different filters or create a new adventure!</p>
        </div>
      ) : (
        <div className="adventures-grid">
          {displayAdventures.map(adventure => (
            <div 
              key={adventure.id} 
              className={`gallery-item${adventure.status}`}
              onClick={() => handleAdventureClick(adventure)}
            >
              <Link to={`/adventures/${adventure.id}`} className="adventure-link">
                <div className="adventure-header">
                  <h3 className="adventure-title">{adventure.title}</h3>
                  <div className={`adventure-status${adventure.status}`}>
                    {adventure.status.charAt(0).toUpperCase() + adventure.status.slice(1)}
                  </div>
                </div>
                
                <p className="adventure-description">{adventure.description}</p>
                
                <div className="adventure-meta">
                  <div className="nav-left">
                    <span className="meta-label">Creator:</span>
                    <span className="meta-value">{adventure.creator?.name || 'Unknown'}</span>
                  </div>
                  
                  <div className="nav-left">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value" title={formatDate(adventure.created_at)}>
                      {timeAgo(adventure.created_at)}
                    </span>
                  </div>
                </div>
              
                
                
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="type-tags">
          <button
            className="button secondary"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          
          <div className="pagination-info">
            Page {page} of {totalPages}
          </div>
          
          <button
            className="button secondary"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdventureList;
