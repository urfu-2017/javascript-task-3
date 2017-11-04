'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
let timeConverter = require('./timeConverter.js');
let segmentHelper = require('./segmentHelper.js');

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let timezoneBank = Number(workingHours.from.split('+')[1]);
    let busySegments = timeConverter.toSegments(schedule, timezoneBank);
    let workingSegments = timeConverter.toWorkingSegments(workingHours);
    let robberySegment = segmentHelper.findSegmentRobbery(workingSegments, busySegments, duration);
    let existTime = robberySegment !== null;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */

        exists: () => existTime,

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberySegment !== null) {
                let data = timeConverter.toDate(robberySegment.start);

                return template.replace('%DD', data.day)
                    .replace('%HH', data.hour)
                    .replace('%MM', data.minute);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let nextRobberySegment = segmentHelper.findSegmentRobbery(workingSegments,
                busySegments, duration, (robberySegment !== null) ? robberySegment.start + 30 : 0);
            if (nextRobberySegment !== null) {
                robberySegment = nextRobberySegment;

                return true;
            }

            return false;
        }
    };
};
