import asyncHandler from "express-async-handler";
import User from "../models/userSchema.js";
import Event from "../models/eventSchema.js";
import Stripe from "stripe";
import generateToken from "../utils/generateToken.js";
import { v4 as uuidv4 } from "uuid";

import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isOrganizer: user.isOrganizer,
        likedEvents: user.likedEvents,
        createdEvents: user.createdEvents,
        boughtTickets: user.boughtTickets,
        profilePicture: user.profilePicture,
        gender: user.gender,
        program: user.program,
      },
      token: generateToken(user._id, user.isOrganizer, user.isAdmin),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
    throw new Error("Invalid email or password");
  }
});

let allowedExtensions = ["jpg", "jpeg", "png"];

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, gender, program } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: "User already exists" });
    throw new Error("User already exists");
  }

  let uploadPath;
  let savedPath;
  if (req.files && Object.keys(req.files).length > 0) {
    let profilePic = req.files.profilePicture;

    // console.log(profilePic);

    let fileExtension = profilePic.name.split(".").pop();

    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      res.status(400).json({ message: "Invalid file extension" });
      throw new Error("Invalid file extension");
    }

    savedPath = "/uploads/profiles/" + uuidv4() + "." + fileExtension;
    uploadPath = __dirname + "/.." + savedPath;

    profilePic.mv(uploadPath, function (err) {
      if (err) return res.status(500).send(err);
    });
  }

  const user = await User.create({
    name,
    email,
    password,
    gender,
    program,
    profilePicture:
      req.body?.profilePicture && req.body.profilePicture.length > 0
        ? req.body.profilePicture
        : savedPath
        ? "http://localhost:5000" + savedPath
        : "sample",
  });

  if (user) {
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isOrganizer: user.isOrganizer,
        likedEvents: user.likedEvents,
        createdEvents: user.createdEvents,
        boughtTickets: user.boughtTickets,
        gender: user.gender,
        program: user.program,
        profilePicture: user.profilePicture,
      },

      token: generateToken(user._id, user.isOrganizer, user.isAdmin),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
    throw new Error("Invalid user data");
  }
});

export const getBookedEvents = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    let ids = user.boughtTickets; //.map((event) => event.eventId);

    const events = await Event.find({ _id: { $in: ids } });

    return res.json(events);
    //return res.json(user.boughtTickets);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const getCreatedEvents = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    return res.json(user.createdEvents);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const getLikedEvents = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    let ids = user.likedEvents; //.map((event) => event.eventId);

    const events = await Event.find({ _id: { $in: ids } });

    return res.json(events);
    //return res.json(user.likedEvents);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const getMyEvents = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const pageSize = 20;
  const page = Number(req.query.page) || 1;

  if (user) {
    let idsLiked = user.likedEvents; //.map((event) => event.eventId);
    let idsBooked = user.boughtTickets; //.map((event) => event.eventId);

    // console.log(user);

    //make a unique list of Ids combining idsLiked and idsBooked
    let allIds = [...new Set([...idsLiked, ...idsBooked])];

    if (allIds.length > 0) {
      // const events = await Event.find({ _id: { $in: allIds } })
      //   .skip(pageSize * (page - 1))
      //   .limit(pageSize)
      //   .populate("attendees", "name email profilePicture _id");

      // const count = await Event.countDocuments({ _id: { $in: allIds } });

      const result = await Event.aggregate([
        {
          $facet: {
            paginatedResults: [
              { $match: { _id: { $in: allIds } } },
              { $skip: pageSize * (page - 1) },
              { $limit: pageSize },
              {
                $lookup: {
                  from: "users",
                  localField: "attendees",
                  foreignField: "_id",
                  as: "attendees",
                },
              },

              {
                $project: {
                  attendees: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    profilePicture: 1,
                  },

                  title: 1,
                  description: 1,
                  startdate: 1,
                  location: 1,
                  starthour: 1,
                  image: 1,
                },
              },
            ],

            totalCount: [
              { $match: { _id: { $in: allIds } } },
              { $count: "count" },
            ],
          },
        },
      ]);

      const events = result[0].paginatedResults;
      const count = result[0].totalCount[0].count;

      return res.json({ events, page, pages: Math.ceil(count / pageSize) });
    } else {
      return res.json([]);
    }
    //return res.json(user.likedEvents);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const addLikedEvent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  const event = await Event.findById(req.params.id);

  if (user) {
    // const alreadyLiked = user.likedEvents.find(
    //   ({ eventId }) => eventId == req.params.id
    // );

    const alreadyLiked = user.likedEvents.includes(req.params.id);

    if (alreadyLiked) {
      res.status(400);
      throw new Error("Event already liked");
    }

    user.likedEvents.push(event._id);

    // user.likedEvents.push({
    //   eventId: event._id,
    //   title: event.title,
    //   startdate: event.startdate,
    //   enddate: event.enddate,
    //   starthour: event.starthour,
    //   endhour: event.endhour,
    //   price: event.price,
    //   location: event.location,
    //   subtitle: event.subtitle,
    // });

    const updatedUser = await user.updateOne({ likedEvents: user.likedEvents });

    if (updatedUser) {
      // event.likedBy.push({
      //   userId: user._id,
      //   name: user.name,
      //   email: user.email,
      //   image: user.profilePicture,
      // });

      event.likedBy.push(user._id);

      const updatedEvent = await event.updateOne({ likedBy: event.likedBy });
      if (updatedEvent) {
        res.json(updatedUser);
      }
    } else {
      res.status(404);
      throw new Error("User not found");
    }
    // res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const removeLikedEvent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  const event = await Event.findById(req.params.id);

  if (user) {
    // const alreadyLiked = user.likedEvents.find(
    //   ({ eventId }) => eventId == req.params.id
    // );

    const alreadyLiked = user.likedEvents.includes(req.params.id);

    if (!alreadyLiked) {
      res.status(400);
      throw new Error("Event not liked");
    }

    user.likedEvents = user.likedEvents.filter((eventId) => {
      // console.log(eventId);
      // console.log(req.params.id);
      return eventId != req.params.id;
    });

    // console.log(user.likedEvents);

    const updatedUser = await user.updateOne({ likedEvents: user.likedEvents });

    if (updatedUser) {
      event.likedBy = event.likedBy.filter((user) => {
        return !user.equals(req.user._id);
      });

      const updatedEvent = await event.updateOne({ likedBy: event.likedBy });

      if (updatedEvent) {
        res.json(updatedUser);
      }
    } else {
      res.status(404);
      throw new Error("User not found");
    }

    // console.log(event.likedBy);

    // console.log(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const boughtEvent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  const event = await Event.findById(
    // (req.body.eventId)
    // req.params.id
    req.params.id
  );

  if (user) {
    // const alreadyBooked = user.boughtTickets.find(
    //   ({ eventId }) => eventId == req.params.id
    // );

    const alreadyBooked = user.boughtTickets.includes(req.params.id);

    // console.log(user);

    if (alreadyBooked) {
      res.status(400).json({ message: "Event already bought" });
      throw new Error("Event already bought");
    }

    if (event.countInStock === 0) {
      res.status(400).json({ message: "Event is sold out" });
      throw new Error("Event is sold out");
    }

    if (event.price > 0) {
      const session = await stripe.checkout.sessions.create({
        //send metadata for session completed webhook
        metadata: {
          userId: user._id.toString(),
          eventId: event._id.toString(),
        },
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: event.title,
                description: event.description,
                images: [event.image],
              },
              unit_amount: event.price * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: process.env.FULL + event._id + "?bought=true",
        cancel_url: process.env.FULL + event._id,
      });

      res.json({ url: session.url });
    } else {
      //TODO: add stripe payment
      // user.boughtTickets.push({
      //   eventId: req.params.id,
      //   title: event.title,
      //   price: event.price,
      //   startdate: event.startdate,
      //   enddate: event.enddate,
      //   starthour: event.starthour,
      //   endhour: event.endhour,
      // });

      user.boughtTickets.push(req.params.id);

      const updatedUser = await user.updateOne({
        boughtTickets: user.boughtTickets,
      });

      if (updatedUser) {
        // event.attendees.push({
        //   userId: req.user._id,
        //   name: user.name,
        //   email: user.email,
        //   image: user.profilePicture,
        // });

        event.attendees.push(user._id);

        if (event.countInStock > 0) {
          event.countInStock = event.countInStock - 1;
        }

        const updatedEvent = await event.updateOne({
          attendees: event.attendees,
          countInStock: event.countInStock,
        });

        if (updatedEvent) {
          res.json(updatedUser);
        }
      } else {
        res.status(404);
        throw new Error("User not found");
      }
    }
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

//create a webhook to handle stripe payment

export const getUsers = asyncHandler(async (req, res) => {
  //add pagination
  const pageSize = 20;
  const page = Number(req.query.page) || 1;

  const count = await User.countDocuments();
  const users = await User.find({})
    .select("-password")
    .skip(pageSize * (page - 1))
    .limit(pageSize);

  res.json({ users, page, pages: Math.ceil(count / pageSize) });

  // const users = await User.find({}).select("-password");
  // return res.status(200).json({ users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  //remove all events where user is the creator
  const events = await Event.find({ creator: req.params.id });

  if (user) {
    events.forEach(async (event) => {
      await Event.findByIdAndDelete(event._id);
    });
    await user.remove();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const events = await Event.find({ creator: req.user._id });

  if (user) {
    events.forEach(async (event) => {
      await Event.findByIdAndDelete(event._id);
    });
    await user.remove();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  // console.log(req.body.isOrganizer);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = req.body.isAdmin || user.isAdmin;
    user.isOrganizer = req.body.isOrganizer || user.isOrganizer;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      isOrganizer: updatedUser.isOrganizer,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      program: user.program,
      isAdmin: user.isAdmin,
      isOrganizer: user.isOrganizer,
      likedEvents: user.likedEvents,
      createdEvents: user.createdEvents,
      boughtTickets: user.boughtTickets,
      profilePicture: user.profilePicture,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password && req.body.password.length > 0) {
      user.password = req.body.password;
    }
    user.profilePicture =
      req.body?.profilePicture && req.body.profilePicture.length > 0
        ? req.body.profilePicture
        : user.profilePicture;
    user.gender = req.body.gender || user.gender;
    user.program = req.body.program || user.program;

    let uploadPath;
    let savedPath;
    if (req.files && Object.keys(req.files).length > 0) {
      let profilePic = req.files.profilePicture;

      // console.log(profilePic);

      let fileExtension = profilePic.name.split(".").pop();

      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        res.status(400).json({ message: "Invalid file extension" });
        throw new Error("Invalid file extension");
      }

      savedPath = "/uploads/profiles/" + uuidv4() + "." + fileExtension;
      uploadPath = __dirname + "/.." + savedPath;

      profilePic.mv(uploadPath, function (err) {
        if (err) return res.status(500).send(err);
      });
    }

    if (savedPath) {
      user.profilePicture = "http://localhost:5000" + savedPath;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      isOrganizer: updatedUser.isOrganizer,
      gender: updatedUser.gender,
      program: updatedUser.program,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// export {
//   login,
//   registerUser,
//   getUserProfile,
//   getAllUsers,
//   getUserById,
//   updateUserProfile,
//   updateUser,
//   deleteUser,
// };
