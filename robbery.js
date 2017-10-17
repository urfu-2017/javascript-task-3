'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;
const DAYS_OF_THE_WEEK = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const ROBBERS_TIME_FORMAT = /^([А-Я][А-Я])\s(\d\d):(\d\d)\+(\d+)$/;
const BANK_TIME_FORMAT = /^(\d\d):(\d\d)\+(\d+)$/;
const DAYS_IN_WEEK = 7;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_WEEK = DAYS_IN_WEEK * HOURS_IN_DAY * MINUTES_IN_HOUR;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
const HALF_AN_HOUR = 30;

function getBankScheduleAndTimeZone(workingHours) {
    let [, hoursFrom, minutesFrom, zone] = workingHours.from.match(BANK_TIME_FORMAT);
    let [, hoursTo, minutesTo] = workingHours.to.match(BANK_TIME_FORMAT);
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
    let [, dayOfWeek, hh, mm, zone] = time.match(ROBBERS_TIME_FORMAT);
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
    generalSchedule = generalSchedule.sort((a, b) => a.from - b.from);

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
        } else if (i !== 0 && (i % MINUTES_IN_DAY === 0)) {
            inInterval = false;
            if (i - tempFrom >= duration && inInterval) {
                intervals.push({ from: tempFrom, to: i });
            }
        }
    });

    return intervals;
}

function joinSchedule(generalSchedule) {
    let joinedSchedule = [];
    joinedSchedule.push(generalSchedule[0]);
    for (let i = 1; i < generalSchedule.length; i++) {
        let current = joinedSchedule[joinedSchedule.length - 1];
        if (isIntersected(current, generalSchedule[i])) {
            current.to = Math.max(generalSchedule[i].to, current.to);
        } else {
            joinedSchedule.push(generalSchedule[i]);
        }
    }

    return joinedSchedule;
}

function getReflectedSchedule(joinedSchedule) {
    let reflectedSchedule = [];
    reflectedSchedule.push({ from: 0, to: joinedSchedule[0].from });
    for (let i = 0; i < joinedSchedule.length - 1; i++) {
        reflectedSchedule.push({ from: joinedSchedule[i].to, to: joinedSchedule[i + 1].from });
    }
    reflectedSchedule.push({
        from: joinedSchedule[joinedSchedule.length - 1].to, to: MINUTES_IN_DAY * 3
    });

    return reflectedSchedule;
}

function getRobberyIntervals(bankSchedule, reflectedSchedule, duration) {
    let result = [];
    bankSchedule.forEach(function (curBank) {
        reflectedSchedule.forEach(function (curRob) {
            if (isIntersected(curBank, curRob)) {
                let a = Math.max(curBank.from, curRob.from);
                let b = Math.min(curBank.to, curRob.to);
                result.push({ from: a, to: b });
            }
        });
    });
    result = result.filter(x => x.to - x.from >= duration);

    return result;
}

function isIntersected(first, second) {
    return first.to >= second.from && second.to >= first.from;
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
    // console.info(JSON.stringify(bankSchedule));
    let generalSchedule = getGeneralSchedule(schedule, zone);
    console.info('generalSchedule ' + JSON.stringify(generalSchedule));
    let joinedSchedule = joinSchedule(generalSchedule);
    console.info('joinedSchedule ' + JSON.stringify(joinedSchedule));
    let reflectedSchedule = getReflectedSchedule(joinedSchedule);
    console.info('reflectedSchedule ' + JSON.stringify(reflectedSchedule));
    let robberyIntervals = getRobberyIntervals(bankSchedule, reflectedSchedule, duration);
    console.info('robberyIntervals ' + JSON.stringify(robberyIntervals));


    let [bankTimeLine, robbersTimeLine] = getTimeLines(bankSchedule, generalSchedule);
    let timeline = getTimeLine(bankTimeLine, robbersTimeLine);
    let intervals = getIntervals(timeline, duration);
    console.info(JSON.stringify(intervals));
    let niceTime = intervals[0];


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
            if (!this.exists()) {
                return '';
            }
            let startMinute = niceTime.from;
            let mm = startMinute % MINUTES_IN_HOUR;
            let hh = ((startMinute - mm) / MINUTES_IN_HOUR) % HOURS_IN_DAY;
            let dayNumber = Math.floor(((startMinute - mm) / MINUTES_IN_HOUR) / HOURS_IN_DAY);
            let dd = Object.keys(DAYS_OF_THE_WEEK)[dayNumber];
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
            if (!this.exists()) {
                return false;
            }
            intervals = intervals.filter(x => x.to - x.from >= duration);
            if (intervals.length === 1 &&
                (intervals[0].to - intervals[0].from - HALF_AN_HOUR < duration)) {
                return false;
            }

            for (let i = 0; i < intervals.length; i++) {
                intervals[i].from += HALF_AN_HOUR;
                if (intervals[i].to - intervals[i].from >= duration) {
                    niceTime = intervals[i];

                    return true;
                } else if (intervals[i + 1]) {
                    niceTime = intervals[i + 1];

                    return true;
                }
            }

            return false;
        }
    };
};
