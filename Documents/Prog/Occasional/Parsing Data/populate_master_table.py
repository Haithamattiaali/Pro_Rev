import pandas as pd
import json
import os
from datetime import datetime
import shutil

def load_json_file(filepath):
    """Load JSON file and return as DataFrame"""
    with open(filepath, 'r') as f:
        data = json.load(f)
    return pd.DataFrame(data)

def backup_excel_file(filepath):
    """Create a backup of the Excel file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = filepath.replace('.xlsx', f'_backup_{timestamp}.xlsx')
    shutil.copy2(filepath, backup_path)
    print(f"Backup created: {backup_path}")
    return backup_path

def populate_master_table():
    """Main function to populate master table from JSON files"""
    
    # Define file paths
    base_path = "/Users/haithamdata/Documents/Prog/Occasional/Parsing Data"
    master_table_path = os.path.join(base_path, "Master Table.xlsx")
    
    json_files = {
        'Wh cost': os.path.join(base_path, "Wh cost.json"),
        'Wh Target': os.path.join(base_path, "Wh Target.json"),
        'Wh Revenue': os.path.join(base_path, "Wh Revenue.json"),
        'Trans cost': os.path.join(base_path, "Trans cost.json"),
        'Trans target': os.path.join(base_path, "Trans target.json"),
        'Trans Revenue': os.path.join(base_path, "Trans Revenue.json")
    }
    
    # Create backup of master table
    backup_path = backup_excel_file(master_table_path)
    
    # Month columns
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    # Load all JSON data
    all_data = []
    
    for file_name, file_path in json_files.items():
        print(f"\nProcessing: {file_name}")
        try:
            df = load_json_file(file_path)
            
            # Extract the metric type from the JSON (Cost, Target, or Revenue)
            metric = df['Relevant column in master table'].iloc[0]
            service_type = df['Service_Type'].iloc[0]
            
            # Process each customer's data
            for idx, row in df.iterrows():
                customer = row['Customer']
                
                # Create records for each month
                for month in months:
                    value = row.get(month, '')
                    # Clean the value (remove commas)
                    if value and value != '':
                        value = value.replace(',', '')
                        try:
                            value = float(value)
                        except:
                            value = None
                    else:
                        value = None
                    
                    record = {
                        'Customer': customer,
                        'Service_Type': service_type,
                        'Month': month,
                        metric: value
                    }
                    all_data.append(record)
                    
        except Exception as e:
            print(f"Error processing {file_name}: {str(e)}")
    
    # Convert to DataFrame
    combined_df = pd.DataFrame(all_data)
    
    # Group by Customer, Service_Type, and Month, then merge the metrics
    final_df = combined_df.groupby(['Customer', 'Service_Type', 'Month']).agg({
        'Cost': 'first',
        'Target': 'first',
        'Revenue': 'first'
    }).reset_index()
    
    # Add Receivables Collected column (to be filled later)
    final_df['Receivables Collected'] = None
    
    # Sort the dataframe
    final_df = final_df.sort_values(['Customer', 'Service_Type', 'Month'])
    
    # Save to Excel
    try:
        # Check if we should append to existing sheets or create new file
        with pd.ExcelWriter(master_table_path, engine='openpyxl', mode='w') as writer:
            final_df.to_excel(writer, sheet_name='Master Data', index=False)
            
            # Create a summary sheet
            summary_data = []
            for customer in final_df['Customer'].unique():
                for service in final_df['Service_Type'].unique():
                    customer_service_df = final_df[(final_df['Customer'] == customer) & 
                                                  (final_df['Service_Type'] == service)]
                    if not customer_service_df.empty:
                        total_cost = customer_service_df['Cost'].sum()
                        total_target = customer_service_df['Target'].sum()
                        total_revenue = customer_service_df['Revenue'].sum()
                        
                        # Calculate Achievement % (Revenue/Target * 100)
                        achievement = None
                        if total_target and total_target > 0:
                            achievement = (total_revenue / total_target) * 100
                        
                        # Calculate Gross Profit % ((Revenue-Cost)/Revenue * 100)
                        gross_profit_pct = None
                        if total_revenue and total_revenue > 0:
                            gross_profit_pct = ((total_revenue - total_cost) / total_revenue) * 100
                        
                        summary_data.append({
                            'Customer': customer,
                            'Service_Type': service,
                            'Total_Cost': total_cost,
                            'Total_Target': total_target,
                            'Total_Revenue': total_revenue,
                            'Receivables Collected': None,  # To be filled later
                            'Achievement': achievement,
                            'Gross Profit %': gross_profit_pct,
                            'Receivables Collected Rate': None  # To be filled later
                        })
            
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        print(f"\nMaster table populated successfully!")
        print(f"Total records created: {len(final_df)}")
        print(f"Unique customers: {final_df['Customer'].nunique()}")
        print(f"Service types: {final_df['Service_Type'].unique().tolist()}")
        
    except Exception as e:
        print(f"Error saving to Excel: {str(e)}")
        # Restore from backup if error occurs
        print(f"Restoring from backup...")
        shutil.copy2(backup_path, master_table_path)
        raise e

if __name__ == "__main__":
    populate_master_table()