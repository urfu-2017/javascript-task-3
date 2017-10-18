'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var HOURS_IN_DAY = 24;
var MINUTES_IN_HOUR = 60;
var MINUTES_IN_DAY = HOURS_IN_DAY * 60;
var DAYS_OF_THE_WEEK = ['ПН', 'ВТ', 'СР'];
function DayOfTheWeek(dayText) {
    this.days = DAYS_OF_THE_WEEK;
    this.getNumber = function () {
        return this.days.indexOf(this.text);
    };
    this.text = dayText;
    this.addDays = function (days) {
        this.number += days % 7;
    };
    this.getText = function () {
        return this.days[this.number];
    };

    return this;
}
function DateTime(dateTimeString) {
    this.day = new DayOfTheWeek(dateTimeString.slice(0, 2));
    this.hours = parseInt(dateTimeString.slice(3, 5));
    this.minutes = parseInt(dateTimeString.slice(6, 8));
    this.timezone = parseInt(dateTimeString.split('+')[1]);
    this.addMinutes = function (minutes) {
        var daysToAdd = Math.floor(minutes / MINUTES_IN_DAY);
        minutes -= MINUTES_IN_DAY * daysToAdd;
        var hoursToAdd = Math.floor(minutes / MINUTES_IN_HOUR);
        minutes -= MINUTES_IN_HOUR * hoursToAdd;
        var minutesToAdd = minutes;
        this.minutes += minutesToAdd;
        this.hours += hoursToAdd;
        this.day.addDays(daysToAdd);

        return;
    };
    this.convertToTimezone = function (timezone) {
        var delta = timezone - this.timezone;
        this.addMinutes(delta * MINUTES_IN_HOUR);
        this.timezone = timezone;
    };
    this.getMinutesCountFromWeekStart = function () {
        return MINUTES_IN_DAY * this.day.getNumber() + MINUTES_IN_HOUR * this.hours + this.minutes;
    };
    this.compareTo = function (other) {
        return this.getMinutesCountFromWeekStart() - other.getMinutesCountFromWeekStart();
    };

    return this;
}
function Interval(start, end) {
    this.start = start;
    this.end = end;
    this.intersect = function (otherInterval) {
        var intersectionStart = this.start.compareTo(otherInterval.start) > 0
            ? this.start : otherInterval.start;
        var intersectionEnd = this.end.compareTo(otherInterval.end) < 0
            ? this.end : otherInterval.end;
        if (intersectionEnd.compareTo(intersectionStart) < 0) {
            return null;
        }

        return new Interval(intersectionStart, intersectionEnd);
    };
    this.union = function (otherInterval) {
        var intersectionStart = this.start.compareTo(otherInterval.start) < 0
            ? this.start : otherInterval.start;
        var intersectionEnd = this.end.compareTo(otherInterval.end) > 0
            ? this.end : otherInterval.end;

        return new Interval(intersectionStart, intersectionEnd);
    };

    return this;
}
function normalizeSchedule(memberSchedule, workingInterval) {
    var newSchedule = [];
    memberSchedule.forEach(function (busynessInfo) {
        var bankTimezone = workingInterval.start.timezone;
        var start = new DateTime(busynessInfo.from);
        var end = new DateTime(busynessInfo.to);
        start.convertToTimezone(bankTimezone);
        end.convertToTimezone(bankTimezone);
        var busynessInterval = new Interval(start, end);
        DAYS_OF_THE_WEEK.forEach(function (dayOfTheWeek) {
            workingInterval.start.day = new DayOfTheWeek(dayOfTheWeek);
            workingInterval.end.day = new DayOfTheWeek(dayOfTheWeek);
            var intersection = busynessInterval.intersect(workingInterval);
            if (intersection !== null) {
                newSchedule.push(intersection);
            }
        });
    });

    return newSchedule;
}
function getNewAllIntervals(allIntervals, lastIntervalEnd) {
    var newAllIntervals = [];
    for (var i = 0; i < allIntervals.length; i += 1) {
        var interval = allIntervals[i];
        if (currentInterval.intersect(interval) === null) {
            newAllIntervals.push(interval);
            lastIntervalEnd = currentInterval.end.compareTo(lastIntervalEnd) > 0
                ? currentInterval.end : lastIntervalEnd;
            break;
        }
        else {
            currentInterval = currentInterval.union(interval);
        }
    }

    return newAllIntervals;
}
function findCompatibleInterval(allIntervals, workingInterval, duration) {
    var result = null;
    var lastIntervalEnd = workingInterval.start;
    var currentInterval = allIntervals[0];
    while (allIntervals.length > 0 || result !== null) {
        currentInterval = allIntervals[0];
        allIntervals = allIntervals.splice(1);
        if (currentInterval.start.compareTo(lastIntervalEnd) >= duration) {
            return currentInterval.start;
        }
        var newAllIntervals = getNewAllIntervals(allIntervals, lastIntervalEnd);
        allIntervals = newAllIntervals.sort(function (a, b) {
            return a.start.compareTo(b.start);
        });
    }

    return result;
}
function getRobberyStart(schedule, workingInterval, duration, day) {
    workingInterval.start.day = new DayOfTheWeek(day);
    workingInterval.end.day = new DayOfTheWeek(day);
    var allIntervals = schedule.Danny.concat(schedule.Rusty).concat(schedule.Linus);
    allIntervals = allIntervals.filter(function (interval) {
        return interval.start.day.text === day;
    });
    allIntervals = allIntervals.sort(function (a, b) {
        return a.start.compareTo(b.start);
    });

    return findCompatibleInterval(allIntervals, workingInterval);
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, '10:00+5'
 * @param {String} workingHours.to – Время закрытия, например, '18:00+5'
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var bankStart = new DateTime('ПН ' + workingHours.from);
    var bankEnd = new DateTime('ПН ' + workingHours.to);
    var workingInterval = new Interval(bankStart, bankEnd);
    schedule.Danny = normalizeSchedule(schedule.Danny, workingInterval);
    schedule.Rusty = normalizeSchedule(schedule.Rusty, workingInterval);
    schedule.Linus = normalizeSchedule(schedule.Linus, workingInterval);
    var robberyStart = null;
    DAYS_OF_THE_WEEK.forEach(function (day) {
        robberyStart = getRobberyStart(schedule, workingInterval, duration, day);
    });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyStart !== null;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   'Начинаем в %HH:%MM (%DD)' -> 'Начинаем в 14:59 (СР)'
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyStart === null) {
                return '';
            }

            return template
                .replace('%DD', robberyStart.day.text)
                .replace('%HH', robberyStart.hours)
                .replace('%MM', robberyStart.minutes);
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
