#include <iostream>
#include "Graph.h"

int main() {
    Graph city;

    city.addEdge("A", "B");
    city.addEdge("A", "D");
    city.addEdge("B", "C");
    city.addEdge("C", "F");
    city.addEdge("F", "E");
    city.addEdge("E", "D");

    try {
        auto bfsResult = city.bfs("A");
        auto dfsResult = city.dfs("A");

        std::cout << "BFS: ";
        for (const auto& node : bfsResult)
            std::cout << node << " ";

        std::cout << "\nDFS: ";
        for (const auto& node : dfsResult)
            std::cout << node << " ";

    } catch (const std::exception& e) {
        std::cout << "Error: " << e.what();
    }

    return 0;
}
