'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const MIN_IN_HOUR = 60;
const HOUR_IN_DAY = 24;
const MIN_IN_DAY = MIN_IN_HOUR * HOUR_IN_DAY;
const DAYS = {
    'ПН': MIN_IN_DAY,
    'ВТ': MIN_IN_DAY * 2,
    'СР': MIN_IN_DAY * 3
};

function getTimeZone(time) {
    return parseInt((time.slice(6)));
}

function getMinutes(time) {
    return parseInt(time.slice(3, 5));
}

function getHours(time) {
    return parseInt(time.slice(0, 2));
}

function convertToMinutes(time) {
    let minutes = 0;
    minutes += getHours(time) * MIN_IN_HOUR;
    minutes += getMinutes(time);
    minutes += (workingZone - getTimeZone(time)) * MIN_IN_HOUR;

    return minutes;
}

function getDay(day) {
    if (day === 'ВТ') {
        return (DAYS.ПН);
    }
    if (day === 'СР') {
        return (DAYS.ВТ);
    }

    return 0;
}

function getTimeInterval(record) {
    let interval = [];
    let startTime = (record.from).split(' ');
    let endTime = (record.to).split(' ');
    let start = convertToMinutes(startTime[1]);
    let end = convertToMinutes(endTime[1]);
    start += getDay(startTime[0]);
    end += getDay(endTime[0]);
    interval.push(start);
    interval.push(end);

    return interval;
}

function compareElements(a, b) {
    return a[0] - b[0];
}

function getSchedule() {
    let reversedSchedule = [];
    for (let man of Object.keys(schedule)) {
        for (let record of schedule[man]) {
            reversedSchedule.push(getTimeInterval(record));
        }
    }

    return reversedSchedule.sort(compareElements);
}

function getMax(a, b) {
    if (a > b) {
        return a;
    }

    return b;
}

function getWorkingSchedule() {
    let oldSchedule = getSchedule();
    let resultSchedule = [];
    if (oldSchedule[0][0] >= 0) {
        resultSchedule.push([0, oldSchedule[0][0]]);
    }
    let currentMax = oldSchedule[0][1];
    for (let i = 1; i < oldSchedule.length; i++) {
        if (oldSchedule[i][0] + 1 <= currentMax) {
            currentMax = getMax(currentMax, oldSchedule[i][1]);
        } else {
            resultSchedule.push([currentMax, oldSchedule[i][0]]);
            currentMax = oldSchedule[i][1];
        }
    }
    if (currentMax < DAYS.СР) {
        resultSchedule.push([currentMax, DAYS.СР]);
    }

    return resultSchedule;

}

function getMin(a, b) {
    if (a < b) {
        return a;
    }

    return b;
}

function checkLeft(a, b, c, d) {
    let result = [];
    if ((a <= c) && (b > c)) {
        if (((b < d) && (b - c >= duration)) ||
        ((b >= d) && (d - c >= duration))) {

            result.push(c);
            result.push(getMin(d, b));
        }
    }

    return result;
}

function checkRight(a, b, c, d) {
    let result = [];
    if ((c <= a) && (d > a)) {
        if (((b < d) && (b - a >= duration)) ||
        ((b >= d) && (d - a >= duration))) {

            result.push(a);
            result.push(getMin(d, b));
        }
    }

    return result;
}

function checkInterval(gang, bank, min) {
    let result = [];
    let left = checkLeft(gang[0], gang[1], bank[0], bank[1], min);
    let right = checkRight(gang[0], gang[1], bank[0], bank[1], min);
    if (left.length !== 0) {
        result = left;
    }
    if (right.length !== 0) {
        result = right;
    }

    return result;
}

function tryToGetTime() {
    let gangSchedule = getWorkingSchedule();
    var startCrime = [];
    for (let i = 0; i < gangSchedule.length; i++) {
        for (let j = 0; j < bankSchedule.length; j++) {
            startCrime.push(checkInterval(
                gangSchedule[i], bankSchedule[j], duration));
        }
    }

    return startCrime;
}

function transform(number) {
    let result = '';
    if (number < 10) {
        result = ('0' + number);
    } else {
        result = number;
    }

    return result;
}
function changeFormate(number) {
    let time = [];
    let oldTime = number;
    if (oldTime > DAYS.ВТ && oldTime <= DAYS.СР) {
        time.push('СР');
        oldTime -= DAYS.ВТ;
    }
    if (oldTime > DAYS.ПН && oldTime <= DAYS.ВТ) {
        time.push('ВТ');
        oldTime -= DAYS.ПН;
    } else {
        time.push('ПН');
    }
    let hours = (oldTime - (oldTime % MIN_IN_HOUR)) / MIN_IN_HOUR;
    let minutes = oldTime % MIN_IN_HOUR;
    time.push(transform (hours));
    time.pudh(transform(minutes));

    return time;
}

function check() {
    if (tryToGetTime().length !== 0) {
        return true;
    }

    return false;
}

function showList() {
    let timelist = [];
    let timeInterval = tryToGetTime();
    let n;
    for (let i = 0; i < timeInterval.length; i++) {
        n = (timeInterval[i][0]);
        while ((n < timeInterval[i][1]) &&
        (timeInterval[i][1] - n >= duration)) {
            timelist.push(n);
            n += 30;
            n += duration;
        }
    }

    return timelist;
}

function createTimeList() {
    let timelist = [];
    if (check()) {
        timelist = showList();
    }

    return timelist;
}

function changeTemplate(template) {
    let time;
    if (topList.length === 0) {
        time = changeFormate(lastChance);
    } else {
        time = changeFormate(topList[0]);
        topList.splice(0, 1);
    }

    return template
        .replace('%HH', time[1])
        .replace('%MM', time[2])
        .replace('%DD', time[0]);
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
    //console.info(schedule, duration, workingHours);
    var workingZone = getTimeZone(workingHours.from);
    var startBank = convertToMinutes(workingHours.from);
    var endBank = convertToMinutes(workingHours.to);
    
    var bankSchedule = [
        [startBank, endBank],
        [startBank + DAYS.ПН, endBank + DAYS.ПН],
        [startBank + DAYS.ВТ, endBank + DAYS.ВТ]
    ];
    var topList = createTimeList();
    const lastChance = parseInt(topList.slice(-1));
    var ok = check();
    var letter = changeTemplate(template);
    
    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return ok;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (ok) {
                return (letter);
            }
            
            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            return (topList.length === 0);
        }
    };
};
