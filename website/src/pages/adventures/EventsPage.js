import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import eventsService from '../../services/eventsService';


const EventsPage = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="/adventures/event/current" replace />} />
      <Route path="current" element={<EventsList category="current" />} />
      <Route path="past" element={<EventsList category="past" />} />
      <Route path="upcoming" element={<EventsList category="upcoming" />} />
      <Route path=":eventId" element={<EventDetail />} />
    </Routes>
  );
};

// Event Card Component
const EventCard = ({ event }) => {
  return (
    <div className="event-card">
      <div className="event-image-container">
        <img
          src={event.imageUrl || '/images/default_event.png'}
          alt={event.title}
          className="event-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/default_event.png';
          }}
        />
      </div>
      <div className="event-info">
        <h3 className="event-title">{event.title}</h3>
        <div className="event-details">
          <span className="event-date">
            <i className="fas fa-calendar-alt"></i> 
            {event.formattedStartDate} - {event.formattedEndDate}
          </span>
        </div>
        <p className="event-description">{event.description}</p>
        <Link to={`/adventures/event/${event.id}`} className="event-button">
          View Event
        </Link>
      </div>
    </div>
  );
};

// Events List Component - handles all categories
const EventsList = ({ category }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      switch (category) {
        case 'current':
          response = await eventsService.getCurrentEvents();
          break;
        case 'upcoming':
          response = await eventsService.getUpcomingEvents();
          break;
        case 'past':
          response = await eventsService.getPastEvents();
          break;
        default:
          throw new Error('Invalid category');
      }

      setEvents(response.events || []);

    } catch (err) {
      console.error(`Error fetching ${category} events:`, err);
      setError(`Failed to load ${category} events. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'current': return 'Current Events';
      case 'upcoming': return 'Upcoming Events';
      case 'past': return 'Past Events';
      default: return 'Events';
    }
  };

  const getEmptyMessage = () => {
    switch (category) {
      case 'current': return 'No current events found. Check back later for new events!';
      case 'upcoming': return 'No upcoming events scheduled. Stay tuned for announcements!';
      case 'past': return 'No past events to display. Events will appear here after they conclude.';
      default: return 'No events found.';
    }
  };

  if (loading) {
    return <LoadingSpinner message={`Loading ${category} events...`} />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchEvents}
      />
    );
  }

  return (
    <div className="events-page">
      <div className="events-nav">
        <Link 
          to="/adventures/event/current" 
          className={`events-nav-link ${category === 'current' ? 'active' : ''}`}
        >
          Current Events
        </Link>
        <Link 
          to="/adventures/event/upcoming" 
          className={`events-nav-link ${category === 'upcoming' ? 'active' : ''}`}
        >
          Upcoming Events
        </Link>
        <Link 
          to="/adventures/event/past" 
          className={`events-nav-link ${category === 'past' ? 'active' : ''}`}
        >
          Past Events
        </Link>
      </div>

      <div className="events-header">
        <h2>{getCategoryTitle()}</h2>
        {events.length > 0 && (
          <p className="events-count">{events.length} event{events.length !== 1 ? 's' : ''} found</p>
        )}
      </div>

      <div className="events-list">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

        {events.length === 0 && (
          <div className="no-events">
            <i className="fas fa-calendar-times"></i>
            <p>{getEmptyMessage()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Event Detail Component
const EventDetail = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventDetails();
    fetchAllEvents();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await eventsService.getEventContent(eventId);
      setEvent(response);

    } catch (err) {
      console.error(`Error fetching event ${eventId}:`, err);
      setError('Failed to load event details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      // Fetch all events for navigation
      const [currentRes, upcomingRes, pastRes] = await Promise.all([
        eventsService.getCurrentEvents(),
        eventsService.getUpcomingEvents(),
        eventsService.getPastEvents()
      ]);

      const allEventsData = [
        ...(currentRes.events || []),
        ...(upcomingRes.events || []),
        ...(pastRes.events || [])
      ];

      setAllEvents(allEventsData);
    } catch (err) {
      console.error('Error fetching all events for navigation:', err);
    }
  };

  const getCurrentEventIndex = () => {
    return allEvents.findIndex(e => e.id === eventId);
  };

  const navigateToEvent = (direction) => {
    const currentIndex = getCurrentEventIndex();
    let newIndex;

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allEvents.length - 1;
    } else {
      newIndex = currentIndex < allEvents.length - 1 ? currentIndex + 1 : 0;
    }

    const newEvent = allEvents[newIndex];
    if (newEvent) {
      navigate(`/adventures/event/${newEvent.id}`);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading event details..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchEventDetails}
      />
    );
  }

  if (!event) {
    return (
      <div className="event-detail-page">
        <div className="no-events">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Event not found.</p>
          <Link to="/adventures/event/current" className="event-button">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail-page">
      <div className="event-detail-nav">
        <button 
          onClick={() => navigate('/adventures/event/current')}
          className="button button-secondary"
        >
          <i className="fas fa-arrow-left"></i> Back to Events
        </button>
        
        {allEvents.length > 1 && (
          <div className="event-navigation">
            <button 
              onClick={() => navigateToEvent('prev')}
              className="nav-button"
              title="Previous Event"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className="event-counter">
              {getCurrentEventIndex() + 1} of {allEvents.length}
            </span>
            <button 
              onClick={() => navigateToEvent('next')}
              className="nav-button"
              title="Next Event"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      <div className="event-detail-header">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="event-detail-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div className="event-detail-overlay">
          <h1 className="event-detail-title">{event.title}</h1>
          <div className="event-detail-meta">
            <span className="event-detail-date">
              <i className="fas fa-calendar-alt"></i> 
              {event.formattedStartDate} - {event.formattedEndDate}
            </span>
          </div>
        </div>
      </div>

      <div className="event-detail-content">
        <div 
          className="event-content-html"
          dangerouslySetInnerHTML={{ __html: event.content }}
        />
      </div>
    </div>
  );
};

export default EventsPage;
