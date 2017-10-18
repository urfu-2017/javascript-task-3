'use strict';

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MINUTES_PER_DAY = MINUTES_PER_HOUR * HOURS_PER_DAY;

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
    let basicTimeZone = workingHours.from.slice(-1);
    let timeTable = generateTimeTable(schedule, basicTimeZone, workingHours);
    let availableTime = [];

    for (let minute = 0; minute < (3 * MINUTES_PER_DAY); minute += 1) {
        if (itemInPeriod(minute, timeTable.Linus) === false &&
            itemInPeriod(minute, timeTable.Danny) === false &&
            itemInPeriod(minute, timeTable.Rusty) === false &&
            itemInPeriod(minute, timeTable.Bank) === true) {
            availableTime.push(minute);
        }
    }
    let joinedAvailableTimes = joinedMinutes(availableTime);
    let startTimes = findTimeToStart(joinedAvailableTimes, duration);
    let startTimeCounter = 0;

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

                return template
                    .replace('%DD', startTimes[startTimeCounter][0])
                    .replace('%HH', startTimes[startTimeCounter][1])
                    .replace('%MM', startTimes[startTimeCounter][2]);
            }

            return '';
        }
    };
};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {String} basicTimeZone - Часовой пояс банка (базовый)
 * @param {Object} workingHours – Время работы банка
 * @returns {Object}
 */
function generateTimeTable(schedule, basicTimeZone, workingHours) {
    let timeTable = {};
    for (const PERSON in schedule) {
        if (PERSON) {
            timeTable[PERSON] = [];
            schedule[PERSON].forEach(info => {
                let fromData = info.from.match(/\d+/g);
                let toData = info.to.match(/\d+/g);
                let deltaOfTime = basicTimeZone - fromData[2];

                let fromDay = info.from.slice(0, 2);
                let toDay = info.to.slice(0, 2);

                let fromDataToTime = dateIntoMinutes(fromData, deltaOfTime, fromDay);
                let toDataToTime = dateIntoMinutes(toData, deltaOfTime, toDay);

                timeTable[PERSON].push([fromDataToTime, toDataToTime]);
            });
        }
    }

    timeTable.Bank = addBankToTimeTable(workingHours, basicTimeZone);

    return timeTable;
}

/**
 * @param {String} timeData 
 * @param {Number} deltaOfTime 
 * @param {String} day 
 * @returns {Number}
 */
function dateIntoMinutes(timeData, deltaOfTime, day) {
    let time = (Number(timeData[0]) + deltaOfTime) * MINUTES_PER_HOUR + Number(timeData[1]);

    if (day === 'ВТ') {
        time += MINUTES_PER_DAY;
    }

    if (day === 'СР') {
        time += 2 * MINUTES_PER_DAY;
    }
    if (time > 3 * MINUTES_PER_DAY) {
        time = 3 * MINUTES_PER_DAY;
    }

    if (time < 0) {
        time = 0;
    }

    return time;
}

/**
 * @param {Object} workingHours 
 * @param {String} basicTimeZone
 * @returns {Array}
 */
function addBankToTimeTable(workingHours, basicTimeZone) {
    let fromData = workingHours.from.match(/\d+/g);
    let toData = workingHours.to.match(/\d+/g);
    let deltaOfTime = Number(basicTimeZone) - Number(fromData[2]);
    let fromDataToTime = dateIntoMinutes(fromData, deltaOfTime, 'ПН');
    let toDataToTime = dateIntoMinutes(toData, deltaOfTime, 'ПН');

    if (fromDataToTime !== toDataToTime) {

        return [[fromDataToTime, toDataToTime],
            [fromDataToTime + (MINUTES_PER_DAY), toDataToTime + (MINUTES_PER_DAY)],
            [fromDataToTime + (2 * MINUTES_PER_DAY), toDataToTime + (2 * MINUTES_PER_DAY)]];
    }

    return [];
}

/**
 * @param {Number} item 
 * @param {Object} periods 
 * @returns {Boolean}
 */
function itemInPeriod(item, periods) {
    let isMinuteInPeriod = false;
    isMinuteInPeriod = periods.some(period => item >= period[0] && item < period[1]);

    return isMinuteInPeriod;
}

/**
 * @param {Array} availableTime
 * @returns {Array}
 */
function joinedMinutes(availableTime) {
    let findJoinedArray = [];
    for (let i = 0; i < availableTime.length;) {
        let arr = [];
        do {
            arr.push(availableTime[i]);
            i += 1;
        } while (availableTime[i - 1] + 1 === availableTime[i]);
        findJoinedArray.push(arr);
    }

    return findJoinedArray;
}

/**
 * @param {Array} joinedAvailableTime 
 * @param {Number} duration
 * @returns {Array}
 */
function findTimeToStart(joinedAvailableTime, duration) {
    let startArray = [];
    joinedAvailableTime.forEach((period) => {
        if (duration <= period.length) {
            startArray.push(period[0]);
        }
    });

    startArray.forEach((time) => {
        let hour = parseInt(time / MINUTES_PER_HOUR);
        let minute = time % MINUTES_PER_HOUR;
        let day = 'ПН';
        if (hour >= HOURS_PER_DAY && hour < 2 * HOURS_PER_DAY) {
            hour -= HOURS_PER_DAY;
            day = 'ВТ';
        }
        if (hour >= 2 * HOURS_PER_DAY && hour <= 3 * HOURS_PER_DAY) {
            hour -= 2 * HOURS_PER_DAY;
            day = 'СР';
        }
        hour = timeToNormal(hour);
        minute = timeToNormal(minute);
        startArray[startArray.indexOf(time)] = [day, hour, minute];
    });

    return startArray;
}

/**
 *  Преобразование в формат ЧЧ:ММ
 * @param {Number} timeUnit
 * @returns {String}
 */
function timeToNormal(timeUnit) {
    if (timeUnit >= 0 && timeUnit < 10) {
        return ('0' + String(timeUnit));
    }

    return String(timeUnit);
}
