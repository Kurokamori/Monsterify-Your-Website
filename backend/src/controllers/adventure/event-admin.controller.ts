import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { EventService } from '../../services/event.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eventService = new EventService();
const EVENTS_BASE = path.resolve(__dirname, '..', '..', '..', '..', 'website', 'public', 'content', 'events');

const VALID_CATEGORIES = ['current', 'upcoming', 'past'];

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
    const allEvents = eventService.getAllEvents();
    const categorized = eventService.categorizeEventsByDate(allEvents);

    const mapEvent = (event: ReturnType<typeof eventService.getAllEvents>[0], category: string) => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      description: event.description,
      imageUrl: event.imageUrl,
      category,
      filePath: event.filePath,
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
      summary: eventService.getEventsSummary(),
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
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }

    const allEvents = eventService.getAllEvents();
    const event = allEvents.find(e => e.id === eventId);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Determine which folder the event is in
    const relativePath = path.relative(EVENTS_BASE, event.filePath);
    const category = relativePath.split(path.sep)[0] ?? 'current';

    res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        startDate: event.startDate.toISOString().split('T')[0],
        endDate: event.endDate.toISOString().split('T')[0],
        description: event.description,
        imageUrl: event.imageUrl,
        category,
        content: event.content,
        isMultiPart: event.isMultiPart,
        parts: event.parts ?? [],
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
    const { title, startDate, endDate, content, category, fileName, isMultiPart } = req.body;

    if (!title || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Title, start date, and end date are required' });
      return;
    }

    if (!isMultiPart && !content) {
      res.status(400).json({ success: false, message: 'Content is required for single-part events' });
      return;
    }

    const targetCategory = VALID_CATEGORIES.includes(category) ? category : 'upcoming';
    const safeName = fileName ? sanitizeFileName(fileName) : sanitizeFileName(title);

    if (!safeName) {
      res.status(400).json({ success: false, message: 'Invalid file name' });
      return;
    }

    const dirPath = path.join(EVENTS_BASE, targetCategory);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (isMultiPart) {
      // Create directory structure for multi-part event
      const eventDirPath = path.join(dirPath, safeName);
      if (fs.existsSync(eventDirPath)) {
        res.status(409).json({ success: false, message: 'An event with this name already exists' });
        return;
      }

      fs.mkdirSync(eventDirPath, { recursive: true });

      // Create overview.md
      const overviewContent = `# ${title}\n${startDate} to ${endDate}\n\n${content ?? ''}`;
      fs.writeFileSync(path.join(eventDirPath, 'overview.md'), overviewContent, 'utf8');
    } else {
      // Single-part event (regular .md file)
      const filePath = path.join(dirPath, `${safeName}.md`);
      if (fs.existsSync(filePath)) {
        res.status(409).json({ success: false, message: 'An event with this file name already exists' });
        return;
      }

      const fullContent = `# ${title}\n${startDate} to ${endDate}\n\n${content}`;
      fs.writeFileSync(filePath, fullContent, 'utf8');
    }

    eventService.clearCache();

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
    const { title, startDate, endDate, content, category } = req.body;

    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }

    // Find the existing event
    const allEvents = eventService.getAllEvents();
    const event = allEvents.find(e => e.id === eventId);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const currentRelPath = path.relative(EVENTS_BASE, event.filePath);
    const currentCategory = currentRelPath.split(path.sep)[0];
    const targetCategory = category && VALID_CATEGORIES.includes(category) ? category : currentCategory;

    if (event.isMultiPart) {
      // Update overview.md for multi-part event
      const overviewContent = `# ${title ?? event.title}\n${startDate ?? event.startDate.toISOString().split('T')[0]} to ${endDate ?? event.endDate.toISOString().split('T')[0]}\n\n${content !== undefined ? content : event.content.split('\n').slice(3).join('\n')}`;

      if (targetCategory !== currentCategory) {
        // Move entire directory
        const newDirPath = path.join(EVENTS_BASE, targetCategory, eventId);
        if (!fs.existsSync(path.join(EVENTS_BASE, targetCategory))) {
          fs.mkdirSync(path.join(EVENTS_BASE, targetCategory), { recursive: true });
        }
        fs.renameSync(event.filePath, newDirPath);
        fs.writeFileSync(path.join(newDirPath, 'overview.md'), overviewContent, 'utf8');
      } else {
        fs.writeFileSync(path.join(event.filePath, 'overview.md'), overviewContent, 'utf8');
      }
    } else {
      // Single-part event update
      const fullContent = `# ${title ?? event.title}\n${startDate ?? event.startDate.toISOString().split('T')[0]} to ${endDate ?? event.endDate.toISOString().split('T')[0]}\n\n${content !== undefined ? content : event.content.split('\n').slice(3).join('\n')}`;

      if (targetCategory !== currentCategory) {
        const newDirPath = path.join(EVENTS_BASE, targetCategory);
        if (!fs.existsSync(newDirPath)) {
          fs.mkdirSync(newDirPath, { recursive: true });
        }
        const newFilePath = path.join(newDirPath, `${eventId}.md`);
        fs.writeFileSync(newFilePath, fullContent, 'utf8');
        fs.unlinkSync(event.filePath);
      } else {
        fs.writeFileSync(event.filePath, fullContent, 'utf8');
      }
    }

    eventService.clearCache();

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
    const { eventId } = req.params;

    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }

    const allEvents = eventService.getAllEvents();
    const event = allEvents.find(e => e.id === eventId);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    if (event.isMultiPart) {
      // Remove entire directory
      fs.rmSync(event.filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(event.filePath);
    }

    eventService.clearCache();

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
    const { eventId } = req.params;
    const { title, content } = req.body;

    if (!eventId) {
      res.status(400).json({ success: false, message: 'Event ID is required' });
      return;
    }
    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required' });
      return;
    }

    const allEvents = eventService.getAllEvents();
    const event = allEvents.find(e => e.id === eventId);

    if (!event?.isMultiPart) {
      res.status(404).json({ success: false, message: 'Multi-part event not found' });
      return;
    }

    // Determine next part number
    const existingParts = event.parts ?? [];
    const maxOrder = existingParts.reduce((max, p) => {
      const num = parseInt(p.id.replace('part-', ''));
      return num > max ? num : max;
    }, 0);
    const nextNum = maxOrder + 1;
    const partId = `part-${nextNum}`;

    const partContent = `# ${title}\n\n${content}`;
    fs.writeFileSync(path.join(event.filePath, `${partId}.md`), partContent, 'utf8');

    eventService.clearCache();

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
    const { eventId, partId } = req.params;
    const { title, content } = req.body;

    if (!eventId || !partId) {
      res.status(400).json({ success: false, message: 'Event ID and Part ID are required' });
      return;
    }

    const allEvents = eventService.getAllEvents();
    const event = allEvents.find(e => e.id === eventId);

    if (!event?.isMultiPart) {
      res.status(404).json({ success: false, message: 'Multi-part event not found' });
      return;
    }

    const partPath = path.join(event.filePath, `${partId}.md`);
    if (!fs.existsSync(partPath)) {
      res.status(404).json({ success: false, message: 'Part not found' });
      return;
    }

    const partContent = `# ${title}\n\n${content}`;
    fs.writeFileSync(partPath, partContent, 'utf8');

    eventService.clearCache();

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
    const { eventId, partId } = req.params;

    if (!eventId || !partId) {
      res.status(400).json({ success: false, message: 'Event ID and Part ID are required' });
      return;
    }

    const allEvents = eventService.getAllEvents();
    const event = allEvents.find(e => e.id === eventId);

    if (!event?.isMultiPart) {
      res.status(404).json({ success: false, message: 'Multi-part event not found' });
      return;
    }

    const partPath = path.join(event.filePath, `${partId}.md`);
    if (!fs.existsSync(partPath)) {
      res.status(404).json({ success: false, message: 'Part not found' });
      return;
    }

    fs.unlinkSync(partPath);
    eventService.clearCache();

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
 * Upload an image for an event (returns a URL to embed in markdown)
 */
export async function uploadEventImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    // Save to a public directory accessible from the frontend
    const uploadsDir = path.resolve(EVENTS_BASE, '..', '..', 'uploads', 'events');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname);
    const fileName = `event-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    const destPath = path.join(uploadsDir, fileName);

    fs.copyFileSync(req.file.path, destPath);
    // Clean up temp upload
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const imageUrl = `/uploads/events/${fileName}`;

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
