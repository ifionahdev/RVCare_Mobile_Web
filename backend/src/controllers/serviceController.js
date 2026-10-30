import { getAllServices } from "../models/serviceModel.js";
export const getServices = async (req, res, next) => {
  try {
    const services = await getAllServices();
    res.json(services);
  } catch (err) {
    next(err);
  }
};