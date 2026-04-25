import express from "express";
import { createReview, getProjectInfo, getReviewInfo, exportReviewController, sendReviewEmailController, uploadPhotoController, getPhotosController, getReviewsListController, deleteReviewController } from "./controller.js";

const router = express.Router();

router.post("/review", createReview);
router.get("/reviews", getReviewsListController);
router.get("/review/:id", getReviewInfo);
router.get("/review/:id/export", exportReviewController);
router.post("/review/:id/send-email", sendReviewEmailController);
router.post("/review/:id/photos", uploadPhotoController);
router.get("/review/:id/photos", getPhotosController);
router.delete("/review/:id", deleteReviewController);
router.get("/project", getProjectInfo);

export default router;
