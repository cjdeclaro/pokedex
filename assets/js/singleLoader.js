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
    formsData: formsData
  }

  return data;
}
