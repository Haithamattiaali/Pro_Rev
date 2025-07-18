const express = require('express');
const app = express();

// Test template endpoint
app.get('/api/template/download', async (req, res) => {
  try {
    console.log('Template download request received');
    console.log('Query params:', req.query);
    
    const templateService = require('./services/template.service');
    const { year } = req.query;
    
    console.log('Generating template...');
    const buffer = await templateService.generateTemplate(year ? parseInt(year) : null);
    const filename = templateService.generateFilename();
    
    console.log('Template generated successfully');
    console.log('Buffer size:', buffer.length);
    console.log('Filename:', filename);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('Template download error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Test sales plan export endpoint
app.get('/api/export/sales-plan', async (req, res) => {
  try {
    console.log('Sales plan export request received');
    console.log('Query params:', req.query);
    
    const salesPlanService = require('./services/salesPlan.service');
    const ExcelExportService = require('./services/excel');
    const dataService = require('./services/data.service');
    
    const excelExportService = new ExcelExportService(dataService);
    
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;

    console.log('Fetching sales plan data...');
    const [overview, byGL, byBU, monthly] = await Promise.all([
      salesPlanService.getSalesPlanOverview(parseInt(year), period, month ? parseInt(month) : null, quarter ? parseInt(quarter) : null),
      salesPlanService.getSalesPlanByGL(parseInt(year), period, month ? parseInt(month) : null, quarter ? parseInt(quarter) : null),
      salesPlanService.getSalesPlanByBusinessUnit(parseInt(year), period, month ? parseInt(month) : null, quarter ? parseInt(quarter) : null),
      salesPlanService.getSalesPlanMonthly(parseInt(year))
    ]);

    console.log('Data fetched successfully');
    console.log('Overview:', overview?.totals);
    
    console.log('Exporting to Excel...');
    const workbook = excelExportService.exportSalesPlanData({
      overview,
      byGL,
      byBU,
      monthly,
      year,
      period
    });
    
    const buffer = excelExportService.workbookToBuffer(workbook);
    
    console.log('Export successful');
    console.log('Buffer size:', buffer.length);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=proceed-sales-plan-${period}-${year}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export sales plan error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});