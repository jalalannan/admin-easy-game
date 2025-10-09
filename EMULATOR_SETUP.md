# Firebase Emulator Setup

This project includes Firebase emulator configuration for local development. The emulators allow you to test Firebase Authentication and Firestore locally without affecting your production data.

## Prerequisites

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase project** (if not already done):
   ```bash
   firebase init
   ```
   - Select Firestore and Authentication
   - Use existing project or create new one

## Available Scripts

### Development with Emulators
```bash
# Run Firebase emulators + Next.js dev server together
npm run dev:emulator
```

### Individual Commands
```bash
# Start only Firebase emulators
npm run emulators

# Start only Firebase UI
npm run emulators:ui

# Start Next.js dev server (normal development)
npm run dev
```

### Firebase Deployment
```bash
# Deploy everything to Firebase
npm run firebase:deploy

# Deploy only Firestore rules
npm run firebase:deploy:rules

# Deploy only Firestore indexes
npm run firebase:deploy:indexes
```

## Emulator Configuration

The emulators are configured in `firebase.json`:

- **Auth Emulator**: `localhost:9099`
- **Firestore Emulator**: `localhost:8080`
- **Firebase UI**: `localhost:4000`

## Environment Setup

### For Local Development with Emulators

Create `.env.local`:
```env
# Your Firebase project configuration (same as production)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Enable emulators for local development
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

### For Production Development

Create `.env.local`:
```env
# Your Firebase project configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Don't set this or set to false for production Firestore
# NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

## Using the Emulators

### 1. Start Emulators
```bash
npm run dev:emulator
```

This will start:
- Firebase Auth Emulator (port 9099)
- Firestore Emulator (port 8080)
- Firebase UI (port 4000)
- Next.js dev server (port 3000)

### 2. Access Firebase UI
Open `http://localhost:4000` to:
- View Firestore data
- Manage Authentication users
- Monitor emulator logs
- Test security rules

### 3. Create Test Users
In the Firebase UI:
1. Go to Authentication tab
2. Click "Add user"
3. Enter email and password
4. User will be created in the emulator

### 4. View Firestore Data
In the Firebase UI:
1. Go to Firestore tab
2. See collections: `permissions`, `roles`, `userRoles`
3. Data persists between emulator restarts

## Emulator Data Persistence

Emulator data is stored in:
- `firebase-debug.log` - Emulator logs
- `firebase-export-*` - Data exports (if you export)

To clear emulator data:
```bash
# Stop emulators and delete data
firebase emulators:exec --only firestore,auth "echo 'Clearing data'"
```

## Security Rules Testing

The emulators use the rules defined in `firestore.rules`. You can test rules in the Firebase UI:

1. Go to `http://localhost:4000`
2. Click "Rules playground"
3. Test different scenarios

## Troubleshooting

### Port Conflicts
If ports are already in use:
```bash
# Check what's using the ports
netstat -ano | findstr :9099
netstat -ano | findstr :8080
netstat -ano | findstr :4000
```

### Emulator Not Starting
```bash
# Check Firebase CLI version
firebase --version

# Update Firebase CLI
npm install -g firebase-tools@latest
```

### Data Not Persisting
- Emulator data persists between restarts
- To reset: stop emulators and restart
- Export data: `firebase emulators:export ./emulator-data`

## Production vs Development

| Feature | Emulator | Production |
|---------|----------|------------|
| Data Storage | Local | Firebase Cloud |
| Authentication | Local | Firebase Auth |
| Rules Testing | Yes | No |
| Data Persistence | Between restarts | Permanent |
| Performance | Fast | Network dependent |

## Best Practices

1. **Use emulators for development** - Faster iteration
2. **Test rules locally** - Before deploying to production
3. **Export emulator data** - For testing scenarios
4. **Use production for final testing** - Before going live

## Next Steps

1. Run `npm run dev:emulator`
2. Open `http://localhost:3000` (your app)
3. Open `http://localhost:4000` (Firebase UI)
4. Create test users and test your application
