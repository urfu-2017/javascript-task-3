'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
const DAY_IN_WEEK = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;

function parseToTimeObj(dateSrt) {
    let dateArr = dateSrt.split(' ');
    let day = dateArr[0];
    let [timeStr, UTCZone] = dateArr[1].split('+');
    let timeArr = timeStr.split(':');
    let hours = parseInt(timeArr[0], 10);
    let minutes = parseInt(timeArr[1], 10);

    return {
        timeInMinutes: minutes + hours * MINUTES_IN_HOUR + DAY_IN_WEEK[day] * MINUTES_IN_DAY,
        UTCZone: parseInt(UTCZone)
    };
}

function applyTimeZoneToTimeObj(UTCZone, timeObj) {
    let diff = UTCZone - timeObj.UTCZone;

    return {
        timeInMinutes: timeObj.timeInMinutes + diff * MINUTES_IN_HOUR,
        UTCZone: UTCZone
    };
}

function getShedule(schedule, bankUTCZone) {
    let generalShadule = {
        Danny: [],
        Rusty: [],
        Linus: []
    };
    Object.keys(schedule).map(function (name) {
        schedule[name].map(function (personalShedule) {
            let from = parseToTimeObj(personalShedule.from);
            let to = parseToTimeObj(personalShedule.to);
            from = applyTimeZoneToTimeObj(bankUTCZone, from);
            to = applyTimeZoneToTimeObj(bankUTCZone, to);
            generalShadule[name].push({
                from: from,
                to: to
            });
        });
    });

    return generalShadule;
}

function getFreeTime(personalShedule, bankUTCZone) {
    const START_TIME = 0;
    const FINISH_TIME = 3 * MINUTES_IN_DAY;
    let freeTimeShedule = [];
    if (personalShedule[0].from.timeInMinutes > 0) {
        freeTimeShedule.push({
            from: {
                timeInMinutes: START_TIME,
                UTCZone: bankUTCZone
            },
            to: {
                timeInMinutes: personalShedule[1].from
            }
        });
    }
    for (let i = 1; i < personalShedule.length; i++) {
        freeTimeShedule.push({
            from: personalShedule[i - 1].to,
            to: personalShedule[i].from
        });
    }

    if (personalShedule[personalShedule.length - 1].to.timeInMinutes < FINISH_TIME) {
        freeTimeShedule.push({
            from: personalShedule[personalShedule.length - 1].to,
            to: {
                timeInMinutes: FINISH_TIME,
                UTCZone: bankUTCZone
            }
        });
    }

    return freeTimeShedule;
}

function getSegmentsInter(first, second, bankUTCZone) {
    let maxFrom = Math.max(first.from.timeInMinutes, second.from.timeInMinutes);
    let minTo = Math.min(first.to.timeInMinutes, second.to.timeInMinutes);
    if (maxFrom < minTo) {
        return {
            from: {
                timeInMinutes: maxFrom,
                UTCZone: bankUTCZone
            },
            to: {
                timeInMinutes: minTo,
                UTCZone: bankUTCZone
            }
        };
    }

    return -1;
}

function getIntersectionScedule(firstShedule, secondShedule, bankUTCZone) {
    let resultShedule = [];
    firstShedule.forEach(function (firstTimeSegment) {
        secondShedule.forEach(function (secondTimeSegment) {
            let segmmentsIntersection =
                getSegmentsInter (firstTimeSegment, secondTimeSegment, bankUTCZone);
            if (segmmentsIntersection !== -1) {
                resultShedule.push(segmmentsIntersection);
            }
        });
    });

    return resultShedule;
}

function parseBankTimeToTimeObj(bankTimeStr) {
    let [timeStr, UTCZone] = bankTimeStr.split('+');
    let timeArr = timeStr.split(':');
    let hours = parseInt(timeArr[0], 10);
    let minutes = parseInt(timeArr[1], 10);

    return {
        timeInMinutes: minutes + hours * MINUTES_IN_HOUR,
        UTCZone: parseInt(UTCZone)
    };
}

function getBankShedule(workingHours) {
    let bankShedule = [];
    let bankFrom = parseBankTimeToTimeObj(workingHours.from);
    let bankTo = parseBankTimeToTimeObj(workingHours.to);
    for (let i = 0; i < 7; i++) {
        bankShedule.push({
            from: {
                timeInMinutes: bankFrom.timeInMinutes + i * MINUTES_IN_DAY,
                UTCZone: bankFrom.UTCZone
            },
            to: {
                timeInMinutes: bankTo.timeInMinutes + i * MINUTES_IN_DAY,
                UTCZone: bankTo.UTCZone
            }
        });
    }

    return bankShedule;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    const bankShedule = getBankShedule(workingHours);
    const bankUTCZone = bankShedule[0].from.UTCZone;
    const generalShedule = getShedule(schedule, bankUTCZone);
    const DannyFreeTime = getFreeTime(generalShedule.Danny, bankUTCZone);
    const LinusFreeTime = getFreeTime(generalShedule.Linus, bankUTCZone);
    const RastyFreeTime = getFreeTime(generalShedule.Rusty, bankUTCZone);
    let intersectionScedule = getIntersectionScedule(DannyFreeTime, LinusFreeTime, bankUTCZone);
    intersectionScedule = getIntersectionScedule(intersectionScedule, RastyFreeTime, bankUTCZone);
    intersectionScedule = getIntersectionScedule(intersectionScedule, bankShedule, bankUTCZone);
    const appropriateMoment = intersectionScedule.filter(function (value) {
        return (value.to.timeInMinutes - value.from.timeInMinutes) >= duration;
    });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return appropriateMoment.length > 0;
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
            let minutes = appropriateMoment[0].from.timeInMinutes;
            const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
            const day = DAYS[Math.floor(minutes / MINUTES_IN_DAY)];
            minutes = minutes % MINUTES_IN_DAY;
            const hours = Math.floor(minutes / MINUTES_IN_HOUR);
            minutes = minutes % MINUTES_IN_HOUR;

            return template
                .replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', day);
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
