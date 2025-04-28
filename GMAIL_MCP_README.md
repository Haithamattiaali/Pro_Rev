# Gmail MCP Integration for Claude

This repository contains a Model Context Protocol (MCP) server that allows Claude Desktop to interact with Gmail.

## Features

- Search emails with Gmail query syntax
- Read full email content including headers and body
- Send emails with support for CC and BCC

## Setup

1. Install dependencies:
   ```
   npm install googleapis express open
   ```

2. Create OAuth 2.0 credentials in Google Cloud Console:
   - Create a new project
   - Enable the Gmail API
   - Create OAuth 2.0 Desktop credentials
   - Download the credentials as `credentials.json`

3. Configure Claude Desktop to use the MCP server:
   - Add this to `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "gmail": {
         "command": "node",
         "args": ["/path/to/simple_gmail_mcp.js"]
       }
     }
   }
   ```

4. Run the server:
   ```
   node simple_gmail_mcp.js
   ```

5. Start Claude Desktop and authenticate with Google when prompted

## Troubleshooting

- Token issues: Delete `gmail_token.json` and reauthenticate
- Port conflicts: The server will automatically try ports 3001-3010

## Security

- OAuth credentials are stored in `credentials.json`
- Authentication tokens are stored in `gmail_token.json`
- Keep these files secure and don't commit them to public repositories