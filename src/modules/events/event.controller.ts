import { NextFunction, Request, Response } from "express";
import Event from "./event.model";
import { HttpError } from "../../middleware/httpErrorHandler";

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { name, code } = req.body;

    const existingCode = await Event.findOne({ code });
    if (existingCode) {
      const error = new HttpError("Event code already exists", 400);
      return next(error);
    }

    const event = new Event({ name, code });
    await event.save();

    return res.status(201).json({ message: "Event created", event });
  } catch (error) {
    const err = new HttpError("Internal Server Error", 500);
    return next(err);
  }
};

export const getAllEvents = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const events = await Event.find();
    return res.status(200).json(events);
  } catch (error) {
    const err = new HttpError("Internal Server Error", 500);
    return next(err);
  }
};
