'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminClient({ initialActiveTabs, initialResultsPublished }) {
  const router = useRouter();

  // Settings Toggles State
  const [activeTabs, setActiveTabs] = useState(initialActiveTabs);
  const [resultsPublished, setResultsPublished] = useState(initialResultsPublished);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });

  // Stats Analytics State
  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Candidate Datatable State
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [allCandidates, setAllCandidates] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);

  // CRUD Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'edit'
  const [formError, setFormError] = useState('');
  const [savingCandidate, setSavingCandidate] = useState(false);

  // Form Fields
  const [formRoll, setFormRoll] = useState('');
  const [formPaymentId, setFormPaymentId] = useState('');
  const [formName, setFormName] = useState('');
  const [formFatherName, setFormFatherName] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formQuota, setFormQuota] = useState('');
  const [formDate, setFormDate] = useState('02-08-2026');
  const [formShift, setFormShift] = useState('1st Shift (09:30 AM to 12:00 PM)');
  const [formBuilding, setFormBuilding] = useState('Shahid Syed Nazrul Islam Academic Building (SSNIAB)');
  const [formRoom, setFormRoom] = useState('');
  const [formStatus, setFormStatus] = useState('notSelected'); // 'selected' | 'waiting' | 'notSelected'
  const [formComment, setFormComment] = useState('');

  // Delete Confirm State
  const [deleteRoll, setDeleteRoll] = useState('');

  // Fetch candidates from API
  const fetchCandidates = async () => {
    setLoadingTable(true);
    try {
      const res = await fetch(`/api/admin/candidates?page=1&limit=10000`);
      if (res.ok) {
        const data = await res.json();
        setAllCandidates(data.candidates || []);
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load jQuery and DataTables.net from CDN dynamically
  useEffect(() => {
    if (window.jQuery && window.jQuery.fn.DataTable) {
      setScriptsLoaded(true);
      return;
    }

    const jQueryScript = document.createElement('script');
    jQueryScript.src = 'https://code.jquery.com/jquery-3.7.0.min.js';
    jQueryScript.async = true;
    
    jQueryScript.onload = () => {
      const datatablesScript = document.createElement('script');
      datatablesScript.src = 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js';
      datatablesScript.async = true;
      
      datatablesScript.onload = () => {
        setScriptsLoaded(true);
      };
      document.body.appendChild(datatablesScript);
    };
    
    document.body.appendChild(jQueryScript);

    // Load DataTables CSS
    const datatablesCSS = document.createElement('link');
    datatablesCSS.rel = 'stylesheet';
    datatablesCSS.href = 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css';
    document.head.appendChild(datatablesCSS);

    return () => {
      if (document.body.contains(jQueryScript)) {
        document.body.removeChild(jQueryScript);
      }
    };
  }, []);

  useEffect(() => {
    fetchCandidates();
    fetchStats();
  }, []);

  // Initialize/reinitialize jQuery DataTable on data change
  useEffect(() => {
    if (!scriptsLoaded || allCandidates.length === 0) return;

    const $ = window.jQuery;
    if (!$) return;

    const tableEl = $('#adminCandidatesTable');
    if (tableEl.length === 0) return;

    if ($.fn.DataTable.isDataTable('#adminCandidatesTable')) {
      tableEl.DataTable().destroy();
      tableEl.empty();
    }

    tableEl.DataTable({
      data: allCandidates,
      columns: [
        { title: "Roll", data: "roll", className: "dt-roll-cell" },
        { title: "Candidate Name", data: "name" },
        { title: "Department", data: "department", defaultContent: "N/A" },
        { title: "Assigned Room", data: "room", defaultContent: "N/A" },
        { title: "Exam Building", data: "building_name", defaultContent: "N/A" },
        { 
          title: "Status", 
          data: null,
          render: function(data, type, row) {
            if (row.selected) return '<span style="color:#39e574;font-weight:600;">Selected</span>';
            if (row.waiting_list) return '<span style="color:#e2b740;font-weight:600;">Waiting List</span>';
            return '<span style="color:var(--text-secondary);">Not Selected</span>';
          }
        },
        {
          title: "Actions",
          data: null,
          orderable: false,
          render: function(data, type, row) {
            return `
              <div style="display:inline-flex;gap:0.5rem;">
                <button class="dt-edit-btn" data-roll="${row.roll}">Edit</button>
                <button class="dt-delete-btn" data-roll="${row.roll}">Delete</button>
              </div>
            `;
          }
        }
      ],
      pageLength: 10,
      order: [[0, 'asc']],
      language: {
        search: "Search:",
        lengthMenu: "Show _MENU_ entries",
        info: "Showing _START_ to _END_ of _TOTAL_ entries",
        paginate: {
          previous: "←",
          next: "→"
        }
      }
    });

    // Row edit event listener
    tableEl.off('click', '.dt-edit-btn');
    tableEl.on('click', '.dt-edit-btn', function() {
      const roll = $(this).attr('data-roll');
      const candidate = allCandidates.find(c => String(c.roll) === String(roll));
      if (candidate) openFormModal('edit', candidate);
    });

    // Row delete event listener
    tableEl.off('click', '.dt-delete-btn');
    tableEl.on('click', '.dt-delete-btn', function() {
      const roll = $(this).attr('data-roll');
      setDeleteRoll(String(roll));
    });

  }, [allCandidates, scriptsLoaded]);

  // Handle Tab configuration toggles update
  const handleTabToggle = (tabKey) => {
    if (activeTabs.includes(tabKey)) {
      // Must keep at least one tab active
      if (activeTabs.length === 1) {
        setSettingsMsg({ type: 'error', text: 'At least one tab must remain active!' });
        setTimeout(() => setSettingsMsg({ type: '', text: '' }), 3000);
        return;
      }
      setActiveTabs(activeTabs.filter(t => t !== tabKey));
    } else {
      setActiveTabs([...activeTabs, tabKey]);
    }
  };

  const saveTabSettings = async () => {
    setSavingSettings(true);
    setSettingsMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeTabs, resultsPublished })
      });
      if (res.ok) {
        setSettingsMsg({ type: 'success', text: 'Tab configuration saved successfully!' });
      } else {
        setSettingsMsg({ type: 'error', text: 'Failed to update tab configuration.' });
      }
    } catch (err) {
      setSettingsMsg({ type: 'error', text: 'Connection error. Please try again.' });
    } finally {
      setSavingSettings(false);
      setTimeout(() => setSettingsMsg({ type: '', text: '' }), 4000);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Open Form Modal
  const openFormModal = (type, candidateData = null) => {
    setModalType(type);
    setFormError('');
    if (type === 'add') {
      setFormRoll('');
      setFormPaymentId('');
      setFormName('');
      setFormFatherName('');
      setFormDept('CSE');
      setFormQuota('');
      setFormDate('02-08-2026');
      setFormShift('1st Shift (09:30 AM to 12:00 PM)');
      setFormBuilding('Shahid Syed Nazrul Islam Academic Building (SSNIAB)');
      setFormRoom('');
      setFormStatus('notSelected');
      setFormComment('');
    } else if (type === 'edit' && candidateData) {
      setFormRoll(String(candidateData.roll));
      setFormPaymentId(String(candidateData.payment_id || ''));
      setFormName(String(candidateData.name || ''));
      setFormFatherName(candidateData.father_name || '');
      setFormDept(candidateData.department || 'CSE');
      setFormQuota(candidateData.quota || '');
      setFormDate(candidateData.date || '02-08-2026');
      setFormShift(candidateData.shift_with_time || '1st Shift (09:30 AM to 12:00 PM)');
      setFormBuilding(candidateData.building_name || '');
      setFormRoom(candidateData.room || '');
      
      let status = 'notSelected';
      if (candidateData.selected) status = 'selected';
      else if (candidateData.waiting_list) status = 'waiting';
      setFormStatus(status);
      
      setFormComment(candidateData.comment || '');
    }
    setModalOpen(true);
  };

  // Save Candidate
  const handleSaveCandidate = async (e) => {
    e.preventDefault();
    const rollStr = String(formRoll || '').trim();
    const nameStr = String(formName || '').trim();

    if (!rollStr || !nameStr) {
      setFormError('Roll and Name are required fields.');
      return;
    }

    setSavingCandidate(true);
    setFormError('');

    const body = {
      roll: rollStr,
      payment_id: String(formPaymentId || '').trim(),
      name: nameStr,
      father_name: String(formFatherName || '').trim(),
      department: formDept,
      quota: String(formQuota || '').trim(),
      date: formDate,
      shift_with_time: formShift,
      building_name: formBuilding,
      room: String(formRoom || '').trim(),
      selected: formStatus === 'selected',
      waiting_list: formStatus === 'waiting',
      comment: String(formComment || '').trim()
    };

    try {
      const url = '/api/admin/candidates';
      const method = modalType === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        setModalOpen(false);
        fetchCandidates();
        fetchStats(); // Update graphs
      } else {
        setFormError(data.error || 'An error occurred while saving.');
      }
    } catch (err) {
      setFormError('Connection error. Please try again.');
    } finally {
      setSavingCandidate(false);
    }
  };

  // Delete Candidate
  const handleDeleteCandidate = async () => {
    if (!deleteRoll) return;

    try {
      const res = await fetch(`/api/admin/candidates?roll=${deleteRoll}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteRoll('');
        fetchCandidates();
        fetchStats(); // Update graphs
      } else {
        alert('Failed to delete candidate.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error occurred.');
    }
  };



  // Pie chart computations
  const getPieChartSlices = () => {
    if (!statsData || !statsData.selection) return null;
    const stats = statsData.selection;
    const total = stats.reduce((acc, s) => acc + s.count, 0) || 1;

    let accumAngle = 0;
    return stats.map((slice, index) => {
      const percentage = (slice.count / total) * 100;
      const angle = (slice.count / total) * 360;
      const startAngle = accumAngle;
      accumAngle += angle;

      // Coordinate helper functions for SVG drawing
      const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
          x: centerX + radius * Math.cos(angleInRadians),
          y: centerY + radius * Math.sin(angleInRadians)
        };
      };

      const describeArc = (x, y, radius, startAngle, endAngle) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
        return [
          'M', start.x, start.y,
          'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
          'L', x, y,
          'Z'
        ].join(' ');
      };

      const colors = ['#39e574', '#e2b740', '#ff5a79']; // Selected, Waiting, Not Selected
      const pathData = describeArc(100, 100, 80, startAngle, startAngle + angle);

      return {
        ...slice,
        percentage: percentage.toFixed(1),
        pathData,
        color: colors[index]
      };
    });
  };

  const slices = getPieChartSlices();

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Top Banner Navigation */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-icons" style={{ color: 'var(--accent-gold)', fontSize: '2rem' }}>admin_panel_settings</span>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>DUET Administrator Panel</h1>
          </div>
          <p className="subtitle" style={{ marginTop: '0.25rem' }}>Full management system for admission candidate seats, active config & visitor stats</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/secret-stats" className="pagination-btn" style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(57, 229, 116, 0.1)', color: '#39e574', border: '1px solid rgba(57, 229, 116, 0.2)' }}>
            <span className="material-icons" style={{ fontSize: '1.1rem' }}>analytics</span>
            View Visitor Logs
          </Link>
          <button onClick={handleSignOut} className="pagination-btn" style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#ff8597', borderColor: 'rgba(255, 133, 151, 0.2)' }}>
            <span className="material-icons" style={{ fontSize: '1.1rem' }}>logout</span>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Admin Contents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2.5rem' }}>
        
        {/* Left Column: Toggles & Analytics charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section A: Config Tab Visibility */}
          <div className="info-card" style={{ padding: '1.5rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <span className="material-icons" style={{ color: 'var(--accent-gold)' }}>settings</span>
              Client Tab Config
            </h2>
            <p className="subtitle" style={{ margin: '0.5rem 0 1.25rem 0', fontSize: '0.8rem', lineHeight: '1.4' }}>
              Control which tabs are active on the portal. Deactivated tabs will not be visible to search applicants.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'rgba(5,10,6,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <input
                  type="checkbox"
                  checked={activeTabs.includes('seatPlan')}
                  onChange={() => handleTabToggle('seatPlan')}
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--accent-gold)' }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Seat Plan & Map Location</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Shows exam center, map & coordinates</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'rgba(5,10,6,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <input
                  type="checkbox"
                  checked={activeTabs.includes('selection')}
                  onChange={() => handleTabToggle('selection')}
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--accent-gold)' }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Admission Selection Status</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Shows selected/waiting badge and Quranic Ayat</div>
                </div>
              </label>

              <div style={{ margin: '0.5rem 0', height: '1px', background: 'var(--border-light)' }}></div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'rgba(5,10,6,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <input
                  type="checkbox"
                  checked={resultsPublished}
                  onChange={() => setResultsPublished(!resultsPublished)}
                  style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--accent-gold)' }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Publish Selection Results</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Toggles visibility of Selected/Waiting results to candidates</div>
                </div>
              </label>

              {settingsMsg.text && (
                <div className={`error-message ${settingsMsg.type === 'success' ? 'success' : ''}`} style={{ margin: 0, padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: settingsMsg.type === 'success' ? '#39e574' : '#ff8597', background: settingsMsg.type === 'success' ? 'rgba(57, 229, 116, 0.05)' : 'rgba(255, 133, 151, 0.05)', border: settingsMsg.type === 'success' ? '1px solid rgba(57, 229, 116, 0.2)' : '1px solid rgba(255, 133, 151, 0.2)' }}>
                  {settingsMsg.text}
                </div>
              )}

              <button
                onClick={saveTabSettings}
                disabled={savingSettings}
                className="search-button"
                style={{ width: '100%', height: '2.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
              >
                {savingSettings ? 'Saving...' : 'Apply Tab Configuration'}
              </button>
            </div>
          </div>

          {/* Section B: Analytics Visualization */}
          <div className="info-card" style={{ padding: '1.5rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <span className="material-icons" style={{ color: 'var(--accent-gold)' }}>bar_chart</span>
              Admission Statistics
            </h2>

            {loadingStats ? (
              <div style={{ padding: '2rem', textHeight: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
                Loading visual metrics...
              </div>
            ) : !statsData ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Failed to retrieve analytics.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. Selection Status Pie Chart */}
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Selection Ratio (Pie/Donut)
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <svg width="200" height="200" viewBox="0 0 200 200">
                      {slices && slices.length > 0 ? (
                        slices.map((slice, i) => (
                          <path
                            key={i}
                            d={slice.pathData}
                            fill={slice.color}
                            stroke="#050a06"
                            strokeWidth="2"
                            title={`${slice.name}: ${slice.count} (${slice.percentage}%)`}
                            style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                          />
                        ))
                      ) : (
                        <circle cx="100" cy="100" r="80" fill="rgba(5, 10, 6, 0.4)" stroke="var(--border-light)" />
                      )}
                      <circle cx="100" cy="100" r="40" fill="#050c07" />
                    </svg>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                      {slices && slices.map((slice, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: slice.color, display: 'inline-block' }}></span>
                          <span style={{ fontWeight: 'bold' }}>{slice.percentage}%</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{slice.name} ({slice.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Candidate counts by Department (Bar Chart) */}
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Candidates By Department (Bar)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                    {statsData.departments && statsData.departments.slice(0, 5).map((dept, i) => {
                      const maxCount = Math.max(...statsData.departments.map(d => d.count)) || 1;
                      const widthPercent = (dept.count / maxCount) * 100;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '600' }}>{dept.name}</span>
                            <span style={{ color: 'var(--accent-gold)' }}>{dept.count} candidates</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${widthPercent}%`, height: '100%', background: 'linear-gradient(to right, var(--accent-gold), #ffd359)', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Site traffic (Line / Area chart) */}
                <div>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Traffic logs (Past 7 Days Line)
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '0.5rem', background: 'rgba(5, 10, 6, 0.3)', padding: '1rem 0.5rem 0.25rem 0.5rem', borderBottom: '1px solid var(--border-light)', borderRadius: '6px' }}>
                    {statsData.traffic && statsData.traffic.map((log, i) => {
                      const maxVisits = Math.max(...statsData.traffic.map(t => t.count)) || 1;
                      const barHeight = (log.count / maxVisits) * 80;
                      const displayDate = log.date.split('-')[2] + ' ' + new Date(log.date).toLocaleString('default', { month: 'short' });
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#39e574' }}>{log.count}</div>
                          <div style={{ width: '100%', height: `${barHeight}px`, background: 'rgba(57, 229, 116, 0.25)', borderTop: '2px solid #39e574', borderLeft: '1px solid rgba(57, 229, 116, 0.1)', borderRight: '1px solid rgba(57, 229, 116, 0.1)' }} title={log.date}></div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{displayDate}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Right Column: Candidate Database datatable CRUD */}
        <div>
          <div className="info-card" style={{ padding: '1.5rem', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 className="card-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', padding: 0, margin: 0 }}>
                  <span className="material-icons" style={{ color: 'var(--accent-gold)' }}>group</span>
                  Candidate Record Database
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Manage DUET candidates (total records: {allCandidates.length})
                </div>
              </div>
              <button
                onClick={() => openFormModal('add')}
                className="search-button"
                style={{ height: '2.25rem', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>add</span>
                Add Candidate
              </button>
            </div>

            {/* Candidates Table managed by jQuery DataTables.net */}
            <div className="data-table-container" style={{ flex: 1, width: '100%', overflowX: 'auto' }}>
              {!scriptsLoaded || loadingTable ? (
                <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
                  Loading Candidate Database with DataTables.net...
                </div>
              ) : (
                <table id="adminCandidatesTable" className="display" style={{ width: '100%', fontSize: '0.9rem' }}></table>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* CRUD Add/Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 5, 3, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="search-card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: 'rgba(5, 12, 6, 0.95)', border: '1px solid var(--border-light)' }}>
            <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-icons" style={{ color: 'var(--accent-gold)' }}>
                {modalType === 'add' ? 'person_add' : 'edit'}
              </span>
              {modalType === 'add' ? 'Add Candidate Record' : 'Modify Candidate Record'}
            </h2>

            <form onSubmit={handleSaveCandidate} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
              
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Roll Number</label>
                <input
                  type="text"
                  className="search-input"
                  value={formRoll}
                  onChange={(e) => setFormRoll(e.target.value)}
                  disabled={modalType === 'edit' || savingCandidate}
                  style={{ width: '100%', height: '2.5rem' }}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Payment ID</label>
                <input
                  type="text"
                  className="search-input"
                  value={formPaymentId}
                  onChange={(e) => setFormPaymentId(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '2.5rem' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Candidate Name</label>
                <input
                  type="text"
                  className="search-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '2.5rem' }}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Father's Name</label>
                <input
                  type="text"
                  className="search-input"
                  value={formFatherName}
                  onChange={(e) => setFormFatherName(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '2.5rem' }}
                />
              </div>

              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Department</label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '2.5rem', background: 'rgba(5, 10, 6, 0.8)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', padding: '0 0.5rem' }}
                >
                  <option value="CSE">CSE</option>
                  <option value="EEE">EEE</option>
                  <option value="ME">ME</option>
                  <option value="CE">CE</option>
                  <option value="TE">TE</option>
                  <option value="Arch">Arch</option>
                  <option value="IPE">IPE</option>
                  <option value="ChE">ChE</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Quota Category</label>
                <input
                  type="text"
                  className="search-input"
                  value={formQuota}
                  placeholder="e.g. Freedom Fighter"
                  onChange={(e) => setFormQuota(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '2.5rem' }}
                />
              </div>

              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Exam Date</label>
                <input
                  type="text"
                  className="search-input"
                  value={formDate}
                  placeholder="DD-MM-YYYY"
                  onChange={(e) => setFormDate(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '2.5rem' }}
                />
              </div>

              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Assigned Room</label>
                <input
                  type="text"
                  className="search-input"
                  value={formRoom}
                  placeholder="e.g. 3010"
                  onChange={(e) => setFormRoom(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '2.5rem' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Exam Shift & Time String</label>
                <input
                  type="text"
                  className="search-input"
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '2.5rem' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Exam Building Name</label>
                <select
                  value={formBuilding}
                  onChange={(e) => setFormBuilding(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '2.5rem', background: 'rgba(5, 10, 6, 0.8)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', padding: '0 0.5rem' }}
                >
                  <option value="Shahid Syed Nazrul Islam Academic Building (SSNIAB)">Shahid Syed Nazrul Islam Academic Building (SSNIAB)</option>
                  <option value="Textile Workshop Building (TWB)">Textile Workshop Building (TWB)</option>
                  <option value="Administration Building">Administration Building</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Admission Selection Status</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" name="status" checked={formStatus === 'notSelected'} onChange={() => setFormStatus('notSelected')} style={{ accentColor: 'var(--accent-gold)' }} />
                    <span>Not Selected</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" name="status" checked={formStatus === 'selected'} onChange={() => setFormStatus('selected')} style={{ accentColor: 'var(--accent-gold)' }} />
                    <span style={{ color: '#39e574', fontWeight: 'bold' }}>Selected</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" name="status" checked={formStatus === 'waiting'} onChange={() => setFormStatus('waiting')} style={{ accentColor: 'var(--accent-gold)' }} />
                    <span style={{ color: '#e2b740', fontWeight: 'bold' }}>Waiting List</span>
                  </label>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 'bold' }}>Record comment</label>
                <textarea
                  className="search-input"
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  disabled={savingCandidate}
                  style={{ width: '100%', height: '3.5rem', padding: '0.5rem', resize: 'vertical' }}
                />
              </div>

              {formError && (
                <div className="error-message" style={{ gridColumn: 'span 2', margin: 0, padding: '0.5rem' }}>
                  {formError}
                </div>
              )}

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={savingCandidate}
                  className="pagination-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCandidate}
                  className="search-button"
                  style={{ height: '2.5rem', padding: '0 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span className="material-icons" style={{ fontSize: '1.1rem' }}>save</span>
                  {savingCandidate ? 'Saving...' : 'Save Record'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteRoll && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 5, 3, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="search-card" style={{ width: '100%', maxWidth: '420px', padding: '2rem', background: 'rgba(5, 12, 6, 0.95)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
            <span className="material-icons" style={{ color: '#ff5a79', fontSize: '3rem', marginBottom: '1rem' }}>warning</span>
            <h2 style={{ fontSize: '1.3rem', color: '#ff5a79', marginBottom: '0.75rem' }}>Confirm Delete Candidate?</h2>
            <p className="subtitle" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Are you sure you want to delete candidate record <strong>#{deleteRoll}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteRoll('')} className="pagination-btn">Cancel</button>
              <button onClick={handleDeleteCandidate} className="search-button" style={{ background: '#ff5a79', borderColor: '#ff5a79', color: '#fff', height: '2.25rem', padding: '0 1.25rem' }}>
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
