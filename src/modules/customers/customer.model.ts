import { Schema, model } from "mongoose";

const customerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default model("Customer", customerSchema);
