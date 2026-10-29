// ======================================================
// App.jsx
// ------------------------------------------------------
// Main application file with routing and authentication.
// - /login     → Login page
// - /register  → Register page
// - /workflow  → Workflow Builder (Protected)
// ======================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './components/CustomNode';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';

const nodeTypes = {
  custom: CustomNode,
};

// ======================================================
// Helper: Check if user is authenticated
// ======================================================
const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

// ======================================================
// Protected Route Component
// ======================================================
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// ======================================================
// Loop Detection Helper
// ======================================================
const wouldCreateCycle = (nodes, edges, source, target) => {
  const graph = {};
  nodes.forEach((node) => {
    graph[node.id] = [];
  });
  edges.forEach((edge) => {
    if (graph[edge.source]) graph[edge.source].push(edge.target);
  });
  if (graph[source]) graph[source].push(target);

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
// Workflow Builder Component
// ======================================================
let nodeId = 2;

const WorkflowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      position: { x: 250, y: 100 },
      data: { label: 'Start Trigger', nodeType: 'trigger', status: 'pending' },
      type: 'custom',
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [wsStatus, setWsStatus] = React.useState('disconnected');

  const onConnect = React.useCallback(
    (params) => {
      if (wouldCreateCycle(nodes, edges, params.source, params.target)) {
        setErrorMsg('Loop detected! This connection is not allowed.');
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [nodes, edges, setEdges]
  );

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

  const connectWebSocket = () => {
    setWsStatus('connecting');
    setTimeout(() => setWsStatus('connected'), 1000);
  };

  const disconnectWebSocket = () => {
    setWsStatus('disconnected');
  };

  const startLiveTracing = () => {
    if (wsStatus !== 'connected') {
      setErrorMsg('Please connect WebSocket first!');
      setTimeout(() => setErrorMsg(''), 2500);
      return;
    }

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

      setNodes((nds) =>
        nds.map((n) =>
          n.id === currentId
            ? { ...n, data: { ...n.data, status: 'running' } }
            : n
        )
      );

      setTimeout(() => {
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

  const resetStatus = () => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: 'pending' },
      }))
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = '/login';
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
      <Sidebar
        onAddNode={addNode}
        onDeleteSelected={deleteSelectedNodes}
        onConnectWebSocket={connectWebSocket}
        onDisconnectWebSocket={disconnectWebSocket}
        onStartLiveTracing={startLiveTracing}
        onResetStatus={resetStatus}
        wsStatus={wsStatus}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            position: 'absolute',
            top: '15px',
            right: '20px',
            zIndex: 10,
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Logout
        </button>

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
};

// ======================================================
// Main App with Routes
// ======================================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/workflow"
          element={
            <ProtectedRoute>
              <WorkflowBuilder />
            </ProtectedRoute>
          }
        />
        {/* Default route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;