#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';
const FILE_PATH = '/Users/haithamdata/Documents/proceed-revenue-template-2025-07-31 OLD.xlsx';

console.log('=== Testing File Upload ===');
console.log(`API URL: ${API_URL}`);
console.log(`File: ${FILE_PATH}`);

// Check if file exists
if (!fs.existsSync(FILE_PATH)) {
    console.error('File not found!');
    process.exit(1);
}

// Create form data
const form = new FormData();
form.append('file', fs.createReadStream(FILE_PATH), {
    filename: 'proceed-revenue-template-2025-07-31.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});

// Test upload
console.log('\nUploading file...');

axios.post(`${API_URL}/upload`, form, {
    headers: {
        ...form.getHeaders()
    }
})
.then(response => {
    console.log('\n✅ Upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
})
.catch(error => {
    console.error('\n❌ Upload failed!');
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response:', error.response.data);
    } else {
        console.error('Error:', error.message);
    }
});