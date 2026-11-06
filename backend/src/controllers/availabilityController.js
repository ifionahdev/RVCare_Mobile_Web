import { getAvailability } from "../services/availabilityService.js";
import { getSuggestions } from "../services/suggestionService.js";

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

export const suggestAvailability = async (req, res, next) => {
  const {
    request_id: requestId,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    preferred_vet_id: preferredVetId,
  } = req.body ?? {};

  if (
    typeof requestId !== "string" ||
    requestId.trim() === "" ||
    typeof preferredDate !== "string" ||
    typeof preferredTime !== "string"
  ) {
    return res.status(400).json({
      request_id: requestId ?? null,
      status: "invalid_request",
      recommendations: [],
      error: {
        code: "INVALID_REQUEST",
        message:
          "request_id, preferred_date, and preferred_time are required.",
      },
    });
  }

  try {
    const result = await getSuggestions({
      preferredDate,
      preferredTime,
      preferredVetId,
    });

    if (result.invalid) {
      return res.status(400).json({
        request_id: requestId,
        status: "invalid_request",
        recommendations: [],
        error: {
          code: result.invalid,
          message: "Request is outside what can be booked.",
        },
      });
    }

    if (result.preferredAvailable) {
      return res.json({
        request_id: requestId,
        status: "success",
        preferred_available: true,
        recommendations: [],
        error: null,
      });
    }

    return res.json({
      request_id: requestId,
      status: result.recommendations.length ? "success" : "no_availability",
      preferred_available: false,
      recommendations: result.recommendations,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
};
