const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (err) {
    console.log(`DB Error: ${err.message}`);
  }
};

initializeDBAndServer();

//convert db object to response object

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

// API to get list of movies

app.get("/movies/", async (request, response) => {
  const getMoviesNameQuery = `SELECT movie_name FROM movie;`;
  const dbResponse = await database.all(getMoviesNameQuery);

  response.send(
    dbResponse.map((eachMovie) => convertDBObjectToResponseObject(eachMovie))
  );
});

// API to create new movie details

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const getInsertQuery = `INSERT INTO movie (director_id,movie_name,lead_actor)
    VALUES (${directorId},'${movieName}','${leadActor}');`;

  const dbResponse = await database.run(getInsertQuery);
  const movieId = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

// API movie based on movie_id

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const getMovieQuery = `SELECT * 
        FROM movie 
        WHERE movie_id = ${movieId};`;

  const dbResponse = await database.get(getMovieQuery);

  response.send(convertDBObjectToResponseObject(dbResponse));
});

// API movie details
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const getUpdateQuery = `
    UPDATE movie SET 
    director_id = ${directorId},
    movie_name = '${movieName}',
    lead_actor = '${leadActor}'
    WHERE movie_id = ${movieId};`;
  const dbResponse = await database.run(getUpdateQuery);
  response.send("Movie Details Updated");
});

// APT to delete movie

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getDeleteQuery = `
    DELETE FROM movie WHERE movie_id = ${movieId}`;
  await database.run(getDeleteQuery);
  response.send("Movie Removed");
});

// API to get list of directors
const convertDbToResponse = (db) => {
  return {
    directorId: db.director_id,
    directorName: db.director_name,
  };
};

app.get("/directors/", async (request, response) => {
  const getDirectorListQuery = `SELECT * FROM director;`;
  const directorsList = await database.all(getDirectorListQuery);
  response.send(
    directorsList.map((eachDirector) => convertDbToResponse(eachDirector))
  );
});

//API to get movies list of specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorQuery = `
 SELECT movie_name 
 FROM movie 
 WHERE director_id = ${directorId};`;
  const moviesArray = await database.all(getDirectorQuery);
  response.send(moviesArray.map((movie) => ({ movieName: movie.movie_name })));
});
module.exports = app;
