import { Router } from 'express';
import { db, calculateDistanceKm } from '../db/database.js';
import { PlacesPlace, PlacesVisit } from '../db/types.js';
import { ExtensionManager } from '../services/extensionManager.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

// Protect all places routes
router.use(requireAuth);

// List Places with optional distance calculation if user coordinates provided
router.get('/', (req, res) => {
  const { user_lat, user_lng, category, tag_id } = req.query;
  const isMapsAvailable = ExtensionManager.isExtensionAvailable('maps');

  let places = Array.from(db.places.values()).map((pl) => {
    const entity = db.entities.get(pl.id);
    const tags = db.getEntityTags(pl.id);
    const visits = db.visits.filter((v) => v.place_id === pl.id);

    let distance_km: number | undefined;
    if (isMapsAvailable && user_lat && user_lng) {
      distance_km = calculateDistanceKm(
        Number(user_lat),
        Number(user_lng),
        pl.latitude,
        pl.longitude
      );
    }

    return {
      ...pl,
      entity,
      tags,
      visits_count: visits.length,
      distance_km,
    };
  });

  if (category) {
    places = places.filter((p) => p.category === category);
  }

  if (tag_id) {
    places = places.filter((p) => p.tags.some((t) => t.id === tag_id));
  }

  if (user_lat && user_lng && isMapsAvailable) {
    places.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  }

  return res.json({
    places,
    maps_extension_active: isMapsAvailable,
  });
});

// PostGIS-like Spatial Radius Query (/api/places/query/radius?lat=44.49&lng=11.34&radius_km=50)
router.get('/query/radius', (req, res) => {
  const { lat, lng, radius_km = 50 } = req.query;
  const isMapsAvailable = ExtensionManager.isExtensionAvailable('maps');

  if (!isMapsAvailable) {
    return res.status(503).json({
      error: 'Spatial queries require the "maps" extension (PostGIS) to be enabled in Extension Manager',
      requires_extension: 'maps',
    });
  }

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng parameters are required' });
  }

  const centerLat = Number(lat);
  const centerLng = Number(lng);
  const maxDist = Number(radius_km);

  const matched = Array.from(db.places.values())
    .map((pl) => {
      const dist = calculateDistanceKm(centerLat, centerLng, pl.latitude, pl.longitude);
      return {
        ...pl,
        entity: db.entities.get(pl.id),
        tags: db.getEntityTags(pl.id),
        distance_km: dist,
      };
    })
    .filter((p) => p.distance_km <= maxDist)
    .sort((a, b) => a.distance_km - b.distance_km);

  return res.json({
    center: { lat: centerLat, lng: centerLng },
    radius_km: maxDist,
    total_found: matched.length,
    results: matched,
  });
});

// Single Place Detail with Visits and Links
router.get('/:id', (req, res) => {
  const place = db.places.get(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });

  const entity = db.entities.get(place.id);
  const tags = db.getEntityTags(place.id);
  const visits = db.visits.filter((v) => v.place_id === place.id).sort((a, b) => b.visited_at.localeCompare(a.visited_at));
  const links = db.getEntityLinks(place.id);

  // Events held at this place
  const events = Array.from(db.events.values()).filter((e) => e.place_id === place.id);

  return res.json({
    ...place,
    entity,
    tags,
    visits,
    links,
    events,
    maps_extension_active: ExtensionManager.isExtensionAvailable('maps'),
  });
});

// Create Place
router.post('/', (req: AuthenticatedRequest, res) => {
  const {
    name,
    category,
    address,
    latitude,
    longitude,
    altitude,
    description,
    opening_hours,
    website,
    phone,
    tags,
  } = req.body;

  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
  }

  const id = 'place_' + Math.random().toString(36).substring(2, 9);
  const userId = req.userId || 'user_admin';

  // 1. Register into core.entities
  db.registerEntity(id, 'place', name, userId);

  // 2. Create in places.places
  const place: PlacesPlace = {
    id,
    name,
    category: category || 'Other',
    address,
    latitude: Number(latitude),
    longitude: Number(longitude),
    altitude: altitude !== undefined ? Number(altitude) : undefined,
    description,
    opening_hours,
    website,
    phone,
  };
  db.places.set(id, place);

  // 3. Attach tags
  if (Array.isArray(tags)) {
    for (const tagId of tags) {
      db.addEntityTag(id, tagId);
    }
  }

  db.logAudit(userId, 'CREATE', `Created Place: ${name} (${place.latitude}, ${place.longitude})`, id, 'place');

  return res.json({
    ...place,
    entity: db.entities.get(id),
    tags: db.getEntityTags(id),
  });
});

// Update Place
router.put('/:id', (req: AuthenticatedRequest, res) => {
  const place = db.places.get(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  const userId = req.userId || 'user_admin';

  const {
    name,
    category,
    address,
    latitude,
    longitude,
    altitude,
    description,
    opening_hours,
    website,
    phone,
    tags,
  } = req.body;

  if (name) place.name = name;
  if (category) place.category = category;
  if (address !== undefined) place.address = address;
  if (latitude !== undefined) place.latitude = Number(latitude);
  if (longitude !== undefined) place.longitude = Number(longitude);
  if (altitude !== undefined) place.altitude = Number(altitude);
  if (description !== undefined) place.description = description;
  if (opening_hours !== undefined) place.opening_hours = opening_hours;
  if (website !== undefined) place.website = website;
  if (phone !== undefined) place.phone = phone;

  db.registerEntity(place.id, 'place', place.name, userId);

  if (Array.isArray(tags)) {
    db.entityTags = db.entityTags.filter((et) => et.entity_id !== place.id);
    for (const tagId of tags) {
      db.addEntityTag(place.id, tagId);
    }
  }

  db.logAudit(userId, 'UPDATE', `Updated Place: ${place.name}`, place.id, 'place');

  return res.json({
    ...place,
    tags: db.getEntityTags(place.id),
  });
});

// Delete Place
router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const place = db.places.get(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  const userId = req.userId || 'user_admin';

  db.deleteEntity(place.id);
  db.places.delete(place.id);
  db.visits = db.visits.filter((v) => v.place_id !== place.id);

  db.logAudit(userId, 'DELETE', `Deleted Place: ${place.name}`, place.id, 'place');

  return res.json({ success: true });
});

// Add Visit log
router.post('/:id/visits', (req: AuthenticatedRequest, res) => {
  const place = db.places.get(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  const userId = req.userId || 'user_admin';

  const { visited_at, rating, notes, photos } = req.body;
  const visit: PlacesVisit = {
    id: 'visit_' + Math.random().toString(36).substring(2, 9),
    place_id: place.id,
    visited_at: visited_at || new Date().toISOString(),
    rating: rating ? Number(rating) : undefined,
    notes,
    photos,
  };

  db.visits.push(visit);
  db.logAudit(userId, 'CREATE', `Logged visit to ${place.name}`, place.id, 'place');

  return res.json(visit);
});

export default router;
