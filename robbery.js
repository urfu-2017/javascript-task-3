'use strict';

exports.isStar = false;
var ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];
var HOURS = 24;
var MINUTES = 60;
var lastRobberyInterval;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    var bankGmt = parseInt(workingHours.from.slice(6), 10);
    var busyTimeList = Object.keys(schedule).reduce(function (previousFriend, currentFriend) {
        return previousFriend.concat(schedule[currentFriend].map(function (business) {
            return {
                start: getCorrectTimeFormat(business.from, bankGmt),
                end: getCorrectTimeFormat(business.to, bankGmt)
            };
        }));
    }, []);
    busyTimeList = busyTimeList.concat(getBankWorkTime(workingHours));
    busyTimeList.sort(function (a, b) {
        return a.start - b.start;
    });
    var intersectedIntervals = getUnionOfIntervals(busyTimeList);
    var robberyMinutesTime = getIntersection(intersectedIntervals, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */

        exists: function () {

            return robberyMinutesTime !== undefined;
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
            var timeDay = ROBBERY_DAYS[Math.floor(robberyMinutesTime / MINUTES / HOURS)];
            var timeHours = Math.floor(robberyMinutesTime / MINUTES) -
                Math.floor(robberyMinutesTime / MINUTES / HOURS) * HOURS;
            var timeMin = robberyMinutesTime % MINUTES;

            return template
                .replace(/%DD/, timeDay)
                .replace(/%HH/, convertInCorrectTime(timeHours))
                .replace(/%MM/, convertInCorrectTime(timeMin));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */

        tryLater: function () {
            if (!this.exists()) {

                return false;
            }
            var newRobberyTime = getEarliest(intersectedIntervals, duration);
            if (!newRobberyTime || lastRobberyInterval === 0) {

                return false;
            }
            robberyMinutesTime = newRobberyTime;

            return true;
        }
    };
};

function convertInCorrectTime(num) {
    return (num < 10) ? ('0' + num) : num;
}

function getCorrectTimeFormat(stringTime, gmtBank) {
    var thiefBusyHours = parseInt(stringTime.slice(3, 5), 10);
    var thiefGmt = gmtBank - parseInt(stringTime.slice(9), 10);
    var thiefBusyMinutes = parseInt(stringTime.slice(6, 8), 10);
    var currentDay = ROBBERY_DAYS.indexOf(stringTime.slice(0, 2)) * HOURS;

    return (thiefBusyHours + thiefGmt + currentDay) * MINUTES + thiefBusyMinutes;
}

function getParsedBankWorkTime(workingHours) {
    return MINUTES * parseInt(workingHours.slice(0, 2), 10) +
        parseInt(workingHours.slice(3, 5), 10);
}

function getBankWorkTime(workingHours) {
    var startWorking = getParsedBankWorkTime(workingHours.from);
    var endWorking = getParsedBankWorkTime(workingHours.to);
    console.info({ start: endWorking + 2 * MINUTES * HOURS, end: 3 * MINUTES * HOURS - 1 });

    return [
        { start: 0, end: startWorking },
        { start: endWorking, end: startWorking + MINUTES * HOURS },
        { start: endWorking + MINUTES * HOURS, end: startWorking + 2 * MINUTES * HOURS },
        { start: endWorking + 2 * MINUTES * HOURS, end: 3 * MINUTES * HOURS - 1 }
    ];
}

function getUnionOfIntervals(timeArray) {
    var previousStart = timeArray[0].start;
    var previousEnd = timeArray[0].end;
    var interval;
    var reducedTimeArray = timeArray.slice(1).reduce(function (previousInterval, currentInterval) {
        if (currentInterval.start <= previousEnd) {
            previousEnd = Math.max(previousEnd, currentInterval.end);
        } else {
            interval = [{ start: previousStart, end: previousEnd }];
            previousStart = currentInterval.start;
            previousEnd = currentInterval.end;

            return previousInterval.concat(interval);
        }

        return previousInterval.concat([]);
    }, []);

    return reducedTimeArray.concat([{ start: previousStart, end: previousEnd }]);
}

function getIntersection(busyTimeList, duration, index = 1) {
    for (var i = index; i < busyTimeList.length; i++) {
        if (busyTimeList[i].start - busyTimeList[i - 1].end >= duration) {
            lastRobberyInterval = i - 1;

            return busyTimeList[i - 1].end;
        }
    }
}

function getEarliest(busyTimeList, duration) {
    var newTime = busyTimeList[lastRobberyInterval].end + 30;
    for (var i = lastRobberyInterval; i < busyTimeList.length; i++) {
        if (busyTimeList[i - 1].end <= newTime && busyTimeList[i].start >= newTime) {
            var newList = busyTimeList;
            newList[i - 1].end = newTime;

            return getIntersection(getUnionOfIntervals(newList), duration, i);
        }
    }

    return false;
}
