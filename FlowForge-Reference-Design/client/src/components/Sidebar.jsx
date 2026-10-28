// ======================================================
// Sidebar.jsx
// ------------------------------------------------------
// This is the left side panel of the application.
// It contains buttons to add different types of nodes
// and also buttons for simulation and WebSocket control.
// ======================================================

import React from 'react';

const Sidebar = ({
  onAddNode,
  onDeleteSelected,
  onConnectWebSocket,
  onDisconnectWebSocket,
  onStartLiveTracing,
  onResetStatus,
  wsStatus,
}) => {
  // Common button style
  const btnStyle = {
    padding: '11px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    width: '100%',
    marginBottom: '8px',
  };

  // Color for WebSocket status indicator
  const getWsColor = () => {
    if (wsStatus === 'connected') return '#10b981';
    if (wsStatus === 'connecting') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      style={{
        width: '240px',
        background: '#111827',
        color: 'white',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Workflow Builder</h3>

      {/* ========== Add Nodes Section ========== */}
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0' }}>Add Nodes</p>

      <button
        onClick={() => onAddNode('trigger', 'Trigger')}
        style={{ ...btnStyle, background: '#10b981' }}
      >
        + Trigger
      </button>

      <button
        onClick={() => onAddNode('action', 'Action')}
        style={{ ...btnStyle, background: '#3b82f6' }}
      >
        + Action
      </button>

      <button
        onClick={() => onAddNode('condition', 'Condition')}
        style={{ ...btnStyle, background: '#f59e0b' }}
      >
        + Condition
      </button>

      <button
        onClick={() => onAddNode('end', 'End')}
        style={{ ...btnStyle, background: '#ef4444' }}
      >
        + End
      </button>

      <hr style={{ borderColor: '#374151', margin: '12px 0' }} />

      {/* ========== Delete Button ========== */}
      <button
        onClick={onDeleteSelected}
        style={{ ...btnStyle, background: '#dc2626' }}
      >
        Delete Selected
      </button>

      <hr style={{ borderColor: '#374151', margin: '12px 0' }} />

      {/* ========== WebSocket Section ========== */}
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0' }}>WebSocket Status</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: getWsColor(),
          }}
        />
        <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>{wsStatus}</span>
      </div>

      {wsStatus === 'disconnected' ? (
        <button
          onClick={onConnectWebSocket}
          style={{ ...btnStyle, background: '#8b5cf6' }}
        >
          Connect WebSocket
        </button>
      ) : (
        <button
          onClick={onDisconnectWebSocket}
          style={{ ...btnStyle, background: '#6b7280' }}
        >
          Disconnect
        </button>
      )}

      <button
        onClick={onStartLiveTracing}
        style={{ ...btnStyle, background: '#06b6d4' }}
      >
        Start Live Tracing
      </button>

      <button
        onClick={onResetStatus}
        style={{ ...btnStyle, background: '#6b7280' }}
      >
        Reset Status
      </button>
    </div>
  );
};

export default Sidebar;