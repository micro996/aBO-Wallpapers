1. Purpose

This document defines how the Wallpaper App communicates with external services, primarily the Unsplash API. It outlines API endpoints, request structures, response handling, rate limits, error handling, caching strategies, and future expansion plans.

2. API Overview

Version 1 uses:

Primary API
Unsplash API

Purpose:

Search wallpapers
Browse categories
Retrieve wallpaper details
Download wallpapers
Access photographer information
3. API Provider
Unsplash

Official Website:

https://unsplash.com

Developer Documentation:

https://unsplash.com/documentation

4. API Authentication

Unsplash requires an Access Key.

Current Approach:

Access Key
↓
Request
↓
Unsplash API

Future Improvement:

App
↓
Backend Proxy
↓
Unsplash API

This prevents exposing API credentials.

5. Base URL
https://api.unsplash.com

All requests originate from this base endpoint.

6. API Endpoints
Search Wallpapers

Endpoint:

GET /search/photos

Purpose:

Search wallpapers using keywords.

Example:

/search/photos?query=nature&page=1&per_page=30

Parameters:

Parameter	Type	Required
query	String	Yes
page	Number	No
per_page	Number	No
orientation	String	No
Get Photo Details

Endpoint:

GET /photos/{id}

Purpose:

Retrieve wallpaper details.

Example:

/photos/abc123
Download Photo

Endpoint:

GET /photos/{id}/download

Purpose:

Register download and retrieve image URL.

Example:

/photos/abc123/download
7. Categories

The application uses predefined categories.

Examples:

Nature
Cars
Anime
Space
Mountains
Technology
Abstract
Animals
Travel
Minimal

These categories are converted into search queries.

Example:

Category: Nature

↓

query=nature
8. Request Flow
Home Screen
Open App

↓

Default Category

↓

Search API

↓

Receive Wallpapers

↓

Render Gallery
Search Flow
User Search

↓

Validate Input

↓

API Request

↓

Receive Results

↓

Update UI
Download Flow
Select Wallpaper

↓

Download Endpoint

↓

Image URL

↓

Browser Download
9. Request Headers

Required headers:

Authorization: Client-ID YOUR_ACCESS_KEY
Accept-Version: v1

Future backend integration may hide authentication headers from the client.

10. Request Limits

Unsplash enforces rate limits.

Common limits:

Requests per hour
Requests per application

The application should monitor limits and avoid unnecessary requests.

11. Rate Limit Handling

When limits are reached:

Application should:

Stop sending requests
Display friendly message
Suggest retry later

Example Message:

Too many requests.
Please try again later.
12. Pagination

The API supports pagination.

Parameters:

page
per_page

Example:

page=1
per_page=30

Used for:

Infinite scrolling
Large search results
13. Image Types

Unsplash provides multiple image sizes.

Thumb

Use for:

Small previews
Small

Use for:

Gallery thumbnails
Regular

Use for:

Preview screen
Full

Use for:

Downloads

Recommended Usage:

Usage	Image Size
Gallery	Small
Preview	Regular
Download	Full
14. Response Processing

The API module should normalize responses.

Example:

Raw Response:

{
  "id": "123",
  "urls": {},
  "user": {}
}

Converted Response:

{
  "id": "",
  "thumbnail": "",
  "fullImage": "",
  "photographer": ""
}

This keeps the UI independent from API changes.

15. Error Handling

Handle:

Network Error
No internet connection.
Timeout
Request timed out.
Please try again.
API Error
Something went wrong.
Please try later.
No Results
No wallpapers found.
Rate Limit
Too many requests.
Please try later.
16. Retry Strategy

When a request fails:

1st Attempt

↓

Retry

↓

Still Fail

↓

Show Error

Maximum:

2 retries

Avoid excessive retry loops.

17. Search Optimization

Implement:

Debounce

Delay:

300ms–500ms

Benefits:

Reduced API calls
Better performance
Input Validation

Ignore:

Empty searches
Spaces only
Extremely long strings
18. Caching Strategy

Optional local cache:

Search Query

↓

Cache

↓

Return Cached Data

Benefits:

Faster loading
Reduced API usage

Cache should expire automatically.

Suggested:

30 Minutes
19. Offline Behavior

When offline:

Available:

Favorites
Settings
Recent Searches

Unavailable:

Search
Categories
New Wallpapers

Show clear offline message.

20. API Security

Version 1:

Store key securely
Avoid exposing unnecessary credentials
Use HTTPS only

Future:

Backend proxy
Token rotation
Request validation
21. Future API Expansion

Potential future providers:

Pexels
Pixabay
Wallhaven
Proprietary Wallpaper API

The application architecture should allow multiple sources without major refactoring.

22. API Performance Guidelines
Minimize duplicate requests.
Cache repeated searches.
Use lazy loading.
Use pagination.
Request only necessary data.
Optimize image sizes.
23. Monitoring

Track:

API failures
Search failures
Download failures
Rate limit errors

Useful for future maintenance.

24. API Goals

The API layer should be:

Reliable
Fast
Secure
Easy to maintain
Easy to replace
Scalable
25. Version 1 API Scope

Version 1 focuses on:

Wallpaper search
Category browsing
Wallpaper details
Downloads

Avoid introducing additional APIs unless they provide significant value.