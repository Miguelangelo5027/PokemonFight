CREATE DATABASE IF NOT EXISTS pokemon_fight;
USE pokemon_fight;

CREATE TABLE IF NOT EXISTS trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    trainer_number TINYINT NOT NULL,
    victories INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainer_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    pokemon_id INT NOT NULL,
    pokemon_name VARCHAR(80) NOT NULL,
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id)
);

CREATE TABLE IF NOT EXISTS battles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer1_id INT NOT NULL,
    trainer2_id INT NOT NULL,
    trainer1_pokemon_id INT NOT NULL,
    trainer2_pokemon_id INT NOT NULL,
    trainer1_pokemon_name VARCHAR(80) NOT NULL,
    trainer2_pokemon_name VARCHAR(80) NOT NULL,
    trainer1_power INT NOT NULL,
    trainer2_power INT NOT NULL,
    winner_trainer_id INT NOT NULL,
    winner_pokemon_id INT NOT NULL,
    winner_pokemon_name VARCHAR(80) NOT NULL,
    winner_power INT NOT NULL,
    fought_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer1_id) REFERENCES trainers(id),
    FOREIGN KEY (trainer2_id) REFERENCES trainers(id),
    FOREIGN KEY (winner_trainer_id) REFERENCES trainers(id)
);

CREATE TABLE IF NOT EXISTS trainer_victories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NOT NULL,
    battle_id INT NOT NULL,
    pokemon_id INT NOT NULL,
    pokemon_name VARCHAR(80) NOT NULL,
    won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id),
    FOREIGN KEY (battle_id) REFERENCES battles(id)
);
