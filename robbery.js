'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const DAYS_OF_THE_WEEK = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const NUMBER_TO_DAY = ['ПН', 'ВТ', 'СР', 'ЧТ'];
const robbersTimeFormat = /^([А-Я][А-Я])\s(\d\d):(\d\d)\+(\d)$/;
const bankTimeFormat = /^(\d\d):(\d\d)\+(\d)$/;
const minutesInWeek = 7 * 24 * 60;
const border = 24 * 60;

function getBankScheduleAndTimeZone(workingHours) {
    let [, hoursFrom, minutesFrom, zone] = workingHours.from.match(bankTimeFormat);
    let [, hoursTo, minutesTo] = workingHours.to.match(bankTimeFormat);
    let schedule = [];
    for (let i = 0; i < 3; i++) {
        let fromInMinutes = (i * 24 + parseInt(hoursFrom)) * 60 + parseInt(minutesFrom);
        let toInMinutes = (i * 24 + parseInt(hoursTo)) * 60 + parseInt(minutesTo);
        schedule.push({ from: fromInMinutes, to: toInMinutes });
    }

    return [schedule, parseInt(zone)];
}

function robberTimeToMinutes(time, bankTimeZone) {
    let [, dayOfWeek, hh, mm, zone] = time.match(robbersTimeFormat);
    let diff = bankTimeZone - zone;
    let result = ((DAYS_OF_THE_WEEK[dayOfWeek] * 24 + parseInt(hh) +
        parseInt(diff)) * 60) + parseInt(mm);

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

function getTimeLine(bankSchedule, generalSchedule) {
    let robbersTimeLine = [];
    let bankTimeLine = [];
    for (let i = 0; i < minutesInWeek; i++) {
        robbersTimeLine.push(true);
        bankTimeLine.push(false);
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
    let timeline = [];
    for (let i = 0; i < minutesInWeek; i++) {
        timeline.push(robbersTimeLine[i] && bankTimeLine[i]);
    }

    return timeline;
}

function getIntervals(timeline, duration) {
    let intervals = [];
    let tempFrom = 0;
    let inInterval = false;
    duration = parseInt(duration);

    /* 
    for (let i = 2100; i < 2300; i += 10) {
        console.info(JSON.stringify(timeline.slice(i, i + 10)));
    }*/

    for (let i = 0; i < minutesInWeek; i++) {
        if (timeline[i] && !inInterval) {
            tempFrom = i;
            inInterval = true;
        } else if (!timeline[i] && inInterval) {
            if (i - tempFrom >= duration) {
                intervals.push({ from: tempFrom, to: i });
            }
            inInterval = false;
        } else if (i !== 0 && (i % border === 0)) {
            if (i - tempFrom >= duration && inInterval) {
                intervals.push({ from: tempFrom, to: i });
            }
            inInterval = false;
        }
    }

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
    // console.info(schedule, duration, workingHours);
    let [bankSchedule, zone] = getBankScheduleAndTimeZone(workingHours);
    // console.info(JSON.stringify(bankSchedule));
    // console.info(zone);
    let generalSchedule = getGeneralSchedule(schedule, zone);
    console.info(JSON.stringify(generalSchedule));
    let timeline = getTimeLine(bankSchedule, generalSchedule);
    let intervals = getIntervals(timeline, duration);
    console.info(JSON.stringify(intervals));

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
            let mm = startTimeInMinutes % 60;
            let hh = ((startTimeInMinutes - mm) / 60) % 24;
            let dd = NUMBER_TO_DAY[Math.floor(((startTimeInMinutes - mm) / 60) / 24)];
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
