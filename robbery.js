'use strict';

exports.isStar = true;

const HOURS_IN_MILLISEC = 1000 * 60 * 60;
const MINUTES_IN_MILLISEC = 1000 * 60;
const HALF_HOUR = 30;
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const NUMBER_OF_DAYS_FOR_ROBBERY = 3;
const CURRENT_YEAR = 1970;
const CURRENT_MONTH = 0;
const START_ROBBERY_WEEK = 1;
const START_HOUR = 0;
const START_MINUTE = 0;
const END_ROBBERY_WEEK = 3;
const END_HOUR = 23;
const END_MINUTE = 59;

function utcTimeForBank(time, day, shift) {
    return Date.UTC(CURRENT_YEAR, CURRENT_MONTH, day + 1,
        Number(time.substring(0, 2)),
        Number(time.substring(3, 5))) - shift;
}

function toUTCBankTime(time) {
    let scheduleBank = [];
    let shift = Number(time.from.substring(6)) * HOURS_IN_MILLISEC;
    for (let i = 0; i <= NUMBER_OF_DAYS_FOR_ROBBERY - 1; i++) {
        let from = utcTimeForBank(time.from, i, shift);
        let to = utcTimeForBank(time.to, i, shift);
        scheduleBank.push({ from: from, to: to });
    }

    return scheduleBank;
}

function utcTimeForSchedule(time, shift) {
    return Date.UTC(CURRENT_YEAR, CURRENT_MONTH,
        DAYS.indexOf(time.substring(0, 2)) + 1,
        Number(time.substring(3, 5)),
        Number(time.substring(6, 8))) - shift;
}

function toUTC(time) {
    let shift = Number(time.from.substring(9)) * HOURS_IN_MILLISEC;
    time.from = utcTimeForSchedule(time.from, shift);
    time.to = utcTimeForSchedule(time.to, shift);

    return time;
}

function joinSchedule(schedule) {
    let joinedSchedule = [];
    Object.keys(schedule).forEach(function (robber) {
        schedule[robber].forEach(function (time) {
            joinedSchedule.push({ from: time.from, to: time.to });
        });
    });

    return joinedSchedule;
}

function connectSegments(schedule, action) {
    let connectedSchedule = [];
    let startTimeInterval = 0;
    let endTimeInterval = 0;
    schedule.forEach(function (time, i) {
        startTimeInterval = time.from;
        endTimeInterval = time.to;
        schedule.forEach(function (copyTime, j) {
            if (i !== j &&
                startTimeInterval <= copyTime.to && endTimeInterval >= copyTime.from) {
                if (action === 'intersection') {
                    startTimeInterval = Math.max(startTimeInterval, copyTime.from);
                    endTimeInterval = Math.min(endTimeInterval, copyTime.to);
                }
                if (action === 'combine') {
                    startTimeInterval = Math.min(startTimeInterval, copyTime.from);
                    endTimeInterval = Math.max(endTimeInterval, copyTime.to);
                }
            }
        });
        connectedSchedule.push({ from: startTimeInterval, to: endTimeInterval });
    });

    return connectedSchedule;
}


function removeDuplicate(schedule) {
    if (schedule.length !== 0) {
        schedule.reduceRight(function (previous, current, i) {
            if (current.from === previous.from && current.to === previous.to) {
                schedule.splice(i, 1);
            }

            return current;
        });
    }

    return schedule;
}

function reverseSchedule(commonSchedule, bankSchedule, shift, duration) {
    if ((bankSchedule[0].to - bankSchedule[0].from) - duration * MINUTES_IN_MILLISEC < 0) {
        return [];
    }
    let freeTimes = [];
    let daysRange = {
        from: Date.UTC(CURRENT_YEAR, CURRENT_MONTH, START_ROBBERY_WEEK,
            START_HOUR, START_MINUTE) - shift,
        to: Date.UTC(CURRENT_YEAR, CURRENT_MONTH, END_ROBBERY_WEEK,
            END_HOUR, END_MINUTE) - shift };
    bankSchedule.forEach(function (day) {
        commonSchedule.push({ from: daysRange.from, to: day.from });
        commonSchedule.push({ from: day.to, to: daysRange.to });
    });
    commonSchedule.forEach(function (badTime) {
        if (Math.max(daysRange.from, badTime.from) === Math.min(daysRange.to, badTime.from) &&
            badTime.from !== daysRange.from) {
            freeTimes.push({ from: daysRange.from, to: badTime.from });
        }
        if (Math.max(daysRange.from, badTime.to) === Math.min(daysRange.to, badTime.to) &&
            badTime.to !== daysRange.to) {
            freeTimes.push({ from: badTime.to, to: daysRange.to });
        }
    });

    return freeTimes;
}

function findRobberyTimes(freeTimes, duration) {
    duration *= MINUTES_IN_MILLISEC;
    let robberyTimes = [];
    freeTimes.forEach(function (time) {
        if (time.to - time.from >= duration) {
            robberyTimes.push(time);
        }
    });

    return robberyTimes;
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
    let shift = Number(workingHours.from.substring(6));
    let bankSchedule = toUTCBankTime(workingHours);
    let joinedSchedule = joinSchedule(schedule).map(function (time) {
        return toUTC(time);
    });
    let commonSchedule = connectSegments(joinedSchedule, 'combine');
    commonSchedule.sort(function (a, b) {
        return a.from - b.from;
    });
    commonSchedule = removeDuplicate(commonSchedule);
    let reversedSchedule = reverseSchedule(
        commonSchedule, bankSchedule, shift * HOURS_IN_MILLISEC, duration);
    let freeTimes = connectSegments(reversedSchedule, 'intersection');
    freeTimes.sort(function (a, b) {
        return a.from - b.from;
    });
    freeTimes = removeDuplicate(freeTimes);
    let robberyTimes = findRobberyTimes(freeTimes, duration);
    let startRobberyTime = 0;
    if (robberyTimes.length > 0) {
        startRobberyTime = robberyTimes[0].from;
    }

    return {

        currentPeriodOfRobbery: 0,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyTimes.length !== 0;
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
            let time = startRobberyTime + shift * HOURS_IN_MILLISEC;
            time = new Date(time);
            let day = DAYS[time.getUTCDate() - 1];
            let hours = ('0' + time.getUTCHours()).slice(-2);
            let minutes = ('0' + time.getUTCMinutes()).slice(-2);

            return template
                .replace('%DD', day)
                .replace('%HH', hours)
                .replace('%MM', minutes);
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
            if (this.currentPeriodOfRobbery < robberyTimes.length) {
                if (startRobberyTime + (HALF_HOUR + duration) * MINUTES_IN_MILLISEC <=
                     robberyTimes[this.currentPeriodOfRobbery].to) {
                    startRobberyTime += HALF_HOUR * MINUTES_IN_MILLISEC;

                    return true;
                } else if (this.currentPeriodOfRobbery < robberyTimes.length - 1) {
                    this.currentPeriodOfRobbery++;
                    startRobberyTime = robberyTimes[this.currentPeriodOfRobbery].from;

                    return true;
                }
            }

            return false;
        }
    };
};
