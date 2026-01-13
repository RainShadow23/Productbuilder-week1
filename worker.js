// 최종 수정: CORS 사전 요청(OPTIONS)을 처리하는 로직 추가
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event));
})

async function handleRequest(request, event) {
  // CORS 사전 요청(preflight)을 먼저 처리
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // GET 요청에 대해서는 캐싱 로직 수행
  const CACHE_SECONDS = 20;
  const cache = caches.default;
  const cacheKey = new Request(request.url, request); // Use the request as the cache key

  let response = await cache.match(cacheKey);

  if (!response) {
    const url = new URL(request.url);
    const targetUrl = `https://api.upbit.com${url.pathname}${url.search}`;
    // Upbit API 요청 시 User-Agent 헤더 추가 (차단 방지)
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json'
    };

    const originResponse = await fetch(targetUrl, { headers });

    response = new Response(originResponse.body, originResponse);

    // 실제 응답에 CORS 헤더와 캐시 제어 헤더를 추가
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    response.headers.set('Cache-Control', `s-maxage=${CACHE_SECONDS}`);

    // 응답을 캐시에 저장
    event.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}

function handleOptions(request) {
  // 사전 요청에 대한 응답. CORS 허용 헤더를 담아 보낸다.
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type", // 클라이언트가 보낼 수 있는 헤더
  };
  return new Response(null, { headers: headers });
}
