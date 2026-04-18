# Graph Algorithms Reference Guide

This document lists all 15 algorithms implemented inside the C++20 Core Algorithm Engine (`Algorithms.hpp`), explaining their operation, time/space complexities, and role in smart city simulation.

---

## 1. Traversals

### 1.1 Breadth-First Search (BFS)
- **Time Complexity:** $\mathcal{O}(V + E)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Layer-by-layer traversal. Used to analyze network expansions and hop-based distance queries.

### 1.2 Depth-First Search (DFS)
- **Time Complexity:** $\mathcal{O}(V + E)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Depth-based recursive search. Used for topological ordering and tracking structural connectivity paths.

---

## 2. Shortest Paths

### 2.1 Dijkstra's Algorithm
- **Time Complexity:** $\mathcal{O}((V + E) \log V)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Computes the single-source shortest path on weighted graphs. Ideal for road traffic travel and navigation routing.

### 2.2 A* Pathfinding Heuristic
- **Time Complexity:** $\mathcal{O}((V + E) \log V)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Optimizes Dijkstra's using a spatial heuristic: $f(n) = g(n) + h(n)$, where $h(n)$ is the Euclidean distance between nodes. Speeds up routing calculations in city grids.

### 2.3 Bellman-Ford
- **Time Complexity:** $\mathcal{O}(V \cdot E)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Computes shortest paths while supporting negative weights and detecting negative weight cycles. Useful for currency routing and toll cost optimization.

### 2.4 Floyd-Warshall
- **Time Complexity:** $\mathcal{O}(V^3)$
- **Space Complexity:** $\mathcal{O}(V^2)$
- **Purpose:** Computes all-pairs shortest paths using dynamic programming. Used to pre-calculate global transit latency tables.

### 2.5 Lee Algorithm (Grid BFS)
- **Time Complexity:** $\mathcal{O}(V + E)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** BFS-based pathfinding optimized for grid maps. Finds the shortest path in unweighted or uniform cell grids.

---

## 3. Minimum Spanning Trees (MST)

### 3.1 Prim's Algorithm
- **Time Complexity:** $\mathcal{O}((V + E) \log V)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Builds the MST by expanding a single connected component. Ideal for planning centralized utility grids (power, water, fiber).

### 3.2 Kruskal's Algorithm
- **Time Complexity:** $\mathcal{O}(E \log E)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Builds the MST by sorting all edges and using Disjoint Set Union (DSU) to prevent cycles. Best for connecting disconnected regions.

---

## 4. Advanced Graph Operations

### 4.1 Topological Sort
- **Time Complexity:** $\mathcal{O}(V + E)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Orders nodes linearly such that for every directed edge $u \to v$, $u$ comes before $v$. Used to model construction dependency pipelines.

### 4.2 Tarjan's Strongly Connected Components (SCC)
- **Time Complexity:** $\mathcal{O}(V + E)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Finds SCCs in directed graphs using a single DFS traversal. Useful for analyzing isolation loops in power grids.

### 4.3 Bipartite Checking
- **Time Complexity:** $\mathcal{O}(V + E)$
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Verifies if a graph can be 2-colored. Used to model supply-demand bipartitions (e.g. matching consumers to power generation sources).

### 4.4 Edmonds-Karp Max Flow (Ford-Fulkerson)
- **Time Complexity:** $\mathcal{O}(V \cdot E^2)$
- **Space Complexity:** $\mathcal{O}(V^2)$
- **Purpose:** Calculates the maximum flow passing from a source to a sink. Ideal for analyzing water pipe capacity, sewage flows, and telecom bandwidth.

---

## 5. Metaheuristic Optimizers (Shortest Paths)

### 5.1 Ant Colony Optimization (ACO)
- **Time Complexity:** $\mathcal{O}(G \cdot A \cdot V)$ (Generations $\times$ Ants $\times$ Nodes)
- **Space Complexity:** $\mathcal{O}(V^2)$
- **Purpose:** Swarm intelligence algorithm mimicking ants depositing pheromone trails. Finds paths in dynamically changing road grids.

### 5.2 Genetic Algorithm (GA)
- **Time Complexity:** $\mathcal{O}(G \cdot P \cdot V)$ (Generations $\times$ Population $\times$ Nodes)
- **Space Complexity:** $\mathcal{O}(P \cdot V)$
- **Purpose:** Evolution-based search. Evaluates path chromosomes using crossovers and mutations. Used for multi-objective optimization (e.g., minimizing distance while avoiding traffic tolls).

### 5.3 Simulated Annealing (SA)
- **Time Complexity:** $\mathcal{O}(S \cdot V)$ (Steps $\times$ Nodes)
- **Space Complexity:** $\mathcal{O}(V)$
- **Purpose:** Physics-inspired optimization that accepts worse moves with a Boltzmann probability to escape local minima. Useful for route search under severe congestion.
