#ifndef DATABASE_HPP
#define DATABASE_HPP

#include "Graph.hpp"
#include <nlohmann/json.hpp>
#include <pqxx/pqxx>
#include <string>
#include <vector>
#include <memory>
#include <mutex>

class Database {
private:
    std::string connStr;
    std::unique_ptr<pqxx::connection> conn;
    mutable std::mutex dbMutex;

    void executeSchema();

public:
    Database();
    ~Database() = default;

    // Connect to database
    void connect();
    bool isConnected() const;

    // City Management
    int initializeCity(const std::string& name);
    void addNode(int cityId, const CityNode& node);
    void addEdge(int cityId, const CityEdge& edge);
    void deleteNode(int cityId, const std::string& nodeId);
    void deleteEdge(int cityId, const std::string& sourceId, const std::string& destinationId, const std::string& type);
    
    std::vector<CityNode> getNodes(int cityId);
    std::vector<CityEdge> getEdges(int cityId);
    std::vector<std::pair<int, std::string>> getCities();

    // Analytics
    void saveAlgorithmResult(int cityId, const std::string& algoName, double executionTimeMs, size_t memoryUsageBytes, const nlohmann::json& resultJson);
    nlohmann::json getAnalyticsStats(int cityId);
    nlohmann::json getAnalyticsPerformance(int cityId);
};

#endif
