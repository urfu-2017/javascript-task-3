'use strict';

const MS_IN_MINUTE = 60 * 1000;
const MINUTES_IN_HOUR = 60;

const MONDAY = new Date(Date.UTC(1970, 5, 1, 0, 0));
const THURSDAY = new Date(Date.UTC(1970, 5, 3, 23, 59));

exports.MONDAY = MONDAY;
exports.THURSDAY = THURSDAY;

function toUtcDate(date, timezone) {
    return new Date(date.getTime() - hoursToMs(timezone));
}

exports.toUtcDate = toUtcDate;

function createDate(day, hours, minutes, utcOffset = 0) {
    //  June, 1970 starts with Monday
    return new Date(Date.UTC(1970, 5, day, hours - utcOffset, minutes));
}

exports.createDate = createDate;

function getLaterDate(date, minutesShift) {
    return new Date(date.getTime() + minutesToMs(minutesShift));
}

exports.getLaterDate = getLaterDate;

function minutesToMs(minutes) {
    return minutes * MS_IN_MINUTE;
}

exports.minutesToMs = minutesToMs;

function hoursToMinutes(hours) {
    return hours * MINUTES_IN_HOUR;
}

function hoursToMs(hours) {
    return hours * MINUTES_IN_HOUR * MS_IN_MINUTE;
}

exports.hoursToMs = hoursToMs;

exports.hoursToMinutes = hoursToMinutes;

function formatTime(time) {
    return String(time).padStart(2, '0');
}

exports.formatTime = formatTime;
