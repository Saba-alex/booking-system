import express from "express";
import {createSeats, getAllSeatsForEvent } from "./seat.controller";

const router = express.Router();

router.post("/create", createSeats);
router.get("/all/:eventID", getAllSeatsForEvent);


export default router;
