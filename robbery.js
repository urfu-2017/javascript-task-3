'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
const TIME_REGEXP = /(\d\d):(\d\d)\+(\d)/;
const DAYS_TO_INT = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2,
    'ЧТ': 3,
    'ПТ': 4,
    'СБ': 5,
    'ВС': 6
};
const INT_TO_DAYS = {
    0: 'ПН',
    1: 'ВТ',
    2: 'СР',
    3: 'ЧТ',
    4: 'ПТ',
    5: 'СБ',
    6: 'ВС'
};
const SCHEDULES_INDEXES = {
    'Danny': 0,
    'Rusty': 1,
    'Linus': 2
};
const DAYS_TO_ROBBER = ['ПН', 'ВТ', 'СР'];

function convertToMinutes(time, bankTimeZone) {
    let dayShift = time.day ? DAYS_TO_INT[time.day] * HOURS_IN_DAY : 0;
    let timeZoneShift = bankTimeZone ? (bankTimeZone - time.timeZone) : 0;

    return (dayShift + time.hours + timeZoneShift) * MINUTES_IN_HOUR + time.minutes;
}

function parseTime(time) {
    let match = time.match(TIME_REGEXP);

    return {
        hours: Number(match[1]),
        minutes: Number(match[2]),
        timeZone: Number(match[3])
    };
}

function parseTimeWithDay(from) {
    let time = parseTime(from.substring(3));
    time.day = from.substr(0, 2);

    return time;
}

function parseRobbersTime(robbersTime, bankTimeZone) {
    return {
        from: convertToMinutes(parseTimeWithDay(robbersTime.from), bankTimeZone),
        to: convertToMinutes(parseTimeWithDay(robbersTime.to), bankTimeZone)
    };
}

function parseBankSchedule(bankTime) {
    let from = parseTime(bankTime.from);
    let to = parseTime(bankTime.to);
    let bankSchedule = [];
    Object.keys(DAYS_TO_INT).forEach((day) => {
        to.day = day;
        from.day = day;
        bankSchedule.push({ time: convertToMinutes(from), person: 3, canRobBank: true });
        bankSchedule.push({ time: convertToMinutes(to), person: 3, canRobBank: false });
    });

    return bankSchedule;
}

function unionRobbersSchedules(schedule, bankTimeZone) {
    let res = [];
    Object.keys(schedule)
        .forEach(function (name) {
            schedule[name].forEach(function (time) {
                let parsedTime = parseRobbersTime(time, bankTimeZone);
                let personIndex = SCHEDULES_INDEXES[name];
                res.push({ time: parsedTime.from, person: personIndex, canRobBank: false });
                res.push({ time: parsedTime.to, person: personIndex, canRobBank: true });
            });
        });

    return res;
}

function sortScheduleSegments(schedule) {
    return schedule.sort(function (a, b) {
        if (a.time === b.time) {
            return 0;
        }

        return a.time > b.time ? 1 : -1;
    });
}

function getAllRobberiesTimes(sortedSchedule, duration) {
    let personAvailable = [true, true, true, false];
    let robberies = [];
    let currentRobbery = { start: 0 };
    sortedSchedule.forEach((segmentPart) => {
        personAvailable[segmentPart.person] = segmentPart.canRobBank;
        if (currentRobbery.start !== 0 && !segmentPart.canRobBank) {
            if (segmentPart.time - currentRobbery.start >= duration) {
                currentRobbery.end = segmentPart.time;
                robberies.push(currentRobbery);
            }
            currentRobbery = { start: 0 };
        }
        if (currentRobbery.start === 0 && personAvailable.every((v) => v)) {
            currentRobbery.start = segmentPart.time;
        }
    });

    return robberies;
}

function convertToTime(time) {
    let daysNumber = Math.floor(time / (MINUTES_IN_DAY));
    let day = INT_TO_DAYS[daysNumber];
    let minutes = time % (MINUTES_IN_HOUR);
    let hours = Math.floor((time - daysNumber * MINUTES_IN_DAY) / MINUTES_IN_HOUR);

    return { day, minutes, hours };
}

function formatOutput(template, robberyStartTime) {
    let minutes = (robberyStartTime.minutes >= 10 ? '' : '0') + robberyStartTime.minutes;
    let hours = (robberyStartTime.hours >= 10 ? '' : '0') + robberyStartTime.hours;

    return template
        .replace('%HH', hours)
        .replace('%MM', minutes)
        .replace('%DD', robberyStartTime.day);
}

function isRobberyEndBeforeThursday(robbery, duration) {
    let robberyEndTime = robbery.start + duration;

    return DAYS_TO_ROBBER.includes(convertToTime(robbery.start).day) &&
        DAYS_TO_ROBBER.includes(convertToTime(robberyEndTime).day);
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let bankTimeZone = parseTime(workingHours.from).timeZone;
    let bankSchedule = parseBankSchedule(workingHours);
    let robbersSchedules = unionRobbersSchedules(schedule, bankTimeZone);
    let sortedSchedule = sortScheduleSegments(robbersSchedules.concat(bankSchedule));
    let allRobberies = getAllRobberiesTimes(sortedSchedule, duration);
    let filteredRobberies = allRobberies.filter((robbery) =>
        isRobberyEndBeforeThursday(robbery, duration));


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return filteredRobberies.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (filteredRobberies.length === 0) {
                return '';
            }
            let robberyStartTime = convertToTime(
                filteredRobberies[0].start,
                bankTimeZone);

            return formatOutput(template, robberyStartTime);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let nextRobberyStart = filteredRobberies[0].start + 30;
            let postponedRobberies = filteredRobberies.filter((robbery) => {
                let postponedRobberyEnd = nextRobberyStart + duration;

                return postponedRobberyEnd <= robbery.end &&
                    DAYS_TO_ROBBER.includes(convertToTime(postponedRobberyEnd).day);
            });
            if (postponedRobberies.length !== 0) {
                filteredRobberies = postponedRobberies;
                filteredRobberies[0].start = Math.max(filteredRobberies[0].start, nextRobberyStart);
            }

            return postponedRobberies.length !== 0;
        }
    };
};
