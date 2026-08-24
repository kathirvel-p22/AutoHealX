// ============================================================
// AutoHealX — Enhanced Process Table with Kill Functionality
// ============================================================

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ProcessTable({ latest }) {
  const [sortBy, setSortBy] = useState('cpu');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filter, setFilter] = useState('all');
  const [showKillConfirm, setShowKillConfirm] = useState(null);
  const [showCount, setShowCount] = useState(20);

  // Use all processes if available, fallback to topProcesses
  const allProcesses = latest?.allProcesses || latest?.topProcesses || [];
  const processes = allProcesses.slice(0, Math.min(showCount, allProcesses.length));

  // Sort processes
  const sortedProcesses = [...processes].sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Filter processes
  const filteredProcesses = sortedProcesses.filter(proc => {
    if (filter === 'high-cpu') return proc.cpu > 25;
    if (filter === 'high-memory') return proc.memory > 25;
    if (filter === 'system') return isSystemProcess(proc.name);
    if (filter === 'user') return !isSystemProcess(proc.name);
    return true;
  });

  // Check if process is system process
  const isSystemProcess = (name) => {
    const systemProcesses = [
      'system', 'idle', 'kernel', 'csrss', 'winlogon', 'services', 
      'lsass', 'svchost', 'explorer', 'dwm', 'audiodg', 'spoolsv'
    ];
    return systemProcesses.some(sys => 
      name.toLowerCase().includes(sys.toLowerCase())
    );
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Handle process kill
  const handleKillProcess = async (process) => {
    if (isSystemProcess(process.name)) {
      toast.error('Cannot kill system processes for safety');
      return;
    }

    try {
      // Store kill request for agent to process
      const killRequest = {
        type: 'kill_process',
        pid: process.pid,
        name: process.name,
        timestamp: Date.now(),
        reason: 'User requested termination'
      };

      // Store in localStorage (for immediate UI feedback)
      localStorage.setItem('autohealx_killRequest', JSON.stringify(killRequest));
      
      // Also try to create a downloadable file for the agent
      try {
        const blob = new Blob([JSON.stringify(killRequest, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary download link
        const a = document.createElement('a');
        a.href = url;
        a.download = 'killRequest.json';
        a.style.display = 'none';
        
        // Trigger download and clean up
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Kill request sent for ${process.name} (PID: ${process.pid})`);
        toast.info('Please save the downloaded file to autohealx/config/ folder');
      } catch (downloadError) {
        // Fallback to localStorage only
        toast.success(`Kill request queued for ${process.name} (PID: ${process.pid})`);
      }
      
      setShowKillConfirm(null);
    } catch (error) {
      toast.error('Failed to send kill request');
    }
  };

  // Get process priority color
  const getPriorityColor = (cpu, memory) => {
    if (cpu > 50 || memory > 50) return 'critical';
    if (cpu > 25 || memory > 25) return 'warning';
    return 'normal';
  };

  // Get process type icon
  const getProcessIcon = (name) => {
    if (name.toLowerCase().includes('chrome')) return '🌐';
    if (name.toLowerCase().includes('firefox')) return '🦊';
    if (name.toLowerCase().includes('edge')) return '🔷';
    if (name.toLowerCase().includes('code') || name.toLowerCase().includes('vscode')) return '💻';
    if (name.toLowerCase().includes('node')) return '🟢';
    if (name.toLowerCase().includes('system')) return '⚙️';
    if (name.toLowerCase().includes('explorer')) return '📁';
    if (name.toLowerCase().includes('service')) return '🔧';
    return '📋';
  };

  return (
    <div className="panel enhanced-process-panel">
      <div className="process-header">
        <h3 className="panel-title">⚙️ Running Applications & Processes</h3>
        <div className="process-stats">
          <span className="stat-badge">Total: {processes.length}</span>
          <span className="stat-badge critical">High CPU: {processes.filter(p => p.cpu > 25).length}</span>
          <span className="stat-badge warning">High Memory: {processes.filter(p => p.memory > 25).length}</span>
          <span className="stat-badge accuracy">✅ Windows Accurate</span>
        </div>
      </div>

      {/* Process Controls */}
      <div className="process-controls">
        <div className="filter-controls">
          <label>Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Processes</option>
            <option value="high-cpu">High CPU (&gt;25%)</option>
            <option value="high-memory">High Memory (&gt;25%)</option>
            <option value="user">User Applications</option>
            <option value="system">System Processes</option>
          </select>
          
          <label style={{ marginLeft: '1rem' }}>Show:</label>
          <select value={showCount} onChange={(e) => setShowCount(parseInt(e.target.value))}>
            <option value="10">Top 10</option>
            <option value="20">Top 20</option>
            <option value="50">Top 50</option>
            <option value="100">Top 100</option>
            <option value="999">All ({allProcesses.length})</option>
          </select>
        </div>
        <div className="sort-info">
          Sorted by: <strong>{sortBy.toUpperCase()}</strong> ({sortOrder}) | Showing: {filteredProcesses.length} of {allProcesses.length}
        </div>
      </div>

      {filteredProcesses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>No processes match the current filter</p>
        </div>
      ) : (
        <div className="process-table-container">
          <table className="enhanced-process-table">
            <thead>
              <tr>
                <th>App</th>
                <th 
                  className={`sortable ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Process Name {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className={`sortable ${sortBy === 'pid' ? 'active' : ''}`}
                  onClick={() => handleSort('pid')}
                >
                  PID {sortBy === 'pid' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className={`sortable ${sortBy === 'cpu' ? 'active' : ''}`}
                  onClick={() => handleSort('cpu')}
                >
                  CPU % {sortBy === 'cpu' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th 
                  className={`sortable ${sortBy === 'memory' ? 'active' : ''}`}
                  onClick={() => handleSort('memory')}
                >
                  Memory % {sortBy === 'memory' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcesses.map((proc, i) => {
                const priority = getPriorityColor(proc.cpu, proc.memory);
                const isSystem = isSystemProcess(proc.name);
                
                return (
                  <tr key={i} className={`process-row ${priority}`}>
                    <td className="process-icon">
                      {getProcessIcon(proc.name)}
                    </td>
                    <td className="process-name">
                      <div className="name-container">
                        <span className="name">{proc.name}</span>
                        {isSystem && <span className="system-badge">SYSTEM</span>}
                      </div>
                    </td>
                    <td className="process-pid">{proc.pid}</td>
                    <td className="process-cpu">
                      <div className="usage-container">
                        <div className="usage-bar">
                          <div 
                            className="usage-fill"
                            style={{
                              width: `${Math.min(proc.cpu, 100)}%`,
                              backgroundColor: proc.cpu > 50 ? '#ef4444' : 
                                             proc.cpu > 25 ? '#f59e0b' : '#22c55e'
                            }}
                          />
                        </div>
                        <span className="usage-text">{proc.cpu?.toFixed(1) || 0}%</span>
                      </div>
                    </td>
                    <td className="process-memory">
                      <div className="usage-container">
                        <div className="usage-bar">
                          <div 
                            className="usage-fill"
                            style={{
                              width: `${Math.min(proc.memory || 0, 100)}%`,
                              backgroundColor: (proc.memory || 0) > 50 ? '#ef4444' : 
                                             (proc.memory || 0) > 25 ? '#f59e0b' : '#8b5cf6'
                            }}
                          />
                        </div>
                        <span className="usage-text">
                          {proc.memoryMB ? `${proc.memoryMB}MB` : `${(proc.memory || 0).toFixed(1)}%`}
                        </span>
                      </div>
                    </td>
                    <td className="process-status">
                      <span className={`status-pill ${proc.status === 'running' ? 'running' : 'sleeping'}`}>
                        {proc.status || 'running'}
                      </span>
                    </td>
                    <td className="process-actions">
                      {!isSystem ? (
                        <button
                          className="kill-btn"
                          onClick={() => setShowKillConfirm(proc)}
                          title={`Terminate ${proc.name}`}
                        >
                          🗑️ Kill
                        </button>
                      ) : (
                        <span className="protected-text">Protected</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Kill Confirmation Modal */}
      {showKillConfirm && (
        <div className="kill-confirm-modal">
          <div className="kill-confirm-content">
            <h4>⚠️ Confirm Process Termination</h4>
            <p>
              Are you sure you want to kill <strong>{showKillConfirm.name}</strong>?
            </p>
            <div className="process-details">
              <div>PID: {showKillConfirm.pid}</div>
              <div>CPU: {showKillConfirm.cpu?.toFixed(1)}%</div>
              <div>Memory: {showKillConfirm.memory?.toFixed(1)}%</div>
            </div>
            <div className="kill-confirm-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowKillConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-kill"
                onClick={() => handleKillProcess(showKillConfirm)}
              >
                🗑️ Kill Process
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
