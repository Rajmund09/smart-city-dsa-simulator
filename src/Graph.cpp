#include "Graph.h"
#include <queue>
#include <unordered_set>
#include <stdexcept>

void Graph::addEdge(const std::string& from, const std::string& to) {
    adjList[from].push_back(to);

    if (adjList.find(to) == adjList.end()) {
        adjList[to] = {};
    }
}

const std::unordered_map<std::string, std::vector<std::string>>&
Graph::getAdjList() const {
    return adjList;
}

std::vector<std::string> Graph::bfs(const std::string& start) {
    if (adjList.find(start) == adjList.end()) {
        throw std::invalid_argument("Start node does not exist in graph.");
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

        for (const auto& neighbor : adjList[current]) {
            if (visited.find(neighbor) == visited.end()) {
                visited.insert(neighbor);
                q.push(neighbor);
            }
        }
    }

    return traversal;
}

std::vector<std::string> Graph::dfs(const std::string& start) {
    if (adjList.find(start) == adjList.end()) {
        throw std::invalid_argument("Start node does not exist in graph.");
    }

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

    for (const auto& neighbor : adjList[node]) {
        if (visited.find(neighbor) == visited.end()) {
            dfsHelper(neighbor, visited, traversal);
        }
    }
}
