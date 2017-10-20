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
const QUANTITY_DAY_IN_WEEK = 7;
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;

function parseToTimeObj(dateSrt) {
    const [day, timeAndZne] = dateSrt.split(' ');
    const [timeStr, UTCZone] = timeAndZne.split('+');
    let [hours, minutes] = timeStr.split(':').map(x => parseInt(x, 10));

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

function getEmptyShceduleObj(shcedule) {
    let generalShadule = {};
    Object.keys(shcedule).forEach(function (name) {
        if (!generalShadule.hasOwnProperty(name)) {
            Object.defineProperty(generalShadule, name, {
                value: [],
                writable: true,
                enumerable: true
            });
        }
    });

    return generalShadule;
}

function getShcedule(schedule, bankUTCZone) {
    let generalShadule = getEmptyShceduleObj(schedule);
    Object.keys(schedule).forEach(function (name) {
        schedule[name].forEach(function (personalShcedule) {
            let from = parseToTimeObj(personalShcedule.from);
            let to = parseToTimeObj(personalShcedule.to);
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

function getFreeTime(personalShcedule, bankUTCZone) {
    const START_TIME = 0;
    const FINISH_TIME = 3 * MINUTES_IN_DAY;
    let freeTimeShcedule = [];
    if (personalShcedule[0].from.timeInMinutes > 0) {
        freeTimeShcedule.push({
            from: {
                timeInMinutes: START_TIME,
                UTCZone: bankUTCZone
            },
            to: personalShcedule[0].from
        });
    }
    for (let i = 1; i < personalShcedule.length; i++) {
        freeTimeShcedule.push({
            from: personalShcedule[i - 1].to,
            to: personalShcedule[i].from
        });
    }

    if (personalShcedule[personalShcedule.length - 1].to.timeInMinutes < FINISH_TIME) {
        freeTimeShcedule.push({
            from: personalShcedule[personalShcedule.length - 1].to,
            to: {
                timeInMinutes: FINISH_TIME,
                UTCZone: bankUTCZone
            }
        });
    }

    return freeTimeShcedule;
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

function getIntersectionScedule(firstShcedule, secondShcedule, bankUTCZone) {
    let resultShcedule = [];
    firstShcedule.forEach(function (firstTimeSegment) {
        secondShcedule.forEach(function (secondTimeSegment) {
            let segmmentsIntersection =
                getSegmentsInter (firstTimeSegment, secondTimeSegment, bankUTCZone);
            if (segmmentsIntersection !== -1) {
                resultShcedule.push(segmmentsIntersection);
            }
        });
    });

    return resultShcedule;
}

function parseBankTimeToTimeObj(bankTimeStr) {
    let [timeStr, UTCZone] = bankTimeStr.split('+');
    let [hours, minutes] = timeStr.split(':').map(x => parseInt(x, 10));

    return {
        timeInMinutes: minutes + hours * MINUTES_IN_HOUR,
        UTCZone: parseInt(UTCZone)
    };
}

function getBankShcedule(workingHours) {
    let bankShcedule = [];
    let bankFrom = parseBankTimeToTimeObj(workingHours.from);
    let bankTo = parseBankTimeToTimeObj(workingHours.to);
    for (let i = 0; i < QUANTITY_DAY_IN_WEEK; i++) {
        bankShcedule.push({
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

    return bankShcedule;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    const bankShcedule = getBankShcedule(workingHours);
    const bankUTCZone = bankShcedule[0].from.UTCZone;
    const generalShcedule = getShcedule(schedule, bankUTCZone);
    let freeTimeGeneralShcedule = [];
    Object.keys(generalShcedule).forEach(function (name) {
        freeTimeGeneralShcedule.push(getFreeTime(generalShcedule[name], bankUTCZone));
    });
    freeTimeGeneralShcedule.push(bankShcedule);
    let intersectionScedule = freeTimeGeneralShcedule.reduce((prev, curr) =>
        getIntersectionScedule(prev, curr, bankUTCZone));
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
            let hours = Math.floor(minutes / MINUTES_IN_HOUR);
            minutes = minutes % MINUTES_IN_HOUR;
            hours = hours < 10 ? '0' + hours : hours;
            minutes = minutes < 10 ? '0' + minutes : minutes;

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
