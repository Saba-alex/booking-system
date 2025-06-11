import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    customerID: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default model("Order", orderSchema);
