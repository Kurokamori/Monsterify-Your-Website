const path = require('path');
const fs = require('fs');
const { getDirectoryStructure, loadMarkdownContent } = require('../utils/markdownUtils');
const eventService = require('../services/eventService');

// Base path for events content
const EVENTS_BASE_PATH = path.join(__dirname, '../../content/events');

/**
 * Get all event categories (current and past)
 */
const getEventCategories = (req, res) => {
  try {
    const categories = {
      current: {
        name: 'Current Events',
        path: 'current',
        structure: getDirectoryStructure(path.join(EVENTS_BASE_PATH, 'current'), '')
      },
      past: {
        name: 'Past Events',
        path: 'past',
        structure: getDirectoryStructure(path.join(EVENTS_BASE_PATH, 'past'), '')
      }
    };

    res.json(categories);
  } catch (error) {
    console.error('Error getting event categories:', error);
    res.status(500).json({ error: 'Failed to load event categories' });
  }
};

/**
 * Get event content by event ID
 */
const getEventContent = (req, res) => {
  try {
    const { eventId } = req.params;

    // Get the event by ID
    const event = eventService.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
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
      raw: event.content
    });

  } catch (error) {
    console.error('Error getting event content:', error);
    res.status(500).json({ error: 'Failed to load event content' });
  }
};

/**
 * Get current events list
 */
const getCurrentEvents = (req, res) => {
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
        type: 'event'
      })),
      category: 'current',
      count: events.length
    });

  } catch (error) {
    console.error('Error getting current events:', error);
    res.status(500).json({ error: 'Failed to load current events' });
  }
};

/**
 * Get past events list
 */
const getPastEvents = (req, res) => {
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
        type: 'event'
      })),
      category: 'past',
      count: events.length
    });

  } catch (error) {
    console.error('Error getting past events:', error);
    res.status(500).json({ error: 'Failed to load past events' });
  }
};

/**
 * Get upcoming events list
 */
const getUpcomingEvents = (req, res) => {
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
        type: 'event'
      })),
      category: 'upcoming',
      count: events.length
    });

  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ error: 'Failed to load upcoming events' });
  }
};

module.exports = {
  getEventCategories,
  getEventContent,
  getCurrentEvents,
  getPastEvents,
  getUpcomingEvents
};
