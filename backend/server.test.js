const request = require('supertest');
const { createTestDatabase, seedTestData, createMockExcelBuffer } = require('./test/utils');
const mockPath = require('path');
const fs = require('fs');

// Mock the persistent-db module
jest.mock('./database/persistent-db', () => {
  const Database = require('better-sqlite3');
  const path = require('path');
  const testDbPath = process.env.TEST_DB_PATH || path.join(__dirname, 'test', 'test-db', 'test_revenue.db');
  
  return {
    run: function(sql, params) {
      return this.db.prepare(sql).run(params);
    },
    get: function(sql, params) {
      return this.db.prepare(sql).get(params);
    },
    all: function(sql, params) {
      return this.db.prepare(sql).all(params);
    },
    prepare: function(sql) {
      return this.db.prepare(sql);
    },
    transaction: function(fn) {
      return this.db.transaction(fn);
    },
    isConnected: function() {
      return true;
    },
    reconnect: async function() {
      return true;
    },
    db: new Database(testDbPath)
  };
});

describe('Server API Integration Tests', () => {
  let app;
  let server;
  let testDb;

  beforeAll(() => {
    // Create test database
    testDb = createTestDatabase();
    seedTestData(testDb);
    
    // Require app after mocks are set up
    app = require('./server');
  });

  afterAll((done) => {
    testDb.close();
    if (server && server.close) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Health Check', () => {
    it('GET /api/health should return OK status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        database: 'connected',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Overview Data', () => {
    it('GET /api/overview should return overview data', async () => {
      const response = await request(app)
        .get('/api/overview?year=2025&period=YTD')
        .expect(200);

      expect(response.body).toMatchObject({
        revenue: expect.any(Number),
        target: expect.any(Number),
        achievement: expect.any(Number),
        grossProfit: expect.any(Number),
        grossMargin: expect.any(Number),
        transportation: expect.objectContaining({
          revenue: expect.any(Number),
          percentage: expect.any(Number)
        }),
        warehouses: expect.objectContaining({
          revenue: expect.any(Number),
          percentage: expect.any(Number)
        })
      });
    });

    it('should handle different period filters', async () => {
      const periods = ['MTD', 'QTD', 'YTD'];
      
      for (const period of periods) {
        const response = await request(app)
          .get(`/api/overview?year=2025&period=${period}`)
          .expect(200);

        expect(response.body).toHaveProperty('revenue');
        expect(response.body).toHaveProperty('achievement');
      }
    });

    it('should return 400 for invalid year', async () => {
      await request(app)
        .get('/api/overview?year=invalid')
        .expect(400);
    });
  });

  describe('Business Unit Data', () => {
    it('GET /api/business-units should return business unit data', async () => {
      const response = await request(app)
        .get('/api/business-units?year=2025')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toMatchObject({
          name: expect.any(String),
          revenue: expect.any(Number),
          target: expect.any(Number),
          achievement: expect.any(Number),
          grossProfit: expect.any(Number),
          customers: expect.any(Number)
        });
      }
    });
  });

  describe('Customer Data', () => {
    it('GET /api/customers should return customer data', async () => {
      const response = await request(app)
        .get('/api/customers?year=2025')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toMatchObject({
          customer: expect.any(String),
          revenue: expect.any(Number),
          target: expect.any(Number),
          achievement: expect.any(Number),
          transportation: expect.any(Number),
          warehouses: expect.any(Number)
        });
      }
    });

    it('GET /api/customer-achievement should return achievement data', async () => {
      const response = await request(app)
        .get('/api/customer-achievement?year=2025')
        .expect(200);

      expect(response.body).toMatchObject({
        achieved: expect.any(Number),
        notAchieved: expect.any(Number),
        achievementRate: expect.any(Number),
        details: expect.arrayContaining([
          expect.objectContaining({
            status: expect.any(String),
            count: expect.any(Number),
            percentage: expect.any(Number)
          })
        ])
      });
    });
  });

  describe('Monthly Trends', () => {
    it('GET /api/monthly-trends should return monthly data', async () => {
      const response = await request(app)
        .get('/api/monthly-trends?year=2025')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toMatchObject({
          month: expect.any(String),
          revenue: expect.any(Number),
          target: expect.any(Number),
          cost: expect.any(Number),
          grossProfit: expect.any(Number),
          achievement: expect.any(Number)
        });
      }
    });

    it('should filter by service type', async () => {
      const response = await request(app)
        .get('/api/monthly-trends?year=2025&serviceType=Transportation')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('File Upload', () => {
    it('POST /api/upload should process valid Excel file', async () => {
      const buffer = createMockExcelBuffer();
      
      const response = await request(app)
        .post('/api/upload')
        .attach('file', buffer, 'test.xlsx')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        summary: expect.objectContaining({
          totalRecords: expect.any(Number),
          inserted: expect.any(Number),
          updated: expect.any(Number),
          errors: expect.any(Number)
        })
      });
    });

    it('should reject non-Excel files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('not an excel file'), 'test.txt')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Excel')
      });
    });

    it('should handle missing file', async () => {
      await request(app)
        .post('/api/upload')
        .expect(400);
    });
  });

  describe('Export Endpoints', () => {
    it('GET /api/export/overview should return Excel file', async () => {
      const response = await request(app)
        .get('/api/export/overview?year=2025&period=YTD')
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml');
      expect(response.headers['content-disposition']).toContain('proceed-overview');
    });

    it('GET /api/export/customers should return Excel file', async () => {
      const response = await request(app)
        .get('/api/export/customers?year=2025')
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml');
    });
  });

  describe('Forecast Endpoints', () => {
    it('GET /api/forecast should return forecast data', async () => {
      const response = await request(app)
        .get('/api/forecast?year=2025')
        .expect(200);

      expect(response.body).toMatchObject({
        historicalData: expect.any(Array),
        forecast: expect.any(Array),
        linearRegression: expect.any(Object),
        opportunities: expect.any(Array),
        metrics: expect.any(Object)
      });
    });

    it('POST /api/forecast/opportunities should create opportunity', async () => {
      const opportunity = {
        customer: 'New Customer',
        service_type: 'Transportation',
        target_value: 100000,
        probability: 0.8,
        start_month: 7,
        duration: 3
      };

      const response = await request(app)
        .post('/api/forecast/opportunities')
        .send(opportunity)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        ...opportunity
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      await request(app)
        .get('/api/unknown-route')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/forecast/opportunities')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});