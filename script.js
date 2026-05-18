const API_BASE_URL = "http://localhost:3000/api";

const trainers = {
    1: {
        preview: null,
        confirmed: null
    },
    2: {
        preview: null,
        confirmed: null
    }
};

let showingLeaderboard = false;

function normalizePokemonQuery(value) {
    return value.toString().toLowerCase().trim();
}

async function getPokemon(idOrName) {
    const query = normalizePokemonQuery(idOrName);
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

    if (!response.ok) {
        throw new Error("Pokemon no encontrado");
    }

    return response.json();
}

function getPokemonPower(pokemon) {
    return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
}

function getMainStats(pokemon) {
    const wantedStats = ["hp", "attack", "defense", "speed"];

    return pokemon.stats
        .filter((stat) => wantedStats.includes(stat.stat.name))
        .map((stat) => {
            const label = stat.stat.name
                .replace("hp", "vida")
                .replace("attack", "ataque")
                .replace("defense", "defensa")
                .replace("speed", "velocidad");

            return `<small><strong>${label}:</strong> ${stat.base_stat}</small>`;
        })
        .join("");
}

function createPokemonCard(pokemon, showPower = true) {
    const types = pokemon.types.map((type) => type.type.name).join(", ");
    const power = getPokemonPower(pokemon);

    return `
        <div class="pokemon-card">
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <h3>${pokemon.name}</h3>
            <small><strong>ID:</strong> ${pokemon.id}</small>
            <small><strong>Tipo:</strong> ${types}</small>
            ${showPower ? `<small><strong>Poder:</strong> ${power}</small>` : ""}
            <div class="stats-list">${getMainStats(pokemon)}</div>
        </div>
    `;
}

function showMessage(trainerNumber, message) {
    const preview = document.getElementById(`trainer-${trainerNumber}-preview`);
    preview.innerHTML = `<div class="status-message">${message}</div>`;
}

async function loadTrainerPokemon(trainerNumber) {
    const pokemonInput = document.getElementById(`trainer-${trainerNumber}-pokemon`);
    const query = pokemonInput.value;

    if (!query.trim()) {
        trainers[trainerNumber].preview = null;
        showMessage(trainerNumber, "Escribe el nombre o ID del Pokemon.");
        return;
    }

    showMessage(trainerNumber, "Buscando Pokemon...");

    try {
        const pokemon = await getPokemon(query);
        trainers[trainerNumber].preview = pokemon;
        document.getElementById(`trainer-${trainerNumber}-preview`).innerHTML = createPokemonCard(pokemon);
    } catch (error) {
        trainers[trainerNumber].preview = null;
        showMessage(trainerNumber, "No se encontro ese Pokemon.");
    }
}

function getTrainerName(trainerNumber) {
    const trainerName = document.getElementById(`trainer-${trainerNumber}-name`).value.trim();
    return trainerName || `Entrenador ${trainerNumber}`;
}

async function saveTrainerSelection(trainerNumber, trainerName, pokemon) {
    const response = await fetch(`${API_BASE_URL}/trainers/selection`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            trainerName,
            trainerNumber,
            pokemonId: pokemon.id,
            pokemonName: pokemon.name
        })
    });

    if (!response.ok) {
        throw new Error("No se pudo guardar la seleccion");
    }

    return response.json();
}

async function getLeaderboard() {
    const response = await fetch(`${API_BASE_URL}/trainers`);

    if (!response.ok) {
        throw new Error("No se pudo cargar el leaderboard");
    }

    return response.json();
}

async function confirmSelection(trainerNumber) {
    if (!trainers[trainerNumber].preview) {
        await loadTrainerPokemon(trainerNumber);
    }

    const pokemon = trainers[trainerNumber].preview;

    if (!pokemon) {
        return;
    }

    const trainerName = getTrainerName(trainerNumber);

    try {
        const savedSelection = await saveTrainerSelection(trainerNumber, trainerName, pokemon);
        trainers[trainerNumber].confirmed = {
            trainerId: savedSelection.trainerId,
            trainerName,
            pokemon
        };
        updateBattleSlot(trainerNumber);
        showMessage(trainerNumber, "Pokemon confirmado para combatir.");
    } catch (error) {
        trainers[trainerNumber].confirmed = {
            trainerId: null,
            trainerName,
            pokemon
        };
        updateBattleSlot(trainerNumber);
        showMessage(trainerNumber, "Confirmado en pantalla. Revisa el servidor para guardar en MySQL.");
    }
}

function cancelSelection(trainerNumber) {
    trainers[trainerNumber].preview = null;
    trainers[trainerNumber].confirmed = null;
    document.getElementById(`trainer-${trainerNumber}-pokemon`).value = "";
    document.getElementById(`trainer-${trainerNumber}-preview`).innerHTML = '<div class="empty-state">Busca un Pokemon para verlo aqui.</div>';
    updateBattleSlot(trainerNumber);
}

function updateBattleSlot(trainerNumber) {
    const slot = document.getElementById(`battle-slot-${trainerNumber}`);
    const selected = trainers[trainerNumber].confirmed;

    if (!selected) {
        slot.innerHTML = `
            <span>Entrenador ${trainerNumber}</span>
            <p>Sin Pokemon</p>
        `;
        return;
    }

    slot.innerHTML = `
        <span>${selected.trainerName}</span>
        <img src="${selected.pokemon.sprites.front_default}" alt="${selected.pokemon.name}">
        <p>${selected.pokemon.name}</p>
    `;
}

function renderLeaderboard(trainersList) {
    const leaderboardList = document.getElementById("leaderboard-list");

    if (!trainersList.length) {
        leaderboardList.innerHTML = '<div class="empty-state">Todavia no hay victorias registradas.</div>';
        return;
    }

    leaderboardList.innerHTML = `
        <div class="leaderboard-table">
            ${trainersList.map((trainer, index) => `
                <div class="leaderboard-row">
                    <div class="leaderboard-position">${index + 1}</div>
                    <div>
                        <div class="leaderboard-name">${trainer.name}</div>
                        <small>Entrenador ${trainer.trainerNumber}</small>
                    </div>
                    <div class="leaderboard-victories">${trainer.victories} victorias</div>
                </div>
            `).join("")}
        </div>
    `;
}

async function loadLeaderboard() {
    const leaderboardList = document.getElementById("leaderboard-list");
    leaderboardList.innerHTML = '<div class="empty-state">Cargando puntajes...</div>';

    try {
        const trainersList = await getLeaderboard();
        renderLeaderboard(trainersList);
    } catch (error) {
        leaderboardList.innerHTML = '<div class="status-message">No se pudo cargar el leaderboard. Revisa MySQL y el servidor.</div>';
    }
}

async function toggleLeaderboard() {
    showingLeaderboard = !showingLeaderboard;

    document.getElementById("battle-view").classList.toggle("hidden", showingLeaderboard);
    document.getElementById("leaderboard-view").classList.toggle("hidden", !showingLeaderboard);
    document.getElementById("toggle-board-button").innerText = showingLeaderboard ? "Pelea" : "Leaderboard";

    if (showingLeaderboard) {
        await loadLeaderboard();
    }
}

function cleanFields() {
    document.getElementById("trainer-1-name").value = "";
    document.getElementById("trainer-2-name").value = "";
    document.getElementById("pelea-resultado").innerHTML = "";
    cancelSelection(1);
    cancelSelection(2);
}

async function saveBattleResult(payload) {
    const response = await fetch(`${API_BASE_URL}/battles`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error("No se pudo guardar la batalla");
    }

    return response.json();
}

async function countdown(resultadoDiv) {
    for (let count = 1; count <= 3; count++) {
        resultadoDiv.innerHTML = `<h1 style="font-size: 60px; color: #ff0000; animation: pulse 1s infinite;">${count}</h1>`;
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    resultadoDiv.innerHTML = "<h1 style='font-size: 40px; color: #ff0000;'>¡LUCHA!</h1>";
    await new Promise((resolve) => setTimeout(resolve, 700));
}

async function pelea() {
    const resultadoDiv = document.getElementById("pelea-resultado");
    const fighter1 = trainers[1].confirmed;
    const fighter2 = trainers[2].confirmed;

    if (!fighter1 || !fighter2) {
        resultadoDiv.innerHTML = '<div class="battle-result">Ambos entrenadores deben confirmar su Pokemon.</div>';
        return;
    }

    await countdown(resultadoDiv);

    const power1 = getPokemonPower(fighter1.pokemon);
    const power2 = getPokemonPower(fighter2.pokemon);
    const winner = power1 > power2 ? fighter1 : power2 > power1 ? fighter2 : null;
    const winnerPower = power1 > power2 ? power1 : power2;
    const resultText = winner ? `¡${winner.pokemon.name.toUpperCase()} GANA!` : "¡ES UN EMPATE!";

    resultadoDiv.innerHTML = `
        <div class="battle-container">
            <div class="pokemon-card ${power1 > power2 ? "winner-card" : ""}">
                <img src="${fighter1.pokemon.sprites.front_default}" alt="${fighter1.pokemon.name}">
                <p>${fighter1.pokemon.name}</p>
                <small>${fighter1.trainerName}</small>
                <small>Poder: ${power1}</small>
            </div>
            <div class="versus">VS</div>
            <div class="pokemon-card ${power2 > power1 ? "winner-card" : ""}">
                <img src="${fighter2.pokemon.sprites.front_default}" alt="${fighter2.pokemon.name}">
                <p>${fighter2.pokemon.name}</p>
                <small>${fighter2.trainerName}</small>
                <small>Poder: ${power2}</small>
            </div>
        </div>
        <div class="battle-result">${resultText}</div>
    `;

    if (!winner) {
        return;
    }

    try {
        await saveBattleResult({
            trainer1Id: fighter1.trainerId,
            trainer2Id: fighter2.trainerId,
            trainer1PokemonId: fighter1.pokemon.id,
            trainer2PokemonId: fighter2.pokemon.id,
            trainer1PokemonName: fighter1.pokemon.name,
            trainer2PokemonName: fighter2.pokemon.name,
            trainer1Power: power1,
            trainer2Power: power2,
            winnerTrainerId: winner.trainerId,
            winnerPokemonId: winner.pokemon.id,
            winnerPokemonName: winner.pokemon.name,
            winnerPower
        });

        if (showingLeaderboard) {
            await loadLeaderboard();
        }
    } catch (error) {
        resultadoDiv.innerHTML += '<div class="status-message">La pelea termino, pero no se pudo guardar en MySQL.</div>';
    }
}

document.querySelectorAll("[id$='-pokemon']").forEach((input) => {
    input.addEventListener("change", (event) => {
        const trainerNumber = event.target.id.includes("trainer-1") ? 1 : 2;
        loadTrainerPokemon(trainerNumber);
    });
});
