const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "pokemon_fight",
    waitForConnections: true,
    connectionLimit: 10
});

function handleDatabaseError(res, error) {
    console.error("Error de MySQL:", error.message);

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
        return res.status(500).json({
            message: "MySQL rechazo el usuario o la contraseña. Revisa DB_USER y DB_PASSWORD en el archivo .env."
        });
    }

    if (error.code === "ER_BAD_DB_ERROR") {
        return res.status(500).json({
            message: "La base de datos no existe. Ejecuta database.sql en MySQL Workbench."
        });
    }

    return res.status(500).json({
        message: "Error al conectar con MySQL."
    });
}

async function findOrCreateTrainer(connection, trainerName, trainerNumber) {
    const [existingRows] = await connection.execute(
        "SELECT id FROM trainers WHERE name = ? LIMIT 1",
        [trainerName]
    );

    if (existingRows.length > 0) {
        return existingRows[0].id;
    }

    const [result] = await connection.execute(
        "INSERT INTO trainers (name, trainer_number) VALUES (?, ?)",
        [trainerName, trainerNumber]
    );

    return result.insertId;
}

app.post("/api/trainers/selection", async (req, res) => {
    const { trainerName, trainerNumber, pokemonId, pokemonName } = req.body;

    if (!trainerName || !trainerNumber || !pokemonId || !pokemonName) {
        return res.status(400).json({ message: "Faltan datos de la seleccion." });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const trainerId = await findOrCreateTrainer(connection, trainerName, trainerNumber);

        await connection.execute(
            `INSERT INTO trainer_selections (trainer_id, pokemon_id, pokemon_name)
             VALUES (?, ?, ?)`,
            [trainerId, pokemonId, pokemonName]
        );

        await connection.commit();
        res.status(201).json({ trainerId });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        handleDatabaseError(res, error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

app.post("/api/battles", async (req, res) => {
    const {
        trainer1Id,
        trainer2Id,
        trainer1PokemonId,
        trainer2PokemonId,
        trainer1PokemonName,
        trainer2PokemonName,
        trainer1Power,
        trainer2Power,
        winnerTrainerId,
        winnerPokemonId,
        winnerPokemonName,
        winnerPower
    } = req.body;

    if (!trainer1Id || !trainer2Id || !winnerTrainerId) {
        return res.status(400).json({ message: "Confirma ambos entrenadores antes de guardar la pelea." });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [battleResult] = await connection.execute(
            `INSERT INTO battles (
                trainer1_id,
                trainer2_id,
                trainer1_pokemon_id,
                trainer2_pokemon_id,
                trainer1_pokemon_name,
                trainer2_pokemon_name,
                trainer1_power,
                trainer2_power,
                winner_trainer_id,
                winner_pokemon_id,
                winner_pokemon_name,
                winner_power
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                trainer1Id,
                trainer2Id,
                trainer1PokemonId,
                trainer2PokemonId,
                trainer1PokemonName,
                trainer2PokemonName,
                trainer1Power,
                trainer2Power,
                winnerTrainerId,
                winnerPokemonId,
                winnerPokemonName,
                winnerPower
            ]
        );

        await connection.execute(
            "UPDATE trainers SET victories = victories + 1 WHERE id = ?",
            [winnerTrainerId]
        );

        await connection.execute(
            `INSERT INTO trainer_victories (trainer_id, battle_id, pokemon_id, pokemon_name)
             VALUES (?, ?, ?, ?)`,
            [winnerTrainerId, battleResult.insertId, winnerPokemonId, winnerPokemonName]
        );

        await connection.commit();
        res.status(201).json({ battleId: battleResult.insertId });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        handleDatabaseError(res, error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

app.get("/api/trainers", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT id, name, trainer_number AS trainerNumber, victories FROM trainers ORDER BY victories DESC, name ASC"
        );
        res.json(rows);
    } catch (error) {
        handleDatabaseError(res, error);
    }
});

app.listen(port, () => {
    console.log(`Pokemon Fight listo en http://localhost:${port}`);
});
