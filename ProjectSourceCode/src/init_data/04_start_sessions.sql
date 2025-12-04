-- Start demo parking sessions. Assumes demo users exist (added in 02_insert_users.sql).

BEGIN;

-- helper: increment lot and mark user active only if user is currently inactive and lot has capacity
-- demo_demo1 -> lot 204
UPDATE parking_lots
SET current_occupancy = current_occupancy + 1
WHERE lot_id = 204
  AND current_occupancy < capacity
  AND EXISTS (
    SELECT 1 FROM users u WHERE u.username = 'demo_demo1' AND (u.current_session IS NOT TRUE)
  );

UPDATE users
SET current_session = TRUE, current_lot = 204
WHERE username = 'demo_demo1' AND (current_session IS NOT TRUE);

-- demo_demo2 -> lot 205
UPDATE parking_lots
SET current_occupancy = current_occupancy + 1
WHERE lot_id = 205
  AND current_occupancy < capacity
  AND EXISTS (
    SELECT 1 FROM users u WHERE u.username = 'demo_demo2' AND (u.current_session IS NOT TRUE)
  );

UPDATE users
SET current_session = TRUE, current_lot = 205
WHERE username = 'demo_demo2' AND (current_session IS NOT TRUE);

-- demo_demo3 -> lot 306
UPDATE parking_lots
SET current_occupancy = current_occupancy + 1
WHERE lot_id = 306
  AND current_occupancy < capacity
  AND EXISTS (
    SELECT 1 FROM users u WHERE u.username = 'demo_demo3' AND (u.current_session IS NOT TRUE)
  );

UPDATE users
SET current_session = TRUE, current_lot = 306
WHERE username = 'demo_demo3' AND (current_session IS NOT TRUE);

-- demo_demo4 -> lot 436 (if present)
UPDATE parking_lots
SET current_occupancy = current_occupancy + 1
WHERE lot_id = 436
  AND current_occupancy < capacity
  AND EXISTS (
    SELECT 1 FROM users u WHERE u.username = 'demo_demo4' AND (u.current_session IS NOT TRUE)
  );

UPDATE users
SET current_session = TRUE, current_lot = 436
WHERE username = 'demo_demo4' AND (current_session IS NOT TRUE);

-- demo_demo5 -> lot 310
UPDATE parking_lots
SET current_occupancy = current_occupancy + 1
WHERE lot_id = 310
  AND current_occupancy < capacity
  AND EXISTS (
    SELECT 1 FROM users u WHERE u.username = 'demo_demo5' AND (u.current_session IS NOT TRUE)
  );

UPDATE users
SET current_session = TRUE, current_lot = 310
WHERE username = 'demo_demo5' AND (current_session IS NOT TRUE);

COMMIT;