const API_CACHE = new Map();
const POKEMON_API_BASE = "https://pokeapi.co/api/v2/pokemon";

function getTypeNames(typesArray) {
  return typesArray.map((t) => t.type.name);
}

function checkTypeEffectiveness(types) {
  const effectiveness = Object.fromEntries(
    Object.keys(typeChart).map((type) => [type, 1])
  );

  for (const defType of types) {
    const data = typeChart[defType];
    if (!data) continue;

    for (const type of data.weak) effectiveness[type] *= 2;
    for (const type of data.resist) effectiveness[type] *= 0.5;
    for (const type of data.immune) effectiveness[type] *= 0;
  }

  const result = {
    normalDamage: [],
    weakness: [],
    immune: [],
    resistance: []
  };

  for (const [type, mult] of Object.entries(effectiveness)) {
    if (mult === 0) {
      result.immune.push({ type, mult });
    } else if (mult > 1) {
      result.weakness.push({ type, mult });
    } else if (mult < 1) {
      result.resistance.push({ type, mult });
    } else {
      result.normalDamage.push({ type, mult });
    }
  }

  return result;
}

async function loadAPI(apiurl) {
  if (API_CACHE.has(apiurl)) {
    return API_CACHE.get(apiurl);
  }

  const request = fetch(apiurl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${apiurl}`);
      }
      return response.json();
    })
    .catch((error) => {
      API_CACHE.delete(apiurl);
      throw error;
    });

  API_CACHE.set(apiurl, request);
  return request;
}

async function loadPokemon(id) {
  return loadAPI(`${POKEMON_API_BASE}/${id}`);
}

function buildTypeEffPills(typeObjects) {
  if (!typeObjects || typeObjects.length === 0) {
    return `
      <div class="my-1 me-1 rounded-3 ps-2 pe-1 py-1 d-flex flex-row align-items-center" style="background-color: black">
        <div class="me-2 text-light small">None</div>
      </div>
    `;
  }

  return typeObjects.map((typeObject) => `
    <div class="my-1 me-1 rounded-3 ps-2 pe-1 py-1 d-flex flex-row align-items-center" style="background-color: ${typeColors[typeObject.type]}">
      <div class="me-2 text-light small">
        ${titleCase(typeObject.type)}
      </div>
      <div class="rounded-3 bg-light d-flex flex-row align-items-center justify-content-center text-secondary small px-2" style="height: 30px">
        ${typeObject.mult}x
      </div>
    </div>
  `).join("");
}

function buildPokemonSingleIcon(link, img, text, isSmall = false) {
  if (!img) return "";

  const smallClass = isSmall ? " small-icon" : "";
  const content = `
    <div class="icon-img-container${smallClass}">
      <img class="h-100" src="${img}" alt="${text || "Pokemon"}">
      <div class="text-center text-secondary">${text}</div>
    </div>
  `;

  return link ? `<a href="${link}">${content}</a>` : content;
}

function getBestPokemonImage(pokemon) {
  return (
    pokemon?.sprites?.front_default ||
    pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
    ""
  );
}

function getEnglishFlavorText(species) {
  return [...species.flavor_text_entries]
    .reverse()
    .find((item) => item.language?.name === "en");
}

function getEnglishGenus(species) {
  return [...species.genera]
    .reverse()
    .find((item) => item.language?.name === "en");
}

function buildMainTypePills(pokemon) {
  return pokemon.types.map(({ type }) => {
    const typeName = type.name;
    const color = typeColors[typeName] || "#999999";

    return `
      <div class="me-2 rounded-5 px-3 py-1 d-flex flex-row align-items-center" style="background-color: ${color}">
        <div class="rounded-circle bg-light single-type-icon me-2">
          <img src="assets/img/types/icons/${typeName}.svg" alt="${typeName}">
        </div>
        <div class="text-white">
          ${titleCase(typeName)}
        </div>
      </div>
    `;
  }).join("");
}

async function loadPokemonFull(id) {
  const parsedId = parseInt(id, 10);
  const pokemon = await loadPokemon(parsedId);

  const [species] = await Promise.all([
    loadAPI(pokemon.species.url)
  ]);

  const defaultVariety = species.varieties.find((item) => item.is_default) || species.varieties[0];

  const [
    defaultVarietyData,
    evolution,
    pokemonVarieties,
    formsData
  ] = await Promise.all([
    loadAPI(defaultVariety.pokemon.url),
    loadAPI(species.evolution_chain.url),
    Promise.all(species.varieties.map((v) => loadAPI(v.pokemon.url))),
    Promise.all(pokemon.forms.map((f) => loadAPI(f.url)))
  ]);

  const prevPokemonId = defaultVarietyData.id > 1 ? defaultVarietyData.id - 1 : lastPokemon;
  const nextPokemonId = defaultVarietyData.id < lastPokemon ? defaultVarietyData.id + 1 : 1;

  const [prevPokemon, nextPokemon] = await Promise.all([
    loadPokemon(prevPokemonId),
    loadPokemon(nextPokemonId)
  ]);

  setCatchCalculatorPokemonData({ species, pokemon });

  return {
    pokemon,
    species,
    prevPokemon,
    nextPokemon,
    hasOtherVarieties: species.varieties.length > 1,
    defaultVariety,
    defaultVarietyData,
    pokemonVarieties,
    hasOtherForms: pokemon.forms.length > 1,
    formsData,
    evolution,
    typeEffectiveness: checkTypeEffectiveness(getTypeNames(pokemon.types))
  };
}

function renderGameSprites(pokemonSprites, elSpritesContainer) {
  const versionSprites = sortGenerations(pokemonSprites.versions);

  let spriteElement = "";

  for (const [generationName, versions] of Object.entries(versionSprites)) {
    let generationBlocks = "";
    let counter = 0;

    for (const [versionName, spriteVariations] of Object.entries(versions)) {
      if (versionName === "icons") continue;
      if (!spriteVariations.front_default) continue;

      counter += 1;

      const shiny = spriteVariations.front_shiny
        ? `
          <div class="m-1 d-flex flex-row justify-content-center">
            ${buildPokemonSingleIcon("", spriteVariations.front_shiny, "", true)}
            ${buildPokemonSingleIcon("", spriteVariations.back_shiny, "", true)}
          </div>
        `
        : "";

      generationBlocks += `
        <div class="col text-center">
          <h6 class="my-2 small">${titleCase(versionName)}</h6>
          <div class="m-1 d-flex flex-row justify-content-center">
            ${buildPokemonSingleIcon("", spriteVariations.front_default, "", true)}
            ${buildPokemonSingleIcon("", spriteVariations.back_default, "", true)}
          </div>
          ${shiny}
        </div>
      `;
    }

    if (counter > 0) {
      spriteElement += `
        <div class="my-3">
          <div class="h6">${generationName}</div>
          <div class="row">
            ${generationBlocks}
          </div>
        </div>
      `;
    }
  }

  const showdownElement = pokemonSprites.other?.showdown?.front_default
    ? `
      <div class="col text-center">
        <h6 class="my-2 small">Showdown</h6>
        <div class="m-1 d-flex flex-row justify-content-center">
          ${buildPokemonSingleIcon("", pokemonSprites.other.showdown.front_default, "", true)}
          ${buildPokemonSingleIcon("", pokemonSprites.other.showdown.front_shiny, "", true)}
        </div>
      </div>
    `
    : "";

  const homeElement = pokemonSprites.other?.home?.front_default
    ? `
      <div class="col text-center">
        <h6 class="my-2 small">Home</h6>
        <div class="m-1 d-flex flex-row justify-content-center">
          ${buildPokemonSingleIcon("", pokemonSprites.other.home.front_default, "", true)}
          ${buildPokemonSingleIcon("", pokemonSprites.other.home.front_shiny, "", true)}
        </div>
      </div>
    `
    : "";

  if (showdownElement || homeElement) {
    spriteElement += `
      <div class="my-3">
        <div class="h6">Other</div>
        <div class="row">
          ${showdownElement}
          ${homeElement}
        </div>
      </div>
    `;
  }

  elSpritesContainer.innerHTML = spriteElement;
}

async function renderEvolution(evolution, elEvoContainer) {
  let currentEvolutionLine = [evolution.chain];
  let html = "";

  while (currentEvolutionLine.length > 0) {
    const speciesData = await Promise.all(
      currentEvolutionLine.map((node) => loadAPI(node.species.url))
    );

    const pokemonData = await Promise.all(
      speciesData.map((species) => loadPokemon(species.id))
    );

    html += `<div class="d-flex flex-row justify-content-center flex-wrap">`;

    for (let i = 0; i < currentEvolutionLine.length; i++) {
      const currentEvolution = currentEvolutionLine[i];
      const pokemonEvoInfo = pokemonData[i];

      html += buildPokemonSingleIcon(
        `view.html?id=${pokemonEvoInfo.id}`,
        getBestPokemonImage(pokemonEvoInfo),
        titleCase(currentEvolution.species.name)
      );
    }

    html += `</div>`;

    currentEvolutionLine = currentEvolutionLine.flatMap(
      (node) => node.evolves_to || []
    );
  }

  elEvoContainer.innerHTML = html;
}
