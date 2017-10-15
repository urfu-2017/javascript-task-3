'use strict';

let TIME_FORMAT = /^(\d{2}):(\d{2})\+(\d+)$/;
let WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
let ROBBER_NAMES = ['Danny', 'Rusty', 'Linus'];
let MINUTES_IN_HOUR = 60;
let HOURS_IN_DAY = 24;
let MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
let DAYS_FOR_ROBBERY_COUNT = 3;
let EVENT_OF_CAPTURE = 1;
let EVENT_OF_RELEASE = 2;

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
    let workingTime = {
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
            let newRobberyTime =
                findRobberyTime(events, duration, robberyTime + MINUTES_IN_HOUR / 2);
            if (newRobberyTime) {
                robberyTime = newRobberyTime;

                return true;
            }

            return false;
        }
    };
};

function findRobberyTime(events, duration, startMinute = 0) {
    let capturedEntityCount = 2;
    let timeLine = events.slice();
    timeLine.push({
        totalMinutes: startMinute,
        eventType: EVENT_OF_RELEASE
    });
    timeLine.sort((a, b) => a.totalMinutes - b.totalMinutes);
    for (var i = 0; i < timeLine.length - 1; i++) {
        if (timeLine[i].eventType === EVENT_OF_CAPTURE) {
            capturedEntityCount++;
        } else {
            capturedEntityCount--;
        }
        if (capturedEntityCount === 0 &&
            timeLine[i + 1].totalMinutes - timeLine[i].totalMinutes >= duration
        ) {
            return timeLine[i].totalMinutes;
        }
    }

    return null;
}

function parseDate(date) {
    let day = date.slice(0, 2);
    let time = parseTime(date.slice(3));
    if (time && WEEK_DAYS.indexOf(day) !== -1) {
        time.day = day;

        return time;
    }

    return null;
}

function parseTime(time) {
    let parseResult = time.match(TIME_FORMAT);
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
    let totalHours = date.hours - date.timeZone + timeZone;
    if ('day' in date) {
        totalHours += WEEK_DAYS.indexOf(date.day) * HOURS_IN_DAY;
    }

    return totalHours * 60 + date.minutes;
}


function minutesToDate(minutes) {
    let day = WEEK_DAYS[Math.floor(minutes / MINUTES_IN_DAY)];
    minutes = minutes % MINUTES_IN_DAY;
    let hours = Math.floor(minutes / MINUTES_IN_HOUR);
    minutes = minutes % MINUTES_IN_HOUR;

    return {
        day: day,
        hours: hours,
        minutes: minutes
    };
}

function generateEventsList(schedule, workingTime) {
    let events = [];
    ROBBER_NAMES.forEach(name => {
        if (!(name in schedule)) {
            throw Error(`no schedule for ${name}`);
        }
        schedule[name].forEach(busyTime => {
            let minutesFrom =
                dateToTotalMinutes(parseDate(busyTime.from), workingTime.from.timeZone);
            let minutesTo =
                dateToTotalMinutes(parseDate(busyTime.to), workingTime.to.timeZone);
            if (minutesFrom > minutesTo) {
                throw Error(
                    `start time {${busyTime.from}} cannot
                     be greater than end time {${busyTime.to}}`);
            }
            events.push({
                totalMinutes: minutesFrom,
                eventType: EVENT_OF_CAPTURE
            });
            events.push({
                totalMinutes: minutesTo,
                eventType: EVENT_OF_RELEASE
            });
        });
    });
    for (let i = 0; i < DAYS_FOR_ROBBERY_COUNT; i++) {
        let minutesFrom =
            dateToTotalMinutes(workingTime.from, workingTime.from.timeZone) + MINUTES_IN_DAY * i;
        let minutesTo =
            dateToTotalMinutes(workingTime.to, workingTime.to.timeZone) + MINUTES_IN_DAY * i;
        events.push({
            totalMinutes: minutesFrom,
            eventType: EVENT_OF_RELEASE
        });
        events.push({
            totalMinutes: minutesTo,
            eventType: EVENT_OF_CAPTURE
        });
    }

    return events;
}
