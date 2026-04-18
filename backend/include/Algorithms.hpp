#ifndef ALGORITHMS_HPP
#define ALGORITHMS_HPP

#include "Graph.hpp"
#include <nlohmann/json.hpp>
#include <chrono>
#include <queue>
#include <stack>
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <string>
#include <cmath>
#include <limits>
#include <algorithm>
#include <random>
#include <iostream>
#include <fstream>
#include <sstream>

#ifdef __linux__
#include <sys/resource.h>
#include <unistd.h>
#endif

namespace Algorithms {

// Memory measurement helper
inline size_t getMemoryUsageBytes() {
#ifdef __linux__
    size_t size = 0;
    std::ifstream file("/proc/self/status");
    std::string line;
    while (std::getline(file, line)) {
        if (line.substr(0, 6) == "VmRSS:") {
            std::string valStr = "";
            for (char c : line) {
                if (std::isdigit(c)) valStr += c;
            }
            if (!valStr.empty()) {
                size = std::stoull(valStr) * 1024; // KB to Bytes
            }
            break;
        }
    }
    return size;
#else
    return 0;
#endif
}

struct Step {
    std::string type; // "visit_node", "examine_edge", "update_distance", "relax_edge", "mst_add", "flow_update", "scc_push", "color_node"
    std::string nodeId;
    std::string sourceId;
    std::string targetId;
    double value;
    std::vector<std::string> queueState;
    std::vector<std::string> visited;
};

struct AlgorithmResult {
    std::string name;
    double executionTimeMs;
    size_t memoryUsageBytes;
    std::vector<std::string> path;
    double cost;
    std::vector<Step> steps;
    std::string timeComplexity;
    std::string spaceComplexity;

    nlohmann::json toJson() const {
        nlohmann::json j;
        j["name"] = name;
        j["executionTimeMs"] = executionTimeMs;
        j["memoryUsageBytes"] = memoryUsageBytes;
        j["path"] = path;
        j["cost"] = cost;
        j["timeComplexity"] = timeComplexity;
        j["spaceComplexity"] = spaceComplexity;
        
        nlohmann::json stepsJson = nlohmann::json::array();
        for (const auto& step : steps) {
            nlohmann::json s;
            s["type"] = step.type;
            s["nodeId"] = step.nodeId;
            s["sourceId"] = step.sourceId;
            s["targetId"] = step.targetId;
            s["value"] = step.value;
            s["queueState"] = step.queueState;
            s["visited"] = step.visited;
            stepsJson.push_back(s);
        }
        j["steps"] = stepsJson;
        return j;
    }
};

// Heuristic function for A* (Euclidean Distance in meters)
inline double distanceHeuristic(const CityNode& n1, const CityNode& n2) {
    double dx = n1.latitude - n2.latitude;
    double dy = n1.longitude - n2.longitude;
    return std::sqrt(dx * dx + dy * dy) * 111000.0;
}

// DSU structure for Kruskal
struct DSU {
    std::unordered_map<std::string, std::string> parent;
    std::unordered_map<std::string, int> rank;

    void makeSet(const std::string& i) {
        parent[i] = i;
        rank[i] = 0;
    }

    std::string findSet(const std::string& i) {
        if (parent[i] == i)
            return i;
        return parent[i] = findSet(parent[i]);
    }

    bool unionSets(const std::string& i, const std::string& j) {
        std::string rootI = findSet(i);
        std::string rootJ = findSet(j);
        if (rootI != rootJ) {
            if (rank[rootI] < rank[rootJ])
                std::swap(rootI, rootJ);
            parent[rootJ] = rootI;
            if (rank[rootI] == rank[rootJ])
                rank[rootI]++;
            return true;
        }
        return false;
    }
};

// 1. BFS
inline AlgorithmResult bfs(const Graph<CityNode, CityEdge>& graph, const std::string& start) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "BFS Traversal";
    res.timeComplexity = "O(V + E)";
    res.spaceComplexity = "O(V)";
    res.cost = 0;

    if (!graph.hasNode(start)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    std::unordered_set<std::string> visited;
    std::queue<std::string> q;
    std::vector<std::string> traversal;

    q.push(start);
    visited.insert(start);

    while (!q.empty()) {
        std::string current = q.front();
        q.pop();
        traversal.push_back(current);

        // Record Step
        std::vector<std::string> qState;
        std::queue<std::string> tempQ = q;
        while (!tempQ.empty()) {
            qState.push_back(tempQ.front());
            tempQ.pop();
        }
        
        std::vector<std::string> visitedList(visited.begin(), visited.end());
        res.steps.push_back(Step{
            .type = "visit_node",
            .nodeId = current,
            .sourceId = "",
            .targetId = "",
            .value = 0,
            .queueState = qState,
            .visited = visitedList
        });

        for (const auto& edge : graph.getEdges(current)) {
            if (visited.find(edge.destination) == visited.end()) {
                visited.insert(edge.destination);
                q.push(edge.destination);

                res.steps.push_back(Step{
                    .type = "examine_edge",
                    .nodeId = edge.destination,
                    .sourceId = current,
                    .targetId = edge.destination,
                    .value = edge.weight,
                    .queueState = qState,
                    .visited = visitedList
                });
            }
        }
    }

    res.path = traversal;
    
    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 2. DFS
inline void dfsVisit(const Graph<CityNode, CityEdge>& graph, const std::string& node,
                     std::unordered_set<std::string>& visited, std::vector<std::string>& traversal,
                     std::stack<std::string>& s, AlgorithmResult& res) {
    visited.insert(node);
    traversal.push_back(node);

    std::vector<std::string> sState;
    std::stack<std::string> tempS = s;
    while (!tempS.empty()) {
        sState.push_back(tempS.top());
        tempS.pop();
    }
    std::reverse(sState.begin(), sState.end());

    std::vector<std::string> visitedList(visited.begin(), visited.end());
    res.steps.push_back(Step{
        .type = "visit_node",
        .nodeId = node,
        .sourceId = "",
        .targetId = "",
        .value = 0,
        .queueState = sState,
        .visited = visitedList
    });

    for (const auto& edge : graph.getEdges(node)) {
        if (visited.find(edge.destination) == visited.end()) {
            s.push(edge.destination);
            res.steps.push_back(Step{
                .type = "examine_edge",
                .nodeId = edge.destination,
                .sourceId = node,
                .targetId = edge.destination,
                .value = edge.weight,
                .queueState = sState,
                .visited = visitedList
            });
            dfsVisit(graph, edge.destination, visited, traversal, s, res);
            s.pop();
        }
    }
}

inline AlgorithmResult dfs(const Graph<CityNode, CityEdge>& graph, const std::string& start) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "DFS Traversal";
    res.timeComplexity = "O(V + E)";
    res.spaceComplexity = "O(V)";
    res.cost = 0;

    if (!graph.hasNode(start)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    std::unordered_set<std::string> visited;
    std::vector<std::string> traversal;
    std::stack<std::string> s;
    
    s.push(start);
    dfsVisit(graph, start, visited, traversal, s, res);

    res.path = traversal;
    
    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 3. Dijkstra
inline AlgorithmResult dijkstra(const Graph<CityNode, CityEdge>& graph, const std::string& start, const std::string& end) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Dijkstra Shortest Path";
    res.timeComplexity = "O((V + E) log V)";
    res.spaceComplexity = "O(V)";
    res.cost = -1;

    if (!graph.hasNode(start) || !graph.hasNode(end)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    std::unordered_map<std::string, double> distances;
    std::unordered_map<std::string, std::string> parents;
    std::unordered_set<std::string> visited;

    for (const auto& [id, _] : graph.getNodes()) {
        distances[id] = std::numeric_limits<double>::infinity();
    }
    distances[start] = 0;

    using P = std::pair<double, std::string>;
    std::priority_queue<P, std::vector<P>, std::greater<P>> pq;
    pq.push({0.0, start});

    while (!pq.empty()) {
        auto [dist, current] = pq.top();
        pq.pop();

        if (visited.find(current) != visited.end()) continue;
        visited.insert(current);

        std::vector<std::string> qState;
        std::vector<std::string> visitedList(visited.begin(), visited.end());

        res.steps.push_back(Step{
            .type = "visit_node",
            .nodeId = current,
            .sourceId = "",
            .targetId = "",
            .value = dist,
            .queueState = qState,
            .visited = visitedList
        });

        if (current == end) break;

        for (const auto& edge : graph.getEdges(current)) {
            if (visited.find(edge.destination) != visited.end()) continue;

            double newDist = dist + edge.weight;
            
            res.steps.push_back(Step{
                .type = "examine_edge",
                .nodeId = edge.destination,
                .sourceId = current,
                .targetId = edge.destination,
                .value = edge.weight,
                .queueState = qState,
                .visited = visitedList
            });

            if (newDist < distances[edge.destination]) {
                distances[edge.destination] = newDist;
                parents[edge.destination] = current;
                pq.push({newDist, edge.destination});

                res.steps.push_back(Step{
                    .type = "update_distance",
                    .nodeId = edge.destination,
                    .sourceId = current,
                    .targetId = edge.destination,
                    .value = newDist,
                    .queueState = qState,
                    .visited = visitedList
                });
            }
        }
    }

    if (distances[end] != std::numeric_limits<double>::infinity()) {
        std::string crawl = end;
        while (crawl != start) {
            res.path.push_back(crawl);
            crawl = parents[crawl];
        }
        res.path.push_back(start);
        std::reverse(res.path.begin(), res.path.end());
        res.cost = distances[end];
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 4. Bellman-Ford
inline AlgorithmResult bellmanFord(const Graph<CityNode, CityEdge>& graph, const std::string& start, const std::string& end) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Bellman-Ford Shortest Path";
    res.timeComplexity = "O(V * E)";
    res.spaceComplexity = "O(V)";
    res.cost = -1;

    if (!graph.hasNode(start) || !graph.hasNode(end)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    std::unordered_map<std::string, double> distances;
    std::unordered_map<std::string, std::string> parents;

    for (const auto& [id, _] : graph.getNodes()) {
        distances[id] = std::numeric_limits<double>::infinity();
    }
    distances[start] = 0;

    auto allNodes = graph.getNodes();
    size_t numNodes = allNodes.size();

    // Relax all edges V-1 times
    for (size_t i = 0; i < numNodes - 1; ++i) {
        bool anyChange = false;
        for (const auto& [src, edges] : graph.getAdjList()) {
            if (distances[src] == std::numeric_limits<double>::infinity()) continue;

            for (const auto& edge : edges) {
                if (distances[src] + edge.weight < distances[edge.destination]) {
                    distances[edge.destination] = distances[src] + edge.weight;
                    parents[edge.destination] = src;
                    anyChange = true;

                    res.steps.push_back(Step{
                        .type = "relax_edge",
                        .nodeId = edge.destination,
                        .sourceId = src,
                        .targetId = edge.destination,
                        .value = distances[edge.destination],
                        .queueState = {},
                        .visited = {}
                    });
                }
            }
        }
        if (!anyChange) break;
    }

    // Check for negative cycles
    bool negativeCycle = false;
    for (const auto& [src, edges] : graph.getAdjList()) {
        if (distances[src] == std::numeric_limits<double>::infinity()) continue;
        for (const auto& edge : edges) {
            if (distances[src] + edge.weight < distances[edge.destination]) {
                negativeCycle = true;
                break;
            }
        }
    }

    if (negativeCycle) {
        res.cost = -2; // error marker for negative cycles
    } else if (distances[end] != std::numeric_limits<double>::infinity()) {
        std::string crawl = end;
        while (crawl != start) {
            res.path.push_back(crawl);
            crawl = parents[crawl];
        }
        res.path.push_back(start);
        std::reverse(res.path.begin(), res.path.end());
        res.cost = distances[end];
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 5. Floyd-Warshall
inline AlgorithmResult floydWarshall(const Graph<CityNode, CityEdge>& graph, const std::string& start, const std::string& end) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Floyd-Warshall All-Pairs Shortest Path";
    res.timeComplexity = "O(V^3)";
    res.spaceComplexity = "O(V^2)";
    res.cost = -1;

    auto allNodes = graph.getNodes();
    std::vector<std::string> nodeIndices;
    for (const auto& [id, _] : allNodes) {
        nodeIndices.push_back(id);
    }
    size_t n = nodeIndices.size();

    std::unordered_map<std::string, std::unordered_map<std::string, double>> dist;
    std::unordered_map<std::string, std::unordered_map<std::string, std::string>> next;

    for (size_t i = 0; i < n; ++i) {
        for (size_t j = 0; j < n; ++j) {
            if (i == j) {
                dist[nodeIndices[i]][nodeIndices[j]] = 0;
            } else {
                dist[nodeIndices[i]][nodeIndices[j]] = std::numeric_limits<double>::infinity();
            }
        }
    }

    for (const auto& [src, edges] : graph.getAdjList()) {
        for (const auto& edge : edges) {
            if (edge.weight < dist[src][edge.destination]) {
                dist[src][edge.destination] = edge.weight;
                next[src][edge.destination] = edge.destination;
            }
        }
    }

    // Dynamic Programming 3-nested loop
    for (size_t k = 0; k < n; ++k) {
        std::string kId = nodeIndices[k];
        for (size_t i = 0; i < n; ++i) {
            std::string iId = nodeIndices[i];
            for (size_t j = 0; j < n; ++j) {
                std::string jId = nodeIndices[j];

                if (dist[iId][kId] != std::numeric_limits<double>::infinity() &&
                    dist[kId][jId] != std::numeric_limits<double>::infinity()) {
                    if (dist[iId][kId] + dist[kId][jId] < dist[iId][jId]) {
                        dist[iId][jId] = dist[iId][kId] + dist[kId][jId];
                        next[iId][jId] = next[iId][kId];

                        // Log steps for progress, capped to prevent gigantic JSONs
                        if (res.steps.size() < 200 && (iId == start || jId == end)) {
                            res.steps.push_back(Step{
                                .type = "relax_edge",
                                .nodeId = jId,
                                .sourceId = iId,
                                .targetId = kId,
                                .value = dist[iId][jId],
                                .queueState = {},
                                .visited = {}
                            });
                        }
                    }
                }
            }
        }
    }

    if (dist[start][end] != std::numeric_limits<double>::infinity()) {
        res.cost = dist[start][end];
        std::string curr = start;
        res.path.push_back(curr);
        while (curr != end) {
            if (next[curr][end].empty()) break;
            curr = next[curr][end];
            res.path.push_back(curr);
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 6. A* Pathfinding
inline AlgorithmResult aStar(const Graph<CityNode, CityEdge>& graph, const std::string& start, const std::string& end) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "A* Pathfinding";
    res.timeComplexity = "O((V + E) log V)";
    res.spaceComplexity = "O(V)";
    res.cost = -1;

    if (!graph.hasNode(start) || !graph.hasNode(end)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    CityNode targetNode = graph.getNode(end);

    std::unordered_map<std::string, double> gScore;
    std::unordered_map<std::string, double> fScore;
    std::unordered_map<std::string, std::string> parents;
    std::unordered_set<std::string> closedSet;

    for (const auto& [id, _] : graph.getNodes()) {
        gScore[id] = std::numeric_limits<double>::infinity();
        fScore[id] = std::numeric_limits<double>::infinity();
    }
    
    gScore[start] = 0;
    fScore[start] = distanceHeuristic(graph.getNode(start), targetNode);

    using P = std::pair<double, std::string>;
    std::priority_queue<P, std::vector<P>, std::greater<P>> openSet;
    openSet.push({fScore[start], start});
    std::unordered_set<std::string> openSetLookup;
    openSetLookup.insert(start);

    while (!openSet.empty()) {
        auto [fVal, current] = openSet.top();
        openSet.pop();
        openSetLookup.erase(current);

        if (current == end) break;
        closedSet.insert(current);

        std::vector<std::string> openList(openSetLookup.begin(), openSetLookup.end());
        std::vector<std::string> closedList(closedSet.begin(), closedSet.end());

        res.steps.push_back(Step{
            .type = "visit_node",
            .nodeId = current,
            .sourceId = "",
            .targetId = "",
            .value = fVal,
            .queueState = openList,
            .visited = closedList
        });

        for (const auto& edge : graph.getEdges(current)) {
            if (closedSet.find(edge.destination) != closedSet.end()) continue;

            double tentativeG = gScore[current] + edge.weight;
            
            res.steps.push_back(Step{
                .type = "examine_edge",
                .nodeId = edge.destination,
                .sourceId = current,
                .targetId = edge.destination,
                .value = edge.weight,
                .queueState = openList,
                .visited = closedList
            });

            if (tentativeG < gScore[edge.destination]) {
                parents[edge.destination] = current;
                gScore[edge.destination] = tentativeG;
                fScore[edge.destination] = tentativeG + distanceHeuristic(graph.getNode(edge.destination), targetNode);

                if (openSetLookup.find(edge.destination) == openSetLookup.end()) {
                    openSet.push({fScore[edge.destination], edge.destination});
                    openSetLookup.insert(edge.destination);
                }

                res.steps.push_back(Step{
                    .type = "update_distance",
                    .nodeId = edge.destination,
                    .sourceId = current,
                    .targetId = edge.destination,
                    .value = fScore[edge.destination],
                    .queueState = openList,
                    .visited = closedList
                });
            }
        }
    }

    if (gScore[end] != std::numeric_limits<double>::infinity()) {
        std::string crawl = end;
        while (crawl != start) {
            res.path.push_back(crawl);
            crawl = parents[crawl];
        }
        res.path.push_back(start);
        std::reverse(res.path.begin(), res.path.end());
        res.cost = gScore[end];
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 7. Lee Algorithm (Shortest path on unweighted general graph via standard BFS)
inline AlgorithmResult leeAlgorithm(const Graph<CityNode, CityEdge>& graph, const std::string& start, const std::string& end) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Lee Algorithm Pathfinding";
    res.timeComplexity = "O(V + E)";
    res.spaceComplexity = "O(V)";
    res.cost = -1;

    if (!graph.hasNode(start) || !graph.hasNode(end)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    std::unordered_map<std::string, int> distance;
    std::unordered_map<std::string, std::string> parents;
    std::unordered_set<std::string> visited;
    std::queue<std::string> q;

    q.push(start);
    visited.insert(start);
    distance[start] = 0;

    while (!q.empty()) {
        std::string current = q.front();
        q.pop();

        std::vector<std::string> qState;
        std::queue<std::string> tempQ = q;
        while (!tempQ.empty()) {
            qState.push_back(tempQ.front());
            tempQ.pop();
        }
        std::vector<std::string> visitedList(visited.begin(), visited.end());

        res.steps.push_back(Step{
            .type = "visit_node",
            .nodeId = current,
            .sourceId = "",
            .targetId = "",
            .value = static_cast<double>(distance[current]),
            .queueState = qState,
            .visited = visitedList
        });

        if (current == end) break;

        for (const auto& edge : graph.getEdges(current)) {
            if (visited.find(edge.destination) == visited.end()) {
                visited.insert(edge.destination);
                parents[edge.destination] = current;
                distance[edge.destination] = distance[current] + 1;
                q.push(edge.destination);

                res.steps.push_back(Step{
                    .type = "update_distance",
                    .nodeId = edge.destination,
                    .sourceId = current,
                    .targetId = edge.destination,
                    .value = static_cast<double>(distance[edge.destination]),
                    .queueState = qState,
                    .visited = visitedList
                });
            }
        }
    }

    if (visited.find(end) != visited.end()) {
        std::string crawl = end;
        while (crawl != start) {
            res.path.push_back(crawl);
            crawl = parents[crawl];
        }
        res.path.push_back(start);
        std::reverse(res.path.begin(), res.path.end());
        res.cost = distance[end];
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 8. Prim's MST
inline AlgorithmResult prims(const Graph<CityNode, CityEdge>& graph, const std::string& start) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Prim's Minimum Spanning Tree";
    res.timeComplexity = "O((V + E) log V)";
    res.spaceComplexity = "O(V)";
    res.cost = 0;

    auto allNodes = graph.getNodes();
    if (allNodes.empty()) return res;

    std::string root = start;
    if (root.empty() || !graph.hasNode(root)) {
        root = allNodes.begin()->first;
    }

    std::unordered_set<std::string> visited;
    
    using P = std::tuple<double, std::string, std::string, std::string>; // weight, dest, src, edge_id
    std::priority_queue<P, std::vector<P>, std::greater<P>> pq;

    visited.insert(root);

    std::vector<std::string> visitedList(visited.begin(), visited.end());
    res.steps.push_back(Step{
        .type = "visit_node",
        .nodeId = root,
        .sourceId = "",
        .targetId = "",
        .value = 0,
        .queueState = {},
        .visited = visitedList
    });

    auto addEdges = [&](const std::string& u) {
        for (const auto& edge : graph.getEdges(u)) {
            if (visited.find(edge.destination) == visited.end()) {
                pq.push({edge.weight, edge.destination, u, edge.id});
            }
        }
    };

    addEdges(root);

    while (!pq.empty()) {
        auto [weight, dest, src, edgeId] = pq.top();
        pq.pop();

        if (visited.find(dest) != visited.end()) continue;
        visited.insert(dest);
        res.cost += weight;

        // Path stores MST nodes in discovery order, but we can also collect edge steps
        res.path.push_back(src);
        res.path.push_back(dest);

        visitedList.assign(visited.begin(), visited.end());
        res.steps.push_back(Step{
            .type = "mst_add",
            .nodeId = dest,
            .sourceId = src,
            .targetId = dest,
            .value = weight,
            .queueState = {},
            .visited = visitedList
        });

        addEdges(dest);
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 9. Kruskal's MST
inline AlgorithmResult kruskals(const Graph<CityNode, CityEdge>& graph) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Kruskal's Minimum Spanning Tree";
    res.timeComplexity = "O(E log E)";
    res.spaceComplexity = "O(V)";
    res.cost = 0;

    auto allNodes = graph.getNodes();
    DSU dsu;
    for (const auto& [id, _] : allNodes) {
        dsu.makeSet(id);
    }

    std::vector<CityEdge> allEdges;
    std::unordered_set<std::string> seenEdges;
    for (const auto& [src, edges] : graph.getAdjList()) {
        for (const auto& edge : edges) {
            std::string key = src < edge.destination ? (src + "_" + edge.destination) : (edge.destination + "_" + src);
            if (seenEdges.find(key) == seenEdges.end()) {
                allEdges.push_back(edge);
                seenEdges.insert(key);
            }
        }
    }

    std::sort(allEdges.begin(), allEdges.end(), [](const CityEdge& a, const CityEdge& b) {
        return a.weight < b.weight;
    });

    for (const auto& edge : allEdges) {
        res.steps.push_back(Step{
            .type = "examine_edge",
            .nodeId = "",
            .sourceId = edge.source,
            .targetId = edge.destination,
            .value = edge.weight,
            .queueState = {},
            .visited = {}
        });

        if (dsu.unionSets(edge.source, edge.destination)) {
            res.cost += edge.weight;
            res.path.push_back(edge.source);
            res.path.push_back(edge.destination);

            res.steps.push_back(Step{
                .type = "mst_add",
                .nodeId = "",
                .sourceId = edge.source,
                .targetId = edge.destination,
                .value = edge.weight,
                .queueState = {},
                .visited = {}
            });
        }
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 10. Topological Sort
inline void topoVisit(const Graph<CityNode, CityEdge>& graph, const std::string& u,
                      std::unordered_set<std::string>& visited, std::vector<std::string>& order,
                      bool& cycle, std::unordered_set<std::string>& recStack, AlgorithmResult& res) {
    visited.insert(u);
    recStack.insert(u);

    res.steps.push_back(Step{
        .type = "visit_node",
        .nodeId = u,
        .sourceId = "",
        .targetId = "",
        .value = 0,
        .queueState = {},
        .visited = std::vector<std::string>(visited.begin(), visited.end())
    });

    for (const auto& edge : graph.getEdges(u)) {
        if (recStack.find(edge.destination) != recStack.end()) {
            cycle = true; // cycle detected, topo sort not possible
            return;
        }
        if (visited.find(edge.destination) == visited.end()) {
            topoVisit(graph, edge.destination, visited, order, cycle, recStack, res);
            if (cycle) return;
        }
    }

    recStack.erase(u);
    order.push_back(u);
}

inline AlgorithmResult topologicalSort(const Graph<CityNode, CityEdge>& graph) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Topological Sort";
    res.timeComplexity = "O(V + E)";
    res.spaceComplexity = "O(V)";
    res.cost = 0;

    auto allNodes = graph.getNodes();
    std::unordered_set<std::string> visited;
    std::unordered_set<std::string> recStack;
    std::vector<std::string> order;
    bool cycle = false;

    for (const auto& [id, _] : allNodes) {
        if (visited.find(id) == visited.end()) {
            topoVisit(graph, id, visited, order, cycle, recStack, res);
            if (cycle) break;
        }
    }

    if (cycle) {
        res.cost = -1; // marks cycle error
    } else {
        std::reverse(order.begin(), order.end());
        res.path = order;
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 11. Tarjan's SCC
inline void sccTarjan(const Graph<CityNode, CityEdge>& graph, const std::string& u,
                      int& timer, std::unordered_map<std::string, int>& ids,
                      std::unordered_map<std::string, int>& low, std::stack<std::string>& st,
                      std::unordered_map<std::string, bool>& onStack, int& sccCount,
                      std::vector<std::string>& pathOut, AlgorithmResult& res) {
    ids[u] = low[u] = ++timer;
    st.push(u);
    onStack[u] = true;

    res.steps.push_back(Step{
        .type = "scc_push",
        .nodeId = u,
        .sourceId = "",
        .targetId = "",
        .value = static_cast<double>(low[u]),
        .queueState = {},
        .visited = {}
    });

    for (const auto& edge : graph.getEdges(u)) {
        if (ids.find(edge.destination) == ids.end()) {
            sccTarjan(graph, edge.destination, timer, ids, low, st, onStack, sccCount, pathOut, res);
            low[u] = std::min(low[u], low[edge.destination]);
        } else if (onStack[edge.destination]) {
            low[u] = std::min(low[u], ids[edge.destination]);
        }
    }

    if (ids[u] == low[u]) {
        sccCount++;
        std::string componentStr = "";
        while (true) {
            std::string v = st.top();
            st.pop();
            onStack[v] = false;
            pathOut.push_back(v); // group SCC vertices in flat array, separated by marker
            componentStr += (componentStr.empty() ? "" : ",") + v;
            
            res.steps.push_back(Step{
                .type = "visit_node",
                .nodeId = v,
                .sourceId = u,
                .targetId = "",
                .value = static_cast<double>(sccCount),
                .queueState = {},
                .visited = {}
            });
            if (v == u) break;
        }
        pathOut.push_back("__scc_end__");
    }
}

inline AlgorithmResult tarjanSCC(const Graph<CityNode, CityEdge>& graph) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Tarjan's SCC Algorithm";
    res.timeComplexity = "O(V + E)";
    res.spaceComplexity = "O(V)";
    res.cost = 0;

    auto allNodes = graph.getNodes();
    std::unordered_map<std::string, int> ids;
    std::unordered_map<std::string, int> low;
    std::unordered_map<std::string, bool> onStack;
    std::stack<std::string> st;
    int timer = 0;
    int sccCount = 0;
    std::vector<std::string> pathOut;

    for (const auto& [id, _] : allNodes) {
        if (ids.find(id) == ids.end()) {
            sccTarjan(graph, id, timer, ids, low, st, onStack, sccCount, pathOut, res);
        }
    }

    res.path = pathOut;
    res.cost = sccCount;

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 12. Bipartite Checking
inline AlgorithmResult checkBipartite(const Graph<CityNode, CityEdge>& graph) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Bipartite Checking";
    res.timeComplexity = "O(V + E)";
    res.spaceComplexity = "O(V)";
    res.cost = 1; // 1 means Bipartite, 0 means not

    auto allNodes = graph.getNodes();
    std::unordered_map<std::string, int> colors; // 0 or 1 for bipartite color
    for (const auto& [id, _] : allNodes) {
        colors[id] = -1;
    }

    bool isBipartite = true;

    for (const auto& [id, _] : allNodes) {
        if (colors[id] == -1) {
            std::queue<std::string> q;
            q.push(id);
            colors[id] = 0;

            while (!q.empty()) {
                std::string u = q.front();
                q.pop();

                res.steps.push_back(Step{
                    .type = "color_node",
                    .nodeId = u,
                    .sourceId = "",
                    .targetId = "",
                    .value = static_cast<double>(colors[u]),
                    .queueState = {},
                    .visited = {}
                });

                for (const auto& edge : graph.getEdges(u)) {
                    if (colors[edge.destination] == -1) {
                        colors[edge.destination] = 1 - colors[u];
                        q.push(edge.destination);
                    } else if (colors[edge.destination] == colors[u]) {
                        isBipartite = false;
                        res.cost = 0;

                        res.steps.push_back(Step{
                            .type = "examine_edge",
                            .nodeId = edge.destination,
                            .sourceId = u,
                            .targetId = edge.destination,
                            .value = -1, // marker for conflict
                            .queueState = {},
                            .visited = {}
                        });
                        break;
                    }
                }
                if (!isBipartite) break;
            }
        }
        if (!isBipartite) break;
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 13. Maximum Flow (Ford-Fulkerson using Edmonds-Karp BFS)
inline bool flowBfs(const std::unordered_map<std::string, std::unordered_map<std::string, double>>& residualCapacity,
                    const std::string& source, const std::string& sink,
                    std::unordered_map<std::string, std::string>& parent,
                    const std::vector<std::string>& nodeList) {
    std::unordered_set<std::string> visited;
    std::queue<std::string> q;
    q.push(source);
    visited.insert(source);

    while (!q.empty()) {
        std::string u = q.front();
        q.pop();

        for (const auto& v : nodeList) {
            if (visited.find(v) == visited.end()) {
                auto itU = residualCapacity.find(u);
                if (itU != residualCapacity.end()) {
                    auto itV = itU->second.find(v);
                    if (itV != itU->second.end() && itV->second > 0) {
                        q.push(v);
                        parent[v] = u;
                        visited.insert(v);
                        if (v == sink) return true;
                    }
                }
            }
        }
    }
    return false;
}

inline AlgorithmResult maxFlow(const Graph<CityNode, CityEdge>& graph, const std::string& source, const std::string& sink) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Maximum Flow (Edmonds-Karp)";
    res.timeComplexity = "O(V * E^2)";
    res.spaceComplexity = "O(V^2)";
    res.cost = 0; // stores max flow value

    if (!graph.hasNode(source) || !graph.hasNode(sink)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    auto allNodes = graph.getNodes();
    std::vector<std::string> nodeList;
    for (const auto& [id, _] : allNodes) nodeList.push_back(id);

    std::unordered_map<std::string, std::unordered_map<std::string, double>> residualCapacity;
    for (const auto& [u, edges] : graph.getAdjList()) {
        for (const auto& edge : edges) {
            residualCapacity[u][edge.destination] = edge.weight;
            if (residualCapacity[edge.destination].find(u) == residualCapacity[edge.destination].end()) {
                residualCapacity[edge.destination][u] = 0; // backward edge
            }
        }
    }

    std::unordered_map<std::string, std::string> parent;
    double max_flow = 0;

    while (flowBfs(residualCapacity, source, sink, parent, nodeList)) {
        double pathFlow = std::numeric_limits<double>::infinity();
        std::string v = sink;
        while (v != source) {
            std::string u = parent[v];
            pathFlow = std::min(pathFlow, residualCapacity[u][v]);
            v = u;
        }

        v = sink;
        while (v != source) {
            std::string u = parent[v];
            residualCapacity[u][v] -= pathFlow;
            residualCapacity[v][u] += pathFlow;

            res.steps.push_back(Step{
                .type = "flow_update",
                .nodeId = v,
                .sourceId = u,
                .targetId = v,
                .value = residualCapacity[u][v],
                .queueState = {},
                .visited = {}
            });
            v = u;
        }
        max_flow += pathFlow;
    }

    res.cost = max_flow;
    
    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 14. Ant Colony Optimization (ACO) for Shortest Path
inline AlgorithmResult antColonyOptimization(const Graph<CityNode, CityEdge>& graph, const std::string& start, const std::string& end) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Ant Colony Optimization (ACO)";
    res.timeComplexity = "O(Iterations * Ants * V)";
    res.spaceComplexity = "O(V^2)";
    res.cost = -1;

    if (!graph.hasNode(start) || !graph.hasNode(end)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    const int numAnts = 15;
    const int numIterations = 10;
    const double alpha = 1.0;  // pheromone weight
    const double beta = 2.0;   // heuristic (1/distance) weight
    const double evaporation = 0.5;
    const double Q = 100.0;

    std::unordered_map<std::string, std::unordered_map<std::string, double>> pheromones;
    for (const auto& [u, edges] : graph.getAdjList()) {
        for (const auto& edge : edges) {
            pheromones[u][edge.destination] = 1.0; // initial pheromone
        }
    }

    std::random_device rd;
    std::mt19937 gen(rd());

    std::vector<std::string> bestPath;
    double bestDistance = std::numeric_limits<double>::infinity();

    for (int iter = 0; iter < numIterations; ++iter) {
        std::vector<std::vector<std::string>> antPaths(numAnts);
        std::vector<double> antDistances(numAnts, 0.0);

        for (int a = 0; a < numAnts; ++a) {
            std::string current = start;
            antPaths[a].push_back(current);
            std::unordered_set<std::string> visited;
            visited.insert(current);

            bool reached = false;
            for (size_t stepLimit = 0; stepLimit < graph.getNodes().size() * 2; ++stepLimit) {
                if (current == end) {
                    reached = true;
                    break;
                }

                auto edges = graph.getEdges(current);
                std::vector<CityEdge> eligibleEdges;
                for (const auto& edge : edges) {
                    if (visited.find(edge.destination) == visited.end()) {
                        eligibleEdges.push_back(edge);
                    }
                }

                if (eligibleEdges.empty()) break; // Dead end

                // Select next node probabilistically
                std::vector<double> probabilities;
                double sum = 0.0;
                for (const auto& edge : eligibleEdges) {
                    double tau = pheromones[current][edge.destination];
                    double eta = 1.0 / std::max(edge.weight, 0.0001);
                    double prob = std::pow(tau, alpha) * std::pow(eta, beta);
                    probabilities.push_back(prob);
                    sum += prob;
                }

                std::uniform_real_distribution<double> dis(0.0, sum);
                double pick = dis(gen);
                double currentSum = 0.0;
                int chosenIndex = 0;
                for (size_t i = 0; i < eligibleEdges.size(); ++i) {
                    currentSum += probabilities[i];
                    if (pick <= currentSum) {
                        chosenIndex = i;
                        break;
                    }
                }

                auto chosenEdge = eligibleEdges[chosenIndex];
                current = chosenEdge.destination;
                antPaths[a].push_back(current);
                antDistances[a] += chosenEdge.weight;
                visited.insert(current);
            }

            if (reached && antDistances[a] < bestDistance) {
                bestDistance = antDistances[a];
                bestPath = antPaths[a];
            }
        }

        // Evaporate Pheromones
        for (auto& [u, dests] : pheromones) {
            for (auto& [v, value] : dests) {
                value *= (1.0 - evaporation);
            }
        }

        // Deposit Pheromones
        for (int a = 0; a < numAnts; ++a) {
            if (antPaths[a].back() == end) {
                double delta = Q / antDistances[a];
                for (size_t i = 0; i < antPaths[a].size() - 1; ++i) {
                    pheromones[antPaths[a][i]][antPaths[a][i+1]] += delta;
                }
            }
        }

        // Capture step for UI
        if (iter == numIterations - 1 && !bestPath.empty()) {
            res.steps.push_back(Step{
                .type = "visit_node",
                .nodeId = bestPath.back(),
                .sourceId = bestPath.size() > 1 ? bestPath[bestPath.size()-2] : "",
                .targetId = "",
                .value = bestDistance,
                .queueState = bestPath,
                .visited = {}
            });
        }
    }

    if (bestDistance != std::numeric_limits<double>::infinity()) {
        res.path = bestPath;
        res.cost = bestDistance;
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 15. Genetic Algorithm (GA) for Shortest Path
inline AlgorithmResult geneticAlgorithm(const Graph<CityNode, CityEdge>& graph, const std::string& start, const std::string& end) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Genetic Algorithm Pathfinding";
    res.timeComplexity = "O(Generations * Population * V)";
    res.spaceComplexity = "O(Population * V)";
    res.cost = -1;

    if (!graph.hasNode(start) || !graph.hasNode(end)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    const int populationSize = 30;
    const int numGenerations = 15;
    const double mutationRate = 0.2;

    std::random_device rd;
    std::mt19937 gen(rd());

    // Generate random path from start to end (simple random walk)
    auto generateRandomPath = [&](const std::string& sNode, const std::string& eNode) {
        std::vector<std::string> path = {sNode};
        std::unordered_set<std::string> visited = {sNode};
        std::string current = sNode;

        for (size_t i = 0; i < graph.getNodes().size(); ++i) {
            if (current == eNode) break;

            auto edges = graph.getEdges(current);
            std::vector<std::string> neighbors;
            for (const auto& edge : edges) {
                if (visited.find(edge.destination) == visited.end()) {
                    neighbors.push_back(edge.destination);
                }
            }

            if (neighbors.empty()) break; // Dead end

            std::uniform_int_distribution<> dis(0, neighbors.size() - 1);
            current = neighbors[dis(gen)];
            path.push_back(current);
            visited.insert(current);
        }
        return path;
    };

    // Helper to evaluate path fitness (inverse of length)
    auto calculatePathDistance = [&](const std::vector<std::string>& path) {
        if (path.empty() || path.back() != end) return std::numeric_limits<double>::infinity();
        double dist = 0.0;
        for (size_t i = 0; i < path.size() - 1; ++i) {
            bool found = false;
            for (const auto& edge : graph.getEdges(path[i])) {
                if (edge.destination == path[i+1]) {
                    dist += edge.weight;
                    found = true;
                    break;
                }
            }
            if (!found) return std::numeric_limits<double>::infinity();
        }
        return dist;
    };

    std::vector<std::vector<std::string>> population;
    for (int i = 0; i < populationSize; ++i) {
        population.push_back(generateRandomPath(start, end));
    }

    std::vector<std::string> bestPath;
    double bestDistance = std::numeric_limits<double>::infinity();

    for (int genIdx = 0; genIdx < numGenerations; ++genIdx) {
        std::vector<double> distances;
        for (const auto& path : population) {
            double dist = calculatePathDistance(path);
            distances.push_back(dist);
            if (dist < bestDistance) {
                bestDistance = dist;
                bestPath = path;
            }
        }

        // Selection: Tournament Selection
        std::vector<std::vector<std::string>> newPopulation;
        std::uniform_int_distribution<> popDis(0, populationSize - 1);

        for (int i = 0; i < populationSize; ++i) {
            // Tournament selection
            int p1 = popDis(gen);
            int p2 = popDis(gen);
            if (distances[p1] < distances[p2]) {
                newPopulation.push_back(population[p1]);
            } else {
                newPopulation.push_back(population[p2]);
            }
        }

        // Crossover and Mutation
        std::uniform_real_distribution<> realDis(0.0, 1.0);
        for (int i = 0; i < populationSize; ++i) {
            if (realDis(gen) < mutationRate) {
                // Mutate: generate a new path from a random intersection node
                auto& path = newPopulation[i];
                if (path.size() > 2) {
                    std::uniform_int_distribution<> mutPtDis(1, path.size() - 2);
                    int mutPt = mutPtDis(gen);
                    auto prefix = std::vector<std::string>(path.begin(), path.begin() + mutPt + 1);
                    auto suffix = generateRandomPath(path[mutPt], end);
                    
                    prefix.insert(prefix.end(), suffix.begin() + 1, suffix.end());
                    newPopulation[i] = prefix;
                }
            }
        }
        population = newPopulation;
    }

    if (bestDistance != std::numeric_limits<double>::infinity()) {
        res.path = bestPath;
        res.cost = bestDistance;

        res.steps.push_back(Step{
            .type = "visit_node",
            .nodeId = bestPath.back(),
            .sourceId = bestPath.size() > 1 ? bestPath[bestPath.size()-2] : "",
            .targetId = "",
            .value = bestDistance,
            .queueState = bestPath,
            .visited = {}
        });
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

// 16. Simulated Annealing (SA) for Shortest Path
inline AlgorithmResult simulatedAnnealing(const Graph<CityNode, CityEdge>& graph, const std::string& start, const std::string& end) {
    auto startTime = std::chrono::high_resolution_clock::now();
    size_t startMem = getMemoryUsageBytes();

    AlgorithmResult res;
    res.name = "Simulated Annealing Pathfinding";
    res.timeComplexity = "O(Steps * V)";
    res.spaceComplexity = "O(V)";
    res.cost = -1;

    if (!graph.hasNode(start) || !graph.hasNode(end)) {
        res.executionTimeMs = 0;
        res.memoryUsageBytes = 0;
        return res;
    }

    std::random_device rd;
    std::mt19937 gen(rd());

    // Helper to generate path via random walk
    auto generateRandomPath = [&](const std::string& sNode, const std::string& eNode) {
        std::vector<std::string> path = {sNode};
        std::unordered_set<std::string> visited = {sNode};
        std::string current = sNode;

        for (size_t i = 0; i < graph.getNodes().size(); ++i) {
            if (current == eNode) break;

            auto edges = graph.getEdges(current);
            std::vector<std::string> neighbors;
            for (const auto& edge : edges) {
                if (visited.find(edge.destination) == visited.end()) {
                    neighbors.push_back(edge.destination);
                }
            }

            if (neighbors.empty()) break; // Dead end

            std::uniform_int_distribution<> dis(0, neighbors.size() - 1);
            current = neighbors[dis(gen)];
            path.push_back(current);
            visited.insert(current);
        }
        return path;
    };

    auto calculatePathDistance = [&](const std::vector<std::string>& path) {
        if (path.empty() || path.back() != end) return std::numeric_limits<double>::infinity();
        double dist = 0.0;
        for (size_t i = 0; i < path.size() - 1; ++i) {
            bool found = false;
            for (const auto& edge : graph.getEdges(path[i])) {
                if (edge.destination == path[i+1]) {
                    dist += edge.weight;
                    found = true;
                    break;
                }
            }
            if (!found) return std::numeric_limits<double>::infinity();
        }
        return dist;
    };

    std::vector<std::string> currentPath = generateRandomPath(start, end);
    double currentDistance = calculatePathDistance(currentPath);

    std::vector<std::string> bestPath = currentPath;
    double bestDistance = currentDistance;

    double temp = 100.0;
    double coolingRate = 0.9;
    int maxSteps = 20;

    std::uniform_real_distribution<> probDis(0.0, 1.0);

    for (int step = 0; step < maxSteps; ++step) {
        if (temp <= 0.1) break;

        // Generate neighbor by perturbing currentPath (re-routing from a random node)
        if (currentPath.size() > 2) {
            std::uniform_int_distribution<> indexDis(1, currentPath.size() - 2);
            int pt = indexDis(gen);
            auto newCandidate = std::vector<std::string>(currentPath.begin(), currentPath.begin() + pt + 1);
            auto extension = generateRandomPath(currentPath[pt], end);
            newCandidate.insert(newCandidate.end(), extension.begin() + 1, extension.end());

            double candidateDistance = calculatePathDistance(newCandidate);

            if (candidateDistance != std::numeric_limits<double>::infinity()) {
                double delta = candidateDistance - currentDistance;
                // If candidate is better, accept. If worse, accept with Boltzmann probability
                if (delta < 0 || std::exp(-delta / temp) > probDis(gen)) {
                    currentPath = newCandidate;
                    currentDistance = candidateDistance;

                    if (currentDistance < bestDistance) {
                        bestDistance = currentDistance;
                        bestPath = currentPath;
                    }
                }
            }
        }

        temp *= coolingRate;

        // Log search paths
        if (!bestPath.empty()) {
            res.steps.push_back(Step{
                .type = "visit_node",
                .nodeId = bestPath.back(),
                .sourceId = bestPath.size() > 1 ? bestPath[bestPath.size()-2] : "",
                .targetId = "",
                .value = bestDistance,
                .queueState = bestPath,
                .visited = {}
            });
        }
    }

    if (bestDistance != std::numeric_limits<double>::infinity()) {
        res.path = bestPath;
        res.cost = bestDistance;
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.executionTimeMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();
    res.memoryUsageBytes = getMemoryUsageBytes() - startMem;
    return res;
}

} // namespace Algorithms

#endif
