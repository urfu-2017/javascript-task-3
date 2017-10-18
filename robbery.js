'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
var GTM_BANK = 0;
var WEEK_DAYS = ['ПН', 'ВТ', 'СР'];
var MINUTES_IN_HOUR = 60;
var HOUR_IN_DAY = 24;
var TOTAL_TIME_LINE = WEEK_DAYS.length * HOUR_IN_DAY * MINUTES_IN_HOUR;
var TRY_LATER_MINUTES = 30;
var DURATION = 0;


exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    GTM_BANK = workingHours.from.split('+')[1];
    DURATION = duration;

    let gangPartyFreeTime = calcGangPartyFreeTime(schedule);
    let bankFreeTime = getBankWorkingTime(workingHours);
    gangPartyFreeTime.push(bankFreeTime);
    let timeToGang = findTimeToGang(gangPartyFreeTime);
    var currentGang = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(timeToGang[currentGang]);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!timeToGang[currentGang]) {
                return '';
            }
            let minutes = timeToGang[currentGang][0];
            let day = WEEK_DAYS[(minutes - minutes % (HOUR_IN_DAY * MINUTES_IN_HOUR)) /
                                                        (HOUR_IN_DAY * MINUTES_IN_HOUR)];
            minutes %= HOUR_IN_DAY * MINUTES_IN_HOUR;
            let hours = ((minutes - minutes % MINUTES_IN_HOUR) / MINUTES_IN_HOUR).toString();
            minutes %= MINUTES_IN_HOUR;
            minutes = minutes === 0 ? '00' : minutes;

            return template.replace('%DD', day)
                .replace('%HH', hours)
                .replace('%MM', minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var newTimeStart = timeToGang[currentGang][0] + TRY_LATER_MINUTES;
            if ((timeToGang[currentGang][1] - newTimeStart) < duration) {
                if (!timeToGang[currentGang + 1]) {
                    return false;
                }
                currentGang++;

                return true;
            }
            timeToGang[currentGang][0] += 30;

            return true;
        }
    };
};

function calcGangPartyFreeTime(scheduleArr) {
    var result = [];
    for (let personName in scheduleArr) {
        if (!scheduleArr.hasOwnProperty(personName)) {
            continue;
        }
        var personResult = [];
        for (let i = 0; i < scheduleArr[personName].length; i++) {
            let start = stringToInt(scheduleArr[personName][i].from);
            let end = stringToInt(scheduleArr[personName][i].to);
            personResult.push([start, end]);
        }
        result.push(busyTimeToFreeTime(personResult));
    }

    return result;
}

function stringToInt(time) {
    let format = time.match(/([А-Я]{2})\s(\d{2}):(\d{2})\+(\d+)/);
    let hours = WEEK_DAYS.indexOf(format[1]) * HOUR_IN_DAY;
    let delta = GTM_BANK - Number(format[4]);
    hours += Number(format[2]) + delta;

    return hours * MINUTES_IN_HOUR + Number(format[3]);
}

function busyTimeToFreeTime(timeArr) {
    var result = [];
    for (let i = 0; i <= timeArr.length; i++) {
        if (i === 0) {
            result.push([0, timeArr[i][0]]);
            continue;
        }
        let end = timeArr[i] === undefined ? TOTAL_TIME_LINE : timeArr[i][0];
        result.push([timeArr[i - 1][1], end]);
    }

    return result;
}

function getBankWorkingTime(timeArr) {
    var result = [];
    for (let i = 0; i < WEEK_DAYS.length; i++) {
        result.push([stringToInt(WEEK_DAYS[i] + ' ' + timeArr.from),
            stringToInt(WEEK_DAYS[i] + ' ' + timeArr.to)]);
    }

    return result;
}

function findTimeToGang(arrays, compare) {
    var newArr = [];
    var arr1 = compare ? compare : arrays[0];
    var arr2 = compare ? arrays[0] : arrays[1];
    for (let i = 0; i < arr1.length; i++) {
        for (let k = 0; k < arr2.length; k++) {
            // if (arr1[i][0] >= arr2[k][1] || arr1[i][1] <= arr2[k][0]) {
            //     continue;
            // }
            // var el = [Math.max(arr1[i][0], arr2[k][0]), Math.min(arr1[i][1], arr2[k][1])];
            // if ((el[1] - el[0]) >= duration) {
            //     newArr.push(el);
            // }
            checkTimeInterval(arr1[i], arr2[k], newArr);
        }
    }
    if (newArr.length && arrays[1]) {
        arrays.shift();
        newArr = findTimeToGang(arrays, newArr);
    }

    return newArr;
}

function checkTimeInterval(arr1, arr2, newArr) {
    if (arr1[0] >= arr2[1] || arr1[1] <= arr2[0]) {
        return;
    }
    var el = [Math.max(arr1[0], arr2[0]), Math.min(arr1[1], arr2[1])];
    if ((el[1] - el[0]) >= DURATION) {
        newArr.push(el);
    }
}


