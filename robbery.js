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
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let [hours, minutes, timezone] = workingHours.from.split(/:|\+/).map(x=> Number(x));
    
    let danny = schedule.Danny;
    let rusty = schedule.Rusty;
    let linus = schedule.Linus;

    let s1 = danny.filter(x => x.from.includes('ПН'))
        .map(function (x) {
            let [hoursFrom, minutesFrom, timezoneFrom] = x.from.substring(2).split(/:|\+/)
                .map(y => Number(y));
            let timezoneDiff = timezone - timezoneFrom;

            let [hoursTo, minutesTo, timezoneTo] = x.to.substring(2).split(/:|\+/)
                .map(y => Number(y));
            timezoneDiff = timezone - timezoneFrom;
            if (x.to.substring(0, 2) !== 'ПН') {
                hoursTo = hours;
                minutesTo = minutes;
            }

            return {
                hoursFrom: hoursFrom - timezoneDiff,
                minutesFrom: minutesFrom,
                hoursTo: hoursTo,
                minutesTo: minutesTo
            };
        });
    let s2 = rusty.filter(x => x.from.includes('ПН'))
        .map(function (x) {
            let [hoursFrom, minutesFrom, timezoneFrom] = x.from.substring(2).split(/:|\+/)
                .map(y => Number(y));
            let timezoneDiff = timezone - timezoneFrom;

            let [hoursTo, minutesTo, timezoneTo] = x.to.substring(2).split(/:|\+/)
                .map(y => Number(y));
            timezoneDiff = timezone - timezoneFrom;
            if (x.to.substring(0, 2) !== 'ПН') {
                    hoursTo = hours;
                    minutesTo = minutes;
                }
    
                return {
                    hoursFrom: hoursFrom - timezoneDiff,
                    minutesFrom: minutesFrom,
                    hoursTo: hoursTo,
                    minutesTo: minutesTo
                };
            });

    let s3 = linus.filter(x => x.from.includes('ПН'))
        .map(function (x) {
            let [hoursFrom, minutesFrom, timezoneFrom] = x.from.substring(2).split(/:|\+/)
                .map(y => Number(y));
            let timezoneDiff = timezone - timezoneFrom;

            let [hoursTo, minutesTo, timezoneTo] = x.to.substring(2).split(/:|\+/)
                .map(y => Number(y));
            timezoneDiff = timezone - timezoneFrom;
            if (x.to.substring(0, 2) !== 'ПН') {
                hoursTo = hours;
                minutesTo = minutes;
            }

            return {
                hoursFrom: hoursFrom - timezoneDiff,
                minutesFrom: minutesFrom,
                hoursTo: hoursTo,
                minutesTo: minutesTo
            };
        });

    let rez = s1.concat(s2).concat(s3);

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
