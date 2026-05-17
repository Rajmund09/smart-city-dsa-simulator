#include <version>
#include <source_location>
#ifdef __cpp_lib_source_location
#undef __cpp_lib_source_location
#endif
#include <pistache/endpoint.h>
#include <pistache/router.h>
#include <pistache/http.h>
#include <spdlog/spdlog.h>
#include <nlohmann/json.hpp>
#include "Database.hpp"
#include "Algorithms.hpp"
#include <memory>
#include <sstream>

using namespace Pistache;
using json = nlohmann::json;

class SmartCityServer {
private:
    std::shared_ptr<Http::Endpoint> httpEndpoint;
    Rest::Router router;
    std::shared_ptr<Database> db;

    // Helper to extract cityId query parameter
    int getCityIdQuery(const Rest::Request& request) {
        auto cityQuery = request.query().get("cityId");
        if (!cityQuery.has_value()) {
            throw std::invalid_argument("Missing 'cityId' query parameter.");
        }
        return std::stoi(cityQuery.value());
    }

    // Helper to load graph from Database by reference (avoid copy/move on locks)
    void loadGraphFromDb(int cityId, Graph<CityNode, CityEdge>& graph) {
        auto nodes = db->getNodes(cityId);
        for (const auto& node : nodes) {
            graph.addNode(node.id, node);
        }

        auto edges = db->getEdges(cityId);
        for (const auto& edge : edges) {
            graph.addEdge(edge);
        }
    }

    // CORS wrapper handler
    class CORSHandler : public Http::Handler {
    private:
        Rest::Router& router;

    public:
        HTTP_PROTOTYPE(CORSHandler)

        CORSHandler(Rest::Router& r) : router(r) {}

        void onRequest(const Http::Request& request, Http::ResponseWriter response) override {
            response.headers().add<Http::Header::AccessControlAllowOrigin>("*");
            response.headers().add<Http::Header::AccessControlAllowMethods>("GET, POST, OPTIONS, DELETE, PUT");
            response.headers().add<Http::Header::AccessControlAllowHeaders>("Content-Type, Authorization");

            if (request.method() == Http::Method::Options) {
                response.send(Http::Code::Ok, "");
                return;
            }

            router.route(request, std::move(response));
        }
    };

public:
    explicit SmartCityServer(Address addr, std::shared_ptr<Database> database)
        : httpEndpoint(std::make_shared<Http::Endpoint>(addr)), db(database) {}

    void init(size_t thr = 2) {
        auto opts = Http::Endpoint::options().threads(static_cast<int>(thr));
        httpEndpoint->init(opts);
        setupRoutes();
    }

    void start() {
        httpEndpoint->setHandler(std::make_shared<CORSHandler>(router));
        spdlog::info("API Server started on port 8080.");
        httpEndpoint->serve();
    }

private:
    void setupRoutes() {
        using namespace Rest;

        // City endpoints
        Routes::Post(router, "/api/city/initialize", Routes::bind(&SmartCityServer::handleCityInitialize, this));
        Routes::Post(router, "/api/city/addNode", Routes::bind(&SmartCityServer::handleCityAddNode, this));
        Routes::Post(router, "/api/city/addEdge", Routes::bind(&SmartCityServer::handleCityAddEdge, this));
        Routes::Get(router, "/api/city/nodes", Routes::bind(&SmartCityServer::handleCityGetNodes, this));
        Routes::Get(router, "/api/city/edges", Routes::bind(&SmartCityServer::handleCityGetEdges, this));
        Routes::Get(router, "/api/city/list", Routes::bind(&SmartCityServer::handleCityList, this));
        Routes::Delete(router, "/api/city/node/:id", Routes::bind(&SmartCityServer::handleCityDeleteNode, this));
        Routes::Delete(router, "/api/city/edge/:src/:dest", Routes::bind(&SmartCityServer::handleCityDeleteEdge, this));

        // Algorithm endpoints
        Routes::Post(router, "/api/algorithms/bfs", Routes::bind(&SmartCityServer::handleBfs, this));
        Routes::Post(router, "/api/algorithms/dfs", Routes::bind(&SmartCityServer::handleDfs, this));
        Routes::Post(router, "/api/algorithms/dijkstra", Routes::bind(&SmartCityServer::handleDijkstra, this));
        Routes::Post(router, "/api/algorithms/astar", Routes::bind(&SmartCityServer::handleAstar, this));
        Routes::Post(router, "/api/algorithms/bellmanford", Routes::bind(&SmartCityServer::handleBellmanFord, this));
        Routes::Post(router, "/api/algorithms/floydwarshall", Routes::bind(&SmartCityServer::handleFloydWarshall, this));
        Routes::Post(router, "/api/algorithms/lee", Routes::bind(&SmartCityServer::handleLee, this));
        Routes::Post(router, "/api/algorithms/prim", Routes::bind(&SmartCityServer::handlePrim, this));
        Routes::Post(router, "/api/algorithms/kruskal", Routes::bind(&SmartCityServer::handleKruskal, this));
        Routes::Post(router, "/api/algorithms/topological", Routes::bind(&SmartCityServer::handleTopological, this));
        Routes::Post(router, "/api/algorithms/scc", Routes::bind(&SmartCityServer::handleSCC, this));
        Routes::Post(router, "/api/algorithms/bipartite", Routes::bind(&SmartCityServer::handleBipartite, this));
        Routes::Post(router, "/api/algorithms/maxflow", Routes::bind(&SmartCityServer::handleMaxFlow, this));
        Routes::Post(router, "/api/algorithms/aco", Routes::bind(&SmartCityServer::handleACO, this));
        Routes::Post(router, "/api/algorithms/genetic", Routes::bind(&SmartCityServer::handleGenetic, this));
        Routes::Post(router, "/api/algorithms/sa", Routes::bind(&SmartCityServer::handleSA, this));

        // Analytics endpoints
        Routes::Get(router, "/api/analytics/stats", Routes::bind(&SmartCityServer::handleAnalyticsStats, this));
        Routes::Get(router, "/api/analytics/performance", Routes::bind(&SmartCityServer::handleAnalyticsPerformance, this));
        
        // Export endpoints
        Routes::Post(router, "/api/export/json", Routes::bind(&SmartCityServer::handleExportJson, this));
        Routes::Post(router, "/api/export/csv", Routes::bind(&SmartCityServer::handleExportCsv, this));
    }

    // --- City Handlers ---

    void handleCityInitialize(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            std::string cityName = body.at("name").get<std::string>();
            int cityId = db->initializeCity(cityName);
            
            json res = {{"cityId", cityId}, {"name", cityName}, {"status", "success"}};
            response.send(Http::Code::Ok, res.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleCityAddNode(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            CityNode node{
                .id = body.at("id").get<std::string>(),
                .name = body.at("name").get<std::string>(),
                .latitude = body.at("latitude").get<double>(),
                .longitude = body.at("longitude").get<double>(),
                .type = body.at("type").get<std::string>()
            };

            db->addNode(cityId, node);
            response.send(Http::Code::Ok, json{{"status", "success"}}.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleCityAddEdge(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            CityEdge edge{
                .id = body.value("id", ""),
                .source = body.at("source").get<std::string>(),
                .destination = body.at("destination").get<std::string>(),
                .weight = body.at("weight").get<double>(),
                .type = body.at("type").get<std::string>()
            };

            db->addEdge(cityId, edge);
            response.send(Http::Code::Ok, json{{"status", "success"}}.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleCityGetNodes(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            int cityId = getCityIdQuery(request);
            auto list = db->getNodes(cityId);
            
            json nodesJson = json::array();
            for (const auto& node : list) {
                nodesJson.push_back({
                    {"id", node.id},
                    {"name", node.name},
                    {"latitude", node.latitude},
                    {"longitude", node.longitude},
                    {"type", node.type}
                });
            }
            response.send(Http::Code::Ok, nodesJson.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleCityGetEdges(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            int cityId = getCityIdQuery(request);
            auto list = db->getEdges(cityId);
            
            json edgesJson = json::array();
            for (const auto& edge : list) {
                edgesJson.push_back({
                    {"id", edge.id},
                    {"source", edge.source},
                    {"destination", edge.destination},
                    {"weight", edge.weight},
                    {"type", edge.type}
                });
            }
            response.send(Http::Code::Ok, edgesJson.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleCityList(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto cities = db->getCities();
            json res = json::array();
            for (const auto& city : cities) {
                res.push_back({{"id", city.first}, {"name", city.second}});
            }
            response.send(Http::Code::Ok, res.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleCityDeleteNode(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            std::string id = request.param(":id").as<std::string>();
            int cityId = getCityIdQuery(request);
            db->deleteNode(cityId, id);
            response.send(Http::Code::Ok, json{{"status", "success"}}.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleCityDeleteEdge(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            std::string src = request.param(":src").as<std::string>();
            std::string dest = request.param(":dest").as<std::string>();
            int cityId = getCityIdQuery(request);
            auto typeQuery = request.query().get("type");
            std::string type = !typeQuery.has_value() ? "road" : typeQuery.value();

            db->deleteEdge(cityId, src, dest, type);
            response.send(Http::Code::Ok, json{{"status", "success"}}.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    // --- Algorithm Handlers ---

    void handleBfs(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::bfs(graph, start);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleDfs(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::dfs(graph, start);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleDijkstra(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();
            std::string end = body.at("end").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::dijkstra(graph, start, end);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleAstar(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();
            std::string end = body.at("end").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::aStar(graph, start, end);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleBellmanFord(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();
            std::string end = body.at("end").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::bellmanFord(graph, start, end);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleFloydWarshall(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();
            std::string end = body.at("end").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::floydWarshall(graph, start, end);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleLee(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();
            std::string end = body.at("end").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::leeAlgorithm(graph, start, end);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handlePrim(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.value("start", "");

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::prims(graph, start);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleKruskal(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::kruskals(graph);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleTopological(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();

            Graph<CityNode, CityEdge> graph(true); // Topological sort requires directed graph
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::topologicalSort(graph);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleSCC(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();

            Graph<CityNode, CityEdge> graph(true); // SCC runs on directed graph
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::tarjanSCC(graph);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleBipartite(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::checkBipartite(graph);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleMaxFlow(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string source = body.at("start").get<std::string>();
            std::string sink = body.at("end").get<std::string>();

            Graph<CityNode, CityEdge> graph(true); // Flow network is directed
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::maxFlow(graph, source, sink);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleACO(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();
            std::string end = body.at("end").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::antColonyOptimization(graph, start, end);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleGenetic(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();
            std::string end = body.at("end").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::geneticAlgorithm(graph, start, end);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleSA(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            auto body = json::parse(request.body());
            int cityId = body.at("cityId").get<int>();
            std::string start = body.at("start").get<std::string>();
            std::string end = body.at("end").get<std::string>();

            Graph<CityNode, CityEdge> graph;
            loadGraphFromDb(cityId, graph);
            auto res = Algorithms::simulatedAnnealing(graph, start, end);

            db->saveAlgorithmResult(cityId, res.name, res.executionTimeMs, res.memoryUsageBytes, res.toJson());
            response.send(Http::Code::Ok, res.toJson().dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    // --- Analytics Handlers ---

    void handleAnalyticsStats(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            int cityId = getCityIdQuery(request);
            auto stats = db->getAnalyticsStats(cityId);
            response.send(Http::Code::Ok, stats.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleAnalyticsPerformance(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            int cityId = getCityIdQuery(request);
            auto performance = db->getAnalyticsPerformance(cityId);
            response.send(Http::Code::Ok, performance.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    // --- Export Handlers ---

    void handleExportJson(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            int cityId = getCityIdQuery(request);
            auto nodes = db->getNodes(cityId);
            auto edges = db->getEdges(cityId);

            json nodesJson = json::array();
            for (const auto& node : nodes) {
                nodesJson.push_back({
                    {"id", node.id},
                    {"name", node.name},
                    {"latitude", node.latitude},
                    {"longitude", node.longitude},
                    {"type", node.type}
                });
            }

            json edgesJson = json::array();
            for (const auto& edge : edges) {
                edgesJson.push_back({
                    {"id", edge.id},
                    {"source", edge.source},
                    {"destination", edge.destination},
                    {"weight", edge.weight},
                    {"type", edge.type}
                });
            }

            json exportObj = {
                {"cityId", cityId},
                {"nodes", nodesJson},
                {"edges", edgesJson}
            };

            response.send(Http::Code::Ok, exportObj.dump(), MIME(Application, Json));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }

    void handleExportCsv(const Rest::Request& request, Http::ResponseWriter response) {
        try {
            int cityId = getCityIdQuery(request);
            auto nodes = db->getNodes(cityId);
            auto edges = db->getEdges(cityId);

            std::stringstream ss;
            ss << "--- NODES ---\n";
            ss << "id,name,latitude,longitude,type\n";
            for (const auto& node : nodes) {
                ss << node.id << "," << node.name << "," << node.latitude << "," << node.longitude << "," << node.type << "\n";
            }
            
            ss << "\n--- EDGES ---\n";
            ss << "id,source,destination,weight,type\n";
            for (const auto& edge : edges) {
                ss << edge.id << "," << edge.source << "," << edge.destination << "," << edge.weight << "," << edge.type << "\n";
            }

            response.send(Http::Code::Ok, ss.str(), Http::Mime::MediaType::fromString("text/csv"));
        } catch (const std::exception& e) {
            response.send(Http::Code::Bad_Request, json{{"error", e.what()}}.dump(), MIME(Application, Json));
        }
    }
};

int main() {
    // Setup spdlog console sink
    spdlog::set_pattern("[%Y-%m-%d %H:%M:%S.%e] [%l] %v");
    spdlog::info("Initializing Smart City DSA Simulator Platform Backend...");

    try {
        // Initialize PostgreSQL connection
        auto db = std::make_shared<Database>();
        db->connect();

        // Start Pistache API Server
        Address addr(Ipv4::any(), Port(8080));
        SmartCityServer server(addr, db);
        server.init(4); // 4 worker threads
        server.start();

    } catch (const std::exception& e) {
        spdlog::critical("Server startup failure: {}", e.what());
        return 1;
    }

    return 0;
}
