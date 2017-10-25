'use strict';

module.exports = {
    formatTimeToMinutes: formatTimeToMinutes,
    getMintutesFromWeekStart: getMintutesFromWeekStart,
    getDay: getDay,
    leadMinutesToCertainTimeZone: leadMinutesToCertainTimeZone,
    getAppropriateMoment: getAppropriateMoment,
    generateFreeTimes: generateFreeTimes

};

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */


/**
 *
 * @param {Number} day - название дня недели
 * @returns {number} - возвращает номер дня (ПН - 0)
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

/**
 *
 * @param {Number} dayNumber - номер дня недели (ПН - 0)
 * @returns {String} - возвращает название дня недели
 */
function getDayNameByNumber(dayNumber) {
    switch (dayNumber) {
        case 0:
            return 'ПН';
        case 1:
            return 'ВТ';
        case 2:
            return 'СР';
        default:
            return '';
    }
}

/**
 * Переводит минуты в формат HH:MM
 * @param {Number} minutes - время в минутах
 * @returns {{day: String, hours: number, minutes: number}}
 *      возвращает объект День, Часы, Минуты
 */
function devideTime(minutes) {
    var day = getDayNameByNumber(Math.floor(minutes / 1440));
    var h = Math.floor((minutes % 1440) / 60);
    var m = Math.floor(minutes % 1440) % 60;
    if (String(h).length === 1) {
        h = '0' + h;
    }
    if (String(m).length === 1) {
        m = '0' + m;
    }

    return {
        day: day,
        hours: h,
        minutes: m
    };
}

/**
 *
 * @param {String} fullTime - время в формтае DD HH:MM+Z
 * @returns {string} возвращет время в формате HH:MM+Z
 */
function getTime(fullTime) {
    return String(fullTime).substr(3);
}

/**
 *
 * @param {String} timeWithZone - время в формате HH:MM+Z
 * @returns {string} возвращает время в формате HH:MM
 */
function getTimeWithoutZone(timeWithZone) {
    return String(timeWithZone).substr(0, 5);
}

/**
 *
 * @param {String} fullTime - время в формате DD HH:MM[+Z]
 * @returns {string} - возвращает день недели DD
 */
function getDay(fullTime) {
    return String(fullTime).substr(0, 2);
}

/**
 * @param {Array} busyTimes - массив занятости [{from: X, to: Y],...]
 * @returns {Array} - возвращает массив свободного времени [{from: X, to: Y],...]
 */
function generateFreeTimes(busyTimes) {
    var res = [];
    if (busyTimes.length === 0) {
        res.push({ from: 0, to: 4319 });

        return res;
    }
    if (busyTimes[0].from !== 0) {
        res.push({ from: 0, to: busyTimes[0].from });
    }
    for (var i = 0; i < busyTimes.length - 1; i++) {
        res.push({ from: busyTimes[i].to, to: busyTimes[i + 1].from });
    }
    if (busyTimes[busyTimes.length - 1].to < 4319) {
        res.push({ from: busyTimes[busyTimes.length - 1].to, to: 4319 });
    }

    return res;
}

/**
 * @param {String} time - время в формате HH:MM+Z
 * @returns {string} - возвращает временную зону Z
 */
function getTimeZone(time) {
    return String(time).substr(6);
}

/**
 * @param {String} fullTime - время в формате DD HH:MM
 * @returns {number} - возвращает количество минут, прошедших с начала неделе
 */
function getMintutesFromWeekStart(fullTime) {
    var time = getTime(fullTime);
    var dayNumber = getDayNumber(getDay(fullTime));
    var h = String(time).substr(0, 2);
    var m = String(time).substr(3, 2);

    return Number(dayNumber) * 1440 + Number(h) * 60 + Number(m);
}

/**
 * @param {String} time - время в формате DD HH:MM
 * @returns {number} - возвращает количество минут, прошедших с начала дня
 */
function getMinutesFromDayStart(time) {
    var h = String(time).substr(0, 2);
    var m = String(time).substr(3, 2);

    return Number(h) * 60 + Number(m);
}

/**
 * Пересчитывает минуты одной часовой зоны в другую
 * @param {Number} minutes - количество минут
 * @param {Number} originalTimeZone - исходная временная зона
 * @param {Number} targetTimeZone - временная зона назначения
 * @returns {*} - возвращает количество минут во временной зоне назначения
 */
function leadMinutesToCertainTimeZone(minutes, originalTimeZone, targetTimeZone) {
    return minutes + (targetTimeZone - originalTimeZone) * 60;
}

/**
 * Генерирует расписание банка в минутах с начала недели
 * @param {Number} startTime - время открытия банка в минутах с начала дня
 * @param {Number} endTime - время закрытия банка в минутах с конца дня
 * @returns {Array} - возвращает расписание банка [{from: X, to: Y}]
 */
function generateBankTimes(startTime, endTime) {
    var res = [];
    for (var i = 0; i < 3; i++) {
        res.push({ from: 1440 * i + startTime, to: 1440 * i + endTime });
    }

    return res;
}

/**
 * Проверяет на корректность концы отрезка
 * @param {Number} left - левый конец
 * @param {Number} right - правый конец
 * @returns {*} - возвращает true если левый конец меньше правого и false в противном случае
 */
function checkEndsOfSegment(left, right) {
    if (left < right) {
        return { from: left, to: right };
    }

    return { from: 0, to: 0 };
}

/**
 * Находит пересечения в расписании
 * @param {Array} firstIntervals - интервалы в расписании первого объетка
 * @param {Array} secondIntervals - интервалы в расписании первого объетка
 * @returns {Array} - возвращает пересечение интервалов
 */
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

/**
 * Находит пересечение в расписании всех членов банды с расписанием работы банка
 * @param {Object} timeTable - расписание членов банды {name:[{from: X, to: Y}, ...], ...}
 * @param {Array} bankTimes - расписание банка [{from: X, to: Y}, ...]
 * @returns {Array} - возвращает пересечения [{from: X, to: Y}, ...]
 */
function findInterSectionsOfAll(timeTable, bankTimes) {
    var keys = Object.keys(timeTable);
    var firstTimes = findInterSection(timeTable[keys[0]], bankTimes);
    for (var i = 1; i < keys.length; i++) {
        firstTimes = findInterSection(firstTimes, timeTable[keys[i]]);
    }

    return firstTimes;
}

/**
 * Переводит расписание банды в расписание в минутах часового пояса банка
 * @param {Array} timesArray
 * @param {Number} bankTimeZone
 * @returns {Array}
 */
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
function getAppropriateMoment(schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var bankTimeZone = getTimeZone(workingHours.from);
    var freeTimes = {};
    for (var man in schedule) {
        if (man !== null) {
            freeTimes[man] = generateFreeTimes(formatTimeToMinutes(schedule[man], bankTimeZone));
        }
    }
    var bankStartMinutes = getMinutesFromDayStart(getTimeWithoutZone(workingHours.from));
    var bankEndMinutes = getMinutesFromDayStart(getTimeWithoutZone(workingHours.to));
    var answer =
        findInterSectionsOfAll(freeTimes,
            generateBankTimes(bankStartMinutes, bankEndMinutes))
            .filter((x) => {
                return x.to - x.from >= duration;
            });
    var lastIndex = 0;
    var timeToGrab = answer[lastIndex];

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
            var t = devideTime(timeToGrab.from);

            return template.replace('%DD', t.day)
                .replace('%HH', t.hours)
                .replace('%MM', t.minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (answer.length === 0) {
                return false;
            }
            for (var i = 1; i < answer.length; i++) {
                if (answer[i].from - answer[lastIndex].from >= 30) {
                    lastIndex = i;
                    timeToGrab = answer[lastIndex];

                    return true;
                }
            }

            return false;
        },

        answer: function () {
            return answer;
        }
    };
}
