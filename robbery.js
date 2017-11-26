'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

const minutesInDay = 1440;
var startInterval = [];
var endInterval = [];
var bankTimeZone;
var openTime;
var closeTime;
var globalTime;
var counter = 0;

function transform(time, template) {
    let days = ['ПН', 'ВТ', 'СР'];
    let numday = 0;
    while (time >= minutesInDay) {
        time -= minutesInDay;
        numday++;
    }
    let mm = time % 60;
    if (mm === 0) {
        mm = '00';
    }
    let hh = (time - mm) / 60;
    template = template.replace('%HH', hh)
        .replace('%MM', mm)
        .replace('%DD', days[numday]);

    return template;
}

function deleteAndSortAndExclude(duration) {
    let k = 0;
    while (k < startInterval.length) {
        if (endInterval[k] - startInterval[k] < duration) {
            startInterval.splice(k, 1);
            endInterval.splice(k, 1);
        } else {
            k++;
        }
    }
    startInterval.sort((a, b) => {
        return a - b;
    });
    endInterval.sort((a, b) => {
        return a - b;
    });
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
        startInterval[k] = -1;
        endInterval[k] = -1;
    }
    // console.info(startBusy, endBusy, startInterval[k], endInterval[k], typeConf);
    // console.info(startBusy, endBusy, startInterval[k], endInterval[k], typeConf);
    // console.info(startBusy, endBusy, startInterval[k], endInterval[k], typeConf);
    cutInterval(typeConf, k, startBusy, endBusy);
}

function parseBusyTime(time) {
    let timeTokens = time.split(/ |:|\+/);
    let dayNumber;
    switch (timeTokens[0]) {
        case 'ПН':
            dayNumber = 0;
            break;
        case 'ВТ':
            dayNumber = 1;
            break;
        case 'СР':
            dayNumber = 2;
            break;
        default:
            dayNumber = -1000;
    }
    let timeInMinutes = timeTokens[1] * 60;
    timeInMinutes += Number(timeTokens[2]);
    timeInMinutes += Number(dayNumber * minutesInDay);
    timeInMinutes += Number(60 * (bankTimeZone - timeTokens[3]));

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
    console.info(schedule, duration, workingHours);
    inMinutes(workingHours);
    for (let i = 0; i < 3; i++) {
        startInterval.push(openTime + minutesInDay * i);
        endInterval.push(closeTime + minutesInDay * i);
    }
    let arraySchedules = Object.values(schedule);
    // console.info (value[0].length, value[1].length, value[2].length);
    arraySchedules.forEach((onePersonSchedule) => {
        onePersonSchedule.forEach((lineFromSchedule) => {
            let startBusy = parseBusyTime(lineFromSchedule.from);
            let endBusy = parseBusyTime(lineFromSchedule.to);
            for (var k = 0; k < startInterval.length; k++) {
                // console.info('AFTERPUSH', startInterval, '\nAFTERPUSH', endInterval);
                // console.info(startBusy, endBusy, k);
                applyForIntervals(k, startBusy, endBusy);
            }
        });
    });
    deleteAndSortAndExclude(duration);
    counter = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            // if (!boolControl) {
            //     return false;
            // }
            return startInterval.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            globalTime = startInterval[counter];
            // console.info('vivod', startInterval, endInterval, globalTime);
            let time = globalTime;
            if (!this.exists()) {
                return '';
            }
            template = transform(time, template);
            // counter++;
            // console.info(template);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var b1 = false;
            globalTime = startInterval[counter];
            // console.info('ROVAAA', startInterval, endInterval, globalTime);
            if (endInterval[counter] - startInterval[counter] - 30 >= duration) {
                // console.info('qq', startInterval[counter] + 30);
                // counter--;
                startInterval[counter] = startInterval[counter] + 30;
                b1 = true;
            } else if (startInterval[counter + 1]) {
                // console.info(startInterval[counter]);
                // console.info('globalTimeE', globalTime);
                counter++;
                b1 = true;
            }
            // console.info(b1, counter);

            return b1;
        }
    };
};
