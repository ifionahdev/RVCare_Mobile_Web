
import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Authentication required.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    const role = payload.role;

    const profileKeys = {
      admin: "adminId",
      vet: "vetId",
      customer: "ownerId",
    };

    const profileKey = profileKeys[role];
    const accountId = Number(payload.sub);
    const profileId = profileKey
      ? Number(payload[profileKey])
      : NaN;

    if (
      !Number.isSafeInteger(accountId) ||
      !Number.isSafeInteger(profileId) ||
      accountId <= 0 ||
      profileId <= 0
    ) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    req.user = {
      accountId,
      role,
      profileId,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired session.",
    });
  }
};
