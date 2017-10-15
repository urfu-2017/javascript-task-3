'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var timelib = require('./timelib');
var intervals = require('./intervals');
const DAYS_OF_ROBBERY = ['ПН', 'ВТ', 'СР'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let scheduleCopy = Object.assign({}, schedule);
    let workingHoursParsed = parseWorkingHours(workingHours);
    convertScheduleToTimezone(scheduleCopy, workingHoursParsed.timezone);
    parseSchedule(scheduleCopy);
    let start = { day: 'ПН', time: workingHoursParsed.start };
    let suitableTime = findRobberyTime(scheduleCopy, duration, workingHoursParsed, start);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return suitableTime !== null;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (suitableTime === null) {
                return '';
            }
            let hours = timelib.getHours(suitableTime);
            let minutes = timelib.getMinutes(suitableTime);
            let day = timelib.getDay(suitableTime);

            return template.replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let newStartTime = timelib.convertToMinutes(suitableTime) + 30;
            let newAsString = timelib.convertMinutesToTime(newStartTime,
                timelib.getDay(suitableTime), timelib.getTimezone(suitableTime));
            newAsString = timelib.normilizeTime(newAsString);
            let newStart = { day: timelib.getDay(newAsString),
                time: timelib.convertToMinutes(newAsString) };
            let newSuitableTime = findRobberyTime(scheduleCopy, duration,
                workingHoursParsed, newStart);
            if (newSuitableTime) {
                suitableTime = newSuitableTime;

                return true;
            }

            return false;
        }
    };
};

function findRobberyTime(schedule, duration, workingHours, start) {
    let suitableTime = null;
    let startIndex = DAYS_OF_ROBBERY.indexOf(start.day);
    if (startIndex === -1) {
        return null;
    }
    for (let i = startIndex; i < DAYS_OF_ROBBERY.length; i++) {
        let allIntervals = concatRobbersBusyIntervals(schedule, DAYS_OF_ROBBERY[i]);
        let merged = intervals.mergeIntervals(allIntervals);
        intervals.cutEnds(merged, start.time, workingHours.end);
        let suitableInterval = findSuitableInterval(merged, duration);
        if (suitableInterval) {
            suitableTime = timelib.convertMinutesToTime(suitableInterval.from,
                DAYS_OF_ROBBERY[i], workingHours.timezone);
            break;
        }
        if (DAYS_OF_ROBBERY[i] === start.day) {
            start.time = workingHours.start;
        }
    }

    return suitableTime;
}

function concatRobbersBusyIntervals(schedule, day) {
    let allIntervals = [];
    for (let robber in schedule) {
        if (schedule.hasOwnProperty(robber)) {
            allIntervals = allIntervals.concat(schedule[robber][day]);
        }
    }

    return allIntervals;
}

function findSuitableInterval(mergedIntervals, duration) {
    for (let i = 0; i < mergedIntervals.length - 1; i++) {
        let difference = mergedIntervals[i + 1].from - mergedIntervals[i].to;
        if (difference >= duration) {
            return { from: mergedIntervals[i].to, to: mergedIntervals[i].to + duration };
        }
    }

    return null;
}

function convertScheduleToTimezone(gangSchedule, timezone) {
    for (let robber in gangSchedule) {
        if (gangSchedule.hasOwnProperty(robber)) {
            convertRobberSchedule(robber, gangSchedule, timezone);
        }
    }
}

function convertRobberSchedule(robber, gangSchedule, timezone) {
    for (let i = 0; i < gangSchedule[robber].length; i++) {
        if (timelib.getTimezone(gangSchedule[robber][i].from) !== timezone) {
            gangSchedule[robber][i].from = timelib
                .convertToTimeZone(gangSchedule[robber][i].from, timezone);
            gangSchedule[robber][i].to = timelib
                .convertToTimeZone(gangSchedule[robber][i].to, timezone);
        }
    }
}

function parseSchedule(schedule) {
    for (let robber in schedule) {
        if (schedule.hasOwnProperty(robber)) {
            schedule[robber] = parseRobberSchedule(schedule[robber]);
        }
    }
}

function parseRobberSchedule(robberSchedule) {
    let parsedRobberSchedule = {};

    for (let day of timelib.DAYS_OF_THE_WEEK) {
        parsedRobberSchedule[day] = [];
    }

    for (let busyZone of robberSchedule) {
        let fromDay = timelib.getDay(busyZone.from);
        let toDay = timelib.getDay(busyZone.to);

        if (fromDay !== toDay) {
            normilizeAndAddBusyZone(parsedRobberSchedule, busyZone, fromDay, toDay);
        } else {
            parsedRobberSchedule[fromDay].push({ from: timelib.convertToMinutes(busyZone.from),
                to: timelib.convertToMinutes(busyZone.to) });
        }
    }

    return parsedRobberSchedule;
}

function normilizeAndAddBusyZone(busyTime, busyZone, fromDay, toDay) {
    busyTime[fromDay].push({ from: timelib.convertToMinutes(busyZone.from),
        to: timelib.convertToMinutes('23:59') });

    let indexOfNextDay = timelib.DAYS_OF_THE_WEEK.indexOf(fromDay) + 1;
    for (let i = indexOfNextDay; i < timelib.DAYS_OF_THE_WEEK.length; i++) {
        if (timelib.DAYS_OF_THE_WEEK[i] === toDay) {
            busyTime[toDay].push({ from: timelib.convertToMinutes('00:00'),
                to: timelib.convertToMinutes(busyZone.to) });
            break;
        } else {
            busyTime[timelib.DAYS_OF_THE_WEEK[i]].push({ from: timelib.convertToMinutes('00:00'),
                to: timelib.convertToMinutes('23:59') });
        }
    }
}

function parseWorkingHours(workingHours) {
    let start = timelib.convertToMinutes(workingHours.from);
    let end = timelib.convertToMinutes(workingHours.to);
    let timezone = timelib.getTimezone(workingHours.from);

    return { start, end, timezone };
}
