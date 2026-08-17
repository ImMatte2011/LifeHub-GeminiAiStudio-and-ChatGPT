import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Share2,
  Search,
  Filter,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  UserCheck,
  MapPin,
  Calendar,
  BookOpen,
  Building2,
  Tag as TagIcon,
  X,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { GraphData, GraphNode, GraphEdge, LinkType, Tag } from '../../types/index.js';
import { api } from '../../services/api.js';

interface RelationshipGraphViewProps {
  onSelectEntity: (id: string) => void;
}

export const RelationshipGraphView: React.FC<RelationshipGraphViewProps> = ({ onSelectEntity }) => {
  const [data, setData] = useState<GraphData>({
    nodes: [],
    edges: [],
    link_types: [],
    tags: [],
    total_nodes: 0,
    total_edges: 0,
  });

  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Link Creator Dialog State
  const [isLinking, setIsLinking] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState('');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkTypeId, setLinkTypeId] = useState('');
  const [linkNotes, setLinkNotes] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  // Canvas / SVG Transform & Simulation state
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Node physics coordinates state
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number; vx: number; vy: number }>>({});

  const loadGraph = async () => {
    setLoading(true);
    try {
      const res = await api.shared.getGraph({
        module_name: selectedModule !== 'all' ? selectedModule : undefined,
        tag_id: selectedTag !== 'all' ? selectedTag : undefined,
        search: searchQ.trim() || undefined,
      });
      setData(res);

      if (res.link_types.length > 0 && !linkTypeId) {
        setLinkTypeId(res.link_types[0].id);
      }

      // Initialize or preserve node positions in a circular / radial layout
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) * 0.65;

      setNodePositions((prev) => {
        const next: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
        const count = res.nodes.length;
        res.nodes.forEach((node, i) => {
          if (prev[node.id]) {
            next[node.id] = prev[node.id];
          } else {
            const angle = (i / Math.max(1, count)) * 2 * Math.PI;
            const dist = radius * (0.5 + 0.5 * Math.sin(i * 1.5));
            next[node.id] = {
              x: centerX + Math.cos(angle) * dist,
              y: centerY + Math.sin(angle) * dist,
              vx: 0,
              vy: 0,
            };
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to load graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [selectedModule, selectedTag]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGraph();
  };

  // Simple Spring Physics step on mount / update
  useEffect(() => {
    if (data.nodes.length === 0) return;

    let animFrame: number;
    let iterations = 0;
    const maxIterations = 60; // settle after 60 frames

    const runPhysics = () => {
      setNodePositions((prev) => {
        const next = { ...prev };
        const nodeIds = data.nodes.map((n) => n.id);
        const kRepel = 12000;
        const kAttract = 0.04;
        const targetDistance = 140;

        // 1. Repulsion between all pairs
        for (let i = 0; i < nodeIds.length; i++) {
          const id1 = nodeIds[i];
          const pos1 = next[id1];
          if (!pos1) continue;

          for (let j = i + 1; j < nodeIds.length; j++) {
            const id2 = nodeIds[j];
            const pos2 = next[id2];
            if (!pos2) continue;

            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            const force = kRepel / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (draggedNodeId !== id1) {
              pos1.x -= fx;
              pos1.y -= fy;
            }
            if (draggedNodeId !== id2) {
              pos2.x += fx;
              pos2.y += fy;
            }
          }
        }

        // 2. Attraction along edges
        data.edges.forEach((edge) => {
          const p1 = next[edge.source];
          const p2 = next[edge.target];
          if (!p1 || !p2) return;

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const delta = dist - targetDistance;

          const fx = (dx / dist) * delta * kAttract;
          const fy = (dy / dist) * delta * kAttract;

          if (draggedNodeId !== edge.source) {
            p1.x += fx;
            p1.y += fy;
          }
          if (draggedNodeId !== edge.target) {
            p2.x -= fx;
            p2.y -= fy;
          }
        });

        return next;
      });

      iterations++;
      if (iterations < maxIterations) {
        animFrame = requestAnimationFrame(runPhysics);
      }
    };

    animFrame = requestAnimationFrame(runPhysics);
    return () => cancelAnimationFrame(animFrame);
  }, [data.nodes.length, data.edges.length, draggedNodeId]);

  // Selected node info
  const selectedNode = useMemo(() => {
    return data.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [data.nodes, selectedNodeId]);

  // Connected edges and nodes for selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return data.edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [data.edges, selectedNodeId]);

  const getModuleBadgeColor = (mod: string) => {
    switch (mod) {
      case 'people':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', fill: '#3b82f6', icon: <UserCheck className="w-3.5 h-3.5" /> };
      case 'places':
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', fill: '#f59e0b', icon: <MapPin className="w-3.5 h-3.5" /> };
      case 'events':
        return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', fill: '#8b5cf6', icon: <Calendar className="w-3.5 h-3.5" /> };
      case 'knowledge':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', fill: '#10b981', icon: <BookOpen className="w-3.5 h-3.5" /> };
      case 'buildings':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', fill: '#f43f5e', icon: <Building2 className="w-3.5 h-3.5" /> };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', fill: '#64748b', icon: <Layers className="w-3.5 h-3.5" /> };
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkSourceId || !linkTargetId || !linkTypeId) {
      setLinkError('Please select both entities and a relationship type.');
      return;
    }
    if (linkSourceId === linkTargetId) {
      setLinkError('Cannot link an entity to itself.');
      return;
    }

    try {
      await api.shared.createLink(linkSourceId, linkTargetId, linkTypeId, linkNotes);
      setLinkSuccess('Relationship created successfully!');
      setLinkNotes('');
      setLinkError('');
      await loadGraph();
      setTimeout(() => {
        setLinkSuccess('');
        setIsLinking(false);
      }, 1500);
    } catch (err: any) {
      setLinkError(err.message);
    }
  };

  const handleOpenLinkModal = (sourceId?: string) => {
    if (sourceId) {
      setLinkSourceId(sourceId);
    } else if (selectedNodeId) {
      setLinkSourceId(selectedNodeId);
    } else if (data.nodes.length > 0) {
      setLinkSourceId(data.nodes[0].id);
    }

    if (data.nodes.length > 1) {
      const other = data.nodes.find((n) => n.id !== (sourceId || selectedNodeId));
      if (other) setLinkTargetId(other.id);
    }

    setIsLinking(true);
    setLinkError('');
    setLinkSuccess('');
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.2));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse drag handlers for canvas pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-canvas-bg') {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCanvas) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggedNodeId && nodePositions[draggedNodeId]) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setNodePositions((prev) => ({
        ...prev,
        [draggedNodeId]: { ...prev[draggedNodeId], x, y },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNodeId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-2xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Knowledge & Entity Graph
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {data.nodes.length} Nodes • {data.edges.length} Edges
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Universal interconnected network linking People, Places, Events, Knowledge Items, and Facilities.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenLinkModal()}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Connection
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Module Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Module:
          </span>
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'people', label: 'People' },
            { id: 'places', label: 'Places' },
            { id: 'events', label: 'Events' },
            { id: 'knowledge', label: 'Knowledge' },
            { id: 'buildings', label: 'Buildings' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedModule(m.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedModule === m.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-600 focus:bg-white w-48 sm:w-60"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Canvas & Inspector Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Graph Canvas Container (3 cols) */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl h-[620px] relative overflow-hidden select-none shadow-inner cursor-grab active:cursor-grabbing"
        >
          {/* Subtle Grid Background */}
          <div
            id="graph-canvas-bg"
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Floating Canvas Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Canvas SVG Renderer */}
          <svg
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="20"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
              </marker>
              <marker
                id="arrowhead-highlight"
                markerWidth="8"
                markerHeight="6"
                refX="20"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Edges (Lines) */}
            {data.edges.map((edge) => {
              const p1 = nodePositions[edge.source];
              const p2 = nodePositions[edge.target];
              if (!p1 || !p2) return null;

              const isHighlighted =
                selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g key={edge.id} className="transition-all">
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isHighlighted ? '#38bdf8' : '#334155'}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={isHighlighted ? undefined : '4 2'}
                    markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                  />
                  {/* Edge Label on hover or highlight */}
                  {isHighlighted && (
                    <text
                      x={midX}
                      y={midY - 6}
                      fill="#94a3b8"
                      fontSize="9"
                      textAnchor="middle"
                      className="font-mono bg-slate-900 px-1"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {data.nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isSelected = selectedNodeId === node.id;
              const isConnected =
                selectedNodeId &&
                data.edges.some(
                  (e) =>
                    (e.source === selectedNodeId && e.target === node.id) ||
                    (e.target === selectedNodeId && e.source === node.id)
                );

              const modStyle = getModuleBadgeColor(node.module_name);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedNodeId(node.id);
                    setSelectedNodeId(node.id);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Outer pulse when selected */}
                  {isSelected && (
                    <circle
                      r="30"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-spin"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={isSelected ? '22' : '18'}
                    fill={isSelected ? '#0284c7' : '#1e293b'}
                    stroke={isSelected ? '#38bdf8' : isConnected ? '#0ea5e9' : modStyle.fill}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all hover:scale-110 shadow-lg"
                  />

                  {/* Node Inner Dot Indicator */}
                  <circle r="4" fill={modStyle.fill} />

                  {/* Node Title Badge below circle */}
                  <foreignObject x="-60" y="24" width="120" height="40">
                    <div className="flex flex-col items-center justify-center text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md truncate max-w-[110px] border shadow-xs ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 font-bold'
                            : 'bg-slate-900/90 text-slate-200 border-slate-700/80 group-hover:border-slate-500'
                        }`}
                        title={node.title}
                      >
                        {node.title}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 capitalize">
                        {node.module_name}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {/* Quick Legend at bottom left */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-3">
            <span className="font-semibold text-slate-400 text-[10px] uppercase font-mono">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>People</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Places</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Events</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Knowledge</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Buildings</span>
            </div>
          </div>
        </div>

        {/* Node Inspector & Connections Panel (1 col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-[620px] overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                      getModuleBadgeColor(selectedNode.module_name).bg
                    } ${getModuleBadgeColor(selectedNode.module_name).text} border ${
                      getModuleBadgeColor(selectedNode.module_name).border
                    }`}
                  >
                    {selectedNode.module_name} • {selectedNode.entity_type}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedNode.title}</h3>
                {selectedNode.metaSnippet && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedNode.metaSnippet}</p>
                )}
              </div>

              {/* Tags */}
              {selectedNode.tags.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold uppercase text-slate-400 font-mono mb-1.5">
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.tags.map((t) => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Relationships */}
              <div>
                <div className="text-[11px] font-semibold uppercase text-slate-400 font-mono mb-2 flex items-center justify-between">
                  <span>Connections ({connectedEdges.length})</span>
                  <button
                    type="button"
                    onClick={() => handleOpenLinkModal(selectedNode.id)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-[11px] flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Connect
                  </button>
                </div>

                {connectedEdges.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    No active connections. Click "+ Connect" to link with other entities.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {connectedEdges.map((edge) => {
                      const isSource = edge.source === selectedNode.id;
                      const targetId = isSource ? edge.target : edge.source;
                      const targetNode = data.nodes.find((n) => n.id === targetId);

                      return (
                        <div
                          key={edge.id}
                          onClick={() => setSelectedNodeId(targetId)}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono text-slate-500 block">
                              {isSource ? '→ ' + edge.label : '← ' + edge.label}
                            </span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {targetNode?.title || targetId}
                            </span>
                          </div>
                          <span className="text-[10px] text-blue-600 font-mono capitalize shrink-0 ml-2">
                            {targetNode?.module_name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => onSelectEntity(selectedNode.id)}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Inspect Full Entity Details
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Share2 className="w-10 h-10 text-slate-300 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-700">Node Inspector</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Click on any node in the graph canvas to inspect its relationships and metadata.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Relationship Creator Modal */}
      {isLinking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Create Entity Connection</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLinking(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLink} className="p-5 space-y-4 text-xs">
              {linkError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {linkError}
                </div>
              )}
              {linkSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  {linkSuccess}
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Source Entity</label>
                <select
                  value={linkSourceId}
                  onChange={(e) => setLinkSourceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-blue-600"
                >
                  {data.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.module_name.toUpperCase()}] {n.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Relationship Type</label>
                <select
                  value={linkTypeId}
                  onChange={(e) => setLinkTypeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-blue-600"
                >
                  {data.link_types.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.forward_label || lt.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Entity</label>
                <select
                  value={linkTargetId}
                  onChange={(e) => setLinkTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-blue-600"
                >
                  {data.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      [{n.module_name.toUpperCase()}] {n.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes / Context (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Key collaborator on project..."
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLinking(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-2xs"
                >
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
