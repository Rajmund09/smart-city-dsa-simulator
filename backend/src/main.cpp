#include <iostream>
#include "Graph.h"

int main() {

    Graph city;

    // Add edges (default weight = 1)
    city.addEdge("A", "B");
    city.addEdge("A", "D");
    city.addEdge("B", "C");
    city.addEdge("C", "F");
    city.addEdge("F", "E");
    city.addEdge("E", "D");

    try {

        // BFS Traversal
        auto bfsResult = city.bfs("A");

        std::cout << "BFS Traversal: ";
        for (const auto& node : bfsResult)
            std::cout << node << " ";
        std::cout << "\n";

        // DFS Traversal
        auto dfsResult = city.dfs("A");

        std::cout << "DFS Traversal: ";
        for (const auto& node : dfsResult)
            std::cout << node << " ";
        std::cout << "\n";

        // Shortest Path using BFS logic (unweighted)
        auto shortestBFS = city.shortestPath("A", "E");

        std::cout << "Shortest Path (BFS - Unweighted A -> E): ";
        for (const auto& node : shortestBFS.path)
            std::cout << node << " ";
        std::cout << "\nDistance: " << shortestBFS.distance << "\n";

        // Shortest Path using Dijkstra (weighted)
        auto shortestDijkstra = city.dijkstra("A", "E");

        std::cout << "Shortest Path (Dijkstra - Weighted A -> E): ";
        for (const auto& node : shortestDijkstra.path)
            std::cout << node << " ";
        std::cout << "\nDistance: " << shortestDijkstra.distance << "\n";

    }
    catch (const std::exception& e) {
        std::cout << "Error: " << e.what() << "\n";
    }

    return 0;
}