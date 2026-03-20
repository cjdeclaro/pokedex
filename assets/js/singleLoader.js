function getTypeNames(typesArray) {
  return typesArray.map(t => t.type.name);
}

function checkTypeEffectiveness(types) {
  const typeChart = {
    normal: { weak: ["fighting"], resist: [], immune: ["ghost"] },
    fire: { weak: ["water", "ground", "rock"], resist: ["fire", "grass", "ice", "bug", "steel", "fairy"], immune: [] },
    water: { weak: ["electric", "grass"], resist: ["fire", "water", "ice", "steel"], immune: [] },
    electric: { weak: ["ground"], resist: ["electric", "flying", "steel"], immune: [] },
    grass: { weak: ["fire", "ice", "poison", "flying", "bug"], resist: ["water", "electric", "grass", "ground"], immune: [] },
    ice: { weak: ["fire", "fighting", "rock", "steel"], resist: ["ice"], immune: [] },
    fighting: { weak: ["flying", "psychic", "fairy"], resist: ["bug", "rock", "dark"], immune: [] },
    poison: { weak: ["ground", "psychic"], resist: ["grass", "fighting", "poison", "bug", "fairy"], immune: [] },
    ground: { weak: ["water", "grass", "ice"], resist: ["poison", "rock"], immune: ["electric"] },
    flying: { weak: ["electric", "ice", "rock"], resist: ["grass", "fighting", "bug"], immune: ["ground"] },
    psychic: { weak: ["bug", "ghost", "dark"], resist: ["fighting", "psychic"], immune: [] },
    bug: { weak: ["fire", "flying", "rock"], resist: ["grass", "fighting", "ground"], immune: [] },
    rock: { weak: ["water", "grass", "fighting", "ground", "steel"], resist: ["normal", "fire", "poison", "flying"], immune: [] },
    ghost: { weak: ["ghost", "dark"], resist: ["poison", "bug"], immune: ["normal", "fighting"] },
    dragon: { weak: ["ice", "dragon", "fairy"], resist: ["fire", "water", "electric", "grass"], immune: [] },
    dark: { weak: ["fighting", "bug", "fairy"], resist: ["ghost", "dark"], immune: ["psychic"] },
    steel: { weak: ["fire", "fighting", "ground"], resist: ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"], immune: ["poison"] },
    fairy: { weak: ["poison", "steel"], resist: ["fighting", "bug", "dark"], immune: ["dragon"] }
  };

  const allTypes = Object.keys(typeChart);

  const effectiveness = {};

  // initialize all to 1
  allTypes.forEach(t => effectiveness[t] = 1);

  // apply multipliers
  types.forEach(defType => {
    const data = typeChart[defType];

    data.weak.forEach(t => effectiveness[t] *= 2);
    data.resist.forEach(t => effectiveness[t] *= 0.5);
    data.immune.forEach(t => effectiveness[t] *= 0);
  });

  // categorize results
  const result = {
    normalDamage: [],
    weakness: [],
    immune: [],
    resistance: []
  };

  Object.entries(effectiveness).forEach(([type, mult]) => {
    if (mult === 0) {
      result.immune.push({ type, mult });
    } else if (mult > 1) {
      result.weakness.push({ type, mult });
    } else if (mult < 1) {
      result.resistance.push({ type, mult });
    } else {
      result.normalDamage.push({ type, mult });
    }
  });

  return result;
}

const loadPokemon = async (id) => {
  const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + id);
  const pokemon = await response.json();

  return pokemon;
}

const loadAPI = async (apiurl) => {
  const response = await fetch(apiurl);
  const data = await response.json();

  return data;
}

function buildTypeEffPills(typeObjects) {
  let pills = '';
  if (typeObjects.length == 0) {
    pills = `
      <div class="my-1 me-1 rounded-3 ps-2 pe-1 py-1 d-flex flex-row align-items-center" style="background-color: black">
        <div class="me-2 text-light small">
          None
        </div>
      </div>
    `;
  } else {
    typeObjects.forEach(typeObject => {
      pills += `
        <div class="my-1 me-1 rounded-3 ps-2 pe-1 py-1 d-flex flex-row align-items-center" style="background-color: `+typeColors[typeObject.type]+`">
          <div class="me-2 text-light small">
            `+titleCase(typeObject.type)+`
          </div>
          <div class="rounded-3 bg-light d-flex flex-row align-items-center justify-content-center text-secondary small px-2" style="height: 30px">
            `+typeObject.mult+`x
          </div>
        </div>
      `;
    })
  }

  return pills;
}

function buildPokemonSingleIcon(link, img, text, is_small = false) {
  let smallClass = is_small ? ' small-icon' : '';
  const hasLink = link != "";
  let baseIcon = `
    <div class="icon-img-container`+smallClass+`">
      <img class="h-100" src="`+ img + `">
      <div class="text-center text-secondary">`+ text + `</div>
    </div>
  `;

  if (hasLink) {
    baseIcon = `<a href="` + link + `">` + baseIcon + `</a>`;
  }

  if(img == undefined) {
    baseIcon = "";
  }

  return baseIcon;
}

const loadPokemonFull = async (id) => {
  id = parseInt(id);
  const pokemon = await loadPokemon(id);
  const species = await loadAPI(pokemon.species.url);

  const hasOtherVarieties = species.varieties.length > 1;
  const defaultVariety = species.varieties.find(item => item.is_default);
  const defaultVarietyData = await loadAPI(defaultVariety.pokemon.url);

  const hasOtherForms = pokemon.forms.length > 1;
  const pokemonForms = pokemon.forms;

  const pokemonSpeciesVarieties = species.varieties;

  const pokemonVarieties = await Promise.all(
    pokemonSpeciesVarieties.map(v => loadAPI(v.pokemon.url))
  );

  const formsData = await Promise.all(
    pokemonForms.map(v => loadAPI(v.url))
  );

  let prevPokemonId = defaultVarietyData.id > 1 ? defaultVarietyData.id - 1 : lastPokemon;
  let nextPokemonId = defaultVarietyData.id < lastPokemon ? defaultVarietyData.id + 1 : 1;

  const prevPokemon = await loadPokemon(prevPokemonId);
  const nextPokemon = await loadPokemon(nextPokemonId);

  // Evolution
  const evolution = await loadAPI(species.evolution_chain.url);

  data = {
    pokemon: pokemon,
    species: species,
    prevPokemon: prevPokemon,
    nextPokemon: nextPokemon,
    hasOtherVarieties: hasOtherVarieties,
    defaultVariety: defaultVariety,
    defaultVarietyData: defaultVarietyData,
    pokemonVarieties: pokemonVarieties,
    hasOtherForms: hasOtherForms,
    formsData: formsData,
    evolution: evolution,
    typeEffectiveness: checkTypeEffectiveness(getTypeNames(pokemon.types))
  }

  console.log(data);

  return data;
}
