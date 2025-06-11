import { Schema, model } from "mongoose";

const reservationSchema = new Schema(
  {
    customerID: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    eventID: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    seatID: [{ type: Schema.Types.ObjectId, ref: "Seat", required: true }],
    orderID: { type: Schema.Types.ObjectId, ref: "Order", required: false },
    status: {
      type: String,
      enum: ["pending", "confirmed", "expired"],
      default: "pending",
      index: true,
    },
    reservedUntil: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export default model("Reservation", reservationSchema);
