import React, { useState, useEffect } from 'react';

function StudentForm({ student, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    course: '',
    grade: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        course: student.course || '',
        grade: student.grade || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        course: '',
        grade: ''
      });
    }
    setErrors({});
  }, [student]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    if (!formData.course.trim()) {
      newErrors.course = 'Course is required';
    }
    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="student-form">
      <div className="form-group">
        <label className="form-label" htmlFor="name">Full Name</label>
        <div className="form-input-wrapper">
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        {errors.name && <span className="form-error-msg">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="email">Email Address</label>
        <div className="form-input-wrapper">
          <input
            type="email"
            id="email"
            name="email"
            className="form-input"
            placeholder="e.g. john@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        {errors.email && <span className="form-error-msg">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="phone">Phone Number (Optional)</label>
        <div className="form-input-wrapper">
          <input
            type="tel"
            id="phone"
            name="phone"
            className="form-input"
            placeholder="e.g. +1 (555) 000-0000"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="course">Course</label>
        <div className="form-input-wrapper">
          <input
            type="text"
            id="course"
            name="course"
            className="form-input"
            placeholder="e.g. Computer Science"
            value={formData.course}
            onChange={handleChange}
            required
          />
        </div>
        {errors.course && <span className="form-error-msg">{errors.course}</span>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="grade">Grade</label>
        <div className="form-input-wrapper">
          <input
            type="text"
            id="grade"
            name="grade"
            className="form-input"
            placeholder="e.g. A+"
            value={formData.grade}
            onChange={handleChange}
            required
          />
        </div>
        {errors.grade && <span className="form-error-msg">{errors.grade}</span>}
      </div>

      <div className="modal-footer" style={{ padding: '20px 0 0 0', borderTop: '1px solid var(--glass-border)' }}>
        <button type="button" className="btn-cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={loading}>
          {loading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
        </button>
      </div>
    </form>
  );
}

export default StudentForm;
