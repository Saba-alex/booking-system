import express from "express";
import { orderAndBookSeats } from "./order.controller";

const router = express.Router();

router.post("/create", orderAndBookSeats);

export default router;
