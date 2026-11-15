const parseDateOfBirth = (value) => {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number(value.slice(0, 4)) < 1900 ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    date > new Date()
  ) {
    return undefined;
  }
  return date;
};

export const readCustomerProfileUpdate = (body) => {
  const firstName =
    typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName =
    typeof body?.lastName === "string" ? body.lastName.trim() : "";
  const dateOfBirth = parseDateOfBirth(body?.dateOfBirth);

  if (
    !firstName ||
    firstName.length > 100 ||
    !lastName ||
    lastName.length > 100 ||
    dateOfBirth === undefined
  ) {
    return {
      error: "Enter valid first and last names and a valid birthday.",
    };
  }

  return { firstName, lastName, dateOfBirth };
};
