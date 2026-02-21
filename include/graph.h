#ifndef GRAPH_H
#define GRAPH_H

#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <string>

class Graph {
private:
    std::unordered_map<
        std::string,
        std::vector<std::pair<std::string, int>>
    > adjList;

    void dfsHelper(const std::string& node,
                   std::unordered_set<std::string>& visited,
                   std::vector<std::string>& result);

public:
    struct PathResult {
        std::vector<std::string> path;
        int distance;
    };

    void addEdge(const std::string& from,
                 const std::string& to,
                 int weight = 1);   // default weight = 1

    std::vector<std::string> bfs(const std::string& start);
    std::vector<std::string> dfs(const std::string& start);

    PathResult shortestPath(const std::string& start,
                            const std::string& end);   // BFS logic

    PathResult dijkstra(const std::string& start,
                        const std::string& end);

    const std::unordered_map<
        std::string,
        std::vector<std::pair<std::string, int>>
    >& getAdjList() const;
};

#endif