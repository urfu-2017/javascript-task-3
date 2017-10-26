'use strict';
const DAYS = ['ПН', 'ВТ', 'СР'];
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;

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

    const bankTimezone = parseDate(workingHours.from).timezone;
    const notWorkingHoursOfBank = getNotWorkingHours(workingHours, bankTimezone);
    const sheduleWithBank = Object.assign({ bank: notWorkingHoursOfBank }, schedule);
    const parsedSchedule = getParsedSchedule(sheduleWithBank, bankTimezone);
    const intervals = getIntervalsOfFreeTime(parsedSchedule);
    let appropriateIntervals = intervals.filter(interval => interval.size >= duration);
    let timeForRobbery = appropriateIntervals.length ? appropriateIntervals[0].leftBorder
        : undefined;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return timeForRobbery !== undefined;
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
            const date = translateFromMinutes(timeForRobbery);

            return template.replace('%HH', addLeadingZero(date.hours))
                .replace('%MM', addLeadingZero(date.remainingMinutes))
                .replace('%DD', date.day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            appropriateIntervals = appropriateIntervals.filter(interval => {
                let possibleRobberyTime = Math.max(timeForRobbery + 30, interval.leftBorder);

                return possibleRobberyTime + duration <= interval.leftBorder + interval.size;
            });

            if (!appropriateIntervals.length) {
                return false;
            }
            timeForRobbery = Math.max(appropriateIntervals[0].leftBorder, timeForRobbery + 30);

            return true;
        }
    };
};

function getParsedSchedule(schedule, bankTimezone) {
    let parsedSchedule = [];
    Object.values(schedule).forEach(scheduleOnWeek => {
        scheduleOnWeek.forEach(interval => {
            const parsedFromDate = parseDate(interval.from);
            const parsedToDate = parseDate(interval.to);
            const timeFromInMinutes = timeToMinutes(parsedFromDate, bankTimezone);
            const timeToInMinutes = timeToMinutes(parsedToDate, bankTimezone);
            parsedSchedule.push({ minutes: timeFromInMinutes, step: 'from' },
                { minutes: timeToInMinutes, step: 'to' });
        });
    });

    return parsedSchedule;
}

function addLeadingZero(number) {
    return `0${number}`.slice(-2);
}

function translateFromMinutes(minutes) {
    const hours = Math.floor(minutes / MINUTES_IN_HOUR) % HOURS_IN_DAY;
    const day = DAYS[Math.floor(Math.floor(minutes / MINUTES_IN_HOUR) / HOURS_IN_DAY)];
    const remainingMinutes = minutes % MINUTES_IN_HOUR;
    if (!day) {
        return null;
    }

    return { day, hours, remainingMinutes };
}

function getNotWorkingHours(workingHours, bankTimezone) {
    const workingHoursFrom = workingHours.from;
    const workingHoursTo = workingHours.to;

    return DAYS.reduce(function (accumulator, day) {
        accumulator.push({ from: day + ' 00:00+' + bankTimezone,
            to: day + ' ' + workingHoursFrom }, { from: day + ' ' + workingHoursTo,
            to: day + ' 23:59+' + bankTimezone });

        return accumulator;
    }, []);
}

function parseDate(date) {
    const [time, day] = date.split(' ').reverse();
    const [hoursAndMinutes, timezone] = time.split('+');
    const [hours, minutes] = hoursAndMinutes.split(':');

    return { day, hours, minutes, timezone };
}

function timeToMinutes(time, bankTimezone) {
    const day = time.day;
    const hours = Number(time.hours);
    const minutes = Number(time.minutes);
    const robberTimezone = Number(time.timezone);
    const translatedTime = hours * MINUTES_IN_HOUR + minutes + DAYS.indexOf(day) *
        HOURS_IN_DAY * MINUTES_IN_HOUR + (bankTimezone - robberTimezone) * MINUTES_IN_HOUR;

    return translatedTime;
}

function getIntervalsOfFreeTime(parsedSchedule) {
    let lengthOfInterval = 0;
    const sortedSchedule = parsedSchedule.sort((a, b) => Number(a.minutes) - Number(b.minutes));
    let countFrom = 0;
    let countTo = 0;
    let currentStartMinutes;
    let previousEndMinutes = 0;
    // let intervals = [];

    return sortedSchedule.reduce(function (intervals, event) {
        if (!countFrom) {
            currentStartMinutes = event.minutes;
        }
        if (event.step === 'from') {
            countFrom += 1;
        } else {
            countTo += 1;
        }
        if (countFrom === countTo) {
            countFrom = 0;
            countTo = 0;
            lengthOfInterval = currentStartMinutes - previousEndMinutes;
            intervals.push({ leftBorder: previousEndMinutes, size: lengthOfInterval });
            previousEndMinutes = event.minutes;
        }

        return intervals;
    }, []);
}
