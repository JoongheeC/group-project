const state = {
  currentPage: 1,
  totalPages: 1,
  currentQuery: '',
};

const recommendationForm = document.querySelector('#recommendation-form');
const recommendationSummary = document.querySelector('#recommendation-summary');
const recommendationResults = document.querySelector('#recommendation-results');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const sourceFilter = document.querySelector('#source-filter');
const productsMeta = document.querySelector('#products-meta');
const productsList = document.querySelector('#products-list');
const pageStatus = document.querySelector('#page-status');
const prevPageButton = document.querySelector('#prev-page');
const nextPageButton = document.querySelector('#next-page');
const cardTemplate = document.querySelector('#product-card-template');

function currency(value) {
  return `${Number(value).toLocaleString('ko-KR')}원`;
}

function sourceLabel(value) {
  return value === 'emart24' ? '이마트24' : 'GS25';
}

function createCard({ name, eventType, price, reasons = [], review = null, source = 'gs25' }) {
  const fragment = cardTemplate.content.cloneNode(true);
  const title = fragment.querySelector('h3');
  const badge = fragment.querySelector('.badge');
  const meta = fragment.querySelector('.product-card__meta');
  const reasonList = fragment.querySelector('.reason-list');
  const submeta = document.createElement('div');
  const sourceBadge = document.createElement('span');
  const priceText = document.createElement('span');
  const reviewLink = document.createElement('a');

  submeta.className = 'product-card__submeta';
  sourceBadge.className = `source-badge source-badge--${source}`;
  sourceBadge.textContent = sourceLabel(source);
  priceText.className = 'product-card__price';
  priceText.textContent = `${currency(price)}`;
  reviewLink.className = 'review-link';
  reviewLink.textContent = '블로그 후기 보기';
  reviewLink.target = '_blank';
  reviewLink.rel = 'noreferrer noopener';

  title.textContent = name;
  badge.textContent = eventType;
  meta.replaceChildren(sourceBadge, priceText);

  if (review) {
    submeta.textContent = `네이버 블로그 리뷰 점수 ${review.score.toFixed(1)} / 10 · 블로그 신호 ${review.blogMentions}회`;

    if (review.searchUrl) {
      reviewLink.href = review.searchUrl;
      meta.append(reviewLink);
    }

    meta.after(submeta);
  }

  if (reasons.length === 0) {
    reasonList.remove();
  } else {
    reasonList.innerHTML = reasons.map((reason) => `<li>${reason}</li>`).join('');
  }

  return fragment;
}

async function requestJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
  }

  return response.json();
}

async function loadProducts(page = 1, query = '') {
  productsMeta.textContent = '상품 목록을 불러오는 중입니다...';
  productsList.innerHTML = '';

  const params = new URLSearchParams({
    page: String(page),
    pageSize: '24',
    query,
    source: sourceFilter.value,
  });

  const payload = await requestJson(`/api/products?${params.toString()}`);
  state.currentPage = payload.pagination.page;
  state.totalPages = payload.pagination.totalPages;
  state.currentQuery = query;

  productsMeta.textContent = `총 ${payload.pagination.totalResults.toLocaleString('ko-KR')}개 상품 중 ${payload.items.length.toLocaleString('ko-KR')}개를 보고 있습니다.`;
  pageStatus.textContent = `${state.currentPage} / ${state.totalPages}`;
  prevPageButton.disabled = state.currentPage <= 1;
  nextPageButton.disabled = state.currentPage >= state.totalPages;

  payload.items.forEach((item) => {
    productsList.appendChild(createCard(item));
  });
}

async function loadRecommendations(formData) {
  recommendationSummary.textContent = '추천을 계산하는 중입니다...';
  recommendationResults.innerHTML = '';

  const params = new URLSearchParams({
    source: formData.get('source'),
    drink: formData.get('drink'),
    mood: formData.get('mood'),
    weather: formData.get('weather'),
    limit: '6',
    includeReviews: formData.get('includeReviews') ? '1' : '0',
  });

  const payload = await requestJson(`/api/recommendations?${params.toString()}`);
  const reviewText = payload.context.includeReviews ? '네이버 블로그 리뷰 점수 반영' : '리뷰 점수 제외';
  const sourceText = payload.context.source === 'all' ? '전체 편의점' : sourceLabel(payload.context.source);
  recommendationSummary.textContent = `${sourceText} · ${labelForDrink(payload.context.drink)} · ${labelForMood(payload.context.mood)} · ${labelForWeather(payload.context.weather)} 조합에 맞춰 추천했습니다. (${reviewText})`;

  payload.items.forEach((item) => {
    recommendationResults.appendChild(createCard(item));
  });
}

function labelForDrink(value) {
  return {
    beer: '맥주',
    soju: '소주',
    gaoliang: '고량주',
    highball: '하이볼',
    wine: '와인',
  }[value] || value;
}

function labelForMood(value) {
  return {
    good: '기분 좋음',
    cozy: '차분함',
    stressed: '스트레스 풀고 싶음',
    tired: '피곤함',
  }[value] || value;
}

function labelForWeather(value) {
  return {
    sunny: '맑음',
    snowy: '눈',
    rainy: '비',
    cold: '쌀쌀함',
    hot: '더움',
  }[value] || value;
}

recommendationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await loadRecommendations(new FormData(recommendationForm));
  } catch (error) {
    recommendationSummary.textContent = error.message;
  }
});

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await loadProducts(1, searchInput.value.trim());
  } catch (error) {
    productsMeta.textContent = error.message;
  }
});

prevPageButton.addEventListener('click', async () => {
  if (state.currentPage <= 1) {
    return;
  }

  try {
    await loadProducts(state.currentPage - 1, state.currentQuery);
  } catch (error) {
    productsMeta.textContent = error.message;
  }
});

nextPageButton.addEventListener('click', async () => {
  if (state.currentPage >= state.totalPages) {
    return;
  }

  try {
    await loadProducts(state.currentPage + 1, state.currentQuery);
  } catch (error) {
    productsMeta.textContent = error.message;
  }
});

recommendationSummary.textContent = '항목을 고른 뒤 추천 받기 버튼을 눌러주세요.';

loadProducts().catch((error) => {
  productsMeta.textContent = error.message;
});

sourceFilter.addEventListener('change', async () => {
  try {
    await loadProducts(1, searchInput.value.trim());
  } catch (error) {
    productsMeta.textContent = error.message;
  }
});