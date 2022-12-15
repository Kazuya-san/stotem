import express from "express";

const router = express.Router();

import {
  getEvents,
  getEventById,
  deleteEvent,
  createEvent,
  updateEvent,
  updateAttending,
  getAttendees,
  getEventByClub,
  getMyEvents,
  getClubs,
} from "../controllers/eventController.js";

import { protect, organizer } from "../middlewares/authMiddleware.js";

router.route("/").get(getEvents).post(protect, organizer, createEvent);

router.get("/myevents", protect, organizer, getMyEvents);

router.route("/clubs").get(getClubs);

router
  .route("/:id")
  .get(getEventById)
  .delete(protect, organizer, deleteEvent)
  .put(protect, organizer, updateEvent);

router.route("/:id/attendees").get(getAttendees);

router.route("/club/:club").get(getEventByClub);

router.route("/:id/attending").put(protect, updateAttending);

export default router;
