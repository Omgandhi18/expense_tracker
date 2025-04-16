from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import calendar
import json
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins # Enable CORS for all routes

# Database initialization
def init_db():
    conn = sqlite3.connect('expenses.db')
    c = conn.cursor()
    
    # Create expenses table
    c.execute('''
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT
    )
    ''')
    
    
    # Default categories if needed
    c.execute('''
    CREATE TABLE IF NOT EXISTS categories (
        name TEXT PRIMARY KEY
    )
    ''')

    # Check if categories table is empty and add defaults if needed
    c.execute("SELECT COUNT(*) FROM categories")
    if c.fetchone()[0] == 0:
        default_categories = [
            ('Food',), ('Housing',), ('Transportation',), ('Entertainment',),
            ('Utilities',), ('Healthcare',), ('Shopping',), ('Personal Care',),
            ('Education',), ('Travel',), ('Miscellaneous',)
        ]
        c.executemany("INSERT INTO categories VALUES (?)", default_categories)
    
    conn.commit()
    conn.close()

# Helper to get db connection
def get_db_connection():
    conn = sqlite3.connect('expenses.db')
    conn.row_factory = sqlite3.Row
    return conn



@app.route('/init-db')
def initialize_database():
    init_db()
    return "Database initialized"

@app.route('/api/test-db',methods = ['GET'])
def test_db():
    try:
        conn = get_db_connection()
        # Get count of expenses
        count = conn.execute('SELECT COUNT(*) as count FROM expenses').fetchone()['count']
        # Get list of tables
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        table_names = [table['name'] for table in tables]
        
        return jsonify({
            'message': 'Database connection successful',
            'expense_count': count,
            'tables': table_names
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# Middleware to generate recurring expenses before each request

# Route to get all expenses with aggregated data for dashboard
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    try:
        conn = get_db_connection()
        
        # Fetch regular expenses
        expenses = conn.execute('SELECT * FROM expenses ORDER BY date DESC').fetchall()
        
        
        # Convert regular expenses to list of dicts
        expenses_list = []
        for expense in expenses:
            expenses_list.append({
                'id': expense['id'],
                'description': expense['description'],
                'amount': expense['amount'],
                'category': expense['category'],
                'date': expense['date'],
                'notes': expense['notes'],
                'type': 'regular'  # Add type to distinguish
            })
        
        
        # Prepare response data
        response_data = {
            'expenses': expenses_list,
            'categoryData': [],  # Initialize with empty arrays
            'dailyData': [],
            'monthlyData': []
        }
        
        # Only calculate these if we have expenses
        if expenses_list:
            # Calculate category data for pie chart
            categories = {}
            for expense in expenses_list:
                category = expense['category']
                amount = expense['amount']
                if category in categories:
                    categories[category] += amount
                else:
                    categories[category] = amount
            
            category_data = []
            for category, amount in categories.items():
                category_data.append({
                    'name': category,
                    'value': amount
                })
            response_data['categoryData'] = category_data
            
            # Calculate daily data for the last 7 days
            daily_data = []
            today = datetime.now()
            for i in range(6, -1, -1):
                date = today - timedelta(days=i)
                date_str = date.strftime('%Y-%m-%d')
                short_date = date.strftime('%m/%d')
                
                daily_amount = sum(expense['amount'] for expense in expenses_list 
                                if expense['date'].startswith(date_str))
                
                daily_data.append({
                    'date': short_date,
                    'amount': daily_amount
                })
            response_data['dailyData'] = daily_data
            
            # Calculate monthly data for the last 6 months
            monthly_data = []
            current_month = today.month
            current_year = today.year
            
            for i in range(5, -1, -1):
                month = (current_month - i) % 12
                if month == 0:
                    month = 12
                year = current_year - ((current_month - i - 1) // 12 + 1) if month > current_month else current_year
                
                month_str = f"{year}-{month:02d}"
                month_name = datetime(year, month, 1).strftime('%b %Y')
                
                monthly_amount = sum(expense['amount'] for expense in expenses_list 
                                    if expense['date'].startswith(month_str))
                
                monthly_data.append({
                    'month': month_name,
                    'amount': monthly_amount
                })
            response_data['monthlyData'] = monthly_data
        
        print("Returning response:", response_data)  # Debug print
        return jsonify(response_data)
    
    except Exception as e:
        print(f"Error in get_expenses: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# Route to add a new expense
@app.route('/api/expenses/add', methods=['POST'])
def add_expense():
    expense_data = request.json
    
    if not expense_data or not all(key in expense_data for key in ['description', 'amount', 'category', 'date']):
        return jsonify({'message': 'Missing required fields'}), 400
    
    try:
        amount = float(expense_data['amount'])
        if amount <= 0:
            return jsonify({'message': 'Amount must be positive'}), 400
    except ValueError:
        return jsonify({'message': 'Invalid amount'}), 400
    
    try:
        conn = get_db_connection()
        conn.execute('''
            INSERT INTO expenses (description, amount, category, date, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            expense_data['description'],
            amount,
            expense_data['category'],
            expense_data['date'],
            expense_data.get('notes', '')
        ))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Expense added successfully'}), 201
    except Exception as e:
        return jsonify({'message': f'Error adding expense: {str(e)}'}), 500

# Route to update an existing expense
@app.route('/api/expenses/<int:id>', methods=['PUT'])
def update_expense(id):
    expense_data = request.json
    
    if not expense_data:
        return jsonify({'message': 'No data provided'}), 400
    
    if 'amount' in expense_data:
        try:
            amount = float(expense_data['amount'])
            if amount <= 0:
                return jsonify({'message': 'Amount must be positive'}), 400
        except ValueError:
            return jsonify({'message': 'Invalid amount'}), 400
    
    try:
        conn = get_db_connection()
        
        # Check if expense exists
        expense = conn.execute('SELECT * FROM expenses WHERE id = ?', (id,)).fetchone()
        if not expense:
            conn.close()
            return jsonify({'message': 'Expense not found'}), 404
        
        # Build update query dynamically based on provided fields
        fields = []
        values = []
        
        for key in ['description', 'amount', 'category', 'date', 'notes']:
            if key in expense_data:
                fields.append(f"{key} = ?")
                values.append(expense_data[key])
        
        if not fields:
            conn.close()
            return jsonify({'message': 'No fields to update'}), 400
        
        values.append(id)  # Add ID for WHERE clause
        
        conn.execute(
            f"UPDATE expenses SET {', '.join(fields)} WHERE id = ?",
            values
        )
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Expense updated successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Error updating expense: {str(e)}'}), 500

# Route to delete an expense
@app.route('/api/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    try:
        conn = get_db_connection()
        
        # Check if expense exists
        expense = conn.execute('SELECT * FROM expenses WHERE id = ?', (id,)).fetchone()
        if not expense:
            conn.close()
            return jsonify({'message': 'Expense not found'}), 404
        
        conn.execute('DELETE FROM expenses WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Expense deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Error deleting expense: {str(e)}'}), 500

# Route to get expenses for a specific month
@app.route('/api/expenses/month/<int:year>/<int:month>', methods=['GET'])
def get_month_expenses(year, month):
    if not (1 <= month <= 12):
        return jsonify({'message': 'Invalid month'}), 400
    
    month_str = f"{year}-{month:02d}"
    
    conn = get_db_connection()
    expenses = conn.execute('''
        SELECT * FROM expenses 
        WHERE date LIKE ? 
        ORDER BY date ASC
    ''', (f"{month_str}%",)).fetchall()
    
    expenses_list = []
    for expense in expenses:
        expenses_list.append({
            'id': expense['id'],
            'description': expense['description'],
            'amount': expense['amount'],
            'category': expense['category'],
            'date': expense['date'],
            'notes': expense['notes']
        })
    
    conn.close()
    
    return jsonify({'expenses': expenses_list})

# Route to get expenses for a specific day
@app.route('/api/expenses/day/<int:year>/<int:month>/<int:day>', methods=['GET'])
def get_day_expenses(year, month, day):
    try:
        # Validate date
        date_obj = datetime(year, month, day)
        date_str = date_obj.strftime('%Y-%m-%d')
        
        conn = get_db_connection()
        expenses = conn.execute('''
            SELECT * FROM expenses 
            WHERE date = ? 
            ORDER BY id DESC
        ''', (date_str,)).fetchall()
        
        expenses_list = []
        for expense in expenses:
            expenses_list.append({
                'id': expense['id'],
                'description': expense['description'],
                'amount': expense['amount'],
                'category': expense['category'],
                'date': expense['date'],
                'notes': expense['notes']
            })
        
        conn.close()
        
        return jsonify({'expenses': expenses_list})
    except ValueError:
        return jsonify({'message': 'Invalid date'}), 400

# Route to get all categories
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    categories = conn.execute('SELECT name FROM categories ORDER BY name').fetchall()
    
    categories_list = [category['name'] for category in categories]
    
    conn.close()
    
    return jsonify({'categories': categories_list})

# Route to add a new category
@app.route('/api/categories/add', methods=['POST'])
def add_category():
    category_data = request.json
    
    if not category_data or 'name' not in category_data:
        return jsonify({'message': 'Category name is required'}), 400
    
    category_name = category_data['name'].strip()
    
    if not category_name:
        return jsonify({'message': 'Category name cannot be empty'}), 400
    
    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO categories VALUES (?)', (category_name,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Category added successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Category already exists'}), 409
    except Exception as e:
        return jsonify({'message': f'Error adding category: {str(e)}'}), 500


if __name__ == '__main__':
    init_db()
    app.run(port = 5050,debug=True)