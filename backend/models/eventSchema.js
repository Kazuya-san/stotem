import mongoose from "mongoose";
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
  },

  //   subtitle: {
  //     type: String,
  //     required: true,
  //   },

  description: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  startdate: {
    type: Date,
    required: true,
  },

  enddate: {
    type: Date,
    required: true,
  },

  starthour: {
    type: String,
    required: true,
  },

  endhour: {
    type: String,
    required: true,
  },

  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

  creatorName: {
    type: String,
    required: true,
  },

  qrCode: {
    type: String,
    required: true,
  },

  // attendees: [
  //   {
  //     userId: {
  //       type: Schema.Types.ObjectId,
  //       ref: "User",
  //     },

  //     name: {
  //       type: String,
  //     },

  //     email: {
  //       type: String,
  //     },

  //     image: {
  //       type: String,
  //     },
  //   },
  // ],

  attendees: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  // likedBy: [
  //   {
  //     userId: {
  //       type: Schema.Types.ObjectId,
  //       ref: "User",
  //     },

  //     name: {
  //       type: String,
  //     },

  //     email: {
  //       type: String,
  //     },

  //     image: {
  //       type: String,
  //     },
  //   },
  // ],

  likedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  location: {
    type: String,
    required: true,
  },

  image: {
    type: String,
    required: true,
  },

  club: {
    type: String,
    required: true,
  },

  //   category: {
  //     type: String,
  //     required: true,
  //   },

  countInStock: {
    type: Number,
    required: true,
  },
});

export default mongoose.model("Event", eventSchema);
