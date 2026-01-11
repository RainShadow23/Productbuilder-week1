// Use the older Service Worker syntax for max compatibility
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event)) // Pass event to handle waitUntil
})

async function handleRequest(request, event) { // event needed for waitUntil
  const CACHE_SECONDS = 20;
  const cache = caches.default;

  // Generate a cache key from the request URL
  const cacheKey = request.url;

  // Try to find the response in the cache
  let response = await cache.match(cacheKey);

  if (!response) {
    // If not in cache, fetch from Upbit
    const url = new URL(request.url);
    const targetUrl = `https://api.upbit.com${url.pathname}${url.search}`;
    
    const originResponse = await fetch(targetUrl);

    // Create a new response object to modify headers (CORS and Cache-Control)
    response = new Response(originResponse.body, originResponse);

    // Add CORS headers so the client can read the response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    
    // Set Cache-Control to tell Cloudflare's cache how long to store it.
    // s-maxage is for shared caches (like Cloudflare's edge), which is what we want.
    response.headers.set('Cache-Control', `s-maxage=${CACHE_SECONDS}`);

    // Cache the response. event.waitUntil ensures the Worker doesn't exit before caching is done.
    event.waitUntil(cache.put(cacheKey, response.clone())); // response.clone() needed for caching
  } else {
    // If response is from cache, we can optionally add a header to indicate it
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Proxy-Cache', 'HIT');
    response = new Response(response.body, { status: response.status, statusText: response.status, headers: newHeaders });
  }

  return response;
}