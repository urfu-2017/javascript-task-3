'use strict';

exports.isStar = true;

const CURRENT_YEAR = 2017;
const CURRENT_MONTH = 10;
const HOUR_IN_MILLISEC = 1000 * 60 * 60;
const MINUTE_IN_MILLISEC = 1000 * 60;
const HALF_HOUR = 30;
const HALF_HOUR_IN_MILLISEC = HALF_HOUR * MINUTE_IN_MILLISEC;
const ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];


/**
 * @param {String} string
 * @returns {String}
 */
function getDay(string) {
    return string.substr(0, 2);
}

/**
 * @param {String} day
 * @returns {Number}
 */
function getNumberOfDay(day) {
    return ROBBERY_DAYS.indexOf(getDay(day)) + 1;
}

/**
 * @param {String} string
 * @returns {Number}
 */
function getHours(string) {
    return string.substring(3, 5);
}

/**
 * @param {String} string
 * @returns {Number}
 */
function getMinutes(string) {
    return string.substring(6, 8);
}


/**
 * @param {String} time
 * @returns {Number}
 */
function getTimeZone(time) {
    return time.substr(-1);
}

/**
 * @param {String} string
 * @param {Number} day
 * @param {Number} hours
 * @param {Number} minutes
 * @returns {String}
 */
function getCorrectFormat(string, day, hours, minutes) {
    return string
        .replace('%DD', day)
        .replace('%HH', hours)
        .replace('%MM', minutes);
}

/**
 * @param {Array} schedule
 * @returns {Array}
 */
function crossElements(schedule) {
    let connectedSchedule = [];
    let from = 0;
    let to = 0;
    schedule.forEach((time, i) => {
        from = time.from;
        to = time.to;
        schedule.forEach((time2, j) => {
            if (i !== j && from <= time2.to && to >= time2.from) {
                from = Math.max(from, time2.from);
                to = Math.min(to, time2.to);
            }
        });
        connectedSchedule.push({ from, to });
    });

    return connectedSchedule;
}

/**
 * @param {String} time
 * @param {Number} day
 * @param {Number} timezone
 * @returns {Object}
 */
function bankUTCTime(time, day, timezone) {
    return Date.UTC(
        CURRENT_YEAR,
        CURRENT_MONTH,
        day + 1,
        time.substring(0, 2),
        time.substring(3, 5)) - timezone;
}

/**
 * @param {Object} time
 * @returns {Array}
 */
function toBankUTCTime(time) {
    let scheduleBank = [];
    let timezone = getTimeZone(time.from) * HOUR_IN_MILLISEC;
    for (let i = 0; i <= 2; i++) {
        let from = bankUTCTime(time.from, i, timezone);
        let to = bankUTCTime(time.to, i, timezone);
        scheduleBank.push({ from, to });
    }

    return scheduleBank;
}

/**
 * @param {Object} time
 * @param {Number} timezone
 * @returns {Object}
 */
function utcTimeForRobber(time, timezone) {
    return Date.UTC(
        CURRENT_YEAR,
        CURRENT_MONTH,
        getNumberOfDay(time),
        getHours(time),
        getMinutes(time)) - timezone;
}

/**
 * @param {Object} time
 * @returns {Object}
 */
function toUTC(time) {
    let timezone = getTimeZone(time.from) * HOUR_IN_MILLISEC;
    time.from = utcTimeForRobber(time.from, timezone);
    time.to = utcTimeForRobber(time.to, timezone);

    return time;
}

/**
 * @param {Object} schedule
 * @returns {Array}
 */
function mergeTime(schedule) {
    let merged = [];
    Object.keys(schedule).forEach(robber => {
        schedule[robber].forEach(time => {
            merged.push({ from: time.from, to: time.to });
        });
    });

    return merged;
}

/**
 * @param {Array} schedule
 * @returns {Array}
 */
function mixSchedule(schedule) {
    let connectedSchedule = [];
    let from = 0;
    let to = 0;
    schedule.forEach((time, i) => {
        from = time.from;
        to = time.to;
        schedule.forEach((time2, j) => {
            if (i !== j &&
                from <= time2.to && to >= time2.from) {
                from = Math.min(from, time2.from);
                to = Math.max(to, time2.to);
            }
        });
        connectedSchedule.push({ from, to });
    });

    return connectedSchedule;
}

/**
 * @param {Array} schedule
 * @returns {Array}
 */
function deleteCopies(schedule) {
    if (schedule.length !== 0) {
        schedule.reduceRight((previousValue, currentValue, index) => {
            if (currentValue.from === previousValue.from && currentValue.to === previousValue.to) {
                schedule.splice(index, 1);
            }

            return currentValue;
        });
    }

    return schedule;
}

/**
 * @param {Array} commonSchedule
 * @param {Array} bankSchedule
 * @param {Number} timezone
 * @param {Number} duration
 * @returns {Array}
 */
function reverseSchedule(commonSchedule, bankSchedule, timezone, duration) {
    if ((bankSchedule[0].to - bankSchedule[0].from) - duration * MINUTE_IN_MILLISEC < 0) {
        return [];
    }
    let freeTimes = [];
    let range = {
        from: Date.UTC(CURRENT_YEAR, CURRENT_MONTH, 1, 0, 0) - timezone,
        to: Date.UTC(CURRENT_YEAR, CURRENT_MONTH, 3, 23, 59) - timezone };
    bankSchedule.forEach(day => {
        commonSchedule.push({ from: range.from, to: day.from });
        commonSchedule.push({ from: day.to, to: range.to });
    });
    commonSchedule.forEach(badTime => {
        if (Math.max(range.from, badTime.from) === Math.min(range.to, badTime.from) &&
            badTime.from !== range.from) {
            freeTimes.push({ from: range.from, to: badTime.from });
        }
        if (Math.max(range.from, badTime.to) === Math.min(range.to, badTime.to) &&
            badTime.to !== range.to) {
            freeTimes.push({ from: badTime.to, to: range.to });
        }
    });

    return freeTimes;
}

/**
 * @param {Array} freeTime
 * @param {Number} duration
 * @returns {Array}
 */
function findFreeTimeForRobbers(freeTime, duration) {
    duration *= MINUTE_IN_MILLISEC;
    let robberyTimes = [];
    freeTime.forEach(time => {
        if (time.to - time.from >= duration) {
            robberyTimes.push(time);
        }
    });

    return robberyTimes;
}

/**
 * @param {Object} element1
 * @param {Object} element2
 * @returns {Object}
 */
function forSort(element1, element2) {
    return element1.from - element2.from;
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */

exports.getAppropriateMoment = (schedule, duration, workingHours) => {
    let timezone = getTimeZone(workingHours.from);
    let bankSchedule = toBankUTCTime(workingHours);
    let mergedTime = mergeTime(schedule).map(time => toUTC(time));
    let commonTime = mixSchedule(mergedTime);
    commonTime.sort(forSort);
    let reversedSchedule = reverseSchedule(
        deleteCopies(commonTime), bankSchedule, timezone * HOUR_IN_MILLISEC, duration);
    let freeTime = crossElements(reversedSchedule);
    freeTime.sort(forSort);
    let timeForRobbery = findFreeTimeForRobbers(deleteCopies(freeTime), duration);
    let start = 0;
    if (timeForRobbery.length > 0) {
        start = timeForRobbery[0].from;
    }

    return {

        interval: 0,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: () => {
            return timeForRobbery.length !== 0;
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
            let time = new Date(start + timezone * HOUR_IN_MILLISEC);

            return getCorrectFormat(
                template,
                ROBBERY_DAYS[time.getUTCDate() - 1],
                ('0' + time.getUTCHours()).slice(-2),
                ('0' + time.getUTCMinutes()).slice(-2));
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
            if (this.interval < timeForRobbery.length) {
                if (start + HALF_HOUR_IN_MILLISEC + duration * MINUTE_IN_MILLISEC <=
                    timeForRobbery[this.interval].to) {
                    start += HALF_HOUR_IN_MILLISEC;

                    return true;
                } else if (this.interval < timeForRobbery.length - 1) {
                    this.interval++;
                    start = timeForRobbery[this.interval].from;

                    return true;
                }
            }

            return false;
        }
    };
};
