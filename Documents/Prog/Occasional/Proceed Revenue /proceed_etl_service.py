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
    
    def generate_slide1_landing_achievement(self, year: int) -> Dict[str, Any]:
        """Slide 1: Total Landing Achievement - Total achievement vs total target"""
        # Get YTD data for all customers
        ytd_report = self.generate_report('year', year)
        
        total_metrics = {
            'cost': sum(item[f'{year} Cost'] for item in ytd_report),
            'target': sum(item[f'{year} Target'] for item in ytd_report),
            'revenue': sum(item[f'{year} Revenue'] for item in ytd_report),
            'receivables_collected': sum(item[f'{year} Receivables Collected'] for item in ytd_report)
        }
        
        # Calculate achievement and other metrics
        achievement_pct = (total_metrics['revenue'] / total_metrics['target'] * 100) if total_metrics['target'] > 0 else 0
        gross_profit = total_metrics['revenue'] - total_metrics['cost']
        gross_profit_pct = (gross_profit / total_metrics['revenue'] * 100) if total_metrics['revenue'] > 0 else 0
        
        return {
            "Total Target": round(total_metrics['target'], 2),
            "Total Revenue": round(total_metrics['revenue'], 2),
            "Total Cost": round(total_metrics['cost'], 2),
            "Total Achievement %": round(achievement_pct, 2),
            "Total Gross Profit": round(gross_profit, 2),
            "Total Gross Profit %": round(gross_profit_pct, 2),
            "Year": year
        }
    
    def generate_slide2_business_unit_landing(self, year: int) -> List[Dict[str, Any]]:
        """Slide 2: Business Unit Landing - High level achievement by service type"""
        # Get YTD data
        ytd_report = self.generate_report('year', year)
        
        # Group by service type
        service_groups = {}
        for item in ytd_report:
            service_type = item['Service_Type']
            if service_type not in service_groups:
                service_groups[service_type] = {
                    'cost': 0,
                    'target': 0,
                    'revenue': 0,
                    'receivables_collected': 0
                }
            
            service_groups[service_type]['cost'] += item[f'{year} Cost']
            service_groups[service_type]['target'] += item[f'{year} Target']
            service_groups[service_type]['revenue'] += item[f'{year} Revenue']
            service_groups[service_type]['receivables_collected'] += item[f'{year} Receivables Collected']
        
        # Calculate metrics for each service type
        result = []
        for service_type, metrics in service_groups.items():
            achievement_pct = (metrics['revenue'] / metrics['target'] * 100) if metrics['target'] > 0 else 0
            gross_profit = metrics['revenue'] - metrics['cost']
            gross_profit_pct = (gross_profit / metrics['revenue'] * 100) if metrics['revenue'] > 0 else 0
            
            result.append({
                "Service_Type": service_type,
                "Target": round(metrics['target'], 2),
                "Revenue": round(metrics['revenue'], 2),
                "Cost": round(metrics['cost'], 2),
                "Achievement %": round(achievement_pct, 2),
                "Gross Profit": round(gross_profit, 2),
                "Gross Profit %": round(gross_profit_pct, 2)
            })
        
        return result
    
    def generate_slide3_business_unit_period_breakdown(self, year: int, current_month: int = 6, current_quarter: int = 2) -> Dict[str, List[Dict[str, Any]]]:
        """Slide 3: Business Unit Period Breakdown - MTD, QTD, YTD by service type"""
        result = {
            "Transportation": [],
            "Warehouses": []
        }
        
        # Get current periods
        mtd_report = self.generate_report('month', year, month=current_month)
        qtd_report = self.generate_report('quarter', year, quarter=current_quarter)
        ytd_report = self.generate_report('year', year)
        
        # Period names
        mtd_name = self.get_period_name('month', year, current_month)
        qtd_name = self.get_period_name('quarter', year, quarter=current_quarter)
        ytd_name = str(year)
        
        # Aggregate by service type for each period
        for service_type in ["Transportation", "Warehouses"]:
            # MTD
            mtd_metrics = self._aggregate_by_service_type(mtd_report, service_type, mtd_name)
            if mtd_metrics:
                mtd_metrics["Period"] = f"MTD ({mtd_name})"
                result[service_type].append(mtd_metrics)
            
            # QTD
            qtd_metrics = self._aggregate_by_service_type(qtd_report, service_type, qtd_name)
            if qtd_metrics:
                qtd_metrics["Period"] = f"QTD ({qtd_name})"
                result[service_type].append(qtd_metrics)
            
            # YTD
            ytd_metrics = self._aggregate_by_service_type(ytd_report, service_type, ytd_name)
            if ytd_metrics:
                ytd_metrics["Period"] = f"YTD ({ytd_name})"
                result[service_type].append(ytd_metrics)
        
        return result
    
    def _aggregate_by_service_type(self, report: List[Dict], service_type: str, period_name: str) -> Dict[str, Any]:
        """Helper function to aggregate metrics by service type"""
        filtered_items = [item for item in report if item['Service_Type'] == service_type]
        
        if not filtered_items:
            return None
        
        # Find the column names dynamically
        cost_col = next((k for k in filtered_items[0].keys() if 'Cost' in k and period_name in k), None)
        target_col = next((k for k in filtered_items[0].keys() if 'Target' in k and period_name in k), None)
        revenue_col = next((k for k in filtered_items[0].keys() if 'Revenue' in k and period_name in k), None)
        
        if not all([cost_col, target_col, revenue_col]):
            return None
        
        total_cost = sum(item[cost_col] for item in filtered_items)
        total_target = sum(item[target_col] for item in filtered_items)
        total_revenue = sum(item[revenue_col] for item in filtered_items)
        
        achievement_pct = (total_revenue / total_target * 100) if total_target > 0 else 0
        gross_profit = total_revenue - total_cost
        gross_profit_pct = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        return {
            "Target": round(total_target, 2),
            "Revenue": round(total_revenue, 2),
            "Cost": round(total_cost, 2),
            "Achievement %": round(achievement_pct, 2),
            "Gross Profit": round(gross_profit, 2),
            "Gross Profit %": round(gross_profit_pct, 2)
        }
    
    def generate_slide4_customer_achievement(self, year: int, current_quarter: int = 2) -> List[Dict[str, Any]]:
        """Slide 4: Customer Achievement - QTD and YTD by customer"""
        qtd_report = self.generate_report('quarter', year, quarter=current_quarter)
        ytd_report = self.generate_report('year', year)
        
        qtd_name = self.get_period_name('quarter', year, quarter=current_quarter)
        ytd_name = str(year)
        
        # Create customer dictionary
        customers = {}
        
        # Process QTD data
        for item in qtd_report:
            customer = item['Customer']
            if customer not in customers:
                customers[customer] = {}
            
            # Sum up metrics for this customer
            if 'QTD' not in customers[customer]:
                customers[customer]['QTD'] = {
                    'cost': 0, 'target': 0, 'revenue': 0
                }
            
            customers[customer]['QTD']['cost'] += item[f'{qtd_name} Cost']
            customers[customer]['QTD']['target'] += item[f'{qtd_name} Target']
            customers[customer]['QTD']['revenue'] += item[f'{qtd_name} Revenue']
        
        # Process YTD data
        for item in ytd_report:
            customer = item['Customer']
            if customer not in customers:
                customers[customer] = {}
            
            if 'YTD' not in customers[customer]:
                customers[customer]['YTD'] = {
                    'cost': 0, 'target': 0, 'revenue': 0
                }
            
            customers[customer]['YTD']['cost'] += item[f'{ytd_name} Cost']
            customers[customer]['YTD']['target'] += item[f'{ytd_name} Target']
            customers[customer]['YTD']['revenue'] += item[f'{ytd_name} Revenue']
        
        # Build result
        result = []
        for customer, periods in customers.items():
            entry = {"Customer": customer}
            
            # QTD metrics
            if 'QTD' in periods:
                qtd_ach = (periods['QTD']['revenue'] / periods['QTD']['target'] * 100) if periods['QTD']['target'] > 0 else 0
                entry[f"QTD Target"] = round(periods['QTD']['target'], 2)
                entry[f"QTD Revenue"] = round(periods['QTD']['revenue'], 2)
                entry[f"QTD Achievement %"] = round(qtd_ach, 2)
            
            # YTD metrics
            if 'YTD' in periods:
                ytd_ach = (periods['YTD']['revenue'] / periods['YTD']['target'] * 100) if periods['YTD']['target'] > 0 else 0
                entry[f"YTD Target"] = round(periods['YTD']['target'], 2)
                entry[f"YTD Revenue"] = round(periods['YTD']['revenue'], 2)
                entry[f"YTD Achievement %"] = round(ytd_ach, 2)
            
            result.append(entry)
        
        return result
    
    def generate_slide5_customer_by_service_type(self, year: int, current_quarter: int = 2) -> Dict[str, List[Dict[str, Any]]]:
        """Slide 5: Customer Achievement by Service Type - QTD and YTD"""
        qtd_report = self.generate_report('quarter', year, quarter=current_quarter)
        ytd_report = self.generate_report('year', year)
        
        qtd_name = self.get_period_name('quarter', year, quarter=current_quarter)
        ytd_name = str(year)
        
        result = {
            "Transportation": [],
            "Warehouses": []
        }
        
        # Process by service type
        for service_type in ["Transportation", "Warehouses"]:
            customers = {}
            
            # Process QTD
            qtd_filtered = [item for item in qtd_report if item['Service_Type'] == service_type]
            for item in qtd_filtered:
                customer = item['Customer']
                if customer not in customers:
                    customers[customer] = {'QTD': {}, 'YTD': {}}
                
                customers[customer]['QTD'] = {
                    'target': item[f'{qtd_name} Target'],
                    'revenue': item[f'{qtd_name} Revenue'],
                    'achievement': item[f'{qtd_name} Ach. %']
                }
            
            # Process YTD
            ytd_filtered = [item for item in ytd_report if item['Service_Type'] == service_type]
            for item in ytd_filtered:
                customer = item['Customer']
                if customer not in customers:
                    customers[customer] = {'QTD': {}, 'YTD': {}}
                
                customers[customer]['YTD'] = {
                    'target': item[f'{ytd_name} Target'],
                    'revenue': item[f'{ytd_name} Revenue'],
                    'achievement': item[f'{ytd_name} Ach. %']
                }
            
            # Build result for this service type
            for customer, periods in customers.items():
                entry = {"Customer": customer}
                
                if periods.get('QTD'):
                    entry["QTD Target"] = round(periods['QTD']['target'], 2)
                    entry["QTD Revenue"] = round(periods['QTD']['revenue'], 2)
                    entry["QTD Achievement %"] = round(periods['QTD']['achievement'], 2)
                
                if periods.get('YTD'):
                    entry["YTD Target"] = round(periods['YTD']['target'], 2)
                    entry["YTD Revenue"] = round(periods['YTD']['revenue'], 2)
                    entry["YTD Achievement %"] = round(periods['YTD']['achievement'], 2)
                
                result[service_type].append(entry)
        
        return result
    
    def generate_presentation_slides(self, year: int, current_month: int = 6, current_quarter: int = 2):
        """Generate all presentation slides and export to JSON files"""
        print(f"\nGenerating presentation slides for {year}...")
        
        # Slide 1: Landing Achievement
        slide1 = self.generate_slide1_landing_achievement(year)
        self.export_report_to_json(slide1, "Slide1_Landing_Achievement.json")
        print("✓ Slide 1: Landing Achievement generated")
        
        # Slide 2: Business Unit Landing
        slide2 = self.generate_slide2_business_unit_landing(year)
        self.export_report_to_json(slide2, "Slide2_Business_Unit_Landing.json")
        print("✓ Slide 2: Business Unit Landing generated")
        
        # Slide 3: Business Unit Period Breakdown
        slide3 = self.generate_slide3_business_unit_period_breakdown(year, current_month, current_quarter)
        self.export_report_to_json(slide3, "Slide3_Business_Unit_Period_Breakdown.json")
        print("✓ Slide 3: Business Unit Period Breakdown generated")
        
        # Slide 4: Customer Achievement
        slide4 = self.generate_slide4_customer_achievement(year, current_quarter)
        self.export_report_to_json(slide4, "Slide4_Customer_Achievement.json")
        print("✓ Slide 4: Customer Achievement generated")
        
        # Slide 5: Customer by Service Type
        slide5 = self.generate_slide5_customer_by_service_type(year, current_quarter)
        self.export_report_to_json(slide5, "Slide5_Customer_By_Service_Type.json")
        print("✓ Slide 5: Customer by Service Type generated")
        
        print("\nAll presentation slides generated successfully!")
    
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
    parser.add_argument('--slides', action='store_true', help='Generate presentation slides')
    
    args = parser.parse_args()
    
    # Initialize ETL service
    etl = ProceedETLService()
    
    # Determine current period based on current date
    current_date = datetime.now()
    current_month = args.month or current_date.month
    current_quarter = args.quarter or ((current_date.month - 1) // 3 + 1)
    
    if args.slides:
        # Generate presentation slides
        etl.generate_presentation_slides(args.year, current_month, current_quarter)
    
    elif args.period:
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