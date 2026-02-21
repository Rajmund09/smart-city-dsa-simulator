#include "Graph.h"
#include <queue>
#include <stdexcept>
#include <algorithm>
#include <limits>

void Graph::addEdge(const std::string& from,
                    const std::string& to,
                    int weight) {

    adjList[from].push_back({to, weight});

    if (adjList.find(to) == adjList.end()) {
        adjList[to] = {};
    }
}

const std::unordered_map<
    std::string,
    std::vector<std::pair<std::string,int>>
>& Graph::getAdjList() const {
    return adjList;
}

std::vector<std::string> Graph::bfs(const std::string& start) {

    if (adjList.find(start) == adjList.end())
        throw std::invalid_argument("Start node does not exist.");

    std::unordered_set<std::string> visited;
    std::queue<std::string> q;
    std::vector<std::string> traversal;

    visited.insert(start);
    q.push(start);

    while (!q.empty()) {

        std::string current = q.front();
        q.pop();

        traversal.push_back(current);

        for (const auto& edge : adjList[current]) {
            const std::string& neighbor = edge.first;

            if (!visited.count(neighbor)) {
                visited.insert(neighbor);
                q.push(neighbor);
            }
        }
    }

    return traversal;
}

std::vector<std::string> Graph::dfs(const std::string& start) {

    if (adjList.find(start) == adjList.end())
        throw std::invalid_argument("Start node does not exist.");

    std::unordered_set<std::string> visited;
    std::vector<std::string> traversal;

    dfsHelper(start, visited, traversal);
    return traversal;
}

void Graph::dfsHelper(const std::string& node,
                      std::unordered_set<std::string>& visited,
                      std::vector<std::string>& traversal) {

    visited.insert(node);
    traversal.push_back(node);

    for (const auto& edge : adjList[node]) {
        const std::string& neighbor = edge.first;

        if (!visited.count(neighbor)) {
            dfsHelper(neighbor, visited, traversal);
        }
    }
}

Graph::PathResult
Graph::shortestPath(const std::string& start,
                    const std::string& end) {

    if (!adjList.count(start) || !adjList.count(end))
        throw std::invalid_argument("Start or end node not found.");

    std::unordered_map<std::string,std::string> parent;
    std::unordered_map<std::string,int> distance;
    std::unordered_set<std::string> visited;
    std::queue<std::string> q;

    visited.insert(start);
    distance[start] = 0;
    q.push(start);

    while (!q.empty()) {

        std::string current = q.front();
        q.pop();

        if (current == end) break;

        for (const auto& edge : adjList[current]) {
            const std::string& neighbor = edge.first;

            if (!visited.count(neighbor)) {
                visited.insert(neighbor);
                parent[neighbor] = current;
                distance[neighbor] = distance[current] + 1;
                q.push(neighbor);
            }
        }
    }

    PathResult result;

    if (!visited.count(end)) {
        result.distance = -1;
        return result;
    }

    std::string crawl = end;
    while (crawl != start) {
        result.path.push_back(crawl);
        crawl = parent[crawl];
    }

    result.path.push_back(start);
    std::reverse(result.path.begin(), result.path.end());
    result.distance = distance[end];

    return result;
}

Graph::PathResult
Graph::dijkstra(const std::string& start,
                const std::string& end) {

    if (!adjList.count(start) || !adjList.count(end))
        throw std::invalid_argument("Start or end node not found.");

    std::unordered_map<std::string,int> distance;
    std::unordered_map<std::string,std::string> parent;

    for (const auto& pair : adjList)
        distance[pair.first] = std::numeric_limits<int>::max();

    distance[start] = 0;

    using P = std::pair<int,std::string>;
    std::priority_queue<P,
                        std::vector<P>,
                        std::greater<P>> pq;

    pq.push({0, start});

    while (!pq.empty()) {

        auto [dist, node] = pq.top();
        pq.pop();

        if (dist > distance[node]) continue;  // important optimization

        if (node == end) break;

        for (const auto& [neighbor, weight] : adjList[node]) {

            if (distance[node] + weight < distance[neighbor]) {
                distance[neighbor] = distance[node] + weight;
                parent[neighbor] = node;
                pq.push({distance[neighbor], neighbor});
            }
        }
    }

    PathResult result;

    if (distance[end] == std::numeric_limits<int>::max()) {
        result.distance = -1;
        return result;
    }

    std::string crawl = end;
    while (crawl != start) {
        result.path.push_back(crawl);
        crawl = parent[crawl];
    }

    result.path.push_back(start);
    std::reverse(result.path.begin(), result.path.end());
    result.distance = distance[end];

    return result;
}