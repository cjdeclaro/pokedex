var resultsContainer = document.getElementById("results");
var countPerPage = 20;

const loadPokemons = async (page) => {
  var baseline = 1 + ((page - 1) * countPerPage);
  var pokemonCount = baseline + countPerPage - 1;

  for (var i = baseline; i <= pokemonCount && i <= lastPokemon; i++) {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/' + i);
    const pokemon = await response.json();

    let pokemonId = pokemon.id;
    let pokemonName = pokemon.name;

    let primaryType = pokemon.types[0].type.name;
    let primaryColor = typeColors[primaryType];

    let secondaryType = primaryType;
    let secondaryColor = primaryColor + '50';

    let secondTypePill = "";

    if(pokemon.types[1] != undefined){
      secondaryType = pokemon.types[1].type.name;
      secondaryColor = typeColors[secondaryType];

      secondTypePill = `<div class="badge badge-pill rounded-3 px-2 py-2" style="background-color: ` + secondaryColor + `;">` + titleCase(secondaryType) + `</div>`;
    }

    resultsContainer.innerHTML += `
      <a href="view.html?id=`+pokemonId+`">
        <div class="my-3 d-flex flex-row justify-content-between align-items-center rounded-5" style="background-color: ` + primaryColor + `20;">
          <div class="ps-sm-5 ps-3 d-flex flex-md-row flex-column align-items-md-center">
            <div class="me-sm-5 me-1 d-flex flex-lg-row flex-column align-items-lg-center">
              <div class="text-secondary me-lg-3">No ` + String(pokemonId).padStart(4, '0') + `</div>
              <div class="h3 mb-lg-0">` + titleCase(pokemonName) + `</div>
            </div>
            <div class="d-flex flex-row">
              <div class="me-1 badge badge-pill rounded-3 px-2 py-2" style="background-color: ` + primaryColor + `;">` + titleCase(primaryType) + `</div>
              `+ secondTypePill +`
            </div>
          </div>
          <div class="imgholder rounded-5 overflow-hidden" style="background-image: linear-gradient( 135deg, ` + secondaryColor + `, ` + primaryColor + `)">
            <img class="imgtypeicon" src="assets/img/types/outlines/`+ primaryType +`.svg">
            <img class="imgcontent" src="` + pokemon.sprites.front_default + `">
          </div>
        </div>
      </a>
    `;
  }
}