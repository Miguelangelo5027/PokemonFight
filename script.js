
// Get random number
function getRandomNumber() {
    return Math.floor(Math.random() * 151) + 1;
}

// Get one pokemon from API
async function getPokemon(id) {
    let proxy = "https://corsproxy.io/?";
    let url = proxy + "https://pokeapi.co/api/v2/pokemon/" + id.toString().toLowerCase().trim();

    let response = await fetch(url);
    if (!response.ok) {
        throw new Error("Pokemon no encontrado");
    }
    let data = await response.json();
    return data;
}

// Show pokemon on screen
function showPokemon(pokemon) {
    let container = document.getElementById("pokemon-container");

    let card = document.createElement("div");
    card.className = "pokemon-card";

    let img = document.createElement("img");
    img.src = pokemon.sprites.front_default;

    let name = document.createElement("p");
    name.innerText = pokemon.name;

    card.appendChild(img);
    card.appendChild(name);
    container.appendChild(card);
}



let totalCount = 0;

async function pelea() {
    let resultadoDiv = document.getElementById("pelea-resultado");
    resultadoDiv.innerHTML = "Cargando pelea...";
    for (i = 0; i <= 3; i++) {
        resultadoDiv.innerHTML = `<h1 style="font-size: 60px; color: #ff0000; animation: pulse 1s infinite;">${i}</h1>`;
        await new Promise(resolve => setTimeout(resolve, 1000))
    }
    resultadoDiv.innerHTML = "<h1 style='font-size: 40px; color: #ff0000;'>¡LUCHA!</h1>";


    let id1 = document.getElementById("primer-pokemon").value;
    let id2 = document.getElementById("segundo-pokemon").value;

    if (!id1 || !id2) {
        resultadoDiv.innerHTML = "Por favor ingresa dos IDs de Pokémon.";
        return;
    }

    try {
        let pokemon1 = await getPokemon(id1);
        let pokemon2 = await getPokemon(id2);

        // Función para sumar stats base
        const sumStats = (p) => p.stats.reduce((acc, s) => acc + s.base_stat, 0);

        let power1 = sumStats(pokemon1);
        let power2 = sumStats(pokemon2);

        resultadoDiv.innerHTML = `
                    <div class="battle-container">
                        <div class="pokemon-card ${power1 >= power2 && power1 !== power2 ? 'winner-card' : ''}">
                            <img src="${pokemon1.sprites.front_default}">
                            <p>${pokemon1.name}</p>
                            <small>Poder: ${power1}</small>
                            ${power1 > power2 ? '<div>🏆</div>' : ''}
                        </div>
                        <div style="font-size: 30px; font-weight: bold; color: #ff0000;">VS</div>
                        <div class="pokemon-card ${power2 >= power1 && power1 !== power2 ? 'winner-card' : ''}">
                            <img src="${pokemon2.sprites.front_default}">
                            <p>${pokemon2.name}</p>
                            <small>Poder: ${power2}</small>
                            ${power2 > power1 ? '<div>🏆</div>' : ''}
                        </div>
                    </div>
                    <div class="battle-result" style="color: ${power1 === power2 ? '#666' : '#ff0000'};">
                        ${power1 > power2 ? "¡" + pokemon1.name.toUpperCase() + " GANA!" :
                power2 > power1 ? "¡" + pokemon2.name.toUpperCase() + " GANA!" :
                    "¡ES UN EMPATE!"}
                    </div>
                `;

        // Incrementar contador por cada pokemon que "mostramos" en la pelea
        totalCount += 2;
        document.getElementById("contador-pokemon").innerText = "Total Pokémon mostrados: " + totalCount;

    } catch (error) {
        resultadoDiv.innerHTML = "Hubo un error al buscar los Pokémon. Revisa los IDs.";
    }
}


// Main function
async function getRandomPokemon() {
    let container = document.getElementById("pokemon-container");
    let counterElement = document.getElementById("contador-pokemon");
    container.innerHTML = "";

    // Get 5 random pokemon
    for (let i = 0; i < 5; i++) {
        let id = getRandomNumber();
        let pokemon = await getPokemon(id);
        showPokemon(pokemon);
        totalCount++;
    }

    counterElement.innerText = "Total Pokémon mostrados: " + totalCount;
}
