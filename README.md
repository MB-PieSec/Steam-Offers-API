# Steam Offer Monitor

This project is a Node.js application that monitors Steam game offers. It retrieves data from Steam, lists games with current offers, and stores the results as a MongoDB database.  

Steam features over 250000 games in its database. You can find the whole catalog [here](https://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json).
The project was to cross-reference each appid from the catalog with the other Steam API which you can find if you scroll down.
This API only accepts 200 requests every 5 minutes. 

## Features  
- Fetches the latest game offers from Steam.  
- Parses and displays results in a structured NOSQL format.  
- Simple and efficient back-end implementation using Node.js and Express.  

## Technologies Used  
- Node.js: Back-end runtime environment.  
- Express.js: Framework for handling HTTP requests and routing.  

## Installation  

1. Clone the repository:  
   ```bash  
   git clone https://github.com/MB-PieSec/Steam-Offers-API.git  
   cd Steam-Offers-API

2. Install dependencies:
   ```bash
   npm install  

## Current Issues:
Due to Steam API rate-limiting which you can find [here](https://github.com/Revadike/InternalSteamWebAPI/wiki/Get-App-Details) the docs for, the application is facing
some difficulties. 
> There will be further attempts to implement caching for the application but that would be tricky due to the game's offers expiration date.

Please feel free to make a pull request if you're interested in the project.
