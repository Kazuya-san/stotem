import asyncHandler from "express-async-handler";
import Event from "../models/eventSchema.js";
import User from "../models/userSchema.js";

import { v4 as uuidv4 } from "uuid";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getEvents = asyncHandler(async (req, res) => {
  //paginate
  const pageSize = 24;
  const page = Number(req.query.page) || 1;

  // const events = await Event.find({})
  //   .skip(pageSize * (page - 1))
  //   .limit(pageSize);
  // const count = await Event.countDocuments({});

  const result = await Event.aggregate([
    {
      $facet: {
        paginatedResults: [
          { $skip: pageSize * (page - 1) },
          { $limit: pageSize },
        ],

        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const events = result[0].paginatedResults;
  const count = result[0].totalCount[0].count;

  const today = new Date();
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.enddate);
    return eventDate >= today;
  });

  res.json({
    events: filteredEvents,
    page,
    pages: Math.ceil(count / pageSize),
  });

  // const events = await Event.find({});
  // res.json(events);

  return;
  //remove events that are in the past
  // const today = new Date();
  // const filteredEvents = events.filter((event) => {
  //   const eventDate = new Date(event.enddate);
  //   return eventDate >= today;
  // });
  // res.json(filteredEvents);
  // res.json(events);
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate(
    "attendees",
    "name email profilePicture _id program gender"
  );

  if (event) {
    res.json(event);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

export const getAttendees = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    res.json(event.attendees);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  const user = await User.findById(req.user._id);

  if (event) {
    user.createdEvents = user.createdEvents.filter((e) => e._id != event._id);
    await user.save();
    await event.remove();

    res.json({ message: "Event removed" });
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

export const getMyEvents = asyncHandler(async (req, res) => {
  const pageSize = 20;
  const page = Number(req.query.page) || 1;

  const result = await Event.aggregate([
    {
      $facet: {
        paginatedResults: [
          { $match: { creator: req.user._id } },
          { $skip: pageSize * (page - 1) },
          { $limit: pageSize },
        ],

        totalCount: [
          { $match: { creator: req.user._id } },
          { $count: "count" },
        ],
      },
    },
  ]);

  const events = result[0].paginatedResults;
  const count = result[0].totalCount[0].count;

  res.json({ events, page, pages: Math.ceil(count / pageSize) });
});

export const getEventByClub = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = 24;
  if (req.params.club == "all") {
    // const events = await Event.find({});
    // res.json(events);

    const result = await Event.aggregate([
      {
        $facet: {
          paginatedResults: [
            { $skip: pageSize * (page - 1) },
            { $limit: pageSize },
          ],

          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const events = result[0].paginatedResults;
    const count = result[0].totalCount[0].count;

    const today = new Date();
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.enddate);
      return eventDate >= today;
    });

    res.json({
      events: filteredEvents,
      page,
      pages: Math.ceil(count / pageSize),
    });
    return;
  }

  const result = await Event.aggregate([
    {
      $facet: {
        paginatedResults: [
          {
            $match: {
              creatorName: req.params.club,
            },
          },
          { $skip: pageSize * (page - 1) },
          { $limit: pageSize },
        ],

        totalCount: [
          {
            $match: {
              creatorName: req.params.club,
            },
            $count: "count",
          },
        ],
      },
    },
  ]);

  const events = result[0].paginatedResults;
  const count = result[0].totalCount[0].count;

  // const events = await Event.find({ creatorName: req.params.club })
  //   .skip(pageSize * (page - 1))
  //   .limit(pageSize);
  // const count = await Event.countDocuments({ creatorName: req.params.club });

  const today = new Date();
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.enddate);
    return eventDate >= today;
  });

  res.json({
    events: filteredEvents,
    page,
    pages: Math.ceil(count / pageSize),
  });

  // const events = await Event.find({ creatorName: req.params.club });
  // res.json(events);
});

export const getClubs = asyncHandler(async (req, res) => {
  const events = await Event.find({});
  const clubs = new Set();

  events.forEach((event) => {
    clubs.add(event.creatorName.trim(" "));
  });

  res.json(Array.from(clubs));
});

const allowedExtensions = ["jpg", "jpeg", "png"];

export const createEvent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    let uploadPath;
    let savedPath;
    if (req.files && Object.keys(req.files).length > 0) {
      let eventPic = req.files.eventPic;

      // console.log(eventPic);

      let fileExtension = eventPic.name.split(".").pop();

      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        res.status(400).json({ message: "Invalid file extension" });
        throw new Error("Invalid file extension");
      }

      savedPath = "/uploads/events/" + uuidv4() + "." + fileExtension;

      uploadPath = __dirname + "/../" + savedPath;
      eventPic.mv(uploadPath, function (err) {
        if (err) return res.status(500).send(err);
      });
    }

    const event = new Event({
      title: req.body.title,
      //   subtitle: req.body.subtitle,
      image:
        req.body?.image && req.body.image.length > 0
          ? req.body.image
          : savedPath
          ? "http://localhost:5000" + savedPath
          : "sample",
      description: req.body.description,
      price: req.body.price,
      countInStock: req.body.countInStock,
      user: req.user._id,
      // club: req.body.club,
      //   category: req.body.category,
      location: req.body.location,
      startdate: req.body.startdate,
      enddate: req.body.enddate,
      starthour: req.body.starthour,
      endhour: req.body.endhour,
      creator: req.user._id,
      creatorName: req.user.name,
      qrCode: Math.random().toString(36).substring(7),
    });

    user.createdEvents.push(event._id);
    await user.save();

    const createdEvent = await event.save();
    res.status(201).json(createdEvent);
  } else {
    res
      .status(404)
      .json({ message: "User not found or User is not an Organizer" });
    throw new Error("User not found");
  }
});

export const updateEvent = asyncHandler(async (req, res) => {
  const {
    title,
    // subtitle,
    description,
    price,
    countInStock,
    // club,
    // category,
    location,
    startdate,
    enddate,
    starthour,
    endhour,
  } = req.body;

  const event = await Event.findById(req.params.id);

  if (event) {
    let uploadPath;
    let savedPath;
    if (req.files && Object.keys(req.files).length > 0) {
      let eventPic = req.files.eventPic;

      // console.log(eventPic);

      let fileExtension = eventPic.name.split(".").pop();

      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        res.status(400).json({ message: "Invalid file extension" });
        throw new Error("Invalid file extension");
      }

      savedPath = "/uploads/events/" + uuidv4() + "." + fileExtension;

      uploadPath = __dirname + "/../" + savedPath;
      eventPic.mv(uploadPath, function (err) {
        if (err) return res.status(500).send(err);
      });

      event.image = savedPath ? "http://localhost:5000" + savedPath : "sample";
    }

    event.title = title || event.title;
    event.image =
      req.body?.image && req.body.image.length > 0
        ? req.body.image
        : savedPath
        ? "http://localhost:5000" + savedPath
        : "sample";
    // event.subtitle = subtitle || event.subtitle;
    event.description = description || event.description;
    event.price = price || event.price;
    event.countInStock = countInStock || event.countInStock;
    // event.club = club || event.club;
    // event.category = category || event.category;
    event.location = location || event.location;
    event.startdate = startdate || event.startdate;
    event.enddate = enddate || event.enddate;
    event.starthour = starthour || event.starthour;
    event.endhour = endhour || event.endhour;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});

// export const likeEvent = asyncHandler(async (req, res) => {
//   const event = await Event.findById(req.params.id);

//   if (event) {
//     const alreadyLiked = event.likes.find(
//       (like) => like.toString() === req.user._id.toString()
//     );

//     if (alreadyLiked) {
//       event.likes = event.likes.filter(
//         (like) => like.toString() !== req.user._id.toString()
//       );
//     } else {
//       event.likes.push(req.user._id);
//     }

//     const updatedEvent = await event.save();
//     res.json(updatedEvent);
//   } else {
//     res.status(404);
//     throw new Error("Event not found");
//   }
// });

// export const getLikedEvents = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id);

//   if (user) {
//     return res.json(user.likedEvents);
//   } else {
//     res.status(404);
//     throw new Error("User not found");
//   }
// });

export const updateAttending = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    const alreadyAttending = event.attending.find(
      (attendee) => attendee.toString() === req.user._id.toString()
    );

    if (alreadyAttending) {
      event.attending = event.attending.filter(
        (attendee) => attendee.toString() !== req.user._id.toString()
      );
    } else {
      event.attending.push(req.user._id);
    }

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } else {
    res.status(404);
    throw new Error("Event not found");
  }
});
