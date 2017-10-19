'use strict';

module.exports = {
    formatTimeToMinutes: formatTimeToMinutes,
    getMintutesFromWeekStart: getMintutesFromWeekStart,
    getDay: getDay,
    leadMinutesToCertainTimeZone: leadMinutesToCertainTimeZone,

};

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */

function getDayNumber(day) {
    switch (day) {
        case 'ПН':
            return 0;
        case 'ВТ':
            return 1;
        case 'СР':
            return 2;
        default:
            return -1;
    }
}

function getTime(fullTime) {
    return String(fullTime).substr(3);
}

function getDay(fullTime) {
    return String(fullTime).substr(0, 2);
}

function createFullTime(day, minutesFromDayStart, timeZone) {

}

function getTimeZone(time) {
    return String(time).substr(6);
}

function getMintutesFromWeekStart(fullTime) {
    var time = getTime(fullTime);
    var dayNumber = getDayNumber(getDay(fullTime));
    var h = String(time).substr(0, 2);
    var m = String(time).substr(3, 2);

    return Number(dayNumber) * 1440 + Number(h) * 60 + Number(m);
}

function leadTimeToCertainTimeZoneMinutesFromWeekStart(date, timeZone) {
    var dayNumber = getDayNumber(getDay(date));
    var time = getTime(date);
    var originalTimeZone = getTimeZone(time);
    var mintutesFromWeekStart = getMintutesFromWeekStart(time);

    return mintutesFromWeekStart + (timeZone - originalTimeZone) * 60;
}

function leadMinutesToCertainTimeZone(minutes, originalTimeZone, targetTimeZone) {
    return minutes + (targetTimeZone - originalTimeZone) * 60;
}

function generateBankTimes(startTime, endTime) {
    var res = [];
    for (var i = 0; i < 3; i++) {
        res.push({ from: 1440 * i + startTime, end: 1440 * i + endTime });
    }

    return res;
}

function checkEndsOfSegment(left, right) {
    if (left < right) {
        return { from: left, to: right };
    }

    return { from: 0, to: 0 };
}

function findInterSection(firstIntervals, secondIntervals) {
    var res = [];
    for (var i = 0; i < firstIntervals.length; i++) {
        for (var j = 0; j < secondIntervals.length; j++) {
            var left = Math.max(firstIntervals[i].from, secondIntervals[j].from);
            var right = Math.min(firstIntervals[i].to, secondIntervals[j].to);
            res.push(checkEndsOfSegment(left, right));
        }
    }

    return res;
}

function findInterSections(dannyTimes, rustyTimes, linusTimes, bankTimes) {
    var appropriateDannyTime = findInterSection(dannyTimes, bankTimes);
    var appropriateRustyTime = findInterSection(rustyTimes, bankTimes);
    var appropriateLinusTime = findInterSection(linusTimes, bankTimes);
    var appropriateDannyAndRustyTime = findInterSection(appropriateDannyTime, appropriateRustyTime);

    return findInterSection(appropriateDannyAndRustyTime, appropriateLinusTime);
}

function formatTimeToMinutes(timesArray, bankTimeZone) {
    var res = [];
    var i = 0;
    var l = timesArray.length;
    while (i < l) {
        var originalTimeZone = getTimeZone(getTime(timesArray[i].from));
        var startMinutes =
            leadMinutesToCertainTimeZone(
                getMintutesFromWeekStart(
                    timesArray[i].from), originalTimeZone, bankTimeZone);
        var endMinutes =
            leadMinutesToCertainTimeZone(
                getMintutesFromWeekStart(
                    timesArray[i].to), originalTimeZone, bankTimeZone);
        res.push({ from: startMinutes, to: endMinutes });
        i++;
    }

    return res;
}

exports.isStar = true;

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
    var bankTimeZone = getTimeZone(workingHours.from);
    var dannyTimes = formatTimeToMinutes(schedule.Danny, bankTimeZone);
    var rustyTimes = formatTimeToMinutes(schedule.Rusty, bankTimeZone);
    var linusTimes = formatTimeToMinutes(schedule.Linus, bankTimeZone);
    var answer =
        findInterSections(dannyTimes, rustyTimes, linusTimes,
            generateBankTimes(workingHours.from, workingHours.to));

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return answer.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (answer.length === 0) {
                return '';
            }


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
