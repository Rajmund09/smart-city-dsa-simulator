# 🏙 Smart City DSA Simulator

A modular Smart City Management Simulator built in C++ implementing core Data Structures and Algorithms from beginner to advanced level.

---

## 📌 Current Module (v0.1.0)

✔ Directed Graph implementation  
✔ Adjacency List representation  
✔ BFS traversal (returns traversal order)  
✔ DFS traversal (recursive helper)  
✔ Exception handling  
✔ Time Complexity: O(V + E)

---

## 📁 Project Structure

smart-city-dsa-simulator/
│
├── include/
│ └── Graph.h
│
├── src/
│ ├── Graph.cpp
│ └── main.cpp
│
└── .vscode/


---

## ⚙ Build & Run

```bash
g++ -std=c++20 src/main.cpp src/Graph.cpp -I include -o main
./main

