# Firebase Authentication with Dynamic Roles - Admin App

This Next.js application implements Firebase Authentication with Firestore for user management and dynamic role-based access control. The system supports login-only authentication (no sign-up) with advanced role management capabilities.

## Features

- 🔐 **Firebase Authentication** - Secure login-only authentication
- 🛡️ **Dynamic Role System** - Flexible role and permission management
- 📊 **Firestore Integration** - Real-time data synchronization
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Route Protection** - Auth guards with permission-based access control

## Prerequisites

- Node.js 18+ 
- Firebase project with Authentication and Firestore enabled
- Firebase Admin SDK (for server-side operations if needed)

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
   - Disable "Allow new users to sign up" (login-only mode)
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)

### 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Get your Firebase configuration from Project Settings > General > Your apps
3. Update `.env.local` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### 3. Firestore Security Rules

Update your Firestore security rules to support the role system:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Roles and permissions - admin only
    match /roles/{roleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/userRoles/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.roleId in ['super-admin-role-id'];
    }
    
    match /permissions/{permissionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/userRoles/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.roleId in ['super-admin-role-id'];
    }
    
    // User roles - admin can assign/remove
    match /userRoles/{userRoleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/userRoles/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/userRoles/$(request.auth.uid)).data.roleId in ['super-admin-role-id', 'admin-role-id'];
    }
  }
}
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Development Setup

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## User Management

### Creating Initial Admin Users

Since this is a login-only system, you'll need to create users through the Firebase Console:

1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password
4. The user will be created and can log in

### Setting Up Roles

The system automatically creates default roles and permissions on first login:

**Default Roles:**
- **Super Admin** - Full system access
- **Admin** - Administrative access (limited role management)
- **Moderator** - Content management access
- **Viewer** - Read-only access

**Default Permissions:**
- `users:read`, `users:write`, `users:delete`, `users:manage`
- `analytics:read`, `analytics:write`, `analytics:manage`
- `roles:read`, `roles:write`, `roles:delete`, `roles:manage`

### Assigning Roles

1. Log in as a Super Admin
2. Go to Roles Management page
3. Create custom roles or modify existing ones
4. Assign roles to users through the user management interface

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── roles/        # Role management page
│   │   └── ...
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui components
│   ├── auth-guard.tsx   # Route protection
│   ├── roles-management.tsx # Role management UI
│   └── sidebar.tsx      # Navigation sidebar
├── config/              # Configuration files
│   └── firebase.ts      # Firebase setup
├── stores/              # State management
│   └── firebase-auth-store.ts # Auth & roles store
└── types/               # TypeScript definitions
    └── auth.ts          # Auth & role types
```

## Usage Examples

### Protecting Routes with Permissions

```tsx
import { AuthGuard } from "@/components/auth-guard";

export default function AdminPage() {
  return (
    <AuthGuard requiredPermission={{ resource: 'users', action: 'manage' }}>
      <div>Admin content here</div>
    </AuthGuard>
  );
}
```

### Checking Permissions in Components

```tsx
import { useFirebaseAuthStore } from "@/stores/firebase-auth-store";

export default function MyComponent() {
  const { hasPermission, hasRole } = useFirebaseAuthStore();
  
  return (
    <div>
      {hasPermission('users', 'read') && (
        <button>View Users</button>
      )}
      {hasRole('Super Admin') && (
        <button>Admin Actions</button>
      )}
    </div>
  );
}
```

### Creating Custom Roles

```tsx
const { createRole } = useFirebaseAuthStore();

await createRole({
  name: 'Content Manager',
  description: 'Manages content and publications',
  permissions: ['iq-tests:read', 'iq-tests:write', 'analytics:read']
});
```

## Development

### Firebase Emulators (Optional)

For local development, you can use Firebase emulators:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize emulators: `firebase init emulators`
3. Start emulators: `firebase emulators:start`
4. Update `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
   NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
   ```

### Building for Production

```bash
npm run build
npm start
```

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Firestore Rules**: Implement proper security rules for production
3. **User Creation**: Only create users through Firebase Console or Admin SDK
4. **Role Validation**: Always validate permissions on both client and server side
5. **Token Management**: Firebase handles token refresh automatically

## Troubleshooting

### Common Issues

1. **Firebase Config Error**: Ensure all environment variables are set correctly
2. **Permission Denied**: Check Firestore security rules
3. **Role Not Loading**: Verify user has proper roles assigned in Firestore
4. **Login Fails**: Check if user exists in Firebase Authentication

### Debug Mode

Enable debug logging by adding to your environment:
```env
NEXT_PUBLIC_FIREBASE_DEBUG=true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
