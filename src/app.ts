import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { HttpError } from "./middleware/httpErrorHandler";
dotenv.config();

import customerRoutes from "./modules/customers/customer.route";
import seatRoutes from "./modules/seats/seat.route";
import reservationRoutes from "./modules/reservasions/reservation.route";
import orderRoutes from "./modules/orders/order.route";
import eventRoutes from "./modules/events/event.route";

const app = express();

app.use(express.json());

app.use("/api/events", eventRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/orders", orderRoutes);

app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }

  res.status(error.code || 500).json({
    success: false,
    message: error.message || "An unknown error occurred!",
  });
});

const connectDb = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@cluster0.7fveeqd.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`
    );
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

connectDb();

app.listen(process.env.PORT, () => {
  console.log(`App is listening on port ${process.env.PORT}`);
});
