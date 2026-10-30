import { getAvailability } from "../services/availabilityService.js";

export const getAvailableTimeslots = async (req, res, next) => {
  try {
    const availability = await getAvailability({
      scheduledDate: req.query.scheduledDate,
      vetId: req.query.vetId,
    });

    return res.json(availability);
  } catch (error) {
    if (
      error.message === "scheduledDate must use the YYYY-MM-DD format" ||
      error.message === "scheduledDate must be a valid calendar date" ||
      error.message === "vetId must be a positive integer"
    ) {
      return res.status(400).json({ message: error.message });
    }

    return next(error);
  }
};
