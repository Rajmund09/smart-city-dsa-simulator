import { BaseEdge, getBezierPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';

export default function AnimatedFlowEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) {
  // Use elegant organic Bezier curves instead of rigid straight lines
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.isActive;
  const isReversed = data?.isReversed;
  const isPath = data?.isPath;

  return (
    <>
      {/* Base Edge Line */}
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={{
          ...style,
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }} 
        markerEnd={markerEnd} 
        className={isActive ? 'clay-edge-active' : (isPath ? 'clay-edge-path' : 'clay-edge')}
      />

      {/* Stream of glowing data packets for the final path (Apple/Stripe style) */}
      {isPath && (
        <g>
          {[0, 0.33, 0.66].map((delay, i) => (
            <g key={i}>
              <circle r="4" fill="#10b981" filter="drop-shadow(0 0 6px #10b981)" />
              <circle r="1.5" fill="#ffffff" />
              <animateMotion 
                dur="1.5s" 
                begin={`${delay * 1.5}s`} 
                repeatCount="indefinite" 
                path={edgePath} 
                keyPoints={isReversed ? "1;0" : "0;1"}
                keyTimes="0;1"
                calcMode="linear"
              />
            </g>
          ))}
        </g>
      )}
      
      {/* Hyper-premium blazing active particle (Algorithm scanning) */}
      {isActive && (
        <g>
          <circle r="16" fill="#f79c80" opacity="0.25" filter="blur(6px)" />
          <circle r="8" fill="#e55a36" opacity="0.6" filter="blur(2px)" />
          <circle r="3.5" fill="#ffffff" filter="drop-shadow(0 0 10px #f79c80)" />
          <animateMotion 
            dur="0.6s" 
            repeatCount="indefinite" 
            path={edgePath} 
            keyPoints={isReversed ? "1;0" : "0;1"}
            keyTimes="0;1"
            calcMode="linear"
          />
        </g>
      )}
    </>
  );
}
