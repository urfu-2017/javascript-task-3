'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var DAYS_INDEXES = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
var DAYS_NAMES = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var MINUTES_IN_HOUR = 60;
var HOURS_IN_DAY = 24;
var MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
var MINUTES_TO_START_LATER = 30;
var DAYS_TO_HACK = 3;

function TimeInterval(start, end) {
    this.start = start;
    this.end = end;

    this.getLength = function () {
        return this.end - this.start;
    };

    this.getNextDay = function () {
        return new TimeInterval(this.start + MINUTES_IN_DAY, this.end + MINUTES_IN_DAY);
    };

    this.isTimeInInterval = function (time) {
        return this.start <= time && time <= this.end;
    };
}

function isTimeInIntervals(intervals, time) {
    for (var i = 0; i < intervals.length; i++) {
        if (intervals[i].isTimeInInterval(time)) {
            return true;
        }
    }

    return false;
}

function strToDate(strDate) {
    var strDateCopy = strDate.slice();
    if (DAYS_INDEXES[strDateCopy.slice(0, 2)] === undefined) {
        strDateCopy = 'ПН ' + strDateCopy;
    }
    var dateInfo = {
        day: DAYS_INDEXES[strDateCopy.slice(0, 2)],
        hours: parseInt(strDateCopy.slice(3, 5), 10),
        minutes: parseInt(strDateCopy.slice(6, 8), 10),
        timezone: parseInt(strDateCopy.slice(9, strDateCopy.length), 10)
    };
    dateInfo.intValue = dateInfo.day * MINUTES_IN_DAY +
        (dateInfo.hours - dateInfo.timezone) * MINUTES_IN_HOUR + dateInfo.minutes;

    return dateInfo;
}

function createTimeIntervalShifted(time, shift) {
    var from = strToDate(time.from).intValue + shift;
    var to = strToDate(time.to).intValue + shift;

    return new TimeInterval(from, to);
}

function removeSmallIntervals(intervals, minLength) {
    var timeIntervals = [];
    intervals.forEach(function (interval) {
        if (interval.getLength() >= minLength) {
            timeIntervals.push(interval);
        }
    });

    return timeIntervals;
}

function addMinuteToIntervals(intervals, minute) {
    var arrayLen = intervals.length;
    if (arrayLen === 0 || intervals[arrayLen - 1].end !== minute - 1) {
        intervals.push(new TimeInterval(minute, minute));
    } else {
        intervals[arrayLen - 1].end += 1;
    }
}

function isGangstersBusy(schedule, gangsterNames, time) {
    var gangstersIsBusy = false;
    gangsterNames.forEach(function (gangster) {
        if (isTimeInIntervals(schedule[gangster], time)) {
            gangstersIsBusy = true;
        }
    });

    return Boolean(gangstersIsBusy);
}

function createTimeIntervals(schedule, gangsterNames) {
    var goodTimeIntervals = [];

    for (var i = 0; i < DAYS_TO_HACK * MINUTES_IN_DAY; i++) {
        if (!isGangstersBusy(schedule, gangsterNames, i) && isTimeInIntervals(schedule.Bank, i)) {
            addMinuteToIntervals(goodTimeIntervals, i);
        }

    }

    return goodTimeIntervals;
}

function createGangsterSchedule(schedule, gangsterNames, bankShift) {
    var newSchedule = {};

    gangsterNames.forEach(function (gangsterName) {
        newSchedule[gangsterName] = [];
        schedule[gangsterName].forEach(function (time) {
            var intervalWithShift = createTimeIntervalShifted(time, bankShift);
            intervalWithShift.start++;
            intervalWithShift.end--;
            newSchedule[gangsterName].push(intervalWithShift);
        });
    });

    return newSchedule;
}

function addBankToSchedule(schedule, bankWorkingHours, bankShift) {
    schedule.Bank = [createTimeIntervalShifted(bankWorkingHours, bankShift)];
    for (var dayIndex = 0; dayIndex < DAYS_TO_HACK - 1; dayIndex++) {
        schedule.Bank.push(schedule.Bank[schedule.Bank.length - 1].getNextDay());
    }
}

function createScheduleObj(schedule, bankWorkingHours, gangsterNames) {
    var bankShift = strToDate(bankWorkingHours.from).timezone * MINUTES_IN_HOUR;
    var scheduleObj = createGangsterSchedule(schedule, gangsterNames, bankShift);
    addBankToSchedule(scheduleObj, bankWorkingHours, bankShift);

    return scheduleObj;
}

function timeToString(time) {
    return time < 10 ? '0' + time.toString() : time.toString();
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var gangsterNames = Object.keys(schedule);
    var scheduleObj = createScheduleObj(schedule, workingHours, gangsterNames);
    var timeIntervals = createTimeIntervals(scheduleObj, gangsterNames);
    timeIntervals = removeSmallIntervals(timeIntervals, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return timeIntervals.length;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            var startInterval = timeIntervals[0];
            var day = parseInt(startInterval.start / (MINUTES_IN_DAY), 10);
            var hour = parseInt(startInterval.start / MINUTES_IN_HOUR, 10) - day * HOURS_IN_DAY;
            var minutes = startInterval.start % MINUTES_IN_HOUR;

            return template.replace('%DD', DAYS_NAMES[day]).replace('%HH', timeToString(hour))
                .replace('%MM', timeToString(minutes));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var startInterval = timeIntervals[0];
            var isItLongEnough = startInterval.getLength() >= duration + MINUTES_TO_START_LATER;
            var anotherIntervalExists = timeIntervals.length > 1;
            if (this.exists() && (isItLongEnough || anotherIntervalExists)) {
                startInterval.start += MINUTES_TO_START_LATER;
                timeIntervals = removeSmallIntervals(timeIntervals, duration);

                return true;
            }

            return false;
        }
    };
};
