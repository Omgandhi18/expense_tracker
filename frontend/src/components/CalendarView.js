import React, { useState, useEffect } from 'react';
import '../styles/CalendarView.css';

function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);

  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, date: null });
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, date });
    }

    setCalendarDays(days);
  }, [currentDate]);

  // Fetch expenses for the current month (including recurring expenses)
  useEffect(() => {
    const fetchMonthExpenses = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // API expects 1-12

        const response = await fetch(`/api/expenses/month/${year}/${month}`);
        const data = await response.json();

        setExpenses(data.expenses);
      } catch (error) {
        console.error('Error fetching monthly expenses:', error);
      }
    };

    fetchMonthExpenses();
  }, [currentDate]);

  // Fetch expenses for the selected date (including recurring expenses)
  useEffect(() => {
    const fetchDailyExpenses = async () => {
      try {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1; // API expects 1-12
        const day = selectedDate.getDate();

        const response = await fetch(`/api/expenses/day/${year}/${month}/${day}`);
        const data = await response.json();

        setDailyExpenses(data.expenses);
      } catch (error) {
        console.error('Error fetching daily expenses:', error);
      }
    };

    fetchDailyExpenses();
  }, [selectedDate]);

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Handle day click
  const handleDayClick = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // Get daily total expense for a specific date
  const getDailyTotal = (date) => {
    if (!date) return 0;

    const formatDate = (dateObj) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dateFormatted = formatDate(date);

    const dailyExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return formatDate(expDate) === dateFormatted;
    });

    return dailyExpenses.reduce((total, exp) => total + parseFloat(exp.amount), 0);
  };

  // Format month and year for display
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Helper function to check if two dates are the same day
  const isSameDay = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  return (
    <div className="calendar-view">
      <h2>Calendar View</h2>

      <div className="calendar-container">
        <div className="calendar-header">
          <button onClick={prevMonth}>&lt;</button>
          <h3>{formatMonthYear(currentDate)}</h3>
          <button onClick={nextMonth}>&gt;</button>
        </div>

        <div className="weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="calendar-grid">
          {calendarDays.map((dayObj, index) => {
            const isToday = dayObj.date && isSameDay(new Date(), dayObj.date);
            const isSelected = dayObj.date && isSameDay(selectedDate, dayObj.date);
            const dailyTotal = dayObj.date ? getDailyTotal(dayObj.date) : 0;

            return (
              <div
                key={index}
                className={`calendar-day ${!dayObj.day ? 'empty' : ''} ${isToday ? 'today' : ''} ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => dayObj.day && handleDayClick(dayObj.date)}
              >
                {dayObj.day && (
                  <>
                    <div className="day-number">{dayObj.day}</div>
                    {dailyTotal > 0 && (
                      <div className="day-expenses">₹{dailyTotal.toFixed(2)}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="daily-expenses">
        <h3>Expenses for {selectedDate.toLocaleDateString()}</h3>

        {dailyExpenses.length === 0 ? (
          <p>No expenses for this date.</p>
        ) : (
          <div className="expense-list">
            {dailyExpenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div className="expense-details">
                  <div className="expense-title">{expense.description}</div>
                  <div className="expense-category">{expense.category}</div>
                </div>
                <div className="expense-amount">₹{parseFloat(expense.amount).toFixed(2)}</div>
              </div>
            ))}

            <div className="daily-total">
              <strong>Total:</strong> ₹
              {dailyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarView;