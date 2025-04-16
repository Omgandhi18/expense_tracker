import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AddExpense from './components/AddExpense';
import CalendarView from './components/CalendarView';
import './styles/App.css';
import ExpenseManager from './components/ExpenseManager';

function App() {
  return (
    <Router>
      <div className="expense-tracker">
        <header>
          <h1>Personal Expense Tracker</h1>
          <nav>
            <Link to="/">Dashboard</Link>
            <Link to="/add">Add Expense</Link>
            <Link to="/calendar">Calendar</Link>
            <Link to="/expensemanager">Manage Expenses</Link>
          </nav>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddExpense />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/expensemanager" element={<ExpenseManager/>} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
