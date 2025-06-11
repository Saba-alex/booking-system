import { NextFunction, Request, Response } from "express";
import Reservation from "./reservation.model";
import mongoose from "mongoose";
import Seat from "../seats/seat.model";
import { HttpError } from "../../middleware/httpErrorHandler";

const RESERVATION_EXPIRY_MINUTES = 2;

export const createReservation = async (
  req: Request,
  res: Response,
   next: NextFunction
): Promise<any> => {
  const { customerID, eventID, seatID } = req.body;

  if (
    !customerID ||
    !eventID ||
    !Array.isArray(seatID) ||
    seatID.length === 0
  ) {
   const error = new HttpError("Missing required fields", 400);
    return next(error);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const now = new Date();
    const reservedUntil = new Date(
      now.getTime() + RESERVATION_EXPIRY_MINUTES * 60000
    );

    //Find seats and check availability or expired
    const seats = await Seat.find({
      _id: { $in: seatID },
      eventID,
      $or: [
        { status: "available" },
        {
          status: "reserved",
          reservedUntil: { $lt: now }, // expired locks
        },
      ],
    }).session(session);

    if (seats.length !== seatID.length) {
      // Some seats are already booked or locked by others and not expired
      await session.abortTransaction();
      session.endSession();
      const error = new HttpError("Some seats are not available", 409);
      return next(error);
    }

   // Lock seats atomically
    const seatUpdateResult = await Seat.updateMany(
      {
        _id: { $in: seatID },
        $or: [
          { status: "available" },
          {
            status: "reserved",
            reservedUntil: { $lt: now },
          },
        ],
      },
      {
        $set: {
          status: "reserved",
          reservedBy: customerID,
          reservedUntil: reservedUntil,
        },
      },
      { session }
    );

    if (seatUpdateResult.modifiedCount !== seatID.length) {
      // Conflict happened during update
      await session.abortTransaction();
      session.endSession();
     const error = new HttpError(
        "Failed to lock all seats, please try again",
        409
      );
      return next(error);
    }

    //Create reservation document
    const reservation = new Reservation({
      customerID,
      eventID,
      seatID,
      status: "pending",
      reservedUntil,
    });

    await reservation.save({ session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json({ message: "Seats reserved successfully", reservation });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating reservation:", error);
    const err = new HttpError("Internal server error", 500);
    return next(err);
  }
};

export const confirmReservation = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { reservationID } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findById(reservationID).session(
      session
    );

    if (!reservation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Reservation is not pending" });
    }

    if (reservation.reservedUntil && reservation.reservedUntil < new Date()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Reservation has expired" });
    }

    // Mark seats as booked
    await Seat.updateMany(
      { _id: { $in: reservation.seatID } },
      {
        $set: { status: "booked" },
        $unset: { reservedBy: "", reservedUntil: "" },
      },
      { session }
    );

    // Update reservation
    reservation.status = "confirmed";
    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ message: "Reservation confirmed and seats booked" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error confirming reservation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
