'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

let days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * Приводит время к заданному часовому поясу
 * @param {String} time
 * @param {Number} newZone
 * @returns {String}
 */
function convertTime(time, newZone) {
    let inc = newZone - Number(time.split('+')[1]);
    let currentDay = time.slice(0, 2);
    let currentHours = Number(time.slice(3, 5)) + inc;
    if (currentHours >= 24) {
        currentDay = days[days.indexOf(currentDay) + 1];
        currentHours %= 24;
        currentHours = currentHours < 10 ? '0' + currentHours : String(currentHours);
    }
    if (currentHours < 0) {
        currentDay = days[days.indexOf(currentDay) - 1];
        currentHours += 24;
        currentHours = currentHours < 10 ? '0' + currentHours : String(currentHours);
    }

    return `${currentDay} ${currentHours + time.slice(5, 8)}+${newZone}`;
}

exports.convertTime = convertTime;

/**
 * Переводит дату в количество секунд с начала недели
 * @param {String} time
 * @returns {Number}
 */
function toMinutes(time) {
    return days.indexOf(time.slice(0, 2)) * 1440 +
        Number(time.slice(3, 5)) * 60 +
        Number(time.slice(6, 8));
}

/**
 * Сравнивает два значения времени и возвращает true если первое раньше или совпадает со вторым
 * @param {String} time1 - Считаем, что время задано в одном часовом поясе
 * @param {String} time2
 * @returns {Boolean}
 */
function isLessEqual(time1, time2) {
    let index1 = days.indexOf(time1.slice(0, 2));
    let index2 = days.indexOf(time2.slice(0, 2));
    if (index1 < index2) {
        return true;
    }

    return index1 === index2 && toMinutes(time1) <= toMinutes(time2);
}

exports.less = isLessEqual;

/**
 * Возвращает первый временной отрезок без второго
 * @param {Object} range1
 * @param {Object} range2
 * @returns {Object[]}
 */
function without(range1, range2) {
    if (isLessEqual(range1.to, range2.from) || isLessEqual(range2.to, range1.from)) {
        return [range1];
    }
    if (isLessEqual(range2.from, range1.from) && isLessEqual(range1.to, range2.to)) {
        return [null];
    }
    if (isLessEqual(range1.from, range2.from) && isLessEqual(range2.to, range1.to)) {
        return [
            { from: range1.from, to: range2.from },
            { from: range2.to, to: range1.to }
        ];
    }
    if (isLessEqual(range1.from, range2.from)) {
        return [{ from: range1.from, to: range2.from }];
    }

    return [{ from: range2.to, to: range1.to }];
}

/**
 * Добавляет элемент в массив
 * @param {Object} element
 * @param {Object[]} array
 * @param {Number} position
 */
function add(element, array, position) {
    if (element) {
        array[position] = element;
    }
}

/**
 * Находит подходящее время с учетом неподходящего
 * @param {Object[]} goodTime - Подходящее время
 * @param {Object[]} badTime - Неподходящее время
 * @returns {Object[]}
 */
function getMomentForPair(goodTime, badTime) {
    for (let bad of badTime) {
        for (let i = 0; i < goodTime.length; i++) {
            let listOfGood = without(goodTime[i], bad);
            add(listOfGood[0], goodTime, i);
            add(listOfGood[1], goodTime, goodTime.length);
        }
    }

    return goodTime;
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
    let listOfTimes = [];
    let bankZone = Number(workingHours.to.slice(-1));
    for (let guy of Object.keys(schedule)) {
        listOfTimes.push(schedule[guy].map(el => {
            return { from: convertTime(el.from, bankZone), to: convertTime(el.to, bankZone) };
        }));
    }
    let goodTime = listOfTimes.reduce(getMomentForPair, [
        { from: 'ПН ' + workingHours.from, to: 'ПН ' + workingHours.to },
        { from: 'ВТ ' + workingHours.from, to: 'ВТ ' + workingHours.to },
        { from: 'СР ' + workingHours.from, to: 'СР ' + workingHours.to }
    ]);

    let appropriateTime = goodTime.find(time => {
        return toMinutes(time.to) - toMinutes(time.from) >= duration;
    });

    return {
        time: appropriateTime,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(this.time);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.time) {
                return '';
            }

            return template.replace('%HH', this.time.from.slice(3, 5))
                .replace('%MM', this.time.from.slice(6, 8))
                .replace('%DD', this.time.from.slice(0, 2));
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
