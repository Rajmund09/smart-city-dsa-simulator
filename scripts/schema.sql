-- PostgreSQL Database Schema for Smart City DSA Simulator Platform

-- Create Cities Table
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Nodes Table
CREATE TABLE IF NOT EXISTS nodes (
    id VARCHAR(50) PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    type VARCHAR(50) NOT NULL -- 'intersection', 'residential', 'power_station', etc.
);

-- Create Edges Table
CREATE TABLE IF NOT EXISTS edges (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    source_id VARCHAR(50) REFERENCES nodes(id) ON DELETE CASCADE,
    destination_id VARCHAR(50) REFERENCES nodes(id) ON DELETE CASCADE,
    weight DOUBLE PRECISION NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'road', 'power_line', 'water_pipe', 'railway'
    CONSTRAINT unique_city_edge UNIQUE (city_id, source_id, destination_id, type)
);

-- Create Algorithm Results Table (for analytics)
CREATE TABLE IF NOT EXISTS algorithm_results (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    algorithm_name VARCHAR(100) NOT NULL,
    execution_time DOUBLE PRECISION NOT NULL, -- In milliseconds
    memory_usage BIGINT NOT NULL,             -- In bytes
    result_json JSONB NOT NULL,               -- Detailed steps & path
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_nodes_city ON nodes(city_id);
CREATE INDEX IF NOT EXISTS idx_edges_city ON edges(city_id);
CREATE INDEX IF NOT EXISTS idx_results_city ON algorithm_results(city_id);
CREATE INDEX IF NOT EXISTS idx_results_algo ON algorithm_results(algorithm_name);
