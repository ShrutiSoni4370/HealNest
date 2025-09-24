import express from "express";
import { aiCalmiController , endChatSession , fetchreportcontroller ,getReportByIdController} from "../controllers/aicontrollers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/calmi", authMiddleware, aiCalmiController);
router.post("/generatereport", authMiddleware, endChatSession);
router.get("/fetchreports" , authMiddleware , fetchreportcontroller )
router.post("/getreportbyid" , authMiddleware , getReportByIdController )

export default router;