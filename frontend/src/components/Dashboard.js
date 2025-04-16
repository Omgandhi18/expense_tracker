import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from our Python backend
    const fetchData = async () => {
      try {
        const response = await fetch('/api/expenses');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Log the raw response text before parsing
        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        // Only try to parse if there's actual content
        if (responseText.trim()) {
          const data = JSON.parse(responseText);
          setExpenses(data.expenses || []);
          setCategoryData(data.categoryData || []);
          setDailyData(data.dailyData || []);
          setMonthlyData(data.monthlyData || []);
        } else {
          console.error('Server returned empty response');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching expense data:', error);
        setError('Failed to fetch expense data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const hasExpenseData = expenses.length > 0;
  const hasCategoryData = categoryData.length > 0;
  const hasDailyData = dailyData.length > 0;
  const hasMonthlyData = monthlyData.length > 0;

  return (
    <div className="dashboard">
      <h2>Expense Dashboard</h2>

      <div className="dashboard-grid">
        <div className="category-section">
          <h3>Expenses by Category</h3>
          <div className="pie-chart-container">
            {hasCategoryData ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No category data found</div>
            )}
            
            {hasCategoryData ? (
              <div className="category-legend-container">
                {categoryData.map((entry, index) => (
                  <div key={index} className="category-item">
                    <div className="color-box" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="category-name">{entry.name}:</span>
                    <span className="category-value">₹{entry.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="recent-expenses">
          <h3>Recent Expenses</h3>
          {hasExpenseData ? (
            <div className="expense-list">
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="expense-item">
                  <div className="expense-details">
                    <div className="expense-title">{expense.description}</div>
                    <div className="expense-category">{expense.category}</div>
                  </div>
                  <div className="expense-amount">₹{expense.amount.toFixed(2)}</div>
                  <div className="expense-date">{new Date(expense.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No recent expenses found</div>
          )}
        </div>

        <div className="expense-trends">
          <h3>Daily Expenses (Last 7 days)</h3>
          {hasDailyData ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={dailyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No daily expense data found</div>
          )}
        </div>

        <div className="expense-trends">
          <h3>Monthly Expenses (Last 6 months)</h3>
          {hasMonthlyData ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#82ca9d" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No monthly expense data found</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;