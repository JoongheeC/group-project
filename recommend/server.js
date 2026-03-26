const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const GS25_PAGE_URL = 'http://gs25.gsretail.com/gscvs/ko/products/event-goods#;';
const GS25_SEARCH_URL = 'http://gs25.gsretail.com/gscvs/ko/products/event-goods-search';
const EMART24_EVENT_URL = 'https://emart24.co.kr/goods/event';
const NAVER_VIEW_SEARCH_URL = 'https://search.naver.com/search.naver';
const CACHE_TTL_MS = 10 * 60 * 1000;
const PAGE_SIZE = 24;
const REVIEW_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let catalogCache = {
  expiresAt: 0,
  products: [],
};
let catalogPromise = null;

let emart24CatalogCache = {
  expiresAt: 0,
  products: [],
};
let emart24CatalogPromise = null;

let reviewCache = new Map();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const includePatterns = [
  { tag: 'jerky', pattern: /육포|비프앤치즈|페퍼앤솔트|통육포/i },
  { tag: 'dried-seafood', pattern: /오징어|쥐포|진미채|건어물|마른안주/i },
  { tag: 'hot-snack', pattern: /꼬치|후랑크|소시지|만두|순대|편육|어묵|떡볶이|구이|찐만두/i },
  { tag: 'spicy', pattern: /매콤|청양|불닭|마라|매운|김치/i },
  { tag: 'smoky', pattern: /숯불|직화|철판|훈연|바베큐|그릴/i },
  { tag: 'creamy', pattern: /치즈|버터|까르보|크림|마요/i },
  { tag: 'light', pattern: /오징어|쥐포|육포|스낵/i },
  { tag: 'hearty', pattern: /순대|편육|만두|꼬치|후랑크|떡볶이/i },
  { tag: 'shareable', pattern: /오징어|육포|꼬치|만두|후랑크/i },
  { tag: 'beer-friendly', pattern: /오징어|쥐포|육포|후랑크|꼬치|소시지/i },
  { tag: 'soju-friendly', pattern: /꼬치|순대|편육|만두|후랑크|매콤|청양/i },
  { tag: 'wine-friendly', pattern: /치즈|버터|갈릭/i },
  { tag: 'highball-friendly', pattern: /오징어|육포|갈릭|숯불|철판/i },
];

const excludePattern = /커피|아메리카노|라떼|주스|콜라|사이다|에이드|차|음료|맥주|소주|와인|위스키|샴푸|린스|치약|고양이|애견|사료|간식\/?참치|컵밥|덮밥|죽|도시락|젤리|아이스크림|빵|쿠키|초콜릿|초코|젤리|캔디/i;

const reasonLookup = {
  jerky: '천천히 집어먹기 좋아 술 템포와 잘 맞습니다.',
  'dried-seafood': '짭짤하고 쫄깃한 마른안주 계열이라 맥주와 궁합이 좋습니다.',
  'hot-snack': '전자레인지로 바로 데워 먹기 쉬운 뜨거운 안주 타입입니다.',
  spicy: '매콤한 맛이 술맛을 끌어올리는 쪽입니다.',
  smoky: '불향이나 훈연향이 있어 술과 함께 먹을 때 존재감이 좋습니다.',
  creamy: '부드럽고 고소한 풍미가 술의 자극을 완화합니다.',
  hearty: '포만감이 있어 한 끼 겸 안주로 가기 좋습니다.',
  light: '날씨 좋을 때 가볍게 곁들이기 좋은 타입입니다.',
  shareable: '여럿이 함께 집어먹기 쉬운 안주입니다.',
};

const positiveReviewPattern = /맛있|추천|강추|좋아|괜찮|만족|재구매|쫄깃|짭짤|고소|촉촉|부드럽|혼술 안주|술안주/i;
const negativeReviewPattern = /별로|아쉽|비추|실망|딱딱|질기|짜다|느끼|텁텁|맵찔이/i;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

function serveStatic(res, filePath) {
  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      sendText(res, 404, 'Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(buffer);
  });
}

function parseNestedJson(text) {
  let value = text;

  for (let index = 0; index < 3; index += 1) {
    if (typeof value !== 'string') {
      return value;
    }

    value = JSON.parse(value);
  }

  return value;
}

function decodeHtml(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function cleanupHtmlText(html) {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html) {
  return cleanupHtmlText(html);
}

function fetchTextWithHttps(targetUrl, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(targetUrl, {
      method: 'GET',
      headers,
      rejectUnauthorized: false,
    }, (response) => {
      let data = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTPS request failed with ${response.statusCode}`));
          return;
        }

        resolve(data);
      });
    });

    request.on('error', reject);
    request.end();
  });
}

function trimBrandPrefix(name) {
  return name.replace(/^[^)]+\)/, '').trim();
}

async function fetchNaverReviewSignals(productName) {
  const cached = reviewCache.get(productName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const query = `${trimBrandPrefix(productName)} 후기`;
  const url = new URL(NAVER_VIEW_SEARCH_URL);
  url.searchParams.set('where', 'view');
  url.searchParams.set('query', query);

  const html = await fetchTextWithHttps(url, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  });
  const cleanText = cleanupHtmlText(html);
  const blogMentions = Math.min(12, (html.match(/blog\.naver\.com/gi) || []).length);
  const positiveMatches = cleanText.match(new RegExp(positiveReviewPattern.source, 'gi')) || [];
  const negativeMatches = cleanText.match(new RegExp(negativeReviewPattern.source, 'gi')) || [];

  let sentimentScore = Math.min(8, positiveMatches.length) - Math.min(6, negativeMatches.length) * 1.2;
  sentimentScore += Math.min(5, Math.floor(blogMentions / 4));

  const score = Math.max(0, Math.min(10, Number(sentimentScore.toFixed(1))));
  const summary = score >= 7
    ? '네이버 블로그 후기 반응이 좋은 편입니다.'
    : score >= 4
      ? '네이버 블로그 후기 반응이 무난한 편입니다.'
      : '네이버 블로그 후기 신호가 강하지 않습니다.';

  const value = {
    score,
    blogMentions,
    positiveCount: positiveMatches.length,
    negativeCount: negativeMatches.length,
    summary,
  };

  reviewCache.set(productName, {
    expiresAt: Date.now() + REVIEW_CACHE_TTL_MS,
    value,
  });

  return value;
}

async function getGs25Session() {
  const response = await fetch(GS25_PAGE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    },
  });

  const html = await response.text();
  const tokenMatch = html.match(/name="CSRFToken" value="([^"]+)"/);

  if (!tokenMatch) {
    throw new Error('GS25 CSRF token not found');
  }

  const cookies = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
    : response.headers.get('set-cookie') || '';

  return {
    token: tokenMatch[1],
    cookies,
  };
}

async function fetchProductsPage({ page = 1, pageSize = PAGE_SIZE, searchWord = '', parameterList = 'TOTAL' }) {
  const session = await getGs25Session();
  const body = new URLSearchParams({
    pageNum: String(page),
    pageSize: String(pageSize),
    searchType: '',
    searchWord,
    parameterList,
  });

  const response = await fetch(`${GS25_SEARCH_URL}?CSRFToken=${session.token}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie': session.cookies,
      'Origin': 'http://gs25.gsretail.com',
      'Referer': GS25_PAGE_URL,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`GS25 request failed with ${response.status}`);
  }

  const text = await response.text();
  return parseNestedJson(text);
}

async function fetchEmart24Page({ page = 1, search = '', categorySeq = '', baseCategorySeq = '', align = '' }) {
  const url = new URL(EMART24_EVENT_URL);
  url.searchParams.set('search', search);
  url.searchParams.set('page', String(page));
  url.searchParams.set('category_seq', categorySeq);
  url.searchParams.set('base_category_seq', baseCategorySeq);
  url.searchParams.set('align', align);

  return fetchTextWithHttps(url, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  });
}

function parseEmart24Items(html) {
  const products = [];
  const itemPattern = /<div class="itemWrap">[\s\S]*?<\/div>\s*<\/div>/g;
  let match = itemPattern.exec(html);

  while (match) {
    const block = match[0];
    const nameMatch = block.match(/<div class="itemtitle">[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
    const priceMatch = block.match(/class="price">\s*([0-9,]+)\s*원/i);
    const imageMatch = block.match(/<img[^>]+src="([^"]+)"/i);
    const badgeMatches = Array.from(block.matchAll(/<span class="([^"]+) floatR">\s*([\s\S]*?)<\/span>/gi));
    const name = nameMatch ? stripTags(nameMatch[1]) : '';
    const price = priceMatch ? Number(priceMatch[1].replace(/,/g, '')) : 0;
    const eventType = badgeMatches.length > 0
      ? stripTags(badgeMatches[badgeMatches.length - 1][2]).replace(/\s+/g, ' ').trim()
      : '행사상품';

    if (name) {
      products.push({
        goodsNm: name,
        eventTypeNm: eventType,
        price,
        attFileNm: imageMatch ? imageMatch[1] : '',
        source: 'emart24',
      });
    }

    match = itemPattern.exec(html);
  }

  return products;
}

function parseEmart24Pagination(html, currentPage) {
  const pageNumbers = Array.from(html.matchAll(/\/goods\/event\?[^"']*page=(\d+)/g)).map((value) => Number(value[1]));
  return {
    totalPages: pageNumbers.length > 0 ? Math.max(...pageNumbers) : currentPage,
  };
}

function buildProductMeta(product) {
  const tags = includePatterns
    .filter(({ pattern }) => pattern.test(product.goodsNm))
    .map(({ tag }) => tag);

  return {
    ...product,
    source: product.source || 'gs25',
    tags,
  };
}

function isPairingCandidate(product) {
  if (excludePattern.test(product.goodsNm)) {
    return false;
  }

  return product.tags.length > 0;
}

async function getCatalog() {
  const now = Date.now();
  if (catalogCache.expiresAt > now && catalogCache.products.length > 0) {
    return catalogCache.products;
  }

  if (catalogPromise) {
    return catalogPromise;
  }

  catalogPromise = (async () => {
    const firstPage = await fetchProductsPage({ page: 1, pageSize: 200, searchWord: '', parameterList: 'TOTAL' });
    const products = firstPage.results.map(buildProductMeta);
    const total = firstPage.pagination.totalNumberOfResults;
    const totalPages = Math.ceil(total / 200);

    for (let page = 2; page <= totalPages; page += 1) {
      const data = await fetchProductsPage({ page, pageSize: 200, searchWord: '', parameterList: 'TOTAL' });
      products.push(...data.results.map(buildProductMeta));
    }

    catalogCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      products,
    };

    return products;
  })();

  try {
    return await catalogPromise;
  } finally {
    catalogPromise = null;
  }
}

async function getEmart24Catalog() {
  const now = Date.now();
  if (emart24CatalogCache.expiresAt > now && emart24CatalogCache.products.length > 0) {
    return emart24CatalogCache.products;
  }

  if (emart24CatalogPromise) {
    return emart24CatalogPromise;
  }

  emart24CatalogPromise = (async () => {
    const products = [];
    let currentPage = 1;
    let totalPages = 1;
    let emptyPageCount = 0;

    while (currentPage <= totalPages && currentPage <= 250) {
      const html = await fetchEmart24Page({ page: currentPage });
      const items = parseEmart24Items(html).map(buildProductMeta);
      const paging = parseEmart24Pagination(html, currentPage);

      products.push(...items);
      totalPages = Math.max(totalPages, paging.totalPages);

      if (items.length === 0) {
        emptyPageCount += 1;
        if (emptyPageCount >= 2) {
          break;
        }
      } else {
        emptyPageCount = 0;
      }

      currentPage += 1;
    }

    const deduped = Array.from(new Map(
      products.map((item) => [`${item.source}:${item.goodsNm}:${item.eventTypeNm}:${item.price}`, item]),
    ).values());

    emart24CatalogCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      products: deduped,
    };

    return deduped;
  })();

  try {
    return await emart24CatalogPromise;
  } finally {
    emart24CatalogPromise = null;
  }
}

async function getUnifiedCatalog() {
  const [gs25Catalog, emart24Catalog] = await Promise.all([getCatalog(), getEmart24Catalog()]);
  return [...gs25Catalog, ...emart24Catalog];
}

async function searchGs25Products({ page, pageSize, query }) {
  const data = await fetchProductsPage({ page, pageSize, searchWord: query, parameterList: 'TOTAL' });
  return {
    items: data.results.map((product) => buildProductMeta({ ...product, source: 'gs25' })),
    totalResults: data.pagination.totalNumberOfResults,
    totalPages: Math.max(1, Math.ceil(data.pagination.totalNumberOfResults / pageSize)),
  };
}

async function searchEmart24Products({ page, pageSize, query }) {
  if (query.trim()) {
    const html = await fetchEmart24Page({ page, search: query.trim() });
    const items = parseEmart24Items(html).map(buildProductMeta);
    const paging = parseEmart24Pagination(html, page);

    return {
      items,
      totalResults: paging.totalPages * pageSize,
      totalPages: Math.max(1, paging.totalPages),
    };
  }

  const catalog = await getEmart24Catalog();
  const totalResults = catalog.length;

  return {
    items: paginate(catalog, page, pageSize),
    totalResults,
    totalPages: Math.max(1, Math.ceil(totalResults / pageSize)),
  };
}

function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeInput(value, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  return value.trim().toLowerCase() || fallback;
}

function scoreProduct(product, context) {
  let score = 0;
  const reasons = new Set();

  const tagSet = new Set(product.tags);
  const drink = context.drink;
  const mood = context.mood;
  const weather = context.weather;

  if (drink === 'beer') {
    if (tagSet.has('beer-friendly')) score += 5;
    if (tagSet.has('dried-seafood')) score += 4;
    if (tagSet.has('jerky')) score += 3;
    if (tagSet.has('smoky')) score += 2;
  }

  if (drink === 'soju') {
    if (tagSet.has('soju-friendly')) score += 5;
    if (tagSet.has('hearty')) score += 3;
    if (tagSet.has('spicy')) score += 2;
  }

  if (drink === 'highball') {
    if (tagSet.has('highball-friendly')) score += 5;
    if (tagSet.has('light')) score += 3;
    if (tagSet.has('smoky')) score += 2;
  }

  if (drink === 'wine') {
    if (tagSet.has('wine-friendly')) score += 5;
    if (tagSet.has('creamy')) score += 3;
    if (tagSet.has('light')) score += 1;
  }

  if (mood === 'good') {
    if (tagSet.has('shareable')) score += 2;
    if (tagSet.has('smoky')) score += 2;
    if (tagSet.has('light')) score += 1;
  }

  if (mood === 'cozy') {
    if (tagSet.has('hot-snack')) score += 3;
    if (tagSet.has('hearty')) score += 2;
  }

  if (mood === 'stressed') {
    if (tagSet.has('spicy')) score += 3;
    if (tagSet.has('hot-snack')) score += 2;
  }

  if (mood === 'tired') {
    if (tagSet.has('hearty')) score += 3;
    if (tagSet.has('creamy')) score += 1;
  }

  if (weather === 'sunny') {
    if (tagSet.has('light')) score += 3;
    if (tagSet.has('dried-seafood')) score += 2;
  }

  if (weather === 'rainy') {
    if (tagSet.has('hot-snack')) score += 4;
    if (tagSet.has('hearty')) score += 2;
  }

  if (weather === 'cold') {
    if (tagSet.has('hearty')) score += 4;
    if (tagSet.has('spicy')) score += 1;
  }

  if (weather === 'hot') {
    if (tagSet.has('light')) score += 3;
    if (tagSet.has('dried-seafood')) score += 2;
    if (tagSet.has('hearty')) score -= 2;
  }

  for (const tag of product.tags) {
    if (reasonLookup[tag] && reasons.size < 3) {
      reasons.add(reasonLookup[tag]);
    }
  }

  return {
    score,
    reasons: Array.from(reasons),
  };
}

async function rankWithReviewSignals(products, context, limit, includeReviews) {
  const scored = products
    .filter(isPairingCandidate)
    .map((product) => {
      const base = scoreProduct(product, context);
      return {
        product,
        baseScore: base.score,
        reasons: [...base.reasons],
      };
    })
    .filter((item) => item.baseScore > 0)
    .sort((left, right) => right.baseScore - left.baseScore || left.product.price - right.product.price);

  const shortlisted = scored.slice(0, includeReviews ? 12 : limit);

  if (includeReviews) {
    await Promise.all(
      shortlisted.map(async (item) => {
        try {
          const review = await fetchNaverReviewSignals(item.product.goodsNm);
          item.review = review;
          item.totalScore = item.baseScore + review.score * 0.9;
          item.reasons.push(review.summary);
        } catch (error) {
          item.review = null;
          item.totalScore = item.baseScore;
        }
      }),
    );
  }

  const ranked = shortlisted
    .map((item) => ({
      name: item.product.goodsNm,
      eventType: item.product.eventTypeNm,
      price: item.product.price,
      source: item.product.source,
      score: includeReviews ? Number((item.totalScore ?? item.baseScore).toFixed(1)) : item.baseScore,
      baseScore: item.baseScore,
      reasons: item.reasons.slice(0, 4),
      review: item.review,
    }))
    .sort((left, right) => right.score - left.score || left.price - right.price)
    .slice(0, limit);

  return ranked;
}

async function handleProductsApi(req, res, url) {
  try {
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(60, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') || String(PAGE_SIZE), 10)));
    const query = url.searchParams.get('query') || '';
    const source = normalizeInput(url.searchParams.get('source'), 'all');

    if (source === 'gs25') {
      const data = await searchGs25Products({ page, pageSize, query });

      sendJson(res, 200, {
        items: data.items.map((product) => ({
          name: product.goodsNm,
          eventType: product.eventTypeNm,
          price: product.price,
          source: product.source,
        })),
        pagination: {
          page,
          pageSize,
          totalResults: data.totalResults,
          totalPages: data.totalPages,
        },
      });
      return;
    }

    if (source === 'emart24') {
      const data = await searchEmart24Products({ page, pageSize, query });

      sendJson(res, 200, {
        items: data.items.map((product) => ({
          name: product.goodsNm,
          eventType: product.eventTypeNm,
          price: product.price,
          source: product.source,
        })),
        pagination: {
          page,
          pageSize,
          totalResults: data.totalResults,
          totalPages: data.totalPages,
        },
      });
      return;
    }

    const catalog = await getUnifiedCatalog();
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = normalizedQuery
      ? catalog.filter((product) => product.goodsNm.toLowerCase().includes(normalizedQuery))
      : catalog;

    sendJson(res, 200, {
      items: paginate(filtered, page, pageSize).map((product) => ({
        name: product.goodsNm,
        eventType: product.eventTypeNm,
        price: product.price,
        source: product.source,
      })),
      pagination: {
        page,
        pageSize,
        totalResults: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

async function handleRecommendationsApi(req, res, url) {
  try {
    const drink = normalizeInput(url.searchParams.get('drink'), 'beer');
    const mood = normalizeInput(url.searchParams.get('mood'), 'good');
    const weather = normalizeInput(url.searchParams.get('weather'), 'sunny');
    const limit = Math.min(12, Math.max(3, Number.parseInt(url.searchParams.get('limit') || '6', 10)));
    const includeReviews = url.searchParams.get('includeReviews') !== '0';
    const source = normalizeInput(url.searchParams.get('source'), 'all');
    const catalog = await getUnifiedCatalog();
    const filteredCatalog = source === 'all'
      ? catalog
      : catalog.filter((product) => product.source === source);

    const recommendations = await rankWithReviewSignals(
      filteredCatalog,
      { drink, mood, weather },
      limit,
      includeReviews,
    );

    sendJson(res, 200, {
      context: { drink, mood, weather, includeReviews, source },
      items: recommendations,
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/products') {
    await handleProductsApi(req, res, url);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/recommendations') {
    await handleRecommendationsApi(req, res, url);
    return;
  }

  const safePath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`GS25 pairing app is running at http://localhost:${PORT}`);
});