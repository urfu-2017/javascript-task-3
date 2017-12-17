'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;
var codeOfWeekDay = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2,
    'ЧТ': 3,
    'ПТ': 4,
    'СБ': 5,
    'ВС': 6
};

var weekDay = {
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
    var scheduleOfBankFrom = getTimeObject(workingHours.from);
    var scheduleOfBankTo = getTimeObject(workingHours.to);
    var timeZone = scheduleOfBankFrom.timeZone;
    var entries = getAllEntries(schedule);
    var intervalsInMinutes = entries
        .map(entry => toIntervalInMinutes(entry, timeZone))
        .sort((firstTime, secondTime) => firstTime.intervalStart > secondTime.intervalStart);
    var combinedIntervalsInMinutes = combineIntervals(intervalsInMinutes);
    var freeIntervals = getFreeIntervals(combinedIntervalsInMinutes);
    var workIntervals = getWorkIntervals(scheduleOfBankFrom, scheduleOfBankTo);
    var suitableIntervals = getSuitableIntervals(freeIntervals, workIntervals)
        .filter(entry => entry.duration >= duration);
    var currentSuitableInterval = suitableIntervals[0];

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (suitableIntervals.length !== 0) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (suitableIntervals.length === 0) {
                return '';
            }
            let startTimeInMinutes = currentSuitableInterval.start;
            let minutes = startTimeInMinutes % 60;
            let totalHours = Math.floor(startTimeInMinutes / 60);
            let day = Math.floor(totalHours / 24);
            let hours = totalHours % 24;

            return template
                .replace('%HH', hours > 9 ? hours : `0${hours}`)
                .replace('%MM', minutes > 9 ? minutes : `0${hours}`)
                .replace('%DD', weekDay[day]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return false;
        }
    };
};

function getAllEntries(schedule) {
    let robberNames = Object.keys(schedule);
    var allEntries = [];
    for (let robberName of robberNames) {
        var entries = schedule[robberName].map(x => {
            let [fromDay, fromTimeSting] = x.from.split(' ');
            let [toDay, toTimeString] = x.to.split(' ');

            let from = getTimeObject(fromTimeSting);
            let to = getTimeObject(toTimeString);

            return {
                fromDay,
                toDay,
                from,
                to
            };
        });
        allEntries = allEntries.concat(entries);
    }

    return allEntries;
}

function getTimeObject(time) {
    let [hours, minutes, timeZone] = time.split(/:|\+/);
    let scheduleOfBank = {};
    scheduleOfBank.hours = Number(hours);
    scheduleOfBank.minutes = Number(minutes);
    scheduleOfBank.timeZone = Number(timeZone);

    return scheduleOfBank;
}

function toIntervalInMinutes(entry, timeZone) {
    let timeZoneDifference = timeZone - entry.from.timeZone;
    entry.from.hours += timeZoneDifference;
    entry.to.hours += timeZoneDifference;

    return {
        intervalStart: getEntryToMinutes(entry.from, entry.fromDay),
        intervalEnd: getEntryToMinutes(entry.to, entry.toDay)
    };

}

function getEntryToMinutes(time, day) {
    let codeDay = codeOfWeekDay[day];

    return codeDay * 24 * 60 + time.hours * 60 + time.minutes;
}

function combineIntervals(intervalsInMinutes) {
    let combinedIntervalsInMinutes = [];
    let currentInterval = intervalsInMinutes[0];
    let start = currentInterval.intervalStart;
    let end = currentInterval.intervalEnd;
    for (let i = 1; i < intervalsInMinutes.length; i++) {
        currentInterval = intervalsInMinutes[i];
        if (end >= currentInterval.intervalEnd) {
            continue;
        }
        if (end >= currentInterval.intervalStart) {
            end = currentInterval.intervalEnd;
        } else {
            combinedIntervalsInMinutes.push({ start, end });

            start = currentInterval.intervalStart;
            end = currentInterval.intervalEnd;
        }
    }
    combinedIntervalsInMinutes.push({ start, end });

    return combinedIntervalsInMinutes;
}

function getFreeIntervals(combinedIntervalsInMinutes) {
    let rightTimeLimit = 2 * 24 * 60 + 23 * 60 + 59;
    let start = 0;
    let end = 0;
    let freeIntervals = [];
    for (let interval of combinedIntervalsInMinutes) {
        end = interval.start;
        freeIntervals.push({ start, end });
        start = interval.end;
    }
    if (start !== rightTimeLimit) {
        freeIntervals.push({ start, end: rightTimeLimit });
    }

    return freeIntervals;
}

function getWorkIntervals(scheduleOfBankFrom, scheduleOfBankTo) {
    let workIntervals = [];
    var days = ['ПН', 'ВТ', 'СР'];
    for (let day of days) {
        var start = getEntryToMinutes(scheduleOfBankFrom, day);
        var end = getEntryToMinutes(scheduleOfBankTo, day);
        workIntervals.push({ start, end });
    }

    return workIntervals;
}

function getSuitableIntervals(freeIntervals, workIntervals) {
    let result = [];
    for (let workInterval of workIntervals) {
        let workStart = workInterval.start;
        let workEnd = workInterval.end;

        let intervals = freeIntervals.filter(x =>
            (workStart < x.end && workStart >= x.start) ||
            (workEnd > x.start && workEnd <= x.end) ||
            (workStart <= x.start && workEnd >= x.end))
            .map(x => {
                let start = x.start;
                let end = x.end;
                if (start < workStart) {
                    start = workStart;
                }
                if (end > workEnd) {
                    end = workEnd;
                }

                return {
                    start,
                    end,
                    duration: end - start
                };
            });
        result = result.concat(intervals);
    }

    return result;
}
