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

function translateTimeBank(time) {
    let hour = Number(time.slice(0, 2));
    let minute = Number(time.slice(3, 5));

    return hour * 60 + minute;
}

function translateTimeGuy(time) {
    let day = time.slice(0, 2);
    let hour = Number(time.slice(3, 5));
    let minute = Number(time.slice(6, 8));
    if (day === 'ПН') {
        return hour * 60 + minute;
    }
    if (day === 'ВТ') {
        return 1440 + hour * 60 + minute;
    }
    if (day === 'СР') {
        return 2880 + hour * 60 + minute;
    }
    if (day === 'ЧТ') {
        return 4320 + hour * 60 + minute;
    }
    if (day === 'ВС') {
        return -1440 + hour * 60 + minute;
    }

    return 5760;
}

function intersectTime(listTime, start, end, sliceTime) {
    if (start >= sliceTime[1] || end <= sliceTime[0]) {
        listTime.push(sliceTime);

        return listTime;
    }
    if (start > sliceTime[0] && end < sliceTime[1]) {
        listTime.push([sliceTime[0], start], [end, sliceTime[1]]);

        return listTime;
    }
    if (start <= sliceTime[0] && end < sliceTime[1]) {
        listTime.push([end, sliceTime[1]]);

        return listTime;
    }
    if (start > sliceTime[0] && end >= sliceTime[1]) {
        listTime.push([sliceTime[0], start]);

        return listTime;
    }

    return listTime;
}

function refinementTime(start, end, timeRobbery) {
    let listTime = [];
    for (let sliceTime of timeRobbery) {
        listTime = intersectTime(listTime, start, end, sliceTime);
    }

    return listTime;
}

function convertTime(time) {
    let minute = time % 60;
    let hour = (time % 1440 - time % 60) / 60;
    if (minute < 10) {
        minute = '0' + minute;
    }
    if (hour < 10) {
        hour = '0' + hour;
    }
    if (time < 1440) {
        return [hour, minute, 'ПН'];
    }
    if (time < 2880) {
        return [hour, minute, 'ВТ'];
    }

    return [hour, minute, 'СР'];
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let openBank = translateTimeBank(workingHours.from);
    let closeBank = translateTimeBank(workingHours.to);
    let timezoneBank = Number(workingHours.from.slice(6, 8));
    let timeRobbery = [[openBank, closeBank], [1440 + openBank, 1440 + closeBank],
        [2880 + openBank, 2880 + closeBank]];
    for (let guy of Object.keys(schedule)) {
        for (let workingGuy of schedule[guy]) {
            let timezoneGuy = Number(workingGuy.from.slice(9, 11));
            let startGuy = translateTimeGuy(workingGuy.from) + 60 * (timezoneBank - timezoneGuy);
            let endGuy = translateTimeGuy(workingGuy.to) + 60 * (timezoneBank - timezoneGuy);
            timeRobbery = refinementTime(startGuy, endGuy, timeRobbery);
        }
    }
    timeRobbery = timeRobbery.filter(entry => entry[1] - entry[0] >= duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return timeRobbery.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (timeRobbery.length !== 0) {
                let robbery = convertTime(timeRobbery[0][0]);

                return template.replace('%HH', robbery[0]).replace('%MM', robbery[1])
                    .replace('%DD', robbery[2]);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let fistSlice = timeRobbery[0];
            if (fistSlice[1] - fistSlice[0] >= duration + 30) {
                timeRobbery[0][0] += 30;

                return true;
            }
            timeRobbery.splice(0, 1);
            if (timeRobbery.length > 0) {
                return true;
            }
            timeRobbery.push(fistSlice);

            return false;
        }
    };
};
