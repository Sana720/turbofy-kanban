# Turbofy Task Manager

A powerful task management application built with Next.js, TypeScript, Firebase, and drag & drop functionality.

## Features

- 🔐 **Firebase Authentication** - Email/password and Google sign-in
- 🗄️ **Firestore Database** - Real-time data synchronization
- 🎨 **Tailwind CSS** - Modern and responsive UI
- 🖱️ **Drag & Drop** - Reorder tasks with @dnd-kit
- ⚡ **TypeScript** - Type-safe development
- 🚀 **Next.js 15** - Latest React features with App Router

## Getting Started

### Prerequisites

- Node.js 18.18.0 or later
- npm or yarn package manager
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd turbofy-task-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password and Google providers)
   - Enable Firestore Database
   - Get your Firebase config from Project Settings

4. Create environment file:
```bash
cp .env.local.example .env.local
```

5. Fill in your Firebase configuration in `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) to see the application.

## Firebase Setup Details

### Authentication
- Email/password authentication
- Google OAuth integration
- User profile management

### Firestore Database
- Real-time task synchronization
- User-specific task collections
- Optimistic updates for better UX

### Firestore Collections

The application uses three main Firestore collections:

#### **Users Collection** (`/users/{userId}`)
- **Fields:** `email`, `displayName`, `photoURL`, `role`, `teamIds`, `isActive`, `createdAt`, `updatedAt`, `lastLoginAt`
- **Purpose:** Store user profiles and team memberships

#### **Teams Collection** (`/teams/{teamId}`)
- **Fields:** `name`, `description`, `ownerId`, `memberIds`, `isActive`, `settings`, `createdAt`, `updatedAt`
- **Purpose:** Manage team information and memberships

#### **Tasks Collection** (`/tasks/{taskId}`)
- **Fields:** `title`, `description`, `priority`, `status`, `dueDate`, `createdBy`, `assignedTo`, `teamId`, `order`, `tags`, `attachments`, `comments`, `createdAt`, `updatedAt`
- **Priority levels:** `low`, `medium`, `high`, `urgent`
- **Status options:** `todo`, `in-progress`, `review`, `completed`, `cancelled`

#### **Team Invitations Collection** (`/team_invitations/{invitationId}`)
- **Fields:** `teamId`, `invitedEmail`, `invitedBy`, `status`, `createdAt`, `expiresAt`
- **Purpose:** Handle team invitation workflow

### Security Rules
The project includes comprehensive **role-based and team membership** Firestore security rules in `firestore.rules`. 

**🔐 Security Features:**
- **Role-Based Access Control** - Admin and Member roles with different privileges
- **Team Membership Restrictions** - Access controlled by team membership
- **Granular Permissions** - Field-level access control for different user types
- **Resource Ownership** - Users have special permissions for their own resources
- **Data Validation** - Prevents unauthorized data changes and maintains integrity

**👥 User Roles:**
- **Admin**: Full system access, can manage any resource
- **Member**: Limited to own resources and team-based access

**🛡️ Access Control Matrix:**
| User Type | Own Resources | Team Resources | Any Resource |
|-----------|---------------|----------------|--------------|
| Member | ✅ Full Access | 🔒 Limited Access | ❌ No Access |
| Team Owner | ✅ Full Access | ✅ Full Access | ❌ No Access |
| Admin | ✅ Full Access | ✅ Full Access | ✅ Full Access |

**Deploy Security Rules:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules

# Test rules locally (optional)
firebase emulators:start --only firestore
```

**📚 Detailed Documentation:**
See `SECURITY_RULES.md` for comprehensive documentation including:
- Detailed access patterns for each collection
- Security best practices
- Troubleshooting guide
- Testing strategies

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── contexts/           # React contexts (Auth)
├── lib/               # Firebase configuration
├── services/          # API services (Firestore)
└── types/             # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Firebase** - Backend as a Service
  - Authentication
  - Firestore Database
- **Tailwind CSS** - Utility-first CSS framework
- **@dnd-kit** - Modern drag and drop toolkit
- **React 19** - Latest React features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
