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

function isTimeInIntervals(timeIntervalsArray, time) {
    for (var i = 0; i < timeIntervalsArray.length; i++) {
        if (timeIntervalsArray[i].isTimeInInterval(time)) {
            return true;
        }
    }

    return false;
}

function strDateToDateObj(strDate) {
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

function getGangsterNames(schedule) {
    var gangsterNames = [];
    for (var gangsterName in schedule) {
        if (schedule.hasOwnProperty(gangsterName)) {
            gangsterNames.push(gangsterName);
        }
    }

    return gangsterNames;
}

function createTimeIntervalWithShift(time, shift) {
    return new TimeInterval(strDateToDateObj(time.from).intValue + shift,
        strDateToDateObj(time.to).intValue + shift);
}

function simplifyTimesIntervals(timeIntervals, duration) {
    var newTimeIntervals = [];
    timeIntervals.forEach(function (timeInterval) {
        if (timeInterval.getLength() >= duration) {
            newTimeIntervals.push(timeInterval);
        }
    });

    return newTimeIntervals;
}

function addOrChangeLastTimeInterval(arrayIntervals, timeToStartNewInterval) {
    var arrayLen = arrayIntervals.length;
    if (arrayLen === 0 || arrayIntervals[arrayLen - 1].end !== timeToStartNewInterval - 1) {
        arrayIntervals.push(new TimeInterval(timeToStartNewInterval, timeToStartNewInterval));
    } else {
        arrayIntervals[arrayLen - 1].end += 1;
    }
}

function isGangstersNotBusy(schedule, gangsterNames, time) {
    var gangstersIsNotBusy = true;
    gangsterNames.forEach(function (gangster) {
        if (isTimeInIntervals(schedule[gangster], time)) {
            gangstersIsNotBusy = false;
        }
    });

    return gangstersIsNotBusy;
}

function getGoodTimeIntervals(schedule, gangsterNames) {
    var goodTimesIntervals = [];

    for (var i = 0; i < DAYS_TO_HACK * MINUTES_IN_DAY; i++) {
        if (!isTimeInIntervals(schedule.Bank, i)) {
            continue;
        }
        if (isGangstersNotBusy(schedule, gangsterNames, i)) {
            addOrChangeLastTimeInterval(goodTimesIntervals, i);
        }
    }

    return goodTimesIntervals;
}

function createGangsterScheduleWithTimeIntervals(schedule, gangsterNames, bankShift) {
    var newSchedule = {};

    gangsterNames.forEach(function (gangsterName) {
        newSchedule[gangsterName] = [];
        schedule[gangsterName].forEach(function (time) {
            var intervalWithShift = createTimeIntervalWithShift(time, bankShift);
            intervalWithShift.start++;
            intervalWithShift.end--;
            newSchedule[gangsterName].push(intervalWithShift);
        });
    });

    return newSchedule;
}

function addToScheduleBankTimeIntervals(schedule, bankWorkingHours, bankShift) {
    schedule.Bank = [createTimeIntervalWithShift(bankWorkingHours, bankShift)];
    for (var dayIndex = 0; dayIndex < DAYS_TO_HACK - 1; dayIndex++) {
        schedule.Bank.push(schedule.Bank[schedule.Bank.length - 1].getNextDay());
    }
}

function createScheduleWithTimeIntervals(bankWorkingHours, schedule, gangsterNames) {
    var bankShift = strDateToDateObj(bankWorkingHours.from).timezone * MINUTES_IN_HOUR;
    var newSchedule = createGangsterScheduleWithTimeIntervals(schedule, gangsterNames, bankShift);
    addToScheduleBankTimeIntervals(newSchedule, bankWorkingHours, bankShift);

    return newSchedule;
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
    var gangsterNames = getGangsterNames(schedule);
    var newSchedule = createScheduleWithTimeIntervals(workingHours, schedule, gangsterNames);
    var goodTimesIntervals = getGoodTimeIntervals(newSchedule, gangsterNames);
    var goodTimesIntervalsWithGoodDuration = simplifyTimesIntervals(goodTimesIntervals, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return goodTimesIntervalsWithGoodDuration.length !== 0;
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

            var startInterval = goodTimesIntervalsWithGoodDuration[0];
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
            var startInterval = goodTimesIntervalsWithGoodDuration[0];
            if (this.exists() && (goodTimesIntervalsWithGoodDuration.length > 1 ||
                startInterval.getLength() >= duration + MINUTES_TO_START_LATER)) {
                startInterval.start += MINUTES_TO_START_LATER;
                goodTimesIntervalsWithGoodDuration = simplifyTimesIntervals(
                    goodTimesIntervalsWithGoodDuration, duration);

                return true;
            }

            return false;
        }
    };
};
