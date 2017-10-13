'use strict';

const MONDAY = new Date(Date.UTC(1970, 5, 1, 0, 0));
const THURSDAY = new Date(Date.UTC(1970, 5, 4, 0, 0));

exports.MONDAY = MONDAY;
exports.THURSDAY = THURSDAY;

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
    return minutes * 60 * 1000;
}

exports.minutesToMs = minutesToMs;

function hoursToMinutes(hours) {
    return hours * 60;
}

exports.hoursToMinutes = hoursToMinutes;

function formatTime(time) {
    return String(time).padStart(2, '0');
}

exports.formatTime = formatTime;
