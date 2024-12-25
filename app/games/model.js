import mongoose, { connect, Schema } from "mongoose";
import { MongoClient } from "mongodb";
import moment from "moment-timezone";


const GamesListURL = "mongodb://127.0.0.1:27017/gamesList"
const GameDetailsURL = "mongodb://127.0.0.1:27017/gameDetails"

const gamesListSchema = new Schema({
  appid: Number,
  name: String
});

const gameDetailsSchema = new Schema({
  appid: Number,
  name: String,
  developer: [String],
  description: String,
  price: String,
  discount: Number,
  image: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
})
const GameDetails = mongoose.model("GameDetails", gameDetailsSchema);
const Game = mongoose.model("Game", gamesListSchema);

async function connectToGamesListDB() {
  try {
    await mongoose.connect(GamesListURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Successfully connected to the first database.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

async function connectToGameDetailsDB() {
  try {
    await mongoose.connect(GameDetailsURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Successfully connected to the second database.");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error; 
  }
}

async function doesDatabaseExist(dbName) {
  const uri = "mongodb://127.0.0.1:27017"; // MongoClient connects to the server, not the specific database
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const databases = await client.db().admin().listDatabases();
    return databases.databases.some((db) => db.name === dbName);
  } catch (error) {
    console.error("Error checking database existence: ", error);
    return false;
  } finally {
    await client.close();
  }
}

async function removeInvalidGames() {
  try {
    const result = await Game.deleteMany({ name: "" }); // Match documents with an empty name
    console.log(`${result.deletedCount} invalid documents removed.`);
  } catch (error) {
    console.error("Error removing invalid documents:", error);
  }
}


async function initDB() {
  
/**
 * Initializes the games database by fetching data from the Steam API if it doesn't exist.
 *
 * @async
 * @function initDB
 * @returns {Promise<Array|undefined>} - Games data from the database or the Steam API, or undefined on error.
 *
 * @throws {Error} - If the Steam API fetch fails.
 */

  try {
    await connectToGamesListDB();
    const dbName = "gamesList";
    const exists = await doesDatabaseExist(dbName);
    if (exists) {
      console.log("Database already exists...");
      return Game.find({});
    }
    console.log("Database not initialized. Initializing...");
    const response = await fetch(
      "https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json"
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch Steam API: ${response.statusText}`);
    }
    const data = await response.json();
    const gamesList = data.applist.apps;

    await Game.insertMany(gamesList);
    console.log("Database initialized with Steam API data.");
    await removeInvalidGames();

    return gamesList;
  } catch (error) {
    console.error("An unexpected error occurred during DB initialization:", error);
  }
}


export async function getDB(){
    try {
        const gamesList = await initDB();
        return gamesList;
    } catch (error) {
        console.log("Error fetching data:", error);
    }
}


export async function insertGameDetails(list){
  try {
    await mongoose.disconnect(GamesListURL)
    await connectToGameDetailsDB();

    const gameDetailsWithTimestamps = list.map(game => ({
      ...game,
      timestamp: moment().tz("America/New_York").toDate(),
    }));

    await GameDetails.insertMany(gameDetailsWithTimestamps);
    console.log("Game details inserted successfully")
    return;
  } catch (error) {
    console.error("Error inserting game details:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from the second database.");
  }
}


