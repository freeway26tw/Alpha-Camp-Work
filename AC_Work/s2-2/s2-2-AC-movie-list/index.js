const sound = document.querySelector('.bi-music-note-list')
const searchBar = document.querySelector('.searchBar')
const audio = new Audio('https://docs.google.com/uc?export=download&id=1U9J8s7ibMCy4nsXjzJ01VoNSOmxEMnlA')
audio.volume = 0.3
audio.loop = true

const genres = {
  "0": "(All)",
  "1": "Action",
  "2": "Adventure",
  "3": "Animation",
  "4": "Comedy",
  "5": "Crime",
  "6": "Documentary",
  "7": "Drama",
  "8": "Family",
  "9": "Fantasy",
  "10": "History",
  "11": "Horror",
  "12": "Music",
  "13": "Mystery",
  "14": "Romance",
  "15": "Science Fiction",
  "16": "TV Movie",
  "17": "Thriller",
  "18": "War",
  "19": "Western"
}

const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const movies = []
const MOVIES_PER_PAGE = 10
let filteredMovies = []
const dataPanel = document.querySelector('#data-panel')
const modeIcon = document.querySelector('.mode-icon')
const genreSelect = document.querySelector('#genre-select')
let nowMode = 'card'
let nowPage = 1

const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')

// 以上宣告變數

// 當網頁載入時，先讓animation paused (原本設定為playing)
document.addEventListener('DOMContentLoaded', function () { sound.style.animationPlayState = 'paused' })
// 當點擊icon後，animation & 音樂 play
// 再按一次則兩者停止
sound.addEventListener('click', function musicPlay(event) {
  const animationPlayStateCheck = this.style.animationPlayState === 'paused'
  audio.play()
  if (animationPlayStateCheck) {
    this.style.animationPlayState = 'running'
    audio.play()
  } else {
    this.style.animationPlayState = 'paused'
    audio.pause()
  }
})

// 顯示movie的詳細資料 (當按下more按鈕時)
function showMovieModal(id) {
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')

  //reset (避免殘影)
  modalTitle.innerText = ''
  modalDate.innerText = ''
  modalDescription.innerText = ''
  modalImage.innerHTML = ''

  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results
    modalTitle.innerText = data.title
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
    modalImage.innerHTML = `<img src="${POSTER_URL + data.image
      }" alt="movie-poster" class="img-fluid">`
  })
}

// 檢查addFavoriteButton是否加到 local storage中
function checkFavoriteExist() {
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
  const favoriteButtons = dataPanel.querySelectorAll('.btn-add-favorite')
  favoriteButtons.forEach(favoriteButton => {
    if (list.some((movie) => movie.id === Number(favoriteButton.dataset.id))) {
      favoriteButton.classList.add('btn-success')
      favoriteButton.innerText = '✓'
    }
  })
}

// 加入到favorite (local storage)
function addToFavorite(id) {
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
  const movie = movies.find((movie) => movie.id === id)
  if (list.some((movie) => movie.id === id)) {
    return alert('此電影已經在蒐藏清單中')
  }
  list.push(movie)
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}

// 以電影數量計算要呈現的頁數
function getMoviesByPage(page) {
  const data = filteredMovies.length ? filteredMovies : movies
  const startIndex = (page - 1) * MOVIES_PER_PAGE
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE)
}

// render paginator
function renderPaginator(amount) {
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE)
  let rawHTML = ''
  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
  }
  paginator.innerHTML = rawHTML
}

// render movielist (data: movie; mode:card|list)
function renderMovieList(data, mode) {
  let rawHTML = ``
  // card模式
  if (mode === 'card') {
    data.forEach((item) => {
      // title, image
      rawHTML += `<div class="card col-1 m-0 p-0">
    <img class="card-img-top" src="${POSTER_URL + item.image
        }" alt="movie-poster">
    <div class="card-body">
      <button class="bi bi-three-dots btn btn-light shadow-none btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}"></button>
      <button class="btn btn-secondary btn-add-favorite" data-id="${item.id}">+</button> 
    </div>
  </div>`
    })
    dataPanel.innerHTML = rawHTML
    // list模式
  } else if (mode === 'list') {
    rawHTML += `<ul class="list-group">`
    data.forEach((item) => {
      // title, image
      rawHTML += `
      <li class="list-group-item d-flex flex-row-reverse mt-5" style="background-image: url(${POSTER_URL + item.image})">
        <p class="list-text position-absolute">${item.title}</p>
        <button class="btn btn-secondary btn-add-favorite" data-id="${item.id}">+</button>
        <button class="btn btn-dark btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}">More</button>
      </li> 
      `
    })
    rawHTML += `</ul>`
    dataPanel.innerHTML = rawHTML
  }
  checkFavoriteExist()
}

// search bar事件監聽
searchForm.addEventListener('keyup', function onSearchFormSubmitted(event) {
  event.preventDefault()
  const keyword = searchInput.value.trim().toLowerCase()

  filteredMovies = movies.filter((movie) => {
    const movieName = movie.title.toLowerCase()
    const movieDescription = movie.description.toLowerCase()
    // 搜尋到 title + description
    const movieDetail = movieName + movieDescription
    return movieDetail.includes(keyword)
  })

  renderPaginator(filteredMovies.length)
  renderMovieList(getMoviesByPage(1), nowMode)

  if (filteredMovies.length === 0) {
    renderPaginator(filteredMovies.length)
    return renderMovieList(filteredMovies, nowMode)
  }

  // 點擊paginator第一頁
  paginator.querySelector('a').click()


})

// 取消search bar submit default
searchForm.addEventListener('submit', function (event) {
  event.preventDefault()
})


// 監聽 data panel
dataPanel.addEventListener('click', function onPanelClicked(event) {
  if (event.target.matches('.btn-show-movie')) {
    showMovieModal(Number(event.target.dataset.id))
  } else if (event.target.matches('.btn-add-favorite')) {
    addToFavorite(Number(event.target.dataset.id))
    checkFavoriteExist()
  }
})

// 監聽 選單模式切換
modeIcon.addEventListener('click', function modeChange(event) {
  if (event.target.classList.contains('card-button')) {
    nowMode = 'card'
  } else if (event.target.classList.contains('list-button')) {
    nowMode = 'list'
  }

  // in case of no filteredMovies
  if (filteredMovies.length === 0 && genreSelect.value !== '') {
    console.log('hi')
    renderPaginator(filteredMovies.length)
    renderMovieList(getMoviesByPage([], nowMode))
    return
  }

  // 重新render paginator和movielist
  renderPaginator(filteredMovies.length || movies.length)
  renderMovieList(getMoviesByPage(nowPage), nowMode)

  // 在切換模式時，pagination active不要跑掉
  paginator.querySelectorAll('a')[nowPage - 1].click()
})

// 監聽 paginator
paginator.addEventListener('click', function onPaginatorClicked(event) {
  event.preventDefault()

  const activeItem = document.querySelector('.paginator .active')
  if (activeItem) {
    activeItem.classList.remove('active')
  }

  if (event.target.matches('.page-link')) {
    event.target.parentElement.classList.add('active')
  }

  if (event.target.tagName !== 'A') return
  nowPage = Number(event.target.dataset.page)

  renderMovieList(getMoviesByPage(nowPage), nowMode)
})

// 監聽genre
genreSelect.addEventListener('change', function (event, index) {
  const genre = event.target.value
  const genreIndex = Object.values(genres).indexOf(genre)

  filteredMovies = movies.filter((movie) => {
    // 如果不是 (clear) 選項，則回傳include的結果
    if (genreIndex !== 0) {
      return movie.genres.includes(genreIndex)
    } else {
      return !movie.genres.includes(genreIndex)
    }
  })


  if (filteredMovies.length === 0) {
    // 當找不到清單時，先click paginator的第一項，若之後重新搜尋可以讓output以第一頁呈現
    paginator.querySelector('a').click()

    renderPaginator(filteredMovies.length)
    return renderMovieList(getMoviesByPage([]), nowMode)
  }

  // 重新render paginator和movielist
  renderPaginator(filteredMovies.length)
  renderMovieList(getMoviesByPage(nowPage), nowMode)
  // 不管何時切換genre，都要呈現第一頁結果
  paginator.querySelector('a').click()

})

axios
  .get(INDEX_URL)
  .then((response) => {
    movies.push(...response.data.results)
    renderPaginator(movies.length)
    renderMovieList(getMoviesByPage(nowPage), 'card')
  })
  .catch((err) => console.log(err))

// 將genre資料放入到清單中
function generateGenre() {
  let rawHTML = ``
  for (let id in genres) {
    rawHTML += `<option value="${genres[id]}">${genres[id]}</option>`
  }
  rawHTML = `<option value="" selected disabled hidden>Choose genre here</option>` + rawHTML
  genreSelect.innerHTML = rawHTML
}

generateGenre()