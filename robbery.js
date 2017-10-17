'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const TIME_REGEXP = /([А-Я]{2})? ?(\d\d):(\d\d)\+(\d)/;
const DAYS = ['ПН', 'ВТ', 'СР'];
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
const PERSONS = ['Danny', 'Rusty', 'Linus'];

function parseTime(time) {
    let [, day, hours, minutes, timezone] = time.match(TIME_REGEXP);

    return { day, hours, minutes, timezone };
}

function toBankTimezone(time, bankTimezone) {
    let timezoneShift = bankTimezone ? bankTimezone - Number(time.timezone) : 0;
    let dayShift = (time.day ? DAYS.indexOf(time.day) : 0) * HOURS_IN_DAY;

    return (dayShift + Number(time.hours) + timezoneShift) * MINUTES_IN_HOUR + Number(time.minutes);
}

function parseRobbersSchedule(schedule, bankTimezone) {
    let parsedSchedule = [];
    Object.keys(schedule).forEach((person) => {
        schedule[person].forEach((segment) => {
            parsedSchedule.push({
                person,
                canRob: false,
                time: toBankTimezone(parseTime(segment.from), bankTimezone)
            });
            parsedSchedule.push({
                person,
                canRob: true,
                time: toBankTimezone(parseTime(segment.to), bankTimezone)
            });
        });
    });

    return parsedSchedule;

}

function compareInt(a, b) {
    if (a.time === b.time) {
        return 0;
    }

    return a.time > b.time ? 1 : -1;
}

function findAllMoments(parsedSchedule, duration) {
    let personsAvailability = new Set(PERSONS);
    let freeSegments = [];
    let currentSegment = { start: -1, end: -1 };
    let ts = parsedSchedule.sort(compareInt);
    ts.forEach(segmentPart => {
        if (segmentPart.canRob) {
            personsAvailability.add(segmentPart.person);
        } else {
            personsAvailability.delete(segmentPart.person);
        }

        if (personsAvailability.size === 4 && currentSegment.start === -1) {
            currentSegment.start = segmentPart.time;
        }

        if (personsAvailability.size !== 4 && currentSegment.start !== -1) {
            if (segmentPart.time - currentSegment.start >= duration) {
                currentSegment.end = segmentPart.time;
                freeSegments.push(currentSegment);
            }
            currentSegment = { start: -1, end: -1 };
        }
    });

    return freeSegments;
}

function createBankSchedule(workingHours) {
    let parsedWorkingHours = {
        from: toBankTimezone(parseTime(workingHours.from)),
        to: toBankTimezone(parseTime(workingHours.to))
    };
    let bankSchedule = [];
    DAYS.forEach(day => {
        let dayShift = DAYS.indexOf(day) * MINUTES_IN_DAY;
        bankSchedule.push({
            person: 'bank',
            canRob: true,
            time: parsedWorkingHours.from + dayShift
        });
        bankSchedule.push({
            person: 'bank',
            canRob: false,
            time: parsedWorkingHours.to + dayShift
        });
    });

    return bankSchedule;
}

function formatOutput(template, robberyStartTime) {
    let minutes = (robberyStartTime.minutes >= 10 ? '' : '0') + robberyStartTime.minutes;
    let hours = (robberyStartTime.hours >= 10 ? '' : '0') + robberyStartTime.hours;

    return template
        .replace('%HH', hours)
        .replace('%MM', minutes)
        .replace('%DD', robberyStartTime.day);
}

function convertToTime(time) {
    let daysNumber = Math.floor(time / (MINUTES_IN_DAY));
    let day = DAYS[daysNumber];
    let minutes = time % (MINUTES_IN_HOUR);
    let hours = Math.floor((time - daysNumber * MINUTES_IN_DAY) / MINUTES_IN_HOUR);

    return { day, minutes, hours };
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
    let bankTimezone = parseTime(workingHours.from).timezone;
    let bankSchedule = createBankSchedule(workingHours);
    let joinedSchedule = parseRobbersSchedule(schedule, bankTimezone).concat(bankSchedule);
    let robberyMoments = findAllMoments(joinedSchedule, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyMoments.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (robberyMoments.length === 0) {
                return '';
            }

            return formatOutput(template, convertToTime(robberyMoments[0].start));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyMoments.length === 0) {
                return false;
            }
            let nextMomentStart = robberyMoments[0].start + 30;
            let postponedMoments = robberyMoments.filter(m => {
                return nextMomentStart + duration <= m.end;
            });
            if (postponedMoments.length !== 0) {
                robberyMoments = postponedMoments;
                robberyMoments[0].start = Math.max(robberyMoments[0].start, nextMomentStart);
            }

            return postponedMoments.length !== 0;
        }
    };
};
