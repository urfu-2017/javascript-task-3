'use strict';

const MILLISECONDS_IN_MINUTE = 60 * 1000;
const MINUTES_IN_HOUR = 60;

function createDate(day, hours, minutes, utcOffset = 0) {
    //  June, 1970 starts with Monday
    return new Date(1970, 5, day, hours - utcOffset, minutes);
}

exports.createDate = createDate;

function addMinutesToDate(date, minutes) {
    return new Date(date.getTime() + minutesToMilliseconds(minutes));
}

exports.addMinutesToDate = addMinutesToDate;

function minutesToMilliseconds(minutes) {
    return minutes * MILLISECONDS_IN_MINUTE;
}

exports.minutesToMilliseconds = minutesToMilliseconds;

function hoursToMinutes(hours) {
    return hours * MINUTES_IN_HOUR;
}

exports.hoursToMinutes = hoursToMinutes;

function hoursToMilliseconds(hours) {
    return hours * MINUTES_IN_HOUR * MILLISECONDS_IN_MINUTE;
}

exports.hoursToMilliseconds = hoursToMilliseconds;

function formatTime(time) {
    return String(time).padStart(2, '0');
}

exports.formatTime = formatTime;
