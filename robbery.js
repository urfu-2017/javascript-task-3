'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

var days = 'ПН ВТ СР'.split(' ');

function toMinutesUTC(time) {
    var hours = Number(time.slice(3, 5));
    var minutes = Number(time.slice(6, 8));
    var offset = getOffset(time);

    return hours * 60 + minutes - offset * 60;
}

function getOffset(time) {
    return Number(time.slice(8, 11));
}

function timeToAbsMinutes(time, bankOffset) {
    var dayOffset = getDayOfWeek(time) * 24;
    var offset = bankOffset + dayOffset;

    return toMinutesUTC(time) + offset * 60;
}

function workingHoursToIntervals(workingHours) {
    var intervals = [];

    for (var index = 0; index < 3; index++) {
        var day = days[index];
        intervals.push({
            from: day + ' ' + workingHours.from,
            to: day + ' ' + workingHours.to
        });
    }

    return intervals;
}

function getDayOfWeek(timeString) {
    var day = timeString.slice(0, 2);

    return days.indexOf(day);
}

function createSlotsArray(count = 3) {
    let slots = new Array(24 * 2 * count);

    for (var index = 0; index < slots.length; index++) {
        slots[index] = 0;
    }

    return slots;
}

function fillSlots(intervals, bankOffset) {
    var slots = createSlotsArray();

    for (let interval of intervals) {
        var minutesFrom = timeToAbsMinutes(interval.from, bankOffset);
        var minutesTo = timeToAbsMinutes(interval.to, bankOffset);
        var startIndex = minutesFrom / 30;
        var endIndex = minutesTo / 30;

        for (var index = startIndex; index < endIndex; index++) {
            slots[index] = 1;
        }
    }

    return slots;
}

function invertSlots(slots) {
    for (var index = 0; index < slots.length; index++) {
        slots[index] = 1 - slots[index];
    }
}

function unionSlots(slotsA, slotsB) {
    for (var index = 0; index < slotsA.length; index++) {
        slotsA[index] = Number(slotsA[index] && slotsB[index]);
    }
}

function findRobberyStartSlot(slots, duration) {
    slots = slots.join('');
    var size = Math.ceil(duration / 30);
    var needle = '1'.repeat(size);

    return slots.indexOf(needle);
}

function indexToTime(index) {
    var totalMinutes = index * 30;
    var dayIndex = Math.floor(totalMinutes / (24 * 60));
    var dayMinutes = totalMinutes % (24 * 60);
    var hours = Math.floor(dayMinutes / 60);
    var minutes = dayMinutes % 60;

    var day = days[dayIndex];
    hours = ('0' + hours).slice(-2);
    minutes = ('0' + minutes).slice(-2);

    return { day, hours, minutes };
}

function format(pattern, result) {
    pattern = pattern.replace('%HH', result.hours);
    pattern = pattern.replace('%MM', result.minutes);
    pattern = pattern.replace('%DD', result.day);

    return pattern;
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
    // console.info(schedule, duration, workingHours);
    var bankIntervals = workingHoursToIntervals(workingHours);
    var bankOffset = getOffset(bankIntervals[0].from);
    var bankSlots = fillSlots(bankIntervals, bankOffset);

    for (let intervals of Object.values(schedule)) {
        var slots = fillSlots(intervals, bankOffset);
        invertSlots(slots);
        unionSlots(bankSlots, slots);
    }

    var index = findRobberyStartSlot(bankSlots, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return index !== -1;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (index === -1) {
                return '';
            }
            var result = indexToTime(index);

            return format(template, result);
        }
    };
};
