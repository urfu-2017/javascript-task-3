'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */

function getDayNumber(day) {
    switch (day) {
        case 'ПН':
            return 0;
        case 'ВТ':
            return 1;
        case 'СР':
            return 2;
        default:
            return -1;
    }
}

function getTime(fullTime) {
    return String(fullTime).substr(3);
}

function getDay(fullTime) {
    return String(fullTime).substr(0, 2);
}

function createFullTime(day, minutesFromDayStart, timeZone) {

}

function getTimeZone(time) {
    return String(time).substr(6);
}

function getMintutesFromWeekStart(fullTime) {
    var time = getTime(fullTime);
    var dayNumber = getDayNumber(fullTime);
    var h = String(time).substr(0, 2);
    var m = String(time).substr(3, 2);

    return dayNumber * 1440 + h * 60 + m;
}

function leadTimeToCertainTimeZoneMinutesFromWeekStart(date, timeZone) {
    var dayNumber = getDayNumber(getDay(date));
    var time = getTime(date);
    var originalTimeZone = getTimeZone(time);
    var mintutesFromWeekStart = getMintutesFromWeekStart(time);

    return mintutesFromWeekStart + (timeZone - originalTimeZone) * 60;
}

exports.isStar = true;

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
    

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
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
            return template;
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
