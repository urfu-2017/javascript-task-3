'use strict';

exports.DAYS_OF_THE_WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

exports.convertToMinutes = function (time) {
    let pattern = /(\d\d):(\d\d)/;
    let [hours, minutes] = time.match(pattern).slice(1, 3);
    let timeInMinutes = parseInt(hours) * 60 + parseInt(minutes);

    return timeInMinutes;
};

exports.convertMinutesToTime = function (minutes, day, timezone) {
    let hours = Math.floor(minutes / 60);
    let minutesReminders = minutes % 60;

    return day + ' ' + numberToTimeString(hours) + ':' +
        numberToTimeString(minutesReminders) + timezone;
};

exports.getMinutes = function (time) {
    return time.slice(6, 8);
};

exports.getHours = function (time) {
    return time.slice(3, 5);
};

exports.getDay = function (time) {
    return time.slice(0, 2);
};

exports.getTimezone = function (time) {
    return time.slice(-2);
};

exports.convertToTimeZone = function (time, timezone) {
    let oldTimezone = exports.getTimezone(time);
    let difference = parseInt(timezone) - parseInt(oldTimezone);
    let newHours = parseInt(exports.getHours(time)) + difference;
    time = exports.getDay(time) + ' ' + numberToTimeString(newHours) +
        ':' + exports.getMinutes(time) + timezone;

    return exports.normilizeTime(time);
};

function numberToTimeString(value) {
    return value < 10 ? '0' + value : value;
}

exports.normilizeTime = function (time) {
    let hours = exports.getHours(time);
    let dayIndex = exports.DAYS_OF_THE_WEEK.indexOf(exports.getDay(time));
    if (hours > 23) {
        hours -= 24;

        return exports.DAYS_OF_THE_WEEK[dayIndex + 1] + ' ' +
            numberToTimeString(hours) + time.slice(5);
    }
    if (hours < 0) {
        hours = 24 + hours;

        return exports.DAYS_OF_THE_WEEK[dayIndex - 1] + ' ' +
            numberToTimeString(hours) + time.slice(5);
    }

    return time;
};
