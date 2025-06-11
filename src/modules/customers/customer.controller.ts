import Customer from "./customer.model";
import { Request, Response } from "express";

 const getCustomerById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).send({ message: "Customer not found" });
    }
    return res.status(200).send(customer);
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const createCustomer = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { name, email } = req.body;
  try {
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).send({ message: "Customer already exists" });
    }
    const newCustomer = new Customer({ name, email });
    await newCustomer.save();
    return res
      .status(201)
      .send({ newCustomer, message: "Customer created successfully" });
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

export { getCustomerById, createCustomer };