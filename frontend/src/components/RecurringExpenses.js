import React, { useState, useEffect } from 'react';
import '../styles/RecurringExpenses.css';

function RecurringExpenses() {
  const [recurring, setRecurring] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    notes: ''
  });

  useEffect(() => {
    // Fetch recurring expenses and categories
    const fetchData = async () => {
      try {
        // Fetch recurring expenses
        const recurringResponse = await fetch('http://localhost:5000/api/recurring-expenses');
        const recurringData = await recurringResponse.json();
        setRecurring(recurringData.recurringExpenses);
        
        // Fetch categories
        const categoriesResponse = await fetch('http://localhost:5000/api/categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories);
        
        if (categoriesData.categories.length > 0) {
          setFormData(prev => ({ ...prev, category: categoriesData.categories[0] }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.description || !formData.amount || !formData.category || !formData.startDate || !formData.frequency) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/recurring-expenses/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Recurring expense added successfully!' });
        // Refresh the recurring expenses list
        const updatedRecurring = await fetch('http://localhost:5000/api/recurring-expenses');
        const updatedData = await updatedRecurring.json();
        setRecurring(updatedData.recurringExpenses);
        
        // Reset form and hide it
        setFormData({
          description: '',
          amount: '',
          category: categories.length > 0 ? categories[0] : '',
          frequency: 'monthly',
          startDate: new Date().toISOString().slice(0, 10),
          endDate: '',
          notes: ''
        });
        setShowForm(false);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to add recurring expense' });
      }
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      setMessage({ type: 'error', text: 'An error occurred while adding the recurring expense' });
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    setMessage(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recurring expense?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/recurring-expenses/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Recurring expense deleted successfully!' });
        // Remove from state
        setRecurring(recurring.filter(item => item.id !== id));
      } else {
        const result = await response.json();
        setMessage({ type: 'error', text: result.message || 'Failed to delete recurring expense' });
      }
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      setMessage({ type: 'error', text: 'An error occurred while deleting the recurring expense' });
    }
  };

  const formatFrequency = (frequency) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Every 2 Weeks';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'biannually': return 'Twice a Year';
      case 'annually': return 'Yearly';
      default: return frequency;
    }
  };

  return (
    <div className="recurring-expenses">
      <div className="header-actions">
        <h2>Recurring Expenses</h2>
        <button onClick={toggleForm} className="btn-toggle">
          {showForm ? 'Cancel' : 'Add New Recurring Expense'}
        </button>
      </div>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      {showForm && (
        <div className="add-recurring-form">
          <h3>Add Recurring Expense</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="amount">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="frequency">Frequency *</label>
              <select
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 Weeks</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannually">Twice a Year</option>
                <option value="annually">Yearly</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">End Date (Optional)</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>
            
            <button type="submit" className="btn-submit">Add Recurring Expense</button>
          </form>
        </div>
      )}
      
      <div className="recurring-list">
        {recurring.length === 0 ? (
          <p className="no-data">No recurring expenses found. Add your first one!</p>
        ) : (
          recurring.map((item) => (
            <div key={item.id} className="recurring-item">
              <div className="recurring-main">
                <div className="recurring-info">
                  <h4>{item.description}</h4>
                  <div className="recurring-details">
                    <span className="category">{item.category}</span>
                    <span className="frequency">{formatFrequency(item.frequency)}</span>
                  </div>
                </div>
                <div className="recurring-amount">${parseFloat(item.amount).toFixed(2)}</div>
              </div>
              
              <div className="recurring-dates">
                <div>Starts: {formatDate(item.startDate)}</div>
                {item.endDate && <div>Ends: {formatDate(item.endDate)}</div>}
              </div>
              
              {item.notes && (
                <div className="recurring-notes">
                  <strong>Notes:</strong> {item.notes}
                </div>
              )}
              
              <div className="recurring-actions">
                <button onClick={() => handleDelete(item.id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecurringExpenses;