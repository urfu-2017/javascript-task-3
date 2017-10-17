'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var MIN_PER_DAY = 1440;
var MIN_PER_HOUR = 60;
var DAYS = ['ПН', 'ВТ', 'СР'];
var TIME_INTERVAL = 30;

/**
 * объединяем соседние временные диапазоны
 * @param {Array} array
 * @returns {Array}
 */
function mergeRange(array) {
    var sortedArray = array.sort(function (a, b) {
        return a[0] - b[0];
    });
    var resultArray = [];
    var prevStart = sortedArray[0][0];
    var prevFinish = sortedArray[0][1];
    for (var i = 1; i < sortedArray.length; i++) {
        if (sortedArray[i][0] <= prevFinish) {
            prevFinish = Math.max(sortedArray[i][1], prevFinish);
        } else {
            resultArray.push([prevStart, prevFinish]);
            prevStart = sortedArray[i][0];
            prevFinish = sortedArray[i][1];
        }
    }
    resultArray.push([prevStart, prevFinish]);

    return resultArray;
}

/**
 * Извлекает из строки со временим значение часового пояса
 * @param {String} stringTime строка формата 'ПН 12:00+5'
 * @returns {Number}
 */
function getUTC(stringTime) {
    return stringTime.match(/\d+$/);
}

function getGoodTimeIntervals(freeTimeIntervals, duration) {
    var firstFreeTime = !freeTimeIntervals.length ? -1 : freeTimeIntervals[0][0];
    var resultArray = [];

    if (firstFreeTime < 0) {
        return [];
    }

    for (var i = 0; i < freeTimeIntervals.length; i ++) {
        firstFreeTime = freeTimeIntervals[i][0];
        while (firstFreeTime + duration <= freeTimeIntervals[i][1]) {
            resultArray.push(firstFreeTime);
            firstFreeTime += TIME_INTERVAL;
        }
    }
    resultArray.splice(0, 1);

    return resultArray;
}

/**
 * Получает из записи типа 'ПН 09:00+3' колличество минут
 * @param {String} stringTime записи типа 'ПН 09:00+3'
 * @param {Number} utc часовой пояс банка
 * @returns {Number} колличество минут понедельника 00:00 в часовом поясе банка
 */
function getTimestamp(stringTime, utc = null) {
    var reg = /^(ПН|ВТ|СР)?\s?(\d{2}):(\d{2})\+(\d+)$/;
    var time = stringTime.match(reg);
    var day = time[1] ? MIN_PER_DAY * DAYS.indexOf(time[1]) : 0;
    var hours = Number(time[2]);
    var minutes = Number(time[3]);
    var localUtc = Number(time[4]);
    utc = utc ? utc : localUtc;

    return minutes + MIN_PER_HOUR * (hours + (utc - localUtc)) + day;
}

function getBusyIntervals(schedule, workingHours) {

    var arrIntervals = [];

    for (var friend in schedule) {
        if (schedule.hasOwnProperty(friend)) {
            arrIntervals = arrIntervals.concat(getBusyInterval(schedule[friend], workingHours));
        }
    }

    var bankStartWork = getTimestamp(workingHours.from);
    var bankFinishWork = getTimestamp(workingHours.to);
    arrIntervals.push([0, bankStartWork], [bankFinishWork, bankStartWork + MIN_PER_DAY],
        [bankFinishWork + MIN_PER_DAY, bankStartWork + MIN_PER_DAY * 2],
        [bankFinishWork + MIN_PER_DAY * 2, MIN_PER_DAY * 3 - 1]);

    return arrIntervals;
}

function getBusyInterval(scheduleArray, workingHours) {
    var timeArray = [];

    scheduleArray.forEach(function (item) {
        timeArray.push(
            [getTimestamp (item.from, getUTC(workingHours.from)),
                getTimestamp (item.to, getUTC(workingHours.from))]);
    });

    return timeArray;
}

function getFreeTimeIntervals(schedule, duration, workingHours) {
    var busyIntervals = getBusyIntervals(schedule, workingHours);
    var sortBusyIntervals = mergeRange(busyIntervals);
    var start = sortBusyIntervals[0][1];
    var finish = 0;
    var resArray = [];

    sortBusyIntervals.forEach(function (item) {
        finish = item[0];
        if (finish - start >= duration) {
            resArray.push([start, finish]);
        }
        start = item[1];
    });

    return resArray;
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

    var freeTimeIntervals = getFreeTimeIntervals(schedule, duration, workingHours);

    var firstFreeTime = !freeTimeIntervals.length ? -1 : freeTimeIntervals[0][0];

    var goodTimeIntervals = getGoodTimeIntervals(freeTimeIntervals, duration);

    var tryLaterCounter = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return firstFreeTime >= 0;
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
            var day = Math.floor(firstFreeTime / MIN_PER_DAY);
            var hours = Math.floor((firstFreeTime - day * MIN_PER_DAY) / MIN_PER_HOUR);
            var minutes = firstFreeTime - day * MIN_PER_DAY - hours * MIN_PER_HOUR;

            var dayStr = DAYS[day];

            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (hours < 10) {
                hours = '0' + hours;
            }

            return template.replace(/%DD/, dayStr)
                .replace(/%HH/, hours)
                .replace(/%MM/, minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists() || goodTimeIntervals.length === tryLaterCounter) {
                return false;
            }
            firstFreeTime = goodTimeIntervals[tryLaterCounter];
            tryLaterCounter++;

            return true;
        }
    };
};
