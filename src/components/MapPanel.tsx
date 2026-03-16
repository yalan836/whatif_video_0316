import React, { useEffect, useState, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { LocationNode, MapEdge } from '../types';

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  status: 'current' | 'visited' | 'unknown';
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string;
  target: string;
}

interface MapPanelProps {
  nodes: LocationNode[];
  edges: MapEdge[];
  currentId: string;
  language: 'en' | 'zh';
  weather: string;
  onNodeClick: (node: LocationNode) => void;
}

export const MapPanel: React.FC<MapPanelProps> = ({ nodes, edges, currentId, language, weather, onNodeClick }) => {
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        setTransform(event.transform);
      });
    svg.call(zoom);
  }, [dimensions]);

  useEffect(() => {
    if (dimensions.width === 0) return;

    const initialNodes: SimNode[] = nodes.map(n => ({ ...n }));
    const initialLinks: SimLink[] = edges.map(e => ({ source: e.from, target: e.to }));

    const simulation = d3.forceSimulation<SimNode>(initialNodes)
      .force("link", d3.forceLink<SimNode, SimLink>(initialLinks).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collision", d3.forceCollide().radius(50))
      .on("tick", () => {
        setSimNodes([...simulation.nodes()]);
      });

    return () => simulation.stop();
  }, [nodes, edges, dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-celestial-dark/10 rounded-xl border border-[#d4b595]/10 p-4 overflow-hidden flex flex-col frosted-glass cursor-move">
      <div className="flex justify-between items-center mb-2 z-10 pointer-events-none">
        <h3 className="text-[10px] font-bold text-[#f5e6d3] uppercase tracking-widest">
          {language === 'zh' ? '星图拓扑' : 'Star Chart Topology'}
        </h3>
        <div className="flex gap-2 text-[8px] text-[#d4b595]/40">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#f5e6d3] shadow-[0_0_5px_#f5e6d3]" /> {language === 'zh' ? '当前' : 'Current'}</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#d4b595]/60" /> {language === 'zh' ? '已访问' : 'Visited'}</span>
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#d4b595]/20" /> {language === 'zh' ? '未知' : 'Unknown'}</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Weather Overlays */}
        {(weather.includes('雨') || weather.toLowerCase().includes('rain')) && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-80">
            {Array.from({ length: 60 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute text-[#f5e6d3] text-xs font-bold animate-rain drop-shadow-md"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-${Math.random() * 20 + 10}%`,
                  animationDuration: `${0.5 + Math.random() * 0.4}s`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              >
                {Math.random() > 0.5 ? '|' : '/'}
              </div>
            ))}
          </div>
        )}

        {(weather.includes('雾') || weather.toLowerCase().includes('fog')) && (
          <div 
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              maskImage: 'radial-gradient(circle at center, transparent 15%, black 60%)',
              WebkitMaskImage: 'radial-gradient(circle at center, transparent 15%, black 60%)',
              background: 'radial-gradient(circle at center, transparent 20%, rgba(26, 15, 10, 0.4) 80%)'
            }}
          />
        )}

        <svg 
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
        >
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
            {edges.map((edge, i) => {
              const source = simNodes.find(n => n.id === edge.from);
              const target = simNodes.find(n => n.id === edge.to);
              if (!source || !target) return null;

              const isFoggy = weather.includes('雾') || weather.toLowerCase().includes('fog');
              const isAdjacent = source.id === currentId || target.id === currentId;
              if (isFoggy && !isAdjacent) return null;

              return (
                <line
                  key={`${edge.from}-${edge.to}-${i}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="rgba(212, 181, 149, 0.2)"
                  strokeWidth={1 / transform.k}
                  strokeDasharray="4,4"
                />
              );
            })}
            
            {simNodes.map(node => {
              const isFoggy = weather.includes('雾') || weather.toLowerCase().includes('fog');
              const isAdjacent = edges.some(e => (e.from === currentId && e.to === node.id) || (e.to === currentId && e.from === node.id)) || node.id === currentId;
              if (isFoggy && !isAdjacent) return null;

              const isCurrent = node.id === currentId;

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x},${node.y})`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeClick(node as any);
                  }}
                >
                  {/* Node Core */}
                  <circle
                    r={4 / transform.k}
                    className={`transition-all duration-500 ${
                      isCurrent 
                        ? 'fill-[#f5e6d3]' 
                        : node.status === 'visited'
                          ? 'fill-[#d4b595]/60'
                          : 'fill-[#d4b595]/20'
                    }`}
                  />
                  
                  {/* Decorative Rings */}
                  <circle
                    r={12 / transform.k}
                    fill="none"
                    stroke={isCurrent ? 'rgba(245, 230, 211, 0.4)' : 'rgba(212, 181, 149, 0.1)'}
                    strokeWidth={1 / transform.k}
                    className={isCurrent ? 'animate-pulse' : 'group-hover:stroke-[#d4b595]/30'}
                  />

                  {/* Label */}
                  <text
                    y={20 / transform.k}
                    textAnchor="middle"
                    className={`text-[9px] tracking-wider transition-all duration-300 pointer-events-none select-none ${
                      isCurrent 
                        ? 'fill-[#f5e6d3] font-bold opacity-100' 
                        : 'fill-[#d4b595]/60 group-hover:fill-[#d4b595] opacity-80 group-hover:opacity-100'
                    }`}
                    style={{ fontSize: `${9 / transform.k}px` }}
                  >
                    {(node.status === 'unknown' && !isCurrent && isFoggy) ? '???' : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
