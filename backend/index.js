import path from "path";
import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connectDB from "./config/db.js";
import fileUpload from "express-fileupload";
//user routes

dotenv.config();

import userRoutes from "./routes/user.js";
import eventRoutes from "./routes/event.js";
import stripeRoutes from "./routes/stripe.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

connectDB();

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// app.use((req, res, next) => {

//   if()

// });

app.use(cors());

app.use("/api/stripe", express.raw({ type: "*/*" }), stripeRoutes);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(fileUpload());
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);

//serve the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running....");
  });
}

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
