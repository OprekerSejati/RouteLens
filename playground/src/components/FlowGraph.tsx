import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import type { EngineResult, NodeState } from '../engine/types';

interface Props {
  result: EngineResult | null;
}

function getGraph(result: EngineResult) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const hasError = !!result.error;

  const add = (id: string, label: string, state: NodeState, y: number) => {
    nodes.push({
      id,
      type: 'default',
      position: { x: 200, y },
      data: { label },
      style: getNodeStyle(state),
    });
  };

  add('request', `Request (${result.trace[0]?.reason || ''})`, 'active', 0);
  add('routes', `Routes`, !hasError && result.selected ? 'active' : hasError ? 'failed' : 'skipped', 150);
  edges.push({
    id: 'e1', source: 'request', target: 'routes', animated: true,
    style: { stroke: '#6366f1' },
  });

  if (!result.selected) return { nodes, edges };

  add('service', `→ ${result.selected.service}`, 'active', 300);
  edges.push({
    id: 'e2', source: 'routes', target: 'service', animated: true,
    style: { stroke: '#6366f1' },
  });

  return { nodes, edges };
}

function getNodeStyle(state: NodeState) {
  switch (state) {
    case 'active':
      return {
        background: '#312e81', color: '#c7d2fe', border: '2px solid #6366f1',
        borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 13,
      };
    case 'failed':
      return {
        background: '#7f1d1d', color: '#fecaca', border: '2px solid #ef4444',
        borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 13,
      };
    case 'skipped':
      return {
        background: '#1e293b', color: '#64748b', border: '2px solid #334155',
        borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 13,
      };
  }
}

export default function FlowGraph({ result }: Props) {
  const { nodes, edges } = useMemo(() => {
    if (!result) {
      return {
        nodes: [{
          id: 'empty', type: 'default', position: { x: 100, y: 100 },
          data: { label: 'Run simulation' },
          style: { background: '#1e293b', color: '#64748b', border: '2px solid #334155', borderRadius: 8, padding: '10px 20px' },
        }],
        edges: [],
      };
    }
    return getGraph(result);
  }, [result]);

  return (
    <div className="panel flow-graph">
      <h3>Visual Flow</h3>
      <ReactFlow
        nodes={nodes}
        edges={edges.map(e => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } }))}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
