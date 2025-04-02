import express from "express";
import { getUsers, updateStatus } from '../controllers/adminController.js';
const router = express.Router();

router.get("/users", getUsers);
router.post("/update-status", updateStatus);

export default router;
