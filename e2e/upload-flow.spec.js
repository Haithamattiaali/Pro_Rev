import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to upload page
    await page.goto('/upload');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Data Upload")');
  });

  test('should display upload page with all elements', async ({ page }) => {
    // Check main elements are present
    await expect(page.locator('h1:has-text("Data Upload")')).toBeVisible();
    await expect(page.locator('text=Drag and drop Excel file here or click to browse')).toBeVisible();
    await expect(page.locator('button:has-text("Download Template")')).toBeVisible();
    
    // Check validation alert section
    const validationSection = page.locator('[data-testid="validation-alert"]');
    if (await validationSection.isVisible()) {
      await expect(validationSection).toContainText('Data Analysis Period Information');
    }
  });

  test('should download template file', async ({ page }) => {
    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click download template button
    await page.click('button:has-text("Download Template")');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('revenue_template');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });

  test('should upload Excel file successfully', async ({ page }) => {
    // Create a test Excel file path
    const testFilePath = path.join(__dirname, 'fixtures', 'test-revenue-data.xlsx');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for upload to process
    await page.waitForSelector('text=Processing...', { state: 'visible' });
    
    // Wait for success message
    await page.waitForSelector('text=Upload successful', { 
      state: 'visible',
      timeout: 30000 
    });
    
    // Verify success state
    await expect(page.locator('text=Upload successful')).toBeVisible();
    
    // Should show data summary
    await expect(page.locator('text=records processed')).toBeVisible();
  });

  test('should handle invalid file format', async ({ page }) => {
    // Try to upload a non-Excel file
    const testFilePath = path.join(__dirname, 'fixtures', 'invalid-file.txt');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Should show error message
    await expect(page.locator('text=Please upload a valid Excel file')).toBeVisible({
      timeout: 10000
    });
  });

  test('should clear upload and allow re-upload', async ({ page }) => {
    // First upload
    const testFilePath = path.join(__dirname, 'fixtures', 'test-revenue-data.xlsx');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for success
    await page.waitForSelector('text=Upload successful');
    
    // Click clear/reset button if available
    const clearButton = page.locator('button:has-text("Clear")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
    
    // Should be able to upload again
    await fileInput.setInputFiles(testFilePath);
    await page.waitForSelector('text=Processing...', { state: 'visible' });
  });

  test('should navigate to overview after successful upload', async ({ page }) => {
    // Upload file
    const testFilePath = path.join(__dirname, 'fixtures', 'test-revenue-data.xlsx');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Wait for success
    await page.waitForSelector('text=Upload successful');
    
    // Navigate to overview
    await page.click('a:has-text("Overview")');
    
    // Should be on overview page with data
    await expect(page).toHaveURL('/overview');
    await expect(page.locator('h1:has-text("Revenue Overview")')).toBeVisible();
    
    // Should show revenue metrics
    await expect(page.locator('[data-testid="metric-card-revenue"]')).toBeVisible();
  });

  test('should show validation information', async ({ page }) => {
    // Check if validation alert is present
    const validationAlert = page.locator('[data-testid="validation-alert"]');
    
    if (await validationAlert.isVisible()) {
      // Should show period information
      await expect(validationAlert).toContainText('Data Analysis Period Information');
      
      // Should show compliant/non-compliant months if any
      const compliantMonths = validationAlert.locator('text=Compliant Months');
      const nonCompliantMonths = validationAlert.locator('text=Non-Compliant Months');
      
      // At least one should be visible
      const hasCompliant = await compliantMonths.isVisible();
      const hasNonCompliant = await nonCompliantMonths.isVisible();
      
      expect(hasCompliant || hasNonCompliant).toBeTruthy();
    }
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Intercept upload request and fail it
    await context.route('**/api/upload', route => {
      route.abort('failed');
    });
    
    // Try to upload
    const testFilePath = path.join(__dirname, 'fixtures', 'test-revenue-data.xlsx');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Should show error message
    await expect(page.locator('text=Upload failed')).toBeVisible({
      timeout: 10000
    });
  });

  test('should respect file size limits', async ({ page }) => {
    // This test would require a large file in fixtures
    // For now, we'll check if the UI mentions size limits
    
    const uploadArea = page.locator('[data-testid="upload-area"]');
    const uploadText = await uploadArea.textContent();
    
    // Should mention file size limit somewhere
    expect(uploadText.toLowerCase()).toMatch(/max|limit|size|mb/i);
  });
});

test.describe('Upload Flow - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.goto('/upload');
    
    // Check main elements are visible on mobile
    await expect(page.locator('h1:has-text("Data Upload")')).toBeVisible();
    
    // Upload area should be full width on mobile
    const uploadArea = page.locator('[data-testid="upload-area"]');
    const box = await uploadArea.boundingBox();
    
    // Should take most of the viewport width (accounting for padding)
    expect(box.width).toBeGreaterThan(300);
  });
});