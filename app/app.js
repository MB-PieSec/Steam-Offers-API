import express from "express";
import { routes as gamesRoutes} from "./games/routes.js";
import {create as createHandlebars} from 'express-handlebars';
import Handlebars from "handlebars";
import dotenv from 'dotenv';
const app = express();
const hbs = createHandlebars();
dotenv.config();

app.engine("handlebars", hbs.engine);
Handlebars.registerHelper("gt", function(a,b){
    return a > b;
});
Handlebars.registerHelper('add', function (a, b) {
    return a + b;
});
Handlebars.registerHelper('subtract', function(a, b) {
    return a - b;
});
app.set("view engine", "handlebars");
app.set("views", "./app/views");
app.use(express.static('./public'));




app.use("/", gamesRoutes);



app.listen(process.env.PORT, () => {
    console.log(`Listening on port http://localhost:${process.env.PORT}`);
});
