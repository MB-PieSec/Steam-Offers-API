import { Router } from "express";
import { main } from "./controller.js";
export const routes = new Router();




routes.get("/showgames", main);
routes.get("/about", (req, res) => {
    return res.render("games/about", {title: "About page"})
})
routes.get("/", (req, res) => {
    return res.render("games/home", {title: "Steam Offers Monitor"})
})









