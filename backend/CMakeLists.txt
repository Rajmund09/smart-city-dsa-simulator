cmake_minimum_required(VERSION 3.22)
project(SmartCityDSABackend VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find system libraries
find_package(PkgConfig REQUIRED)
find_package(Threads REQUIRED)

# Pistache REST Framework
pkg_check_modules(PISTACHE REQUIRED IMPORTED_TARGET libpistache)

# spdlog
find_package(spdlog REQUIRED)

# PostgreSQL client and C++ wrapper libpqxx
find_package(PostgreSQL REQUIRED)
pkg_check_modules(PQXX REQUIRED IMPORTED_TARGET libpqxx)

# JSON library (header-only, download via FetchContent)
include(FetchContent)
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.3
)
FetchContent_MakeAvailable(json)

# Interface library for Graph and Algorithms (header-only engine)
add_library(graph_engine INTERFACE)
target_include_directories(graph_engine INTERFACE include)
target_link_libraries(graph_engine INTERFACE nlohmann_json::nlohmann_json)

# REST Server Executable
add_executable(smart_city_server
    src/Database.cpp
    src/Server.cpp
)
target_include_directories(smart_city_server PRIVATE include)
target_link_libraries(smart_city_server PRIVATE
    graph_engine
    PkgConfig::PISTACHE
    PostgreSQL::PostgreSQL
    PkgConfig::PQXX
    spdlog::spdlog
    Threads::Threads
)

# Test Suite Executable
enable_testing()
find_package(GTest REQUIRED)

add_executable(graph_tests
    tests/GraphTests.cpp
)
target_include_directories(graph_tests PRIVATE include)
target_link_libraries(graph_tests PRIVATE
    graph_engine
    GTest::gtest_main
    Threads::Threads
)

include(GoogleTest)
gtest_discover_tests(graph_tests)
