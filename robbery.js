'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
const TEMPLATE_TIME = /([ПВСЧ][НТРБС])\s([0-2]\d):([0-5]\d)\+(\d{1,2})/;
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];


const parseTime = function (timeString, timeZone) {
    const time = TEMPLATE_TIME.exec(timeString);
    const day = DAYS.indexOf(time[1]);
    const hours = parseInt(time[2]);
    const minutes = parseInt(time[3]);
    const shiftOnTimeZone = timeZone - parseInt(time[4]);

    return day * MINUTES_IN_DAY + (hours + shiftOnTimeZone) * MINUTES_IN_HOUR + minutes;
};

const getBusyTime = function (schedule, timeZone) {
    let intervals = [];
    Object.keys(schedule).forEach(function (name) {
        schedule[name].forEach(function (interval) {
            intervals.push({
                'from': parseTime(interval.from, timeZone),
                'to': parseTime(interval.to, timeZone)
            });
        });
    });

    return intervals.sort(function (a, b) {
        return a.from - b.from;
    });
};

const getFreeTime = function (intervals) {
    let start = 0;
    let freeTime = [];
    intervals.forEach(function (interval) {
        if (interval.from > start) {
            freeTime.push({
                'from': start,
                'to': interval.from
            });
        }
        if (interval.to > start) {
            start = interval.to;
        }
    });

    return freeTime;
};

const getСlosedBankTime = function (workingHours, timeZone) {

    return [{ 'from': 'ПН 00:00+' + timeZone.toString(), 'to': 'ПН ' + workingHours.from },
        { 'from': 'ПН ' + workingHours.to, 'to': 'ВТ ' + workingHours.from },
        { 'from': 'ВТ ' + workingHours.to, 'to': 'СР ' + workingHours.from },
        { 'from': 'СР ' + workingHours.to, 'to': 'СР 23:59+' + timeZone.toString() }
    ];
};

const addNullStart = function (value) {
    return (value < 10) ? '0' + value : value.toString();
};

const getDifferentTime = function (time) {
    const day = Math.floor(time / MINUTES_IN_DAY);
    const hours = Math.floor(time / MINUTES_IN_HOUR) - day * HOURS_IN_DAY;
    const minutes = time % MINUTES_IN_HOUR;

    return {
        day: DAYS[day],
        hours: addNullStart(hours),
        minutes: addNullStart(minutes)
    };
};

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
    const timeZone = parseInt(workingHours.from.split('+')[1]);
    schedule.bank = getСlosedBankTime(workingHours, timeZone);
    const busyIntervals = getBusyTime(schedule, timeZone);
    let intervalsForRobbery = getFreeTime(busyIntervals)
        .filter(function (interval) {
            return interval.from + duration <= interval.to;
        });
    let startRobbery;
    if (intervalsForRobbery.length > 0) {
        startRobbery = intervalsForRobbery[0].from;
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return (startRobbery !== undefined);
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
            const time = getDifferentTime(startRobbery);

            return template
                .replace('%DD', time.day)
                .replace('%HH', time.hours)
                .replace('%MM', time.minutes);
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
            let newStart = startRobbery + 30;
            while (intervalsForRobbery.length > 0 &&
                intervalsForRobbery[0].to < newStart + duration) {
                intervalsForRobbery.shift();
            }
            if (intervalsForRobbery.length === 0) {
                return false;
            }

            if (intervalsForRobbery[0].from < newStart) {
                intervalsForRobbery[0].from = newStart;
                startRobbery = newStart;
            } else {
                startRobbery = intervalsForRobbery[0].from;
            }

            return true;
        }
    };
};
