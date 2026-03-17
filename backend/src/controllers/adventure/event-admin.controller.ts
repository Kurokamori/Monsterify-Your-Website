import { Request, Response } from 'express';
import { EventService } from '../../services/event.service';
import { EventRepository } from '../../repositories/event.repository';

const eventService = new EventService();
const repo = new EventRepository();

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ============================================================================
// Controllers
// ============================================================================

/**
 * List all events across all categories with full metadata
 */
export async function listAllEvents(_req: Request, res: Response): Promise<void> {
  try {
    const allEvents = await eventService.getAllEvents();
    const categorized = eventService.categorizeEventsByDate(allEvents);

    const mapEvent = (event: (typeof allEvents)[0], category: string) => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      description: event.description,
      imageUrl: event.imageUrl,
      category,
      isMultiPart: event.isMultiPart,
      partCount: event.parts?.length ?? 0,
    });

    res.json({
      success: true,
      events: {
        current: categorized.current.map(e => mapEvent(e, 'current')),
        upcoming: categorized.upcoming.map(e => mapEvent(e, 'upcoming')),
        past: categorized.past.map(e => mapEvent(e, 'past')),
      },
      summary: await eventService.getEventsSummary(),
    });
  } catch (error) {
    console.error('Error listing events:', error);
    res.status(500).json({ success: false, message: 'Failed to load events' });
  }
}

/**
 * Get a single event's raw content for editing
 */
export async function getEventForEdit(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }

    const eventWithParts = await repo.findByEventIdWithParts(eventId);
    if (!eventWithParts) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Determine category from dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(eventWithParts.startDate);
    const end = new Date(eventWithParts.endDate);
    const eventStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const eventEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    let category = 'current';
    if (eventEnd < today) {category = 'past';}
    else if (eventStart > today) {category = 'upcoming';}

    res.json({
      success: true,
      event: {
        id: eventWithParts.eventId,
        title: eventWithParts.title,
        startDate: eventWithParts.startDate instanceof Date
          ? eventWithParts.startDate.toISOString().split('T')[0]
          : String(eventWithParts.startDate),
        endDate: eventWithParts.endDate instanceof Date
          ? eventWithParts.endDate.toISOString().split('T')[0]
          : String(eventWithParts.endDate),
        description: eventWithParts.description,
        imageUrl: eventWithParts.imageUrl,
        category,
        content: eventWithParts.content,
        isMultiPart: eventWithParts.isMultiPart,
        parts: eventWithParts.parts.map(p => ({
          id: p.partId,
          title: p.title,
          content: p.content,
          order: p.sortOrder,
        })),
      },
    });
  } catch (error) {
    console.error('Error getting event for edit:', error);
    res.status(500).json({ success: false, message: 'Failed to load event' });
  }
}

/**
 * Create a new event
 */
export async function createEvent(req: Request, res: Response): Promise<void> {
  try {
    const { title, startDate, endDate, content, fileName, isMultiPart } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Title, start date, and end date are required' });
      return;
    }

    if (!isMultiPart && !content) {
      res.status(400).json({ success: false, message: 'Content is required for single-part events' });
      return;
    }

    const safeName = fileName ? sanitizeFileName(fileName) : sanitizeFileName(title);

    if (!safeName) {
      res.status(400).json({ success: false, message: 'Invalid file name' });
      return;
    }

    // Check for duplicate
    const existing = await repo.findByEventId(safeName);
    if (existing) {
      res.status(409).json({ success: false, message: 'An event with this name already exists' });
      return;
    }

    // Extract description from content (first non-empty, non-heading, non-image line)
    let description = '';
    if (content) {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('![')) {
          description = trimmed;
          break;
        }
      }
    }

    await repo.create({
      eventId: safeName,
      title,
      startDate,
      endDate,
      description,
      content: content ?? '',
      isMultiPart: isMultiPart ?? false,
    });

    res.json({
      success: true,
      message: 'Event created successfully',
      eventId: safeName,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
}

/**
 * Update an existing event
 */
export async function updateEvent(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const { title, startDate, endDate, content } = req.body;

    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }

    const event = await repo.findByEventId(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Extract description if content is updated
    let description: string | undefined;
    if (content !== undefined) {
      description = '';
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('![')) {
          description = trimmed;
          break;
        }
      }
    }

    await repo.update(event.id, {
      title,
      startDate,
      endDate,
      content,
      description,
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.eventId as string;

    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }

    const event = await repo.findByEventId(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    await repo.delete(event.id); // CASCADE deletes parts

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
}

/**
 * Add a part to a multi-part event
 */
export async function addPart(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const { title, content } = req.body;

    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }
    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required' });
      return;
    }

    const event = await repo.findByEventId(eventId);
    if (!event?.isMultiPart) {
      res.status(404).json({ success: false, message: 'Multi-part event not found' });
      return;
    }

    const maxOrder = await repo.getMaxPartOrder(event.id);
    const nextNum = maxOrder + 1;
    const partId = `part-${nextNum}`;

    await repo.createPart({
      eventId: event.id,
      partId,
      title,
      content,
      sortOrder: nextNum,
    });

    res.json({
      success: true,
      message: 'Part added successfully',
      partId,
    });
  } catch (error) {
    console.error('Error adding part:', error);
    res.status(500).json({ success: false, message: 'Failed to add part' });
  }
}

/**
 * Update a part of a multi-part event
 */
export async function updatePart(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const partId = req.params.partId as string;
    const { title, content } = req.body;

    if (!eventId || !partId) {
      res.status(400).json({ success: false, message: 'Event ID and Part ID are required' });
      return;
    }

    const event = await repo.findByEventId(eventId);
    if (!event?.isMultiPart) {
      res.status(404).json({ success: false, message: 'Multi-part event not found' });
      return;
    }

    const part = await repo.getPartByPartId(event.id, partId);
    if (!part) {
      res.status(404).json({ success: false, message: 'Part not found' });
      return;
    }

    await repo.updatePart(part.id, { title, content });

    res.json({
      success: true,
      message: 'Part updated successfully',
    });
  } catch (error) {
    console.error('Error updating part:', error);
    res.status(500).json({ success: false, message: 'Failed to update part' });
  }
}

/**
 * Delete a part from a multi-part event
 */
export async function deletePart(req: Request, res: Response): Promise<void> {
  try {
    const eventId = req.params.eventId as string;
    const partId = req.params.partId as string;

    if (!eventId || !partId) {
      res.status(400).json({ success: false, message: 'Event ID and Part ID are required' });
      return;
    }

    const event = await repo.findByEventId(eventId);
    if (!event?.isMultiPart) {
      res.status(404).json({ success: false, message: 'Multi-part event not found' });
      return;
    }

    const part = await repo.getPartByPartId(event.id, partId);
    if (!part) {
      res.status(404).json({ success: false, message: 'Part not found' });
      return;
    }

    await repo.deletePart(part.id);

    res.json({
      success: true,
      message: 'Part deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting part:', error);
    res.status(500).json({ success: false, message: 'Failed to delete part' });
  }
}

/**
 * Upload an image for an event (uses existing upload middleware, returns URL)
 */
export async function uploadEventImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    // The upload middleware has already saved the file; use its path
    const imageUrl = `/uploads/events/${req.file.filename ?? req.file.originalname}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Error uploading event image:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
}
