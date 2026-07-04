import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, BookOpen, Award, LogOut, LayoutDashboard, Menu, X, Mic, CreditCard } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StudentTable from '../components/StudentTable';
import StudentForm from '../components/StudentForm';
import Modal from '../components/Modal';

function DashboardPage({ onViewChange }) {
  const { logout } = useAuth();
  const { addToast } = useToast();

  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const userEmail = localStorage.getItem('userEmail') || 'admin@example.com';

  // Fetch all students
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/students');
      setStudents(response.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load students list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.course.toLowerCase().includes(query) ||
      student.grade.toLowerCase().includes(query)
    );
  });

  // Calculate statistics
  const totalStudents = students.length;
  const uniqueCourses = new Set(students.map((s) => s.course.toLowerCase().trim())).size;
  
  // High performers: students with grade starting with A or B
  const topPerformers = students.filter((s) => {
    const g = s.grade.toUpperCase().trim();
    return g.startsWith('A') || g === 'O' || g === '10' || g.startsWith('B');
  }).length;

  const handleAddClick = () => {
    setEditingStudent(null);
    setModalOpen(true);
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      try {
        await api.delete(`/api/students/${id}`);
        addToast('Student record deleted successfully.', 'success');
        fetchStudents();
      } catch (err) {
        console.error(err);
        addToast('Failed to delete student record.', 'error');
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingStudent) {
        await api.put(`/api/students/${editingStudent.id}`, formData);
        addToast('Student details updated successfully.', 'success');
      } else {
        await api.post('/api/students', formData);
        addToast('New student added successfully.', 'success');
      }
      setModalOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : 'Failed to save student details.';
      addToast(errorMsg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleModalClose = () => {
    if (!formLoading) {
      setModalOpen(false);
      setEditingStudent(null);
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

      {/* Sidebar Navigation Drawer */}
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
            <div className="sidebar-link active" onClick={() => setIsSidebarOpen(false)}>
              <LayoutDashboard size={18} />
              <span>Students Registry</span>
            </div>
          </li>
          <li>
            <div className="sidebar-link" onClick={() => { onViewChange('student-dashboard'); setIsSidebarOpen(false); }}>
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
              <span className="user-role">Administrator</span>
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
        <header className="dashboard-header">
          <h1 className="dashboard-title">Student Directory</h1>
          <p className="dashboard-subtitle">Manage, view, and update student profiles registered in the system</p>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper primary">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Students</span>
              <span className="stat-value">{totalStudents}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper success">
              <BookOpen size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Courses Offered</span>
              <span className="stat-value">{uniqueCourses}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper accent">
              <Award size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Top Performers</span>
              <span className="stat-value">{topPerformers}</span>
            </div>
          </div>
        </section>

        {/* Controls Bar */}
        <div className="controls-bar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, course, grade..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn-add-student" onClick={handleAddClick}>
            <Plus size={18} />
            <span>Add Student</span>
          </button>
        </div>

        {/* Data Presentation */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <StudentTable
            students={filteredStudents}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        )}
      </main>

      {/* Add / Edit Modal Overlay */}
      <Modal
        isOpen={modalOpen}
        onClose={handleModalClose}
        title={editingStudent ? 'Edit Student Details' : 'Add New Student'}
      >
        <StudentForm
          student={editingStudent}
          onSubmit={handleFormSubmit}
          onCancel={handleModalClose}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}

export default DashboardPage;
