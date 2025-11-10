# Caching-Proxy-Project-Based-on-Nodejs
# Caching Proxy Server
A lightweight HTTP caching proxy server built with Node.js, designed to cache GET requests, respect `Cache-Control` headers, and reduce redundant traffic to the target origin.

## Features
- ✅ Act as an HTTP proxy to forward requests to the target origin
- ✅ Cache only successful (2xx status code) GET requests
- ✅ Respect `Cache-Control: max-age` header for automatic cache expiration
- ✅ Add `X-Cache: HIT/MISS` response header to indicate cache status
- ✅ Support `--cache-clear` command to clear all cached data
- ✅ Handle common errors (timeout, bad gateway, invalid requests)
- ✅ Only support HTTP protocol (as required by the project)

## Prerequisites
- Node.js v14+ (recommended v16+)
- Git (for version control, optional)

## Installation
1. Clone this repository
   ```bash
   git clone https://github.com/your-username/caching-proxy-server.git
   cd caching-proxy-server
   ```
2. No additional dependencies required (uses Node.js built-in `http` and `process` modules)

## Usage
### 1. Start the proxy server
```bash
node index.js --port <PORT> --origin <HTTP_ORIGIN_URL>
```
- `<PORT>`: Local port to run the proxy (e.g., 3000, range: 1-65535)
- `<HTTP_ORIGIN_URL>`: Target HTTP server to proxy (e.g., http://example.com)

**Example**:
```bash
node index.js --port 3000 --origin http://example.com
```
The proxy will start at `http://[::1]:3000` (IPv6) or `http://localhost:3000` (IPv4 fallback)

### 2. Clear cached data
```bash
node index.js --cache-clear
```

## How It Works
1. **Cache Key**: Uses `HTTP_METHOD + request URL` (e.g., `get /api/data`) as the unique cache key
2. **Cache Logic**:
   - First request: Cache miss → Forward to target origin → Cache the 2xx response (with expiration if `max-age` is set)
   - Subsequent requests: Cache hit (if not expired) → Return cached response directly
3. **Expiration**: Automatically invalidates cache when `max-age` (from target origin's `Cache-Control` header) expires
4. **Non-cacheable Requests**: POST/PUT/DELETE requests and non-2xx responses are not cached

## Test the Proxy
1. Start the proxy with the example command above
2. Visit `http://localhost:3000` in your browser or use `curl`:
   ```bash
   curl -I http://localhost:3000
   ```
3. Check the `X-Cache` header in the response:
   - `X-Cache: MISS`: First request (cache not found)
   - `X-Cache: HIT`: Subsequent requests (cache valid)
4. Clear cache with `--cache-clear` and re-request to see `MISS` again

## Error Handling
- **Invalid Port**: Returns error if port is not in 1-65535 range
- **Invalid URL**: Returns error if target origin URL is malformed
- **Unsupported Protocol**: Only HTTP is supported (HTTPS will throw an error)
- **Timeout**: 5-second timeout for requests to target origin (returns 504 Gateway Timeout)
- **Bad Gateway**: Returns 502 if target origin is unreachable

## Project Background
This project is implemented to complete the [Caching Server task from roadmap.sh](https://roadmap.sh/projects/caching-server), focusing on core HTTP proxy and caching mechanisms.


