import { describe, it, expect } from 'vitest';
import { getAlgorithmDetails, ALGORITHM_REGISTRY } from './algorithmDetails';

describe('algorithmDetails registry', () => {
  it('returns valid details for dijkstra', () => {
    const details = getAlgorithmDetails('dijkstra');
    expect(details.name).toContain('Dijkstra');
    expect(details.category).toBe('Shortest Path');
    expect(details.dataStructures).toContain('std::priority_queue (Min-Heap)');
  });

  it('returns valid details for astar', () => {
    const details = getAlgorithmDetails('astar');
    expect(details.shortName).toBe('A* Search');
    expect(details.paradigm).toContain('Informed Search');
  });

  it('handles case-insensitivity and formatting', () => {
    const details = getAlgorithmDetails('BELLMANFORD');
    expect(details.id).toBe('bellmanford');
    expect(details.name).toBe('Bellman-Ford Algorithm');
  });

  it('provides sensible fallback for unknown algorithms', () => {
    const details = getAlgorithmDetails('custom_heuristics');
    expect(details.category).toBe('Optimization / Traversal');
    expect(details.timeComplexity).toBe('O(V + E)');
  });

  it('contains all 16 registered municipal algorithms', () => {
    const registeredKeys = Object.keys(ALGORITHM_REGISTRY);
    expect(registeredKeys.length).toBeGreaterThanOrEqual(16);
    expect(registeredKeys).toContain('prim');
    expect(registeredKeys).toContain('kruskal');
    expect(registeredKeys).toContain('maxflow');
    expect(registeredKeys).toContain('aco');
    expect(registeredKeys).toContain('genetic');
  });
});
