'use strict';

let TIME_FORMAT = /^(\d{2}):(\d{2})\+(\d+)$/;
let WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
let ROBBER_NAMES = ['Danny', 'Rusty', 'Linus'];

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
    var workingTime = {
        from: parseTime(workingHours.from),
        to: parseTime(workingHours.to)
    };
    let events = generateEventsList(schedule, workingTime);
    let robberyTime = findRobberyTime(events, duration);
    let isPossibleRobbery = robberyTime !== null;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return isPossibleRobbery;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyTime === null) {
                return '';
            }
            let date = minutesToDate(robberyTime);

            return template
                .replace('%DD', date.day)
                .replace('%HH', ('0' + date.hours).slice(-2))
                .replace('%MM', ('0' + date.minutes).slice(-2));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let newRobberyTime = findRobberyTime(events, duration, robberyTime + 30);
            if (newRobberyTime) {
                robberyTime = newRobberyTime;

                return true;
            }

            return false;
        }
    };
};

function findRobberyTime(events, duration, startMinute = 0) {
    let counter = -2;
    let timeLine = events.slice();
    timeLine.push({
        totalMinutes: startMinute,
        type: 1
    });
    timeLine.sort((a, b) => a.totalMinutes - b.totalMinutes);
    for (var i = 0; i < timeLine.length - 1; i++) {
        counter += timeLine[i].type;
        if (counter === 0 &&
            timeLine[i + 1].totalMinutes - timeLine[i].totalMinutes >= duration
        ) {
            return timeLine[i].totalMinutes;
        }
    }

    return null;
}

function parseDate(date) {
    var day = date.slice(0, 2);
    var time = parseTime(date.slice(3));
    if (time && WEEK_DAYS.indexOf(day) !== -1) {
        time.day = day;

        return time;
    }

    return null;
}

function parseTime(time) {
    var parseResult = time.match(TIME_FORMAT);
    if (parseResult) {
        return {
            hours: parseInt(parseResult[1]),
            minutes: parseInt(parseResult[2]),
            timeZone: parseInt(parseResult[3])
        };
    }

    return null;
}

function dateToTotalMinutes(date, timeZone = 0) {
    if (!date) {
        return null;
    }
    var totalHours = date.hours - date.timeZone + timeZone;
    if ('day' in date) {
        totalHours += WEEK_DAYS.indexOf(date.day) * 24;
    }

    return totalHours * 60 + date.minutes;
}


function minutesToDate(minutes) {
    let day = WEEK_DAYS[Math.floor(minutes / (24 * 60))];
    minutes = minutes % (24 * 60);
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;

    return {
        day: day,
        hours: hours,
        minutes: minutes
    };
}

function generateEventsList(schedule, workingTime) {
    var events = [];
    ROBBER_NAMES.forEach(name => {
        if (!(name in schedule)) {
            throw Error(`no schedule for ${name}`);
        }
        schedule[name].forEach(busyTime => {
            var minutesFrom =
                dateToTotalMinutes(parseDate(busyTime.from), workingTime.from.timeZone);
            var minutesTo =
                dateToTotalMinutes(parseDate(busyTime.to), workingTime.to.timeZone);
            if (minutesFrom > minutesTo) {
                throw Error(
                    `start time {${busyTime.from}} cannot
                     be greater than end time {${busyTime.to}}`);
            }
            events.push({
                totalMinutes: minutesFrom,
                type: -1
            });
            events.push({
                totalMinutes: minutesTo,
                type: 1
            });
        });
    });
    for (var i = 0; i < 3; i++) {
        var minutesFrom =
            dateToTotalMinutes(workingTime.from, workingTime.from.timeZone) + 24 * 60 * i;
        var minutesTo =
            dateToTotalMinutes(workingTime.to, workingTime.to.timeZone) + 24 * 60 * i;
        events.push({
            totalMinutes: minutesFrom,
            type: 1
        });
        events.push({
            totalMinutes: minutesTo,
            type: -1
        });
    }

    return events;
}
