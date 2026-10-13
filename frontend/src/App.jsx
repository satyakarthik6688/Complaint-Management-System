import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:8080/api/complaints';

function App() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: 'WATER',
    complainantName: '',
    description: '',
    location: ''
  });

  const [showForm, setShowForm] = useState(false);

  async function fetchComplaints() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Unable to load complaints.');
      }

      const data = await response.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        'Cannot connect to the backend. Check that Spring Boot is running on port 8080.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, []);

  async function createComplaint(e) {
    e.preventDefault();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error('Failed to create complaint.');
      }

      setForm({
        title: '',
        category: 'WATER',
        complainantName: '',
        description: '',
        location: ''
      });

      setShowForm(false);
      await fetchComplaints();
    } catch (err) {
      alert(err.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update status.');
      }

      await fetchComplaints();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteComplaint(id) {
    if (!window.confirm('Are you sure you want to delete this complaint?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete complaint.');
      }

      await fetchComplaints();
    } catch (err) {
      alert(err.message);
    }
  }

  const pending = complaints.filter(c => c.status === 'PENDING').length;
  const progress = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>⚡ ComplainX</h2>
        <p className="side-label">WORKSPACE</p>
        <div className="nav-item active">▦ Dashboard</div>
        <div className="nav-item">▤ Complaints</div>
        <div className="nav-item">⚙ Settings</div>
        <div className="sidebar-bottom">Complaint Management System</div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
            <p>Manage and track your complaints.</p>
          </div>
          <button className="primary-btn" onClick={() => setShowForm(true)}>
            + New Complaint
          </button>
        </header>

        <section className="stats">
          <div className="stat-card">
            <span>Total Complaints</span>
            <h2>{complaints.length}</h2>
            <small>All submitted complaints</small>
          </div>
          <div className="stat-card">
            <span>Pending</span>
            <h2>{pending}</h2>
            <small>Awaiting action</small>
          </div>
          <div className="stat-card">
            <span>In Progress</span>
            <h2>{progress}</h2>
            <small>Currently being handled</small>
          </div>
          <div className="stat-card">
            <span>Resolved</span>
            <h2>{resolved}</h2>
            <small>Successfully completed</small>
          </div>
        </section>

        <section className="complaints-panel">
          <div className="panel-header">
            <div>
              <h2>Recent Complaints</h2>
              <p>View and manage submitted complaints.</p>
            </div>
            <button className="secondary-btn" onClick={fetchComplaints}>
              ↻ Refresh
            </button>
          </div>

          {loading && <p>Loading complaints...</p>}

          {error && (
            <div className="error-message">
              {error}
              <button className="secondary-btn" onClick={fetchComplaints}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && complaints.length === 0 && (
            <div className="empty-state">
              <h3>No complaints yet</h3>
              <p>Create your first complaint to get started.</p>
            </div>
          )}

          {!loading && !error && complaints.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Complaint</th>
                    <th>Category</th>
                    <th>Complainant</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(c => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td>
                        <strong>{c.title}</strong>
                        <small className="description">
                          {c.description}
                        </small>
                      </td>
                      <td>{c.category}</td>
                      <td>{c.complainantName}</td>
                      <td>{c.location}</td>
                      <td>
                        <span className={`status ${String(c.status || '').toLowerCase()}`}>
                          {(c.status || 'UNKNOWN').replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <select
                          value={c.status}
                          onChange={e => updateStatus(c.id, e.target.value)}
                          aria-label={`Update complaint ${c.id} status`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                        <button
                          className="delete-btn"
                          onClick={() => deleteComplaint(c.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showForm && (
          <div className="modal-backdrop">
            <div className="modal">
              <div className="modal-heading">
                <h2>Submit a Complaint</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowForm(false)}
                  aria-label="Close form"
                >
                  ×
                </button>
              </div>

              <form onSubmit={createComplaint}>
                <label>Complaint Title</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Water Leakage"
                />

                <label>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="WATER">Water</option>
                  <option value="ELECTRICITY">Electricity</option>
                  <option value="CLEANLINESS">Cleanliness</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OTHER">Other</option>
                </select>

                <label>Complainant Name</label>
                <input
                  required
                  value={form.complainantName}
                  onChange={e =>
                    setForm({ ...form, complainantName: e.target.value })
                  }
                  placeholder="Enter your name"
                />

                <label>Location</label>
                <input
                  required
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Hostel Block A"
                />

                <label>Description</label>
                <textarea
                  required
                  rows="3"
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the issue"
                />

                <button className="primary-btn full-btn" type="submit">
                  Submit Complaint
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;