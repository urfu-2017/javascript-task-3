'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const WEEKDAYS = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
let data = {};

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

    let [bankOpenIntervals, baseTimezone] = parseBankOpenIntervals(workingHours);
    let thiefBusyIntervals = parseThiefIntervals(schedule, baseTimezone);
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
                .replace(/%DD/, Object.keys(WEEKDAYS).find(key => WEEKDAYS[key] === days))
                .replace(/%HH/, hours.toLocaleString(undefined, { minimumIntegerDigits: 2 }))
                .replace(/%MM/, minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 }));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            data.satisfyingIntervals[data.intervalIndex].start += 30;
            let nextItem = data.satisfyingIntervals.findIndex(x=>x.end - x.start + 1 >= duration);
            if (nextItem >= 0) {
                data.intervalIndex = nextItem;

                return true;
            }
            data.satisfyingIntervals[data.intervalIndex].start -= 30;

            return false;
        }
    };
};

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

function parseThiefIntervals(schedule, baseTimezone) {
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

// обьединяем пересекающиеся интервалы
function combineIntervals(intervals) {
    let sortedIntervals = sortIntervals(intervals);
    let combinedIntervals = [];
    for (var i = 0; i < sortedIntervals.length; i++) {
        let current = sortedIntervals[i];
        let overlappingIntervals = sortedIntervals
            .filter(x=> current.start <= x.start && x.start < current.end + 1);
        var intervalsBorder = Math.max.apply(null, overlappingIntervals.map((x)=>x.end));
        combinedIntervals.push({ start: current.start, end: intervalsBorder });
        i += overlappingIntervals.length - 1;
    }

    return combinedIntervals;
}

// инвертация временных интервалов
function invertTimeIntervals(disjoinedSortedIntervals) {
    const minValue = Number.MIN_SAFE_INTEGER;
    const maxValue = Number.MAX_SAFE_INTEGER;
    var invertedIntervals = [];
    let previousEndPos = minValue;
    for (var i = 0; i < disjoinedSortedIntervals.length; i++) {
        var interval = disjoinedSortedIntervals[i];

        let invertedInterval = { start: previousEndPos, end: interval.start - 1 };
        previousEndPos = interval.end;
        invertedIntervals.push(invertedInterval);
    }
    invertedIntervals.push({ start: previousEndPos, end: maxValue });

    return invertedIntervals;
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

// пересечение интервалов
function getIntervalsIntersection(bankIntervals, thiefIntervals) {
    let intervalsIntersections = [];
    for (let bankInterval of bankIntervals) {
        let localIntersections = findIntersections(bankInterval, thiefIntervals);
        intervalsIntersections = intervalsIntersections.concat(localIntersections);
    }

    return combineIntervals(intervalsIntersections);
}

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

function parseTime(string) {
    let [time, dayOfWeek] = string.split(' ').reverse();
    let expr = /^([01]\d|2[0-3]):([0-5]\d)\+(\d)$/;
    let [, hours, minutes, timeZone] = time.match(expr).map(Number);

    return dayOfWeek
        ? [WEEKDAYS[dayOfWeek], hours, minutes, timeZone]
        : [hours, minutes, timeZone];
}
