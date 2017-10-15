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
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    // Создаю расписание из schedule в удобной для работы форме
    let GMT = workingHours.from.split('+')[1];
    let rasp = createRasp(schedule, GMT, workingHours);
    console.info(schedule);
    console.info(rasp);

    let freeTime = [];
    for (let i = 0; i < (72 * 60); i += 1) {
        if (elementInInterval(i, rasp.Danny) === false &&
            elementInInterval(i, rasp.Rusty) === false &&
            elementInInterval(i, rasp.Linus) === false &&
            elementInInterval(i, rasp.Bank) === true) {

            freeTime.push(i);
        }
    }
    let groupFreeTimes = groupMinutes(freeTime);
    let startTimes = findTimeToStart(groupFreeTimes, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (startTimes.length) {
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
            if (startTimes.length) {
                template = template.replace('%HH', startTimes[0][1]);
                template = template.replace('%MM', startTimes[0][2]);
                template = template.replace('%DD', startTimes[0][0]);

                return template;
            }

            return '';
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
// Создаю удобное расписание из schedule
function createRasp(schedule, GMT, workingHours) {
    let rasp = {};
    for (const person in schedule) {
        if (person) {
            rasp[person] = [];
            schedule[person].forEach((info) => {
                let fromData = info.from.match(/\d+/g);
                let toData = info.to.match(/\d+/g);
                let delta = Number(GMT) - Number(fromData[2]);

                let fromDay = info.from.split(' ')[0];
                let toDay = info.to.split(' ')[0];

                let fromDataToTime = minuteCounter(fromData, delta, fromDay);
                let toDataToTime = minuteCounter(toData, delta, toDay);

                rasp[person].push([fromDataToTime, toDataToTime]);
            });
        }
    }

    addBankToRasp(rasp, workingHours, GMT);


    return rasp;
}

function minuteCounter(timeData, delta, Day) {
    if (timeData[0] === '23' && timeData[1] === '59') {
        timeData[0] = '24';
        timeData[1] = '00';
    }
    let time = Number((Number(timeData[0]) + delta) * 60 + Number(timeData[1]));
    if (Day === 'ВТ') {
        time += (24 * 60);
    }
    if (Day === 'СР') {
        time += (48 * 60);
    }

    if (time <= 0) {
        time = 0;
    }

    if (time >= (72 * 60)) {
        time = 72 * 60;
    }

    return time;
}

function addBankToRasp(rasp, workingHours, GMT) {
    rasp.Bank = [];
    let fromData = workingHours.from.match(/\d+/g);
    let toData = workingHours.to.match(/\d+/g);
    let delta = Number(GMT) - Number(fromData[2]);
    let fromDataToTime = minuteCounter(fromData, delta, 'ПН');
    let toDataToTime = minuteCounter(toData, delta, 'ПН');

    if (fromDataToTime !== toDataToTime) {
        rasp.Bank.push([fromDataToTime, toDataToTime]);
        rasp.Bank.push([fromDataToTime + (24 * 60), toDataToTime + (24 * 60)]);
        rasp.Bank.push([fromDataToTime + (48 * 60), toDataToTime + (48 * 60)]);
    }

    return true;
}

function elementInInterval(el, intervals) {
    let booleanReturn = false;
    intervals.forEach((interval) => {
        if (el >= interval[0] && el < interval[1]) {
            booleanReturn = true;
        }
    });

    return booleanReturn;
}

function groupMinutes(freeTime) {
    let findGroupArray = [];
    for (let i = 0; i < freeTime.length;) {
        let arr = [];
        do {
            arr.push(freeTime[i]);
            i += 1;
        } while (freeTime[i - 1] + 1 === freeTime[i]);
        findGroupArray.push(arr);
    }

    return findGroupArray;
}

function findTimeToStart(groupFreeTime, duration) {
    let startArray = [];
    groupFreeTime.forEach((interval) => {
        if (duration <= interval.length) {
            startArray.push(interval[0]);
        }
    });

    startArray.forEach((time) => {
        let hour = parseInt(time / 60);
        let minute = time % 60;
        let day = 'ПН';
        if (hour > 24 && hour < 48) {
            hour -= 24;
            day = 'ВТ';
        }
        if (hour >= 48 && hour <= 72) {
            hour -= 48;
            day = 'СР';
        }
        hour = timeToPretty(hour);
        minute = timeToPretty(minute);
        startArray[startArray.indexOf(time)] = [day, hour, minute];
    });

    return startArray;
}

function timeToPretty(hourMinute) {
    if (hourMinute >= 0 && hourMinute < 10) {
        return ('0' + hourMinute);
    }

    return hourMinute;
}
