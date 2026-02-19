#ifndef GRAPH_H
#define GRAPH_H

#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <string>

class Graph {
private:
    std::unordered_map<std::string, std::vector<std::string>> adjList;

    void dfsHelper(const std::string& node,
                   std::unordered_set<std::string>& visited,
                   std::vector<std::string>& result);

public:
    void addEdge(const std::string& from, const std::string& to);

    std::vector<std::string> bfs(const std::string& start);
    std::vector<std::string> dfs(const std::string& start);

    const std::unordered_map<std::string, std::vector<std::string>>& getAdjList() const;
};

#endif
