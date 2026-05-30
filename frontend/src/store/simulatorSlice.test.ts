import { describe, it, expect } from 'vitest';
import simulatorReducer, { setAlgorithm, setStartNode, setSpeed } from './simulatorSlice';

describe('simulatorSlice', () => {
  const initialState = {
    isRunning: false,
    isPaused: false,
    isComputing: false,
    algorithm: 'dijkstra',
    startNode: '',
    endNode: '',
    speed: 250,
    currentStepIndex: 0,
    steps: [],
    path: [],
    cost: 0,
    executionTimeMs: 0,
    memoryUsageBytes: 0,
    timeComplexity: '',
    spaceComplexity: '',
    logs: [],
    error: null,
  };

  it('should handle initial state', () => {
    expect(simulatorReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setAlgorithm', () => {
    const actual = simulatorReducer(initialState, setAlgorithm('astar'));
    expect(actual.algorithm).toEqual('astar');
    expect(actual.steps).toEqual([]);
    expect(actual.currentStepIndex).toEqual(0);
  });

  it('should handle setStartNode', () => {
    const actual = simulatorReducer(initialState, setStartNode('A'));
    expect(actual.startNode).toEqual('A');
  });

  it('should handle setSpeed', () => {
    const actual = simulatorReducer(initialState, setSpeed(500));
    expect(actual.speed).toEqual(500);
  });
});
