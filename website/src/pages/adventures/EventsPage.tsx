import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../components/common/StateContainer';
import { TabContainer, Tab } from '../../components/common/TabContainer';
import eventsService, { GameEvent, EventPart } from '../../services/eventsService';
import '../../styles/adventures/events.css';

type EventCategory = 'current' | 'upcoming' | 'past';

// --- Event Card ---

const isLocalImage = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('/') || url.startsWith('./');
};

const EventCard = ({ event }: { event: GameEvent }) => {
  const imageUrl = event.imageUrl as string | null;
  const hasImage = isLocalImage(imageUrl);

  return (
    <div className="event-card">
      {hasImage && (
        <div className="event-card__image">
          <img
            src={imageUrl!}
            alt={event.title || 'Event'}
            onError={(e) => {
              ((e.target as HTMLImageElement).closest('.event-card__image') as HTMLElement | null)!.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="event-card__info">
        <h3 className="event-card__title">
          {event.title}
          {event.isMultiPart && (
            <span className="event-card__parts-badge">
              {event.partCount || 0} parts
            </span>
          )}
        </h3>
        <span className="event-card__date">
          <i className="fas fa-calendar-alt"></i>{' '}
          {event.formattedStartDate as string} - {event.formattedEndDate as string}
        </span>
        <p className="event-card__description">{event.description}</p>
        <Link to={`/adventures/events/${event.id}`} className="button primary">
          View Event
        </Link>
      </div>
    </div>
  );
};

// --- Events List ---

const EventsList = ({ category }: { category: EventCategory }) => {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response: GameEvent[];
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
      }

      // Handle response that may have events nested
      const eventData = Array.isArray(response)
        ? response
        : ((response as unknown as { events?: GameEvent[] }).events || []);
      setEvents(eventData);
    } catch (err) {
      console.error(`Error fetching ${category} events:`, err);
      setError(`Failed to load ${category} events. Please try again later.`);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const emptyMessages: Record<EventCategory, string> = {
    current: 'No current events found. Check back later for new events!',
    upcoming: 'No upcoming events scheduled. Stay tuned for announcements!',
    past: 'No past events to display. Events will appear here after they conclude.'
  };

  return (
    <AutoStateContainer
      loading={loading}
      error={error}
      data={events}
      onRetry={fetchEvents}
      emptyIcon="fas fa-calendar-times"
      emptyMessage={emptyMessages[category]}
    >
      <div className="events-grid">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </AutoStateContainer>
  );
};

// --- Part Navigation ---

const PartNavigation = ({
  parts,
  activePartId,
  onSelectPart,
}: {
  parts: EventPart[];
  activePartId: string | null;
  onSelectPart: (partId: string | null) => void;
}) => {
  return (
    <div className="event-parts-nav">
      <button
        className={`event-parts-nav__tab${activePartId === null ? ' event-parts-nav__tab--active' : ''}`}
        onClick={() => onSelectPart(null)}
      >
        Overview
      </button>
      {parts.map((part) => (
        <button
          key={part.id}
          className={`event-parts-nav__tab${activePartId === part.id ? ' event-parts-nav__tab--active' : ''}`}
          onClick={() => onSelectPart(part.id)}
        >
          {part.title}
        </button>
      ))}
    </div>
  );
};

// --- Event Detail ---

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  useDocumentTitle('Event Details');

  const [event, setEvent] = useState<GameEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePartId, setActivePartId] = useState<string | null>(null);

  const fetchEventDetails = useCallback(async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await eventsService.getEventContent(eventId);
      setEvent(response);
      setActivePartId(null);
    } catch (err) {
      console.error(`Error fetching event ${eventId}:`, err);
      setError('Failed to load event details. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const activePart = event?.parts?.find(p => p.id === activePartId) || null;
  const displayContent = activePartId && activePart
    ? activePart.content
    : (event?.content as string) || '';

  return (
    <AutoStateContainer
      loading={loading}
      error={error}
      isEmpty={!event}
      onRetry={fetchEventDetails}
      emptyIcon="fas fa-exclamation-triangle"
      emptyMessage="Event not found."
    >
      {event && (
        <div className="event-detail">
          <div className="event-detail__nav">
            <button
              onClick={() => navigate('/adventures/events')}
              className="button secondary"
            >
              <i className="fas fa-arrow-left"></i> Back to Events
            </button>
          </div>

          {isLocalImage(event.imageUrl as string) ? (
            <div className="event-detail__header">
              <img
                src={event.imageUrl as string}
                alt={event.title || 'Event'}
                className="event-detail__image"
                onError={(e) => {
                  const header = (e.target as HTMLImageElement).closest('.event-detail__header');
                  if (header) header.className = 'event-detail__header--no-image';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="event-detail__overlay">
                <h1 className="event-detail__title">{event.title}</h1>
                <span className="event-detail__date">
                  <i className="fas fa-calendar-alt"></i>{' '}
                  {event.formattedStartDate as string} - {event.formattedEndDate as string}
                </span>
              </div>
            </div>
          ) : (
            <div className="event-detail__header--no-image">
              <h1 className="event-detail__title">{event.title}</h1>
              <span className="event-detail__date">
                <i className="fas fa-calendar-alt"></i>{' '}
                {event.formattedStartDate as string} - {event.formattedEndDate as string}
              </span>
            </div>
          )}

          {event.isMultiPart && event.parts && event.parts.length > 0 && (
            <PartNavigation
              parts={event.parts as EventPart[]}
              activePartId={activePartId}
              onSelectPart={setActivePartId}
            />
          )}

          <div
            className="event-detail__content"
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />
        </div>
      )}
    </AutoStateContainer>
  );
};

// --- Events Page (Main) ---

const EventsPage = () => {
  useDocumentTitle('Events');
  const { eventId } = useParams<{ eventId: string }>();

  if (eventId) {
    return <EventDetail />;
  }

  const tabs: Tab[] = [
    {
      key: 'current',
      label: 'Current Events',
      icon: 'fas fa-star',
      content: <EventsList category="current" />
    },
    {
      key: 'upcoming',
      label: 'Upcoming Events',
      icon: 'fas fa-clock',
      content: <EventsList category="upcoming" />
    },
    {
      key: 'past',
      label: 'Past Events',
      icon: 'fas fa-history',
      content: <EventsList category="past" />
    }
  ];

  return (
    <div className="adventures-page">
      <div className="adventures-page__header">
        <h1>Events</h1>
        <p>Discover current and upcoming events in the world of Dusk and Dawn</p>
      </div>
      <TabContainer tabs={tabs} defaultTab="current" variant="underline" fullWidth />
    </div>
  );
};

export default EventsPage;
