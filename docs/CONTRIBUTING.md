# Contributor Guidelines

We welcome contributions to the Smart City DSA Simulator Platform. To ensure consistent code quality, scalability, and stability, please follow these guidelines.

---

## 1. Coding Standards

### 1.1 C++20 Core
- **Formatting:** Use Clang-Format with default LLVM style.
- **Resource Management:** Follow RAII. Avoid raw pointers (`new`/`delete`). Use smart pointers (`std::unique_ptr`, `std::shared_ptr`).
- **Templates:** Keep template code header-only inside `backend/include/`. Ensure all nodes subclass/match `CityNode` and edges match `CityEdge` structures.
- **Thread Safety:** Any modifications to graph topologies must lock using `std::unique_lock<std::shared_mutex>`, while queries must use `std::shared_lock<std::shared_mutex>`.

### 1.2 Frontend TypeScript/React
- **Formatting:** Prettier and ESLint are pre-configured. Run lint check before commit.
- **Functional Components:** Use functional components with hooks.
- **Redux:** Manage application-wide workspace changes (e.g. nodes list mutations) inside Redux Slices. Keep API fetching inside async thunks.

---

## 2. Testing Guidelines

Any new algorithm or graph helper must be covered by unit tests.

### 2.1 C++ Unit Tests (Google Test)
Write test cases in `backend/tests/GraphTests.cpp`.
Run tests locally via CMake:
```bash
cd backend/build
ctest --output-on-failure
```
Or run inside Docker:
```bash
docker compose exec backend graph_tests
```

### 2.2 Frontend UI Tests
Run Jest/React Testing Library tests:
```bash
cd frontend
npm run test
```

---

## 3. Pull Request Process

1. Fork the repo and create a feature branch (`feature/your-dsa-improvement`).
2. Make sure the backend builds cleanly and all Google Test suites pass.
3. Verify that your frontend code compiles: `npm run build` inside the `frontend/` directory.
4. Open a Pull Request detailing the changes, and attach performance logs (execution time and memory improvements) from the Analytics dashboard.
