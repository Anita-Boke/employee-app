'use client';
import { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import Image from 'next/image';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const employeeService = {
  getEmployees: async () => {
    try {
      const response = await fetch(`${BASE_URL}/employees`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error loading employees from server:", error);
      const saved = localStorage.getItem('employees');
      return saved ? JSON.parse(saved) : [];
    }
  },

  getEmployee: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/employees/${id}`);
      if (!response.ok) throw new Error("Employee not found");
      return await response.json();
    } catch (error) {
      console.error("Error fetching employee:", error);
      const employees = JSON.parse(localStorage.getItem('employees') || '[]');
      const employee = employees.find(emp => emp.id === parseInt(id));
      if (!employee) throw new Error("Employee not found");
      return employee;
    }
  },

  addEmployee: async (employee) => {
    try {
      const response = await fetch(`${BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });
      if (!response.ok) throw new Error("Failed to add employee");
      const newEmployee = await response.json();
      const employees = JSON.parse(localStorage.getItem('employees') || '[]');
      localStorage.setItem('employees', JSON.stringify([...employees, newEmployee]));
      return newEmployee;
    } catch (error) {
      console.error("Error adding employee:", error);
      const employees = JSON.parse(localStorage.getItem('employees') || '[]');
      const newEmployee = {
        ...employee,
        id: employees.length ? Math.max(...employees.map(e => e.id)) + 1 : 1
      };
      localStorage.setItem('employees', JSON.stringify([...employees, newEmployee]));
      return newEmployee;
    }
  },

  updateEmployee: async (id, updates) => {
    try {
      const response = await fetch(`${BASE_URL}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error("Failed to update employee");
      const updatedEmployee = await response.json();
      const employees = JSON.parse(localStorage.getItem('employees') || '[]');
      const updatedEmployees = employees.map(emp => 
        emp.id === parseInt(id) ? updatedEmployee : emp
      );
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
      return updatedEmployee;
    } catch (error) {
      console.error("Error updating employee:", error);
      const employees = JSON.parse(localStorage.getItem('employees') || '[]');
      const updatedEmployees = employees.map(emp => 
        emp.id === parseInt(id) ? { ...emp, ...updates } : emp
      );
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
      return updatedEmployees.find(emp => emp.id === parseInt(id));
    }
  },

  deleteEmployee: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/employees/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Failed to delete employee");
      const employees = JSON.parse(localStorage.getItem('employees') || '[]')
        .filter(emp => emp.id !== parseInt(id));
      localStorage.setItem('employees', JSON.stringify(employees));
      return true;
    } catch (error) {
      console.error("Error deleting employee:", error);
      const employees = JSON.parse(localStorage.getItem('employees') || '[]')
        .filter(emp => emp.id !== parseInt(id));
      localStorage.setItem('employees', JSON.stringify(employees));
      return true;
    }
  }
};

export default function EmployeeManagementSystem() {
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [view, setView] = useState('list');
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    department: '',
    dateOfJoining: '',
    profilePicture: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const data = await employeeService.getEmployees();
        setEmployees(data);
      } catch (err) {
        setError("Failed to load employees");
      } finally {
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  const columns = [
    {
      name: 'Profile',
      cell: (row) => (
        row.profilePicture ? (
          <div className="profile-thumbnail">
            <Image 
              src={row.profilePicture} 
              alt={row.fullName}
              width={50}
              height={50}
              className="rounded-full"
            />
          </div>
        ) : (
          <div className="profile-placeholder">
            <span className="initials">
              {row.fullName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )
      ),
      width: '80px',
    },
    {
      name: 'Full Name',
      selector: row => row.fullName,
      sortable: true,
    },
    {
      name: 'Job Title',
      selector: row => row.jobTitle,
      sortable: true,
    },
    {
      name: 'Department',
      selector: row => row.department,
      sortable: true,
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="action-buttons">
          <button 
            className="btn primary small"
            onClick={() => showEmployee(row.id)}
            title={`View ${row.fullName}`}
          >
            View
          </button>
          <button 
            className="btn secondary small"
            onClick={() => showEditForm(row)}
            title={`Edit ${row.fullName}`}
          >
            Edit
          </button>
          <button 
            className="btn danger small"
            onClick={() => handleDelete(row.id)}
            title={`Delete ${row.fullName}`}
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      minWidth: '220px'
    },
  ];

  const customStyles = {
    table: {
      style: {
        width: '100%',
      },
    },
    rows: {
      style: {
        minHeight: '50px',
        paddingRight: '8px',
      },
    },
    headCells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        fontWeight: 'bold',
        fontSize: '1rem',
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
      },
    },
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, profilePicture: base64String }));
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const showAddForm = () => {
    setFormData({
      fullName: '',
      jobTitle: '',
      department: '',
      dateOfJoining: '',
      profilePicture: ''
    });
    setImagePreview(null);
    setView('add');
    setError(null);
  };

  const showEmployee = async (id) => {
    setLoading(true);
    try {
      const employee = await employeeService.getEmployee(id);
      setCurrentEmployee(employee);
      setView('view');
    } catch (err) {
      setError("Employee not found");
    } finally {
      setLoading(false);
    }
  };

  const showEditForm = (employee) => {
    setCurrentEmployee(employee);
    setFormData({
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      department: employee.department,
      dateOfJoining: employee.dateOfJoining,
      profilePicture: employee.profilePicture || ''
    });
    setImagePreview(employee.profilePicture || null);
    setView('edit');
    setError(null);
  };

  const returnToList = () => {
    setView('list');
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newEmployee = await employeeService.addEmployee(formData);
      setEmployees([...employees, newEmployee]);
      returnToList();
    } catch (err) {
      setError("Failed to add employee");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedEmployee = await employeeService.updateEmployee(
        currentEmployee.id, 
        formData
      );
      setEmployees(employees.map(emp => 
        emp.id === updatedEmployee.id ? updatedEmployee : emp
      ));
      returnToList();
    } catch (err) {
      setError("Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    
    setLoading(true);
    try {
      await employeeService.deleteEmployee(id);
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (err) {
      setError("Failed to delete employee");
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    switch (view) {
      case 'add':
        return (
          <div className="form-view">
            <h2>Add New Employee</h2>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Profile Picture:</label>
                <div className="image-upload-container">
                  {imagePreview ? (
                    <div className="image-preview">
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        width={180} 
                        height={180}
                        className="rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="image-placeholder">
                      <span>No image selected</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                  <label htmlFor="profilePicture" className="btn secondary">
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Job Title:</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department:</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Joining:</label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn primary">
                  Add Employee
                </button>
                <button 
                  type="button" 
                  className="btn secondary"
                  onClick={returnToList}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        );

      case 'view':
        return (
          <div className="detail-view">
            <h2>Employee Details</h2>
            <div className="employee-details">
              <div className="profile-picture-large">
                {currentEmployee.profilePicture ? (
                  <Image
                    src={currentEmployee.profilePicture}
                    alt={currentEmployee.fullName}
                    width={200}
                    height={200}
                    className="rounded-full"
                  />
                ) : (
                  <div className="profile-placeholder-large">
                    <span className="initials-large">
                      {currentEmployee.fullName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
              </div>
              <div className="employee-info">
                <p><strong>Name:</strong> {currentEmployee.fullName}</p>
                <p><strong>Job Title:</strong> {currentEmployee.jobTitle}</p>
                <p><strong>Department:</strong> {currentEmployee.department}</p>
                <p><strong>Date of Joining:</strong> {currentEmployee.dateOfJoining}</p>
              </div>
              
              <div className="detail-actions">
                <button 
                  className="btn primary"
                  onClick={() => showEditForm(currentEmployee)}
                >
                  Edit
                </button>
                <button 
                  className="btn secondary"
                  onClick={returnToList}
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>
        );

      case 'edit':
        return (
          <div className="form-view">
            <h2>Edit Employee</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Profile Picture:</label>
                <div className="image-upload-container">
                  {imagePreview ? (
                    <div className="image-preview">
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        width={180} 
                        height={180}
                        className="rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="image-placeholder">
                      <span>No image selected</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="profilePictureEdit"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                  <label htmlFor="profilePictureEdit" className="btn secondary">
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Job Title:</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department:</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Joining:</label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn primary">
                  Update Employee
                </button>
                <button 
                  type="button" 
                  className="btn secondary"
                  onClick={returnToList}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        );

      default: // 'list'
        return (
          <div className="list-view">
            <div className="list-header">
              <h1>Employee Directory</h1>
              <button 
                className="btn primary"
                onClick={showAddForm}
              >
                Add New Employee
              </button>
            </div>

            {employees.length === 0 ? (
              <p className="empty-message">No employees found</p>
            ) : (
              <DataTable
                columns={columns}
                data={employees}
                customStyles={customStyles}
                responsive
                noHeader
                fixedHeader
                fixedHeaderScrollHeight="500px"
                pagination
                highlightOnHover
                striped
                noDataComponent="No employees found"
                className="w-full"
              />
            )}
          </div>
        );
    }
  };

  return (
    <main className="employee-app">
      {view !== 'list' && (
        <button 
          className="btn back-button"
          onClick={returnToList}
        >
          ← Back to Employee Directory
        </button>
      )}
      {renderView()}
    </main>
  );
}