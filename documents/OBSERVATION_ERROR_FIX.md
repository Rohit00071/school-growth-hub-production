# 500 Error Fix - Observation Creation

## Problem
The Leader Dashboard is getting a 500 Internal Server Error when trying to create a new observation.

## Root Cause
**Data Structure Mismatch** between frontend and backend:

### Frontend sends (LeaderDashboard.tsx line 2593):
```javascript
{
  teacher: "John Doe",  // String name
  observer: "Dr. Sarah", // String name  
  date: "Feb 12",       // Formatted string
  domain: "Classroom Management",
  score: 4.5,
  // ... other fields
}
```

### Backend expects (Observation schema):
```prisma
model Observation {
  teacherId: String     // UUID, not name!
  observerId: String    // UUID, not name!
  date: DateTime        // DateTime object, not string!
  domain: String
  score: Float
  // ...
}
```

## Solution Options

### Option 1: Fix Frontend (Recommended)
Modify `LeaderDashboard.tsx` to send UUIDs instead of names:
- Look up teacher ID from the team array before submitting
- Look up observer ID (current user's ID)
- Convert date string to ISO DateTime format

### Option 2: Fix Backend  
Add a transformation layer in the Observation Service to:
- Accept teacher/observer names
- Look them up in the User Service to get IDs
- Convert date strings to DateTime

### Option 3: Quick Workaround
For now, the observation creation feature won't work until one of the above is implemented.

## Recommended Fix
Update the frontend submission in `LeaderDashboard.tsx` around line 2584-2590 to:

```typescript
const newObs = {
  teacherId: team.find(t => t.name === data.teacher)?.id || '',
  observerId: currentUser.id, // Get from useAuth()
  date: new Date(data.date),
  domain: data.domain,
  score: data.score,
  notes: data.notes,
  status: 'SUBMITTED',
  // ... other fields
};
```

This requires:
1. Getting current user ID from auth context
2. Mapping teacher name to ID from team array
3. Converting date to proper DateTime format
