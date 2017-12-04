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

function transform(time, template) {
    let numday = 0;
    while (time >= MINUTES_IN_DAY) {
        time -= MINUTES_IN_DAY;
        numday++;
    }
    let mm = time % 60;
    if (mm === 0) {
        mm = '00';
    }
    let hh = (time - mm) / 60;
    template = template.replace('%HH', hh)
        .replace('%MM', mm)
        .replace('%DD', ARRAY_OF_DAYS[numday]);

    return template;
}

function deleteAndSortAndExclude(duration) {
    // console.info(momentExist, 'PROVERKA');
    let countFalse = 0;
    for (let i = 0; i < startInterval.length; i++) {
        if (endInterval[i] - startInterval[i] < duration) {
            startInterval[i] = 9999;
            endInterval[i] = 9999;
            countFalse++;
        } else {
            momentExist = true;
            // console.info('TIVPIVE');
        }
    }
    // console.info(startInterval);
    // console.info(endInterval);
    startInterval.sort((a, b) => {
        return a - b;
    });
    endInterval.sort((a, b) => {
        return a - b;
    });
    // console.info(startInterval);
    // console.info(endInterval);
    for (let i = 0; i < countFalse; i++) {
        startInterval.pop();
        endInterval.pop();
    }
}

function cutInterval(typeConf, k, startBusy, endBusy) {
    if (typeConf !== 0) {
        switch (typeConf) {
            case 1:
                startInterval[k] = endBusy;
                break;
            case 2:
                endInterval[k] = startBusy;
                break;
            default:
                // делим на 2 интервала, добавляем второй в конец массива
                startInterval.push(endBusy);
                endInterval.push(endInterval[k]);
                endInterval[k] = startBusy;
        }
    }
}

function applyForIntervals(k, startBusy, endBusy) {
    let typeConf = 0;

    /* typeConf -- тип пересечения интервалов
    0 - не пересекаются
    1 - нынешний пересекает правым краем
    2 - нынешний пересекает левым краем
    3 - нынешний входит в заданный */
    if ((startBusy > endInterval[k]) || (endBusy < startInterval[k])) {
        typeConf = 0;
        // console.info(startBusy, endBusy, startInterval[k], endInterval[k], typeConf);
    } else if (startBusy > startInterval[k]) {
        if (endBusy < endInterval[k]) {
            typeConf = 3;
        } else {
            typeConf = 2;
        }
    } else if (endBusy < endInterval[k]) {
        typeConf = 1;
    } else {
        startInterval[k] = 9999;
        endInterval[k] = 9999;
    }
    // console.info(startBusy, endBusy, startInterval[k], endInterval[k], typeConf);
    cutInterval(typeConf, k, startBusy, endBusy);
}

function parseBusyTime(time) {
    let timeTokens = time.split(/ |:|\+/);
    let dayNumber = ARRAY_OF_DAYS.indexOf(timeTokens[0]);
    let timeInMinutes = timeTokens[1] * 60;
    timeInMinutes += Number(timeTokens[2]);
    timeInMinutes += Number(dayNumber * MINUTES_IN_DAY);
    timeInMinutes += Number(60 * (bankTimeZone - timeTokens[3]));
    // console.info(timeInMinutes);

    return timeInMinutes;
}

function inMinutes(workingHours) {
    let tempWorkingHours = workingHours.from.split(/:|\+/);
    bankTimeZone = tempWorkingHours[2];
    openTime = Number(tempWorkingHours[0]) * 60 + Number(tempWorkingHours[1]);
    tempWorkingHours = workingHours.to.split(/:|\+/);
    closeTime = Number(tempWorkingHours[0]) * 60 + Number(tempWorkingHours[1]);
    // console.info (workingHours);
    // console.info (bankTimeZone, openTime, closeTime);
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
    console.info(schedule, duration, workingHours);
    // console.info('AFTERPUSH', startInterval, '\nAFTERPUSH', endInterval);
    inMinutes(workingHours);
    for (let i = 0; i < 3; i++) {
        startInterval.push(openTime + MINUTES_IN_DAY * i);
        endInterval.push(closeTime + MINUTES_IN_DAY * i);
    }
    let arraySchedules = Object.values(schedule);
    // console.info (arraySchedules[0].length, arraySchedules[1].length, arraySchedules[2].length);
    arraySchedules.forEach((onePersonSchedule) => {
        // console.info('ONEPERSON', onePersonSchedule);
        onePersonSchedule.forEach((lineFromSchedule) => {
            // console.info(lineFromSchedule);
            let startBusy = parseBusyTime(lineFromSchedule.from);
            let endBusy = parseBusyTime(lineFromSchedule.to);
            // console.info(startInterval.length);
            for (var k = 0; k < startInterval.length; k++) {
                // console.info('AFTERPUSH', startInterval, '\nAFTERPUSH', endInterval, k);
                // console.info(startBusy, endBusy, k);
                applyForIntervals(k, startBusy, endBusy);
            }
        });
    });
    console.info(startInterval);
    console.info(endInterval);
    deleteAndSortAndExclude(duration);
    console.info(startInterval);
    console.info(endInterval);
    console.info(timeNumber);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            // console.info(momentExist);

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
            console.info(time, timeNumber);
            if (!this.exists()) {
                return '';
            }
            template = transform(time, template);
            console.info(template);

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
