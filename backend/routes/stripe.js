import express from "express";
const router = express.Router();
import { webhookCheckout } from "../controllers/stripeController.js";

router.route("/webhook-checkout").post(webhookCheckout);

export default router;
