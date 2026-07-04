import React, { useState, useEffect } from 'react';
import { CreditCard, Award, Phone, Mail, BookOpen, Clock, CheckCircle2, Menu, X, LogOut, Mic, LayoutDashboard } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Helper to load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function StudentDashboard({ onViewChange }) {
  const { logout } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userEmail = localStorage.getItem('userEmail') || 'student@example.com';

  // Fetch student profile and transaction history
  const fetchData = async () => {
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get('/api/payments/me'),
        api.get('/api/payments/history')
      ]);
      setProfile(profileRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch dashboard details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      addToast('Please enter a valid payment amount.', 'warning');
      return;
    }

    if (amountVal > profile.due_fee) {
      addToast(`Payment amount cannot exceed the balance due of ₹${profile.due_fee}.`, 'warning');
      return;
    }

    setPaymentLoading(true);

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      addToast('Failed to load Razorpay Payment Gateway.', 'error');
      setPaymentLoading(false);
      return;
    }

    try {
      const orderRes = await api.post('/api/payments/create-order', {
        amount: Math.round(amountVal)
      });

      const { key, amount, currency, order_id, student_name, student_email, student_phone } = orderRes.data;

      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: "EduRegistry School Fees",
        description: `Fee Payment for ${profile.name}`,
        image: "https://cdn-icons-png.flaticon.com/512/2201/2201562.png",
        order_id: order_id,
        handler: async (response) => {
          setPaymentLoading(true);
          try {
            const verifyRes = await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.status === 'SUCCESS') {
              addToast('Fee payment completed successfully!', 'success');
              setPayAmount('');
              fetchData();
            } else {
              addToast('Payment verification failed.', 'error');
            }
          } catch (verifyErr) {
            console.error(verifyErr);
            addToast('Error verifying payment transaction.', 'error');
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: student_name,
          email: student_email,
          contact: student_phone || "9876543210"
        },
        theme: {
          color: "#6366f1"
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            addToast('Payment cancelled.', 'info');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to initialize payment order.';
      addToast(detail, 'error');
      setPaymentLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Top Navigation Header */}
      <header className="mobile-header">
        <button 
          className="menu-toggle-btn" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <Award size={20} style={{ color: 'var(--color-primary)' }} />
          <span>EduRegistry</span>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header-mobile">
          <div className="sidebar-logo">
            <Award size={24} style={{ color: 'var(--color-primary)' }} />
            <span>EduRegistry</span>
          </div>
          <button 
            className="menu-close-btn" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-logo-desktop">
          <Award size={24} style={{ color: 'var(--color-primary)' }} />
          <span>EduRegistry</span>
        </div>

        <ul className="sidebar-menu">
          <li>
            <div className="sidebar-link" onClick={() => { onViewChange('dashboard'); setIsSidebarOpen(false); }}>
              <LayoutDashboard size={18} />
              <span>Students Registry</span>
            </div>
          </li>
          <li>
            <div className="sidebar-link active" onClick={() => setIsSidebarOpen(false)}>
              <CreditCard size={18} />
              <span>Student Portal</span>
            </div>
          </li>
          <li>
            <div className="sidebar-link" onClick={() => { onViewChange('speech-to-text'); setIsSidebarOpen(false); }}>
              <Mic size={18} />
              <span>Speech to Text</span>
            </div>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="avatar">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-email" title={userEmail}>{userEmail}</span>
              <span className="user-role">Student</span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="spinner"></div>
          </div>
        ) : !profile ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '16px' }}>
            <p style={{ color: 'var(--color-accent)', fontWeight: '600' }}>Failed to load student profile.</p>
            <button className="btn-primary" onClick={fetchData} style={{ maxWidth: '200px' }}>Retry Connection</button>
          </div>
        ) : (
          <>
            <header className="dashboard-header">
              <h1 className="dashboard-title">Student Portal</h1>
              <p className="dashboard-subtitle">Manage your profile, track due fees, and make secure school payments online</p>
            </header>

            {/* Profile Section */}
            <section className="profile-section" style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '24px',
              padding: '30px',
              marginBottom: '30px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))'
              }} />
              
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '24px',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{profile.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={14} /> {profile.course}
                      </span>
                      <span className="badge-grade">Grade: {profile.grade}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  minWidth: '200px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} style={{ color: 'var(--color-primary)' }} />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} style={{ color: 'var(--color-primary)' }} />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="stats-grid" style={{ marginBottom: '30px' }}>
              <div className="stat-card">
                <div className="stat-icon-wrapper primary">
                  <CreditCard size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Fee Structure</span>
                  <span className="stat-value">₹{profile.total_fee.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper success">
                  <CheckCircle2 size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Fees Paid to Date</span>
                  <span className="stat-value">₹{profile.paid_fee.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper accent">
                  <Clock size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Balance Due</span>
                  <span className="stat-value" style={{ color: profile.due_fee > 0 ? 'var(--color-accent)' : 'var(--color-success)' }}>
                    ₹{profile.due_fee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </section>

            {/* Layout Panels */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '30px',
              alignItems: 'start'
            }}>
              {/* Make a Payment Card */}
              <div style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} style={{ color: 'var(--color-primary)' }} />
                  Make a Payment
                </h3>

                {profile.due_fee <= 0 ? (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    color: 'var(--color-success)',
                    fontWeight: '500',
                    marginTop: '20px'
                  }}>
                    🎉 All school fees have been paid in full!
                  </div>
                ) : (
                  <form onSubmit={handlePayment}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label className="form-label">Payment Amount (INR)</label>
                      <div className="form-input-wrapper">
                        <input
                          type="number"
                          min="1"
                          max={profile.due_fee}
                          className="form-input"
                          placeholder="Enter amount (e.g. 5000)"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          required
                          disabled={paymentLoading}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                        Maximum payable: ₹{profile.due_fee.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', gap: '8px' }}
                      disabled={paymentLoading || !payAmount}
                    >
                      {paymentLoading ? (
                        <>
                          <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: '#fff' }}></div>
                          <span>Processing Secure Payment...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={18} />
                          <span>Pay ₹{payAmount ? parseFloat(payAmount).toLocaleString('en-IN') : '0'}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                <div style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--glass-border)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }}></span>
                  Secured by Razorpay. Test transactions only.
                </div>
              </div>

              {/* Payment History Card */}
              <div style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} style={{ color: 'var(--color-primary)' }} />
                  Payment History
                </h3>

                {history.length === 0 ? (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    No payment transactions found.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                    {history.map((tx) => (
                      <div key={tx.id} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'var(--transition-fast)'
                      }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>
                            ₹{tx.amount.toLocaleString('en-IN')}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {new Date(tx.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                            Ref: {tx.razorpay_payment_id}
                          </div>
                        </div>
                        <span className="badge-course" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                          Success
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
