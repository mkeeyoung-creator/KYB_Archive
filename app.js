const categories = [
  {
    id: "mister-trot3",
    name: "미스터 트롯3",
    icon: "🏆",
    file: "data/mister-trot3.json",
    description: "경연 무대 모음"
  },
  {
    id: "love-call-center",
    name: "사랑의 콜센타",
    icon: "☎️",
    file: "data/love-call-center.json",
    description: "감성 라이브 모음"
  },
  {
    id: "golden-friday",
    name: "금타는 금요일",
    icon: "✨",
    file: "data/golden-friday.json",
    description: "금요일 무대 모음"
  },
  {
    id: "stage-performance",
    name: "무대/공연 영상",
    icon: "🎤",
    file: "data/stage-performance.json",
    description: "콘서트와 공연 영상"
  }
];

const state = {
  videos: [],
  selectedCategoryId: "all",
  keyword: ""
};

const categoryGrid = document.querySelector("#categoryGrid");
const videoGrid = document.querySelector("#videoGrid");
const videoTitle = document.querySelector("#videoTitle");
const resultText = document.querySelector("#resultText");
const searchInput = document.querySelector("#searchInput");
const emptyState = document.querySelector("#emptyState");
const totalCount = document.querySelector("#totalCount");
const randomButton = document.querySelector("#randomButton");
const themeToggle = document.querySelector("#themeToggle");

init();

async function init() {
  setupTheme();
  renderCategoryCards();
  await loadVideos();
  bindEvents();
  render();
}

async function loadVideos() {
  try {
    const results = await Promise.all(
      categories.map(async (category) => {
        const response = await fetch(category.file);
        if (!response.ok) throw new Error(`${category.name} JSON을 불러오지 못했습니다.`);
        const videos = await response.json();

        return videos.map((video) => ({
          ...video,
          categoryId: category.id,
          categoryName: category.name,
          thumbnail: video.thumbnail || getYouTubeThumbnail(video.url)
        }));
      })
    );

    state.videos = results.flat();
    totalCount.textContent = state.videos.length;
  } catch (error) {
    console.error(error);
    resultText.textContent = "영상 정보를 불러오지 못했습니다. JSON 파일 경로를 확인해주세요.";
  }
}

function bindEvents() {
  searchInput.addEventListener("input", (event) => {
    state.keyword = event.target.value.trim().toLowerCase();
    render();
  });

  randomButton.addEventListener("click", () => {
    const list = getFilteredVideos();
    if (list.length === 0) return;
    const randomVideo = list[Math.floor(Math.random() * list.length)];
    openYouTube(randomVideo.url);
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("stageArchiveTheme", isDark ? "dark" : "light");
    themeToggle.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
  });
}

function setupTheme() {
  const savedTheme = localStorage.getItem("stageArchiveTheme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  }
}

function renderCategoryCards() {
  const allButton = createCategoryButton({
    id: "all",
    name: "전체 영상",
    icon: "🌟",
    description: "모든 카테고리 보기"
  });

  categoryGrid.appendChild(allButton);
  categories.forEach((category) => categoryGrid.appendChild(createCategoryButton(category)));
}

function createCategoryButton(category) {
  const button = document.createElement("button");
  button.className = `category-card ${category.id === state.selectedCategoryId ? "active" : ""}`;
  button.type = "button";
  button.dataset.categoryId = category.id;
  button.setAttribute("role", "tab");
  button.innerHTML = `
    <span class="category-icon">${category.icon}</span>
    <span class="category-name">${category.name}</span>
    <span class="category-meta">${category.description}</span>
  `;

  button.addEventListener("click", () => {
    state.selectedCategoryId = category.id;
    updateActiveCategory();
    render();
    document.querySelector("#videoSection").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  return button;
}

function updateActiveCategory() {
  document.querySelectorAll(".category-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.categoryId === state.selectedCategoryId);
  });
}

function render() {
  const videos = getFilteredVideos();
  const selectedCategory = categories.find((category) => category.id === state.selectedCategoryId);

  videoTitle.textContent = selectedCategory ? selectedCategory.name : "전체 영상";
  resultText.textContent = state.keyword
    ? `검색어 “${searchInput.value}”에 해당하는 영상 ${videos.length}개`
    : `현재 ${videos.length}개의 영상을 보여주고 있어요.`;

  videoGrid.innerHTML = videos.map(createVideoCard).join("");
  emptyState.hidden = videos.length !== 0;
}

function getFilteredVideos() {
  return state.videos.filter((video) => {
    const matchesCategory = state.selectedCategoryId === "all" || video.categoryId === state.selectedCategoryId;
    const matchesKeyword = !state.keyword || video.title.toLowerCase().includes(state.keyword);
    return matchesCategory && matchesKeyword;
  });
}

function createVideoCard(video) {
  return `
    <article class="video-card">
      <a href="${video.url}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(video.title)} 유튜브에서 보기">
        <div class="thumbnail-wrap">
          <img src="${video.thumbnail}" alt="${escapeHtml(video.title)} 썸네일" loading="lazy" />
          <span class="play-badge">▶</span>
        </div>
        <div class="video-info">
          <span class="video-category">${video.categoryName}</span>
          <h3 class="video-title">${escapeHtml(video.title)}</h3>
        </div>
      </a>
    </article>
  `;
}

function getYouTubeThumbnail(url) {
  const videoId = extractYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
}

function extractYouTubeId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return "";
}

function openYouTube(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
