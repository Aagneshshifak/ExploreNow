# Protected Routes & Persistent User Data - Quick Start Guide

**Status**: Ready for Implementation  
**Spec Location**: `.kiro/specs/protected-routes-user-data/`

---

## 🎯 What You're Building

A complete authentication and data persistence system where:
- ✅ Users must login to access protected features
- ✅ Each user's data is stored in the database
- ✅ Users only see their own data
- ✅ Sessions persist across page refreshes
- ✅ Bookmarks and preferences are saved permanently

---

## 📋 Implementation Checklist

### Phase 1: Database Schema ⭐ START HERE
- [ ] Create `bookmarks` table
- [ ] Create `user_preferences` table
- [ ] Update `bookings` table indexes
- [ ] Update `shared/schema.ts` with Drizzle ORM definitions

**Time**: ~30 minutes  
**Difficulty**: Easy  
**Files to Modify**: `server/db.ts`, `shared/schema.ts`

### Phase 2: Backend Bookmarks API
- [ ] GET /api/user/bookmarks
- [ ] POST /api/user/bookmarks
- [ ] DELETE /api/user/bookmarks/:id
- [ ] Write property tests

**Time**: ~1 hour  
**Difficulty**: Medium  
**Files to Modify**: `server/routes.ts`, `server/storage.ts`

### Phase 3: Backend Preferences API
- [ ] GET /api/user/preferences
- [ ] POST /api/user/preferences
- [ ] Write property tests

**Time**: ~45 minutes  
**Difficulty**: Medium  
**Files to Modify**: `server/routes.ts`, `server/storage.ts`

### Phase 4: Backend Bookings Enhancement
- [ ] Enhance GET /api/bookings (filter by userId)
- [ ] Enhance GET /api/bookings/:id (verify ownership)
- [ ] Enhance POST /api/bookings (set userId)
- [ ] Write property tests

**Time**: ~1 hour  
**Difficulty**: Medium  
**Files to Modify**: `server/routes.ts`

### Phase 5: Frontend Session Persistence
- [ ] Restore session on AuthProvider mount
- [ ] Persist session across page refresh
- [ ] Clear session on logout
- [ ] Write property tests

**Time**: ~1 hour  
**Difficulty**: Medium  
**Files to Modify**: `client/src/hooks/use-auth.tsx`

### Phase 6: Frontend Route Protection
- [ ] Enhance ProtectedRoute component
- [ ] Implement return URL redirect
- [ ] Write property tests

**Time**: ~45 minutes  
**Difficulty**: Medium  
**Files to Modify**: `client/src/components/ui/protected-route.tsx`

### Phase 7: Frontend Protected Pages
- [ ] Protect /dashboard
- [ ] Protect /bookings
- [ ] Protect /profile
- [ ] Protect booking routes

**Time**: ~30 minutes  
**Difficulty**: Easy  
**Files to Modify**: `client/src/main.tsx` (routing)

### Phase 8: Frontend Bookmarks Integration
- [ ] Create useBookmarks hook
- [ ] Update AI Assistant to use database bookmarks
- [ ] Update bookmark UI components

**Time**: ~1 hour  
**Difficulty**: Medium  
**Files to Modify**: `client/src/pages/AIAssistant.tsx`, new hook file

### Phase 9: Frontend Preferences Integration
- [ ] Create usePreferences hook
- [ ] Update Profile page
- [ ] Update Dashboard to load preferences

**Time**: ~1 hour  
**Difficulty**: Medium  
**Files to Modify**: `client/src/pages/Profile.tsx`, `client/src/pages/DashboardPage.tsx`

### Phase 10: Frontend Dashboard Enhancement
- [ ] Create useUserBookings hook
- [ ] Display bookings by status
- [ ] Add booking details modal

**Time**: ~1.5 hours  
**Difficulty**: Medium  
**Files to Modify**: `client/src/pages/DashboardPage.tsx`

### Phase 11: Integration Testing
- [ ] Test end-to-end authentication
- [ ] Test end-to-end booking flow
- [ ] Test end-to-end bookmarks flow
- [ ] Test end-to-end preferences flow
- [ ] Test route protection

**Time**: ~2 hours  
**Difficulty**: Medium  
**Files to Create**: Test files

---

## 🔑 Key Code Patterns

### Backend: Require Authentication
```typescript
app.get('/api/user/bookmarks', requireUser, async (req, res) => {
  // req.user is now available
  const userId = req.user.id;
  // ... rest of endpoint
});
```

### Backend: Verify User Ownership
```typescript
app.get('/api/bookings/:id', requireUser, async (req, res) => {
  const booking = await db.query('SELECT * FROM bookings WHERE id = ? AND userId = ?', 
    [req.params.id, req.user.id]);
  
  if (!booking) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json(booking);
});
```

### Frontend: Protect Route
```typescript
<ProtectedRoute requireAuth={true}>
  <DashboardPage />
</ProtectedRoute>
```

### Frontend: Restore Session
```typescript
useEffect(() => {
  const restoreSession = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const user = await response.json();
        setUser(user);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  };
  
  restoreSession();
}, []);
```

### Frontend: Use Custom Hook
```typescript
const { bookmarks, isLoading, addBookmark, removeBookmark } = useBookmarks();

// Display bookmarks
bookmarks.forEach(bookmark => {
  console.log(bookmark.tripTitle || bookmark.hotelName);
});

// Add bookmark
await addBookmark({ tripId: 1 });

// Remove bookmark
await removeBookmark(bookmarkId);
```

---

## 📊 Database Schema Quick Reference

### Bookmarks Table
```sql
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tripId INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  hotelId INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Preferences Table
```sql
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(3) DEFAULT 'USD',
  language VARCHAR(5) DEFAULT 'en',
  theme VARCHAR(10) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧪 Testing Quick Reference

### Property Test Example
```typescript
// Property: Users only see their own bookmarks
test('users only see their own bookmarks', async () => {
  // Create user 1 and bookmark
  const user1 = await createUser();
  const bookmark1 = await createBookmark(user1.id);
  
  // Create user 2
  const user2 = await createUser();
  
  // User 2 should not see user 1's bookmark
  const response = await fetch('/api/user/bookmarks', {
    headers: { Authorization: `Bearer ${user2.token}` }
  });
  
  const bookmarks = await response.json();
  expect(bookmarks).not.toContain(bookmark1);
});
```

### Unit Test Example
```typescript
test('bookmark creation stores in database', async () => {
  const user = await createUser();
  const trip = await createTrip();
  
  const response = await fetch('/api/user/bookmarks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${user.token}` },
    body: JSON.stringify({ tripId: trip.id })
  });
  
  expect(response.status).toBe(201);
  const bookmark = await response.json();
  expect(bookmark.userId).toBe(user.id);
  expect(bookmark.tripId).toBe(trip.id);
});
```

---

## 🚀 Execution Order

**Recommended order to avoid dependencies:**

1. **Database Schema** (Phase 1) - Foundation
2. **Backend APIs** (Phases 2-4) - Backend complete
3. **Frontend Session** (Phase 5) - Session management
4. **Frontend Routes** (Phase 6) - Route protection
5. **Frontend Pages** (Phase 7) - Protect pages
6. **Frontend Integration** (Phases 8-10) - Connect to backend
7. **Testing** (Phase 11) - Verify everything works

---

## 📁 Files to Create/Modify

### New Files to Create
- `client/src/hooks/useBookmarks.ts` - Bookmarks hook
- `client/src/hooks/usePreferences.ts` - Preferences hook
- `client/src/hooks/useUserBookings.ts` - Bookings hook
- Test files for each phase

### Files to Modify
- `server/db.ts` - Database schema
- `shared/schema.ts` - Drizzle ORM definitions
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database queries
- `client/src/hooks/use-auth.tsx` - Session persistence
- `client/src/components/ui/protected-route.tsx` - Route protection
- `client/src/main.tsx` - Route configuration
- `client/src/pages/AIAssistant.tsx` - Bookmarks integration
- `client/src/pages/Profile.tsx` - Preferences integration
- `client/src/pages/DashboardPage.tsx` - Dashboard enhancement

---

## ✅ Validation Checkpoints

After each phase, verify:

**Phase 1**: Database tables exist with correct schema  
**Phase 2**: Bookmarks endpoints work and require auth  
**Phase 3**: Preferences endpoints work and require auth  
**Phase 4**: Bookings endpoints filter by userId  
**Phase 5**: Session persists across page refresh  
**Phase 6**: Unauthenticated users redirected to login  
**Phase 7**: Protected pages require authentication  
**Phase 8**: Bookmarks load from database  
**Phase 9**: Preferences load from database  
**Phase 10**: Dashboard displays user's bookings  
**Phase 11**: All integration tests pass  

---

## 🎯 Success Criteria

Implementation is complete when:

✅ Users must login to access protected features  
✅ Each user's data is stored in the database  
✅ Users only see their own data  
✅ Sessions persist across page refreshes  
✅ Bookmarks and preferences are saved permanently  
✅ All 35 properties pass  
✅ All unit tests pass  
✅ All integration tests pass  

---

## 📞 Common Issues & Solutions

### Issue: "Authentication required" on protected endpoints
**Solution**: Ensure `requireUser` middleware is applied to endpoint

### Issue: Users seeing other users' data
**Solution**: Add ownership check: `WHERE userId = req.user.id`

### Issue: Session lost on page refresh
**Solution**: Implement session restore in AuthProvider useEffect

### Issue: Bookmarks not persisting
**Solution**: Verify bookmarks table exists and userId is set correctly

### Issue: ProtectedRoute not redirecting
**Solution**: Check that user is null and requireAuth is true

---

## 📚 Reference Documents

- **requirements.md** - Detailed requirements (10 requirements, 50+ criteria)
- **design.md** - Architecture and 35 correctness properties
- **tasks.md** - Detailed implementation tasks (40+ sub-tasks)
- **PROTECTED_ROUTES_SPEC_SUMMARY.md** - This spec overview

---

## 🎉 Ready to Start?

1. Read the full spec: `.kiro/specs/protected-routes-user-data/`
2. Start with Phase 1 (Database Schema)
3. Follow the implementation order
4. Validate after each phase
5. Run tests frequently

**Total Estimated Time**: 8-10 hours  
**Difficulty**: Medium  
**Impact**: High - Completes authentication and data persistence system

---

*Last Updated: January 28, 2026*
