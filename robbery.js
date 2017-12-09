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
const MINUTES_IN_DAY = 1440;
const MINUTES_IN_HOUR = 60;
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
let bankTimeZone = 0;
let endBankWork = 0;
let beginBankWork = 0;
let freeTimeIntervalsFrom = [];
let freeTimeIntervalsTo = [];
let appropriateTimeStart = [];
let appropriateTimeEnd = [];
let timeNumber = 0;

function splitGangTime(time) {
    let parsingTime = time.split(/ |:|\+/);
    let day = DAYS.indexOf(parsingTime[0]);
    let timeInMinutes = parsingTime[1] * MINUTES_IN_HOUR +
        Number(parsingTime[2]) + Number(day * MINUTES_IN_DAY) +
        Number(MINUTES_IN_HOUR * (bankTimeZone - parsingTime[3]));

    return timeInMinutes;
}

function bankTimeInMinutes(workingHours) {
    let workingHoursFrom = workingHours.from.split(/:|\+/);
    let workingHoursTo = workingHours.to.split(/:|\+/);
    bankTimeZone = workingHoursFrom[2];
    beginBankWork = workingHoursFrom[0] * MINUTES_IN_HOUR + Number(workingHoursFrom[1]);
    endBankWork = workingHoursTo[0] * MINUTES_IN_HOUR + Number(workingHoursTo[1]);
}


function sortTime(time1, time2) {
    return time1 - time2;
}

function checkInterval(duration) {
    console.info(freeTimeIntervalsFrom);
    console.info(freeTimeIntervalsTo);
    for (let i = 0; i < freeTimeIntervalsFrom.length; i++) {
        if (freeTimeIntervalsTo[i] - freeTimeIntervalsFrom[i] >= duration) {
            appropriateTimeStart.push(freeTimeIntervalsFrom[i]);
            appropriateTimeEnd.push(freeTimeIntervalsTo[i]);
        }
    }
    appropriateTimeStart.sort(sortTime);
    appropriateTimeEnd.sort(sortTime);
}

function confluence(gangTimeFrom, gangTimeTo, i) {
    if (gangTimeFrom >= freeTimeIntervalsTo[i] || gangTimeTo <= freeTimeIntervalsFrom[i]) {
        freeTimeIntervalsFrom[i] = freeTimeIntervalsFrom[i];
    } else if (gangTimeTo > freeTimeIntervalsTo[i] && gangTimeFrom > freeTimeIntervalsFrom[i]) {
        freeTimeIntervalsTo[i] = gangTimeFrom;
    } else if (gangTimeTo < freeTimeIntervalsTo[i] && gangTimeFrom < freeTimeIntervalsFrom[i]) {
        freeTimeIntervalsFrom[i] = gangTimeTo;
    } else if (gangTimeTo < freeTimeIntervalsTo[i] && gangTimeFrom > freeTimeIntervalsFrom[i]) {
        freeTimeIntervalsTo.push(freeTimeIntervalsTo[i]);
        freeTimeIntervalsFrom.push(gangTimeTo);
        freeTimeIntervalsTo[i] = gangTimeFrom;
    } else {
        freeTimeIntervalsFrom[i] = 0;
        freeTimeIntervalsTo[i] = 0;
    }
}

function intervals(gangTimeFrom, gangTimeTo) {
    for (let i = 0; i < freeTimeIntervalsFrom.length; i++) {
        confluence(gangTimeFrom, gangTimeTo, i);
    }
}


function exclude(schedule) {
    for (let gang of Object.keys(schedule)) {
        schedule[gang].forEach(item => {
            let gangTimeFrom = splitGangTime(item.from);
            let gangTimeTo = splitGangTime(item.to);
            intervals(gangTimeFrom, gangTimeTo);
        });
    }
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    freeTimeIntervalsFrom = [];
    freeTimeIntervalsTo = [];
    appropriateTimeStart = [];
    appropriateTimeEnd = [];
    timeNumber = 0;
    bankTimeInMinutes(workingHours);
    for (let i = 0; i < 3; i++) {
        freeTimeIntervalsFrom.push(beginBankWork + MINUTES_IN_DAY * i);
        freeTimeIntervalsTo.push(endBankWork + MINUTES_IN_DAY * i);
    }
    exclude(schedule);
    checkInterval(duration);
    console.info(appropriateTimeStart);
    console.info(appropriateTimeEnd);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (appropriateTimeStart.length) {
                return true;
            }

            return false;
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
            let time = appropriateTimeStart[timeNumber];
            let numDay = 0;
            while (time >= MINUTES_IN_DAY) {
                time -= MINUTES_IN_DAY;
                numDay++;
            }
            let mm = time % MINUTES_IN_HOUR;
            let hh = (time - mm) / MINUTES_IN_HOUR;
            mm = (mm < 10 ? '0' : '') + mm;
            hh = (hh < 10 ? '0' : '') + hh;

            return template
                .replace('%HH', hh)
                .replace('%MM', mm)
                .replace('%DD', DAYS[numDay]);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let time = appropriateTimeEnd[timeNumber] - appropriateTimeStart[timeNumber];
            if (time - 30 >= duration) {
                appropriateTimeStart[timeNumber] += 30;

                return true;
            } else if (appropriateTimeStart[timeNumber + 1]) {
                timeNumber++;

                return true;
            }

            return false;
        }
    };
};
