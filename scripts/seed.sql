-- Seed data for Smart City DSA Simulator Platform
-- Inserts a default city 'Metropolis' with nodes and edges

-- Delete existing Metropolis if any to allow re-run
DELETE FROM cities WHERE name = 'Metropolis';

-- Insert Metropolis and populate its nodes
WITH new_city AS (
  INSERT INTO cities (name) VALUES ('Metropolis') RETURNING id
)
INSERT INTO nodes (id, city_id, name, latitude, longitude, type)
SELECT n.id, c.id, n.name, n.latitude, n.longitude, n.type
FROM (
  SELECT id FROM new_city
) c, (
  VALUES 
  ('N1', 'Central Square', 40.7128, -74.0060, 'intersection'),
  ('N2', 'Power Station North', 40.7180, -74.0080, 'power_station'),
  ('N3', 'East Reservoir', 40.7110, -73.9980, 'water_source'),
  ('N4', 'Metropolis Hospital', 40.7160, -74.0010, 'hospital'),
  ('N5', 'Central Station', 40.7080, -74.0110, 'station'),
  ('N6', 'Broadway Intersection', 40.7145, -74.0050, 'intersection'),
  ('N7', 'Wall Street Junction', 40.7095, -74.0080, 'intersection'),
  ('N8', 'Residential Area A', 40.7135, -74.0110, 'intersection'),
  ('N9', 'Tech Park East', 40.7100, -74.0020, 'intersection'),
  ('N10', 'North Junction', 40.7195, -74.0040, 'intersection')
) n(id, name, latitude, longitude, type);

-- Populate edges for Metropolis
INSERT INTO edges (city_id, source_id, destination_id, weight, type)
SELECT c.id, e.source_id, e.destination_id, e.weight, e.type
FROM (
  SELECT id FROM cities WHERE name = 'Metropolis'
) c, (
  VALUES
  ('N1', 'N6', 220.0, 'road'),
  ('N6', 'N1', 220.0, 'road'),
  ('N1', 'N7', 390.0, 'road'),
  ('N7', 'N1', 390.0, 'road'),
  ('N1', 'N8', 430.0, 'road'),
  ('N8', 'N1', 430.0, 'road'),
  ('N1', 'N9', 460.0, 'road'),
  ('N9', 'N1', 460.0, 'road'),
  ('N2', 'N6', 460.0, 'power_line'),
  ('N2', 'N8', 560.0, 'power_line'),
  ('N3', 'N9', 360.0, 'water_pipe'),
  ('N3', 'N7', 870.0, 'water_pipe'),
  ('N4', 'N6', 230.0, 'road'),
  ('N6', 'N4', 230.0, 'road'),
  ('N4', 'N10', 460.0, 'road'),
  ('N10', 'N4', 460.0, 'road'),
  ('N5', 'N7', 310.0, 'railway'),
  ('N7', 'N5', 310.0, 'railway'),
  ('N5', 'N8', 610.0, 'road'),
  ('N8', 'N5', 610.0, 'road'),
  ('N2', 'N10', 370.0, 'road'),
  ('N10', 'N2', 370.0, 'road'),
  ('N4', 'N9', 670.0, 'road'),
  ('N9', 'N4', 670.0, 'road'),
  ('N8', 'N6', 520.0, 'road'),
  ('N6', 'N8', 520.0, 'road')
) e(source_id, destination_id, weight, type);
