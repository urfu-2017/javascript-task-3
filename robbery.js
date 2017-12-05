'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const ARRAY_OF_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MINUTES_IN_DAY = 1440;
var startInterval = [];
var endInterval = [];
var bankTimeZone;
var openTime;
var closeTime;
var momentExist = false;
var timeNumber = 0;

function clearGlobalVariable() {
    startInterval = [];
    endInterval = [];
    bankTimeZone = undefined;
    openTime = undefined;
    closeTime = undefined;
    momentExist = false;
    timeNumber = 0;
}

function addingZero(parameter) {
    if (parameter < 10) {
        parameter = '0' + parameter;
    }

    return parameter;
}

function transform(time, template) {
    let numday = 0;
    while (time >= MINUTES_IN_DAY) {
        time -= MINUTES_IN_DAY;
        numday++;
    }
    let mm = time % 60;
    mm = addingZero(mm);
    let hh = (time - mm) / 60;
    hh = addingZero(hh);
    template = template.replace('%HH', hh)
        .replace('%MM', mm)
        .replace('%DD', ARRAY_OF_DAYS[numday]);

    return template;
}

function sortByIncrease(a, b) {
    return a - b;
}

function deleteAndSortAndExclude(duration) {
    let countFalse = 0;
    for (let i = 0; i < startInterval.length; i++) {
        if (endInterval[i] - startInterval[i] < duration) {
            startInterval[i] = Infinity;
            endInterval[i] = Infinity;
            countFalse++;
        } else {
            momentExist = true;

        }
    }
    startInterval.sort(sortByIncrease());
    endInterval.sort(sortByIncrease());
    for (let i = 0; i < countFalse; i++) {
        startInterval.pop();
        endInterval.pop();
    }
}

function cutInterval(crossType, k, startBusy, endBusy) {
    if (crossType !== 0) {
        switch (crossType) {
            case 1:
                startInterval[k] = endBusy;
                break;
            case 2:
                endInterval[k] = startBusy;
                break;
            default:

                startInterval.push(endBusy);
                endInterval.push(endInterval[k]);
                endInterval[k] = startBusy;
        }
    }
}

function applyForIntervals(k, startBusy, endBusy) {
    let crossType = 0;

    /* crossType -- тип пересечения интервалов
    0 - не пересекаются
    1 - нынешний пересекает правым краем
    2 - нынешний пересекает левым краем
    3 - нынешний входит в заданный */
    if ((startBusy > endInterval[k]) || (endBusy < startInterval[k])) {
        crossType = 0;

    } else if (startBusy > startInterval[k]) {
        if (endBusy < endInterval[k]) {
            crossType = 3;
        } else {
            crossType = 2;
        }
    } else if (endBusy < endInterval[k]) {
        crossType = 1;
    } else {
        startInterval[k] = Infinity;
        endInterval[k] = Infinity;
    }
    cutInterval(crossType, k, startBusy, endBusy);
}

function parseBusyTime(time) {
    let timeTokens = time.split(/ |:|\+/);
    let dayNumber = ARRAY_OF_DAYS.indexOf(timeTokens[0]);
    let timeInMinutes = timeTokens[1] * 60;
    timeInMinutes += Number(timeTokens[2]);
    timeInMinutes += Number(dayNumber * MINUTES_IN_DAY);
    timeInMinutes += Number(60 * (bankTimeZone - timeTokens[3]));

    return timeInMinutes;
}

function excludeByMember(gangMember) {
    gangMember.forEach((lineFromSchedule) => {

        let startBusy = parseBusyTime(lineFromSchedule.from);
        let endBusy = parseBusyTime(lineFromSchedule.to);

        for (var k = 0; k < startInterval.length; k++) {


            applyForIntervals(k, startBusy, endBusy);
        }
    });
}

function inMinutes(workingHours) {
    let workingHoursFrom = workingHours.from.split(/:|\+/);
    bankTimeZone = workingHoursFrom[2];
    openTime = Number(workingHoursFrom[0]) * 60 + Number(workingHoursFrom[1]);
    let workingHoursTo = workingHours.to.split(/:|\+/);
    closeTime = Number(workingHoursTo[0]) * 60 + Number(workingHoursTo[1]);
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
    clearGlobalVariable();
    inMinutes(workingHours);
    for (let i = 0; i < 3; i++) {
        startInterval.push(openTime + MINUTES_IN_DAY * i);
        endInterval.push(closeTime + MINUTES_IN_DAY * i);
    }
    for (let gangMember of Object.values(schedule)) {

        excludeByMember(gangMember);
    }
    deleteAndSortAndExclude(duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {


            return momentExist;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let time = startInterval[timeNumber];

            if (!this.exists()) {
                return '';
            }
            template = transform(time, template);


            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (endInterval[timeNumber] - startInterval[timeNumber] - 30 >= duration) {
                startInterval[timeNumber] += 30;

                return true;
            } else if (startInterval[timeNumber + 1] &&
                startInterval[timeNumber + 1] - startInterval[timeNumber] >= 30) {
                ++timeNumber;

                return true;
            }

            return false;
        }
    };
};
