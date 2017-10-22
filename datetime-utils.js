'use strict';

const MILLISECONDS_IN_MINUTE = 60 * 1000;
const MINUTES_IN_HOUR = 60;

exports.createDate = function createDate(day, hours, minutes, utcOffset = 0) {
    //  June, 1970 starts with Monday
    return new Date(1970, 5, day, hours - utcOffset, minutes);
};

exports.formatTime = time => String(time).padStart(2, '0');

exports.addMinutesToDate = (date, minutes) => {
    return new Date(date.getTime() + minutesToMilliseconds(minutes));
};

function minutesToMilliseconds(minutes) {
    return minutes * MILLISECONDS_IN_MINUTE;
}

exports.minutesToMilliseconds = minutesToMilliseconds;

exports.hoursToMinutes = hours => hours * MINUTES_IN_HOUR;

exports.hoursToMilliseconds = hours => hours * MINUTES_IN_HOUR * MILLISECONDS_IN_MINUTE;
