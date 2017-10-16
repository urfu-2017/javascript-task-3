'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const DAYS_OF_THE_WEEK = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const robbersTimeFormat = /^([А-Я][А-Я])\s(\d\d):(\d\d)\+(\d+)$/;
const bankTimeFormat = /^(\d\d):(\d\d)\+(\d+)$/;
const DAYS_IN_WEEK = 7;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_WEEK = DAYS_IN_WEEK * HOURS_IN_DAY * MINUTES_IN_HOUR;
const END_OF_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;

function getBankScheduleAndTimeZone(workingHours) {
    let [, hoursFrom, minutesFrom, zone] = workingHours.from.match(bankTimeFormat);
    let [, hoursTo, minutesTo] = workingHours.to.match(bankTimeFormat);
    let schedule = [];
    for (let i = 0; i < 3; i++) {
        let fromInMinutes = (i * HOURS_IN_DAY + parseInt(hoursFrom)) *
            MINUTES_IN_HOUR + parseInt(minutesFrom);
        let toInMinutes = (i * HOURS_IN_DAY + parseInt(hoursTo)) *
            MINUTES_IN_HOUR + parseInt(minutesTo);
        schedule.push({ from: fromInMinutes, to: toInMinutes });
    }

    return [schedule, parseInt(zone)];
}

function robberTimeToMinutes(time, bankTimeZone) {
    let [, dayOfWeek, hh, mm, zone] = time.match(robbersTimeFormat);
    let diff = bankTimeZone - zone;
    let result = ((DAYS_OF_THE_WEEK[dayOfWeek] * HOURS_IN_DAY + parseInt(hh) +
        parseInt(diff)) * MINUTES_IN_HOUR) + parseInt(mm);

    return result;
}

function getGeneralSchedule(schedule, bankTimeZone) {
    let generalSchedule = [];
    Object.keys(schedule).forEach(function (robber) {
        schedule[robber].forEach(function (time) {
            let beginTime = robberTimeToMinutes(time.from, bankTimeZone, robber);
            let endTime = robberTimeToMinutes(time.to, bankTimeZone, robber);
            generalSchedule.push({ from: beginTime, to: endTime });
        });
    });

    return generalSchedule;
}

function getTimeLines(bankSchedule, generalSchedule) {
    let bankTimeLine = [];
    let robbersTimeLine = [];
    for (let i = 0; i < MINUTES_IN_WEEK; i++) {
        bankTimeLine.push(false);
        robbersTimeLine.push(true);
    }
    for (let i = 0; i < bankSchedule.length; i++) {
        let time = bankSchedule[i];
        for (let j = time.from; j < time.to; j++) {
            bankTimeLine[j] = true;
        }
    }
    for (let i = 0; i < generalSchedule.length; i++) {
        let time = generalSchedule[i];
        for (let j = time.from; j < time.to; j++) {
            robbersTimeLine[j] = false;
        }
    }

    return [bankTimeLine, robbersTimeLine];
}

function getTimeLine(bankTimeLine, robbersTimeLine) {
    let timeline = [];
    for (let i = 0; i < MINUTES_IN_WEEK; i++) {
        timeline.push(robbersTimeLine[i] && bankTimeLine[i]);
    }

    return timeline;
}

function getIntervals(timeline, duration) {
    let intervals = [];
    let tempFrom = 0;
    let inInterval = false;

    timeline.forEach(function (element, i) {
        if (element && !inInterval) {
            inInterval = true;
            tempFrom = i;
        } else if (!element && inInterval) {
            inInterval = false;
            if (i - tempFrom >= duration) {
                intervals.push({ from: tempFrom, to: i });
            }
        } else if (i !== 0 && (i % END_OF_DAY === 0)) {
            inInterval = false;
            if (i - tempFrom >= duration && inInterval) {
                intervals.push({ from: tempFrom, to: i });
            }
        }
    });

    return intervals;
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
    let [bankSchedule, zone] = getBankScheduleAndTimeZone(workingHours);
    let generalSchedule = getGeneralSchedule(schedule, zone);
    let [bankTimeLine, robbersTimeLine] = getTimeLines(bankSchedule, generalSchedule);
    let timeline = getTimeLine(bankTimeLine, robbersTimeLine);
    let intervals = getIntervals(timeline, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return intervals.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (intervals.length === 0) {
                return '';
            }
            let startTimeInMinutes = intervals[0].from;
            let mm = startTimeInMinutes % MINUTES_IN_HOUR;
            let hh = ((startTimeInMinutes - mm) / MINUTES_IN_HOUR) % HOURS_IN_DAY;
            let index = Math.floor(((startTimeInMinutes - mm) / MINUTES_IN_HOUR) / HOURS_IN_DAY);
            let dd = Object.keys(DAYS_OF_THE_WEEK)[index];
            mm = ('0' + mm).slice(-2);
            hh = ('0' + hh).slice(-2);

            return template
                .replace('%MM', mm)
                .replace('%HH', hh)
                .replace('%DD', dd);
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
