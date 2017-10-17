'use strict';

const DATETIME_PATTERN = /^(ПН|ВТ|СР|ЧТ|ВС)?\s?([0-1]?[0-9]|2[0-3]):([0-5][0-9])\+([0-9]|1[0-2])$/;
const DAYS = ['ПН', 'ВТ', 'СР'];
const MAX_MINUTE = 59;
const MAX_HOUR = 23;

exports.compareDatetimes = function (dateTime1, dateTime2) {
    let indexOfDay1 = DAYS.indexOf(dateTime1.day);
    let indexOfDay2 = DAYS.indexOf(dateTime2.day);

    if (this.equals(dateTime1, dateTime2)) {
        return 0;
    }

    return (indexOfDay1 < indexOfDay2 || (indexOfDay2 === indexOfDay1) &&
        ((dateTime1.hours < dateTime2.hours) || (dateTime1.hours === dateTime2.hours) &&
        (dateTime1.minutes < dateTime2.minutes))) ? -1 : 1;
};

exports.equals = function (dateTime1, dateTime2) {
    return dateTime1.hours === dateTime2.hours && dateTime1.minutes === dateTime2.minutes &&
    dateTime1.day === dateTime2.day;
};

exports.parse = function (datetime) {
    let match = DATETIME_PATTERN.exec(datetime);

    return { day: match[1], hours: Number(match[2]),
        minutes: Number(match[3]), timeZone: Number(match[4]) };
};

exports.getElapsedMinutes = function (startDatetime, endDatetime) {
    let startDatetimeMinutes = exports.getElapsedMinutesSinceBeginOfWeek(startDatetime);
    let endDatetimeMinutes = exports.getElapsedMinutesSinceBeginOfWeek(endDatetime);

    return endDatetimeMinutes - startDatetimeMinutes;
};

exports.getElapsedMinutesSinceBeginOfWeek = function (dateTime) {
    return 60 * (DAYS.indexOf(dateTime.day) * 24 + dateTime.hours) + dateTime.minutes;
};

exports.changeTimeZone = function (dateTime, newTimeZone) {
    dateTime.hours += newTimeZone - dateTime.timeZone;
    dateTime.timeZone = newTimeZone;

    if (dateTime.hours > MAX_HOUR) {
        moveOnOneDay(dateTime, 1);
    }

    if (dateTime.hours < 0) {
        moveOnOneDay(dateTime, -1);
    }
};

exports.addMinutes = function (dateTime, minutes) {
    dateTime.minutes += minutes;
    if (dateTime.minutes > MAX_MINUTE) {
        dateTime.hours += Math.floor(dateTime.minutes / (MAX_MINUTE + 1));
        dateTime.minutes = dateTime.minutes % (MAX_MINUTE + 1);
    }

    if (dateTime.hours > MAX_HOUR) {
        dateTime.hours = dateTime.hours % (MAX_HOUR + 1);
        let daysCount = Math.floor(dateTime.hours / (MAX_HOUR + 1));
        for (let i = 0; i < daysCount; i++) {
            moveOnOneDay(dateTime, 1);
        }
    }
};

function moveOnOneDay(dateTime, direction) {
    let indexOfCurrentDay = DAYS.indexOf(dateTime.day);
    if (indexOfCurrentDay + direction < 0) {
        dateTime.day = DAYS[0];
        dateTime.hours = 0;
        dateTime.minutes = 0;
    } else
    if (indexOfCurrentDay + direction >= DAYS.length) {
        dateTime.day = DAYS[DAYS.length - 1];
        dateTime.hours = MAX_HOUR;
        dateTime.minutes = MAX_MINUTE;
    } else {
        dateTime.day = DAYS[indexOfCurrentDay + direction];
        dateTime.hours = dateTime.hours - direction * 24;
    }
}

