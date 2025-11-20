const fs = require('fs');
const path = require('path');
const db = require('../config/database'); 

async function seed() {
  const geojsonPath = path.join(__dirname, 'LotPolygons.geojson');
  const fc = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  if (!fc?.features?.length) {
    console.log('No features found in GeoJSON.');
    return;
  }

  for (const feat of fc.features) {
    try {
      const props = feat.properties || {};
      // Ensure lot_location is always a string and fits schema length
      let lot_location = props.lot_location || (props.LotNumber ? `Lot ${props.LotNumber}` : `Lot ${feat.id ?? ''}`);
      if (typeof lot_location !== 'string') lot_location = String(lot_location);
      lot_location = lot_location.slice(0, 100);

      let capacity = Number(props.capacity ?? 0);
      if (!Number.isFinite(capacity) || capacity <= 0) {
        // enforce schema CHECK (capacity > 0) — set to 1 as a safe default
        capacity = 1;
      }

      let current_occupancy = Number(props.current_occupancy ?? 0);
      if (!Number.isFinite(current_occupancy) || current_occupancy < 0) {
        current_occupancy = 0;
      }

      // skip if location already exists
      const exists = await db.oneOrNone(
        'SELECT lot_id FROM parking_lots WHERE lot_location = $1',
        [lot_location]
      );
      if (exists) {
        console.log(`Skipping existing: ${lot_location}`);
        continue;
      }

      const inserted = await db.one(
        `INSERT INTO parking_lots (lot_location, capacity, current_occupancy, geojson)
         VALUES ($1, $2, $3, $4)
        RETURNING lot_id`,
        [lot_location, capacity, current_occupancy, feat]
      );

      const lotId = inserted.lot_id;

      const updatedGeoJSON = {
        ...feat,
        properties: {
          ...props,
          lot_id: lotId
        }
      };

      await db.none(
        `UPDATE parking_lots SET geojson = $1 WHERE lot_id = $2`,
        [updatedGeoJSON, lotId]
      );

      console.log(`Inserted ${lot_location} (lot_id = ${lotId})`);
    } catch (err) {
      console.error('Seed error for feature:', err.message || err);
    }
  }

  console.log('Seeding complete');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});