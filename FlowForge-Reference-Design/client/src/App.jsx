// ======================================================
// App.jsx
// ------------------------------------------------------
// This is the main file of the Frontend.
// It connects the Sidebar and the React Flow canvas together.
// It also manages the state of nodes, edges, and WebSocket status.
// ======================================================

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import our custom components
import CustomNode from './components/CustomNode';
import Sidebar from './components/Sidebar';

// Register custom node type
const nodeTypes = {
  custom: CustomNode,
};

// ======================================================
// Helper function: Detect if a new connection will create a loop
// ======================================================
const wouldCreateCycle = (nodes, edges, source, target) => {
  const graph = {};
  nodes.forEach((node) => {
    graph[node.id] = [];
  });

  edges.forEach((edge) => {
    if (graph[edge.source]) {
      graph[edge.source].push(edge.target);
    }
  });

  // Add the potential new connection
  if (graph[source]) {
    graph[source].push(target);
  }

  const visited = new Set();
  const recStack = new Set();

  const dfs = (nodeId) => {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    for (let neighbor of graph[nodeId] || []) {
      if (dfs(neighbor)) return true;
    }

    recStack.delete(nodeId);
    return false;
  };

  return nodes.some((node) => dfs(node.id));
};

// ======================================================
// Main App Component
// ======================================================
let nodeId = 2; // used to generate unique IDs for new nodes

function App() {
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      position: { x: 250, y: 100 },
      data: { label: 'Start Trigger', nodeType: 'trigger', status: 'pending' },
      type: 'custom',
    },
  ]);

  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [wsStatus, setWsStatus] = useState('disconnected');

  // Called when user connects two nodes
  const onConnect = useCallback(
    (params) => {
      // Prevent loops
      if (wouldCreateCycle(nodes, edges, params.source, params.target)) {
        setErrorMsg('Loop detected! This connection is not allowed.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }

      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [nodes, edges, setEdges]
  );

  // Add a new node
  const addNode = (nodeType, label) => {
    const newNode = {
      id: `${nodeId++}`,
      position: {
        x: Math.random() * 450 + 50,
        y: Math.random() * 350 + 50,
      },
      data: { label, nodeType, status: 'pending' },
      type: 'custom',
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // Delete selected nodes
  const deleteSelectedNodes = () => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);

    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          !selectedIds.includes(edge.source) &&
          !selectedIds.includes(edge.target)
      )
    );
  };

  // Simulate WebSocket connection
  const connectWebSocket = () => {
    setWsStatus('connecting');
    setTimeout(() => {
      setWsStatus('connected');
    }, 1000);
  };

  const disconnectWebSocket = () => {
    setWsStatus('disconnected');
  };

  // Simulate live execution (nodes run one by one)
  const startLiveTracing = () => {
    if (wsStatus !== 'connected') {
      setErrorMsg('Please connect WebSocket first!');
      setTimeout(() => setErrorMsg(''), 2500);
      return;
    }

    // Reset all nodes to pending
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: 'pending' },
      }))
    );

    let index = 0;
    const nodeList = [...nodes];

    const runNext = () => {
      if (index >= nodeList.length) return;

      const currentId = nodeList[index].id;

      // Set current node to running
      setNodes((nds) =>
        nds.map((n) =>
          n.id === currentId
            ? { ...n, data: { ...n.data, status: 'running' } }
            : n
        )
      );

      setTimeout(() => {
        // Set current node to success
        setNodes((nds) =>
          nds.map((n) =>
            n.id === currentId
              ? { ...n, data: { ...n.data, status: 'success' } }
              : n
          )
        );
        index++;
        runNext();
      }, 1400);
    };

    setTimeout(runNext, 400);
  };

  // Reset all node statuses
  const resetStatus = () => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: 'pending' },
      }))
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      {/* Left Sidebar */}
      <Sidebar
        onAddNode={addNode}
        onDeleteSelected={deleteSelectedNodes}
        onConnectWebSocket={connectWebSocket}
        onDisconnectWebSocket={disconnectWebSocket}
        onStartLiveTracing={startLiveTracing}
        onResetStatus={resetStatus}
        wsStatus={wsStatus}
      />

      {/* Right side - Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Error Message */}
        {errorMsg && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#dc2626',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              zIndex: 10,
              fontWeight: '600',
            }}
          >
            {errorMsg}
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;