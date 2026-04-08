#ifndef GRAPH_HPP
#define GRAPH_HPP

#include <unordered_map>
#include <vector>
#include <string>
#include <shared_mutex>
#include <mutex>
#include <stdexcept>
#include <algorithm>

// Structure representing a Node in the Smart City
struct CityNode {
    std::string id;
    std::string name;
    double latitude;
    double longitude;
    std::string type; // "intersection", "residential", "commercial", "industrial", "power_station", "water_source", "hospital", "station"

    bool operator==(const CityNode& other) const {
        return id == other.id;
    }
};

// Structure representing an Edge in the Smart City
struct CityEdge {
    std::string id; // generated or custom identifier
    std::string source;
    std::string destination;
    double weight;
    std::string type; // "road", "power_line", "water_pipe", "railway"

    bool operator==(const CityEdge& other) const {
        return id == other.id || (source == other.source && destination == other.destination && type == other.type);
    }
};

template <typename NodeT = CityNode, typename EdgeT = CityEdge>
class Graph {
private:
    std::unordered_map<std::string, NodeT> nodes;
    std::unordered_map<std::string, std::vector<EdgeT>> adjList;
    bool isDirected;
    mutable std::shared_mutex graphMutex;

public:
    Graph(bool directed = false) : isDirected(directed) {}

    // Add a node to the graph
    void addNode(const std::string& id, const NodeT& nodeData) {
        std::unique_lock<std::shared_mutex> lock(graphMutex);
        nodes[id] = nodeData;
        if (adjList.find(id) == adjList.end()) {
            adjList[id] = {};
        }
    }

    // Add an edge to the graph
    void addEdge(const EdgeT& edgeData) {
        std::unique_lock<std::shared_mutex> lock(graphMutex);
        if (nodes.find(edgeData.source) == nodes.end() || nodes.find(edgeData.destination) == nodes.end()) {
            throw std::invalid_argument("Source or destination node does not exist in graph.");
        }
        
        // Remove duplicate edge if it exists
        auto& srcEdges = adjList[edgeData.source];
        srcEdges.erase(
            std::remove_if(srcEdges.begin(), srcEdges.end(),
                           [&](const EdgeT& e) { return e.destination == edgeData.destination && e.type == edgeData.type; }),
            srcEdges.end()
        );
        
        adjList[edgeData.source].push_back(edgeData);

        if (!isDirected) {
            EdgeT reverseEdge = edgeData;
            reverseEdge.source = edgeData.destination;
            reverseEdge.destination = edgeData.source;
            
            auto& destEdges = adjList[edgeData.destination];
            destEdges.erase(
                std::remove_if(destEdges.begin(), destEdges.end(),
                               [&](const EdgeT& e) { return e.destination == edgeData.source && e.type == edgeData.type; }),
                destEdges.end()
            );
            adjList[edgeData.destination].push_back(reverseEdge);
        }
    }

    // Remove a node and all connecting edges
    void removeNode(const std::string& id) {
        std::unique_lock<std::shared_mutex> lock(graphMutex);
        nodes.erase(id);
        adjList.erase(id);
        
        // Remove incoming edges to this node from other adjLists
        for (auto& [src, edges] : adjList) {
            edges.erase(
                std::remove_if(edges.begin(), edges.end(),
                               [&](const EdgeT& e) { return e.destination == id; }),
                edges.end()
            );
        }
    }

    // Remove a specific edge
    void removeEdge(const std::string& source, const std::string& destination, const std::string& type = "") {
        std::unique_lock<std::shared_mutex> lock(graphMutex);
        if (adjList.find(source) != adjList.end()) {
            adjList[source].erase(
                std::remove_if(adjList[source].begin(), adjList[source].end(),
                               [&](const EdgeT& e) { 
                                   return e.destination == destination && (type.empty() || e.type == type); 
                               }),
                adjList[source].end()
            );
        }
        if (!isDirected && adjList.find(destination) != adjList.end()) {
            adjList[destination].erase(
                std::remove_if(adjList[destination].begin(), adjList[destination].end(),
                               [&](const EdgeT& e) { 
                                   return e.destination == source && (type.empty() || e.type == type); 
                               }),
                adjList[destination].end()
            );
        }
    }

    // Check if node exists
    bool hasNode(const std::string& id) const {
        std::shared_lock<std::shared_mutex> lock(graphMutex);
        return nodes.find(id) != nodes.end();
    }

    // Get node by ID
    NodeT getNode(const std::string& id) const {
        std::shared_lock<std::shared_mutex> lock(graphMutex);
        auto it = nodes.find(id);
        if (it == nodes.end()) {
            throw std::invalid_argument("Node not found: " + id);
        }
        return it->second;
    }

    // Get copy of all nodes
    std::unordered_map<std::string, NodeT> getNodes() const {
        std::shared_lock<std::shared_mutex> lock(graphMutex);
        return nodes;
    }

    // Get edges for a specific node
    std::vector<EdgeT> getEdges(const std::string& id) const {
        std::shared_lock<std::shared_mutex> lock(graphMutex);
        auto it = adjList.find(id);
        if (it == adjList.end()) {
            return {};
        }
        return it->second;
    }

    // Get complete copy of adjacency list
    std::unordered_map<std::string, std::vector<EdgeT>> getAdjList() const {
        std::shared_lock<std::shared_mutex> lock(graphMutex);
        return adjList;
    }

    bool getIsDirected() const {
        return isDirected;
    }

    void clear() {
        std::unique_lock<std::shared_mutex> lock(graphMutex);
        nodes.clear();
        adjList.clear();
    }
};

#endif
