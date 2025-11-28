-- Insert sample users for testing

INSERT INTO users (username, email, password)
VALUES
  ('alice', 'alice@example.com', '$2a$10$2Cl1wL3fhSLXGene3GY3xudZpzbanUc9x/usMUTB2zwrrITEO1kEe'), -- hash for "password"
  ('bob', 'bob@example.com', '$2a$10$2Cl1wL3fhSLXGene3GY3xudZpzbanUc9x/usMUTB2zwrrITEO1kEe') -- hash for "password"
ON CONFLICT (username) DO NOTHING;