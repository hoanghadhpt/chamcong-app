#!/bin/bash
# Script to test authentication and session

API_URL="http://localhost:3000"

echo "=== Testing Chamcong App API ==="
echo ""

# Test register
echo "1. Testing registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "displayName": "Test User"
  }')
echo "Register response: $REGISTER_RESPONSE"
echo ""

# Test login
echo "2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }')
echo "Login response: $LOGIN_RESPONSE"

# Extract session ID
SESSION_ID=$(echo $LOGIN_RESPONSE | grep -o '"sessionId":"[^"]*' | cut -d'"' -f4)
echo "Session ID: $SESSION_ID"
echo ""

# Test authenticated endpoint (e.g., get workers)
if [ -n "$SESSION_ID" ]; then
  echo "3. Testing authenticated request (get workers)..."
  WORKERS_RESPONSE=$(curl -s -X GET "$API_URL/api/workers" \
    -H "x-session-id: $SESSION_ID")
  echo "Workers response: $WORKERS_RESPONSE"
  echo ""
fi

echo "=== Tests completed ==="
