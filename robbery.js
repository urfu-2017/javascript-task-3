'use strict';

const utils = require('./datetime-utils');

const ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];
const DATE_REGEX = /(ПН|ВТ|СР) (\d\d):(\d\d)\+(\d+)/;
const TIMEZONE_REGEX = /.*\+(\d+)/;

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    const [, bankTimezone] = TIMEZONE_REGEX.exec(workingHours.from);
    const bankSchedule = parseBankSchedule(workingHours);
    const gangSchedule = parseGangSchedule(schedule);

    const mergedSchedule = mergeSchedule(gangSchedule);
    const gangFreeTime = getGangFreeTime({
        from: utils.createDate(ROBBERY_DAYS.indexOf('ПН') + 1, 0, 0, bankTimezone),
        to: utils.createDate(ROBBERY_DAYS.indexOf('СР') + 1, 23, 59, bankTimezone)
    }, mergedSchedule);
    const robberyTimes = getRobberyTimes(gangFreeTime, bankSchedule, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(robberyTimes[0]);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!robberyTimes[0]) {
                return '';
            }

            const robberyTime = utils.addMinutesToDate(
                robberyTimes[0].from, utils.hoursToMinutes(bankTimezone));

            return template
                .replace('%HH', utils.formatTime(robberyTime.getHours()))
                .replace('%MM', utils.formatTime(robberyTime.getMinutes()))
                .replace('%DD', ROBBERY_DAYS[robberyTime.getDay() - 1]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }

            const appropriateInterval = robberyTimes[0];
            const newStartTime = utils.addMinutesToDate(appropriateInterval.from, 30);
            const newEndTime = utils.addMinutesToDate(newStartTime, duration);
            if (isTimeInInterval(newEndTime, appropriateInterval)) {
                appropriateInterval.from = newStartTime;

                return true;
            } else if (robberyTimes.length > 1) {
                robberyTimes.shift();

                return true;
            }

            return false;
        }
    };
};

function parseBankSchedule(workingHours) {
    return ROBBERY_DAYS
        .map(day => parseInterval({
            from: `${day} ${workingHours.from}`,
            to: `${day} ${workingHours.to}`
        }));
}

function parseGangSchedule(gangSchedule) {
    return Object.values(gangSchedule)
        .map(banditSchedule => banditSchedule.map(parseInterval));
}

function parseInterval(interval) {
    return {
        from: parseDate(interval.from),
        to: parseDate(interval.to)
    };
}

function parseDate(date) {
    const [, day, hours, minutes, timezone] = DATE_REGEX.exec(date);

    return utils.createDate(ROBBERY_DAYS.indexOf(day) + 1, hours, minutes, timezone);
}

function mergeSchedule(schedule) {
    const sortedIntervals = schedule
        .reduce((result, personalSchedule) => result.concat(personalSchedule))
        .sort((one, other) => one.from - other.from);

    const result = [];
    let previous = sortedIntervals.shift();
    for (const current of sortedIntervals) {
        if (isTimeInInterval(current.from, previous)) {
            previous.to = new Date(Math.max(previous.to, current.to));
        } else {
            result.push(previous);
            previous = current;
        }
    }
    result.push(previous);

    return result;
}

function getGangFreeTime({ from, to }, mergedSchedule) {
    const result = [];
    let interval = { from };

    for (const current of mergedSchedule) {
        interval.to = current.from;
        result.push(interval);
        interval = { from: current.to };
    }
    interval.to = to;
    result.push(interval);

    return result;
}

function getRobberyTimes(gangFreeTime, bankSchedule, duration) {
    const result = [];

    bankSchedule.forEach(workingHours => {
        gangFreeTime.forEach(freeTimeInterval => {
            const intersection = getIntersection(freeTimeInterval, workingHours);
            if (!intersection) {
                return;
            }

            if (isTimeInInterval(
                utils.addMinutesToDate(intersection.from, duration), intersection
            )) {
                result.push(intersection);
            }
        });
    });

    return result;
}

function getIntersection(one, other) {
    if (!areIntervalsIntersected(one, other)) {
        return;
    }

    return {
        from: new Date(Math.max(one.from, other.from)),
        to: new Date(Math.min(one.to, other.to))
    };
}

function areIntervalsIntersected(one, other) {
    return isTimeInInterval(one.from, other) || isTimeInInterval(one.to, other) ||
           one.from < other.from && one.to > other.to;
}

function isTimeInInterval(time, interval) {
    return interval.from <= time && time <= interval.to;
}
