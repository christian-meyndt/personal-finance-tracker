#!/bin/bash
# Test script for Personal Finance Tracker API
# Run with: ./test_api.sh

API_URL="http://localhost:8000"
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}Personal Finance Tracker - API Test Suite${NC}\n"

# Test 1: Health Check
echo -e "${BOLD}1. Testing health check...${NC}"
HEALTH=$(curl -s "$API_URL/health" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")
if [ "$HEALTH" = "healthy" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}\n"
else
    echo -e "${RED}❌ Health check failed${NC}\n"
    exit 1
fi

# Test 2: Login
echo -e "${BOLD}2. Testing login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123")

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    echo $LOGIN_RESPONSE
    exit 1
else
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Token: ${TOKEN:0:50}..."
    echo ""
fi

# Test 3: Get current user
echo -e "${BOLD}3. Testing /auth/me endpoint...${NC}"
USER=$(curl -s "$API_URL/api/v1/auth/me" -H "Authorization: Bearer $TOKEN")
USERNAME=$(echo $USER | python3 -c "import sys, json; print(json.load(sys.stdin).get('username', ''))")
if [ "$USERNAME" = "admin" ]; then
    echo -e "${GREEN}✅ Auth/me endpoint working${NC}\n"
else
    echo -e "${RED}❌ Auth/me endpoint failed${NC}\n"
    exit 1
fi

# Test 4: List categories
echo -e "${BOLD}4. Testing categories...${NC}"
CATEGORIES=$(curl -s "$API_URL/api/v1/categories" -H "Authorization: Bearer $TOKEN")
CAT_COUNT=$(echo $CATEGORIES | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
echo "Found $CAT_COUNT categories"
if [ "$CAT_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Categories endpoint working${NC}\n"
else
    echo -e "${RED}❌ Categories endpoint failed${NC}\n"
    exit 1
fi

# Test 5: List rules
echo -e "${BOLD}5. Testing categorization rules...${NC}"
RULES=$(curl -s "$API_URL/api/v1/rules" -H "Authorization: Bearer $TOKEN")
RULE_COUNT=$(echo $RULES | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
echo "Found $RULE_COUNT rules"
if [ "$RULE_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Rules endpoint working${NC}\n"
else
    echo -e "${RED}❌ Rules endpoint failed${NC}\n"
    exit 1
fi

# Test 6: Create account
echo -e "${BOLD}6. Testing account creation...${NC}"
ACCOUNT=$(curl -s -X POST "$API_URL/api/v1/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Account", "type": "checking", "currency": "EUR"}')
ACCOUNT_ID=$(echo $ACCOUNT | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")
if [ ! -z "$ACCOUNT_ID" ]; then
    echo -e "${GREEN}✅ Account created with ID: $ACCOUNT_ID${NC}\n"
else
    echo -e "${RED}❌ Account creation failed${NC}\n"
    exit 1
fi

# Test 7: List accounts
echo -e "${BOLD}7. Testing list accounts...${NC}"
ACCOUNTS=$(curl -s "$API_URL/api/v1/accounts" -H "Authorization: Bearer $TOKEN")
ACCOUNT_COUNT=$(echo $ACCOUNTS | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
echo "Found $ACCOUNT_COUNT accounts"
if [ "$ACCOUNT_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Accounts endpoint working${NC}\n"
else
    echo -e "${RED}❌ Accounts endpoint failed${NC}\n"
    exit 1
fi

# Test 8: Test unauthorized access
echo -e "${BOLD}8. Testing authentication protection...${NC}"
UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/v1/accounts")
if [ "$UNAUTH" = "401" ]; then
    echo -e "${GREEN}✅ Protected endpoints require authentication${NC}\n"
else
    echo -e "${RED}❌ Authentication protection not working${NC}\n"
    exit 1
fi

echo -e "${BOLD}${GREEN}🎉 All tests passed!${NC}"
echo -e "\n${BOLD}API Documentation:${NC}"
echo "  Swagger UI: $API_URL/docs"
echo "  ReDoc:      $API_URL/redoc"
echo ""
echo -e "${BOLD}Default Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
