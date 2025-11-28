-- Seed parking_lots first, then users, then reports.
-- Idempotent. Ensure lot_location exists and is populated from geojson properties.
-- It inserts full features from LotPolygons.geojson (preserve geometry) and embeds lot_id.

-- Ensure lot_location column exists for compatibility with the app
ALTER TABLE parking_lots ADD COLUMN IF NOT EXISTS lot_location TEXT;

-- Populate existing rows' lot_location from geojson properties when available
UPDATE parking_lots
SET lot_location = 'Lot ' || (geojson->'properties'->>'LotNumber')
WHERE lot_location IS NULL
  AND (geojson->'properties'->>'LotNumber') IS NOT NULL;

UPDATE parking_lots
SET lot_location = (geojson->'properties'->>'name')
WHERE lot_location IS NULL
  AND (geojson->'properties'->>'name') IS NOT NULL;

-- 1) Insert a couple of parking lots as examples (keeps previous behavior)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'parking_lots' AND column_name = 'lot_location'
  ) THEN
    -- table has lot_location: insert identifiable rows
    INSERT INTO parking_lots (lot_location, capacity, current_occupancy, geojson)
    SELECT 'Lot 440', 200, 10, '{"type":"Feature","properties":{"name":"Lot 440"},"geometry":null}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM parking_lots WHERE lot_location = 'Lot 440');

    INSERT INTO parking_lots (lot_location, capacity, current_occupancy, geojson)
    SELECT 'Lot 402', 150, 7, '{"type":"Feature","properties":{"name":"Lot 402"},"geometry":null}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM parking_lots WHERE lot_location = 'Lot 402');
  ELSE
    -- table does not have lot_location: insert rows only with other columns
    INSERT INTO parking_lots (capacity, current_occupancy, geojson)
    SELECT 200, 10, '{"type":"Feature","properties":{"name":"Lot 440"},"geometry":null}'::jsonb
    WHERE NOT EXISTS (
      SELECT 1 FROM parking_lots
      WHERE (geojson->'properties'->>'name') = 'Lot 440'
    );

    INSERT INTO parking_lots (capacity, current_occupancy, geojson)
    SELECT 150, 7, '{"type":"Feature","properties":{"name":"Lot 402"},"geometry":null}'::jsonb
    WHERE NOT EXISTS (
      SELECT 1 FROM parking_lots
      WHERE (geojson->'properties'->>'name') = 'Lot 402'
    );
  END IF;
END
$$ LANGUAGE plpgsql;

-- ensure LotPolygons.geojson features are inserted into parking_lots.geojson
DO $$
DECLARE
  fc jsonb;
  feat jsonb;
  props jsonb;
  v_lot_id int;
  geo_path text := '/docker-entrypoint-initdb.d/LotPolygons.geojson';
  v_capacity int;
  v_occupancy int;
  v_loc text;
BEGIN
  -- Try to read the geojson placed in the init folder
  BEGIN
    fc := (pg_read_file(geo_path))::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not read %, skipping polygon import: %', geo_path, SQLERRM;
    RETURN;
  END;

  FOR feat IN SELECT * FROM jsonb_array_elements(fc->'features') LOOP
    props := COALESCE(feat->'properties', '{}'::jsonb);

    -- compute capacity and occupancy with safe defaults (capacity must be > 0)
    v_capacity := GREATEST(COALESCE((props->>'capacity')::int, 1), 1);
    v_occupancy := GREATEST(COALESCE((props->>'current_occupancy')::int, 0), 0);

    -- derive lot_location when possible: prefer LotNumber, then name, else NULL
    IF (props ? 'LotNumber') THEN
      v_loc := 'Lot ' || (props->>'LotNumber');
    ELSIF (props ? 'name') THEN
      v_loc := props->>'name';
    ELSE
      v_loc := NULL;
    END IF;

    -- Skip if already exists by LotNumber or by exact geojson match
    IF (props ? 'LotNumber') THEN
      IF EXISTS (
        SELECT 1 FROM parking_lots
        WHERE (geojson->'properties'->>'LotNumber') = (props->>'LotNumber')
      ) THEN
        CONTINUE;
      END IF;
    ELSIF v_loc IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM parking_lots
        WHERE lot_location = v_loc
      ) THEN
        CONTINUE;
      END IF;
    ELSE
      IF EXISTS (
        SELECT 1 FROM parking_lots
        WHERE geojson = feat
      ) THEN
        CONTINUE;
      END IF;
    END IF;

    -- Insert the feature preserving full geometry and properties and set lot_location if available
    INSERT INTO parking_lots (lot_location, capacity, current_occupancy, geojson)
    VALUES (v_loc, v_capacity, v_occupancy, feat)
    RETURNING lot_id INTO v_lot_id;

    -- Embed the created lot_id into the saved geojson properties for easy lookup by the app
    IF v_lot_id IS NOT NULL THEN
      UPDATE parking_lots
      SET geojson = jsonb_set(geojson, '{properties,lot_id}', to_jsonb(v_lot_id), true)
      WHERE lot_id = v_lot_id;

      -- ensure lot_location stored when LotNumber is present but wasn't set earlier
      IF v_loc IS NULL THEN
        UPDATE parking_lots
        SET lot_location = COALESCE(
          ('Lot ' || (geojson->'properties'->>'LotNumber')),
          (geojson->'properties'->>'name')
        )
        WHERE lot_id = v_lot_id;
      END IF;

      v_lot_id := NULL;
    END IF;
  END LOOP;
END
$$ LANGUAGE plpgsql;

-- 2) Insert users if they don't exist
INSERT INTO users (username, email, password)
SELECT 'alice', 'alice@example.com', 'password'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'alice' OR email = 'alice@example.com');

INSERT INTO users (username, email, password)
SELECT 'bob', 'bob@example.com', 'password'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'bob' OR email = 'bob@example.com');

-- 3) Insert reports referencing the parking_lots inserted above.
WITH u_alice AS (SELECT user_id FROM users WHERE username = 'alice' LIMIT 1),
     u_bob   AS (SELECT user_id FROM users WHERE username = 'bob' LIMIT 1),
     l_first AS (SELECT lot_id FROM parking_lots ORDER BY lot_id LIMIT 1),
     l_second AS (SELECT lot_id FROM parking_lots ORDER BY lot_id LIMIT 1 OFFSET 1)
INSERT INTO reports (user_id, lot_num, report_type, time)
SELECT u_alice.user_id, l_first.lot_id, 'Parking Lot Full', NOW()
FROM u_alice, l_first
WHERE NOT EXISTS (
  SELECT 1 FROM reports r
  WHERE r.user_id = u_alice.user_id
    AND r.lot_num = l_first.lot_id
    AND r.report_type = 'Parking Lot Full'
);

WITH u_b AS (SELECT user_id FROM users WHERE username = 'bob' LIMIT 1),
     l_b AS (SELECT lot_id FROM parking_lots ORDER BY lot_id LIMIT 1 OFFSET 1)
INSERT INTO reports (user_id, lot_num, report_type, time)
SELECT u_b.user_id, l_b.lot_id, 'Enforcement', NOW()
FROM u_b, l_b
WHERE NOT EXISTS (
  SELECT 1 FROM reports r
  WHERE r.user_id = u_b.user_id
    AND r.lot_num = l_b.lot_id
    AND r.report_type = 'Enforcement'
);