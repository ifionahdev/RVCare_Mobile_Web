import {
  findCustomerByAccount,
  getCustomerCount as countCustomers,
} from "../models/customerModel.js";

export const getMyProfile = async (req, res, next) => {
  try {
    const customer = await findCustomerByAccount(req.user.accountId);

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found." });
    }

    return res.json(customer);
  } catch (error) {
    return next(error);
  }
};

export const getCustomerCount = async (req, res, next) => {
  try {
    const count = await countCustomers();
    return res.json({ count });
  } catch (error) {
    return next(error);
  }
};