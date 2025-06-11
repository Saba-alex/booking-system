import express from "express";
import { createEvent, getAllEvents } from "./event.controller";

const router = express.Router();

router.post("/create", createEvent);
router.get("/", getAllEvents);

export default router;