# REST API Documentation

This document describes the REST API endpoints exposed by the C++ Pistache Server on port `8080` (reverse-proxied via Nginx on port `80`).

All requests and responses use JSON format (`application/json`) except where specified.

---

## 1. City Management Endpoints

### 1.1 Initialize City
- **Endpoint:** `POST /api/city/initialize`
- **Request Body:**
  ```json
  { "name": "Berlin" }
  ```
- **Response (200 OK):**
  ```json
  {
    "cityId": 1,
    "name": "Berlin",
    "status": "success"
  }
  ```

### 1.2 Add/Update Node
- **Endpoint:** `POST /api/city/addNode`
- **Request Body:**
  ```json
  {
    "cityId": 1,
    "id": "node1",
    "name": "Power Station A",
    "latitude": 52.5200,
    "longitude": 13.4050,
    "type": "power_station"
  }
  ```
- **Response (200 OK):**
  ```json
  { "status": "success" }
  ```

### 1.3 Add/Update Edge
- **Endpoint:** `POST /api/city/addEdge`
- **Request Body:**
  ```json
  {
    "cityId": 1,
    "source": "node1",
    "destination": "node2",
    "weight": 120.5,
    "type": "power_line"
  }
  ```
- **Response (200 OK):**
  ```json
  { "status": "success" }
  ```

### 1.4 Get Nodes
- **Endpoint:** `GET /api/city/nodes?cityId=1`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "node1",
      "name": "Power Station A",
      "latitude": 52.52,
      "longitude": 13.405,
      "type": "power_station"
    }
  ]
  ```

### 1.5 Get Edges
- **Endpoint:** `GET /api/city/edges?cityId=1`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "1",
      "source": "node1",
      "destination": "node2",
      "weight": 120.5,
      "type": "power_line"
    }
  ]
  ```

### 1.6 Delete Node
- **Endpoint:** `DELETE /api/city/node/:id?cityId=1`
- **Response (200 OK):**
  ```json
  { "status": "success" }
  ```

### 1.7 Delete Edge
- **Endpoint:** `DELETE /api/city/edge/:src/:dest?cityId=1&type=power_line`
- **Response (200 OK):**
  ```json
  { "status": "success" }
  ```

---

## 2. Algorithm Solver Endpoints

All algorithm execution requests follow this general shape. The C++ engine computes the result in real-time, stores the performance benchmark logs into PostgreSQL, and returns the animation trace steps.

- **Endpoints:**
  - `POST /api/algorithms/bfs`
  - `POST /api/algorithms/dfs`
  - `POST /api/algorithms/dijkstra`
  - `POST /api/algorithms/astar`
  - `POST /api/algorithms/bellmanford`
  - `POST /api/algorithms/floydwarshall`
  - `POST /api/algorithms/lee`
  - `POST /api/algorithms/prim`
  - `POST /api/algorithms/kruskal`
  - `POST /api/algorithms/topological`
  - `POST /api/algorithms/scc`
  - `POST /api/algorithms/bipartite`
  - `POST /api/algorithms/maxflow`
  - `POST /api/algorithms/aco`
  - `POST /api/algorithms/genetic`
  - `POST /api/algorithms/sa`

- **Request Body (Example for Dijkstra/A* Pathfinders):**
  ```json
  {
    "cityId": 1,
    "start": "node1",
    "end": "node2"
  }
  ```

- **Response Payload (200 OK):**
  ```json
  {
    "name": "Dijkstra Shortest Path",
    "executionTimeMs": 0.0825,
    "memoryUsageBytes": 4096,
    "path": ["node1", "node3", "node2"],
    "cost": 15.4,
    "timeComplexity": "O((V + E) log V)",
    "spaceComplexity": "O(V)",
    "steps": [
      {
        "type": "visit_node",
        "nodeId": "node1",
        "sourceId": "",
        "targetId": "",
        "value": 0,
        "queueState": ["node1"],
        "visited": ["node1"]
      },
      {
        "type": "examine_edge",
        "nodeId": "node3",
        "sourceId": "node1",
        "targetId": "node3",
        "value": 10,
        "queueState": ["node1"],
        "visited": ["node1"]
      }
    ]
  }
  ```

---

## 3. Analytics Endpoints

### 3.1 Get Graph Statistics
- **Endpoint:** `GET /api/analytics/stats?cityId=1`
- **Response (200 OK):**
  ```json
  {
    "nodes": 4,
    "edges": 3,
    "density": 0.25,
    "avgWeight": 45.5,
    "nodeTypes": {
      "intersection": 2,
      "power_station": 1,
      "water_source": 1
    }
  }
  ```

### 3.2 Get Historical Algorithm Benchmarks
- **Endpoint:** `GET /api/analytics/performance?cityId=1`
- **Response (200 OK):**
  ```json
  [
    {
      "algorithm": "Dijkstra Shortest Path",
      "runs": 8,
      "avgExecutionTimeMs": 0.095,
      "avgMemoryUsageBytes": 8192
    }
  ]
  ```

---

## 4. Export Endpoints

### 4.1 Export to JSON
- **Endpoint:** `POST /api/export/json?cityId=1`
- **Response (200 OK - JSON Payload):**
  ```json
  {
    "cityId": 1,
    "nodes": [...],
    "edges": [...]
  }
  ```

### 4.2 Export to CSV
- **Endpoint:** `POST /api/export/csv?cityId=1`
- **Response (200 OK - text/csv):**
  Returns formatted CSV sheets containing node locations and link attributes.
