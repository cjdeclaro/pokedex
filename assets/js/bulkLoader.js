var resultsContainer = document.getElementById("results");
var countPerPage = 10;

let allPokemonList = [];

const syncInputsWithURL = () => {
  const { query, type } = getFiltersFromURL();

  const searchInput = document.getElementById("searchInput");
  const typeSelect = document.getElementById("typeSelect");

  searchInput.value = query || "";

  if (type) {
    typeSelect.value = type;
  } else {
    typeSelect.selectedIndex = 0;
  }
};

const preloadPokemonList = async () => {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=" + lastPokemon + "&offset=0");
  const data = await res.json();
  allPokemonList = data.results;
};

const getFiltersFromURL = () => {
  const params = new URLSearchParams(window.location.search);

  return {
    query: (params.get("query") || "").toLowerCase(),
    type: params.get("type") || "",
    page: parseInt(params.get("page")) || 1
  };
};

const updateURL = ({ query, type, page }) => {
  const params = new URLSearchParams();

  if (query) params.set("query", query);
  if (type) params.set("type", type);
  params.set("page", page);

  window.location.search = params.toString();
};

const loadResults = async () => {
  const { query, type, page } = getFiltersFromURL();

  resultsContainer.innerHTML = "";

  let filtered = allPokemonList;

  if (query) {
    filtered = filtered.filter(p => {
      const id = p.url.split("/")[6];
      return p.name.includes(query) || id === query;
    });
  }

  if (type) {
    const temp = [];

    for (let p of filtered) {
      const res = await fetch(p.url);
      const pokemon = await res.json();

      const hasType = pokemon.types.some(t => t.type.name === type);
      if (hasType) temp.push(p);
    }

    filtered = temp;
  }

  const start = (page - 1) * countPerPage;
  const paginated = filtered.slice(start, start + countPerPage);

  for (let p of paginated) {
    const res = await fetch(p.url);
    const pokemon = await res.json();
    renderPokemonCard(pokemon);
  }

  updatePagination(filtered.length, page, query, type);
};

const updatePagination = (total, currentPage, query, type) => {
  const lastPage = Math.ceil(total / countPerPage);

  const prevPage = currentPage <= 1 ? lastPage : currentPage - 1;
  const nextPage = currentPage >= lastPage ? 1 : currentPage + 1;

  const buildURL = (page) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (type) params.set("type", type);
    params.set("page", page);
    return "?" + params.toString();
  };

  document.querySelectorAll(".btnPrevPage").forEach(btn => {
    btn.href = buildURL(prevPage);
  });

  document.querySelectorAll(".btnNextPage").forEach(btn => {
    btn.href = buildURL(nextPage);
  });
};

const renderPokemonCard = (pokemon) => {
  let pokemonId = pokemon.id;
  let pokemonName = pokemon.species.name;

  let primaryType = pokemon.types[0].type.name;
  let primaryColor = typeColors[primaryType];

  let secondaryType = primaryType;
  let secondaryColor = primaryColor + '50';

  let secondTypePill = "";

  if (pokemon.types[1]) {
    secondaryType = pokemon.types[1].type.name;
    secondaryColor = typeColors[secondaryType];

    secondTypePill = `
      <div class="badge badge-pill rounded-3 px-2 py-2" style="background-color: ${secondaryColor};">
        ${titleCase(secondaryType)}
      </div>`;
  }

  resultsContainer.innerHTML += `
    <a href="view.html?id=${pokemonId}">
      <div class="my-3 d-flex flex-row justify-content-between align-items-center rounded-5" style="background-color: ${primaryColor}20;">
        <div class="ps-sm-5 ps-3 d-flex flex-md-row flex-column align-items-md-center">
          <div class="me-sm-5 me-1 d-flex flex-lg-row flex-column align-items-lg-center">
            <div class="text-secondary me-lg-3">No ${String(pokemonId).padStart(4, '0')}</div>
            <div class="h3 mb-lg-0">${titleCase(pokemonName)}</div>
          </div>
          <div class="d-flex flex-row">
            <div class="me-1 badge rounded-3 px-2 py-2" style="background-color: ${primaryColor};">
              ${titleCase(primaryType)}
            </div>
            ${secondTypePill}
          </div>
        </div>
        <div class="imgholder rounded-5 overflow-hidden" style="background-image: linear-gradient(135deg, ${secondaryColor}, ${primaryColor})">
          <img class="imgtypeicon" src="assets/img/types/outlines/${primaryType}.svg">
          <img class="imgcontent" src="${pokemon.sprites.front_default}">
        </div>
      </div>
    </a>
  `;
};
