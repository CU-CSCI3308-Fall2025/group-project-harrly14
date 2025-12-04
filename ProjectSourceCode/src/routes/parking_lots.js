const express = require('express');
const db = require('../config/database');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const rows = await db.any('SELECT lot_id, capacity, current_occupancy, geojson FROM parking_lots WHERE geojson IS NOT NULL');
    const features = rows.map(r => {
      // if geojson is a feature, keep it; otherwise wrap geometry
      const feature = (r.geojson && r.geojson.type === 'Feature') ?
        r.geojson :
        { type: 'Feature', geometry: r.geojson || null, properties: {} };
      feature.properties = {
        lot_id: r.lot_id,
        capacity: r.capacity,
        current_occupancy: r.current_occupancy,
        ...(feature.properties || {})
      };
      return feature;
    });
    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    console.error('Failed to fetch parking lots:', err);
    res.status(500).json({ error: 'Failed to load parking lots' });
  }
});

module.exports = router;