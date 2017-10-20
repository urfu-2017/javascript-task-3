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

/* function getEmptyScheduleObj(schedule) {
    let generalSchedule = {};
    Object.keys(schedule).forEach(function (name) {
        if (!generalSchedule.hasOwnProperty(name)) {
            Object.defineProperty(generalSchedule, name, {
                value: [],
                writable: true,
                enumerable: true
            });
        }
    });

    return generalSchedule;
}*/

function getSchedule(schedule, bankUTCZone) {
    // let generalSchedule = getEmptyScheduleObj(schedule);
    let generalSchedule = {
        Danny: [],
        Rusty: [],
        Linus: []
    };
    Object.keys(schedule).forEach(function (name) {
        schedule[name].forEach(function (personalSchedule) {
            let from = parseToTimeObj(personalSchedule.from);
            let to = parseToTimeObj(personalSchedule.to);
            from = applyTimeZoneToTimeObj(bankUTCZone, from);
            to = applyTimeZoneToTimeObj(bankUTCZone, to);
            generalSchedule[name].push({
                from: from,
                to: to
            });
        });
    });

    return generalSchedule;
}

function getFreeTime(personalSchedule, bankUTCZone) {
    const START_TIME = 0;
    const FINISH_TIME = 3 * MINUTES_IN_DAY;
    let freeTimeSchedule = [];
    if (personalSchedule[0].from.timeInMinutes > 0) {
        freeTimeSchedule.push({
            from: {
                timeInMinutes: START_TIME,
                UTCZone: bankUTCZone
            },
            to: personalSchedule[0].from
        });
    }
    for (let i = 1; i < personalSchedule.length; i++) {
        freeTimeSchedule.push({
            from: personalSchedule[i - 1].to,
            to: personalSchedule[i].from
        });
    }

    if (personalSchedule[personalSchedule.length - 1].to.timeInMinutes < FINISH_TIME) {
        freeTimeSchedule.push({
            from: personalSchedule[personalSchedule.length - 1].to,
            to: {
                timeInMinutes: FINISH_TIME,
                UTCZone: bankUTCZone
            }
        });
    }

    return freeTimeSchedule;
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

function getIntersectionSchedule(firstSchedule, secondSchedule, bankUTCZone) {
    let resultSchedule = [];
    firstSchedule.forEach(function (firstTimeSegment) {
        secondSchedule.forEach(function (secondTimeSegment) {
            let segmmentsIntersection =
                getSegmentsInter (firstTimeSegment, secondTimeSegment, bankUTCZone);
            if (segmmentsIntersection !== -1) {
                resultSchedule.push(segmmentsIntersection);
            }
        });
    });

    return resultSchedule;
}

function parseBankTimeToTimeObj(bankTimeStr) {
    let [timeStr, UTCZone] = bankTimeStr.split('+');
    let [hours, minutes] = timeStr.split(':').map(x => parseInt(x, 10));

    return {
        timeInMinutes: minutes + hours * MINUTES_IN_HOUR,
        UTCZone: parseInt(UTCZone)
    };
}

function getBankSchedule(workingHours) {
    let bankSchedule = [];
    let bankFrom = parseBankTimeToTimeObj(workingHours.from);
    let bankTo = parseBankTimeToTimeObj(workingHours.to);
    for (let i = 0; i < QUANTITY_DAY_IN_WEEK; i++) {
        bankSchedule.push({
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

    return bankSchedule;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    const bankSchedule = getBankSchedule(workingHours);
    const bankUTCZone = bankSchedule[0].from.UTCZone;
    const generalSchedule = getSchedule(schedule, bankUTCZone);
    let freeTimeGeneralSchedule = [];
    Object.keys(generalSchedule).forEach(function (name) {
        freeTimeGeneralSchedule.push(getFreeTime(generalSchedule[name], bankUTCZone));
    });
    freeTimeGeneralSchedule.push(bankSchedule);
    let intersectionSchedule = freeTimeGeneralSchedule.reduce((prev, curr) =>
        getIntersectionSchedule(prev, curr, bankUTCZone));
    const appropriateMoment = intersectionSchedule.filter(function (value) {
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
