import { Request, Response } from 'express';
import { EventService } from '../../services/event.service';

const eventService = new EventService();

// ============================================================================
// Controllers
// ============================================================================

export async function getEventCategories(_req: Request, res: Response): Promise<void> {
  try {
    const allEvents = eventService.getAllEvents();
    const categorized = eventService.categorizeEventsByDate(allEvents);

    res.json({
      current: {
        name: 'Current Events',
        count: categorized.current.length,
        events: categorized.current,
      },
      upcoming: {
        name: 'Upcoming Events',
        count: categorized.upcoming.length,
        events: categorized.upcoming,
      },
      past: {
        name: 'Past Events',
        count: categorized.past.length,
        events: categorized.past,
      },
    });
  } catch (error) {
    console.error('Error getting event categories:', error);
    res.status(500).json({ error: 'Failed to load event categories' });
  }
}

export async function getEventContent(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const event = eventService.getEventById(eventId);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      formattedStartDate: event.formattedStartDate,
      formattedEndDate: event.formattedEndDate,
      imageUrl: event.imageUrl,
      content: event.html,
      raw: event.content,
      isMultiPart: event.isMultiPart,
      parts: event.parts?.map(p => ({
        id: p.id,
        title: p.title,
        content: p.html,
        order: p.order,
      })),
    });
  } catch (error) {
    console.error('Error getting event content:', error);
    res.status(500).json({ error: 'Failed to load event content' });
  }
}

export async function getCurrentEvents(_req: Request, res: Response): Promise<void> {
  try {
    const events = eventService.getEventsByCategory('current');

    res.json({
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        formattedStartDate: event.startDate.toLocaleDateString(),
        formattedEndDate: event.endDate.toLocaleDateString(),
        imageUrl: event.imageUrl,
        isMultiPart: event.isMultiPart,
        partCount: event.parts?.length ?? 0,
        type: 'event',
      })),
      category: 'current',
      count: events.length,
    });
  } catch (error) {
    console.error('Error getting current events:', error);
    res.status(500).json({ error: 'Failed to load current events' });
  }
}

export async function getPastEvents(_req: Request, res: Response): Promise<void> {
  try {
    const events = eventService.getEventsByCategory('past');

    res.json({
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        formattedStartDate: event.startDate.toLocaleDateString(),
        formattedEndDate: event.endDate.toLocaleDateString(),
        imageUrl: event.imageUrl,
        isMultiPart: event.isMultiPart,
        partCount: event.parts?.length ?? 0,
        type: 'event',
      })),
      category: 'past',
      count: events.length,
    });
  } catch (error) {
    console.error('Error getting past events:', error);
    res.status(500).json({ error: 'Failed to load past events' });
  }
}

export async function getUpcomingEvents(_req: Request, res: Response): Promise<void> {
  try {
    const events = eventService.getEventsByCategory('upcoming');

    res.json({
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        formattedStartDate: event.startDate.toLocaleDateString(),
        formattedEndDate: event.endDate.toLocaleDateString(),
        imageUrl: event.imageUrl,
        isMultiPart: event.isMultiPart,
        partCount: event.parts?.length ?? 0,
        type: 'event',
      })),
      category: 'upcoming',
      count: events.length,
    });
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ error: 'Failed to load upcoming events' });
  }
}
