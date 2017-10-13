'use strict';

const utils = require('./datetime_utils');

const ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];
const DATE_REGEX = /(ПН|ВТ|СР)? ?(\d\d):(\d\d)\+(\d+)/;
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
    const gangFreeTime = getComplement({
        from: utils.createDate(ROBBERY_DAYS.indexOf('ПН'), 0, 0, bankTimezone),
        to: utils.createDate(ROBBERY_DAYS.indexOf('СР'), 23, 59, bankTimezone)
    }, mergedSchedule);
    const robberyTimes = getRobberyTimes(gangFreeTime, bankSchedule, duration);
    // console.info(robberyTimes);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (!robberyTimes[0]) {
                return false;
            }

            return true;
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

            const robberyTime = utils.getLaterDate(
                robberyTimes[0].from, utils.hoursToMinutes(bankTimezone));

            return template
                .replace('%HH', utils.formatTime(robberyTime.getUTCHours()))
                .replace('%MM', utils.formatTime(robberyTime.getUTCMinutes()))
                .replace('%DD', ROBBERY_DAYS[robberyTime.getUTCDay() - 1]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (this.exists()) {
                const appropriateInterval = robberyTimes[0];
                const newStartTime = utils.getLaterDate(appropriateInterval.from, 30);
                const newEndTime = utils.getLaterDate(newStartTime, duration);
                if (isTimeInInterval(newEndTime, appropriateInterval)) {
                    appropriateInterval.from = newStartTime;

                    return true;
                } else if (robberyTimes.length > 1) {
                    robberyTimes.shift();

                    return true;
                }
            }

            return false;
        }
    };
};

function getRobberyTimes(gangFreeTime, bankSchedule, duration) {
    const result = [];

    bankSchedule.forEach(workingHours => {
        gangFreeTime.forEach(freeTimeInterval => {
            const intersection = getIntersection(freeTimeInterval, workingHours);
            if (!intersection) {
                return;
            }

            if (isTimeInInterval(utils.getLaterDate(intersection.from, duration), intersection)) {
                result.push(intersection);
            }
        });
    });

    return result;
}

function areIntervalsIntersected(one, other) {
    return isTimeInInterval(one.from, other) || isTimeInInterval(one.to, other) ||
           one.from < other.from && one.to > other.to;
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

function getComplement({ from: start, to: end }, otherIntervals) {
    const result = [];
    let interval = { from: start };

    for (const current of otherIntervals) {
        interval.to = current.from;
        result.push(interval);
        interval = { from: current.to };
    }
    interval.to = end;
    result.push(interval);

    return result;
}

function parseBankSchedule(workingHours) {
    return ROBBERY_DAYS
        .map(day => {
            return {
                from: `${day} ${workingHours.from}`,
                to: `${day} ${workingHours.to}`
            };
        })
        .map(parseInterval);
}

function parseGangSchedule(gangSchedule) {
    return Object.values(gangSchedule)
        .map(banditSchedule => {
            return banditSchedule.map(parseInterval);
        });
}

function parseInterval(interval) {
    return {
        from: parseDate(interval.from),
        to: parseDate(interval.to)
    };
}

function mergeSchedule(schedule) {
    const sortedIntervals = schedule
        .reduce((generalSchedule, personalSchedule) => {
            return generalSchedule.concat(personalSchedule);
        })
        .sort((one, other) => one.from - other.from);

    return mergeIntervals(sortedIntervals);
}

function mergeIntervals(intervals) {
    const result = [];
    let previous = intervals[0];
    for (let i = 1; i < intervals.length; i++) {
        let current = intervals[i];
        if (isTimeInInterval(current.from, previous)) {
            previous.to = current.to;
        } else {
            result.push(previous);
            previous = current;
        }
    }
    result.push(previous);

    return result;
}

function isTimeInInterval(time, interval) {
    return interval.from <= time && time <= interval.to;
}

function parseDate(date) {
    const match = DATE_REGEX.exec(date);
    const [, day, hours, minutes, timezone] = match;

    return utils.createDate(ROBBERY_DAYS.indexOf(day) + 1, hours, minutes, timezone);
}
