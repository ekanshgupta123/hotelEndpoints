#!/bin/bash

# Base64 encoded credentials (ensure you replace this with the correct encoded string)
encoded_credentials="NDg1MjplZjgzNTNhNi1lMDllLTRlMmEtOTIwNC02ODE0MDk4ODBlYmI="

# cURL command to make the API request
curl -X POST "https://api.worldota.net/api/b2b/v3/search/serp/region/" \
-H "Content-Type: application/json" \
-H "Authorization: Basic $encoded_credentials" \
-d '{
    "checkin": "2024-06-04",
    "checkout": "2024-06-06",
    "residency": "us",
    "language": "en",
    "guests": [
        {
            "adults": 2,
            "children": []
        }
    ],
    "region_id": 602703,
    "currency": "USD"
}'