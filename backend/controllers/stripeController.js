import asyncHandler from "express-async-handler";
import User from "../models/userSchema.js";
import Event from "../models/eventSchema.js";
import dotenv from "dotenv";

dotenv.config();
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
let signingsecret = process.env.STRIPE_SIGN_SECRET;

export const webhookCheckout = asyncHandler(async (request, response) => {
  const payload = request.body;
  const sig = request.headers["stripe-signature"];

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(payload, sig, signingsecret);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  //console log the metadata

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const { userId, eventId } = session.metadata;

    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (user && event) {
      // user.boughtTickets.push({
      //   eventId: eventId,
      //   title: event.title,
      //   price: event.price,
      //   startdate: event.startdate,
      //   enddate: event.enddate,
      //   starthour: event.starthour,
      //   endhour: event.endhour,
      // });

      user.boughtTickets.push(eventId);

      // console.log(user.boughtTickets);

      const updatedUser = await user.updateOne({
        boughtTickets: user.boughtTickets,
      });

      if (updatedUser) {
        // event.attendees.push({
        //   userId: userId,
        //   name: user.name,
        //   email: user.email,
        //   image: user.profilePicture,
        // });

        event.attendees.push(userId);

        // console.log(event.attendees, "attendees");

        if (event.countInStock > 0) {
          event.countInStock = event.countInStock - 1;
        }

        const updatedEvent = await event.updateOne({
          attendees: event.attendees,
          countInStock: event.countInStock,
        });

        if (updatedEvent) {
          response.json(updatedUser);
        }
      }
    }
  }

  response.status(200);
});
