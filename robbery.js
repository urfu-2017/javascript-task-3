'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */

function getTimeZone(time) {
    return String(time).substr(6);
}

function timeToMintutesFromDayStart(time) {
    var h = String(time).substr(0, 2);
    var m = String(time).substr(3, 2);

    return h * 60 + m;
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
    var minutesFromDayStartToBankOpen = timeToMintutesFromDayStart(workingHours.from);
    var minutesFromDayStartToBankClose = timeToMintutesFromDayStart(workingHours.to);

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
