# Admin Testing Guide

## 🔐 Auto-Login Configuration

You are now automatically logged in as **Admin User** in development mode.

### Admin Credentials
- **Email**: admin@impactflow.com
- **Password**: password (if manual login needed)
- **Role**: Admin
- **Auto-login**: Enabled in development

### Admin Capabilities

As an admin, you have full access to:

#### 1. **User Management** (`/admin/users`)
- View all users
- Create new users
- Edit user profiles
- Change user roles
- Delete users
- Reset passwords

#### 2. **Project Management**
- Create/edit/delete all projects
- Access all project data
- Override project settings
- Manage project teams

#### 3. **Task Management**
- Full CRUD on all tasks
- Assign tasks to any user
- Access all task details
- Bulk operations

#### 4. **Reports & Analytics**
- View all reports
- Access system-wide analytics
- Export all data
- Create custom reports

#### 5. **System Settings**
- Configure system-wide settings
- Manage integrations
- Set up workflows
- Configure notifications

#### 6. **Permissions**
- All resources: `read`, `create`, `update`, `delete`
- All scopes: `all` (system-wide access)
- Special permissions: `manage_users`, `manage_roles`, `system_settings`

### Testing Admin Features

1. **Verify Admin Access**:
   - Look for the yellow dev banner at the top showing "Admin User (Admin)"
   - Try accessing `/admin/users` - you should have full access
   - Check that all action buttons are enabled (no lock icons)

2. **Test Permission Gates**:
   - All "New", "Edit", "Delete" buttons should be visible
   - No "Permission Denied" messages
   - All sections and features accessible

3. **Test Bulk Operations**:
   - Select multiple tasks
   - All bulk action buttons should be available
   - Can assign tasks to anyone

### Quick Links for Admin Testing

- [User Management](/admin/users)
- [Projects Dashboard](/)
- [Inbox](/inbox)
- [Settings](/settings)
- [Notification Settings](/settings/notifications)

### Disable Auto-Login

To disable auto-login, either:
1. Delete or rename `.env.local`
2. Set `NEXT_PUBLIC_AUTO_LOGIN=false` in `.env.local`
3. Clear localStorage: `localStorage.removeItem('impactflow_auth')`

### Other Test Users

You can also manually login as:
- **Project Manager**: pm@impactflow.com / password
- **Team Lead**: lead@impactflow.com / password
- **Developer**: dev@impactflow.com / password
- **Viewer**: viewer@impactflow.com / password