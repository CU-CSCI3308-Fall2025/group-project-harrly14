DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS parking_lots CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS "session" CASCADE;
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  current_session BOOLEAN DEFAULT FALSE
);


CREATE TABLE IF NOT EXISTS parking_lots (
  lot_id INT UNIQUE PRIMARY KEY NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0),
  current_occupancy INT DEFAULT 0 CHECK (current_occupancy >= 0),
  geojson JSONB
);


CREATE TABLE IF NOT EXISTS reports (
  report_id SERIAL PRIMARY KEY NOT NULL,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lot_num INT NOT NULL REFERENCES parking_lots(lot_id) ON DELETE CASCADE,
  report_type VARCHAR(100) NOT NULL,
  time timestamptz NOT NULL
);


