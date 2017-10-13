'use strict';

const ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];
const DATE_PATTERN = /(ПН|ВТ|СР)? ?(\d\d):(\d\d)\+(\d+)/;

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
    const [, bankTimezone] = /.*\+(\d+)/.exec(workingHours.from);
    const bankSchedule = getBankSchedule(workingHours);
    const gangSchedule = getGangSchedule(schedule);
    const mergedSchedule = mergeSchedule(gangSchedule);
    let interval = [
        new Date(Date.UTC(1970, 5, 1, 0, 0)),
        new Date(Date.UTC(1970, 5, 4, 0, 0))
    ];
    const gangFreeTime = getComplementTo(...interval, mergedSchedule);
    const robberyTimes = getRobberyTimes(gangFreeTime, bankSchedule, duration);
    // console.info(robberyTimes);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (!robberyTimes[0]) {
                return false;
            }

            return true;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!robberyTimes[0]) {
                return '';
            }

            const robberyTime = getLaterDate(robberyTimes[0].from, bankTimezone * 60);

            return template
                .replace('%HH', robberyTime.getUTCHours())
                .replace('%MM', robberyTime.getUTCMinutes())
                .replace('%DD', ROBBERY_DAYS[robberyTime.getUTCDay() - 1]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (this.exists()) {
                const appropriateInterval = robberyTimes[0];
                const newStartTime = getLaterDate(robberyTimes[0].from, 30);
                const newEndTime = getLaterDate(newStartTime, duration);
                if (isTimeInInterval(newEndTime, appropriateInterval)) {
                    appropriateInterval.from = newStartTime;

                    return true;
                }
            } else if (robberyTimes.length > 1) {
                robberyTimes.shift();

                return true;
            }
            console.info('false');

            return false;
        }
    };
};

function getRobberyTimes(gangFreeTime, bankSchedule, duration) {
    const result = [];

    bankSchedule.forEach(workingHours => {
        gangFreeTime.forEach(freeTimeInterval => {
            const intersection = getIntersection(freeTimeInterval, workingHours);
            if (!intersection) {
                return;
            }

            if (isTimeInInterval(getLaterDate(intersection.from, duration), intersection)) {
                result.push(intersection);
            }
        });
    });

    return result;
}

function areIntervalsIntersected(one, other) {

    return isTimeInInterval(one.from, other) || isTimeInInterval(one.to, other) ||
           one.from < other.from && one.to > other.to;
}

function getIntersection(one, other) {
    if (!areIntervalsIntersected(one, other)) {
        return;
    }

    return {
        from: new Date(Math.max(one.from, other.from)),
        to: new Date(Math.min(one.to, other.to))
    };
}

function getComplementTo(start, end, otherIntervals) {
    const result = [];
    let interval = { from: start };

    for (const current of otherIntervals) {
        interval.to = current.from;
        result.push(interval);
        interval = { from: current.to };
    }
    interval.to = end;
    result.push(interval);

    return result;
}

function getBankSchedule(workingHours) {
    return ROBBERY_DAYS
        .map(day => {
            return {
                from: `${day} ${workingHours.from}`,
                to: `${day} ${workingHours.to}`
            };
        })
        .map(parseInterval);
}

function getGangSchedule(gangSchedule) {
    return Object.values(gangSchedule)
        .map(banditSchedule => {
            return banditSchedule.map(parseInterval);
        });
}

function parseInterval(interval) {
    return {
        from: getDate(interval.from),
        to: getDate(interval.to)
    };
}

function mergeSchedule(schedule) {
    const sortedIntervals = schedule
        .reduce((generalSchedule, personalSchedule) => {
            return generalSchedule.concat(personalSchedule);
        })
        .sort((one, other) => one.from - other.from);

    return mergeIntervals(sortedIntervals);
}

function mergeIntervals(intervals) {
    const result = [];
    let previous = intervals[0];
    for (let i = 1; i < intervals.length; i++) {
        let current = intervals[i];
        if (isTimeInInterval(current.from, previous)) {
            previous.to = current.to;
        } else {
            result.push(previous);
            previous = current;
        }
    }
    result.push(previous);

    return result;
}

function isTimeInInterval(time, interval) {
    return interval.from <= time && time <= interval.to;
}

function getDate(date) {
    const match = DATE_PATTERN.exec(date);
    const [, day, hours, minutes, timezone] = match;

    return createDate(ROBBERY_DAYS.indexOf(day) + 1, hours, minutes, timezone);
}

function createDate(day, hours, minutes, utcOffset = 0) {
    //  June, 1970 starts with Monday
    return new Date(Date.UTC(1970, 5, day, hours - utcOffset, minutes));
}

function getLaterDate(date, shift) {
    return new Date(date.getTime() + getMsFromMinutes(shift));
}

function getMsFromMinutes(minutes) {
    return minutes * 60 * 1000;
}
