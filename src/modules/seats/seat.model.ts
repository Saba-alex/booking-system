import { Schema, model } from "mongoose";

const seatSchema = new Schema(
  {
    eventID: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["available", "reserved", "booked"],
      default: "available",
      index: true,
    },
    reservedBy: { type: Schema.Types.ObjectId, ref: "Customer" },
    reservedUntil: { type: Date, index: true },
  },
  { timestamps: true }
);

export default model("Seat", seatSchema);
