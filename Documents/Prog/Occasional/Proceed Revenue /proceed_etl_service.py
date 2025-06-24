#!/usr/bin/env python3
"""
Proceed Revenue ETL Service
Creates reports from Master_Table.xlsx for dashboard consumption
Supports Month-to-Date, Quarter-to-Date, and Year-to-Date calculations
"""

import pandas as pd
import json
from datetime import datetime
from typing import Dict, List, Any
import argparse


class ProceedETLService:
    def __init__(self, excel_file: str = "Master_Table.xlsx"):
        """Initialize ETL service with Excel data source"""
        self.excel_file = excel_file
        self.df = None
        self.load_data()
    
    def load_data(self):
        """Load data from Excel file"""
        try:
            self.df = pd.read_excel(self.excel_file)
            # Fill NaN values with 0 for calculations
            numeric_cols = ['Cost', 'Target', 'Revenue', 'Receivables Collected']
            self.df[numeric_cols] = self.df[numeric_cols].fillna(0)
            print(f"Loaded {len(self.df)} records from {self.excel_file}")
        except Exception as e:
            raise Exception(f"Error loading Excel file: {e}")
    
    def get_period_name(self, period_type: str, year: int, month: int = None, quarter: int = None) -> str:
        """Generate period name for column headers"""
        if period_type.lower() == 'month':
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            return f"{month_names[month-1]} {year}"
        elif period_type.lower() == 'quarter':
            return f"Q{quarter} {year}"
        elif period_type.lower() == 'year':
            return f"{year}"
        else:
            return period_type
    
    def filter_data_by_period(self, period_type: str, year: int, month: int = None, quarter: int = None) -> pd.DataFrame:
        """Filter data based on period type (MTD, QTD, YTD) - specific period logic"""
        filtered_df = self.df[self.df['Year'] == year].copy()
        
        # Month name mapping
        month_names = {
            1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
            7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
        }
        
        if period_type.lower() == 'month':
            # Month-to-Date: ONLY the specific month
            target_month_name = month_names[month]
            filtered_df = filtered_df[filtered_df['Month'] == target_month_name]
        elif period_type.lower() == 'quarter':
            # Quarter-to-Date: ONLY the months within that specific quarter
            quarter_months = {
                1: ['Jan', 'Feb', 'Mar'],
                2: ['Apr', 'May', 'Jun'], 
                3: ['Jul', 'Aug', 'Sep'],
                4: ['Oct', 'Nov', 'Dec']
            }
            filtered_df = filtered_df[filtered_df['Month'].isin(quarter_months[quarter])]
        elif period_type.lower() == 'year':
            # Year-to-Date: all months in the year
            pass  # Already filtered by year
        
        return filtered_df
    
    def calculate_metrics(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate aggregated metrics for the filtered period"""
        return {
            'cost': df['Cost'].sum(),
            'target': df['Target'].sum(),
            'revenue': df['Revenue'].sum(),
            'receivables_collected': df['Receivables Collected'].sum()
        }
    
    def calculate_derived_metrics(self, metrics: Dict[str, float]) -> Dict[str, float]:
        """Calculate derived metrics like achievement %, gross profit %, collection rate"""
        # Achievement % = (Revenue / Target) * 100
        achievement_pct = (metrics['revenue'] / metrics['target'] * 100) if metrics['target'] > 0 else 0
        
        # Gross Profit % = ((Revenue - Cost) / Revenue) * 100
        gross_profit_pct = ((metrics['revenue'] - metrics['cost']) / metrics['revenue'] * 100) if metrics['revenue'] > 0 else 0
        
        # Collection Rate % = (Receivables Collected / Revenue) * 100
        collection_rate_pct = (metrics['receivables_collected'] / metrics['revenue'] * 100) if metrics['revenue'] > 0 else 0
        
        return {
            'achievement_pct': round(achievement_pct, 2),
            'gross_profit_pct': round(gross_profit_pct, 2),
            'collection_rate_pct': round(collection_rate_pct, 2)
        }
    
    def find_last_revenue_month(self, customer: str, service_type: str, year: int) -> str:
        """Find the last month with revenue > 0 for a customer/service combination"""
        customer_data = self.df[
            (self.df['Customer'] == customer) & 
            (self.df['Service_Type'] == service_type) & 
            (self.df['Year'] == year)
        ].copy()
        
        # Filter months with revenue > 0
        revenue_months = customer_data[customer_data['Revenue'] > 0].copy()
        
        if revenue_months.empty:
            return None
        
        # Month order for proper sorting
        month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        # Sort by month order and get the last one
        revenue_months.loc[:, 'month_index'] = revenue_months['Month'].map({month: idx for idx, month in enumerate(month_order)})
        last_month_idx = revenue_months['month_index'].max()
        
        return month_order[last_month_idx]
    
    def filter_data_ytd_smart(self, year: int, customer: str, service_type: str) -> pd.DataFrame:
        """Filter YTD data up to last month with revenue for specific customer/service"""
        # Find last month with revenue for this customer/service
        last_revenue_month = self.find_last_revenue_month(customer, service_type, year)
        
        if last_revenue_month is None:
            # No revenue found, return all data for the customer/service
            return self.df[
                (self.df['Customer'] == customer) & 
                (self.df['Service_Type'] == service_type) & 
                (self.df['Year'] == year)
            ].copy()
        
        # Get months up to and including the last revenue month
        month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        last_month_index = month_order.index(last_revenue_month)
        months_to_include = month_order[:last_month_index + 1]
        
        # Filter data
        filtered_data = self.df[
            (self.df['Customer'] == customer) & 
            (self.df['Service_Type'] == service_type) & 
            (self.df['Year'] == year) &
            (self.df['Month'].isin(months_to_include))
        ].copy()
        
        return filtered_data

    def generate_report(self, period_type: str, year: int, month: int = None, quarter: int = None) -> List[Dict[str, Any]]:
        """Generate report for specified period"""
        
        # Get period name for column headers
        period_name = self.get_period_name(period_type, year, month, quarter)
        
        # Group by Customer and Service_Type
        report_data = []
        
        if period_type.lower() == 'year':
            # Special handling for YTD - aggregate up to last revenue month for each customer/service
            year_df = self.df[self.df['Year'] == year].copy()
            
            for (customer, service_type), group in year_df.groupby(['Customer', 'Service_Type']):
                # Get YTD data up to last revenue month for this specific customer/service
                filtered_group = self.filter_data_ytd_smart(year, customer, service_type)
                
                # Calculate metrics for this customer/service combination
                metrics = self.calculate_metrics(filtered_group)
                derived_metrics = self.calculate_derived_metrics(metrics)
                
                # Create report entry with dynamic column names
                report_entry = {
                    "Customer": customer,
                    "Service_Type": service_type,
                    f"{period_name} Cost": round(metrics['cost'], 2),
                    f"{period_name} Target": round(metrics['target'], 2),
                    f"{period_name} Revenue": round(metrics['revenue'], 2),
                    f"{period_name} Receivables Collected": round(metrics['receivables_collected'], 2),
                    f"{period_name} Ach. %": derived_metrics['achievement_pct'],
                    f"{period_name} Gross Profit %": derived_metrics['gross_profit_pct'],
                    f"{period_name} Receivables Collected Rate %": derived_metrics['collection_rate_pct']
                }
                
                report_data.append(report_entry)
        else:
            # Standard handling for MTD and QTD
            filtered_df = self.filter_data_by_period(period_type, year, month, quarter)
            
            for (customer, service_type), group in filtered_df.groupby(['Customer', 'Service_Type']):
                # Calculate metrics for this customer/service combination
                metrics = self.calculate_metrics(group)
                derived_metrics = self.calculate_derived_metrics(metrics)
                
                # Create report entry with dynamic column names
                report_entry = {
                    "Customer": customer,
                    "Service_Type": service_type,
                    f"{period_name} Cost": round(metrics['cost'], 2),
                    f"{period_name} Target": round(metrics['target'], 2),
                    f"{period_name} Revenue": round(metrics['revenue'], 2),
                    f"{period_name} Receivables Collected": round(metrics['receivables_collected'], 2),
                    f"{period_name} Ach. %": derived_metrics['achievement_pct'],
                    f"{period_name} Gross Profit %": derived_metrics['gross_profit_pct'],
                    f"{period_name} Receivables Collected Rate %": derived_metrics['collection_rate_pct']
                }
                
                report_data.append(report_entry)
        
        return report_data
    
    def export_report_to_json(self, report_data: List[Dict[str, Any]], filename: str):
        """Export report data to JSON file"""
        with open(filename, 'w') as f:
            json.dump(report_data, f, indent=2)
        print(f"Report exported to {filename}")
    
    def generate_all_reports(self, year: int, current_month: int = 12, current_quarter: int = 4):
        """Generate monthly, quarterly, and yearly reports"""
        reports = {}
        
        # Monthly reports (MTD for each month up to current_month)
        for month in range(1, current_month + 1):
            period_name = self.get_period_name('month', year, month)
            reports[f"MTD_{period_name.replace(' ', '_')}"] = self.generate_report('month', year, month=month)
        
        # Quarterly reports (QTD for each quarter up to current_quarter)
        for quarter in range(1, current_quarter + 1):
            period_name = self.get_period_name('quarter', year, quarter=quarter)
            reports[f"QTD_{period_name.replace(' ', '_')}"] = self.generate_report('quarter', year, quarter=quarter)
        
        # Yearly report (YTD)
        period_name = self.get_period_name('year', year)
        reports[f"YTD_{period_name}"] = self.generate_report('year', year)
        
        return reports


def main():
    parser = argparse.ArgumentParser(description='Proceed Revenue ETL Service')
    parser.add_argument('--year', type=int, default=datetime.now().year, help='Year for reporting')
    parser.add_argument('--month', type=int, help='Current month (1-12)')
    parser.add_argument('--quarter', type=int, help='Current quarter (1-4)')
    parser.add_argument('--period', choices=['month', 'quarter', 'year'], help='Specific period type')
    parser.add_argument('--export', action='store_true', help='Export reports to JSON files')
    
    args = parser.parse_args()
    
    # Initialize ETL service
    etl = ProceedETLService()
    
    # Determine current period based on current date
    current_date = datetime.now()
    current_month = args.month or current_date.month
    current_quarter = args.quarter or ((current_date.month - 1) // 3 + 1)
    
    if args.period:
        # Generate specific period report
        if args.period == 'month':
            report = etl.generate_report('month', args.year, month=current_month)
            period_name = etl.get_period_name('month', args.year, current_month)
            print(f"\n=== {period_name} MTD Report ===")
        elif args.period == 'quarter':
            report = etl.generate_report('quarter', args.year, quarter=current_quarter)
            period_name = etl.get_period_name('quarter', args.year, quarter=current_quarter)
            print(f"\n=== {period_name} QTD Report ===")
        elif args.period == 'year':
            report = etl.generate_report('year', args.year)
            period_name = etl.get_period_name('year', args.year)
            print(f"\n=== {period_name} YTD Report ===")
        
        print(json.dumps(report, indent=2))
        
        if args.export:
            filename = f"{args.period}_report_{args.year}.json"
            etl.export_report_to_json(report, filename)
    
    else:
        # Generate all reports
        print(f"\nGenerating all reports for {args.year}...")
        all_reports = etl.generate_all_reports(args.year, current_month, current_quarter)
        
        for report_name, report_data in all_reports.items():
            print(f"\n=== {report_name} ===")
            print(f"Records: {len(report_data)}")
            
            if args.export:
                filename = f"{report_name}.json"
                etl.export_report_to_json(report_data, filename)


if __name__ == "__main__":
    main()