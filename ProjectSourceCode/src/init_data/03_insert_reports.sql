-- Insert sample reports referencing the parking lots and users

-- Insert report from alice about the first parking lot
WITH u_alice AS (SELECT user_id FROM users WHERE username = 'alice' LIMIT 1),
     l_first AS (SELECT lot_id FROM parking_lots ORDER BY lot_id LIMIT 1)
INSERT INTO reports (user_id, lot_num, report_type, time)
SELECT u_alice.user_id, l_first.lot_id, 'Parking Lot Full', NOW()
FROM u_alice, l_first
WHERE NOT EXISTS (
  SELECT 1 FROM reports r
  WHERE r.user_id = u_alice.user_id
    AND r.lot_num = l_first.lot_id
    AND r.report_type = 'Parking Lot Full'
);

-- Insert report from bob about the second parking lot
WITH u_bob AS (SELECT user_id FROM users WHERE username = 'bob' LIMIT 1),
     l_second AS (SELECT lot_id FROM parking_lots ORDER BY lot_id LIMIT 1 OFFSET 1)
INSERT INTO reports (user_id, lot_num, report_type, time)
SELECT u_bob.user_id, l_second.lot_id, 'Enforcement', NOW()
FROM u_bob, l_second
WHERE NOT EXISTS (
  SELECT 1 FROM reports r
  WHERE r.user_id = u_bob.user_id
    AND r.lot_num = l_second.lot_id
    AND r.report_type = 'Enforcement'
);
