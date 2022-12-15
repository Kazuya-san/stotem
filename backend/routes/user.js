import express from "express";
const router = express.Router();
import {
  login,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  getBookedEvents,
  getCreatedEvents,
  getLikedEvents,
  addLikedEvent,
  removeLikedEvent,
  boughtEvent,
  getMyEvents,
  deleteAccount,
} from "../controllers/authController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

router
  .route("/")
  .post(registerUser)
  .get(protect, admin, getUsers)
  .delete(protect, deleteAccount);
router.post("/login", login);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route("/bookedEvents").get(protect, getBookedEvents);
router.route("/createdEvents").get(protect, getCreatedEvents);
router.route("/likedEvents").get(protect, getLikedEvents);

router.route("/getmyEvents").get(protect, getMyEvents);

router
  .route("/likedEvents/:id")
  .post(protect, addLikedEvent)
  .put(protect, removeLikedEvent);

router.route("/boughtEvents/:id").post(protect, boughtEvent);

router
  .route("/:id")
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

export default router;
