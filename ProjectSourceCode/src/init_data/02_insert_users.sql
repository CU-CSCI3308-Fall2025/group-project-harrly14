-- Insert sample users for testing

INSERT INTO users (username, email, password)
VALUES
  ('alice', 'alice@example.com', '$2a$10$2Cl1wL3fhSLXGene3GY3xudZpzbanUc9x/usMUTB2zwrrITEO1kEe'), -- hash for "password"
  ('bob', 'bob@example.com', '$2a$10$2Cl1wL3fhSLXGene3GY3xudZpzbanUc9x/usMUTB2zwrrITEO1kEe'), -- hash for "password"
  ('demo_demo1', 'demo1@example.com', '$2a$10$2Cl1wL3fhSLXGene3GY3xudZpzbanUc9x/usMUTB2zwrrITEO1kEe'),
  ('demo_demo2', 'demo2@example.com', '$2a$10$2Cl1wL3fhSLXGene3GY3xudZpzbanUc9x/usMUTB2zwrrITEO1kEe'),
  ('demo_demo3', 'demo3@example.com', '$2a$10$2Cl1wL3fhSLXGene3GY3xudZpzbanUc9x/usMUTB2zwrrITEO1kEe'),
  ('demo_demo4', 'demo4@example.com', '$2a$10$2Cl1wL3fhSLXGene3GY3xudZpzbanUc9x/usMUTB2zwrrITEO1kEe'),
  ('demo_demo5', 'demo5@example.com', '$2a$10$2Cl1wL3fhSLXGene3GY3xudZpzbanUc9x/usMUTB2zwrrITEO1kEe')
ON CONFLICT (username) DO NOTHING;