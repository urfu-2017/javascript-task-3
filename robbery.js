'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const DAY_TO_INT = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const TRY_LATER_TIME = 30;


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
    let data = {};

    let [bankOpenIntervals, baseTimezone] = parseBankOpenIntervals(workingHours);
    let thiefBusyIntervals = parseThiefBusyIntervals(schedule, baseTimezone);
    let disjointThiefIntervals = combineIntervals(thiefBusyIntervals);
    let thiefReadinessIntervals = invertTimeIntervals(disjointThiefIntervals);

    data.possibleIntervals = getIntervalsIntersection(bankOpenIntervals, thiefReadinessIntervals);
    data.satisfyingIntervals = data.possibleIntervals.filter(x=>x.end - x.start + 1 >= duration);
    data.intervalIndex = data.satisfyingIntervals.findIndex(x=>x.end - x.start + 1 >= duration);

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
            let searchResult = data.satisfyingIntervals[data.intervalIndex];
            if (!searchResult) {
                return '';
            }
            let time = searchResult.start;
            let days = Math.floor(time / (24 * 60));
            let hours = Math.floor((time - days * 24 * 60) / 60);
            let minutes = time - days * 24 * 60 - hours * 60;

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
            data.satisfyingIntervals[data.intervalIndex].start += TRY_LATER_TIME;
            let nextItem = data.satisfyingIntervals.findIndex(x=>x.end - x.start + 1 >= duration);
            if (nextItem >= 0) {
                data.intervalIndex = nextItem;

                return true;
            }
            data.satisfyingIntervals[data.intervalIndex].start -= TRY_LATER_TIME;

            return false;
        }
    };
};

/**
 * Возвращает интервалы работы банка и его временную зону
 * @param {Array} workingHours
 * @returns {Array} - интервалы работы банка
 * @returns {Number} - временная зона банка
 */
function parseBankOpenIntervals(workingHours) {
    let intervals = [];
    let [hoursFrom, minutesFrom, bankTimezone] = parseTime(workingHours.from);
    let [hoursTo, minutesTo] = parseTime(workingHours.to);
    for (var weekDayNumber = 0; weekDayNumber < 3; weekDayNumber++) {
        let UTCStartTime = (hoursFrom + 24 * weekDayNumber) * 60 + minutesFrom;
        let UTCEndsTime = (hoursTo + 24 * weekDayNumber) * 60 + minutesTo - 1;
        intervals.push({ start: UTCStartTime, end: UTCEndsTime });
    }

    return [intervals, bankTimezone];
}

/**
 * Возвращает интервалы занятости грабителей приведенные к базовой временной зоне
 * @param {Array} schedule
 * @param {Number} baseTimezone
 * @returns {Array} - интервалы занятости грабителей
 */
function parseThiefBusyIntervals(schedule, baseTimezone) {
    let intervals = [];
    for (var thiefIntervals in schedule) {
        if (!schedule[thiefIntervals]) {
            continue;
        }
        for (var interval of schedule[thiefIntervals]) {
            let [weekDayNumberFrom, hoursFrom, minutesFrom, timezone] = parseTime(interval.from);
            let [weekDayNumberTo, hoursTo, minutesTo] = parseTime(interval.to);
            let timeDifference = baseTimezone - timezone;
            let UTCStart = (hoursFrom + timeDifference + 24 * weekDayNumberFrom) * 60 + minutesFrom;
            let UTCEnds = (hoursTo + timeDifference + 24 * weekDayNumberTo) * 60 + minutesTo;
            intervals.push({ start: UTCStart, end: UTCEnds });
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
    let sortedIntervals = sortIntervals(intervals);
    let combinedIntervals = [];
    for (let i = 0; i < sortedIntervals.length; i++) {
        let current = sortedIntervals[i];
        let overlappingIntervals = sortedIntervals
            .filter(x=> current.start <= x.start && x.start <= current.end + 1);
        let intervalsBorder = Math.max.apply(null, overlappingIntervals.map((x)=>x.end));
        combinedIntervals.push({ start: current.start, end: intervalsBorder });
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
        let interval = intervals[i];
        let invertedInterval = { start: previousEndPos, end: interval.start - 1 };
        previousEndPos = interval.end;
        invertedIntervals.push(invertedInterval);
    }
    invertedIntervals.push({ start: previousEndPos, end: maxValue });

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
        let localIntersections = findIntersections(bankInterval, thiefIntervals);
        intervalsIntersections = intervalsIntersections.concat(localIntersections);
    }

    return combineIntervals(intervalsIntersections);
}

/**
 * Получение пересечения интервала с множеством интервалов
 * @param {Interval} baseInterval
 * @param {Array} intervals
 * @returns {Array}
 */
function findIntersections(baseInterval, intervals) {
    let intersections = [];
    for (let interval of intervals) {
        if (baseInterval.start > interval.end && baseInterval.start > interval.start ||
            baseInterval.end < interval.start && baseInterval.end < interval.end) {
            continue;
        }
        let start = Math.max(baseInterval.start, interval.start);
        let end = Math.min(baseInterval.end, interval.end);
        intersections.push({ start, end });
    }

    return intersections;
}

function sortIntervals(intervals) {
    return intervals.sort(function (a, b) {
        if (a.start > b.start) {
            return 1;
        }
        if (a.start < b.start) {
            return -1;
        }
        let al = a.start - a.end;
        let bl = b.start - b.end;

        return -(al - bl);
    });
}

function parseTime(string) {
    let [time, dayOfWeek] = string.split(' ').reverse();
    let expr = /^([01]\d|2[0-3]):([0-5]\d)\+(\d)$/;
    let [, hours, minutes, timeZone] = time.match(expr).map(Number);

    return dayOfWeek
        ? [DAY_TO_INT[dayOfWeek], hours, minutes, timeZone]
        : [hours, minutes, timeZone];
}
