
import express from "express";
import { getCustomerById } from "./customer.controller";
import { createCustomer } from "./customer.controller";

const router = express.Router();

router.get("/:id", getCustomerById );
router.post("/create", createCustomer );

export default router;
