'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const availableDays = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2
};
var minutesForRobbery = 3 * 24 * 60;

function toMinutes(time, shift) {
    let minutes = time.split(' ');
    minutes = (availableDays[minutes[0]] * 24 + parseInt(minutes[1].split(':')[0]) + shift) * 60 +
        parseInt(minutes[1].split(':')[1].slice(0, 2));

    return minutes;
}

function filterRobbers(availableMinutes, schedule, workingHours) {
    let bankTimeZone = parseInt(workingHours.from.split('+')[1]);
    let robbers = Object.keys(schedule);
    let shift = 0;

    robbers.forEach(function (robber) {
        shift = bankTimeZone - parseInt(schedule[robber][0].from.split('+')[1]);
        schedule[robber].forEach(filterTimeSegment);
    });

    function filterTimeSegment(timeSegment) {
        let start = timeSegment.from;
        let finish = timeSegment.to;

        start = toMinutes(start, shift);
        finish = toMinutes(finish, shift);
        availableMinutes = availableMinutes.filter(time => !(time >= start && time < finish));
    }

    return availableMinutes;
}

function filterBunkCloseTime(availableMinutes, workingHours) {
    availableMinutes = Object.keys(availableDays).reduce(function (freeTime, day) {
        var open = toMinutes(day + ' ' + workingHours.from, 0);
        var close = toMinutes(day + ' ' + workingHours.to, 0);
        var startOfDay = availableDays[day] * 24 * 60;
        var endOfDay = (availableDays[day] + 1) * 24 * 60;
        freeTime = freeTime.filter(time => ((time >= open && time < close) ||
            (time >= endOfDay) || (time < startOfDay)));

        return freeTime;
    }, availableMinutes);

    return availableMinutes;
}

function combineMinutes(availableMinutes) {
    let startSegment = availableMinutes[0];
    let freeTime = 1;
    let newschedule = [];
    for (var i = 1; i < availableMinutes.length; i++) {
        if (availableMinutes[i] - availableMinutes[i - 1] === 1) {
            freeTime ++;

        } else {
            newschedule.push({ start: startSegment, time: freeTime });
            startSegment = availableMinutes[i];
            freeTime = 1;
        }
    }
    newschedule.push({ start: startSegment, time: freeTime });

    return newschedule;
}

function toNormalTime(time) {
    var normalTime = {};
    normalTime.day = Object.keys(availableDays)[parseInt(time / 1440)];
    time = time - parseInt(time / 1440) * 1440;
    normalTime.hours = parseInt(time / 60);
    if (normalTime.hours < 10) {
        normalTime.hours = '0' + normalTime.hours;
    }
    time = time - parseInt(time / 60) * 60;
    normalTime.minutes = time;
    if (normalTime.minutes < 10) {
        normalTime.minutes = '0' + normalTime.minutes;
    }

    return normalTime;
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
    var availableMinutes = Array.from({ length: minutesForRobbery }, (v, k) => k);
    availableMinutes = filterBunkCloseTime(availableMinutes, workingHours);
    availableMinutes = filterRobbers(availableMinutes, schedule, workingHours);
    availableMinutes = combineMinutes(availableMinutes);
    var beginingTime = availableMinutes.find(timeSegment => timeSegment.time >= duration);
    if (beginingTime !== undefined) {
        beginingTime = beginingTime.start;
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return (beginingTime !== undefined);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (beginingTime !== undefined) {
                let date = toNormalTime(beginingTime);

                return template
                    .replace('%DD', date.day)
                    .replace('%HH', date.hours)
                    .replace('%MM', date.minutes);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (beginingTime === undefined) {
                return false;
            }
            let later = beginingTime + 30;
            let index = availableMinutes.findIndex(time =>
                (time.start >= later && time.time >= duration) ||
                (time.start + time.time >= duration + later) && (time.start <= beginingTime));
            if (index !== -1) {
                if (beginingTime >= availableMinutes[index].start) {
                    beginingTime = later;
                } else {
                    beginingTime = availableMinutes[index].start;
                }

                return true;
            }

            return false;
        }
    };
};
