import { NextFunction, Request, Response } from "express";
import Order from "./order.model";
import Reservation from "../reservasions/reservation.model";
import Seat from "../seats/seat.model";
import mongoose from "mongoose";
import { HttpError } from "../../middleware/httpErrorHandler";

export const orderAndBookSeats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { customerID, reservationID, amount, currency } = req.body;

  if (!customerID || !reservationID || !amount || !currency) {
  const error = new HttpError("Missing required fields", 400);
    return next(error);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findById(reservationID).session(
      session
    );
    if (!reservation || reservation.customerID.toString() !== customerID) {
      await session.abortTransaction();
      const error = new HttpError("Reservation not found or not owned by customer", 404);
      return next(error);
    }
    if (reservation.status !== "pending") {
      await session.abortTransaction();
       const error = new HttpError("Reservation is not pending", 400);
      return next(error);
    }
    if (reservation.reservedUntil < new Date()) {
      await session.abortTransaction();
     const error = new HttpError("Reservation has expired", 400);
      return next(error);
    }

    // Create order
    const order = new Order({
      customerID,
      amount,
      currency,
      status: "paid",
    });
    await order.save({ session });

    // Update reservation
    reservation.orderID = order._id;
    reservation.status = "confirmed";
    await reservation.save({ session });

    await Seat.updateMany(
      { _id: { $in: reservation.seatID } },
      {
        $set: { status: "booked" },
        $unset: { reservedBy: "", reservedUntil: "" },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ message: "Order created and seats booked", order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error finalizing order:", error);
    const err = new HttpError("Internal server error", 500);
    return next(err);
  }
};
