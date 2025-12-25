import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Badge, Button, Card, SectionHeader, Stat } from '../components/Primitives';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [snapshotUrl, setSnapshotUrl] = useState('');

  const fetchEvents = async () => {
    const res = await api.get('/events/');
    setEvents(res.data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchSnapshot = async () => {
    try {
      const res = await api.get('/cameras/1/snapshot', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setSnapshotUrl(url);
    } catch (err) {
      console.error('snapshot error', err);
    }
  };

  const chartData = useMemo(() => {
    const counts = {};
    events.forEach((ev) => {
      const type = ev.vehicle_type || 'Unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({ name: key, count: counts[key] }));
  }, [events]);

  const materialData = useMemo(() => {
    const counts = {};
    events.forEach((ev) => {
      const mat = ev.material_type || 'Unknown';
      counts[mat] = (counts[mat] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({ name: key, value: counts[key] }));
  }, [events]);

  const avgLoad = useMemo(() => {
    const loads = events.map((e) => Number(e.load_percentage || 0)).filter((n) => !Number.isNaN(n));
    if (!loads.length) return 0;
    return loads.reduce((a, b) => a + b, 0) / loads.length;
  }, [events]);

  const recentEvents = events.slice(0, 6);
  const totalEvents = events.length;
  const lastSnapshot = recentEvents[0]?.timestamp;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="hero fade-up">
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Live Operations</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>Vehicle Analytics Control Room</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            Monitor stream health, ROI coverage and vehicle events in one pane.
          </div>
        </div>
        <div className="flex gap-md items-center">
          <Badge tone="success">Streams Active</Badge>
          <Button onClick={fetchEvents}>Refresh data</Button>
        </div>
      </div>

      <div className="grid three">
        <Stat label="Total events" value={totalEvents} hint="Across all cameras" />
        <Stat label="Cameras monitored" value="1" hint="Sample demo camera" />
        <Stat label="Last snapshot" value={lastSnapshot ? new Date(lastSnapshot).toLocaleTimeString() : '—'} hint="Latest event capture" />
      </div>

      <Card
        title="Vehicle mix"
        subtitle="Distribution by detected vehicle type"
      >
        <div className="chart-wrap">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted)" tickLine={false} />
              <YAxis allowDecimals={false} stroke="var(--muted)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#11182d', border: '1px solid var(--border)', borderRadius: 10 }} />
              <Legend />
              <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7cf2c4" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#7ab6ff" stopOpacity={0.95} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Recent activity" subtitle="Latest detections and metadata">
        <div className="grid two">
          <div className="panel card">
            <SectionHeader title="Timeline" subtitle="Newest to oldest" />
            <div className="grid" style={{ gap: 10 }}>
              {recentEvents.length === 0 && <div className="muted">No events yet.</div>}
              {recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="panel card"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div style={{ fontWeight: 600 }}>{ev.vehicle_type || 'Unknown'}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {new Date(ev.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Badge>{ev.entry_exit}</Badge>
                  </div>
                  <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                    Gate #{ev.gate_id} • Camera #{ev.camera_id} • Confidence {ev.confidence ?? '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel card">
            <SectionHeader title="Stream sentiment" subtitle="Smoothed activity curve" />
            <div className="chart-wrap">
              <ResponsiveContainer>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7cf2c4" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#7ab6ff" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--muted)" tickLine={false} />
                  <YAxis stroke="var(--muted)" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#11182d', border: '1px solid var(--border)', borderRadius: 10 }} />
                  <Area type="monotone" dataKey="count" stroke="#7ab6ff" fillOpacity={1} fill="url(#areaGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Material & Load" subtitle="Breakdown and average load">
        <div className="grid two">
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={materialData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {materialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#7cf2c4', '#7ab6ff', '#f7b267', '#ff6b6b', '#9d7afc'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#11182d', border: '1px solid var(--border)', borderRadius: 10 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="panel card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="surface-title">Average load</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{avgLoad.toFixed(1)}%</div>
            <div className="muted" style={{ marginTop: 6 }}>Based on reported load_percentage</div>
            <div style={{ marginTop: 12, height: 12, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, avgLoad))}%`, background: 'linear-gradient(90deg, #7cf2c4, #7ab6ff)' }} />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Live preview" subtitle="Latest camera snapshot">
        <div className="flex gap-md items-center" style={{ marginBottom: 10 }}>
          <Button variant="secondary" onClick={fetchSnapshot}>Refresh snapshot</Button>
          <div className="muted">Camera #1 snapshot endpoint</div>
        </div>
        {snapshotUrl ? (
          <div className="panel" style={{ padding: 8 }}>
            <img src={snapshotUrl} alt="snapshot" style={{ width: '100%', borderRadius: 12 }} />
          </div>
        ) : (
          <div className="muted">No snapshot yet. Click refresh.</div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
