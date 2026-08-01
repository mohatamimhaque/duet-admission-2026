'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Load Leaflet map dynamically with SSR disabled to prevent 'window is not defined' error
const LeafletMap = dynamic(
  () => import('./LeafletMap'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(5,10,6,0.3)', color: 'var(--text-secondary)' }}>
        Loading Map canvas...
      </div>
    )
  }
);

// Quranic Ayats dictionary matched to status
const quranAyats = {
  selected: {
    arabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ ۚ عَلَيْهِ تَوَكَّلْتُ وَإِلَيْهِ أُنِيبُ",
    pronunciation: "ওয়া মা তাওফিকি ইল্লা বিল্লাহ, আলাইহি তাওয়াক্কালতু ওয়া ইলাইহি উনিব",
    bangla: "আমার সাফল্য তো কেবল আল্লাহরই সাহায্যে; আমি তাঁরই উপর নির্ভর করি এবং আমি তাঁরই অভিমুখী হই।",
    english: "And my success is not but through Allah. Upon Him I have relied, and to Him I return.",
    ref: "Surah Hud 11:88"
  },
  waiting: {
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    pronunciation: "ইন্না মা'আল উসরি ইউসরা",
    bangla: "নিশ্চয়ই কষ্টের সাথে স্বস্তি রয়েছে।",
    english: "Indeed, with hardship [will be] ease.",
    ref: "Surah Al-Inshirah 94:6"
  },
  notSelected: {
    arabic: "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ ۖ وَعَسَىٰ أَن تُحِبُّوا شَيْئًا وَهُوَ شَرٌّ لَّكُمْ ۗ وَاللَّهُ يَعْلَمُ وَأَنتُمْ لَا تَعْلَمُونَ",
    pronunciation: "ওয়া 'আসা আন তাকরাহু শাইয়াওঁ ওয়া হুয়া খাইরুল্লাকুম, ওয়া 'আসা আন তুহিব্বু শাইয়াওঁ ওয়া হুয়া শাররুল্লাকুম, ওয়াল্লাহু ইয়া'লামু ওয়া আনতুম লা তা'লামুন",
    bangla: "কিন্তু হতে পারে যে কোনো বিষয় তোমরা অপছন্দ করছ অথচ তা তোমাদের জন্য কল্যাণকর এবং হতে পারে যে কোনো বিষয় তোমরা পছন্দ করছ অথচ তা তোমাদের জন্য অকল্যাণকর। আর আল্লাহ জানেন এবং তোমরা জান না।",
    english: "But perhaps you hate a thing and it is good for you; and perhaps you love a thing and it is bad for you. And Allah Knows, while you know not.",
    ref: "Surah Al-Baqarah 2:216"
  }
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return dateStr;
  
  const day = parseInt(parts[0], 10);
  const monthInt = parseInt(parts[1], 10);
  const year = parts[2];
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  if (monthInt >= 1 && monthInt <= 12) {
    return `${day} ${months[monthInt - 1]} ${year}`;
  }
  return dateStr;
}

function parseShiftTime(shiftStr) {
  if (!shiftStr) return { shift: '', time: '' };
  const match = shiftStr.match(/(.*)\s*\((.*)\)/);
  if (match) {
    return {
      shift: match[1].trim(),
      time: match[2].replace(/\bto\b/i, '-').trim()
    };
  }
  return { shift: shiftStr, time: '' };
}

export default function SearchClient() {
  const [roll, setRoll] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('seatPlan'); // 'seatPlan' | 'selection'
  const [activeTabs, setActiveTabs] = useState(['seatPlan', 'selection']);
  const [resultsPublished, setResultsPublished] = useState(true);

  // Fetch settings config
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.activeTabs)) {
            setActiveTabs(data.activeTabs);
            if (!data.activeTabs.includes('seatPlan') && data.activeTabs.includes('selection')) {
              setActiveTab('selection');
            }
          }
          if (typeof data.resultsPublished === 'boolean') {
            setResultsPublished(data.resultsPublished);
          }
        }
      } catch (err) {
        console.error('Failed to load active tabs:', err);
      }
    };
    fetchSettings();
  }, []);

  const { shift, time } = candidate ? parseShiftTime(candidate.shift_with_time) : { shift: '', time: '' };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!roll.trim()) {
      setError('Please enter a valid Roll Number.');
      return;
    }
    
    setLoading(true);
    setError('');
    setCandidate(null);
    setSearched(true);
    
    try {
      const res = await fetch(`/api/search?roll=${encodeURIComponent(roll.trim())}`);
      const data = await res.json();
      
      if (res.ok) {
        if (data.found) {
          setCandidate(data.candidate);
        } else {
          setError(`No record found for Roll number: ${roll}. Please check your entry.`);
        }
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  // Determine selection status
  const getSelectionStatus = () => {
    if (!candidate) return { status: 'none', label: '', ayat: null };
    if (candidate.selected) {
      return { status: 'selected', label: 'SELECTED', ayat: quranAyats.selected };
    } else if (candidate.waiting_list) {
      return { status: 'waiting', label: 'WAITING LIST', ayat: quranAyats.waiting };
    } else {
      return { status: 'notSelected', label: 'NOT SELECTED', ayat: quranAyats.notSelected };
    }
  };

  const statusInfo = getSelectionStatus();

  return (
    <div className="container">
      <header>
        <div className="logo-container">
          <div className="logo-circle">D</div>
        </div>
        <h1>DUET Admission Test Portal 2026</h1>
        <p className="subtitle">
          Unofficial Seat Plan Locator & Selection Status Verification Dashboard
        </p>
      </header>

      {/* Search Input Box */}
      <div className="search-card">
        <div className="search-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-icons" style={{ color: 'var(--accent-gold)' }}>search</span>
          Check Seat Plan & Selection Status
        </div>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="xxxxxx"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              disabled={loading}
            />
          </div>
          <button type="submit" className="search-button" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? (
              <span>Searching...</span>
            ) : (
              <>
                <span>Search</span>
                <span className="material-icons">arrow_forward</span>
              </>
            )}
          </button>
        </form>
        {error && (
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-icons">error_outline</span>
            {error}
          </div>
        )}
      </div>

      {candidate && (
        <>
          {/* If no tabs are active, show services disabled message */}
          {activeTabs.length === 0 ? (
            <div className="error-message" style={{ margin: '2rem 0', padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <span className="material-icons" style={{ fontSize: '3rem', color: '#ff8597' }}>warning_amber</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Services Temporarily Unavailable</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>The administrator has temporarily disabled the seat search portal services. Please check back later.</div>
            </div>
          ) : (
            <>
              {/* Tab Selection: Only show if both tabs are active */}
              {activeTabs.length > 1 && (
                <div className="tabs">
                  {activeTabs.includes('seatPlan') && (
                    <button 
                      className={`tab-btn ${activeTab === 'seatPlan' ? 'active' : ''}`}
                      onClick={() => setActiveTab('seatPlan')}
                    >
                      Seat Plan & Map Location
                    </button>
                  )}
                  {activeTabs.includes('selection') && (
                    <button 
                      className={`tab-btn ${activeTab === 'selection' ? 'active' : ''}`}
                      onClick={() => setActiveTab('selection')}
                    >
                      Admission Selection Status
                    </button>
                  )}
                </div>
              )}

              <div className="results-grid">
                {/* Left Column: Candidate Details & Common Supplication Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div className="info-card">
                    <h2 className="card-title">Candidate Details</h2>
                    <div className="pro-details-grid">
                      <div className="pro-detail-card">
                        <span className="material-icons pro-icon">fingerprint</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Applicant ID / Roll</span>
                          <span className="pro-value">{candidate.roll}</span>
                        </div>
                      </div>
                      
                      <div className="pro-detail-card">
                        <span className="material-icons pro-icon">receipt_long</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Payment ID</span>
                          <span className="pro-value">{candidate.payment_id}</span>
                        </div>
                      </div>

                      <div className="pro-detail-card span-full">
                        <span className="material-icons pro-icon">person</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Candidate Name</span>
                          <span className="pro-value" style={{ color: 'var(--accent-gold)' }}>{candidate.name}</span>
                        </div>
                      </div>

                      <div className="pro-detail-card span-full">
                        <span className="material-icons pro-icon">group</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Father's Name</span>
                          <span className="pro-value">{candidate.father_name}</span>
                        </div>
                      </div>

                      <div className="pro-detail-card span-full">
                        <span className="material-icons pro-icon">school</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Department</span>
                          <span className="pro-value">{candidate.department}</span>
                        </div>
                      </div>

                      {candidate.quota && (
                        <div className="pro-detail-card span-full">
                          <span className="material-icons pro-icon">military_tech</span>
                          <div className="pro-detail-content">
                            <span className="pro-label">Quota Category</span>
                            <span className="pro-value">{candidate.quota}</span>
                          </div>
                        </div>
                      )}

                      {candidate.comment && (
                        <div className="pro-detail-card span-full">
                          <span className="material-icons pro-icon">rate_review</span>
                          <div className="pro-detail-content">
                            <span className="pro-label">Comment</span>
                            <span className="pro-value">{candidate.comment}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supplication Card - Common for all candidates on Seat Plan tab */}
                  {activeTab === 'seatPlan' && activeTabs.includes('seatPlan') && (
                    <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h2 className="card-title" style={{ fontSize: '1.2rem' }}>Supplication for Exam & Ease (পরীক্ষার দুআ)</h2>
                      <div className="status-container" style={{ padding: '1.25rem', marginTop: 0 }}>
                        <div className="quran-box" style={{ margin: 0 }}>
                          <div className="quran-arabic" style={{ fontSize: '1.4rem' }}>
                            رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي
                          </div>
                          <div className="quran-translation-row">
                            <span className="quran-lang-label">বাংলা উচ্চারণ:</span>
                            <span className="quran-translation">"রব্বিশ রাহলি সদরি, ওয়া ইয়াসসিরলি আমরি"</span>
                          </div>
                          <div className="quran-translation-row">
                            <span className="quran-lang-label">বাংলা অর্থ:</span>
                            <span className="quran-translation">"হে আমার রব! আমার বুক প্রশস্ত করে দিন এবং আমার কাজ আমার জন্য সহজ করে দিন।"</span>
                          </div>
                          <div className="quran-translation-row">
                            <span className="quran-lang-label">English:</span>
                            <span className="quran-translation">"My Lord, expand for me my breast [with assurance] and ease for me my task."</span>
                          </div>
                          <div className="quran-reference">— Surah Taha 20:25-26</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Dynamic content based on Active Tab */}
                {activeTab === 'seatPlan' && activeTabs.includes('seatPlan') ? (
                  <div className="info-card">
                    <h2 className="card-title">Seat Plan Allocations</h2>
                    <div className="pro-details-grid" style={{ marginBottom: '1.25rem' }}>
                      <div className="pro-detail-card">
                        <span className="material-icons pro-icon">calendar_today</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Exam Date</span>
                          <span className="pro-value pro-value-highlight">{formatDate(candidate.date)}</span>
                        </div>
                      </div>

                      <div className="pro-detail-card">
                        <span className="material-icons pro-icon">schedule</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Exam Shift</span>
                          <span className="pro-value">{shift}</span>
                        </div>
                      </div>

                      <div className="pro-detail-card span-full">
                        <span className="material-icons pro-icon">access_time</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Exam Time</span>
                          <span className="pro-value">{time}</span>
                        </div>
                      </div>

                      <div className="pro-detail-card span-full">
                        <span className="material-icons pro-icon">business</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Exam Building</span>
                          <span className="pro-value">{candidate.building_name}</span>
                        </div>
                      </div>

                      <div className="pro-detail-card span-full">
                        <span className="material-icons pro-icon">meeting_room</span>
                        <div className="pro-detail-content">
                          <span className="pro-label">Assigned Room</span>
                          <span className="pro-value pro-value-highlight" style={{ fontSize: '1.3rem' }}>{candidate.room}</span>
                        </div>
                      </div>
                    </div>
                    <div className="map-outer">
                      <LeafletMap activeBuilding={candidate.building_name} />
                    </div>
                  </div>
                ) : (
                  activeTabs.includes('selection') && (
                    <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <h2 className="card-title">Admission Selection Status</h2>
                      
                      <div className="status-container">
                        {!resultsPublished ? (
                          <>
                            <div className="status-badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
                              NOT PUBLISHED YET
                            </div>
                            
                            <div className="quran-box">
                              <div className="quran-arabic">إِنَّ اللَّهَ مَعَ الصَّابِرِينَ</div>
                              <div className="quran-translation-row">
                                <span className="quran-lang-label">বাংলা উচ্চারণ:</span>
                                <span className="quran-translation">"ইন্নাল্লাহা মা'আস সাবিরীন"</span>
                              </div>
                              <div className="quran-translation-row">
                                <span className="quran-lang-label">বাংলা অর্থ:</span>
                                <span className="quran-translation">"নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।"</span>
                              </div>
                              <div className="quran-translation-row">
                                <span className="quran-lang-label">English:</span>
                                <span className="quran-translation">"Indeed, Allah is with the patient."</span>
                              </div>
                              <div className="quran-reference">— Surah Al-Baqarah 2:153</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`status-badge status-${statusInfo.status}`}>
                              {statusInfo.label}
                            </div>
                            
                            {statusInfo.ayat && (
                              <div className="quran-box">
                                <div className="quran-arabic">{statusInfo.ayat.arabic}</div>
                                <div className="quran-translation-row">
                                  <span className="quran-lang-label">বাংলা উচ্চারণ:</span>
                                  <span className="quran-translation">"{statusInfo.ayat.pronunciation}"</span>
                                </div>
                                <div className="quran-translation-row">
                                  <span className="quran-lang-label">বাংলা অর্থ:</span>
                                  <span className="quran-translation">"{statusInfo.ayat.bangla}"</span>
                                </div>
                                <div className="quran-translation-row">
                                  <span className="quran-lang-label">English:</span>
                                  <span className="quran-translation">"{statusInfo.ayat.english}"</span>
                                </div>
                                <div className="quran-reference">— {statusInfo.ayat.ref}</div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </>
      )}

      <footer>
        <div className="disclaimer-box" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-icons" style={{ color: '#ff8597' }}>warning</span>
          This site is unofficial. For better confirmation, please check the official site of DUET.
        </div>
        <p className="footer-credits">
          DUET Admission System Seat Locator | Session 2025-2026 | Administered Unofficially
        </p>
      </footer>
    </div>
  );
}
