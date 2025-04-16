# Personal Expense Tracker

A comprehensive web application for tracking and managing personal expenses with visualizations, calendar view, and expense management features.

## Features

- **Dashboard**: Visual overview of expenses with pie charts and line graphs
- **Add Expense**: Simple form to add new expenses with customizable categories
- **Calendar View**: Monthly calendar showing daily expenses and detailed daily breakdowns
- **Expense Manager**: Advanced filtering, searching, and editing of all expenses

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Recharts for data visualization
- Ant Design components for UI
- Moment.js for date handling

### Backend
- Flask (Python)
- SQLite database
- RESTful API

## Installation and Setup

### Prerequisites
- Node.js and npm
- Python 3.x
- pip (Python package manager)

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required Python packages:
   ```
   pip install flask flask-cors
   ```

4. Initialize the database:
   ```
   python app.py
   ```
   The backend will run on http://localhost:5050

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   The application will be available at http://localhost:3000

## API Endpoints

### Expenses
- `GET /api/expenses` - Get all expenses with aggregated data for dashboard
- `POST /api/expenses/add` - Add a new expense
- `PUT /api/expenses/:id` - Update an existing expense
- `DELETE /api/expenses/:id` - Delete an expense
- `GET /api/expenses/month/:year/:month` - Get expenses for a specific month
- `GET /api/expenses/day/:year/:month/:day` - Get expenses for a specific day

### Categories
- `GET /api/categories` - Get all expense categories
- `POST /api/categories/add` - Add a new category

## Usage Guide

### Dashboard
The dashboard provides a quick overview of your spending habits with:
- Pie chart showing expenses by category
- Line charts showing daily expenses (last 7 days)
- Line charts showing monthly expenses (last 6 months)
- A list of recent expenses

### Adding Expenses
- Fill in required details (description, amount, category, date)
- Optional notes field for additional information
- Submit to save the expense

### Calendar View
- Navigate between months
- Click on a day to see expenses for that specific date
- Daily totals are displayed on each day of the calendar

### Expense Manager
- Advanced filtering by date range, category, and amount
- Search by description or notes
- Edit or delete existing expenses
- Sort expenses by various fields

## Database Schema

### Expenses Table
- `id`: INTEGER PRIMARY KEY
- `description`: TEXT
- `amount`: REAL
- `category`: TEXT
- `date`: TEXT (YYYY-MM-DD format)
- `notes`: TEXT (optional)

### Categories Table
- `name`: TEXT PRIMARY KEY


## Acknowledgments

- [Recharts](https://recharts.org/) for the beautiful charts
- [Ant Design](https://ant.design/) for the UI components
- [Flask](https://flask.palletsprojects.com/) for the backend framework
