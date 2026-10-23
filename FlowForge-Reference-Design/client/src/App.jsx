import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, addEdge,
  useEdgesState, useNodesState
} from 'reactflow';
import {
  Activity, AlertCircle, Bell, CheckCircle2, Clock3,
  LayoutDashboard, Play, Plus, Save, Search, Settings,
  Trash2, Workflow, Zap, RefreshCw

} from 'lucide-react';
import { api } from './api.js';

const defaultNodes = [
  { id: 'start', type: 'input', position: { x: 40, y: 100 }, data: { label: 'Start workflow', retries: 0, compensate: false } },
  { id: 'task-1', position: { x: 280, y: 100 }, data: { label: 'Process data', retries: 2, retryDelayMs: 500, failTimes: 0, compensate: true } },
  { id: 'finish', type: 'output', position: { x: 530, y: 100 }, data: { label: 'Finish workflow', retries: 0, compensate: false } }
];
const defaultEdges = [
  { id: 'e-start-task', source: 'start', target: 'task-1', animated: true },
  { id: 'e-task-finish', source: 'task-1', target: 'finish', animated: true }
];

export default function App() {
  const [name, setName] = useState('My workflow');
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedId, setSelectedId] = useState('task-1');
  const [workflows, setWorkflows] = useState([]);
  const [workflowId, setWorkflowId] = useState('');
  const [runStatus, setRunStatus] = useState('Ready');
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [activePage, setActivePage] = useState('Overview');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [loginCountryCode, setLoginCountryCode] = useState('+91');

  const [authBusy, setAuthBusy] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem('flowforgeUserName') || '');
  useEffect(() => {
    const token = localStorage.getItem('flowforgeToken');
    const email = localStorage.getItem('flowforgeEmail');
    if (token && email) { setLoginEmail(email); setIsLoggedIn(true); }
  }, []);
  useEffect(() => {
  const reset = new URLSearchParams(window.location.search).get('resetToken');

  if (reset) {
    setResetToken(reset);
    setLoginError('Enter your new password.');
  }
}, []);

  async function submitAuth(event) {
    event.preventDefault();
    setLoginError('');
    if (authMode === 'signup' && fullName.trim().length < 2) { setLoginError('Please enter your full name.'); return; }
    if (loginPassword.length < 8) { setLoginError('Password must be at least 8 characters.'); return; }
    setAuthBusy(true);
    try {
      const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/login';

const isPhoneLogin =
  authMode === 'signin' && !loginEmail.includes('@');

const cleanNumber = loginEmail.trim().replace(/[\s()-]/g, '');

const identifier = isPhoneLogin
  ? `${loginCountryCode}${cleanNumber.replace(/^\+/, '')}`
  : loginEmail.trim();

const payload = authMode === 'signup'
  ? {
      name: fullName.trim(),
      email: loginEmail.trim(),
      phone: `${countryCode}${phoneNumber.trim().replace(/[\s()-]/g, '').replace(/^\+/, '')}`,
      password: loginPassword
    }
  : {
      identifier,
      password: loginPassword
    };
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('flowforgeToken', data.token);
      localStorage.setItem('flowforgeEmail', data.user.email);
      localStorage.setItem('flowforgeUserName', data.user.name);
      setUserName(data.user.name); setLoginEmail(data.user.email); setLoginPassword(''); setIsLoggedIn(true); setActivePage('Overview');
      setLoginError('');
    } catch (e) { setLoginError(e.response?.data?.error || 'Could not connect to FlowForge server. Check that backend and MongoDB are running.'); }
    finally { setAuthBusy(false); }
  }

  async function handleForgotPassword() {
  const email = loginEmail.trim().toLowerCase();

  if (!email.includes('@')) {
    setLoginError('Please enter a valid email address.');
    return;
  }

  setLoginError('');
  setAuthBusy(true);

  try {
    const { data } = await api.post('/auth/forgot-password', { email });
    setLoginError(data.message || 'If your account exists, a reset email will be sent.');
  } catch (e) {
    setLoginError(e.response?.data?.error || 'Could not send reset email.');
  } finally {
    setAuthBusy(false);
  }
}

async function handleResetPassword(event) {
  event.preventDefault();
  setLoginError('');

  if (newPassword.length < 8) {
    setLoginError('Password must be at least 8 characters.');
    return;
  }

  setAuthBusy(true);

  try {
    const { data } = await api.post('/auth/reset-password', {
      token: resetToken,
      password: newPassword
    });

    setNewPassword('');
    setResetToken('');
    window.history.replaceState({}, '', window.location.pathname);
    setAuthMode('signin');
    setLoginError(data.message || 'Password reset successfully. Please sign in.');
  } catch (e) {
    setLoginError(e.response?.data?.error || 'Could not reset password.');
  } finally {
    setAuthBusy(false);
  }
}



  function signOut() {
    localStorage.removeItem('flowforgeToken'); localStorage.removeItem('flowforgeEmail'); localStorage.removeItem('flowforgeUserName');
    setIsLoggedIn(false); setLoginPassword(''); setAuthMode('signin');
  }
  function showPage(page) {
  setActivePage(page);
  setError('');
  setNotice('');
}
  const selected = nodes.find(node => node.id === selectedId);

  const refreshWorkflows = useCallback(async () => {
  try {
    setError('');

    const { data } = await api.get('/workflows');

    setWorkflows(Array.isArray(data) ? data : []);
  } catch (e) {
    setError(
      e.response?.data?.error ||
        'Cannot connect to API. Start the backend and MongoDB.'
    );
  }
}, []);
  useEffect(() => { refreshWorkflows(); }, [refreshWorkflows]);

  const onConnect = useCallback(connection => {
    setEdges(current => addEdge({
      ...connection,
      id: `edge-${Date.now()}`,
      animated: true,
      style: { stroke: '#8b83ff', strokeWidth: 2 }
    }, current));
  }, [setEdges]);

  function addNode(type = 'task') {
    const id = `${type}-${Date.now()}`;
    const label = type === 'condition' ? 'Condition' : type === 'webhook' ? 'Webhook task' : 'New task';
    setNodes(current => [...current, {
      id,
      position: { x: 140 + current.length * 25, y: 270 + (current.length % 3) * 30 },
      data: { label, retries: 2, retryDelayMs: 500, failTimes: 0, compensate: true }
    }]);
    setSelectedId(id);
  }

  function updateNode(field, value) {
    setNodes(current => current.map(node => node.id === selectedId
      ? { ...node, data: { ...node.data, [field]: value } }
      : node
    ));
  }

  function deleteNode() {
    setNodes(current => current.filter(node => node.id !== selectedId));
    setEdges(current => current.filter(edge => edge.source !== selectedId && edge.target !== selectedId));
    setSelectedId('');
  }

  async function saveWorkflow() {
    setError(''); setNotice('');
    try {
      const { data } = await api.post('/workflows', { id: workflowId || undefined, name, nodes, edges });
      setWorkflowId(data._id);
      setNotice('Workflow saved to MongoDB.');
      await refreshWorkflows();
    } catch (e) {
      const details = e.response?.data?.details;
      setError(Array.isArray(details) ? details.join(' ') : e.response?.data?.error || 'Save failed.');
    }
  }

  async function loadWorkflow(id = workflowId) {
    if (!id) return;
    try {
      const { data } = await api.get(`/workflows/${id}`);
      setWorkflowId(data._id);
      setName(data.name);
      setNodes(data.nodes);
      setEdges(data.edges);
      setNotice('Workflow loaded from MongoDB.');
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || 'Load failed.');
    }
  }

  async function runWorkflow() {
    if (!workflowId) {
      setError('Save the workflow to MongoDB before running it.');
      return;
    }
    setBusy(true); setError(''); setNotice('Starting server execution...');
    setLogs([]);
    try {
      const { data } = await api.post(`/workflows/${workflowId}/run`);
      setRunStatus(data.status);
      const poll = async (count = 0) => {
        try {
          const result = await api.get(`/runs/${data.runId}`);
          setRunStatus(result.data.status);
          setLogs(result.data.logs || []);
          if (['completed', 'failed', 'compensated'].includes(result.data.status) || count >= 120) {
            setBusy(false);
            setNotice(`Execution ${result.data.status}.`);
            return;
          }
          window.setTimeout(() => poll(count + 1), 700);
        } catch (e) {
          setBusy(false);
          setError(e.response?.data?.error || 'Unable to poll execution status.');
        }
      };
      await poll();
    } catch (e) {
      setBusy(false);
      const details = e.response?.data?.details;
      setError(Array.isArray(details) ? details.join(' ') : e.response?.data?.error || 'Run failed.');
    }
  }

  const filteredLogs = logs.filter(log =>
    `${log.message} ${log.level}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
        <header className="auth-topbar"><div className="auth-brand"><span className="brand-mark"><Zap size={21}/></span><span><strong>FlowForge</strong><small>WORKFLOW ENGINE</small></span></div><span className="auth-top-note">AUTOMATE WITH CONFIDENCE</span></header>
        <main className="auth-layout">
          <section className="auth-promo">
            <div className="eyebrow"><span className="pulse-dot"/> WORKFLOW ORCHESTRATION PLATFORM</div>
            <h1>Build workflows.<br/><span>Move work forward.</span></h1>
            <p>Design, run, and monitor reliable workflows from one clear command center.</p>
            <div className="auth-preview" aria-hidden="true">
              <div className="preview-head"><span/><span/><span/><small>WORKFLOW OVERVIEW</small><b>•••</b></div>
              <div className="preview-stats"><div><small>Total workflows</small><strong>24</strong><i>↗ 12% this week</i></div><div><small>Successful runs</small><strong>98.6%</strong><i>↗ Stable execution</i></div></div>
              <div className="preview-flow"><div className="preview-node"><Zap size={15}/><span>Trigger</span></div><div className="preview-link"/><div className="preview-node purple-node"><Workflow size={15}/><span>Process</span></div><div className="preview-link"/><div className="preview-node green-node"><CheckCircle2 size={15}/><span>Complete</span></div></div>
            </div>
            <div className="auth-benefits"><span><CheckCircle2 size={16}/> Visual workflow builder</span><span><CheckCircle2 size={16}/> Live execution logs</span><span><CheckCircle2 size={16}/> Retry-aware tasks</span></div>
          </section>
          <section className="auth-card">
            <div className="auth-card-heading"><div className="auth-card-icon"><Zap size={20}/></div><span className="auth-secure"><span/> WORKSPACE ACCESS</span></div>
            <h2>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
            <p className="auth-subtitle">{authMode === 'signup' ? 'Create an account with your email and phone number.' : 'Sign in with your registered email or phone number.'}</p>
            <div className="auth-tabs"><button type="button" className={authMode === 'signin' ? 'selected' : ''} onClick={() => {setAuthMode('signin');setLoginError('');}}>Sign in</button><button type="button" className={authMode === 'signup' ? 'selected' : ''} onClick={() => {setAuthMode('signup');setLoginError('');}}>Create account</button></div>
            <form onSubmit={submitAuth}>
              {authMode === 'signup' && <label>Full name<div className="auth-input-wrap"><span>◉</span><input type="text" autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your name" required minLength={2}/></div></label>}

{authMode === 'signup' && (
  <label>Phone number
    <div className="auth-input-wrap">
      <span>☎</span>
      <select
        value={countryCode}
        onChange={e => setCountryCode(e.target.value)}
      >
        <option value="+91">🇮🇳 India (+91)</option>
        <option value="+1">🇺🇸 USA / Canada (+1)</option>
        <option value="+44">🇬🇧 UK (+44)</option>
        <option value="+61">🇦🇺 Australia (+61)</option>
        <option value="+977">🇳🇵 Nepal (+977)</option>
        <option value="+880">🇧🇩 Bangladesh (+880)</option>
        <option value="+971">🇦🇪 UAE (+971)</option>
      </select>
      <input
        type="tel"
        autoComplete="tel-national"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        placeholder="Mobile number"
        required
      />
    </div>
  </label>
)}

{authMode === 'signup' ? (
  <label>
    Gmail / Email address
    <div className="auth-input-wrap">
      <span>✉</span>
      <input
        type="email"
        autoComplete="username"
        value={loginEmail}
        onChange={e => setLoginEmail(e.target.value)}
        placeholder="you@gmail.com"
        required
      />
    </div>
  </label>
) : (
  <label>
{loginEmail.trim() && /^[+\d\s()-]+$/.test(loginEmail.trim())
      ? 'Phone number'
      : 'Email or phone number'}

    <div className="auth-input-wrap">
{loginEmail.trim() && /^[+\d\s()-]+$/.test(loginEmail.trim()) ? (     
     <select
          value={loginCountryCode}
          onChange={e => setLoginCountryCode(e.target.value)}
          aria-label="Country code"
        >
          <option value="+91">🇮🇳 India (+91)</option>
          <option value="+1">🇺🇸 USA / Canada (+1)</option>
          <option value="+44">🇬🇧 UK (+44)</option>
          <option value="+61">🇦🇺 Australia (+61)</option>
          <option value="+977">🇳🇵 Nepal (+977)</option>
          <option value="+880">🇧🇩 Bangladesh (+880)</option>
          <option value="+971">🇦🇪 UAE (+971)</option>
        </select>
      ) : (
        <span>✉</span>
      )}

      <input
        type="text"
        autoComplete="username"
        value={loginEmail}
        onChange={e => setLoginEmail(e.target.value)}
        placeholder="Enter email or phone number"
        required
      />
    </div>
  </label>
)}
              <label>Password<div className="auth-input-wrap"><span>⌑</span><input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder={authMode === 'signup' ? 'At least 8 characters' : 'Enter your password'} required minLength={8}/></div></label>
             {authMode === 'signin' && (
  <div>
<button
  type="button"
  className="forgot-password-btn"
  onClick={handleForgotPassword}
  disabled={authBusy}
>
  Forgot Password?
</button>
  </div>
)}
              {loginError && <div className="auth-error"><AlertCircle size={16}/>{loginError}</div>}
              <button type="submit" className="auth-submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <span>→</span></button>
            </form>
            <p className="auth-switch">{authMode === 'signup' ? 'Already have an account?' : 'New to FlowForge?'} <button type="button" onClick={()=>{setAuthMode(authMode === 'signup' ? 'signin' : 'signup');setLoginError('');}}>{authMode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>
            <div className="auth-card-foot"><span>⌑ Passwords are securely hashed</span><span>FLOWFORGE • DEV</span></div>
          </section>
        </main>
        <footer className="auth-footer">© 2026 FlowForge <span>Built for dependable automation</span><span>Secure account access</span></footer>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Zap size={21}/></div>
          <div><strong>FlowForge</strong><small>WORKFLOW ENGINE</small></div>
        </div>
        <div className="nav-label">WORKSPACE</div>

<div
  className={`nav-item ${activePage === 'Overview' ? 'active' : ''}`}
  onClick={() => setActivePage('Overview')}
  style={{ cursor: 'pointer' }}
>
  <LayoutDashboard size={18} /> Overview
</div>

<div
  className={`nav-item ${activePage === 'Workflow builder' ? 'active' : ''}`}
  onClick={() => showPage('Workflow builder')}
  style={{ cursor: 'pointer' }}
>
  <Workflow size={18} /> Workflow builder
</div>

<div
  className={`nav-item ${activePage === 'Executions' ? 'active' : ''}`}
  onClick={() => setActivePage('Executions')}
  style={{ cursor: 'pointer' }}
>
  <Activity size={18} /> Executions
</div>

<div className="nav-label">CONFIGURATION</div>

<div
  className={`nav-item ${activePage === 'Settings' ? 'active' : ''}`}
  onClick={() => setActivePage('Settings')}
  style={{ cursor: 'pointer' }}
>
  <Settings size={18} /> Settings
</div>
        <div className="sidebar-foot"><span className="pulse-dot"/> API workspace <small>DEV</small></div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <div>
            <div className="breadcrumb">Workspace <span>/</span> Workflow studio</div>
            <h1>{activePage === 'Overview' ? 'Overview' : activePage}</h1>
            <p>{activePage === 'Overview' ? 'A quick look at your workflow workspace.' : activePage === 'Workflow builder' ? 'Design, save and run your workflows.' : activePage === 'Executions' ? 'Review the latest run status and execution logs.' : 'Manage your workspace preferences.'}</p>
          </div>

<div className="profile-actions">
  <button
    className="icon-button"
    aria-label="Notifications"
    onClick={() => setNotice('No new notifications.')}
  >
    <Bell size={18} />
  </button>

  <button
    className="avatar"
    onClick={signOut}
    style={{ cursor: 'pointer', border: 0 }}
    title="Sign out"
  >
    {(userName || loginEmail || 'U').slice(0, 1).toUpperCase()}
  </button>
</div>
        </header>

        {error && <div className="alert error-alert"><AlertCircle size={17}/>{error}</div>}
        {notice && <div className="alert notice-alert"><CheckCircle2 size={17}/>{notice}</div>}

        {activePage === 'Overview' && <section className="stats-grid">
          <article className="stat-card"><div className="stat-top"><span>Total nodes</span><div className="stat-icon purple"><Workflow size={19}/></div></div><strong>{nodes.length}</strong><small>Current workflow</small></article>
          <article className="stat-card"><div className="stat-top"><span>Connections</span><div className="stat-icon green"><CheckCircle2 size={19}/></div></div><strong>{edges.length}</strong><small>Workflow edges</small></article>
          <article className="stat-card"><div className="stat-top"><span>Execution status</span><div className="stat-icon orange"><Clock3 size={19}/></div></div><strong className="status-text">{runStatus}</strong><small>Server-side execution</small></article>
        </section>}

        {activePage === 'Overview' && <section className="overview-layout">
          <article className="panel overview-chart-panel">
            <div className="panel-heading"><div><h3>Workflow activity</h3><p>Execution activity across the last 7 days</p></div><span className="chart-pill">Last 7 days⌄</span></div>
            <div className="activity-chart" aria-label="Workflow activity chart">
              {[42,66,51,78,58,88,69,47,73,94,63,81,56,72,45,85,67,97,74,60,83,52,76,91,64,80,48,70].map((h,i)=><span key={i} style={{height:`${h}%`}}/>) }
            </div>
            <div className="chart-legend"><span><i className="legend-purple"/> Successful runs</span><span><i className="legend-cyan"/> Workflow activity</span></div>
          </article>
          <article className="panel success-panel">
            <div className="panel-heading"><div><h3>Execution health</h3><p>Current workspace</p></div><Activity size={19}/></div>
            <div className="health-ring"><div><strong>{runStatus.toLowerCase() === 'completed' ? '100%' : '98.6%'}</strong><small>success rate</small></div></div>
            <div className="health-meta"><span>Successful <b>98.6%</b></span><span>Failed <b>1.4%</b></span></div>
          </article>
          <article className="panel recent-panel">
            <div className="panel-heading"><div><h3>Recent workflows</h3><p>Saved workflow definitions</p></div><button className="btn secondary" onClick={() => showPage('Workflow builder')}>Open builder ↗</button></div>
            {workflows.length ? <div className="recent-table"><div className="recent-row recent-head"><span>Workflow</span><span>Nodes</span><span>Status</span></div>{workflows.slice(0,5).map((item,i)=><button className="recent-row" key={item._id} onClick={()=>{loadWorkflow(item._id);showPage('Workflow builder')}}><span className="recent-name"><i className="recent-workflow-icon"><Workflow size={15}/></i><span><b>{item.name}</b><small>Updated workflow</small></span></span><span>{item.nodes?.length ?? '—'}</span><span><i className="status-badge">Saved</i></span></button>)}</div> : <div className="empty-dashboard"><div className="empty-graphic"><Workflow size={25}/></div><strong>No workflows yet</strong><p>Create and save your first workflow to see it here.</p><button className="btn primary" onClick={() => showPage('Workflow builder')}>Create workflow</button></div>}
          </article>
          <article className="panel quick-panel">
            <div className="panel-heading"><div><h3>Quick actions</h3><p>Continue where you left off</p></div><Zap size={19}/></div>
            <button className="quick-action" onClick={() => showPage('Workflow builder')}><span className="quick-icon purple"><Plus size={17}/></span><span><b>Create workflow</b><small>Build a new automation</small></span><span className="quick-arrow">↗</span></button>
            <button className="quick-action" onClick={() => showPage('Executions')}><span className="quick-icon green"><Activity size={17}/></span><span><b>View executions</b><small>Inspect run status and logs</small></span><span className="quick-arrow">↗</span></button>
            <button className="quick-action" onClick={() => showPage('Settings')}><span className="quick-icon orange"><Settings size={17}/></span><span><b>Workspace settings</b><small>Manage your workspace</small></span><span className="quick-arrow">↗</span></button>
          </article>
        </section>}

        {activePage === 'Workflow builder' && <section className="builder-card">
          <div className="builder-toolbar">
            <div><h2>Workflow canvas</h2><p>Drag nodes and connect handles to build a DAG.</p></div>
            <div className="toolbar-actions">
              <button className="btn secondary" onClick={() => addNode('task')}><Plus size={15}/> Task</button>
              <button className="btn secondary" onClick={() => addNode('condition')}>+ Condition</button>
              <button className="btn secondary" onClick={() => addNode('webhook')}>+ Webhook</button>
              <button className="btn secondary" onClick={saveWorkflow}><Save size={15}/> Save</button>
              <button className="btn primary" disabled={busy} onClick={runWorkflow}><Play size={15}/>{busy ? 'Running...' : 'Run workflow'}</button>
            </div>
          </div>
          <div className="workflow-name-row">
            <label>Workflow name <input value={name} onChange={e => setName(e.target.value)} /></label>
            <label>Saved workflows
              <select value={workflowId} onChange={e => { setWorkflowId(e.target.value); if (e.target.value) loadWorkflow(e.target.value); }}>
                <option value="">Choose a saved workflow</option>
                {workflows.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </label>
            <button className="btn secondary" onClick={refreshWorkflows}><RefreshCw size={15}/> Refresh</button>
          </div>
          <div className="flow-canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              fitView
            >
              <MiniMap nodeColor="#8177ff" maskColor="rgba(8,12,30,.65)"/>
              <Controls/>
              <Background color="#303958" gap={20} size={1}/>
            </ReactFlow>
          </div>
        </section>}

        {activePage === 'Workflow builder' && <section className="lower-grid">
          <article className="panel">
            <div className="panel-heading"><div><h3>Node configuration</h3><p>Select a canvas node to edit it.</p></div></div>
            {selected ? <>
              <label>Node label<input value={selected.data.label || ''} onChange={e => updateNode('label', e.target.value)}/></label>
              <div className="two-fields">
                <label>Retries (0–5)<input type="number" min="0" max="5" value={selected.data.retries ?? 0} onChange={e => updateNode('retries', Math.max(0, Math.min(5, Number(e.target.value))))}/></label>
                <label>Retry delay (ms)<input type="number" min="100" max="10000" value={selected.data.retryDelayMs ?? 500} onChange={e => updateNode('retryDelayMs', Math.max(100, Number(e.target.value)))}/></label>
              </div>
              <label>Simulated failures (for testing)<input type="number" min="0" max="10" value={selected.data.failTimes ?? 0} onChange={e => updateNode('failTimes', Math.max(0, Math.min(10, Number(e.target.value))))}/></label>
              <label className="checkbox-label"><input type="checkbox" checked={!!selected.data.compensate} onChange={e => updateNode('compensate', e.target.checked)}/> Run demo compensation if a later step fails</label>
              <button className="btn danger" onClick={deleteNode}><Trash2 size={15}/> Delete selected node</button>
            </> : <p className="empty-state">Select a node on the canvas.</p>}
          </article>

          <article className="panel logs-panel">
            <div className="panel-heading"><div><h3>Execution monitor</h3><p>Live status and server logs</p></div><Activity size={20}/></div>
            <div className="log-search"><Search size={16}/><input placeholder="Search execution logs..." value={search} onChange={e => setSearch(e.target.value)}/></div>
            <div className="log-list">
              {filteredLogs.length ? filteredLogs.slice().reverse().map((log, index) => (
                <div className={`log-entry ${log.level}`} key={`${log.at}-${index}`}>
                  <span className="log-dot"/><div><p>{log.message}</p><small>{log.at ? new Date(log.at).toLocaleTimeString() : ''}</small></div>
                </div>
              )) : <p className="empty-state">No execution logs yet. Save the workflow, then run it.</p>}
            </div>
          </article>
        </section>}

        {activePage === 'Executions' && <section className="panel logs-panel">
          <div className="panel-heading"><div><h3>Execution monitor</h3><p>Latest server-side execution</p></div><Activity size={20}/></div>
          <p>Current status: <strong className="status-text">{runStatus}</strong></p>
          <div className="log-search"><Search size={16}/><input placeholder="Search execution logs..." value={search} onChange={e => setSearch(e.target.value)}/></div>
          <div className="log-list">{filteredLogs.length ? filteredLogs.slice().reverse().map((log, index) => <div className={`log-entry ${log.level}`} key={`${log.at}-${index}`}><span className="log-dot"/><div><p>{log.message}</p><small>{log.at ? new Date(log.at).toLocaleTimeString() : ''}</small></div></div>) : <p className="empty-state">No execution logs yet. Open Workflow builder, save the workflow, then run it.</p>}</div>
          <button className="btn secondary" onClick={() => showPage('Workflow builder')}>Open workflow builder</button>
        </section>}

        {activePage === 'Settings' && <section className="panel">
          <div className="panel-heading"><div><h3>Workspace settings</h3><p>Basic preferences for this demo workspace.</p></div><Settings size={20}/></div>
          <label>Signed-in email<input value={loginEmail} readOnly /></label>
          <label>Workspace name<input value="FlowForge Development" readOnly /></label>
          <p className="empty-state">Your account is stored in the database. Passwords are hashed by the server before storage.</p>
          <button className="btn secondary" onClick={signOut}>Sign out</button>
        </section>}
        <footer>FlowForge <span>• Learning MVP • Secure production setup still required</span></footer>
      </main>
    </div>
  );
}