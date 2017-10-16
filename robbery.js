'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

let MINUTES_IN_HOUR = 60;
let HOURS_IN_DAY = 24;
let MINUTES_IN_DAY = MINUTES_IN_HOUR * HOURS_IN_DAY;

let WEEKDAYS = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2,
    'ЧТ': 3,
    'ПТ': 4,
    'СБ': 5,
    'ВС': 6
};

function makeDateAsMinutes(date) {
    let splitedDate = date.split(' ');

    let day = splitedDate[0];
    let timeWithUTC = splitedDate[1];

    let splitedTimeWithUTC = timeWithUTC.split('+');

    let time = splitedTimeWithUTC[0];
    let UTC = splitedTimeWithUTC[1];

    let splitedTime = time.split(':');

    let hours = parseInt(splitedTime[0]);
    let minutes = parseInt(splitedTime[1]);

    return minutes + (hours - UTC) * MINUTES_IN_HOUR + WEEKDAYS[day] * MINUTES_IN_DAY;
}

function getBankUTC(date) {
    return parseInt(date.split('+')[1]);
}

function getGangIntervals(gangSchedule) {
    return Object.keys(gangSchedule)
        .map(function (gang) {
            return gangSchedule[gang].map(function (date) {
                return {
                    from: makeDateAsMinutes(date.from),
                    to: makeDateAsMinutes(date.to)
                };
            });
        })
        .reduce(function (acc, item) {
            return acc.concat(item);
        })
        .sort(function (item1, item2) {
            return item1.from > item2.from;
        });
}

function getBadIntervals(gangIntervals) {
    if (!gangIntervals.length) {
        return [];
    }

    let badIntervals = [];

    let badFrom = gangIntervals[0].from;
    let badTo = gangIntervals[0].to;

    for (let i = 1; i < gangIntervals.length; i++) {
        if (badTo < gangIntervals[i].from) {
            badIntervals.push({
                from: badFrom,
                to: badTo
            });
            badFrom = gangIntervals[i].from;
            badTo = gangIntervals[i].to;
        } else if (badTo < gangIntervals[i].to) {
            badTo = gangIntervals[i].to;
        }
    }

    badIntervals.push({
        from: badFrom,
        to: badTo
    });

    return badIntervals;
}

function getBankInterval(bankSchedule) {
    let bankIntervals = [];

    bankIntervals.push({
        from: makeDateAsMinutes('ПН ' + bankSchedule.from),
        to: makeDateAsMinutes('ПН ' + bankSchedule.to)
    });
    bankIntervals.push({
        from: makeDateAsMinutes('ВТ ' + bankSchedule.from),
        to: makeDateAsMinutes('ВТ ' + bankSchedule.to)
    });
    bankIntervals.push({
        from: makeDateAsMinutes('СР ' + bankSchedule.from),
        to: makeDateAsMinutes('СР ' + bankSchedule.to)
    });

    return bankIntervals;
}

function isIntersectionFrom(interval, from, to) {
    return (from <= interval.from &&
        interval.from <= to &&
        to < interval.to);
}

function isIntersectionTo(interval, from, to) {
    return (interval.from < from &&
        from <= interval.to &&
        interval.to <= to);
}

function isIntersectionFull(interval, from, to) {
    return (from <= interval.from &&
        interval.from <= to &&
        from <= interval.to &&
        interval.to <= to);
}

function getGoodIntervalsForOneDay(gangSchedule, bankDay) {
    let goodIntervalsForOneDay = [];

    let goodFrom = bankDay.from;
    let goodTo = bankDay.to;

    for (let i = 0; i < gangSchedule.length; i++) {
        if (isIntersectionFrom(gangSchedule[i], goodFrom, goodTo) &&
            goodFrom !== gangSchedule[i].from) {
            goodIntervalsForOneDay.push({
                from: goodFrom,
                to: gangSchedule[i].from
            });
        } else if (isIntersectionTo(gangSchedule[i], goodFrom, goodTo)) {
            goodFrom = gangSchedule[i].to;
        } else if (isIntersectionFull(gangSchedule[i], goodFrom, goodTo) &&
            goodFrom !== gangSchedule[i].from) {
            goodIntervalsForOneDay.push({
                from: goodFrom,
                to: gangSchedule[i].from
            });
            goodFrom = gangSchedule[i].to;
        }
    }

    goodIntervalsForOneDay.push({
        from: goodFrom,
        to: goodTo
    });

    return goodIntervalsForOneDay;
}

function getGoodIntervals(gangSchedule, bankSchedule) {
    let goodIntervals = [];

    for (let i = 0; i < bankSchedule.length; i++) {
        let goodIntervalsForOneDay = getGoodIntervalsForOneDay(gangSchedule, bankSchedule[i]);
        goodIntervals = goodIntervals.concat(goodIntervalsForOneDay);
    }

    return goodIntervals;
}

function getGoodTimes(goodIntervals, duration) {
    let stepTime = 30;

    let goodTimes = [];

    for (let i = 0; i < goodIntervals.length; i++) {
        for (let j = goodIntervals[i].from; j <= goodIntervals[i].to - duration; j += stepTime) {
            goodTimes.push(j);
        }
    }

    return goodTimes;
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
    let gangIntervals = getGangIntervals(schedule);
    let badIntervals = getBadIntervals(gangIntervals);

    let bankIntervals = getBankInterval(workingHours);
    let bankUTC = getBankUTC(workingHours.from);

    let goodIntervals = getGoodIntervals(badIntervals, bankIntervals);
    let goodTimes = getGoodTimes(goodIntervals, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return goodTimes.length > 0;
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

            let goodTime = goodTimes[0] + bankUTC * MINUTES_IN_HOUR;

            let day = Object.keys(WEEKDAYS)[Math.floor(goodTime / MINUTES_IN_DAY)];

            let hours = Math.floor((goodTime % MINUTES_IN_DAY) / MINUTES_IN_HOUR);
            hours = (hours < 10 ? '0' : '') + hours;

            let minutes = (goodTime % MINUTES_IN_DAY) % MINUTES_IN_HOUR;
            minutes = (minutes < 10 ? '0' : '') + minutes;

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
            if (goodTimes.length > 1) {
                goodTimes.shift();

                return true;
            }

            return false;
        }
    };
};
