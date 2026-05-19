import { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  BaseEdge,
  getBezierPath,
  Handle,
  Position,
} from 'reactflow';
import type { Node, Edge, NodeProps, EdgeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import type { EngineResult, NodeState } from '../types';

interface Props {
  result: EngineResult | null;
  onNodeClick?: (nodeId: string) => void;
  stepMode?: boolean;
  stepIndex?: number;
  onStepComplete?: () => void;
}

interface FlowNodeData {
  label: string;
  state: NodeState;
  detail?: string;
  stepOrder: number;
}

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  data,
  markerEnd,
}: EdgeProps<{ reason?: string }>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <title>{data?.reason || ''}</title>
    </g>
  );
}

function CustomNode({ data, selected }: NodeProps<FlowNodeData>) {
  return (
    <div className={`flow-node flow-node-${data.state} ${selected ? 'flow-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node-label">{data.label}</div>
      {data.detail && <div className="flow-node-detail">{data.detail}</div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function getGraphFromResult(result: EngineResult, stepMode: boolean, stepIndex: number): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];
  const hasError = result.errors.length > 0;

  const addStepNode = (id: string, label: string, state: NodeState, y: number, stepOrder: number, detail?: string) => {
    const visible = !stepMode || stepOrder <= stepIndex;
    nodes.push({
      id,
      type: 'custom',
      position: { x: 250, y },
      data: { label, state, detail, stepOrder },
      style: { opacity: visible ? 1 : 0.15, transition: 'opacity 0.3s' },
    });
  };

  addStepNode('request', 'Request', 'active', 0, 0);
  addStepNode('normalize', 'Normalize', hasError && result.errors.some(e => e.type === 'INVALID_REQUEST') ? 'failed' : 'active', 100, 1);
  edges.push({
    id: 'e-req-norm', source: 'request', target: 'normalize', animated: true,
    style: { stroke: '#6366f1' },
    data: { reason: getTraceReason(result, 'normalize') },
  });

  if (hasError && result.errors.some(e => e.type === 'INVALID_REQUEST')) return { nodes, edges };

  const listenerState: NodeState = hasError && result.errors.some(e => e.type === 'NO_LISTENER') ? 'failed' : 'active';
  addStepNode('listener', 'Listener', listenerState, 200, 2);
  edges.push({
    id: 'e-norm-lis', source: 'normalize', target: 'listener', animated: true,
    style: { stroke: listenerState === 'failed' ? '#ef4444' : '#6366f1' },
    data: { reason: getTraceReason(result, 'listener') },
  });

  if (listenerState === 'failed') return { nodes, edges };

  const vhState: NodeState = hasError && result.errors.some(e => e.type === 'NO_HOST_MATCH') ? 'failed' : 'active';
  addStepNode('vhost', 'VirtualHost', vhState, 300, 3);
  edges.push({
    id: 'e-lis-vh', source: 'listener', target: 'vhost', animated: true,
    style: { stroke: vhState === 'failed' ? '#ef4444' : '#6366f1' },
    data: { reason: getTraceReason(result, 'virtual_host') },
  });

  if (vhState === 'failed') return { nodes, edges };

  const routeState: NodeState = result.final ? 'active' : (hasError ? 'failed' : 'skipped');
  addStepNode('route', result.final ? `Route: ${result.final.route}` : 'Route', routeState, 400, 4);
  edges.push({
    id: 'e-vh-route', source: 'vhost', target: 'route', animated: true,
    style: { stroke: routeState === 'failed' ? '#ef4444' : '#6366f1' },
    data: { reason: result.final ? `selected route: ${result.final.route}` : 'no route matched' },
  });

  if (!result.final) return { nodes, edges };

  if (result.rejected) {
    addStepNode('rejected', `Rejected (${result.rejectStatus || 403})`, 'failed', 500, 5);
    edges.push({
      id: 'e-route-rej', source: 'route', target: 'rejected', animated: true,
      style: { stroke: '#ef4444' },
      data: { reason: `rejected with status ${result.rejectStatus || 403}` },
    });
    return { nodes, edges };
  }

  addStepNode('filters', 'Filters', result.mutations.length > 0 ? 'active' : 'active', 500, 5);
  edges.push({
    id: 'e-route-filt', source: 'route', target: 'filters', animated: true,
    style: { stroke: '#6366f1' },
    data: { reason: `executed ${result.mutations.length} mutation(s)` },
  });

  addStepNode('cluster', `Cluster: ${result.final.cluster}`, 'active', 600, 6);
  edges.push({
    id: 'e-filt-clust', source: 'filters', target: 'cluster', animated: true,
    style: { stroke: '#6366f1' },
    data: { reason: `resolved to: ${result.final.cluster}` },
  });

  addStepNode('endpoint', `Endpoint: ${result.final.endpoint}`, 'active', 700, 7);
  edges.push({
    id: 'e-clust-ep', source: 'cluster', target: 'endpoint', animated: true,
    style: { stroke: '#6366f1' },
    data: { reason: `selected: ${result.final.endpoint}` },
  });

  return { nodes, edges };
}

function getTraceReason(result: EngineResult, step: string): string {
  for (const t of result.trace) {
    if (t.step.includes(step)) return t.reason;
  }
  return '';
}

const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

export default function FlowGraph({ result, onNodeClick, stepMode = false, stepIndex = 999 }: Props) {
  const graphResult = useMemo(() => {
    if (!result) {
      return {
        nodes: [
          {
            id: 'empty',
            type: 'custom',
            position: { x: 150, y: 100 },
            data: { label: 'Run simulation to see flow', state: 'skipped' as NodeState, detail: '', stepOrder: 0 },
            style: { opacity: 1 },
          },
        ],
        edges: [],
      };
    }
    return getGraphFromResult(result, stepMode, stepIndex);
  }, [result, stepMode, stepIndex]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphResult.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphResult.edges);

  useEffect(() => {
    setNodes(graphResult.nodes);
    setEdges(graphResult.edges);
  }, [graphResult, setNodes, setEdges]);

  return (
    <div className="panel flow-graph">
      <h3>Visual Flow</h3>
      <ReactFlow
        nodes={nodes}
        edges={edges.map(e => ({
          ...e,
          markerEnd: { type: MarkerType.ArrowClosed, color: e.style?.stroke || '#6366f1' },
          type: 'custom',
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onNodeClick?.(node.id)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
