'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const halfWeek = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2,
    0: 'ПН',
    1: 'ВТ',
    2: 'СР'
};
var minutesForRobbery = 3 * 24 * 60;

function toMinutes(time, shift) {
    let minutes = time.split(' ');
    minutes = (halfWeek[minutes[0]] * 24 + parseInt(minutes[1].split(':')[0]) + shift) * 60 +
        parseInt(minutes[1].split(':')[1].slice(0, 2));

    return minutes;
}

function filterRobbers(availableMinutes, schedule, workingHours) {
    let bankTimeZone = parseInt(workingHours.from.split('+')[1]);
    let shift = bankTimeZone - parseInt(schedule.Danny[0].from.split('+')[1]);

    schedule.Danny.forEach(filterTimeSegment);

    shift = bankTimeZone - parseInt(schedule.Rusty[0].from.split('+')[1]);
    schedule.Rusty.forEach(filterTimeSegment);

    shift = bankTimeZone - parseInt(schedule.Linus[0].from.split('+')[1]);
    schedule.Linus.forEach(filterTimeSegment);

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
    let openMonday = toMinutes('ПН ' + workingHours.from, 0);
    let openTuesday = toMinutes('ВТ ' + workingHours.from, 0);
    let openWednesday = toMinutes('СР ' + workingHours.from, 0);
    let closeMonday = toMinutes('ПН ' + workingHours.to, 0);
    let closeTuesday = toMinutes('ВТ ' + workingHours.to, 0);
    let closeWednesday = toMinutes('СР ' + workingHours.to, 0);

    availableMinutes = availableMinutes.filter(time =>
        ((time >= openMonday && time < closeMonday) ||
        (time >= openTuesday && time < closeTuesday) ||
        (time >= openWednesday && time < closeWednesday)));

    return availableMinutes;
}

function combimeMinutes(availableMinutes) {
    let startSegment = availableMinutes[0];
    let freeTime = 1;
    availableMinutes = availableMinutes.reduce(function (freeTimeSegments, currentTime, index) {
        if (index !== 0) {
            if (currentTime - availableMinutes[index - 1] === 1) {
                freeTime ++;

            } else {
                freeTimeSegments.push({ start: startSegment, time: freeTime });
                startSegment = currentTime;
                freeTime = 1;
            }
        }

        return freeTimeSegments;
    }, []);

    return availableMinutes;
}

function toNormalTime(time) {
    var normalTime = {};
    normalTime.day = halfWeek[parseInt(time / 1440)];
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
    availableMinutes = combimeMinutes(availableMinutes);
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
            let index = availableMinutes.findIndex(time => (time.start >= later &&
                time.time >= duration) || time.start + time.time >= duration + later);
            if (index !== -1) {
                if (beginingTime === availableMinutes[index].start) {
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
