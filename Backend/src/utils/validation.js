const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toPositiveInteger = (value) => {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value.trim())) {
    return null;
  }

  return Number(value);
};

const parseDate = (value, label) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return {
      error: `${label} must use YYYY-MM-DD format`,
    };
  }

  return { value };
};

const parseTime = (value, label) => {
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) {
    return {
      error: `${label} must use HH:mm 24-hour format`,
    };
  }

  return { value };
};

const toDate = (value, label) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      error: `${label} must be a valid date-time`,
    };
  }

  return {
    value: date,
  };
};

const addHours = (date, hours) =>
  new Date(date.getTime() + hours * 60 * 60 * 1000);

const buildBookingWindow = (input = {}, options = {}) => {
  const now = options.now || new Date();
  const defaultDurationHours = options.defaultDurationHours || 1;

  const hasIsoWindow = input.slot_start !== undefined || input.slot_end !== undefined;
  const hasLocalWindow =
    input.booking_date !== undefined ||
    input.start_time !== undefined ||
    input.end_time !== undefined;

  if (!hasIsoWindow && !hasLocalWindow) {
    return {
      value: {
        slot_start: now,
        slot_end: addHours(now, defaultDurationHours),
      },
    };
  }

  let slotStart;
  let slotEnd;

  if (hasIsoWindow) {
    if (!input.slot_start || !input.slot_end) {
      return {
        error: "slot_start and slot_end are required together",
      };
    }

    const parsedStart = toDate(input.slot_start, "slot_start");
    if (parsedStart.error) return parsedStart;

    const parsedEnd = toDate(input.slot_end, "slot_end");
    if (parsedEnd.error) return parsedEnd;

    slotStart = parsedStart.value;
    slotEnd = parsedEnd.value;
  } else {
    if (!input.booking_date || !input.start_time || !input.end_time) {
      return {
        error: "booking_date, start_time, and end_time are required together",
      };
    }

    const parsedDate = parseDate(input.booking_date, "booking_date");
    if (parsedDate.error) return parsedDate;

    const parsedStartTime = parseTime(input.start_time, "start_time");
    if (parsedStartTime.error) return parsedStartTime;

    const parsedEndTime = parseTime(input.end_time, "end_time");
    if (parsedEndTime.error) return parsedEndTime;

    const parsedStart = toDate(
      `${parsedDate.value}T${parsedStartTime.value}:00`,
      "start_time"
    );
    if (parsedStart.error) return parsedStart;

    const parsedEnd = toDate(
      `${parsedDate.value}T${parsedEndTime.value}:00`,
      "end_time"
    );
    if (parsedEnd.error) return parsedEnd;

    slotStart = parsedStart.value;
    slotEnd = parsedEnd.value;
  }

  if (slotEnd <= slotStart) {
    return {
      error: "slot_end must be after slot_start",
    };
  }

  return {
    value: {
      slot_start: slotStart,
      slot_end: slotEnd,
    },
  };
};

module.exports = {
  buildBookingWindow,
  toPositiveInteger,
};
