'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

let timeModule = require('./timemodule.js');

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
    let timespans = prepareData(schedule);
    let freeTimespans = getFreeTimespans(workingHours, timespans);
    let bankOffset = getBankOffset(workingHours);
    let goodTime = null;
    let indexTimespan = null;
    for (let [index, timespan] of freeTimespans.entries()) {
        if (timespan.getTotal() >= duration) {
            goodTime = timespan.from;
            indexTimespan = index;
            break;
        }
    }
    let changeGoodTime = function (nextGoodTime) {
        if (nextGoodTime.total + duration <= freeTimespans[indexTimespan].to.total) {
            goodTime = nextGoodTime;

            return true;
        }

        return false;
    };
    let moment = {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(goodTime);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return goodTime ? goodTime.format(template, bankOffset) : '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let nextTotal = goodTime.total + 30;
            let nextGoodTime = new timeModule.Time(nextTotal, bankOffset);
            if (changeGoodTime(nextGoodTime)) {
                return true;
            }
            indexTimespan++;
            while (indexTimespan < freeTimespans.length) {
                nextTotal = freeTimespans[indexTimespan].from.total;
                nextGoodTime.fromTotal(nextTotal, bankOffset);
                if (changeGoodTime(nextGoodTime)) {
                    return true;
                }
                indexTimespan++;
            }

            return false;
        }
    };

    return moment;
};


function getFreeTimespans(workingHours, timespans) {
    let workLimits = getWorkLimits(workingHours);
    let result = [];
    for (let day = 0; day < workLimits.length; day++) {
        let start = workLimits[day].start;
        let end = workLimits[day].end;
        let thatDayTimespans = timespans.filter(timespan => {
            return timespan && timespan.to.total < end && timespan.to.total > start;
        });
        if (thatDayTimespans.length === 0) {
            result.push(new timeModule.Timespan({ from: start, to: end }, 0));
            continue;
        }
        pushFirst(thatDayTimespans, result, start);
        pushMiddle(thatDayTimespans, result);
        pushLast(thatDayTimespans, result, end);
    }

    return result;
}

function pushFirst(thatDayTimespans, result, startDay) {
    let startFirst = thatDayTimespans[0].from.total;
    if (startFirst > startDay) {
        result.push(new timeModule.Timespan({
            from: startDay, to: startFirst
        }, 0));
    }
}

function pushMiddle(thatDayTimespans, result) {
    for (let i = 0; i + 1 < thatDayTimespans.length; i++) {
        let endCurrent = thatDayTimespans[i].to.total;
        let startNext = thatDayTimespans[i + 1].from.total;
        result.push(new timeModule.Timespan({
            from: endCurrent, to: startNext
        }, 0));
    }
}

function pushLast(thatDayTimespans, result, endDay) {
    let endLast = thatDayTimespans[thatDayTimespans.length - 1].to.total;
    result.push(new timeModule.Timespan({
        from: endLast, to: endDay
    }, 0));
}

function prepareData(schedule) {
    let timespans = [];
    for (let man in schedule) {
        if (schedule.hasOwnProperty(man)) {
            let busyTimes = schedule[man];
            busyTimes.forEach(time => {
                let timespan = new timeModule.Timespan(time);
                timespans.push(timespan);
            });
        }
    }
    deleteCrossed(timespans);

    return timespans;
}


function deleteCrossed(timespans) {
    timespans.sort((a, b) => {
        return a.from.total - b.from.total;
    });
    for (let index = 0; index < timespans.length; index++) {
        if (timespans[index] === undefined) {
            continue;
        }
        enlargeCurrent(timespans, index);
    }
}

function enlargeCurrent(timespans, currentIndex) {
    let timespan = timespans[currentIndex];
    for (let otherIndex = currentIndex + 1; otherIndex < timespans.length; otherIndex++) {
        let otherTimespan = timespans[otherIndex];
        if (otherTimespan === undefined) {
            continue;
        }
        if (timespan.to.total === otherTimespan.from.total) {
            timespans[otherIndex] = undefined;
        }
        if (timespan.to.total >= otherTimespan.from.total) {
            timespan.to.fromTotal(otherTimespan.to.total, otherTimespan.to.offset);
            timespans[otherIndex] = undefined;
        }
    }
}

function getWorkLimits(workingHours) {
    let workTime = new timeModule.Timespan(workingHours);
    let workLimits = [];
    for (let day = 0; day < 3; day++) {
        workTime.from.day = day;
        workTime.to.day = day;
        workTime.from.calcTotal();
        workTime.to.calcTotal();
        let start = workTime.from.total;
        let end = workTime.to.total;
        workLimits[day] = { start, end };
    }

    return workLimits;
}

function getBankOffset(workingHours) {
    return new timeModule.Timespan(workingHours).from.offset;
}
