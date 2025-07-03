# Real-Time Features Setup Guide

This guide explains how to set up and use the real-time collaboration features in ImpactFlow Pro.

## Features Implemented

### 1. **Live Task Updates**
- Tasks are synchronized in real-time across all connected users
- Create, update, and delete operations are instantly reflected
- No need to refresh to see changes made by team members

### 2. **Real-Time Approval Status**
- Approval requests appear instantly for approvers
- Status changes (approved/rejected) are broadcast to all users
- Comments on approvals sync in real-time

### 3. **Live Team Member Status**
- See who's online in real-time
- Online indicators show active team members
- "Last seen" timestamps for offline users

### 4. **Instant Comment Notifications**
- Comments appear instantly without refresh
- Desktop notifications for mentions and updates
- Persistent notification center

### 5. **Collaborative Cursor Tracking**
- See where other users are working in the report builder
- Colored cursors show each user's position
- Names appear next to cursors for identification

### 6. **Real-Time Dashboard Metrics**
- Project health score updates live
- Task completion metrics sync automatically
- "Live" indicator shows real-time data

### 7. **"Someone is Editing" Indicators**
- See when someone else is editing a task
- Tasks being edited are highlighted
- Edit button disabled with tooltip showing who's editing

## Setup Instructions

### 1. Install Dependencies
The Socket.io dependencies are already installed:
```bash
npm install
```

### 2. Start the Socket.io Server

#### Development Mode:
```bash
npm run dev:socket
```

#### Production Mode:
```bash
npm run start:socket
```

### 3. Environment Variables

Create a `.env.local` file with:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, update these to your actual domain.

## How It Works

### Socket.io Server
- Located in `server.js`
- Handles WebSocket connections
- Manages room-based communication for projects
- Tracks online users and editing sessions

### Client Integration
- `useSocket` hook manages the connection
- `useRealtimeUpdates` hook syncs data
- Components automatically update when data changes

### Key Components Updated

1. **TaskList** (`src/components/tasks/TaskList.tsx`)
   - Shows editing indicators
   - Real-time task updates
   - Online user avatars

2. **TeamCollaboration** (`src/components/team/TeamCollaboration.tsx`)
   - Live online/offline status
   - Real-time approval updates
   - Instant comment notifications

3. **ReportBuilder** (`src/components/reports/ReportBuilder.tsx`)
   - Collaborative cursor tracking
   - Shows who's collaborating
   - Real-time widget updates

4. **ProjectPulse** (`src/components/dashboard/ProjectPulse.tsx`)
   - Live metrics updates
   - "Live" indicator when connected

5. **NotificationCenter** (`src/components/notifications/NotificationCenter.tsx`)
   - Real-time notifications
   - Persistent storage
   - Unread count badge

## Usage Examples

### Emitting Updates

```typescript
import { emitTaskUpdate, emitTaskCreate, emitTaskDelete } from '@/lib/socket'

// Create a task
emitTaskCreate(newTask)

// Update a task
emitTaskUpdate(taskId, updates)

// Delete a task
emitTaskDelete(taskId)
```

### Listening for Updates

```typescript
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'

const { onlineUsers, editingSessions, notifications } = useRealtimeUpdates({
  projectId: 'project-123',
  user: currentUser,
})
```

### Managing Connections

```typescript
import { useSocket } from '@/hooks/useSocket'

const { socket, isConnected, connect, disconnect } = useSocket({
  projectId: 'project-123',
  user: currentUser,
  autoConnect: true,
})
```

## Troubleshooting

### Connection Issues
1. Check if Socket.io server is running
2. Verify environment variables are set
3. Check browser console for errors
4. Ensure port 3000 is not blocked

### Real-Time Updates Not Working
1. Verify you're using the socket server (`npm run dev:socket`)
2. Check network tab for WebSocket connections
3. Look for the green "Connected" indicator
4. Check if other users see your updates

### Performance Optimization
- Cursor movements are throttled to 50ms
- Updates use volatile events when appropriate
- Automatic cleanup of inactive sessions
- Efficient room-based broadcasting

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ Socket.io    │────▶│   Server    │
│  (Next.js)  │◀────│   Server     │◀────│  (Node.js)  │
└─────────────┘     └──────────────┘     └─────────────┘
      │                                          │
      └──────────────────────────────────────────┘
                  WebSocket Connection
```

## Security Considerations

1. **Authentication**: Currently using mock authentication. In production:
   - Implement JWT token verification
   - Validate user permissions per project
   - Secure WebSocket connections with WSS

2. **Authorization**: Add checks for:
   - Project membership
   - Role-based permissions
   - Task ownership

3. **Rate Limiting**: Consider adding:
   - Connection limits per IP
   - Message rate limiting
   - Cursor update throttling

## Next Steps

1. Add database persistence for:
   - Online user tracking
   - Notification history
   - Editing session recovery

2. Implement advanced features:
   - Presence awareness (typing indicators)
   - Conflict resolution for simultaneous edits
   - Offline support with sync

3. Scale for production:
   - Redis adapter for multiple servers
   - Horizontal scaling support
   - Load balancing

## Testing Real-Time Features

1. Open the app in multiple browser windows
2. Log in as different users (change mockCurrentUser)
3. Join the same project
4. Try these scenarios:
   - Create/edit/delete tasks
   - Move cursors in report builder
   - Send comments on approvals
   - Go offline/online

The real-time features should sync instantly across all windows!