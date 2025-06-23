import pandas as pd
import os
from datetime import datetime
import shutil

def backup_excel_file(filepath):
    """Create a backup of the Excel file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = filepath.replace('.xlsx', f'_backup_{timestamp}.xlsx')
    shutil.copy2(filepath, backup_path)
    print(f"Backup created: {backup_path}")
    return backup_path

def update_summary_calculations():
    """Update Achievement and Gross Profit % calculations in the Summary sheet"""
    
    # Define file path
    base_path = "/Users/haithamdata/Documents/Prog/Occasional/Parsing Data"
    master_table_path = os.path.join(base_path, "Master Table.xlsx")
    
    # Create backup
    backup_path = backup_excel_file(master_table_path)
    
    try:
        # Read all sheets
        master_data = pd.read_excel(master_table_path, sheet_name='Master Data')
        summary_data = pd.read_excel(master_table_path, sheet_name='Summary')
        
        # Recalculate totals and metrics for summary
        updated_summary = []
        
        for idx, row in summary_data.iterrows():
            customer = row['Customer']
            service_type = row['Service_Type']
            
            # Filter master data for this customer and service
            filtered_data = master_data[(master_data['Customer'] == customer) & 
                                      (master_data['Service_Type'] == service_type)]
            
            if not filtered_data.empty:
                # Calculate totals
                total_cost = filtered_data['Cost'].sum()
                total_target = filtered_data['Target'].sum()
                total_revenue = filtered_data['Revenue'].sum()
                total_receivables = filtered_data['Receivables Collected'].sum() if 'Receivables Collected' in filtered_data.columns else None
                
                # Calculate Achievement % (Revenue/Target * 100)
                achievement = None
                if pd.notna(total_target) and total_target > 0:
                    achievement = round((total_revenue / total_target) * 100, 2)
                
                # Calculate Gross Profit % ((Revenue-Cost)/Revenue * 100)
                gross_profit_pct = None
                if pd.notna(total_revenue) and total_revenue > 0:
                    gross_profit_pct = round(((total_revenue - total_cost) / total_revenue) * 100, 2)
                
                # Calculate Receivables Collected Rate (Receivables/Revenue * 100)
                receivables_rate = None
                if pd.notna(total_receivables) and pd.notna(total_revenue) and total_revenue > 0:
                    receivables_rate = round((total_receivables / total_revenue) * 100, 2)
                
                updated_summary.append({
                    'Customer': customer,
                    'Service_Type': service_type,
                    'Total_Cost': total_cost,
                    'Total_Target': total_target,
                    'Total_Revenue': total_revenue,
                    'Receivables Collected': total_receivables,
                    'Achievement': achievement,
                    'Gross Profit %': gross_profit_pct,
                    'Receivables Collected Rate': receivables_rate
                })
        
        # Create new summary DataFrame
        summary_df = pd.DataFrame(updated_summary)
        
        # Write back to Excel
        with pd.ExcelWriter(master_table_path, engine='openpyxl', mode='a', if_sheet_exists='replace') as writer:
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        print("Summary calculations updated successfully!")
        print(f"\nSummary Statistics:")
        print(f"Total Customers: {len(summary_df['Customer'].unique())}")
        print(f"Service Types: {summary_df['Service_Type'].unique().tolist()}")
        
        # Show some calculation examples
        print("\nSample Calculations:")
        for idx, row in summary_df.head(5).iterrows():
            print(f"\n{row['Customer']} - {row['Service_Type']}:")
            print(f"  Achievement: {row['Achievement']}%" if pd.notna(row['Achievement']) else "  Achievement: N/A (no target)")
            print(f"  Gross Profit %: {row['Gross Profit %']}%" if pd.notna(row['Gross Profit %']) else "  Gross Profit %: N/A (no revenue)")
        
    except Exception as e:
        print(f"Error updating calculations: {str(e)}")
        # Restore from backup if error occurs
        print(f"Restoring from backup...")
        shutil.copy2(backup_path, master_table_path)
        raise e

if __name__ == "__main__":
    update_summary_calculations()