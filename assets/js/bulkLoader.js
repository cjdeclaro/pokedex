const resultsContainer = document.getElementById("results");
const searchInput = document.getElementById("searchInput");
const typeSelect = document.getElementById("typeSelect");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");

const countPerPage = 10;
const API_BASE = "https://pokeapi.co/api/v2/pokemon";
const FETCH_CONCURRENCY = 8;

let allPokemonList = [];
const pokemonCache = new Map(); // url -> pokemon json
const pokemonRequestCache = new Map(); // url -> promise

const getPokemonIdFromUrl = (url) => {
  const parts = url.split("/");
  return Number(parts[parts.length - 2]);
};

const buildQueryString = ({ query = "", type = "", page = 1 }) => {
  const params = new URLSearchParams();

  if (query) params.set("query", query);
  if (type) params.set("type", type);
  params.set("page", String(page));

  return `?${params.toString()}`;
};

const getFiltersFromURL = () => {
  const params = new URLSearchParams(window.location.search);

  return {
    query: (params.get("query") || "").trim().toLowerCase(),
    type: (params.get("type") || "").trim().toLowerCase(),
    page: Math.max(1, Number.parseInt(params.get("page"), 10) || 1)
  };
};

const updateURL = ({ query, type, page }) => {
  window.location.search = buildQueryString({ query, type, page });
};

const syncInputsWithURL = () => {
  const { query, type } = getFiltersFromURL();
  searchInput.value = query;
  typeSelect.value = type || "";
};

const preloadPokemonList = async () => {
  const res = await fetch(`${API_BASE}?limit=${lastPokemon}&offset=0`);
  if (!res.ok) throw new Error("Failed to preload Pokemon list");

  const data = await res.json();

  allPokemonList = data.results.map((p) => ({
    name: p.name,
    url: p.url,
    id: getPokemonIdFromUrl(p.url)
  }));
};

const fetchPokemon = async (url) => {
  if (pokemonCache.has(url)) {
    return pokemonCache.get(url);
  }

  if (pokemonRequestCache.has(url)) {
    return pokemonRequestCache.get(url);
  }

  const request = fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch Pokémon: ${url}`);
      }
      return res.json();
    })
    .then((data) => {
      pokemonCache.set(url, data);
      pokemonRequestCache.delete(url);
      return data;
    })
    .catch((err) => {
      pokemonRequestCache.delete(url);
      throw err;
    });

  pokemonRequestCache.set(url, request);
  return request;
};

const fetchPokemonBatch = async (items) => {
  const results = [];

  for (let i = 0; i < items.length; i += FETCH_CONCURRENCY) {
    const chunk = items.slice(i, i + FETCH_CONCURRENCY);

    const settled = await Promise.allSettled(
      chunk.map((item) => fetchPokemon(item.url))
    );

    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }

  return results;
};

const filterBaseList = (query) => {
  if (!query) return allPokemonList;

  return allPokemonList.filter((p) => {
    return p.name.includes(query) || String(p.id) === query;
  });
};

const getTypeFilteredPage = async ({ filteredList, type, page }) => {
  const start = (page - 1) * countPerPage;
  const end = start + countPerPage;

  // No type filter: no need to fetch everything
  if (!type) {
    const pageItems = filteredList.slice(start, end);
    const pageData = await fetchPokemonBatch(pageItems);
    return {
      total: filteredList.length,
      pokemon: pageData
    };
  }

  // Type filter requires detail data; do it in controlled batches
  const matched = [];
  let total = 0;

  for (let i = 0; i < filteredList.length; i += FETCH_CONCURRENCY) {
    const chunk = filteredList.slice(i, i + FETCH_CONCURRENCY);
    const detailed = await fetchPokemonBatch(chunk);

    for (const pokemon of detailed) {
      const hasType = pokemon.types.some((t) => t.type.name === type);
      if (!hasType) continue;

      if (total >= start && matched.length < countPerPage) {
        matched.push(pokemon);
      }

      total++;
    }
  }

  return {
    total,
    pokemon: matched
  };
};

const updatePagination = (total, currentPage, query, type) => {
  const lastPage = Math.max(1, Math.ceil(total / countPerPage));
  const safeCurrentPage = Math.min(currentPage, lastPage);

  const prevPage = safeCurrentPage <= 1 ? lastPage : safeCurrentPage - 1;
  const nextPage = safeCurrentPage >= lastPage ? 1 : safeCurrentPage + 1;

  const prevHref = buildQueryString({ query, type, page: prevPage });
  const nextHref = buildQueryString({ query, type, page: nextPage });

  document.querySelectorAll(".btnPrevPage").forEach((btn) => {
    btn.href = prevHref;
    btn.setAttribute("aria-disabled", total === 0 ? "true" : "false");
  });

  document.querySelectorAll(".btnNextPage").forEach((btn) => {
    btn.href = nextHref;
    btn.setAttribute("aria-disabled", total === 0 ? "true" : "false");
  });
};

const renderPokemonCardHTML = (pokemon) => {
  const pokemonId = pokemon.id;
  const pokemonName = pokemon.species.name;

  const primaryType = pokemon.types[0].type.name;
  const primaryColor = typeColors[primaryType] || "#999999";

  let secondaryColor = `${primaryColor}50`;
  let secondTypePill = "";

  if (pokemon.types[1]) {
    const secondaryType = pokemon.types[1].type.name;
    secondaryColor = typeColors[secondaryType] || primaryColor;

    secondTypePill = `
      <div class="badge badge-pill rounded-3 px-2 py-2" style="background-color: ${secondaryColor};">
        ${titleCase(secondaryType)}
      </div>
    `;
  }

  return `
    <a href="view.html?id=${pokemonId}">
      <div class="my-3 d-flex flex-row justify-content-between align-items-center rounded-5" style="background-color: ${primaryColor}20;">
        <div class="ps-sm-5 ps-3 d-flex flex-md-row flex-column align-items-md-center">
          <div class="me-sm-5 me-1 d-flex flex-lg-row flex-column align-items-lg-center">
            <div class="text-secondary me-lg-3">No ${String(pokemonId).padStart(4, "0")}</div>
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
          <img class="imgtypeicon" src="assets/img/types/outlines/${primaryType}.svg" alt="${primaryType}">
          <img class="imgcontent" src="${pokemon.sprites.front_default}" alt="${titleCase(pokemonName)}">
        </div>
      </div>
    </a>
  `;
};

const renderResults = (pokemonList) => {
  if (pokemonList.length === 0) {
    resultsContainer.innerHTML = `<div class="px-4 py-3">No results found.</div>`;
    return;
  }

  resultsContainer.innerHTML = pokemonList.map(renderPokemonCardHTML).join("");
};

const loadResults = async () => {
  const { query, type, page } = getFiltersFromURL();

  resultsContainer.textContent = "Loading...";

  try {
    const filteredList = filterBaseList(query);
    const { total, pokemon } = await getTypeFilteredPage({
      filteredList,
      type,
      page
    });

    renderResults(pokemon);
    updatePagination(total, page, query, type);
  } catch (error) {
    console.error(error);
    resultsContainer.innerHTML = `<div class="px-4 py-3 text-danger">Failed to load Pokémon.</div>`;
  }
};

searchBtn.addEventListener("click", () => {
  updateURL({
    query: searchInput.value.trim().toLowerCase(),
    type: typeSelect.value,
    page: 1
  });
});

clearBtn.addEventListener("click", () => {
  updateURL({ query: "", type: "", page: 1 });
});

preloadPokemonList()
  .then(() => {
    syncInputsWithURL();
    return loadResults();
  })
  .catch((error) => {
    console.error(error);
    resultsContainer.innerHTML = `<div class="px-4 py-3 text-danger">Failed to initialize Pokédex.</div>`;
  });