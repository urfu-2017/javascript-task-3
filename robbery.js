'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

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
 * Добавляет элемент в массив и возвращает 1, если элемент добавлен и 0 в противном случае
 * @param {Object} element
 * @param {Object[]} array
 * @param {Number} position
 * @returns {Number}
 */
function add(element, array, position) {
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
        for (let i = 0; i < goodTime.length; i++) {
            let listOfGood = without(goodTime[i], bad);
            let j = add(listOfGood[0], goodTime, i);
            i = i + j - 1;
            add(listOfGood[1], goodTime, goodTime.length);
        }
    }

    return goodTime;
}

function addHalfHour(time) {
    let minutes = Number(time.slice(6, 8)) + 30;
    let hours = Number(time.slice(3, 5)) + 1;
    let timezone = Number(time.split('+')[1]);
    if (minutes < 60) {
        return time.slice(0, 6) + `${minutes}+${timezone}`;
    }
    let newMinutes = (minutes % 60);
    if (hours < 23) {
        return `${time.slice(0, 3) + (hours < 9 ? '0' + hours : String(hours))}:${
            newMinutes < 9 ? '0' + newMinutes : String(newMinutes)}+${timezone}`;
    }

    return `${days[days.indexOf(time.slice(0, 2)) + 1]} 00:${
        newMinutes < 9 ? '0' + newMinutes : String(newMinutes)}+${timezone}`;
}

exports.add = addHalfHour;

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
        listOfTimes.push(schedule[guy].map(el => {
            return { from: convertTime(el.from, bankZone), to: convertTime(el.to, bankZone) };
        }));
    }
    let goodTime = listOfTimes.reduce(getMomentForPair, [
        { from: 'ПН ' + workingHours.from, to: 'ПН ' + workingHours.to },
        { from: 'ВТ ' + workingHours.from, to: 'ВТ ' + workingHours.to },
        { from: 'СР ' + workingHours.from, to: 'СР ' + workingHours.to }
    ]);

    let appropriateTime = goodTime.filter(time => {
        return toMinutes(time.to) - toMinutes(time.from) >= duration;
    }).sort((obj1, obj2) => {
        if (toMinutes(obj1.from) < toMinutes(obj2.from)) {
            return -1;
        }
        if (toMinutes(obj1.from) > toMinutes(obj2.from)) {
            return 1;
        }

        return 0;
    });

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

            return template.replace('%HH', time.from.slice(3, 5))
                .replace('%MM', time.from.slice(6, 8))
                .replace('%DD', time.from.slice(0, 2));
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
            if (toMinutes(time.to) - toMinutes(time.from) >= this.duration + 30) {
                this.allMoments[this.momentNumber] = {
                    from: addHalfHour(time.from),
                    to: time.to
                };

                return true;
            }
            let possibleNext = this.allMoments[this.momentNumber + 1];
            if (possibleNext && toMinutes(possibleNext.from) - toMinutes(time.to) >= 30) {
                this.momentNumber++;

                return true;
            }

            return false;
        }
    };
};
