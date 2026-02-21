#include <iostream>
#include "Graph.h"

int main() {

    Graph city;

    city.addEdge("A", "B", 1);
    city.addEdge("A", "D", 1);
    city.addEdge("B", "C", 1);
    city.addEdge("C", "F", 1);
    city.addEdge("F", "E", 1);
    city.addEdge("E", "D", 1);

    try {

        auto bfsResult = city.bfs("A");
        auto dfsResult = city.dfs("A");
        auto shortest = city.shortestPath("A", "E");

        std::cout << "BFS: ";
        for (const auto& node : bfsResult)
            std::cout << node << " ";

        std::cout << "\nDFS: ";
        for (const auto& node : dfsResult)
            std::cout << node << " ";

        std::cout << "\nShortest Path (A -> E): ";
        for (const auto& node : shortest.path)
            std::cout << node << " ";

        std::cout << "\nDistance: " << shortest.distance << "\n";

    } catch (const std::exception& e) {
        std::cout << "Error: " << e.what();
    }

    return 0;
}