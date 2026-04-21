#include <version>
#include <source_location>
#ifdef __cpp_lib_source_location
#undef __cpp_lib_source_location
#endif
#include "Database.hpp"
#include <spdlog/spdlog.h>
#include <cstdlib>
#include <iostream>

Database::Database() {
    // Read environment variables or use defaults
    const char* dbHost = std::getenv("DB_HOST");
    const char* dbPort = std::getenv("DB_PORT");
    const char* dbName = std::getenv("DB_NAME");
    const char* dbUser = std::getenv("DB_USER");
    const char* dbPass = std::getenv("DB_PASSWORD");

    std::string host = dbHost ? dbHost : "db";
    std::string port = dbPort ? dbPort : "5432";
    std::string dbname = dbName ? dbName : "smart_city";
    std::string user = dbUser ? dbUser : "postgres";
    std::string password = dbPass ? dbPass : "postgres";

    connStr = "host=" + host + " port=" + port + " dbname=" + dbname + " user=" + user + " password=" + password;
}

void Database::connect() {
    std::lock_guard<std::mutex> lock(dbMutex);
    try {
        spdlog::info("Connecting to database: host={}...", connStr.substr(0, connStr.find("password=")));
        conn = std::make_unique<pqxx::connection>(connStr);
        if (conn->is_open()) {
            spdlog::info("Database connection established successfully.");
            executeSchema();
        } else {
            spdlog::error("Failed to open database connection.");
        }
    } catch (const std::exception& e) {
        spdlog::error("Database connection error: {}", e.what());
        throw;
    }
}

bool Database::isConnected() const {
    std::lock_guard<std::mutex> lock(dbMutex);
    return conn && conn->is_open();
}

void Database::executeSchema() {
    try {
        pqxx::work W(*conn);
        
        // Execute tables schema
        W.exec(R"(
            CREATE TABLE IF NOT EXISTS cities (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS nodes (
                id VARCHAR(50) PRIMARY KEY,
                city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                latitude DOUBLE PRECISION NOT NULL,
                longitude DOUBLE PRECISION NOT NULL,
                type VARCHAR(50) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS edges (
                id SERIAL PRIMARY KEY,
                city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
                source_id VARCHAR(50) REFERENCES nodes(id) ON DELETE CASCADE,
                destination_id VARCHAR(50) REFERENCES nodes(id) ON DELETE CASCADE,
                weight DOUBLE PRECISION NOT NULL,
                type VARCHAR(50) NOT NULL,
                CONSTRAINT unique_city_edge UNIQUE (city_id, source_id, destination_id, type)
            );

            CREATE TABLE IF NOT EXISTS algorithm_results (
                id SERIAL PRIMARY KEY,
                city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
                algorithm_name VARCHAR(100) NOT NULL,
                execution_time DOUBLE PRECISION NOT NULL,
                memory_usage BIGINT NOT NULL,
                result_json JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_nodes_city ON nodes(city_id);
            CREATE INDEX IF NOT EXISTS idx_edges_city ON edges(city_id);
            CREATE INDEX IF NOT EXISTS idx_results_city ON algorithm_results(city_id);
            CREATE INDEX IF NOT EXISTS idx_results_algo ON algorithm_results(algorithm_name);
        )");
        
        W.commit();
        spdlog::info("Database schema applied successfully.");
    } catch (const std::exception& e) {
        spdlog::error("Failed to execute schema: {}", e.what());
    }
}

int Database::initializeCity(const std::string& name) {
    std::lock_guard<std::mutex> lock(dbMutex);
    pqxx::work W(*conn);
    // Try to find if city exists
    pqxx::result R = W.exec_params("SELECT id FROM cities WHERE name = $1", name);
    if (!R.empty()) {
        int cityId = R[0][0].as<int>();
        W.commit();
        return cityId;
    }
    
    // Create new city
    pqxx::result insertRes = W.exec_params("INSERT INTO cities (name) VALUES ($1) RETURNING id", name);
    int cityId = insertRes[0][0].as<int>();
    W.commit();
    spdlog::info("Initialized new city: {} (ID: {})", name, cityId);
    return cityId;
}

void Database::addNode(int cityId, const CityNode& node) {
    std::lock_guard<std::mutex> lock(dbMutex);
    pqxx::work W(*conn);
    W.exec_params(
        "INSERT INTO nodes (id, city_id, name, latitude, longitude, type) "
        "VALUES ($1, $2, $3, $4, $5, $6) "
        "ON CONFLICT (id) DO UPDATE SET "
        "name = EXCLUDED.name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, type = EXCLUDED.type",
        node.id, cityId, node.name, node.latitude, node.longitude, node.type
    );
    W.commit();
}

void Database::addEdge(int cityId, const CityEdge& edge) {
    std::lock_guard<std::mutex> lock(dbMutex);
    pqxx::work W(*conn);
    W.exec_params(
        "INSERT INTO edges (city_id, source_id, destination_id, weight, type) "
        "VALUES ($1, $2, $3, $4, $5) "
        "ON CONFLICT (city_id, source_id, destination_id, type) DO UPDATE SET "
        "weight = EXCLUDED.weight",
        cityId, edge.source, edge.destination, edge.weight, edge.type
    );
    W.commit();
}

void Database::deleteNode(int cityId, const std::string& nodeId) {
    std::lock_guard<std::mutex> lock(dbMutex);
    pqxx::work W(*conn);
    W.exec_params("DELETE FROM nodes WHERE city_id = $1 AND id = $2", cityId, nodeId);
    W.commit();
}

void Database::deleteEdge(int cityId, const std::string& sourceId, const std::string& destinationId, const std::string& type) {
    std::lock_guard<std::mutex> lock(dbMutex);
    pqxx::work W(*conn);
    W.exec_params(
        "DELETE FROM edges WHERE city_id = $1 AND source_id = $2 AND destination_id = $3 AND type = $4",
        cityId, sourceId, destinationId, type
    );
    W.commit();
}

std::vector<CityNode> Database::getNodes(int cityId) {
    std::lock_guard<std::mutex> lock(dbMutex);
    pqxx::work W(*conn);
    pqxx::result R = W.exec_params("SELECT id, name, latitude, longitude, type FROM nodes WHERE city_id = $1", cityId);
    
    std::vector<CityNode> resultList;
    for (const auto& row : R) {
        resultList.push_back(CityNode{
            .id = row[0].as<std::string>(),
            .name = row[1].as<std::string>(),
            .latitude = row[2].as<double>(),
            .longitude = row[3].as<double>(),
            .type = row[4].as<std::string>()
        });
    }
    W.commit();
    return resultList;
}

std::vector<CityEdge> Database::getEdges(int cityId) {
    std::lock_guard<std::mutex> lock(dbMutex);
    pqxx::work W(*conn);
    pqxx::result R = W.exec_params("SELECT id, source_id, destination_id, weight, type FROM edges WHERE city_id = $1", cityId);
    
    std::vector<CityEdge> resultList;
    for (const auto& row : R) {
        resultList.push_back(CityEdge{
            .id = std::to_string(row[0].as<int>()),
            .source = row[1].as<std::string>(),
            .destination = row[2].as<std::string>(),
            .weight = row[3].as<double>(),
            .type = row[4].as<std::string>()
        });
    }
    W.commit();
    return resultList;
}

std::vector<std::pair<int, std::string>> Database::getCities() {
    std::lock_guard<std::mutex> lock(dbMutex);
    pqxx::work W(*conn);
    pqxx::result R = W.exec("SELECT id, name FROM cities ORDER BY name");
    
    std::vector<std::pair<int, std::string>> list;
    for (const auto& row : R) {
        list.push_back({row[0].as<int>(), row[1].as<std::string>()});
    }
    W.commit();
    return list;
}

void Database::saveAlgorithmResult(int cityId, const std::string& algoName, double executionTimeMs, size_t memoryUsageBytes, const nlohmann::json& resultJson) {
    std::lock_guard<std::mutex> lock(dbMutex);
    try {
        pqxx::work W(*conn);
        W.exec_params(
            "INSERT INTO algorithm_results (city_id, algorithm_name, execution_time, memory_usage, result_json) "
            "VALUES ($1, $2, $3, $4, $5)",
            cityId, algoName, executionTimeMs, static_cast<long long>(memoryUsageBytes), resultJson.dump()
        );
        W.commit();
    } catch (const std::exception& e) {
        spdlog::error("Failed to save algorithm result: {}", e.what());
    }
}

nlohmann::json Database::getAnalyticsStats(int cityId) {
    std::lock_guard<std::mutex> lock(dbMutex);
    nlohmann::json stats = nlohmann::json::object();
    try {
        pqxx::work W(*conn);
        
        pqxx::result nRes = W.exec_params("SELECT COUNT(*) FROM nodes WHERE city_id = $1", cityId);
        long long nodeCount = nRes[0][0].as<long long>();
        stats["nodes"] = nodeCount;
        
        pqxx::result eRes = W.exec_params("SELECT COUNT(*), COALESCE(AVG(weight), 0) FROM edges WHERE city_id = $1", cityId);
        long long edgeCount = eRes[0][0].as<long long>();
        double avgWeight = eRes[0][1].as<double>();
        
        stats["edges"] = edgeCount;
        stats["avgWeight"] = avgWeight;
        
        // Calculate density: D = 2*E / (V * (V-1)) for undirected, E / (V*(V-1)) for directed
        double density = 0.0;
        if (nodeCount > 1) {
            density = static_cast<double>(edgeCount) / (nodeCount * (nodeCount - 1));
        }
        stats["density"] = density;

        // Group counts by node type
        pqxx::result tRes = W.exec_params("SELECT type, COUNT(*) FROM nodes WHERE city_id = $1 GROUP BY type", cityId);
        nlohmann::json nodeTypes = nlohmann::json::object();
        for (const auto& row : tRes) {
            nodeTypes[row[0].as<std::string>()] = row[1].as<int>();
        }
        stats["nodeTypes"] = nodeTypes;
        
        W.commit();
    } catch (const std::exception& e) {
        spdlog::error("Failed to get analytics stats: {}", e.what());
    }
    return stats;
}

nlohmann::json Database::getAnalyticsPerformance(int cityId) {
    std::lock_guard<std::mutex> lock(dbMutex);
    nlohmann::json perf = nlohmann::json::array();
    try {
        pqxx::work W(*conn);
        pqxx::result R = W.exec_params(
            "SELECT algorithm_name, COUNT(*), COALESCE(AVG(execution_time), 0) as avg_time, COALESCE(AVG(memory_usage), 0) as avg_mem "
            "FROM algorithm_results WHERE city_id = $1 "
            "GROUP BY algorithm_name ORDER BY avg_time DESC",
            cityId
        );
        
        for (const auto& row : R) {
            nlohmann::json item;
            item["algorithm"] = row[0].as<std::string>();
            item["runs"] = row[1].as<int>();
            item["avgExecutionTimeMs"] = row[2].as<double>();
            item["avgMemoryUsageBytes"] = row[3].as<double>();
            perf.push_back(item);
        }
        W.commit();
    } catch (const std::exception& e) {
        spdlog::error("Failed to get analytics performance: {}", e.what());
    }
    return perf;
}
