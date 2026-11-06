import {
  findSuggestionSchedule,
  findSuggestionVets,
} from "../models/suggestionModel.js";
import {
  parseRequestedHour,
  preferredIsFree,
  recommend,
  validateRequest,
  windowDates,
} from "../scheduling/ctr.js";

const manilaNow = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
};

export const getSuggestions = async ({
  preferredDate,
  preferredTime,
  preferredVetId,
}) => {
  const now = manilaNow();
  const vetIds = await findSuggestionVets();
  const request = {
    date: preferredDate,
    hour: parseRequestedHour(preferredTime),
    vet:
      preferredVetId === undefined ||
      preferredVetId === null ||
      preferredVetId === ""
        ? "Any"
        : preferredVetId === "Any"
          ? "Any"
          : Number(preferredVetId),
  };

  const invalid = validateRequest(request, vetIds, now);
  if (invalid) return { invalid, request };

  const { lo, hi } = windowDates(request, now);
  const schedule = await findSuggestionSchedule({
    fromDate: lo,
    toDate: hi,
    vetIds: request.vet === "Any" ? vetIds : [request.vet],
  });
  const normalizedSchedule = {
    ...schedule,
    occupied: new Set(
      schedule.occupied.map(
        ({ vetId, date, hour }) => `${vetId}|${date}|${hour}`,
      ),
    ),
    blocked: new Set(),
  };

  return {
    request,
    preferredAvailable: preferredIsFree(request, normalizedSchedule, now),
    recommendations: recommend(request, normalizedSchedule, now),
  };
};
