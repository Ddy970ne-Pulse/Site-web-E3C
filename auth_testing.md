# Auth Testing Playbook — E3C Google OAuth

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('e3c_db');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  id: userId,
  email: 'test.oauth.' + Date.now() + '@example.com',
  name: 'Test OAuth User',
  role: 'client',
  phone: '',
  password_hash: null,
  created_at: new Date()
});
print('User ID: ' + userId);
"
```

## Step 2: Test Backend API
```bash
# Test auth endpoint with session token in cookie
curl -X GET "https://your-app.com/api/auth/me" -b "access_token=YOUR_JWT"

# Test Google session endpoint
curl -X POST "https://your-app.com/api/auth/google/session" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test_session_id"}'
```

## Step 3: Browser Testing
```python
# Set JWT cookie and navigate
await page.context.add_cookies([{
    "name": "access_token",
    "value": "YOUR_JWT_TOKEN",
    "domain": "your-app.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "Lax"
}])
await page.goto("https://your-app.com/espace-client")
```

## Checklist
- [ ] User document has `id` field (custom UUID)
- [ ] `password_hash` is `None` for OAuth users
- [ ] After Google OAuth, JWT cookie is set and `/api/auth/me` works
- [ ] Dashboard loads without redirect for authenticated client
- [ ] Google button appears on Login and Register pages
- [ ] Admins CANNOT login via Google (403 response)

## Credentials
- Google test account: any valid Gmail address
- Admin (email/password only): admin@e3c-construction.com / E3C@Admin2026
- Client (email/password): test_client_a8449c@example.com / Test@1234
