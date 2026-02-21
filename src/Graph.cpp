#include "Graph.h"
#include <queue>
#include <stdexcept>
#include <algorithm>
#include <limits>

using namespace std;

void Graph::addEdge(const string& from,
                    const string& to,
                    int weight) {

    adjList[from].push_back({to, weight});

    if (adjList.find(to) == adjList.end()) {
        adjList[to] = {};
    }
}

const unordered_map<string, vector<pair<string,int>>>&
Graph::getAdjList() const {
    return adjList;
}

vector<string> Graph::bfs(const string& start) {

    if (adjList.find(start) == adjList.end())
        throw invalid_argument("Start node does not exist.");

    unordered_set<string> visited;
    queue<string> q;
    vector<string> traversal;

    visited.insert(start);
    q.push(start);

    while (!q.empty()) {

        string current = q.front();
        q.pop();

        traversal.push_back(current);

        for (const auto& edge : adjList[current]) {
            const string& neighbor = edge.first;

            if (!visited.count(neighbor)) {
                visited.insert(neighbor);
                q.push(neighbor);
            }
        }
    }

    return traversal;
}

vector<string> Graph::dfs(const string& start) {

    if (adjList.find(start) == adjList.end())
        throw invalid_argument("Start node does not exist.");

    unordered_set<string> visited;
    vector<string> traversal;

    dfsHelper(start, visited, traversal);
    return traversal;
}

void Graph::dfsHelper(const string& node,
                      unordered_set<string>& visited,
                      vector<string>& traversal) {

    visited.insert(node);
    traversal.push_back(node);

    for (const auto& edge : adjList[node]) {
        const string& neighbor = edge.first;

        if (!visited.count(neighbor)) {
            dfsHelper(neighbor, visited, traversal);
        }
    }
}
Graph::PathResult
Graph::shortestPath(const string& start,
                    const string& end) {

    if (!adjList.count(start) || !adjList.count(end))
        throw invalid_argument("Start or end node not found.");

    unordered_map<string,string> parent;
    unordered_map<string,int> distance;
    unordered_set<string> visited;
    queue<string> q;

    visited.insert(start);
    distance[start] = 0;
    q.push(start);

    while (!q.empty()) {

        string current = q.front();
        q.pop();

        if (current == end) break;

        for (const auto& edge : adjList[current]) {
            const string& neighbor = edge.first;

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

    string crawl = end;
    while (crawl != start) {
        result.path.push_back(crawl);
        crawl = parent[crawl];
    }

    result.path.push_back(start);
    reverse(result.path.begin(), result.path.end());
    result.distance = distance[end];

    return result;
}
Graph::PathResult
Graph::dijkstra(const string& start,
                const string& end) {

    if (!adjList.count(start) || !adjList.count(end))
        throw invalid_argument("Start or end node not found.");

    unordered_map<string,int> distance;
    unordered_map<string,string> parent;

    for (const auto& pair : adjList)
        distance[pair.first] = numeric_limits<int>::max();

    distance[start] = 0;

    using P = pair<int,string>;
    priority_queue<P, vector<P>, greater<P>> pq;

    pq.push({0, start});

    while (!pq.empty()) {

        auto [dist, node] = pq.top();
        pq.pop();

        if (node == end) break;

        for (auto& [neighbor, weight] : adjList[node]) {

            if (distance[node] + weight < distance[neighbor]) {
                distance[neighbor] = distance[node] + weight;
                parent[neighbor] = node;
                pq.push({distance[neighbor], neighbor});
            }
        }
    }

    PathResult result;

    if (distance[end] == numeric_limits<int>::max()) {
        result.distance = -1;
        return result;
    }

    string crawl = end;
    while (crawl != start) {
        result.path.push_back(crawl);
        crawl = parent[crawl];
    }

    result.path.push_back(start);
    reverse(result.path.begin(), result.path.end());
    result.distance = distance[end];

    return result;
}