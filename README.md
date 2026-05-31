# Smart City DSA Simulator Platform

[![Backend CI](https://github.com/Rajmund09/smart-city-dsa-simulator/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Rajmund09/smart-city-dsa-simulator/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/Rajmund09/smart-city-dsa-simulator/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Rajmund09/smart-city-dsa-simulator/actions/workflows/frontend-ci.yml)

A world-class, production-ready, full-stack platform that transforms city graph network simulations. Built with a highly optimized C++20 core engine, Pistache REST API, PostgreSQL database, and a rich, visual React workspace utilizing React Flow.

Designed to simulate city infrastructure (roads, grids, water, rails) at massive scale (10,000+ nodes) with visual real-time algorithm tracing, performance benchmarking, and complex optimization modeling.

---

## Key Features

- **Interactive Simulation Canvas:** Drag-and-drop nodes, create physical link weights proportional to GPS distances, edit nodes (Intersections, Reservoirs, Power Stations), and draw networks visually.
- **15+ C++20 Graph Algorithms:** Built-in traversal, shortest paths, MSTs, and flow optimization, along with advanced heuristics (Ant Colony, Genetic, Simulated Annealing).
- **Apple-Level Visual Data Streams:** Organic Bezier-curved edges with high-performance glowing SVG data packets pulsing sequentially along computed routes. 
- **Synchronized Audio Tracing:** Integrated Web Audio API synchronization that plays futuristic UI sweep tones during algorithm steps and a success arpeggio when paths are resolved.
- **Neumorphic & Claymorphic Aesthetic:** An ultra-premium "Claymorphic" user interface using Tailwind CSS and Framer Motion for deep shadows, tactile controls, and immersive dark/light themes.
- **Enterprise Analytics Dashboard:** Performance metrics comparing execution times, peak RSS memory consumption, and infrastructure counts plotted responsively using Recharts.
- **Robust Testing & CI/CD Pipeline:** Fully automated GitHub Actions workflows executing comprehensive C++ GoogleTest backend suites (BFS, DFS, A*, Bellman-Ford) and React component Vitests.
- **SaaS-Grade DevOps Integration:** Single-command setup using Docker Compose (Nginx, C++ Pistache Server, Postgres Alpine).
- **Undo/Redo & Import/Export:** Time-travel workspace edits with full CSV and JSON schema imports/exports.

---

## Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind | Neumorphic/Claymorphic UI, Custom Themes |
| **Canvas** | React Flow, Framer Motion | Smooth Bezier curves, animated SVG glow streams |
| **Audio API** | Web Audio Context | Procedural algorithm tracing sounds |
| **State** | Redux Toolkit, React Query | Sync caching, undo/redo states |
| **Backend API** | C++20, Pistache, spdlog, CMake | Multithreaded REST handling, fast routing |
| **Graph Core** | C++20 Template engine | Thread-safe `Graph<V,E>` with `std::shared_mutex` |
| **Database** | PostgreSQL 15, libpqxx | Parameterized transactions, performance indexing |
| **DevOps** | Docker, Compose, Nginx | Multi-stage slim image building, reverse-proxying |

---

## Directory Structure

```
smart-city-platform/
├── backend/            # C++20 REST API & Graph Engine
│   ├── include/        # Thread-safe Graph.hpp, Algorithms.hpp, Database.hpp
│   ├── src/            # Server.cpp, Database.cpp
│   ├── tests/          # Google Test suite GraphTests.cpp
│   └── CMakeLists.txt  # C++20 build pipeline
├── frontend/           # React 18 TypeScript Dashboard Client
│   ├── src/            # Redux store, React Flow Canvas, Analytics
│   ├── nginx.conf      # Routing configuration
│   └── Dockerfile      # Multi-stage production build
├── docker/             # Nginx reverse proxy configuration
├── scripts/            # Database schema.sql definitions
├── docs/               # Technical and design documentation guides
└── docker-compose.yml  # Microservices orchestration configuration
```

---

## Quick Start (Docker Setup)

Ensure you have **Docker** and **Docker Desktop** installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rajmund09/smart-city-dsa-simulator.git
   cd smart-city-dsa-simulator
   ```

2. **Boot the entire platform:**
   ```bash
   docker compose up --build
   ```

3. **Open browser:**
   Go to [http://localhost](http://localhost) to open the interactive frontend dashboard. The Nginx proxy will automatically route frontend files and proxy API calls to [http://localhost:8080](http://localhost:8080).

4. **Run Backend Tests (inside Docker):**
   ```bash
   docker compose exec backend graph_tests
   ```

---

## Detailed Documentation

- [Architecture & Design Details](file:///c:/Users/prabh/OneDrive/Documents/GitHub/smart-city-dsa-simulator/docs/ARCHITECTURE.md)
- [C++20 Graph Algorithms Guide](file:///c:/Users/prabh/OneDrive/Documents/GitHub/smart-city-dsa-simulator/docs/ALGORITHMS.md)
- [REST API Endpoint Specs](file:///c:/Users/prabh/OneDrive/Documents/GitHub/smart-city-dsa-simulator/docs/API_DOCUMENTATION.md)
- [Local Installation Guide](file:///c:/Users/prabh/OneDrive/Documents/GitHub/smart-city-dsa-simulator/docs/INSTALLATION.md)
- [Production Deployment Guide](file:///c:/Users/prabh/OneDrive/Documents/GitHub/smart-city-dsa-simulator/docs/DEPLOYMENT.md)
- [Developer Onboarding & Contributing](file:///c:/Users/prabh/OneDrive/Documents/GitHub/smart-city-dsa-simulator/docs/CONTRIBUTING.md)
