import { findAllVeterinarians } from "../models/vetModel.js";

export const getVeterinarians = async (req, res, next) => {
  try {
    const veterinarians = await findAllVeterinarians();
    return res.json(
      veterinarians.map(({ vetId, account }) => ({
        vetId,
        name: `Dr. ${account.firstName} ${account.lastName}`,
      })),
    );
  } catch (error) {
    return next(error);
  }
};
