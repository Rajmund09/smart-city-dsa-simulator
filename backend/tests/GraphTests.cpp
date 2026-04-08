#include <gtest/gtest.h>
#include "Graph.hpp"
#include "Algorithms.hpp"

// Test graph node/edge insertions
TEST(GraphEngineTest, GraphOperations) {
    Graph<CityNode, CityEdge> g;
    CityNode n1{"A", "Node A", 40.0, -74.0, "intersection"};
    CityNode n2{"B", "Node B", 40.1, -74.1, "residential"};
    
    g.addNode("A", n1);
    g.addNode("B", n2);
    
    EXPECT_TRUE(g.hasNode("A"));
    EXPECT_TRUE(g.hasNode("B"));
    EXPECT_FALSE(g.hasNode("C"));
    
    CityEdge e{"1", "A", "B", 10.0, "road"};
    g.addEdge(e);
    
    auto edgesA = g.getEdges("A");
    EXPECT_EQ(edgesA.size(), 1);
    EXPECT_EQ(edgesA[0].destination, "B");
    EXPECT_EQ(edgesA[0].weight, 10.0);
    
    // Undirected graph should have reverse edge
    auto edgesB = g.getEdges("B");
    EXPECT_EQ(edgesB.size(), 1);
    EXPECT_EQ(edgesB[0].destination, "A");
}

// Test BFS Traversal
TEST(GraphAlgorithmsTest, BFSTraversal) {
    Graph<CityNode, CityEdge> g;
    g.addNode("A", {"A", "A", 0, 0, "int"});
    g.addNode("B", {"B", "B", 0, 0, "int"});
    g.addNode("C", {"C", "C", 0, 0, "int"});
    
    g.addEdge({"1", "A", "B", 1.0, "road"});
    g.addEdge({"2", "B", "C", 1.0, "road"});
    
    auto result = Algorithms::bfs(g, "A");
    EXPECT_EQ(result.path.size(), 3);
    EXPECT_EQ(result.path[0], "A");
    EXPECT_EQ(result.path[1], "B");
    EXPECT_EQ(result.path[2], "C");
}

// Test Dijkstra Shortest Path
TEST(GraphAlgorithmsTest, DijkstraShortestPath) {
    Graph<CityNode, CityEdge> g;
    g.addNode("A", {"A", "A", 0, 0, "int"});
    g.addNode("B", {"B", "B", 0, 0, "int"});
    g.addNode("C", {"C", "C", 0, 0, "int"});
    g.addNode("D", {"D", "D", 0, 0, "int"});
    
    g.addEdge({"1", "A", "B", 1.0, "road"});
    g.addEdge({"2", "B", "D", 5.0, "road"});
    g.addEdge({"3", "A", "C", 2.0, "road"});
    g.addEdge({"4", "C", "D", 1.0, "road"});
    
    // A -> C -> D = 3.0, A -> B -> D = 6.0
    auto result = Algorithms::dijkstra(g, "A", "D");
    EXPECT_DOUBLE_EQ(result.cost, 3.0);
    EXPECT_EQ(result.path.size(), 3);
    EXPECT_EQ(result.path[0], "A");
    EXPECT_EQ(result.path[1], "C");
    EXPECT_EQ(result.path[2], "D");
}

// Test Kruskal MST
TEST(GraphAlgorithmsTest, KruskalMST) {
    Graph<CityNode, CityEdge> g;
    g.addNode("A", {"A", "A", 0, 0, "int"});
    g.addNode("B", {"B", "B", 0, 0, "int"});
    g.addNode("C", {"C", "C", 0, 0, "int"});
    
    g.addEdge({"1", "A", "B", 4.0, "road"});
    g.addEdge({"2", "B", "C", 1.0, "road"});
    g.addEdge({"3", "A", "C", 2.0, "road"});
    
    // MST should pick A-C (2.0) and B-C (1.0), total cost 3.0
    auto result = Algorithms::kruskals(g);
    EXPECT_DOUBLE_EQ(result.cost, 3.0);
}

// Test Bipartite Check
TEST(GraphAlgorithmsTest, BipartiteCheck) {
    Graph<CityNode, CityEdge> g;
    g.addNode("A", {"A", "A", 0, 0, "int"});
    g.addNode("B", {"B", "B", 0, 0, "int"});
    g.addNode("C", {"C", "C", 0, 0, "int"});
    
    g.addEdge({"1", "A", "B", 1.0, "road"});
    g.addEdge({"2", "B", "C", 1.0, "road"});
    
    auto result = Algorithms::checkBipartite(g);
    EXPECT_EQ(result.cost, 1.0); // Bipartite
    
    g.addEdge({"3", "A", "C", 1.0, "road"}); // makes cycle of length 3 (odd cycle)
    auto result2 = Algorithms::checkBipartite(g);
    EXPECT_EQ(result2.cost, 0.0); // Not Bipartite
}

// Test Topological Sort
TEST(GraphAlgorithmsTest, TopologicalSortCycle) {
    Graph<CityNode, CityEdge> g(true); // directed graph
    g.addNode("A", {"A", "A", 0, 0, "int"});
    g.addNode("B", {"B", "B", 0, 0, "int"});
    
    g.addEdge({"1", "A", "B", 1.0, "road"});
    g.addEdge({"2", "B", "A", 1.0, "road"}); // cycle A -> B -> A
    
    auto result = Algorithms::topologicalSort(g);
    EXPECT_EQ(result.cost, -1); // error code for cycle
}
