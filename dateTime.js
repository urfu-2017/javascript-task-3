'use strict';

const DATETIME_PATTERN = /^(ПН|ВТ|СР|ЧТ|ВС)?\s?([0-1]?[0-9]|2[0-3]):([0-5][0-9])\+([0-9]|1[0-2])$/;
const DAYS = ['ПН', 'ВТ', 'СР'];
const MAX_MINUTE = 60;
const MINUTES_IN_DAY = 24 * MAX_MINUTE;
const DEADLINE = 3 * MINUTES_IN_DAY;

exports.DAYS = DAYS;
exports.DEADLINE = DEADLINE;

exports.parse = function (datetime) {
    let match = DATETIME_PATTERN.exec(datetime);

    return {
        day: match[1],
        hours: Number(match[2]),
        minutes: Number(match[3]),
        timeZone: Number(match[4])
    };
};

exports.getElapsedMinutes = function (startDatetime, endDatetime) {
    let startDatetimeMinutes = exports.getElapsedMinutesSinceBeginOfWeek(startDatetime);
    let endDatetimeMinutes = exports.getElapsedMinutesSinceBeginOfWeek(endDatetime);

    return endDatetimeMinutes - startDatetimeMinutes;
};

exports.getElapsedMinutesSinceBeginOfWeek = function (dateTime) {
    return MAX_MINUTE * (DAYS.indexOf(dateTime.day) * 24 + dateTime.hours) + dateTime.minutes;
};

exports.changeTimeZone = function (timeInterval, newTimeZone) {
    let shiftInMinutes = 60 * (newTimeZone - timeInterval.timeZone);
    timeInterval.from = Math.max(timeInterval.from + shiftInMinutes, 0);
    timeInterval.to = Math.min(DEADLINE, timeInterval.to + shiftInMinutes);
    timeInterval.timeZone = newTimeZone;
};

exports.toDateTime = function (minutesSinceStartOfWeek) {
    let daysCount = Math.floor(minutesSinceStartOfWeek / MINUTES_IN_DAY);

    return {
        minutes: Math.floor(minutesSinceStartOfWeek % MINUTES_IN_DAY) % MAX_MINUTE,
        hours: Math.floor(minutesSinceStartOfWeek % MINUTES_IN_DAY / MAX_MINUTE),
        day: DAYS[daysCount]
    };
};

