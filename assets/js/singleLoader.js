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

  let prevPokemonId = id > 1 ? id - 1 : lastPokemon;
  let nextPokemonId = id < lastPokemon ? id + 1 : 1;

  const prevPokemon = await loadPokemon(prevPokemonId);
  const nextPokemon = await loadPokemon(nextPokemonId);

  data = {
    pokemon: pokemon,
    species: species,
    prevPokemon: prevPokemon,
    nextPokemon: nextPokemon
  }
  
  return data;
}
