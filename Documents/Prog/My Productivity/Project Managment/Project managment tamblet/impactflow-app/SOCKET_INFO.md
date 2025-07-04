# Socket.io Configuration

## Current Setup

The application uses Socket.io for real-time features like:
- Live collaboration
- Real-time updates
- User presence
- Cursor tracking

## Development Mode

In development, Socket.io is **disabled by default** to prevent connection errors since there's no socket server running.

### To Enable Socket.io in Development:

1. **Option 1: Run a Socket Server**
   ```bash
   # In a separate terminal
   npm run socket-server
   ```

2. **Option 2: Set Socket URL**
   Add to `.env.local`:
   ```
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   ```

3. **Option 3: Show Socket Errors**
   To see socket connection errors in development:
   ```
   NEXT_PUBLIC_SHOW_SOCKET_ERRORS=true
   ```

## Production Mode

In production, Socket.io will automatically attempt to connect and show appropriate error messages if the connection fails.

## Troubleshooting

If you see "Failed to reconnect" messages:
1. This is normal in development without a socket server
2. The app will continue to work without real-time features
3. To hide these messages, ensure you're running in development mode

## Features That Work Without Socket.io

All core features work without real-time updates:
- Task management
- Project dashboard
- Team collaboration (without live updates)
- Approvals and comments
- All CRUD operations