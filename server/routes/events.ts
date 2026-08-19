import { Router } from 'express';
import { db } from '../db/database.js';
import { EventsEvent, EventsParticipant } from '../db/types.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// List events with timeline filtering
router.get('/', (req, res) => {
  const { start_after, end_before, person_id, place_id, status } = req.query;

  let events = Array.from(db.events.values()).map((ev) => {
    const entity = db.entities.get(ev.id);
    const tags = db.getEntityTags(ev.id);
    const place = ev.place_id ? db.places.get(ev.place_id) : undefined;
    const participants = db.participants
      .filter((p) => p.event_id === ev.id)
      .map((p) => ({
        ...p,
        person: db.people.get(p.person_id),
      }));

    return {
      ...ev,
      entity,
      tags,
      place,
      participants,
      participants_count: participants.length,
    };
  });

  if (start_after) {
    events = events.filter((e) => e.start_time >= String(start_after));
  }
  if (end_before) {
    events = events.filter((e) => (e.end_time || e.start_time) <= String(end_before));
  }
  if (place_id) {
    events = events.filter((e) => e.place_id === place_id);
  }
  if (person_id) {
    events = events.filter((e) =>
      e.participants.some((p) => p.person_id === person_id)
    );
  }
  if (status) {
    events = events.filter((e) => e.status === status);
  }

  // Sort chronologically
  events.sort((a, b) => a.start_time.localeCompare(b.start_time));

  return res.json(events);
});

// Single Event Detail
router.get('/:id', (req, res) => {
  const ev = db.events.get(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found' });

  const entity = db.entities.get(ev.id);
  const tags = db.getEntityTags(ev.id);
  const place = ev.place_id ? db.places.get(ev.place_id) : undefined;
  const participants = db.participants
    .filter((p) => p.event_id === ev.id)
    .map((p) => ({
      ...p,
      person: db.people.get(p.person_id),
    }));
  const links = db.getEntityLinks(ev.id);

  return res.json({
    ...ev,
    entity,
    tags,
    place,
    participants,
    links,
  });
});

// Create Event
router.post('/', (req: AuthenticatedRequest, res) => {
  const {
    title,
    description,
    start_time,
    end_time,
    is_all_day,
    place_id,
    status,
    recurrence,
    participants,
    tags,
  } = req.body;

  if (!title || !start_time) {
    return res.status(400).json({ error: 'Title and Start Time are required' });
  }

  const id = 'event_' + Math.random().toString(36).substring(2, 9);
  const userId = req.userId || 'user_admin';

  // 1. Register into core.entities
  db.registerEntity(id, 'event', title, userId);

  // 2. Create in events.events
  const event: EventsEvent = {
    id,
    title,
    description,
    start_time,
    end_time,
    is_all_day: Boolean(is_all_day),
    place_id,
    status: status || 'planned',
    recurrence: recurrence || 'none',
  };
  db.events.set(id, event);

  // 3. Add participants
  if (Array.isArray(participants)) {
    for (const p of participants) {
      if (p.person_id) {
        db.participants.push({
          id: 'part_' + Math.random().toString(36).substring(2, 9),
          event_id: id,
          person_id: p.person_id,
          role: p.role || 'attendee',
          status: p.status || 'confirmed',
        });
      }
    }
  }

  // 4. Attach tags
  if (Array.isArray(tags)) {
    for (const tagId of tags) {
      db.addEntityTag(id, tagId);
    }
  }

  db.logAudit(userId, 'CREATE', `Created Event: ${title} on ${start_time}`, id, 'event');

  return res.json({
    ...event,
    entity: db.entities.get(id),
    tags: db.getEntityTags(id),
  });
});

// Update Event
router.put('/:id', (req: AuthenticatedRequest, res) => {
  const event = db.events.get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const userId = req.userId || 'user_admin';

  const {
    title,
    description,
    start_time,
    end_time,
    is_all_day,
    place_id,
    status,
    recurrence,
    tags,
  } = req.body;

  if (title) event.title = title;
  if (description !== undefined) event.description = description;
  if (start_time !== undefined) event.start_time = start_time;
  if (end_time !== undefined) event.end_time = end_time;
  if (is_all_day !== undefined) event.is_all_day = Boolean(is_all_day);
  if (place_id !== undefined) event.place_id = place_id;
  if (status) event.status = status;
  if (recurrence) event.recurrence = recurrence;

  db.registerEntity(event.id, 'event', event.title, userId);

  if (Array.isArray(tags)) {
    db.entityTags = db.entityTags.filter((et) => et.entity_id !== event.id);
    for (const tagId of tags) {
      db.addEntityTag(event.id, tagId);
    }
  }

  db.logAudit(userId, 'UPDATE', `Updated Event: ${event.title}`, event.id, 'event');

  return res.json({
    ...event,
    tags: db.getEntityTags(event.id),
  });
});

// Delete Event
router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const event = db.events.get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const userId = req.userId || 'user_admin';

  db.deleteEntity(event.id);
  db.events.delete(event.id);
  db.participants = db.participants.filter((p) => p.event_id !== event.id);

  db.logAudit(userId, 'DELETE', `Deleted Event: ${event.title}`, event.id, 'event');

  return res.json({ success: true });
});

// Add Participant
router.post('/:id/participants', (req, res) => {
  const event = db.events.get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { person_id, role, status } = req.body;
  if (!person_id) return res.status(400).json({ error: 'person_id is required' });

  const part: EventsParticipant = {
    id: 'part_' + Math.random().toString(36).substring(2, 9),
    event_id: event.id,
    person_id,
    role: role || 'attendee',
    status: status || 'confirmed',
  };

  db.participants.push(part);
  return res.json({ ...part, person: db.people.get(person_id) });
});

router.delete('/participants/:id', (req, res) => {
  db.participants = db.participants.filter((p) => p.id !== req.params.id);
  return res.json({ success: true });
});

export default router;
