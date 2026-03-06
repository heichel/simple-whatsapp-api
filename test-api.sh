#!/bin/bash

echo "=== Testing Simple WhatsApp API ==="
echo ""

BASE_URL="http://localhost:3000"

echo "1. Health Check"
curl -s $BASE_URL/health | jq .
echo ""

echo "2. Send Message"
curl -s -X POST $BASE_URL/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to":"1234567890","message":"Hello from WhatsApp API!"}' | jq .
echo ""

echo "3. Get Message Status"
curl -s $BASE_URL/api/messages/status/msg_12345 | jq .
echo ""

echo "4. Register Webhook"
curl -s -X POST $BASE_URL/api/webhooks/register \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/webhook","events":["message"]}' | jq .
echo ""

echo "5. List Webhooks"
curl -s $BASE_URL/api/webhooks | jq .
echo ""

echo "6. Connection Status"
curl -s $BASE_URL/api/connection/status | jq .
echo ""

echo "7. Get QR Code"
curl -s $BASE_URL/api/connection/qr | jq .
echo ""

echo "8. Test 404 (Not Found)"
curl -s $BASE_URL/api/invalid/route | jq .
echo ""

echo "=== All tests completed ==="
