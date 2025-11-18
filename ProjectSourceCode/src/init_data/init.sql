DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS parking_lots CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  current_session BOOLEAN DEFAULT FALSE
);


CREATE TABLE IF NOT EXISTS parking_lots (
  lot_id SERIAL PRIMARY KEY NOT NULL,
  lot_location VARCHAR(100) NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0),
  current_occupancy INT DEFAULT 0 CHECK (current_occupancy >= 0),
  available_spots INT GENERATED ALWAYS AS (capacity - current_occupancy) STORED,
  latitude DECIMAL(9,7),
  longitude DECIMAL(10,7)
);


CREATE TABLE IF NOT EXISTS reports (
  report_id SERIAL PRIMARY KEY NOT NULL,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lot_num INT NOT NULL REFERENCES parking_lots(lot_id) ON DELETE CASCADE,
  report_type VARCHAR(100) NOT NULL,
  time timestamptz NOT NULL
);


INSERT INTO parking_lots (lot_location, capacity, current_occupancy, latitude, longitude) VALUES
('Euclid Garage', 365, 162, 40.006058, -105.270587);

INSERT INTO parking_lots (lot_location, capacity, current_occupancy, latitude, longitude) VALUES
('Lot 204', 365, 162, 40.005382, -105.269887);