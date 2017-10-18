'use strict';


const DATETIME_PATTERN =
    /^(ПН|ВТ|СР|ЧТ|ПТ|СБ|ВС)?\s?([0-1][0-9]|2[0-3]):([0-5][0-9])\+([0-9]|1[0-2])$/;
const DAYS = ['ПН', 'ВТ', 'СР'];
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
function parseTime(time) {
    time = DATETIME_PATTERN.exec(time);

    return { day: time[1], hours: Number(time[2]),
        minutes: Number(time[3]), timeZone: Number(time[4]) };
}

function parseTimeInterval(timeInterval) {
    return { from: parseTime(timeInterval.from), to: parseTime(timeInterval.to) };
}

function getIntervalInMinutes(interval, timeZone) {
    let timeZoneShift = timeZone ? timeZone - Number(interval.from.timeZone) : 0;
    let start = DAYS.indexOf(interval.from.day) * MINUTES_IN_DAY +
        (interval.from.hours + timeZoneShift) * MINUTES_IN_HOUR +
        interval.from.minutes;
    let end = DAYS.indexOf(interval.to.day) * MINUTES_IN_DAY +
        (interval.to.hours + timeZoneShift) * MINUTES_IN_HOUR +
        interval.to.minutes;

    return { start: start, end: end };
}
function include(interval, anotherInterval) {
    return interval.start <= anotherInterval.start && interval.end >= anotherInterval.end;
}

function isIntersect(interval, anotherInterval) {
    return include(interval, anotherInterval) || include(anotherInterval, interval) ||
        (interval.start < anotherInterval.start && interval.end > anotherInterval.start) ||
        (interval.end > anotherInterval.end && interval.start < anotherInterval.end);
}

function changeInterval(banksInterval, robbersInterval) {
    if (include(banksInterval, robbersInterval)) {
        return [{ start: banksInterval.start, end: robbersInterval.start },
            { start: robbersInterval.end, end: banksInterval.end }];
    } else if (banksInterval.start <= robbersInterval.end) {
        return [{ start: robbersInterval.end, end: banksInterval.end }];
    } else if (banksInterval.end >= robbersInterval.start) {
        return [{ start: banksInterval.start, end: robbersInterval.start }];
    }
}

function intersect(banksIntervals, robbersInterval) {
    let intervalList = [];
    for (let banksInterval of banksIntervals) {
        if (!isIntersect(robbersInterval, banksInterval)) {
            intervalList.push(banksInterval);
            continue;
        }
        if (include(robbersInterval, banksInterval)) {
            continue;
        }
        intervalList = intervalList.concat(changeInterval(banksInterval, robbersInterval));
    }

    return intervalList;
}

function compareIntervals(a, b) {
    if (a.start === b.start) {
        return 0;
    }

    return a.start > b.start ? 1 : -1;
}

function getBanksSchedule(banksWorkingHours) {
    return DAYS.map(day => {
        return {
            from:
            { day: day, hours: banksWorkingHours.from.hours,
                minutes: banksWorkingHours.from.minutes, timeZone: banksWorkingHours.from.timeZone
            },
            to:
            { day: day, hours: banksWorkingHours.to.hours,
                minutes: banksWorkingHours.to.minutes, timeZone: banksWorkingHours.to.timeZone
            }
        };
    });
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    // console.info(schedule, duration, workingHours);
    let banksWorkingHours = parseTimeInterval(workingHours);
    let banksTimeZone = banksWorkingHours.to.timeZone;
    let banksSchedule = getBanksSchedule(banksWorkingHours);
    let intervalsForRobbery = [];
    for (let interval of banksSchedule) {
        intervalsForRobbery.push(getIntervalInMinutes(interval, banksTimeZone));
    }
    let intervalsRobbers = [];
    Object.keys(schedule).forEach((person) => {
        schedule[person].forEach((interval) => {
            intervalsRobbers.push(getIntervalInMinutes(parseTimeInterval(interval), banksTimeZone));
        });
    });

    intervalsRobbers.forEach(robbersInterval => {
        intervalsForRobbery = intersect(intervalsForRobbery, robbersInterval);
    });

    intervalsForRobbery = intervalsForRobbery
        .filter(interval => interval.end - interval.start >= duration)
        .sort(compareIntervals);

    console.info(intervalsForRobbery);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return intervalsForRobbery.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (intervalsForRobbery.length === 0) {
                return '';
            }

            return formatOutput(template, convertToTime(intervalsForRobbery[0].start));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (intervalsForRobbery.length === 0) {
                return false;
            }
            intervalsForRobbery[0].start += 30;
            let postponedIntervalsForRobbery = intervalsForRobbery
                .filter(interval => interval.end - interval.start >= duration);
            if (postponedIntervalsForRobbery.length !== 0) {
                intervalsForRobbery = postponedIntervalsForRobbery;

                return true;
            }
            intervalsForRobbery[0].start -= 30;

            return false;

        }
    };
};

function convertToTime(time) {
    let daysNumber = Math.floor(time / (MINUTES_IN_DAY));
    let day = DAYS[daysNumber];
    let minutes = time % (MINUTES_IN_HOUR);
    let hours = Math.floor((time - daysNumber * MINUTES_IN_DAY) / MINUTES_IN_HOUR);

    return { day, minutes, hours };
}

function formatOutput(template, robberyStartTime) {
    let minutes = (robberyStartTime.minutes >= 10 ? '' : '0') + robberyStartTime.minutes;
    let hours = (robberyStartTime.hours >= 10 ? '' : '0') + robberyStartTime.hours;

    return template
        .replace('%HH', hours)
        .replace('%MM', minutes)
        .replace('%DD', robberyStartTime.day);
}
