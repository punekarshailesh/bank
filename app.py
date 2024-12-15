from flask import Flask, request, jsonify
import mysql.connector
import os
from flask_cors import CORS
from datetime import datetime
import random
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow requests from all origins


# Configure MySQL database connection
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'mysqlboot',  # Replace with your MySQL password
    'database': 'banking'  # Replace with your database name
}

# Establish MySQL connection
def get_db_connection():
    connection = mysql.connector.connect(**db_config)
    return connection

# validation
def validate_email(email):
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def validate_aadhar(aadhar):
    return len(str(aadhar)) == 12 and str(aadhar).isdigit()

def validate_pan(pan):
    pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
    return re.match(pattern, pan) is not None


# Route to open an account
@app.route('/open_account', methods=['POST'])
def open_account():
    print(request.method)  # Debug info
    print(request.form)  # Debug info
    print(request.files)  # Debug info

    data = request.form
    file = request.files.get('document')
    
    if not file or file.filename.split('.')[-1].lower() not in ['pdf', 'jpg']:
        return jsonify({"error": "Invalid document format. Only PDF and JPG are allowed."}), 400
    
    try:
        # generating customerid
        current_date = datetime.now().strftime('%d%H%M%S')
        customerid = f"{current_date}"

        doc_path = os.path.join('uploads', file.filename)
        os.makedirs('uploads', exist_ok=True)
        file.save(doc_path)
        
        email = data['email']
        aadharcard = data['aadharcard']
        pancard = data['pancard']

        # Validate data
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if not validate_aadhar(aadharcard):
            return jsonify({'error': 'Invalid Aadhar number'}), 400
        
        if not validate_pan(pancard):
            return jsonify({'error': 'Invalid PAN format'}), 400
        
        
        # for acount table
        account_type = request.form.get('accounttype')
        balance = float(request.form.get('balance', 0))

        # Validate balance based on account type
        if account_type == 'savings' and balance < 1000:
            return jsonify({
                "error": "Minimum initial deposit of ₹1000 is required for savings account"
            }), 400
        
        if balance < 0:
            return jsonify({
                "error": "Please enter a valid amount"
            }), 400

        accountid = int(str(customerid)[::-1])
        branchid = data['branchid']
        accounttype = data['accounttype']
        accountnumber = datetime.now().strftime('%y%m%H%M%S')
        openingdate = datetime.now()
        balance = float(data['balance'])
        status = 'active'


        query1 = """
            INSERT INTO customer (customerid, firstname, lastname, dob, address, phone, email, aadharcard, pancard) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
        values1 = (
            customerid,
            data['firstname'], 
            data['lastname'], 
            data['dob'], 
            data['address'], 
            data['phone'], 
            email, 
            aadharcard,
            pancard
        )
        query2 = """
            INSERT INTO account (accountid, customerid, branchid, accounttype, 
                        accountnumber, openingdate, balance, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
        values2 = (
            accountid,
            customerid,
            branchid,
            accounttype,
            accountnumber,
            openingdate,
            balance,
            status
        )
        
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(query1, values1)
        cursor.execute(query2, values2)
        connection.commit()
        connection.close()
        
        return jsonify({"message": "Account created successfully!",
        "customer_id": customerid,
        "accountnumber":accountnumber}), 201
    except mysql.connector.Error as err:
        return jsonify({"error": f"Database error: {err}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
