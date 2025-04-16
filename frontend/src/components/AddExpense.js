import React, { useState, useEffect } from 'react';
import '../styles/AddExpense.css';

function AddExpense() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Fetch categories from backend
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        console.log('Categories fetched:', data.categories);
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setFormData(prev => ({ ...prev, category: data.categories[0] }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
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
    if (!formData.description || !formData.amount || !formData.category || !formData.date) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    try {
      const response = await fetch('/api/expenses/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Expense added successfully!' });
        // Reset form
        setFormData({
          description: '',
          amount: '',
          category: categories.length > 0 ? categories[0] : '',
          date: new Date().toISOString().slice(0, 10),
          notes: ''
        });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to add expense' });
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      setMessage({ type: 'error', text: 'An error occurred while adding the expense' });
    }
  };

  return (
    <div className="add-expense">
      <h2>Add New Expense</h2>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
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
          <label htmlFor="amount">Amount (₹) *</label>
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
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
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
        
        <button type="submit" className="btn-submit">Add Expense</button>
      </form>
    </div>
  );
}

export default AddExpense;