import React from 'react';
import { Edit, Trash2, Inbox } from 'lucide-react';

function StudentTable({ students, onEdit, onDelete }) {
  if (students.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <Inbox size={48} className="empty-icon" />
          <h3 className="empty-title">No Students Registered</h3>
          <p className="empty-description">Add your first student to populate the registry database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="student-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Course</th>
            <th>Grade</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="table-row">
              <td className="student-name-col">{student.name}</td>
              <td>{student.email}</td>
              <td>{student.phone || 'N/A'}</td>
              <td>
                <span className="badge-course">{student.course}</span>
              </td>
              <td>
                <span className="badge-grade">{student.grade}</span>
              </td>
              <td>
                <div className="action-btns">
                  <button 
                    className="action-btn edit" 
                    onClick={() => onEdit(student)}
                    title="Edit Student"
                    aria-label="Edit Student"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="action-btn delete" 
                    onClick={() => onDelete(student.id)}
                    title="Delete Student"
                    aria-label="Delete Student"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StudentTable;
