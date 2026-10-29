// ======================================================
// CustomNode.jsx
// ------------------------------------------------------
// This component is responsible for rendering each node
// in the workflow canvas (Trigger, Action, Condition, End).
// It also shows the current execution status of the node.
// ======================================================

import React from 'react';
import { Handle, Position } from 'reactflow';

const CustomNode = ({ data }) => {
  // Decide background color based on node type
  const getNodeColor = () => {
    switch (data.nodeType) {
      case 'trigger':
        return { background: '#10b981', border: '2px solid #059669' }; // Green
      case 'action':
        return { background: '#3b82f6', border: '2px solid #2563eb' }; // Blue
      case 'condition':
        return { background: '#f59e0b', border: '2px solid #d97706' }; // Orange
      case 'end':
        return { background: '#ef4444', border: '2px solid #dc2626' }; // Red
      default:
        return { background: '#6b7280', border: '2px solid #4b5563' };
    }
  };

  // Decide status badge color and text
  const getStatusBadge = () => {
    const statusStyles = {
      pending: { text: 'Pending', color: '#6b7280' },
      running: { text: 'Running', color: '#3b82f6' },
      success: { text: 'Success', color: '#10b981' },
      failed:  { text: 'Failed',  color: '#ef4444' },
    };

    const current = statusStyles[data.status] || statusStyles.pending;

    return (
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          backgroundColor: current.color,
          color: 'white',
          fontSize: '10px',
          padding: '2px 7px',
          borderRadius: '10px',
          fontWeight: '600',
        }}
      >
        {current.text}
      </div>
    );
  };

  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: '8px',
        minWidth: '150px',
        textAlign: 'center',
        color: 'white',
        fontWeight: '600',
        fontSize: '13px',
        position: 'relative',
        boxShadow: data.status === 'running' ? '0 0 0 3px #3b82f6' : '0 4px 6px rgba(0,0,0,0.15)',
        ...getNodeColor(),
      }}
    >
      {/* Connection point on the left (for incoming edges) */}
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />

      {/* Node Label */}
      {data.label}

      {/* Connection point on the right (for outgoing edges) */}
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />

      {/* Status Badge */}
      {getStatusBadge()}
    </div>
  );
};

export default CustomNode;