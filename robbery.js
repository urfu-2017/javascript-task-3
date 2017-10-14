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
    let readinessIntervals = invertTimeIntervals(disjointThiefIntervals);

    data.possibleIntervals = getIntervalsIntersection(bankOpenIntervals, readinessIntervals);
    data.satisfyingIntervals = data.possibleIntervals.filter(x=>x.end - x.start >= duration);
    data.intervalIndex = data.satisfyingIntervals.findIndex(x=>x.end - x.start >= duration);

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
            let nextItemIndex = data.satisfyingIntervals.findIndex(x=>x.end - x.start >= duration);
            if (nextItemIndex >= 0) {
                data.intervalIndex = nextItemIndex;

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
        let UTCEndsTime = (hoursTo + 24 * weekDayNumber) * 60 + minutesTo;
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
    let sortedIntervals = intervals.sort((a, b) => a.start > b.start);
    let combinedIntervals = [];
    for (var i = 0; i < sortedIntervals.length; i++) {
        let current = sortedIntervals[i];
        let overlappingIntervals = sortedIntervals
            .filter(x=> current.start <= x.start && x.start <= current.end);
        var intervalsBorder = Math.max.apply(null, overlappingIntervals.map((x)=>x.end));
        combinedIntervals.push({ start: current.start, end: intervalsBorder });
        i += overlappingIntervals.length - 1;
    }

    return combinedIntervals;
}

// инвертация интервалов
function invertTimeIntervals(disjoinedSortedIntervals) {
    const minValue = Number.MIN_SAFE_INTEGER;
    const maxValue = Number.MAX_SAFE_INTEGER;
    var invertedIntervals = [];
    let previousStartPos = minValue;
    for (var i = 0; i < disjoinedSortedIntervals.length; i++) {
        var interval = disjoinedSortedIntervals[i];
        let invertedInterval = { start: previousStartPos, end: interval.start };
        previousStartPos = interval.end;
        invertedIntervals.push(invertedInterval);
    }
    invertedIntervals.push({ start: previousStartPos, end: maxValue });

    return invertedIntervals;
}

// пересечение интервалов
function getIntervalsIntersection(bankIntervals, disjointSortedIntervals) {
    let intervals = bankIntervals.concat(disjointSortedIntervals);
    let sortedIntervals = intervals.sort((a, b) => a.start > b.start);
    let intervalsIntersections = [];
    for (var i = 0; i < sortedIntervals.length; i++) {
        let current = sortedIntervals[i];
        let findedInterval = sortedIntervals.find(x=>x.start < current.end &&
            current.start < x.end && x !== current);
        let start = Math.max(findedInterval.start, current.start);
        let end = Math.min(findedInterval.end, current.end);

        intervalsIntersections.push({ start, end });
    }

    return combineIntervals(intervalsIntersections);

}

function parseTime(string) {
    let [time, dayOfWeek] = string.split(' ').reverse();
    let expr = /^([01]\d|2[0-3]):([0-5]\d)\+(\d)$/;
    let [, hours, minutes, timeZone] = time.match(expr).map(Number);

    return dayOfWeek
        ? [WEEKDAYS[dayOfWeek], hours, minutes, timeZone]
        : [hours, minutes, timeZone];
}
