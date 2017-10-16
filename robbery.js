'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const DAY_TO_INT = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const TRY_LATER_TIME = 30;
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
    const data = {};
    const robberyInterval = { from: ROBBERY_START_DAY, to: ROBBERY_END_DAY };

    const [robberyIntervals, timezone] = getPossibleRobberyIntervals(workingHours, robberyInterval);
    const thiefBusyIntervals = getThiefBusyIntervals(schedule, timezone);
    const disjointThiefIntervals = combineIntervals(thiefBusyIntervals);
    const thiefReadinessIntervals = invertTimeIntervals(disjointThiefIntervals);

    data.possibleIntervals = getIntervalsIntersection(robberyIntervals, thiefReadinessIntervals);
    data.satisfyingIntervals = data.possibleIntervals.filter(x=>x.to - x.from + 1 >= duration);
    data.intervalIndex = data.satisfyingIntervals.findIndex(x=>x.to - x.from + 1 >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return data.satisfyingIntervals.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            const searchResult = data.satisfyingIntervals[data.intervalIndex];
            if (!searchResult) {
                return '';
            }
            const time = searchResult.from;
            const days = Math.floor(time / (24 * 60));
            const hours = Math.floor((time - days * 24 * 60) / 60);
            const minutes = time - days * 24 * 60 - hours * 60;

            return template
                .replace(/%DD/, Object.keys(DAY_TO_INT).find(key => DAY_TO_INT[key] === days))
                .replace(/%HH/, hours.toLocaleString(undefined, { minimumIntegerDigits: 2 }))
                .replace(/%MM/, minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 }));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (data.intervalIndex < 0) {
                return false;
            }
            data.satisfyingIntervals[data.intervalIndex].from += TRY_LATER_TIME;
            const nextItem = data.satisfyingIntervals.findIndex(x=>x.to - x.from + 1 >= duration);
            if (nextItem >= 0) {
                data.intervalIndex = nextItem;

                return true;
            }
            data.satisfyingIntervals[data.intervalIndex].from -= TRY_LATER_TIME;

            return false;
        }
    };
};

/**
 * Возвращает интервалы, в которые возможно совершить ограбления банка
 * @param {Array} workingHours
 * @param {Object} robberyInterval - Пределы ограбления
 * @param {String} robberyInterval.from – Время открытия интервала ограбления
 * @param {String} robberyInterval.to – Время закрытия интервала ограбления
 * @returns {Array} - интервалы ограбления банка
 * @returns {Number} - временная зона банка
 */
function getPossibleRobberyIntervals(workingHours, robberyInterval) {
    let intervals = [];
    const [hoursFrom, minutesFrom, baseTimezone] = parseTime(workingHours.from);
    const [hoursTo, minutesTo] = parseTime(workingHours.to);
    const startDay = robberyInterval.from;
    const endDay = robberyInterval.to;

    for (let dayNumber = DAY_TO_INT[startDay]; dayNumber <= DAY_TO_INT[endDay]; dayNumber++) {
        const from = (hoursFrom + 24 * dayNumber) * 60 + minutesFrom;
        const to = (hoursTo + 24 * dayNumber) * 60 + minutesTo - 1;
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
    let intervals = [];
    for (let thiefIntervals in schedule) {
        if (!schedule[thiefIntervals]) {
            continue;
        }
        for (var interval of schedule[thiefIntervals]) {
            const [weekDayNumberFrom, hoursFrom, minutesFrom, timezone] = parseTime(interval.from);
            const [weekDayNumberTo, hoursTo, minutesTo] = parseTime(interval.to);
            const timeDifference = baseTimezone - timezone;
            const from = (hoursFrom + timeDifference + 24 * weekDayNumberFrom) * 60 + minutesFrom;
            const to = (hoursTo + timeDifference + 24 * weekDayNumberTo) * 60 + minutesTo;
            intervals.push({ from, to });
        }
    }

    return intervals;
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
            .filter(x=> current.from <= x.from && x.from <= current.to + 1);
        const intervalsBorder = Math.max.apply(null, overlappingIntervals.map((x)=>x.to));
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
    const minValue = Number.MIN_SAFE_INTEGER;
    const maxValue = Number.MAX_SAFE_INTEGER;
    let invertedIntervals = [];
    let previousEndPos = minValue;
    for (let i = 0; i < intervals.length; i++) {
        const interval = intervals[i];
        const invertedInterval = { from: previousEndPos, to: interval.from - 1 };
        previousEndPos = interval.to;
        invertedIntervals.push(invertedInterval);
    }
    invertedIntervals.push({ from: previousEndPos, to: maxValue });

    return invertedIntervals;
}

/**
 * Получение пересечения интервалов работы банка и незанятости воров
 * @param {Array} bankIntervals
 * @param {Array} thiefIntervals
 * @returns {Array}
 */
function getIntervalsIntersection(bankIntervals, thiefIntervals) {
    let intervalsIntersections = [];
    for (let bankInterval of bankIntervals) {
        const localIntersections = findIntersections(bankInterval, thiefIntervals);
        intervalsIntersections = intervalsIntersections.concat(localIntersections);
    }

    return combineIntervals(intervalsIntersections);
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
    let intersections = [];
    for (let interval of intervals) {
        if (baseInterval.from > interval.to && baseInterval.from > interval.from ||
            baseInterval.to < interval.from && baseInterval.to < interval.to) {
            continue;
        }
        const from = Math.max(baseInterval.from, interval.from);
        const to = Math.min(baseInterval.to, interval.to);
        intersections.push({ from, to });
    }

    return intersections;
}

function sortIntervals(intervals) {
    return intervals.sort(function (a, b) {
        if (a.from > b.from) {
            return 1;
        }
        if (a.from < b.from) {
            return -1;
        }
        const al = a.from - a.to;
        const bl = b.from - b.to;

        return -(al - bl);
    });
}

function parseTime(string) {
    const [time, dayOfWeek] = string.split(' ').reverse();
    const expr = /^([01]\d|2[0-3]):([0-5]\d)\+(\d)$/;
    const [, hours, minutes, timeZone] = time.match(expr).map(Number);

    return dayOfWeek
        ? [DAY_TO_INT[dayOfWeek], hours, minutes, timeZone]
        : [hours, minutes, timeZone];
}
