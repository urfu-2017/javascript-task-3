'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

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
    var BANKTIMEZONE = Number(workingHours.from.match(/\d+$/));

    function timeFormat(timeRobber) {
        var timeRobberHours = Number(timeRobber.match(/\d\d:/)[0].slice(0, 2));
        var timeRobberZone = Number(timeRobber.match(/\d+$/));
        var timeRobberMinutes = Number(timeRobber.match(/:\d\d/)[0].slice(1));
        var timeAsBank = ((timeRobberHours + (BANKTIMEZONE - timeRobberZone))) * 60 +
        timeRobberMinutes;
        var day = timeRobber.slice(0, 2);
        switch (day) {
            case 'ВТ': timeAsBank += 24 * 60;
                break;
            case 'СР': timeAsBank += 24 * 60;
                break;
            case 'ЧТ': timeAsBank += 24 * 60;
                break;
            case 'ПТ': timeAsBank += 24 * 60;
                break;
            case 'СБ': timeAsBank += 24 * 60;
                break;
            default:
                break;
        }

        return timeAsBank;
    }

    var bool = true;
    function newFunction(i, k, all) {
        while (i + k < all.length) {
            if (all[i].from >= all[i + k].from && all[i].from <= all[i + k].to) {
                all[i].from = all[i + k].from;
                all[i].to = Math.max(all[i].to, all[i + k].to);
                all.splice(i + k, 1);
            } else if (all[i].to >= all[i + k].from && all[i].from <= all[i + k].to) {
                all[i].from = Math.min(all[i].from, all[i + k].from);
                all[i].to = all[i + 1].to;
                all.splice(i + k, 1);
            } else if (all[i].from < all[i + k].from && all[i].to > all[i + k].to) {
                all[i].from = all[i].from;
                all[i].to = all[i].to;
                all.splice(i + k, 1);
            } else {
                bool = false;
            }
            k += 1;
        }
    }

    function intervalBig(all) {
        for (var i = 0; i < all.length - 1; i++) {
            var k = 1;
            newFunction(i, k, all);
            if (bool) {
                i = 0;
            }
        }

        return all;
    }

    var all = [];

    for (var key in schedule) {
        if (schedule.hasOwnProperty(key)) {
            schedule[key]
                .forEach(fromTo => all.push({
                    from: timeFormat(fromTo.from),
                    to: timeFormat(fromTo.to)
                }));
        }
    }
    console.info(intervalBig(all));

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
