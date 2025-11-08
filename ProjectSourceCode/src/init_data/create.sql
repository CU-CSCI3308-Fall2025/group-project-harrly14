DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY NOT NULL,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL,
  current_session BOOLEAN DEFAULT FALSE
);

DROP TABLE IF EXISTS parking_lots CASCADE;
CREATE TABLE IF NOT EXISTS parking_lots (
  lot_id SERIAL PRIMARY KEY NOT NULL,
  lot_location VARCHAR(100) NOT NULL,
  capacity INT NOT NULL,
  current_occupancy INT DEFAULT 0
);

DROP TABLE IF EXISTS reports CASCADE;
CREATE TABLE IF NOT EXISTS reports (
  report_id SERIAL PRIMARY KEY NOT NULL,
  user_id INT NOT NULL,
  lot_num INT NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  time timestamptz NOT NULL,
  foreign key (user_id) references users(user_id),
  foreign key (lot_num) references parking_lots(lot_id)
);

insert into parking_lots (lot_location, capacity, current_occupancy) values
('Euclid Garage', 365, 0);