import React, { useState } from 'react';
import './App.css';

const BRANCH_MAPPING = {
  '101': 'Downtown Branch',
  '102': 'Midtown Branch',
  '103': 'Uptown Branch',
  '104': 'West End Branch',
  '105': 'Eastside Branch',
  '106': 'North Park Branch',
  '107': 'Southgate Branch',
  '108': 'Riverfront Branch',
  '109': 'Lakeside Branch',
  '110': 'Hilltop Branch'
};


function App() {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    dob: '',
    address: '',
    phone: '',
    email: '',
    aadharcard: '',
    pancard: '',
    accounttype: '',
    branchid: '',
    balance: '',
    document: null
  });
  const [message, setMessage] = useState('');

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateAadhar = (aadhar) => {
    return /^\d{12}$/.test(aadhar);
  };

  const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const validateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 18;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    let error = '';
    // Validate fields as they're being typed
    if (name === 'email' && value) {
      if (!validateEmail(value)) {
          error = 'Please enter a valid email address';
      }
    }
    else if (name === 'aadharcard' && value) {
        if (!validateAadhar(value)) {
            error = 'Aadhar card must be exactly 12 digits';
        }
    }
    else if (name === 'pancard' && value) {
        if (!validatePAN(value)) {
            error = 'PAN must be in format: ABCDE1234F';
        }
    }
    else if (name === 'dob' && value) {
      if (!validateAge(value)) {
          error = 'You must be at least 18 years old to open an account';
      }
    }
    else if (name === 'balance' && value) {
      const amount = parseFloat(value);
      if (formData.accounttype === 'savings' && amount < 1000) {
          error = 'Minimum initial deposit of ₹1000 is required for savings account';
      } else if (amount < 0) {
          error = 'Please enter a valid amount';
      }
    }
    else if (name === 'accounttype') {
        // Reset balance and error when switching account types
        setFormData(prevState => ({
            ...prevState,
            balance: ''
        }));
        setErrors(prevErrors => ({
            ...prevErrors,
            balance: ''
        }));
    }
    setFormData(prevState => ({
        ...prevState,
        [name]: value,
        [name]: files ? files[0] : value
    }));

    // Update error state
    setErrors(prevErrors => ({
        ...prevErrors,
        [name]: error
    }));
  };
  const [errors, setErrors] = useState({
    email: '',
    aadharcard: '',
    pancard: '',
    dob: ''
  });




  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    if (!validateAge(formData.dob)) {
      setErrors(prevErrors => ({
          ...prevErrors,
          dob: 'You must be at least 18 years old to open an account'
      }));
      setMessage('Please fix the validation errors before submitting.');
      return;
    }

    // Validate balance based on account type
    const balance = parseFloat(formData.balance);
    if (formData.accounttype === 'savings' && balance < 1000) {
        setErrors(prevErrors => ({
            ...prevErrors,
            balance: 'Minimum initial deposit of ₹1000 is required for savings account'
        }));
        setMessage('Please fix the validation errors before submitting.');
        return;
    }

    if (balance < 0) {
        setErrors(prevErrors => ({
            ...prevErrors,
            balance: 'Please enter a valid amount'
        }));
        setMessage('Please fix the validation errors before submitting.');
        return;
    }

    // Validate all fields before submission
    const validationErrors = {
      email: !validateEmail(formData.email) ? 'Invalid email address' : '',
      aadharcard: !validateAadhar(formData.aadharcard) ? 'Invalid Aadhar number' : '',
      pancard: !validatePAN(formData.pancard) ? 'Invalid PAN format' : ''
    };

    setErrors(validationErrors);

    // Check if there are any errors
    if (Object.values(validationErrors).some(error => error !== '')) {
        setMessage('Please fix the validation errors before submitting.');
        return;
    }

        
    // Convert aadhar to string and ensure PAN is uppercase
    const dataToSend = {
        ...formData,
        aadharcard: formData.aadharcard.toString(),
        pancard: formData.pancard.toUpperCase()
    };
    // Append all form data fields
    Object.keys(dataToSend).forEach(key => {
      formDataToSend.append(key, dataToSend[key]);
    });




    // Append all form data fields
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      const response = await fetch('http://127.0.0.1:5000/open_account', {
        method: 'POST',
        body: formDataToSend
      });
      const data = await response.json();
      if (response.ok) {
          // Check if both message and customer_id exist
          if (data.message && data.customer_id && data.accountnumber) {
            setMessage(`${data.message} Your Customer ID is: ${data.customer_id} and your Account Number is: ${data.accountnumber}`);
          } else {
              setMessage(data.message || 'Account created successfully!');
          }
          const accountTypeFormatted = formData.accounttype.charAt(0).toUpperCase() + formData.accounttype.slice(1);
          const branchName = BRANCH_MAPPING[formData.branchid];
          setMessage(`Your ${accountTypeFormatted} Account has been created successfully! Your Customer ID is: ${data.customer_id}
            your Account Number is: ${data.accountnumber}`);
          // Clear form
          setFormData({
              firstname: '',
              lastname: '',
              dob: '',
              address: '',
              phone: '',
              email: '',
              aadharcard: '',
              pancard: '',
              accounttype: '',
              branchid: '',
              balance: '',
              document: null
            });
      } else {
            setMessage(data.error || 'An error occurred');
        }
        // Log the response for debugging
        console.log('Server response:', data);
    } catch (error) {
        console.error('Error:', error);
        setMessage('An error occurred while creating the account.');
      }
  };


  return (
    <div className='container'>
      <h1>Welcome to Anonymous Bank!</h1>
      <h2>Proceed with your account opening process</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="firstname">First Name</label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastname">Last Name</label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="dob">DOB</label>
            <input
              type="date"
              id="dob"
              name="dob"
              onChange={handleChange}
              className={errors.dob ? 'error' : ''}
              required
            />
            {errors.dob && <span className="error-message">{errors.dob}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              onChange={handleChange}
              required
            />
            
          </div>
          <div className="form-group">
            <label htmlFor="aadharcard">Aadhar Card Number</label>
            <input
              type="number"
              id="aadharcard"
              name="aadharcard"
              onChange={handleChange}
              className={errors.aadharcard ? 'error' : ''}
              maxLength="12"
              required
            />
            {errors.aadharcard && <span className="error-message">{errors.aadharcard}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="pancard">Pan Card Number</label>
            <input
              type="text"
              id="pancard"
              name="pancard"
              onChange={handleChange}
              className={errors.pancard ? 'error' : ''}
              maxLength="10"
              required
            />
            {errors.pancard && <span className="error-message">{errors.pancard}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="document">Upload Document(Pan/Aadhar)</label>
            <input
              type="file"
              id="document"
              name="document"
              accept=".pdf,.jpg"
              onChange={handleChange}
              required
            />
          </div>

          {/* Account Type Selection */}
          <div className="dropdown-group">
              <label htmlFor="accounttype" className="required">Account Type</label>
              <div className="radio-group">
                  <div className={`radio-item ${formData.accounttype === 'savings' ? 'active' : ''}`}>
                      <input
                          type="radio"
                          id="savings"
                          name="accounttype"
                          value="savings"
                          checked={formData.accounttype === 'savings'}
                          onChange={handleChange}
                          required
                      />
                      <label htmlFor="savings">Savings</label>
                  </div>
                  <div className={`radio-item ${formData.accounttype === 'current' ? 'active' : ''}`}>
                      <input
                          type="radio"
                          id="current"
                          name="accounttype"
                          value="current"
                          checked={formData.accounttype === 'current'}
                          onChange={handleChange}
                          required
                      />
                      <label htmlFor="current">Current</label>
                  </div>
              </div>
          </div>
          {/* Balance field with different requirements based on account type */}
          <div className="form-group">
              <label htmlFor="balance" className="required">
                  {formData.accounttype === 'savings' 
                      ? 'Initial Deposit (Min ₹1000)' 
                      : 'Initial Deposit Amount'}
              </label>
              <input
                  type="number"
                  id="balance"
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  min={formData.accounttype === 'savings' ? "1000" : "0"}
                  required
                  className={errors.balance ? 'error' : ''}
                  placeholder={formData.accounttype === 'savings' 
                      ? 'Minimum ₹1000 required' 
                      : 'Enter deposit amount'}
              />
              {errors.balance && <span className="error-message">{errors.balance}</span>}
          </div>
          {/* Branch Selection */}
          <div className="branch-container">
            <label htmlFor="branchid" className="required">Branch</label>
            <select
                id="branchid"
                name="branchid"
                value={formData.branchid}
                onChange={handleChange}
                required
                className="select-input"
            >
                <option value="">Select Branch</option>
                {Object.entries(BRANCH_MAPPING).map(([id, name]) => (
                  <option key={id} value={id}>
                      {name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="button-container">
          <button type="submit">Open Account</button>
        </div>
      </form>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default App;
