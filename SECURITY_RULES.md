# Firestore Security Rules Documentation

This document explains the comprehensive security rules implemented for the Turbofy Task Manager application, which provide role-based access control and team membership restrictions.

## Overview

The security rules implement a multi-layered access control system based on:
- **User Authentication** - All operations require authentication
- **User Roles** - `admin` and `member` roles with different privileges
- **Team Membership** - Access controlled by team membership
- **Resource Ownership** - Users have special permissions for resources they own

## User Roles

### Admin Role
- **Full System Access** - Can read/write any document in any collection
- **User Management** - Can update user profiles and change user roles
- **Team Management** - Can manage any team regardless of membership
- **Task Management** - Can read/write any task
- **System Administration** - Access to system-level collections

### Member Role (Default)
- **Personal Resources** - Full control over their own resources
- **Team Resources** - Limited access based on team membership
- **Role Restrictions** - Cannot change user roles or access admin functions

## Collection Access Patterns

### Users Collection (`/users/{userId}`)

#### Read Access
- ✅ **Own Profile**: Users can always read their own profile
- ✅ **Admin Access**: Admins can read any user profile
- ✅ **Team Members**: Can read basic info of users who share team membership
- ❌ **Inactive Users**: Cannot read profiles of inactive users

#### Write Access
- ✅ **Own Profile**: Users can update their own profile (except role)
- ✅ **Admin Access**: Admins can update any user profile
- ✅ **Role Changes**: Only admins can change user roles
- ❌ **User Deletion**: Only admins can delete user accounts

### Teams Collection (`/teams/{teamId}`)

#### Read Access
- ✅ **Team Members**: All team members can read team information
- ✅ **Public Teams**: Any active user can read public teams
- ✅ **Admin Access**: Admins can read any team

#### Write Access
- ✅ **Team Creation**: Any active user can create teams (becomes owner)
- ✅ **Team Management**: Only team owners and admins can fully manage teams
- ✅ **Leave Team**: Members can remove themselves (except owners)
- ❌ **Owner Restrictions**: Team owners cannot leave their own teams

#### Special Rules
- Team owners must be included in `memberIds`
- Only owners and admins can delete teams
- Public/private settings control visibility

### Team Invitations Collection (`/team_invitations/{invitationId}`)

#### Read Access
- ✅ **Invited Users**: Can read invitations sent to their email
- ✅ **Admin Access**: Admins can read all invitations
- ✅ **Team Managers**: Team owners can read their team's invitations

#### Write Access
- ✅ **Create Invitations**: Team owners, admins, or members (if allowed)
- ✅ **Accept/Decline**: Users can respond to their own invitations
- ✅ **Manage Invitations**: Team owners and admins can update/delete
- ❌ **Expired Invitations**: Cannot create invitations with past expiry dates

### Tasks Collection (`/tasks/{taskId}`)

#### Read Access
- ✅ **Task Creators**: Can always read tasks they created
- ✅ **Assigned Users**: Can read tasks assigned to them
- ✅ **Team Members**: Can read team tasks (if team member)
- ✅ **Admin Access**: Admins can read any task

#### Write Access
- ✅ **Task Creators**: Full control over their created tasks
- ✅ **Assigned Users**: Limited updates (status, comments, order)
- ✅ **Team Members**: Limited updates to team tasks
- ✅ **Team Owners**: Full control over team tasks
- ✅ **Admin Access**: Full control over any task

#### Creation Rules
- Personal tasks (no `teamId`) - creator only needs to be active
- Team tasks - creator must be team member
- Task assignment - assignee must be team member (for team tasks)

#### Update Restrictions
- **Regular Members**: Can only update `status`, `assignedTo`, `comments`, `order`
- **Task Creators**: Can update any field
- **Team Owners/Admins**: Can update any field

#### Deletion Rules
- Task creators can delete their tasks
- Team owners can delete team tasks
- Admins can delete any task

## Helper Functions

The security rules include several helper functions for cleaner code:

```javascript
// User validation
isActiveUser(userId)     // Check if user exists and is active
getUserRole(userId)      // Get user's role
isAdmin(userId)         // Check if user is admin

// Team access
isTeamMember(userId, teamId)    // Check team membership
isTeamOwner(userId, teamId)     // Check team ownership
canManageTeam(userId, teamId)   // Check management permissions
canAccessTeam(userId, teamId)   // Check access permissions
canInviteToTeam(userId, teamId) // Check invitation permissions
```

## Access Control Matrix

| Action | Own Resource | Team Resource | Any Resource |
|--------|-------------|---------------|--------------|
| **Member** | ✅ Full | 🔒 Limited | ❌ None |
| **Team Owner** | ✅ Full | ✅ Full | ❌ None |
| **Admin** | ✅ Full | ✅ Full | ✅ Full |

## Security Best Practices

### 1. **Principle of Least Privilege**
- Users only get minimum necessary permissions
- Role-based escalation for additional privileges
- Team membership controls resource access

### 2. **Data Validation**
- All writes validate data integrity
- Field-level restrictions prevent unauthorized changes
- Referential integrity checks for relationships

### 3. **Audit Trail**
- All operations are logged by Firestore
- Admin actions are trackable
- Team membership changes are recorded

### 4. **Defense in Depth**
- Multiple validation layers
- Client-side and server-side validation
- Authentication + authorization checks

## Common Use Cases

### Creating a Team Task
```javascript
// User must be:
// 1. Authenticated
// 2. Active user
// 3. Team member
// 4. Assignee must also be team member (if specified)
```

### Updating Task Status
```javascript
// Allowed for:
// - Task creator (any field)
// - Assigned user (limited fields)
// - Team members (limited fields)
// - Team owners (any field)
// - Admins (any field)
```

### Team Invitations
```javascript
// Can invite if:
// - Team owner
// - Admin
// - Team member AND team.settings.allowMemberInvites == true
```

## Deployment

Deploy the security rules using Firebase CLI:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules

# Test rules (optional)
firebase emulators:start --only firestore
```

## Testing Security Rules

Use Firebase Security Rules Unit Testing:

```bash
npm install --save-dev @firebase/rules-unit-testing
```

Example test structure:
```javascript
// Test admin access
// Test team member access  
// Test unauthorized access
// Test role changes
// Test team membership changes
```

## Monitoring and Maintenance

### Regular Audits
- Review user roles quarterly
- Check team memberships for inactive users
- Monitor failed authentication attempts

### Performance Considerations
- Rules are evaluated on every request
- Complex nested queries may impact performance
- Consider denormalizing data for better rule performance

### Updates and Changes
- Test rule changes in Firebase emulator
- Deploy to staging environment first
- Monitor error logs after deployment
- Have rollback plan ready

## Troubleshooting

### Common Permission Errors
1. **"Missing or insufficient permissions"**
   - Check user authentication status
   - Verify user role and team membership
   - Confirm resource ownership

2. **"Document doesn't exist"**
   - Verify document IDs are correct
   - Check if referenced documents exist
   - Ensure proper data creation order

3. **"Invalid argument"**
   - Validate data types match schema
   - Check required fields are present
   - Verify field naming consistency

### Debug Tips
- Use Firebase Console Rules Playground
- Enable debug logging in development
- Test with different user roles and scenarios
- Use emulator for safe testing
