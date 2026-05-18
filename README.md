# Pokemon Fight

Aplicacion sencilla para elegir dos entrenadores, confirmar sus Pokemon y registrar el ganador en MySQL.

## Configurar MySQL

1. Abre MySQL Workbench.
2. Ejecuta el archivo `database.sql`.
3. Copia `.env.example` como `.env`.
4. Ajusta `DB_USER` y `DB_PASSWORD` con tus datos de MySQL.

## Ejecutar la app

Instala dependencias una vez:

```bash
npm install
```

Inicia el servidor:

```bash
npm start
```

Abre:

```text
http://localhost:3000
```

## Que se guarda

- Entrenador y numero de entrenador.
- Cada seleccion confirmada de Pokemon.
- Cada pelea con poder de ambos Pokemon.
- Numero total de victorias del entrenador.
- Pokemon con el que gano cada victoria.
