'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const TRY_LATER_TIME = 30;
const DAY_TO_INT = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const HOUR_AS_MINUTES = 60;
const DAY_AS_HOURS = 24;
const DAY_AS_MINUTES = DAY_AS_HOURS * HOUR_AS_MINUTES;
const ROBBERY_START_DAY = 'ПН';
const ROBBERY_END_DAY = 'СР';

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);

    const robberyData = {};
    const robberyInterval = { from: ROBBERY_START_DAY, to: ROBBERY_END_DAY };

    const [robberyIntervals, timezone] = getPossibleIntervals(workingHours, robberyInterval);
    const thiefBusyIntervals = getThiefBusyIntervals(schedule, timezone);
    const thiefReadinessIntervals = invertTimeIntervals(thiefBusyIntervals);

    robberyData.possibleIntervals = getIntervalsIntersection(
        robberyIntervals,
        thiefReadinessIntervals
    );

    robberyData.satisfyingIntervals = robberyData
        .possibleIntervals
        .filter(x => x.to - x.from + 1 >= duration);

    robberyData.intervalIndex = robberyData
        .satisfyingIntervals
        .findIndex(x => x.to - x.from + 1 >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyData.satisfyingIntervals.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            const searchResult = robberyData.satisfyingIntervals[robberyData.intervalIndex];
            if (!searchResult) {
                return '';
            }
            const robberyStartTime = searchResult.from;
            const [days, hours, minutes] = minutesToTime(robberyStartTime);

            return template
                .replace(/%DD/, Object.keys(DAY_TO_INT).find(key => DAY_TO_INT[key] === days))
                .replace(/%HH/, ('0' + hours).slice(-2))
                .replace(/%MM/, ('0' + minutes).slice(-2));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyData.intervalIndex < 0) {
                return false;
            }
            robberyData.satisfyingIntervals[robberyData.intervalIndex].from += TRY_LATER_TIME;
            const nextItem = robberyData
                .satisfyingIntervals
                .findIndex(x => x.to - x.from + 1 >= duration);
            if (nextItem >= 0) {
                robberyData.intervalIndex = nextItem;

                return true;
            }
            robberyData.satisfyingIntervals[robberyData.intervalIndex].from -= TRY_LATER_TIME;

            return false;
        }
    };
};

/*
class RobberyData {
    constructor(schedule, duration, workingHours, robberyInterval) {
        this.robberyData = {};
        this.robberyInterval = robberyInterval;
        this.workingHours = workingHours;
        this.duration = duration;
        this.schedule = schedule;
    }

    getRobberyIntervals() {
const [intervals, timezone] = this.getPossibleIntervals(this.workingHours, this.robberyInterval);
        const thiefBusyIntervals = this.getThiefBusyIntervals(this.schedule, timezone);
        const thiefReadinessIntervals = invertTimeIntervals(thiefBusyIntervals);
this.robberyData.possibleIntervals = getIntervalsIntersection(intervals, thiefReadinessIntervals);
    }

    find


}*/

/**
 * Возвращает интервалы, в которые возможно совершить ограбления банка,
 * и их временную зону
 * @param {Array} workingHours
 * @param {Object} robberyInterval - Пределы ограбления
 * @param {String} robberyInterval.from – Время открытия интервала ограбления
 * @param {String} robberyInterval.to – Время закрытия интервала ограбления
 * @returns {Array} - интервалы ограбления банка
 * @returns {Number} - временная зона банка
 */
function getPossibleIntervals(workingHours, robberyInterval) {
    let intervals = [];
    const startDayNumber = DAY_TO_INT[robberyInterval.from];
    const endDayNumber = DAY_TO_INT[robberyInterval.to];
    const [hoursFrom, minutesFrom, baseTimezone] = parseTime(workingHours.from);
    const [hoursTo, minutesTo] = parseTime(workingHours.to);

    for (let dayNumber = startDayNumber; dayNumber <= endDayNumber; dayNumber++) {
        const from = timeToMinutes(dayNumber, hoursFrom, minutesFrom);
        const to = timeToMinutes(dayNumber, hoursTo, minutesTo - 1);
        intervals.push({ from, to });
    }

    return [intervals, baseTimezone];
}

/**
 * Возвращает интервалы занятости грабителей приведенные к базовой временной зоне
 * @param {Array} schedule
 * @param {Number} baseTimezone
 * @returns {Array} - интервалы занятости грабителей
 */
function getThiefBusyIntervals(schedule, baseTimezone) {
    let thiefsBusyIntervals = Object.keys(schedule).reduce(function (intervals, name) {
        let thiefBusyIntervals = schedule[name].map(function (interval) {
            const [weekDayNumberFrom, hoursFrom, minutesFrom, timezone] = parseTime(interval.from);
            const [weekDayNumberTo, hoursTo, minutesTo] = parseTime(interval.to);
            const timeDifference = baseTimezone - timezone;
            const from = timeToMinutes(weekDayNumberFrom, hoursFrom + timeDifference, minutesFrom);
            const to = timeToMinutes(weekDayNumberTo, hoursTo + timeDifference, minutesTo);

            return { from, to };
        });

        return intervals.concat(thiefBusyIntervals);
    }, []);

    return combineIntervals(thiefsBusyIntervals);
}

function timeToMinutes(days, hours, minutes) {
    return (days * DAY_AS_HOURS + hours) * HOUR_AS_MINUTES + minutes;
}

function minutesToTime(timeAsMinutes) {
    const days = Math.floor(timeAsMinutes / (DAY_AS_MINUTES));
    const hours = Math.floor((timeAsMinutes - days * DAY_AS_MINUTES) / HOUR_AS_MINUTES);
    const minutes = timeAsMinutes - days * DAY_AS_MINUTES - hours * HOUR_AS_MINUTES;

    return [days, hours, minutes];
}


/**
 * Склеивает пересекающиеся интервалы
 * @param {Array} intervals
 * @returns {Array} - склеенные интервалы
 */
function combineIntervals(intervals) {
    const sortedIntervals = sortIntervals(intervals);
    let combinedIntervals = [];
    for (let i = 0; i < sortedIntervals.length; i++) {
        const current = sortedIntervals[i];
        const overlappingIntervals = sortedIntervals
            .filter(x => current.from <= x.from && x.from <= current.to + 1);
        const intervalsBorder = Math.max(...overlappingIntervals.map(x => x.to));
        combinedIntervals.push({ from: current.from, to: intervalsBorder });
        i += overlappingIntervals.length - 1;
    }

    return combinedIntervals;
}

/**
 * Инвертирует интервалы
 * @param {Array} intervals
 * @returns {Array}
 */
function invertTimeIntervals(intervals) {
    let previousEndPos = -Infinity;
    let invertedIntervals = intervals.map(function (interval) {
        const invertedInterval = { from: previousEndPos, to: interval.from - 1 };
        previousEndPos = interval.to;

        return invertedInterval;
    });
    invertedIntervals.push({ from: previousEndPos, to: Infinity });

    return invertedIntervals;
}

/**
 * Получение пересечения интервалов работы банка и незанятости воров
 * @param {Array} bankIntervals
 * @param {Array} thiefIntervals
 * @returns {Array}
 */
function getIntervalsIntersection(bankIntervals, thiefIntervals) {
    let intervalIntersections = bankIntervals.reduce(function (intersections, bankInterval) {
        return intersections.concat(findIntersections(bankInterval, thiefIntervals));
    }, []);

    return combineIntervals(intervalIntersections);
}

/**
 * Получение пересечения интервала с множеством интервалов
 * @param {Object} baseInterval
 * @param {Number} baseInterval.from – Время открытия интервала
 * @param {Number} baseInterval.to – Время закрытия интервала
 * @param {Array} intervals
 * @returns {Array}
 */
function findIntersections(baseInterval, intervals) {
    return intervals.reduce(function (intersections, interval) {
        if (!(baseInterval.from > interval.to && baseInterval.from > interval.from ||
            baseInterval.to < interval.from && baseInterval.to < interval.to)) {
            intersections.push({
                from: Math.max(baseInterval.from, interval.from),
                to: Math.min(baseInterval.to, interval.to)
            });
        }

        return intersections;
    }, []);
}

function sortIntervals(intervals) {
    const duration = interval => interval.from - interval.to;

    return intervals.sort((a, b) => a.from - b.from || duration(b) - duration(a));
}

function parseTime(string) {
    const [time, dayOfWeek] = string.split(' ').reverse();
    const expr = /^([01]\d|2[0-3]):([0-5]\d)\+(\d)$/;
    const [, hours, minutes, timeZone] = time.match(expr).map(Number);

    return dayOfWeek
        ? [DAY_TO_INT[dayOfWeek], hours, minutes, timeZone]
        : [hours, minutes, timeZone];
}
