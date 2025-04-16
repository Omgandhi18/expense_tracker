import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Input, Space, DatePicker, Select, Modal, Form, 
  InputNumber, message, Popconfirm, Divider, Tag, Card, Typography
} from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

const ExpenseManager = () => {
  // State variables
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amountRange, setAmountRange] = useState([null, null]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [form] = Form.useForm();
  
  // Fetch expenses and categories when component mounts
  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);
  
  // Fetch all expenses
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/expenses');
      const data = await response.json();
      if (data.expenses) {
        // Convert string dates to moment objects for easier handling
        const formattedExpenses = data.expenses.map(expense => ({
          ...expense,
          key: expense.id,
          dateObj: moment(expense.date)
        }));
        setExpenses(formattedExpenses);
      }
    } catch (error) {
      message.error('Failed to fetch expenses');
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      message.error('Failed to fetch categories');
      console.error('Error fetching categories:', error);
    }
  };
  
  // Delete an expense
  const handleDelete = async (id) => {
    try {
      // Since your backend doesn't have a delete endpoint yet, this is where you'd connect it
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        message.success('Expense deleted successfully');
        fetchExpenses(); // Refresh the list
      } else {
        message.error('Failed to delete expense');
      }
    } catch (error) {
      message.error('Error deleting expense');
      console.error('Error:', error);
    }
  };
  
  // Open edit modal with expense data
  const handleEdit = (expense) => {
    setCurrentExpense(expense);
    form.setFieldsValue({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: moment(expense.date),
      notes: expense.notes || ''
    });
    setIsEditModalVisible(true);
  };
  
  // Save edited expense
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      
      const updatedExpense = {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      };
      
      // Since your backend doesn't have an update endpoint yet, this is where you'd connect it
      const response = await fetch(`/api/expenses/${currentExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedExpense),
      });
      
      if (response.ok) {
        message.success('Expense updated successfully');
        setIsEditModalVisible(false);
        fetchExpenses(); // Refresh the list
      } else {
        message.error('Failed to update expense');
      }
    } catch (error) {
      message.error('Please check the form fields');
      console.error('Validation failed:', error);
    }
  };
  
  // Filter expenses based on search criteria
  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      // Filter by description/notes text
      const textMatch = searchText === '' || 
        expense.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (expense.notes && expense.notes.toLowerCase().includes(searchText.toLowerCase()));
      
      // Filter by date range
      let dateMatch = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const expenseDate = moment(expense.date);
        const startDate = moment(dateRange[0].$d);  // Convert Dayjs to Moment
        const endDate = moment(dateRange[1].$d);    // Convert Dayjs to Moment
        
        dateMatch = expenseDate.isSameOrAfter(startDate, 'day') && 
                    expenseDate.isSameOrBefore(endDate, 'day');
      }
      
      // Filter by category
      const categoryMatch = !selectedCategory || expense.category === selectedCategory;
      
      // Filter by amount range
      const minAmountMatch = amountRange[0] === null || expense.amount >= amountRange[0];
      const maxAmountMatch = amountRange[1] === null || expense.amount <= amountRange[1];
      
      console.log("Date filter debug:", {
        expenseDate: expense.date,
        expenseDateObj: expense.dateObj,
        dateRange: dateRange,
        isAfterStart: dateRange && dateRange[0] ? moment(expense.date).isSameOrAfter(dateRange[0], 'day') : "N/A",
        isBeforeEnd: dateRange && dateRange[1] ? moment(expense.date).isSameOrBefore(dateRange[1], 'day') : "N/A",
        dateMatch: dateMatch
      });
      return textMatch && dateMatch && categoryMatch && minAmountMatch && maxAmountMatch;
    });
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setSearchText('');
    setDateRange(null);
    setSelectedCategory(null);
    setAmountRange([null, null]);
  };
  
  // Table columns definition
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      render: (text) => moment(text).format('MMM DD, YYYY')
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category}</Tag>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a, b) => a.amount - b.amount,
      render: (amount) => `₹${parseFloat(amount).toFixed(2)}`
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            type="primary"
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this expense?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Expense Manager</Title>
      
      <Card style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <Input
            placeholder="Search descriptions or notes"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            allowClear
          />
          
          <RangePicker 
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: 250 }}
          />
          
          <Select
            placeholder="Select category"
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value)}
            style={{ width: 150 }}
            allowClear
          >
            {categories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          
          <Space>
            <InputNumber 
              placeholder="Min amount" 
              value={amountRange[0]}
              onChange={(value) => setAmountRange([value, amountRange[1]])}
              min={0}
              style={{ width: 120 }}
            />
            <span>to</span>
            <InputNumber 
              placeholder="Max amount" 
              value={amountRange[1]}
              onChange={(value) => setAmountRange([amountRange[0], value])}
              min={0}
              style={{ width: 120 }}
            />
          </Space>
          
          <Button onClick={handleClearFilters} type="default">
            Clear Filters
          </Button>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <Typography.Text>
            Total: {getFilteredExpenses().length} expenses | 
            Sum: ₹{getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
          </Typography.Text>
        </div>
      </Card>
      
      <Table
        columns={columns}
        dataSource={getFilteredExpenses()}
        rowKey="id"
        loading={loading}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
        }}
      />
      
      {/* Edit Expense Modal */}
      <Modal
        title="Edit Expense"
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveEdit}>
            Save
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="amount"
            label="Amount (₹)"
            rules={[
              { required: true, message: 'Please enter an amount' },
              { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} precision={2} step={0.01} />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select>
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpenseManager;