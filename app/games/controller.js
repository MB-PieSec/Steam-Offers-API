import { getDB, insertGameDetails} from "./model.js";


let GlobalCurrentIndex = 0;
const cachedPages = [];


async function filterGames(startIndex, limit) {
  /**
 * Filters games with active discounts from the database, fetching details in batches from the Steam Store API.
 *
 * @async
 * @function filterGames
 * @param {number} startIndex - The index in the games list to start fetching from.
 * @param {number} limit - The number of games to fetch in each batch.
 * @returns {Promise<Array>} - A list of games with active discounts, up to the specified limit. Returns an empty array if no games are found or no discounts are available.
 *
 * @description
 * The function performs the following steps:
 * 1. Retrieves the list of games from the database using `getDB()`.
 * 2. Iteratively fetches game details in batches, starting from `startIndex`, up to `limit` games per batch.
 * 3. Filters games that have discounts (`price_overview.discount_percent > 0`).
 * 4. Stops when enough discounted games are found or the end of the list is reached.
 * 5. Updates a global index (`GlobalCurrentIndex`) to track the current position in the games list.
 *
 * @throws {Error} - Throws an error if fetching game details fails in `batchFetch`.
 */

  const gamesList = await getDB();
  if (!gamesList) {
      console.log('No games found in the database.');
      return [];
  }
  const gamesWithOffers = [];
  let currentIndex = startIndex;

  while (gamesWithOffers.length < 10 && currentIndex < gamesList.length) {
      const urls = gamesList
          .slice(currentIndex, currentIndex + limit) 
          .map((game) => {
                return `https://store.steampowered.com/api/appdetails?appids=${game.appid}`
                });
      
      console.log(`Fetching games from index ${currentIndex} to ${currentIndex + limit}...`);
      const batchResults = await batchFetch(urls, limit);
      console.log(batchResults);
      // Filter games with discounts
      const filteredGames = batchResults.filter((game) => {
          const appDetails = Object.values(game)[0];
          return (
              appDetails.success &&
              appDetails.data?.price_overview &&
              appDetails.data.price_overview.discount_percent > 0
          );
      });
      gamesWithOffers.push(...filteredGames);

      currentIndex += limit;
  }
  GlobalCurrentIndex = currentIndex;
  
  if (gamesWithOffers.length < limit) {
      console.log('Not enough discounted games found.');
  }
  
  return gamesWithOffers.slice(0, limit);
}


async function batchFetch(urls, batchSize) {
  /**
 * Fetches data from a list of URLs in batches with retry logic for handling failures.
 *
 * @async
 * @function batchFetch
 * @param {string[]} urls - An array of URLs to fetch data from.
 * @param {number} batchSize - The number of URLs to process concurrently in each batch.
 * @returns {Promise<Array>} - An array of successfully fetched results. Failed requests return `null` and are excluded from the final result.
 *
 * @description
 * This function processes a list of URLs in batches, making HTTP requests and applying the following logic:
 * 1. Splits the `urls` array into chunks of size `batchSize`.
 * 2. For each batch, sends concurrent requests using `Promise.all`.
 * 3. Implements retry logic for each URL:
 *    - Retries up to 3 times with an increasing delay (starting at 2 seconds and doubling after each failure).
 *    - Logs progress and errors for each attempt.
 *    - Skips URLs that fail after 3 retries.
 * 4. Collects and filters successful results, excluding `null` values from failed attempts.
 *
 * @throws {Error} - Throws errors encountered during individual fetch operations, which are caught and retried internally.
 *
 */

  const results = [];

  for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

      
      const batchResults = await Promise.all(
      batch.map(async (url) => {
          
          let retries = 3; 
          let delay = 2000; 

          while (retries > 0) {
          try {
              const response = await fetch(url);
              if (response.ok) {
              console.log(`${url}: Fetched successfully`);
              return await response.json();
              } else {
              console.log(`Error fetching ${url}: ${response.status} ${response.statusText}`);
              throw new Error('Non-OK response');
              }
          } catch (error) {
              console.log(`Error fetching ${url}: ${error.message}`);
              retries--;
              if (retries > 0) {
              console.log(`Retrying ${url}... (${3 - retries} attempt)`);
              await new Promise((resolve) => setTimeout(resolve, delay)); 
              delay *= 2;
              }
          }
          }

          console.log(`${url}: Failed after 3 retries`);
          return null; 
      })
      );

      results.push(...batchResults.filter(Boolean)); 

}

console.log('Batch fetch results:', results);
return results;
}

  
  

async function getGamesWithOffers(startIndex, limit) {
  /**
 * Retrieves and processes a list of games with active discounts, formatting their details for display.
 *
 * @async
 * @function getGamesWithOffers
 * @param {number} startIndex - The index in the games list to start fetching from.
 * @param {number} limit - The maximum number of games to retrieve and process.
 * @returns {Promise<Array>} - A list of games with active discounts, formatted with essential details. Returns an empty array if an error occurs.
 *
 * @description
 * This function performs the following:
 * 1. Calls `filterGames()` to fetch a list of games starting from the given `startIndex`, up to the specified `limit`.
 * 2. Filters the results to include only games with active discounts, identified by a non-zero `discount_percent` in their `price_overview`.
 * 3. Maps the filtered games to a simplified format containing:
 *    - `appid`: The game's Steam App ID.
 *    - `name`: The name of the game.
 *    - `developer`: The developers of the game.
 *    - `description`: A short description of the game.
 *    - `price`: The discounted price (formatted).
 *    - `discount`: The discount percentage.
 *    - `image`: The game's header image URL.
 * 4. Logs the resulting games with offers to the console.
 * 5. Returns the processed list of games.
 *
 * @throws {Error} - Handles and logs any errors that occur during processing, returning an empty array in such cases.
 * 
 */

  try {
      const gamesFound = await filterGames(startIndex, limit); 
      const gamesWithOffers = gamesFound.filter((game) => {
        const appDetails = Object.values(game)[0];
        return appDetails.success && appDetails.data?.price_overview && appDetails.data.price_overview.discount_percent > 0;
      }).map((game) => {
        const appDetails = Object.values(game)[0].data;
        return {
          appid: appDetails.steam_appid,
          name: appDetails.name,
          developer: appDetails.developers,
          description: appDetails.short_description,
          price: appDetails.price_overview.final_formatted,
          discount: appDetails.price_overview.discount_percent,
          image: appDetails.header_image,

        };
      });
      
      console.log("Games with offers:", gamesWithOffers);

      return gamesWithOffers;
    } catch (error) {
      console.error("Error processing games:", error.message);
      return [];
    }
}



async function getGamesWithOffersHandler(startIndex, limit){
  try {
      const gamesList = await getGamesWithOffers(startIndex, limit);
      return gamesList;
  } catch (error) {
      console.error("Error fetching games:", error.message);
      return [];
  }
}

async function getAllFilteredGames(currentStartIndex, limit){
  try {
    let allGames = [];
    let foundGames = await getGamesWithOffersHandler(currentStartIndex, limit);
    allGames = allGames.concat(foundGames); // Add found games to the array
    await insertGameDetails(allGames);
    console.log(GlobalCurrentIndex);
    return allGames;
  } catch (error) {
    console.error("Error processing request:", error.message);
  }
}


function getCurrentIndex() {
  return GlobalCurrentIndex;
}

function cachePages(page){
  const pageCache = {pageNumber: page, pageIndex : GlobalCurrentIndex}
  cachedPages.push(pageCache);
  return cachedPages;
}

async function main(req, res){
  let limit = 9,index, page = parseInt(req.query.page) || 1;
  const cachedPagesList = cachePages(page);
  let currentPageData = cachedPagesList.find(item => item.pageNumber === page);
  console.log(currentPageData);
  if (currentPageData){
      index = currentPageData.pageIndex;
  } else {
      index = getCurrentIndex();
  }
  const games = await getAllFilteredGames(index, limit, page);
  res.render("games/showgames", {games, page});
  console.log(cachedPagesList);
}