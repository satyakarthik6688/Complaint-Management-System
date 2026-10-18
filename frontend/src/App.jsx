
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import './App.css';

const API_URL = 'http://localhost:8080/api/complaints';

const STATUS_COLORS = {
  OPEN: '#f59e0b',
  IN_PROGRESS: '#6366f1',
  RESOLVED: '#10b981',
};

const CATEGORIES = [
  'WATER',
  'ELECTRICITY',
  'CLEANLINESS',
  'MAINTENANCE',
  'OTHER',
];

const EMPTY_FORM = {
  title: '',
  category: 'WATER',
  complainantName: '',
  description: '',
  location: '',
};

function formatStatus(status = 'OPEN') {
  return status.replaceAll('_', ' ');
}

function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function App() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activePage, setActivePage] = useState('Dashboard');

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        'Unable to connect to the backend. Make sure Spring Boot and MySQL are running.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter(c => c.status === 'OPEN').length;
    const inProgress = complaints.filter(
      c => c.status === 'IN_PROGRESS'
    ).length;
    const resolved = complaints.filter(
      c => c.status === 'RESOLVED'
    ).length;

    return {
      total,
      open,
      inProgress,
      resolved,
      resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    };
  }, [complaints]);

  const statusData = useMemo(
    () =>
      [
        { name: 'Open', value: stats.open, color: STATUS_COLORS.OPEN },
        {
          name: 'In Progress',
          value: stats.inProgress,
          color: STATUS_COLORS.IN_PROGRESS,
        },
        {
          name: 'Resolved',
          value: stats.resolved,
          color: STATUS_COLORS.RESOLVED,
        },
      ].filter(item => item.value > 0),
    [stats]
  );

  const categoryData = useMemo(
    () =>
      CATEGORIES.map(category => ({
        category: category.charAt(0) + category.slice(1).toLowerCase(),
        count: complaints.filter(c => c.category === category).length,
      })),
    [complaints]
  );

  const trendData = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = complaints.filter(c => {
        if (!c.createdAt) return false;
        const created = new Date(c.createdAt);
        return created >= date && created < nextDay;
      }).length;

      days.push({
        day: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        complaints: count,
      });
    }

    return days;
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const term = search.trim().toLowerCase();

    return complaints.filter(c => {
      const matchesSearch =
        !term ||
        [c.title, c.complainantName, c.location, c.category, String(c.id)]
          .some(value => String(value || '').toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === 'ALL' || c.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'ALL' || c.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [complaints, search, statusFilter, categoryFilter]);

  async function createComplaint(e) {
    e.preventDefault();

    try {
      setSaving(true);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Could not create the complaint.');
      }

      setForm(EMPTY_FORM);
      setShowForm(false);
      await fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to create complaint.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      // Matches the status endpoint used by this Spring Boot project.
      const response = await fetch(
        `${API_URL}/${id}/status?status=${encodeURIComponent(status)}`,
        { method: 'PATCH' }
      );

      if (!response.ok) {
        throw new Error('Status update failed. Check your backend endpoint.');
      }

      await fetchComplaints();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteComplaint(id) {
    if (!window.confirm(`Delete complaint #${id}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Could not delete the complaint.');
      }

      await fetchComplaints();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" onClick={() => setActivePage('Dashboard')}>
          <span className="brand-icon">C</span>
          <span>
            <strong>ComplainX</strong>
            <small>CIVIC MANAGEMENT</small>
          </span>
        </a>

        <div className="nav-caption">WORKSPACE</div>

        <button
          className={`nav-link ${activePage === 'Dashboard' ? 'selected' : ''}`}
          onClick={() => setActivePage('Dashboard')}
        >
          <span>▦</span> Overview
        </button>

        <button
          className={`nav-link ${activePage === 'Complaints' ? 'selected' : ''}`}
          onClick={() => setActivePage('Complaints')}
        >
          <span>▤</span> Complaints
          <span className="nav-count">{complaints.length}</span>
        </button>

        <div className="sidebar-bottom">
          <div className="system-indicator"><span /> Backend connection</div>
          <div className="sidebar-note">
            <span className="note-icon">✦</span>
            <strong>Community first.</strong>
            <p>Better tracking. Faster resolution.</p>
          </div>
          <div className="profile-row">
            <div className="profile-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <small>Management console</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> {activePage}</div>
          <div className="topbar-actions">
            <span className="live-indicator"><span /> Live data</span>
            <button className="icon-button" onClick={fetchComplaints} title="Refresh data">
              ↻
            </button>
            <button className="primary-button" onClick={() => setShowForm(true)}>
              <span>＋</span> New complaint
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">COMMUNITY OPERATIONS</div>
              <h1>{activePage === 'Dashboard' ? 'Dashboard overview' : 'All complaints'}</h1>
              <p>Monitor incoming issues and keep your community moving forward.</p>
            </div>
            <div className="date-chip">
              <span>▦</span>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </section>

          {error && (
            <div className="error-banner">
              <span>⚠</span>
              <div><strong>Connection issue</strong><p>{error}</p></div>
              <button className="outline-button" onClick={fetchComplaints}>Try again</button>
            </div>
          )}

          <section className="stats-grid">
            <article className="stat-card stat-total">
              <div className="stat-top">
                <span>Total complaints</span><span className="stat-icon">▤</span>
              </div>
              <div className="stat-number">{stats.total}</div>
              <div className="stat-foot"><span className="neutral-dot" /> All recorded complaints</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Open cases</span><span className="stat-icon icon-amber">◷</span>
              </div>
              <div className="stat-number">{stats.open}</div>
              <div className="stat-foot"><span className="amber-dot" /> Awaiting attention</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>In progress</span><span className="stat-icon icon-violet">↗</span>
              </div>
              <div className="stat-number">{stats.inProgress}</div>
              <div className="stat-foot"><span className="violet-dot" /> Currently being handled</div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Resolved</span><span className="stat-icon icon-green">✓</span>
              </div>
              <div className="stat-number">{stats.resolved}</div>
              <div className="stat-foot">
                <span className="green-dot" /> {stats.resolutionRate}% resolution rate
              </div>
            </article>
          </section>

          {activePage === 'Dashboard' && (
            <section className="charts-grid">
              <article className="panel trend-panel">
                <div className="panel-heading">
                  <div><h2>Complaint activity</h2><p>New complaints over the last 7 days</p></div>
                  <span className="chart-tag">LAST 7 DAYS</span>
                </div>
                <div className="chart-area trend-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6258e8" stopOpacity={0.24} />
                          <stop offset="95%" stopColor="#6258e8" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#edf0f6" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#8991a5', fontSize: 11 }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#8991a5', fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="complaints" name="Complaints" stroke="#6258e8" strokeWidth={3} fill="url(#trendFill)" activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="panel status-panel">
                <div className="panel-heading">
                  <div><h2>Status distribution</h2><p>Current case breakdown</p></div>
                </div>
                <div className="donut-wrap">
                  <div className="donut-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="68%"
                          outerRadius="92%"
                          paddingAngle={4}
                          stroke="none"
                        >
                          {statusData.map(entry => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="donut-center">
                      <strong>{stats.total}</strong>
                      <span>Total cases</span>
                    </div>
                  </div>
                </div>
                <div className="legend-list">
                  {[
                    { name: 'Open', value: stats.open, color: STATUS_COLORS.OPEN },
                    { name: 'In progress', value: stats.inProgress, color: STATUS_COLORS.IN_PROGRESS },
                    { name: 'Resolved', value: stats.resolved, color: STATUS_COLORS.RESOLVED },
                  ].map(item => (
                    <div className="legend-row" key={item.name}>
                      <span className="legend-label"><i style={{ background: item.color }} />{item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel category-panel">
                <div className="panel-heading">
                  <div><h2>Complaints by category</h2><p>Understand the most reported issues</p></div>
                </div>
                <div className="chart-area category-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                      <CartesianGrid stroke="#edf0f6" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: '#8991a5', fontSize: 10 }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#8991a5', fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Complaints" fill="#6258e8" radius={[6, 6, 0, 0]} maxBarSize={42} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="panel resolution-panel">
                <div className="panel-heading">
                  <div><h2>Resolution progress</h2><p>Resolved cases compared with all complaints</p></div>
                </div>
                <div className="resolution-content">
                  <div className="resolution-ring" style={{ '--progress': `${stats.resolutionRate}%` }}>
                    <div><strong>{stats.resolutionRate}%</strong><span>Resolved</span></div>
                  </div>
                  <div className="resolution-copy">
                    <strong>{stats.resolved} of {stats.total}</strong>
                    <p>complaints have been resolved.</p>
                    <div className="progress-track">
                      <div style={{ width: `${stats.resolutionRate}%` }} />
                    </div>
                    <small>Based on current backend records</small>
                  </div>
                </div>
              </article>
            </section>
          )}

          <section className="panel complaints-panel">
            <div className="panel-heading complaints-heading">
              <div><h2>{activePage === 'Dashboard' ? 'Recent complaints' : 'Complaint directory'}</h2><p>Search, review, and manage submitted issues.</p></div>
              <button className="outline-button" onClick={fetchComplaints}>↻ Refresh</button>
            </div>

            <div className="filters-row">
              <div className="search-box">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search title, name, location or ID..."
                  aria-label="Search complaints"
                />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="Filter by category">
                <option value="ALL">All categories</option>
                {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="table-message"><div className="loader" /><p>Loading your complaints...</p></div>
            ) : error ? (
              <div className="table-message"><p>Complaint data is currently unavailable.</p></div>
            ) : filteredComplaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h3>{complaints.length ? 'No matching complaints' : 'No complaints yet'}</h3>
                <p>{complaints.length ? 'Try changing your search or filters.' : 'Create your first complaint to see it here.'}</p>
                {!complaints.length && <button className="primary-button" onClick={() => setShowForm(true)}>＋ Create complaint</button>}
              </div>
            ) : (
              <div className="table-scroll">
                <table className="complaints-table">
                  <thead>
                    <tr><th>COMPLAINT</th><th>CATEGORY</th><th>LOCATION</th><th>DATE</th><th>STATUS</th><th>ACTIONS</th></tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div className="complaint-cell">
                            <div className="complaint-avatar">{String(c.category || 'C').charAt(0)}</div>
                            <div><strong>{c.title}</strong><small>#{c.id} · {c.complainantName}</small></div>
                          </div>
                        </td>
                        <td><span className="category-pill">{c.category || 'OTHER'}</span></td>
                        <td><span className="location-cell">⌖ {c.location || 'Not specified'}</span></td>
                        <td><span className="date-cell">{formatDate(c.createdAt)}</span></td>
                        <td>
                          <span className={`status-badge status-${String(c.status || 'OPEN').toLowerCase()}`}>
                            <i />{formatStatus(c.status || 'OPEN')}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <select
                              className="status-select"
                              value={c.status || 'OPEN'}
                              onChange={e => updateStatus(c.id, e.target.value)}
                              aria-label={`Change status for complaint ${c.id}`}
                            >
                              <option value="OPEN">Open</option>
                              <option value="IN_PROGRESS">In progress</option>
                              <option value="RESOLVED">Resolved</option>
                            </select>
                            <button className="delete-button" onClick={() => deleteComplaint(c.id)} title="Delete complaint" aria-label={`Delete complaint ${c.id}`}>×</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="table-footer">
                  Showing <strong>{filteredComplaints.length}</strong> of <strong>{complaints.length}</strong> complaints
                </div>
              </div>
            )}
          </section>

          <footer className="page-footer">
            <span>ComplainX · Smart Complaint Management</span>
            <span>Powered by Spring Boot & React</span>
          </footer>
        </div>
      </main>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="complaint-modal">
            <div className="modal-header">
              <div><span className="modal-eyebrow">COMMUNITY SUPPORT</span><h2>Submit a complaint</h2><p>Provide the details so your issue can be tracked.</p></div>
              <button className="modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>

            <form className="complaint-form" onSubmit={createComplaint}>
              <label>Complaint title<input required maxLength={100} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Water leakage in building" /></label>
              <div className="form-two-col">
                <label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
                <label>Complainant name<input required value={form.complainantName} onChange={e => setForm({ ...form, complainantName: e.target.value })} placeholder="Your full name" /></label>
              </div>
              <label>Location<input required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Building, street or area" /></label>
              <label>Description<textarea required maxLength={1000} rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue and any helpful details..." /></label>
              <div className="modal-actions"><button type="button" className="outline-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button" disabled={saving} type="submit">{saving ? 'Submitting...' : 'Submit complaint →'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
