# Local Installation Guide

This document describes how to set up your local development environment to build and run the Smart City DSA Simulator Platform.

---

## Method 1: Docker (Recommended)

This is the easiest setup since the C++ Pistache server requires a Linux environment.

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS/Linux).

### Run Command
In the root directory of the project, run:
```bash
docker compose up --build
```
This single command:
1. Installs compilation toolchains and libraries in a Linux compiler container.
2. Boots up PostgreSQL and runs database migrations.
3. Compiles the C++ server.
4. Compiles the React + TypeScript app and hosts it through an Nginx proxy.

Open your browser at `http://localhost`.

---

## Method 2: Manual Local Build (Linux / WSL)

If you wish to edit and build the backend C++ application natively without Docker, you will need a Linux machine or Windows Subsystem for Linux (WSL) running Ubuntu.

### 1. Install System Dependencies
Update packages and install compiler tools (including Meson):
```bash
sudo apt update
sudo apt install -y build-essential cmake ninja-build meson pkg-config libpqxx-dev libpq-dev libspdlog-dev libgtest-dev libssl-dev git
```

### 2. Build Pistache from Source
Pistache uses Meson for its build and installation flow:
```bash
git clone https://github.com/pistacheio/pistache.git /tmp/pistache
cd /tmp/pistache
meson setup build
meson compile -C build
sudo meson install -C build
```

### 3. Setup PostgreSQL
Install and run PostgreSQL locally:
```bash
sudo apt install -y postgresql
sudo service postgresql start

# Create user and database
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '<your_secure_password>';"
sudo -u postgres psql -c "CREATE DATABASE smart_city;"
```

### 4. Build C++ Backend
```bash
cd backend
mkdir build && cd build
cmake -G Ninja -DCMAKE_BUILD_TYPE=Debug ..
ninja
```
Run tests:
```bash
ctest --output-on-failure
```
Start server:
```bash
./smart_city_server
```

### 5. Setup Frontend
Ensure you have Node.js (v18+) installed.
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Vite will proxy API calls to the local C++ server on port 8080.
