# Role Update Fix Test

## Problem Description
Previously, when a user's role was updated from 'member' to 'admin' in Firestore, the role would be reset back to 'member' when the user logged in again.

## Root Cause
The issue occurred in the `AuthContext.tsx` file where:
1. The `onAuthStateChanged` listener would fire during login
2. It would call `createUserProfile` with a hardcoded `role: 'member'` value
3. This would overwrite the existing role in Firestore

## Fix Applied
1. **Modified AuthContext.tsx**:
   - Removed hardcoded `role: 'member'` from the `useEffect` hook
   - Removed hardcoded `role: 'member'` from the `loginWithGoogle` function
   - Only set the role during initial signup

2. **Modified userService.ts**:
   - Updated `createUserProfile` to check if user already exists
   - If user exists: only update basic fields (email, displayName, photoURL) without touching the role
   - If user is new: create full profile with default role

## How to Test the Fix

### Step 1: Create a test user
1. Sign up a new user through the app
2. Verify the user has 'member' role in Firestore

### Step 2: Update role manually
1. Go to Firebase Console > Firestore Database
2. Find the user document in the 'users' collection
3. Update the `role` field from 'member' to 'admin'

### Step 3: Test login persistence
1. Log out from the application
2. Log back in with the same user credentials
3. Check the user document in Firestore
4. **The role should still be 'admin' (previously it would reset to 'member')**

### Step 4: Verify new user creation still works
1. Sign up a completely new user
2. Verify the new user gets the default 'member' role
3. This ensures we didn't break new user creation

## Technical Details

### Before Fix:
```javascript
// This would always overwrite the role to 'member'
await createUserProfile(user.uid, {
  email: user.email || '',
  displayName: user.displayName || '',
  photoURL: user.photoURL,
  role: 'member'  // ❌ This was the problem
});
```

### After Fix:
```javascript
// Only updates basic fields for existing users
if (existingDoc.exists()) {
  const updateData = {
    email: userData.email || existingDoc.data().email,
    displayName: userData.displayName || existingDoc.data().displayName,
    photoURL: userData.photoURL || existingDoc.data().photoURL,
    updatedAt: Timestamp.fromDate(new Date())
    // ✅ Role is not touched for existing users
  };
  await updateDoc(docRef, updateData);
}
```

## Security Considerations
- The Firestore security rules still prevent non-admin users from changing roles
- Only users with admin privileges can modify the role field
- This fix only prevents the application from accidentally overwriting roles during login

## Additional Notes
- The fix preserves all existing functionality
- New user registration still works normally
- Google login also preserves existing roles
- The `updateUserProfile` function can still be used by admins to change roles
