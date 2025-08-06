#!/usr/bin/env node

const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Path to the problematic Excel file
const filePath = '/Users/haithamdata/Documents/proceed-revenue-template-2025-07-31 OLD.xlsx';

console.log('=== Excel File Debug Analysis ===');
console.log(`File: ${filePath}`);
console.log(`Exists: ${fs.existsSync(filePath)}`);

if (!fs.existsSync(filePath)) {
    console.error('File not found!');
    process.exit(1);
}

try {
    // Read the workbook
    console.log('\n1. Reading workbook...');
    const workbook = xlsx.readFile(filePath);
    
    console.log('\n2. Sheet Information:');
    console.log(`Total sheets: ${workbook.SheetNames.length}`);
    console.log('Sheet names:', workbook.SheetNames);
    
    // Analyze each sheet
    console.log('\n3. Sheet Analysis:');
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`\n--- Sheet ${index}: "${sheetName}" ---`);
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`Rows found: ${jsonData.length}`);
        
        if (jsonData.length > 0) {
            console.log('First row columns:', Object.keys(jsonData[0]));
            console.log('Sample data (first row):', JSON.stringify(jsonData[0], null, 2));
        } else {
            // Try to understand why no data
            console.log('No data found with sheet_to_json!');
            
            // Check raw sheet properties
            const range = worksheet['!ref'];
            console.log('Sheet range:', range);
            
            // Try different parsing options
            console.log('\nTrying with header option...');
            const dataWithHeader = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            console.log(`Rows with header=1: ${dataWithHeader.length}`);
            if (dataWithHeader.length > 0) {
                console.log('First few rows:', dataWithHeader.slice(0, 3));
            }
            
            // Check for specific cell values
            console.log('\nChecking specific cells:');
            ['A1', 'A2', 'B1', 'B2'].forEach(cell => {
                if (worksheet[cell]) {
                    console.log(`${cell}: ${worksheet[cell].v} (type: ${worksheet[cell].t})`);
                }
            });
        }
        
        // Check sheet type detection
        const lowerSheetName = sheetName.toLowerCase();
        if (lowerSheetName.includes('revenue') || index === 0) {
            console.log('-> Would be processed as REVENUE data');
        } else if (lowerSheetName.includes('sales plan') || index === 1) {
            console.log('-> Would be processed as SALES PLAN data');
        } else if (lowerSheetName.includes('opportunities') || index === 2) {
            console.log('-> Would be processed as OPPORTUNITIES data');
        } else {
            console.log('-> Sheet type not recognized');
        }
    });
    
    // Test the actual ETL validation
    console.log('\n4. Testing ETL Processing Logic:');
    
    // Simulate what ETL service does
    for (let i = 0; i < workbook.SheetNames.length; i++) {
        const sheetName = workbook.SheetNames[i];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`\nProcessing sheet: ${sheetName} (${jsonData.length} rows)`);
        
        if (jsonData.length === 0) {
            console.log('⚠️  This sheet would trigger "No data found" message!');
        }
    }
    
} catch (error) {
    console.error('\nError reading Excel file:', error.message);
    console.error(error.stack);
}

console.log('\n=== Analysis Complete ===');