#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const express = require('express');
const { default: open } = require('open');

const TOKEN_PATH = path.join('/Users/haithamdata', 'gmail_token.json');
const CREDENTIALS_PATH = '/Users/haithamdata/credentials.json';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
];

// Debug mode
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.error(...args);
  }
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Global auth client
let authClient = null;
let gmail = null;

// Authenticate with Google
async function authenticate() {
  debugLog('Starting authentication process...');
  
  try {
    // Check if we already have a token
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      debugLog('Found existing token, trying to use it');
      
      const { client_secret, client_id, redirect_uris } = JSON.parse(
        fs.readFileSync(CREDENTIALS_PATH, 'utf8')
      ).installed;
      
      const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]
      );
      
      oAuth2Client.setCredentials(token);
      
      // Test if token is still valid
      try {
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
        await gmail.users.getProfile({ userId: 'me' });
        debugLog('Token is valid');
        return oAuth2Client;
      } catch (err) {
        debugLog('Token is invalid or expired, attempting to refresh');
        
        try {
          // Try to refresh the token if we have a refresh_token
          if (token.refresh_token) {
            await oAuth2Client.refreshAccessToken();
            debugLog('Token refreshed successfully');
            
            // Save the refreshed token
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(oAuth2Client.credentials));
            debugLog('Updated token saved to', TOKEN_PATH);
            
            return oAuth2Client;
          }
        } catch (refreshErr) {
          debugLog('Error refreshing token:', refreshErr);
        }
        
        debugLog('Could not refresh token, getting a new one');
        // Continue to get a new token
      }
    }
    
    debugLog('No valid token found, initiating OAuth flow');
    
    const app = express();
    let port = 3001;
    
    // Try a few different ports if the initial one is in use
    const createServer = () => {
      return new Promise((resolve, reject) => {
        const server = app.listen(port)
          .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              debugLog(`Port ${port} in use, trying port ${port + 1}`);
              port += 1;
              if (port > 3010) { // try up to port 3010
                reject(new Error('Could not find an available port'));
                return;
              }
              server.close();
              createServer().then(resolve).catch(reject);
            } else {
              reject(err);
            }
          })
          .on('listening', () => {
            debugLog(`Server listening on port ${port}`);
            resolve(server);
          });
      });
    };
    
    const server = await createServer();
    
    // Get credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, `http://localhost:${port}`
    );
    
    // Generate auth URL
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    
    debugLog('Opening auth URL:', authUrl);
    
    // Open browser for auth
    await open(authUrl);
    
    // Handle OAuth callback
    let resolvePromise;
    const authPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    app.get('/', async (req, res) => {
      const code = req.query.code;
      res.send('Authentication successful! You can close this window.');
      
      debugLog('Got auth code from callback');
      
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        
        // Save the token
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        debugLog('Token saved to', TOKEN_PATH);
        
        server.close();
        resolvePromise(oAuth2Client);
      } catch (err) {
        debugLog('Error getting tokens:', err);
        server.close();
        throw err;
      }
    });
    
    // Return promise that resolves with auth client
    return authPromise;
  } catch (error) {
    debugLog('Authentication error:', error);
    throw error;
  }
}

// Initialize API clients
async function initClients() {
  try {
    if (!authClient) {
      authClient = await authenticate();
      debugLog('Authentication successful');
      
      // Initialize Gmail
      gmail = google.gmail({ version: 'v1', auth: authClient });
      debugLog('Gmail client initialized');
    }
    return true;
  } catch (error) {
    debugLog('Failed to initialize clients:', error);
    // Don't exit the process, just return false
    return false;
  }
}

// Gmail operations
async function searchEmails(query, maxResults = 10) {
  try {
    await initClients();
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: maxResults
    });
    
    const messages = res.data.messages || [];
    
    // Get full details for each message
    const emails = [];
    for (const message of messages.slice(0, maxResults)) {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date']
      });
      
      const headers = details.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown sender';
      const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();
      
      emails.push({
        id: message.id,
        subject,
        from,
        date,
        snippet: details.data.snippet || ''
      });
    }
    
    return emails;
  } catch (error) {
    debugLog('Error searching emails:', error);
    throw error;
  }
}

async function readEmail(messageId) {
  try {
    await initClients();
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });
    
    const message = res.data;
    const headers = message.payload.headers;
    
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown sender';
    const to = headers.find(h => h.name === 'To')?.value || 'me';
    const date = headers.find(h => h.name === 'Date')?.value || new Date().toISOString();
    
    // Extract body
    let body = '';
    const parts = message.payload.parts || [];
    
    function extractTextParts(part) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf8');
      } else if (part.parts && part.parts.length) {
        part.parts.forEach(extractTextParts);
      }
    }
    
    if (message.payload.body && message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf8');
    } else if (parts.length) {
      parts.forEach(extractTextParts);
    }
    
    return {
      id: messageId,
      subject,
      from,
      to: to.split(','),
      date,
      body
    };
  } catch (error) {
    debugLog('Error reading email:', error);
    throw error;
  }
}

async function sendEmail(to, subject, body, cc = [], bcc = []) {
  try {
    await initClients();
    
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: me`,
      `To: ${to.join(', ')}`,
      cc.length ? `Cc: ${cc.join(', ')}` : '',
      bcc.length ? `Bcc: ${bcc.join(', ')}` : '',
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      body,
    ].filter(Boolean);
    
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    return res.data;
  } catch (error) {
    debugLog('Error sending email:', error);
    throw error;
  }
}

// Handle MCP requests
rl.on('line', async (line) => {
  try {
    debugLog('Received request:', line);
    const request = JSON.parse(line);
    
    if (request.method === 'initialize') {
      // Handle initialization
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'gmail',
            version: '1.0.0',
            capabilities: {
              tools: {}
            }
          }
        }
      };
      debugLog('Sending response:', JSON.stringify(response));
      console.log(JSON.stringify(response));
      
      // Initialize clients in background
      initClients().catch(err => debugLog('Background initialization error:', err));
    }
    else if (request.method === 'notifications/initialized') {
      // No response needed for notifications
      debugLog('Received notification, no response needed');
    }
    else if (request.method === 'tools/list') {
      // List available tools
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: [
            {
              name: 'send_email',
              description: 'Sends a new email',
              inputSchema: {
                type: 'object',
                properties: {
                  to: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of recipient email addresses'
                  },
                  subject: {
                    type: 'string',
                    description: 'Email subject'
                  },
                  body: {
                    type: 'string',
                    description: 'Email body content'
                  },
                  cc: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of CC recipients'
                  },
                  bcc: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of BCC recipients'
                  }
                },
                required: ['to', 'subject', 'body'],
                additionalProperties: false,
                $schema: 'http://json-schema.org/draft-07/schema#'
              }
            },
            {
              name: 'search_emails',
              description: 'Searches for emails using Gmail search syntax',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Gmail search query (e.g., \'from:example@gmail.com\')'
                  },
                  maxResults: {
                    type: 'number',
                    description: 'Maximum number of results to return'
                  }
                },
                required: ['query'],
                additionalProperties: false,
                $schema: 'http://json-schema.org/draft-07/schema#'
              }
            },
            {
              name: 'read_email',
              description: 'Retrieves the content of a specific email',
              inputSchema: {
                type: 'object',
                properties: {
                  messageId: {
                    type: 'string',
                    description: 'ID of the email message to retrieve'
                  }
                },
                required: ['messageId'],
                additionalProperties: false,
                $schema: 'http://json-schema.org/draft-07/schema#'
              }
            }
          ]
        }
      };
      debugLog('Sending tools list response');
      console.log(JSON.stringify(response));
    }
    else if (request.method === 'tools/call') {
      const toolName = request.params.name;
      const toolArgs = request.params.arguments || {};
      
      debugLog(`Running tool: ${toolName} with args:`, JSON.stringify(toolArgs));
      
      try {
        // Gmail tools with real implementation
        if (toolName === 'search_emails') {
          const query = toolArgs.query || '';
          const maxResults = toolArgs.maxResults || 10;
          
          debugLog(`Searching emails with query: "${query}", maxResults: ${maxResults}`);
          
          // Check if authenticated first
          const isInitialized = await initClients().catch(() => false);
          
          if (!isInitialized) {
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Please authenticate Gmail access first. Type anything to continue and look for a browser window that opened for authentication.`
                  }
                ]
              }
            }));
            
            // Try to authenticate in background
            authenticate().catch(err => debugLog('Background authentication error:', err));
            return;
          }
          
          // Send an immediate response with a waiting message
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Searching for emails matching: "${query}"`
                }
              ],
              emails: [{
                id: 'searching',
                subject: 'Searching...',
                from: 'gmail@example.com',
                date: new Date().toISOString(),
                snippet: `Searching for emails matching "${query}"...`
              }]
            }
          }));
          
          // Start real search in background and send results back to Claude
          searchEmails(query, maxResults).then(emails => {
            debugLog(`Found ${emails.length} real emails matching query "${query}"`);
            
            // Send the complete email results back to Claude
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Found ${emails.length} emails matching: "${query}"`
                  }
                ],
                emails: emails
              }
            }));
          }).catch(err => {
            debugLog('Error in background search:', err);
            
            // Send error message back to Claude
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Error searching emails: ${err.message}`
                  }
                ],
                emails: []
              }
            }));
          });
        }
        else if (toolName === 'read_email') {
          const messageId = toolArgs.messageId;
          
          debugLog(`Reading email with ID: ${messageId}`);
          
          // Check if authenticated first
          const isInitialized = await initClients().catch(() => false);
          
          if (!isInitialized) {
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Please authenticate Gmail access first. Type anything to continue and look for a browser window that opened for authentication.`
                  }
                ]
              }
            }));
            
            // Try to authenticate in background
            authenticate().catch(err => debugLog('Background authentication error:', err));
            return;
          }
          
          // Send an immediate response while we fetch the email
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Retrieving email with ID: ${messageId}`
                }
              ],
              email: {
                id: messageId,
                subject: 'Loading...',
                from: 'Loading...',
                to: ['Loading...'],
                date: new Date().toISOString(),
                body: 'Loading email content...'
              }
            }
          }));
          
          // Fetch the real email in background
          readEmail(messageId).then(email => {
            debugLog(`Successfully retrieved email: ${email.subject}`);
            
            // Send the complete email back to Claude
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Email retrieved: ${email.subject}`
                  }
                ],
                email: email
              }
            }));
          }).catch(err => {
            debugLog(`Error reading email: ${err.message}`);
            
            // Send error message back to Claude
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Error retrieving email: ${err.message}`
                  }
                ],
                email: {
                  id: messageId,
                  subject: 'Error',
                  from: 'Error',
                  to: ['Error'],
                  date: new Date().toISOString(),
                  body: `Error retrieving email: ${err.message}`
                }
              }
            }));
          });
        }
        else if (toolName === 'send_email') {
          const to = toolArgs.to || [];
          const subject = toolArgs.subject || '';
          const body = toolArgs.body || '';
          const cc = toolArgs.cc || [];
          const bcc = toolArgs.bcc || [];
          
          debugLog(`Sending email to: ${to.join(', ')}, subject: ${subject}`);
          
          // Check if authenticated first
          const isInitialized = await initClients().catch(() => false);
          
          if (!isInitialized) {
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Please authenticate Gmail access first. Type anything to continue and look for a browser window that opened for authentication.`
                  }
                ]
              }
            }));
            
            // Try to authenticate in background
            authenticate().catch(err => debugLog('Background authentication error:', err));
            return;
          }
          
          // Send an initial response
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Sending email to ${to.join(', ')}`
                }
              ]
            }
          }));
          
          // Send the actual email in background
          sendEmail(to, subject, body, cc, bcc).then(result => {
            debugLog(`Email sent successfully with ID: ${result.id || 'unknown'}`);
            
            // Send success message back to Claude
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Email sent successfully to ${to.join(', ')}`
                  }
                ],
                messageId: result.id || 'unknown'
              }
            }));
          }).catch(err => {
            debugLog(`Error sending email: ${err.message}`);
            
            // Send error message back to Claude
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `Error sending email: ${err.message}`
                  }
                ],
                error: err.message
              }
            }));
          });
        }
        else {
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Unknown tool: ${toolName}`
            }
          }));
        }
      } catch (error) {
        debugLog(`Error running tool ${toolName}:`, error);
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32000,
            message: `Error running tool: ${error.message}`
          }
        }));
      }
    }
    else if (request.method === 'shutdown') {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: {}
      }));
      process.exit(0);
    }
    else {
      debugLog(`Method not found: ${request.method}`);
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found`
        }
      }));
    }
  } catch (error) {
    debugLog('Error processing request:', error);
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error'
      }
    }));
  }
});

// Handle process signals
process.on('SIGINT', () => {
  process.exit(0);
});

// Log when server starts
debugLog('Gmail MCP server with real API integration started and ready to process requests');