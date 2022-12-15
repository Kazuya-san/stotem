import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },

    isOrganizer: {
      type: Boolean,
      required: true,
      default: false,
    },

    // likedEvents: [
    //   {
    //     eventId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Event",
    //     },

    //     title: {
    //       type: String,
    //     },

    //     price: {
    //       type: Number,
    //     },

    //     startdate: {
    //       type: Date,
    //     },

    //     enddate: {
    //       type: Date,
    //     },

    //     starthour: {
    //       type: String,
    //     },

    //     endhour: {
    //       type: String,
    //     },

    //     location: {
    //       type: String,
    //     },

    //     subtitle: {
    //       type: String,
    //     },
    //   },
    // ],

    likedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],

    createdEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],

    boughtTickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],

    // boughtTickets: [
    //   {
    //     eventId: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Event",
    //     },

    //     title: {
    //       type: String,
    //     },

    //     price: {
    //       type: Number,
    //     },

    //     startdate: {
    //       type: Date,
    //     },

    //     enddate: {
    //       type: Date,
    //     },

    //     starthour: {
    //       type: String,
    //     },

    //     endhour: {
    //       type: String,
    //     },
    //   },
    // ],

    gender: {
      type: String,
      required: false,
    },

    program: {
      type: String,
      required: false,
    },

    profilePicture: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
