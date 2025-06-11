import express from "express";
import { createReservation } from "./reservation.controller";

const router = express.Router();

router.post("/create", createReservation);

export default router;
