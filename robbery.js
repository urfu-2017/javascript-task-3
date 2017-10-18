'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var daysOfWeeksToHours = {
    'ПН': 0,
    'ВТ': 24,
    'СР': 24 * 2,
    'ЧТ': 24 * 3,
    'ПТ': 24 * 4,
    'СБ': 24 * 5,
    'ВС': 24 * 6
};

var numberDayToDayWeek = {
    0: 'ПН',
    1: 'ВТ',
    2: 'СР',
    3: 'ЧТ',
    4: 'ПТ',
    5: 'СБ',
    6: 'ВС'
};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let [, , bankTimezone] = workingHours.from.split(/:|\+/)
        .map(x => Number(x));

    let robberInterval = getAllScheduleEntries(schedule)
        .map(parseScheduleEntry)
        .map(x => getlRobberTimeInterval(x, bankTimezone))
        .sort((a, b) => a.totalMinutesFrom > b.totalMinutesFrom);

    let mergedRobberIntervals = robberInterval.length !== 0 ? getMergeTimeIntervals(robberInterval)
        : [];
    let bankWorkIntervals = getbankWorkIntervals(workingHours);

    let appropriateMoments = getAppropriateMoments(mergedRobberIntervals, bankWorkIntervals)
        .filter(x => x.different >= duration)
        .map((x, i) => {
            x.next = i + 1;

            return x;
        });
    let currentAnswer = appropriateMoments[0];

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return appropriateMoments.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (appropriateMoments.length === 0) {
                return '';
            }

            let startTimeInMinutes = currentAnswer.startMoment;
            let minutes = startTimeInMinutes % 60;
            let totalHours = Math.floor(startTimeInMinutes / 60);
            let day = Math.floor(totalHours / 24);
            let hours = totalHours % 24;

            return template
                .replace('%HH', hours > 9 ? hours : `0${hours}`)
                .replace('%MM', minutes > 9 ? minutes : `0${minutes}`)
                .replace('%DD', numberDayToDayWeek[day]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (appropriateMoments.length === 0 || appropriateMoments.length === 1) {
                return false;
            }
            let nextAnswer = getNextAnswer(currentAnswer, appropriateMoments, duration);
            if (typeof nextAnswer === 'undefined') {
                return false;
            }

            currentAnswer = nextAnswer;

            return true;
        }
    };
};


function parseScheduleEntry(x) {
    let startDay = x.from.substring(0, 2);
    let [hoursFrom, minutesFrom, robberTimezone] = x.from.substring(2).split(/:|\+/)
        .map(y => Number(y));

    let endDay = x.to.substring(0, 2);
    let [hoursTo, minutesTo] = x.to.substring(2).split(/:|\+/)
        .map(y => Number(y));

    return {
        startDay,
        hoursFrom,
        minutesFrom,
        endDay,
        hoursTo,
        minutesTo,
        robberTimezone
    };
}

function getlRobberTimeInterval(x, bankTimezone) {
    let timezoneDiff = bankTimezone - x.robberTimezone;

    let totalHoursFrom = x.hoursFrom + timezoneDiff + daysOfWeeksToHours[x.startDay];
    let totalHoursTo = x.hoursTo + timezoneDiff + daysOfWeeksToHours[x.endDay];

    let totalMinutesFrom = totalHoursFrom * 60 + x.minutesFrom;
    let totalMinutesTo = totalHoursTo * 60 + x.minutesTo;

    return {
        totalMinutesFrom,
        totalMinutesTo
    };
}

function getAllScheduleEntries(schedule) {
    return [].concat(schedule.Danny, schedule.Rusty, schedule.Linus);
}

function getTotalMinutesFromStartWeek(hours, minutes, dayWeek) {
    return (hours + daysOfWeeksToHours[dayWeek]) * 60 + minutes;
}

function getMergeTimeIntervals(sortedTimeIntervals) {
    let mergeTimeIntervals = [];
    let currentTimeInterval = sortedTimeIntervals[0];
    let start = currentTimeInterval.totalMinutesFrom;
    let end = currentTimeInterval.totalMinutesTo;
    for (var i = 1; i < sortedTimeIntervals.length; i++) {
        currentTimeInterval = sortedTimeIntervals[i];
        if (end > currentTimeInterval.totalMinutesTo) {
            continue;
        }
        if (end >= currentTimeInterval.totalMinutesFrom) {
            end = currentTimeInterval.totalMinutesTo;
        } else {
            mergeTimeIntervals.push({ start, end });

            start = currentTimeInterval.totalMinutesFrom;
            end = currentTimeInterval.totalMinutesTo;
        }
    }
    mergeTimeIntervals.push({ start, end });

    return mergeTimeIntervals;
}

function getbankWorkIntervals(workingHours) {
    let [bankHoursFrom, bankMinutesFrom] = workingHours.from.split(/:|\+/)
        .map(x => Number(x));
    let [bankHoursTo, bankMinutesTo] = workingHours.to.split(/:|\+/)
        .map(x => Number(x));

    let bankWorkIntervals = [];
    let workDays = ['ПН', 'ВТ', 'СР'];

    workDays.forEach(function (workDay) {
        bankWorkIntervals.push({
            start: getTotalMinutesFromStartWeek(bankHoursFrom, bankMinutesFrom, workDay),
            end: getTotalMinutesFromStartWeek(bankHoursTo, bankMinutesTo, workDay)
        });
    });

    return bankWorkIntervals;
}

function getResult(bankWorkInterval, intervals) {
    let appropriateMoments = [];

    let currentInterval = intervals[0];

    let startMoment = getStartMoment(currentInterval, bankWorkInterval);
    let endMoment = getEndMoment(currentInterval, bankWorkInterval);

    if (intervals.length === 1) {
        appropriateMoments.push({
            startMoment,
            endMoment,
            different: endMoment - startMoment
        });

        startMoment = currentInterval.end;
    }

    for (var i = 1; i < intervals.length; i++) {
        currentInterval = intervals[i];
        endMoment = getEndMoment(currentInterval, bankWorkInterval);

        appropriateMoments.push({
            startMoment,
            endMoment,
            different: endMoment - startMoment
        });

        startMoment = currentInterval.end;
    }
    if (startMoment < bankWorkInterval.end) {
        appropriateMoments.push({
            startMoment,
            endMoment: bankWorkInterval.end,
            different: bankWorkInterval.end - startMoment
        });
    }

    return appropriateMoments;
}

function getAppropriateMoments(mergedIntervals, bankWorkIntervals) {
    let results = [];

    for (let i = 0; i < bankWorkIntervals.length; i++) {
        let bankWorkInterval = bankWorkIntervals[i];

        let start = bankWorkInterval.start;
        let end = bankWorkInterval.end;

        if (mergedIntervals.some(x => x.start <= start && x.end >= end)) {
            continue;
        }

        let intervals = mergedIntervals.filter(x => {
            return (x.start > start && x.start < end) ||
                (x.end > start && x.end < end);
        });

        let res = getResult(bankWorkInterval, intervals)
            .map(x => {
                if (x.endMoment > end) {
                    x.endMoment = end;
                }

                return x;
            });

        results = results.concat(res);
    }

    return results;
}

function getStartMoment(currentInterval, bankWorkInterval) {
    if (typeof currentInterval === 'undefined') {
        return bankWorkInterval.start;
    }

    return currentInterval.start < bankWorkInterval.start ? currentInterval.end
        : bankWorkInterval.start;
}

function getEndMoment(currentInterval, bankWorkInterval) {
    if (typeof currentInterval === 'undefined') {
        return bankWorkInterval.end;
    }

    return currentInterval.start < bankWorkInterval.end ? currentInterval.start
        : bankWorkInterval.end;
}

function getNextAnswer(currentAnswer, answer, duration) {
    let newStartMoment = currentAnswer.startMoment + 30;
    let newDuration = currentAnswer.endMoment - newStartMoment;
    if (newDuration >= duration) {
        return {
            startMoment: newStartMoment,
            endMoment: currentAnswer.endMoment,
            duration: newDuration,
            next: currentAnswer.next
        };
    }

    return answer[currentAnswer.next];
}
