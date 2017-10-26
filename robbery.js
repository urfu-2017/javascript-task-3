'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * Переводит время в минуты с учетом нового часового пояса
 * @param {String} time
 * @param {Number} newZone
 * @returns {Number}
 */
function convertTime(time, newZone) {
    let inc = newZone - Number(time.split('+')[1]);

    return toMinutes(time) + inc * 60;
}

/**
 * Переводит дату в количество минут) с начала недели
 * @param {String} time
 * @returns {Number}
 */
function toMinutes(time) {
    return days.indexOf(time.slice(0, 2)) * 1440 +
        Number(time.slice(3, 5)) * 60 +
        Number(time.slice(6, 8));
}

/**
 * Переводит минуты в дату
 * @param {Number} minutes
 * @returns {Object}
 */
function toDate(minutes) {
    let day = Math.floor(minutes / 1440);
    let hours = Math.floor((minutes - day * 1440) / 60);
    minutes -= day * 1440 + hours * 60;
    let newMinutes = `0${minutes}`.slice(-2);
    let newHours = `0${hours}`.slice(-2);

    return { day: days[day], hours: newHours, minutes: newMinutes };
}

/**
 * Возвращает первый временной отрезок без второго
 * @param {Object} range1
 * @param {Object} range2
 * @returns {Object[]}
 */
function without(range1, range2) {
    if (range1.to <= range2.from || range2.to <= range1.from) {
        return [range1];
    }
    if (range2.from <= range1.from && range1.to <= range2.to) {
        return [null];
    }
    if (range1.from <= range2.from && range2.to <= range1.to) {
        return [
            { from: range1.from, to: range2.from },
            { from: range2.to, to: range1.to }
        ];
    }
    if (range1.from <= range2.from) {
        return [{ from: range1.from, to: range2.from }];
    }

    return [{ from: range2.to, to: range1.to }];
}

/**
 * Заменяет элемент в массиве либо убирает его если заменить нечем
 * @param {Object} element
 * @param {Object[]} array
 * @param {Number} position
 * @returns {Number}
 */
function replace(element, array, position) {
    if (element) {
        array[position] = element;

        return 1;
    }
    array.splice(position, 1);

    return 0;
}

/**
 * Находит подходящее время с учетом неподходящего
 * @param {Object[]} goodTime - Подходящее время
 * @param {Object[]} badTime - Неподходящее время
 * @returns {Object[]}
 */
function getMomentForPair(goodTime, badTime) {
    for (let bad of badTime) {
        let i = 0;
        while (i < goodTime.length) {
            let listOfGood = without(goodTime[i], bad);
            let j = replace(listOfGood[0], goodTime, i);
            i = i + j;
            replace(listOfGood[1], goodTime, goodTime.length);
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
    let bankZone = Number(workingHours.to.split('+')[1]);
    for (let guy of Object.keys(schedule)) {
        listOfTimes.push(schedule[guy].map(time => ({
            from: convertTime(time.from, bankZone),
            to: convertTime(time.to, bankZone) })
        ));
    }
    let goodTime = listOfTimes.reduce(getMomentForPair, [
        { from: toMinutes('ПН ' + workingHours.from), to: toMinutes('ПН ' + workingHours.to) },
        { from: toMinutes('ВТ ' + workingHours.from), to: toMinutes('ВТ ' + workingHours.to) },
        { from: toMinutes('СР ' + workingHours.from), to: toMinutes('СР ' + workingHours.to) }
    ]);

    let appropriateTime = goodTime.filter(time => time.to - time.from >= duration)
        .sort((obj1, obj2) => obj1.from - obj2.from);

    return {
        allMoments: appropriateTime,
        momentNumber: 0,
        duration: duration,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(this.allMoments[this.momentNumber]);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let time = this.allMoments[this.momentNumber];
            if (!time) {
                return '';
            }
            time = toDate(time.from);

            return template.replace('%DD', time.day)
                .replace('%HH', time.hours)
                .replace('%MM', time.minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let time = this.allMoments[this.momentNumber];
            if (!time) {
                return false;
            }
            if (time.to - time.from >= this.duration + 30) {
                this.allMoments[this.momentNumber] = {
                    from: time.from + 30,
                    to: time.to
                };

                return true;
            }
            let possibleNext = this.allMoments[this.momentNumber + 1];
            if (possibleNext && possibleNext.from - time.to >= 30) {
                this.momentNumber++;

                return true;
            }

            return false;
        }
    };
};
