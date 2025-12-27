# Clerk Authentication Troubleshooting

## White Page / "Rendering..." Issue

If you're seeing a white page when trying to sign in, follow these steps:

### Step 1: Verify Clerk Dashboard Configuration

1. Go to: https://dashboard.clerk.com
2. Select your application
3. Go to **"Paths"** in the left sidebar
4. Make sure these paths are configured:
   - Sign-in path: `/auth/sign-in`
   - Sign-up path: `/auth/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

### Step 2: Check Redirect URLs

1. In Clerk Dashboard, go to **"Paths"** → **"Redirect URLs"**
2. Add these URLs:
   - `http://localhost:3000`
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/sign-in`
   - `http://localhost:3000/auth/sign-up`

### Step 3: Verify Environment Variables

Make sure your `.env` file has:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_d2lzZS1tdWRmaXNoLTk1LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_Q40jGv2qB7tBWQc4AqII1Bf0wSO0eY35tD5whsHQJM
```

**Important:** Make sure there are no extra spaces or characters at the end of the keys.

### Step 4: Restart Dev Server

After making changes:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for any errors related to Clerk
4. Common errors:
   - "Clerk: Invalid publishable key" → Check your key in Clerk dashboard
   - "CORS error" → Add localhost to allowed origins in Clerk
   - "Network error" → Check your internet connection

### Step 6: Verify Clerk Keys

1. Go to Clerk Dashboard → **API Keys**
2. Make sure you're using the **Test** keys (not Production)
3. Copy the keys exactly as shown (no extra characters)

### Common Fixes

**Issue: White page with "Rendering..."**
- Solution: Check Clerk dashboard redirect URLs
- Solution: Verify publishable key is correct
- Solution: Clear browser cache and restart server

**Issue: "Invalid publishable key"**
- Solution: Copy the key directly from Clerk dashboard
- Solution: Make sure there are no spaces or line breaks

**Issue: Redirect loop**
- Solution: Check middleware.ts routes
- Solution: Verify afterSignInUrl in SignIn component

### Quick Test

1. Open http://localhost:3000
2. Click "Sign In"
3. You should see Clerk's sign-in form
4. If you see a white page, check the browser console for errors

### Still Not Working?

1. Check Clerk Dashboard → **Logs** for any errors
2. Verify your Clerk application is in "Development" mode
3. Make sure you're using test keys (pk_test_... and sk_test_...)
4. Try creating a new Clerk application if keys are invalid

