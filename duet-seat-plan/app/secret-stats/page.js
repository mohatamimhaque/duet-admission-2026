import { query } from '@/lib/db';
import { logVisit } from '@/lib/tracking';
import { getSessionAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SecretStats({ searchParams }) {
  const isAdmin = await getSessionAdmin();
  if (!isAdmin) {
    redirect('/admin/login');
  }

  const headersList = await headers();
  
  // Resolve search parameters (Next.js 15+ searchParams is a promise)
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10);
  
  // Log the visit to the stats page itself, noting the active page parameter
  await logVisit(`/secret-stats?page=${page}`, headersList);

  // Pagination parameters
  const limit = 15;
  const offset = (page - 1) * limit;

  // Fetch metrics from the database
  let candidateCount = 0;
  let totalVisits = 0;
  let uniqueIps = 0;
  let recentVisits = [];
  let totalPages = 1;

  try {
    const candidatesRes = await query('SELECT COUNT(*) FROM candidates;');
    candidateCount = candidatesRes.rows[0].count;

    const visitsCountRes = await query('SELECT COUNT(*) FROM site_visits;');
    totalVisits = parseInt(visitsCountRes.rows[0].count, 10);
    totalPages = Math.ceil(totalVisits / limit) || 1;

    const uniqueIpsRes = await query('SELECT COUNT(DISTINCT ip_address) FROM site_visits;');
    uniqueIps = uniqueIpsRes.rows[0].count;

    // Retrieve logs for the current paginated view
    const recentVisitsRes = await query(
      'SELECT id, path, timestamp, user_agent, ip_address FROM site_visits ORDER BY timestamp DESC LIMIT $1 OFFSET $2;',
      [limit, offset]
    );
    recentVisits = recentVisitsRes.rows;
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
  }

  // Ensure page boundaries are safe
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  return (
    <div className="container">
      <header>
        <div className="logo-container">
          <div className="logo-circle" style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}>★</div>
        </div>
        <h1>Secret Visitor Dashboard</h1>
        <p className="subtitle">
          Real-time Analytics, Data Metrics & Candidate Site Visits Log
        </p>
      </header>

      {/* Analytics Summary */}
      <div className="admin-stats-grid">
        <div className="stat-item">
          <div className="stat-number">{candidateCount}</div>
          <div className="stat-label">Total Loaded Candidates</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{totalVisits}</div>
          <div className="stat-label">Total Page Views / Logs</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{uniqueIps}</div>
          <div className="stat-label">Unique IPs Tracked</div>
        </div>
      </div>

      {/* Visits Table */}
      <div className="admin-card">
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>
          Recent Website Page Views (Showing logs {offset + 1} - {Math.min(offset + limit, totalVisits)})
        </h2>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Page Path / Query</th>
                <th>IP Address</th>
                <th>Timestamp</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {recentVisits.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No tracking logs found.
                  </td>
                </tr>
              ) : (
                recentVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>#{visit.id}</td>
                    <td style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#39e574' }}>
                      {visit.path}
                    </td>
                    <td>{visit.ip_address}</td>
                    <td>
                      {new Date(visit.timestamp).toLocaleString('en-US', {
                        timeZone: 'Asia/Dhaka',
                        hour12: true,
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td 
                      style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-secondary)', 
                        maxWidth: '250px',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }} 
                      title={visit.user_agent}
                    >
                      {visit.user_agent}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <Link 
              href={`/secret-stats?page=${page - 1}`} 
              className="pagination-btn"
              style={{ 
                opacity: isFirstPage ? 0.35 : 1, 
                pointerEvents: isFirstPage ? 'none' : 'auto' 
              }}
              aria-disabled={isFirstPage}
              tabIndex={isFirstPage ? -1 : undefined}
            >
              ← Previous
            </Link>
            
            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>
            
            <Link 
              href={`/secret-stats?page=${page + 1}`} 
              className="pagination-btn"
              style={{ 
                opacity: isLastPage ? 0.35 : 1, 
                pointerEvents: isLastPage ? 'none' : 'auto' 
              }}
              aria-disabled={isLastPage}
              tabIndex={isLastPage ? -1 : undefined}
            >
              Next →
            </Link>
          </div>
        )}
      </div>

      <footer>
        <p className="footer-credits">
          DUET Internal Security & System Monitoring Panel | Confidential Info
        </p>
      </footer>
    </div>
  );
}
