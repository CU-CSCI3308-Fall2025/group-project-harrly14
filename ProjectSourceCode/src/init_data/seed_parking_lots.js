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
    const props = feat.properties || {};
    // Ensure lot_location is always a string
    const lot_location = props.lot_location || (props.LotNumber ? `Lot ${props.LotNumber}` : `Lot ${feat.id ?? ''}`);
    let capacity = Number(props.capacity ?? 0);
    if (Number.isNaN(capacity)) {
      capacity = 0;
    }
    let current_occupancy = Number(props.current_occupancy ?? 0);
    if (Number.isNaN(current_occupancy)) {
      current_occupancy = 0;
    }
    const geojson = feat;

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
      [lot_location, capacity, current_occupancy, feat]  // store original geojson for now
    );

    const lotId = inserted.lot_id;

    // Now update the stored geojson so it contains the lot_id inside properties
    const updatedGeoJSON = {
      ...feat,
      properties: {
        ...props,
        lot_id: lotId   // <-- EMBED DB ID DIRECTLY INTO GEOJSON
      }
    };

    await db.none(
      `UPDATE parking_lots SET geojson = $1 WHERE lot_id = $2`,
      [updatedGeoJSON, lotId]
    );

    console.log(`Inserted ${lot_location} (lot_id = ${lotId})`);
  }

  console.log('Seeding complete');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});