import Seat from "./seat.model";
import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../../middleware/httpErrorHandler";

setInterval(async () => {
  try {
    const now = new Date();
    const result = await Seat.updateMany(
      { status: 'reserved', reservedUntil: { $lt: now } },
      { $set: { status: 'available' }, $unset: { reservedBy: '', reservedUntil: '' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Expired seats released: ${result.modifiedCount}`);
    }
  } catch (err) {
    console.error('Error releasing expired seats:', err);
  }
}, 60000);


export const createSeats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { eventID, names } = req.body;

  if (!eventID || !Array.isArray(names) || names.length === 0) {
      const error = new HttpError("Missing eventID or seat names", 400);
    return next(error);
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(eventID)) {
      const error = new HttpError("Invalid eventID", 400);
      return next(error);
    }

    const seatsToCreate = names.map((name) => ({
      eventID: new mongoose.Types.ObjectId(eventID),
      name,
      status: "available",
    }));

    const createdSeats = await Seat.insertMany(seatsToCreate);

    return res
      .status(201)
      .json({ message: "Seats created successfully", seats: createdSeats });
  } catch (error) {
    console.error("Error creating seats:", error);
     const err = new HttpError("Internal server error", 500);
    return next(err);
  }
};

export const getAllSeatsForEvent = async (
  req: Request,
  res: Response,
   next: NextFunction
): Promise<any> => {
  const { eventID } = req.params;

  try {
    const seats = await Seat.aggregate([
      {
        $match: {
          eventID: new mongoose.Types.ObjectId(eventID),
        },
      },
      {
        $addFields: {
          isExpired: {
            $and: [
              { $eq: ["$status", "reserved"] },
              { $lt: ["$reservedUntil", new Date()] },
            ],
          },
        },
      },
      {
        $addFields: {
          currentStatus: {
            $cond: {
              if: { $eq: ["$isExpired", true] },
              then: "expired",
              else: "$status",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          reservedUntil: 1,
          reservedBy: 1,
          eventID: 1,
          updatedAt: 1,
          currentStatus: 1,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    return res.status(200).json({ seats });
  } catch (error) {
     const err = new HttpError("Failed to fetch all seats", 500);
    return next(err);
  }
};
