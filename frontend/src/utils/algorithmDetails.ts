export interface AlgorithmMeta {
  id: string;
  name: string;
  shortName: string;
  category: string;
  paradigm: string;
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  smartCityRole: string;
  dataStructures: string[];
  color: string;
}

export const ALGORITHM_REGISTRY: Record<string, AlgorithmMeta> = {
  dijkstra: {
    id: 'dijkstra',
    name: "Dijkstra's Shortest Path",
    shortName: 'Dijkstra',
    category: 'Shortest Path',
    paradigm: 'Greedy Priority Queue',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    description: 'Computes mathematically exact minimum-cost paths from a source to destination using a min-heap priority queue to greedily explore the lowest-cost frontier.',
    smartCityRole: 'Emergency vehicle dispatching (ambulances, police) and GPS navigation through dynamic road networks based on physical distance weights.',
    dataStructures: ['std::priority_queue (Min-Heap)', 'std::unordered_map (Distances & Parents)', 'Adjacency List'],
    color: '#06b6d4',
  },
  astar: {
    id: 'astar',
    name: 'A* Directed Heuristic Search',
    shortName: 'A* Search',
    category: 'Heuristic Routing',
    paradigm: 'Informed Search (f = g + h)',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    description: 'Enhances Dijkstra with Euclidean distance heuristics, directing the search beam toward the destination to prune unneeded exploration.',
    smartCityRole: 'Real-time logistics routing, autonomous shuttles, and delivery fleet dispatch requiring rapid point-to-point path calculation.',
    dataStructures: ['Min-Priority Queue (f-score)', 'Euclidean Spatial Heuristic', 'std::unordered_map'],
    color: '#3b82f6',
  },
  bfs: {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    shortName: 'BFS',
    category: 'Graph Traversal',
    paradigm: 'Layer-by-Layer / FIFO Queue',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Explores vertices level-by-level using a FIFO queue, guaranteeing minimum-hop paths on unweighted network links.',
    smartCityRole: 'Evacuation reachability rings during flooding or gas leaks, and calculating transfer hops across public metro networks.',
    dataStructures: ['std::queue (FIFO)', 'std::unordered_set (Visited Set)', 'Adjacency List'],
    color: '#10b981',
  },
  dfs: {
    id: 'dfs',
    name: 'Depth-First Search (DFS)',
    shortName: 'DFS',
    category: 'Graph Traversal',
    paradigm: 'Recursive / LIFO Call Stack',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Traverses as deep as possible before backtracking. Essential for structural connectivity checks, cycle detection, and maze routing.',
    smartCityRole: 'Sanitation route loop inspection, pipeline network dead-end discovery, and structural connectivity audits.',
    dataStructures: ['std::vector (Call Stack / LIFO)', 'std::unordered_set (Visited Set)', 'Adjacency List'],
    color: '#8b5cf6',
  },
  bellmanford: {
    id: 'bellmanford',
    name: 'Bellman-Ford Algorithm',
    shortName: 'Bellman-Ford',
    category: 'Shortest Path',
    paradigm: 'Dynamic Programming / Edge Relaxation',
    timeComplexity: 'O(V · E)',
    spaceComplexity: 'O(V)',
    description: 'Iteratively relaxes all edges |V|-1 times, supporting graphs with negative edge weights and reliably catching negative weight cycles.',
    smartCityRole: 'Dynamic toll road pricing with congestion rebates or green-zone subsidies, and detecting pressure drop loops in municipal water systems.',
    dataStructures: ['Distance Array / Hash Map', 'Predecessor Pointer Array', 'Edge List'],
    color: '#f59e0b',
  },
  floydwarshall: {
    id: 'floydwarshall',
    name: 'Floyd-Warshall All-Pairs',
    shortName: 'Floyd-Warshall',
    category: 'All-Pairs Shortest Path',
    paradigm: 'Dynamic Programming (All-Pairs)',
    timeComplexity: 'O(V³)',
    spaceComplexity: 'O(V²)',
    description: 'Computes shortest paths between all pairs of vertices simultaneously by considering all possible intermediate transit nodes.',
    smartCityRole: 'Pre-computing citywide subway and bus rapid transit latency lookup matrices for instantaneous passenger routing apps.',
    dataStructures: ['2D Distance Matrix', '2D Next-Hop Predecessor Matrix'],
    color: '#ec4899',
  },
  lee: {
    id: 'lee',
    name: "Lee's Grid Wavefront Router",
    shortName: 'Lee Router',
    category: 'Grid Routing',
    paradigm: 'Breadth-First Wavefront Expansion',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Breadth-first wavefront expansion algorithm that guarantees finding the shortest obstacle-avoiding route across spatial cells.',
    smartCityRole: 'Underground utility trenching (cables, water pipes) and autonomous drone path planning around high-rise buildings and restricted zones.',
    dataStructures: ['Grid Map / Wavefront Queue', 'Parent Trace Matrix'],
    color: '#14b8a6',
  },
  prim: {
    id: 'prim',
    name: "Prim's Minimum Spanning Tree",
    shortName: "Prim's MST",
    category: 'Minimum Spanning Tree',
    paradigm: 'Greedy Vertex Expansion / Min-Heap',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    description: 'Grows a Minimum Spanning Tree from an origin vertex by greedily attaching the minimum-weight incident edge connecting to an unvisited node.',
    smartCityRole: 'Centralized municipal power distribution cabling and potable water distribution pipes radiating from a central treatment facility at minimum cost.',
    dataStructures: ['std::priority_queue (Min-Heap)', 'std::unordered_set (In-MST)', 'Parent Vector'],
    color: '#10b981',
  },
  kruskal: {
    id: 'kruskal',
    name: "Kruskal's Minimum Spanning Tree",
    shortName: "Kruskal's MST",
    category: 'Minimum Spanning Tree',
    paradigm: 'Disjoint Set Union (Union-Find) / Greedy',
    timeComplexity: 'O(E log E)',
    spaceComplexity: 'O(V)',
    description: 'Sorts all edges globally by weight and links disjoint components using Disjoint Set Union (DSU) with path compression, avoiding cycles.',
    smartCityRole: 'Designing regional high-speed fiber-optic backbones connecting distributed municipal precincts and smart IoT sensor towers.',
    dataStructures: ['Disjoint Set Union (Rank & Parent Arrays)', 'Sorted Edge Vector'],
    color: '#6366f1',
  },
  topological: {
    id: 'topological',
    name: 'Topological Dependency Sort',
    shortName: 'Topological Sort',
    category: 'Dependency Scheduling',
    paradigm: "DAG Linear Ordering (Kahn's In-Degree)",
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Computes a valid linear execution order for directed tasks such that every prerequisite action is performed before its downstream dependents.',
    smartCityRole: 'Sequencing smart city construction workflows (e.g. underground storm drain installation must precede asphalt surfacing and signal wiring).',
    dataStructures: ['std::unordered_map (In-Degree Map)', 'std::queue (Zero In-Degree Vertices)'],
    color: '#eab308',
  },
  scc: {
    id: 'scc',
    name: "Tarjan's Strongly Connected Components",
    shortName: "Tarjan's SCC",
    category: 'Component Analysis',
    paradigm: 'Single-Pass DFS / Low-Link Indices',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Partitions a directed graph into strongly connected components where every node within a component is bidirectionally reachable from every other.',
    smartCityRole: 'Analyzing smart power grid micro-networks and ring topology resilience to verify whether neighborhoods stay energized during line cuts.',
    dataStructures: ['DFS Discovery & Low-Link Arrays', 'Call Stack', 'On-Stack Hash Set'],
    color: '#a855f7',
  },
  bipartite: {
    id: 'bipartite',
    name: 'Bipartite Graph 2-Coloring',
    shortName: 'Bipartite Check',
    category: 'Graph Partitioning',
    paradigm: 'Alternating 2-Color BFS Traversal',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Checks if vertices can be divided into two disjoint sets such that no two nodes in the same set share an edge.',
    smartCityRole: 'Matching power generation stations directly to residential substations without inter-supplier conflicts, or pairing service vehicles to districts.',
    dataStructures: ['Color Mapping (0 / 1 / unvisited)', 'std::queue (BFS Alternating)'],
    color: '#f43f5e',
  },
  maxflow: {
    id: 'maxflow',
    name: 'Edmonds-Karp Maximum Flow',
    shortName: 'Max Flow',
    category: 'Network Flow',
    paradigm: 'Ford-Fulkerson Augmenting Paths via BFS',
    timeComplexity: 'O(V · E²)',
    spaceComplexity: 'O(V²)',
    description: 'Calculates the theoretical maximum throughput from source to sink by repeatedly finding shortest augmenting paths in the residual network.',
    smartCityRole: 'Water pipeline bottleneck discovery, sewage flow capacity simulation during flash floods, and telecom backhaul bandwidth stress testing.',
    dataStructures: ['Residual Capacity Matrix', 'BFS Parent Predecessor Vector'],
    color: '#0ea5e9',
  },
  aco: {
    id: 'aco',
    name: 'Ant Colony Optimization (ACO)',
    shortName: 'Ant Colony',
    category: 'Metaheuristic',
    paradigm: 'Swarm Intelligence / Pheromone Feedback',
    timeComplexity: 'O(G · A · V)',
    spaceComplexity: 'O(V²)',
    description: 'Stochastic swarm intelligence algorithm mimicking biological ants depositing pheromone trails to discover optimal routes across complex networks.',
    smartCityRole: 'Dynamic fleet routing for municipal waste collection and street sweepers navigating shifting traffic conditions.',
    dataStructures: ['Pheromone Matrix (τ)', 'Heuristic Attractiveness Matrix (η)', 'Ant Colony Memory'],
    color: '#d97706',
  },
  genetic: {
    id: 'genetic',
    name: 'Genetic Evolutionary Optimizer',
    shortName: 'Genetic Algorithm',
    category: 'Metaheuristic',
    paradigm: 'Evolutionary Crossover & Mutation',
    timeComplexity: 'O(G · P · V)',
    spaceComplexity: 'O(P · V)',
    description: 'Evolves a population of candidate path chromosomes using tournament selection, crossover, and random mutation to satisfy multi-constraint objectives.',
    smartCityRole: 'Multi-objective smart city trip planning (e.g. balancing speed against toll fees, road quality, and vehicle fuel/carbon footprint).',
    dataStructures: ['Chromosome Population Pool', 'Fitness Evaluator', 'Crossover Operator'],
    color: '#84cc16',
  },
  sa: {
    id: 'sa',
    name: 'Simulated Annealing',
    shortName: 'Simulated Annealing',
    category: 'Metaheuristic',
    paradigm: 'Physics Boltzmann Cooling / Stochastic Search',
    timeComplexity: 'O(S · V)',
    spaceComplexity: 'O(V)',
    description: 'Stochastic route optimization based on annealing metallurgy, probabilistic accepting worse moves at high temperatures to escape local optima.',
    smartCityRole: 'Emergency route optimization through heavily congested downtown sectors where classical greedy algorithms become trapped in local gridlocks.',
    dataStructures: ['Current & Candidate State Vectors', 'Boltzmann Acceptance Evaluator', 'Temperature Schedule'],
    color: '#ef4444',
  },
};

export const getAlgorithmDetails = (idOrName?: string): AlgorithmMeta => {
  if (!idOrName) return ALGORITHM_REGISTRY.dijkstra;
  const key = idOrName.toLowerCase().replace(/[^a-z]/g, '');

  if (ALGORITHM_REGISTRY[key]) {
    return ALGORITHM_REGISTRY[key];
  }

  // Fallback checks
  for (const [regKey, meta] of Object.entries(ALGORITHM_REGISTRY)) {
    if (key.includes(regKey) || meta.name.toLowerCase().includes(key) || meta.shortName.toLowerCase().includes(key)) {
      return meta;
    }
  }

  return {
    id: idOrName,
    name: idOrName.toUpperCase(),
    shortName: idOrName.toUpperCase(),
    category: 'Optimization / Traversal',
    paradigm: 'C++ Graph Core Algorithm',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Graph algorithm executed on the multithreaded C++20 core engine.',
    smartCityRole: 'Analyzes topology, connectivity, and shortest path weights in the municipal network.',
    dataStructures: ['std::vector', 'std::unordered_map'],
    color: '#06b6d4',
  };
};

