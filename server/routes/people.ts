import { Router } from 'express';
import { db } from '../db/database.js';
import { PeoplePerson } from '../db/types.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

// Protect all people routes
router.use(requireAuth);

// List Persons with related tags, primary contact, and entity metadata
router.get('/', (req, res) => {
  const persons = Array.from(db.people.values()).map((p) => {
    const entity = db.entities.get(p.id);
    const tags = db.getEntityTags(p.id);
    const contacts = Array.from(db.contacts.values()).filter((c) => c.person_id === p.id);
    const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];

    return {
      ...p,
      entity,
      tags,
      contacts_count: contacts.length,
      primary_contact: primaryContact,
    };
  });

  return res.json(persons);
});

// Single Person detail with all relationships, contacts, links, and events
router.get('/:id', (req, res) => {
  const person = db.people.get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const entity = db.entities.get(person.id);
  const tags = db.getEntityTags(person.id);
  const contacts = Array.from(db.contacts.values()).filter((c) => c.person_id === person.id);
  const links = db.getEntityLinks(person.id);

  // Relationships
  const rels = db.relationships
    .filter((r) => r.person_a_id === person.id || r.person_b_id === person.id)
    .map((r) => {
      const otherPersonId = r.person_a_id === person.id ? r.person_b_id : r.person_a_id;
      const otherPerson = db.people.get(otherPersonId);
      return {
        ...r,
        related_person: otherPerson,
      };
    });

  // Participating events
  const participatedEventIds = db.participants
    .filter((p) => p.person_id === person.id)
    .map((p) => p.event_id);
  const events = participatedEventIds.map((id) => db.events.get(id)).filter(Boolean);

  return res.json({
    ...person,
    entity,
    tags,
    contacts,
    relationships: rels,
    links,
    events,
  });
});

// Create Person
router.post('/', (req: AuthenticatedRequest, res) => {
  const {
    first_name,
    last_name,
    nickname,
    birthdate,
    bio,
    avatar_url,
    gender,
    company,
    role_title,
    notes,
    tags,
    email,
    phone,
  } = req.body;

  if (!first_name) {
    return res.status(400).json({ error: 'First name is required' });
  }

  const id = 'person_' + Math.random().toString(36).substring(2, 9);
  const fullName = `${first_name} ${last_name || ''}`.trim();
  const userId = req.userId || 'user_admin';

  // 1. Register into core.entities
  db.registerEntity(id, 'person', fullName, userId);

  // 2. Create in people.persons
  const person: PeoplePerson = {
    id,
    first_name,
    last_name: last_name || '',
    nickname,
    birthdate,
    bio,
    avatar_url:
      avatar_url ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    gender,
    company,
    role_title,
    notes,
  };
  db.people.set(id, person);

  // 3. Add default contacts if provided
  if (email) {
    db.contacts.set('ct_' + Math.random().toString(36).substring(2, 9), {
      id: 'ct_' + Math.random().toString(36).substring(2, 9),
      person_id: id,
      type: 'email',
      value: email,
      label: 'Primary Email',
      is_primary: true,
    });
  }
  if (phone) {
    db.contacts.set('ct_' + Math.random().toString(36).substring(2, 9), {
      id: 'ct_' + Math.random().toString(36).substring(2, 9),
      person_id: id,
      type: 'phone',
      value: phone,
      label: 'Mobile',
      is_primary: !email,
    });
  }

  // 4. Attach tags
  if (Array.isArray(tags)) {
    for (const tagId of tags) {
      db.addEntityTag(id, tagId);
    }
  }

  db.logAudit(userId, 'CREATE', `Created Person: ${fullName}`, id, 'person');

  return res.json({
    ...person,
    entity: db.entities.get(id),
    tags: db.getEntityTags(id),
  });
});

// Update Person
router.put('/:id', (req: AuthenticatedRequest, res) => {
  const person = db.people.get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });
  const userId = req.userId || 'user_admin';

  const {
    first_name,
    last_name,
    nickname,
    birthdate,
    bio,
    avatar_url,
    gender,
    company,
    role_title,
    notes,
    tags,
  } = req.body;

  if (first_name) person.first_name = first_name;
  if (last_name !== undefined) person.last_name = last_name;
  if (nickname !== undefined) person.nickname = nickname;
  if (birthdate !== undefined) person.birthdate = birthdate;
  if (bio !== undefined) person.bio = bio;
  if (avatar_url !== undefined) person.avatar_url = avatar_url;
  if (gender !== undefined) person.gender = gender;
  if (company !== undefined) person.company = company;
  if (role_title !== undefined) person.role_title = role_title;
  if (notes !== undefined) person.notes = notes;

  const fullName = `${person.first_name} ${person.last_name || ''}`.trim();
  db.registerEntity(person.id, 'person', fullName, userId);

  // Update tags if provided
  if (Array.isArray(tags)) {
    db.entityTags = db.entityTags.filter((et) => et.entity_id !== person.id);
    for (const tagId of tags) {
      db.addEntityTag(person.id, tagId);
    }
  }

  db.logAudit(userId, 'UPDATE', `Updated Person: ${fullName}`, person.id, 'person');

  return res.json({
    ...person,
    tags: db.getEntityTags(person.id),
  });
});

// Delete Person
router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const person = db.people.get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });
  const userId = req.userId || 'user_admin';

  db.deleteEntity(person.id);
  db.people.delete(person.id);

  // Clean contacts & relationships
  for (const [id, c] of db.contacts.entries()) {
    if (c.person_id === person.id) db.contacts.delete(id);
  }
  db.relationships = db.relationships.filter(
    (r) => r.person_a_id !== person.id && r.person_b_id !== person.id
  );

  db.logAudit(
    userId,
    'DELETE',
    `Deleted Person: ${person.first_name} ${person.last_name}`,
    person.id,
    'person'
  );

  return res.json({ success: true });
});

// Add Contact
router.post('/:id/contacts', (req, res) => {
  const person = db.people.get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const { type, value, label, is_primary } = req.body;
  if (!type || !value) {
    return res.status(400).json({ error: 'Type and Value are required' });
  }

  const id = 'ct_' + Math.random().toString(36).substring(2, 9);
  const contact = {
    id,
    person_id: person.id,
    type,
    value,
    label: label || type,
    is_primary: Boolean(is_primary),
  };

  db.contacts.set(id, contact);
  return res.json(contact);
});

router.delete('/contacts/:id', (req, res) => {
  db.contacts.delete(req.params.id);
  return res.json({ success: true });
});

// Add Relationship
router.post('/:id/relationships', (req, res) => {
  const person = db.people.get(req.params.id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const { target_person_id, relationship_type, notes } = req.body;
  if (!target_person_id || !relationship_type) {
    return res.status(400).json({ error: 'target_person_id and relationship_type required' });
  }

  const rel = {
    id: 'rel_' + Math.random().toString(36).substring(2, 9),
    person_a_id: person.id,
    person_b_id: target_person_id,
    relationship_type,
    notes,
  };

  db.relationships.push(rel);
  return res.json(rel);
});

export default router;
