'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @param {String} bankHourZone
 * @returns {Object}
 */

const DAYS = {
    ПН: 1,
    ВТ: 2,
    СР: 3
};
const TIME_REGEX = /([А-Я]{2}) (\d\d):(\d\d)\+(\d+)/;
const BANK_REGEX = /(\d\d):(\d\d)\+(\d+)/;
const NAME_BUDDY = ['Danny', 'Rusty', 'Linus'];
const ACTION_DAYS = ['ПН', 'ВТ', 'СР'];
const MS_IN_MINUTE = 60000;

function createDate([day, hour, minute], seconds) {
    if (!seconds) {
        seconds = 0;
    }
    if (hour > 23 || hour < 0) {
        let sign = hour > 23 ? 1 : -1;
        hour -= 24 * sign;
        day += sign;
    }

    return Date.parse(new Date(1970, 5, day, hour, minute, seconds));
}

function parseInterval(time) {
    let elements = TIME_REGEX.exec(time);

    return [DAYS[elements[1]] || 0, elements[2], elements[3], elements[4]];
}

function getNumberString(number) {
    return number < 10 ? '0' + number : number;
}

function getDate(time, bankUTC) {
    let parsedTime = parseInterval(time);
    parsedTime[1] -= parsedTime[3] - bankUTC;

    return createDate(parsedTime);
}

function getInterval(interval, bankUTC) {
    return {
        from: getDate(interval.from, bankUTC),
        to: getDate(interval.to, bankUTC)
    };
}

function getBusyTime(schedule, bankUTC) {
    return schedule.map(function (interval) {
        return getInterval(interval, bankUTC);
    });
}

function parseBankInterval(time) {
    let matches = BANK_REGEX.exec(time);

    return {
        hour: matches[1],
        minute: matches[2],
        UTC: matches[3]
    };
}

function getClosedBank(workingHours) {
    let intervals = [];
    let startBankInterval = parseBankInterval(workingHours.from);
    let endBankInterval = parseBankInterval(workingHours.to);
    Object.keys(DAYS).forEach(function (day) {
        day = DAYS[day];
        intervals.push (
            {
                from: createDate([day, 0, 0]),
                to: createDate([day, startBankInterval.hour, startBankInterval.minute])
            },
            {
                from: createDate([day, endBankInterval.hour, endBankInterval.minute]),
                to: createDate([day, 23, 59], 59)
            });
    });

    return intervals;
}

function getMomentsForAttack(busy, duration) {
    let tempSchedule = [];
    for (var i = 0; i < busy.length - 1; i++) {
        if (busy[i].to + (duration * MS_IN_MINUTE) <= busy[i + 1].from) {
            tempSchedule.push({ from: busy[i].to, to: busy[i + 1].from });
        }
    }

    return tempSchedule;
}

function mergePersons(prev, cur) {
    let tempSchedule = prev;
    for (var i = 0; i < cur.length; i++) {
        let fromMin = findMin(prev, cur[i].from);
        let toMax = findMax(prev, cur[i].to);
        if (fromMin[1] === cur.length) {
            tempSchedule.push({ from: fromMin[0], to: toMax[0] });
        } else if (toMax[1] === -1) {
            tempSchedule.unshift({ from: fromMin[0], to: toMax[0] });
        } else {
            tempSchedule.splice(fromMin[1], toMax[1] - fromMin[1] + 1,
                { from: fromMin[0], to: toMax[0] });
        }
    }

    return tempSchedule;
}

function findMin(arr, from) {
    for (var i = 0; i < arr.length; i++) {
        if (from <= arr[i].from) {
            return [from, i];
        } else if (from <= arr[i].to) {
            return [arr[i].from, i];
        }
    }

    return [from, arr.length];
}

function findMax(arr, to) {
    for (var i = arr.length - 1; i >= 0; i--) {
        if (to >= arr[i].to) {
            return [to, i];
        } else if (to >= arr[i].from) {
            return [arr[i].to, i];
        }
    }

    return [to, -1];
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    const bankUTC = parseBankInterval(workingHours.from).UTC;
    let busy = [];
    NAME_BUDDY.forEach(function (name) {
        busy.push((getBusyTime(schedule[name], bankUTC)));
    });
    busy.push(getClosedBank(workingHours));
    busy.forEach(function (obj) {
        obj.sort(function (firstInterval, secondInterval) {
            return firstInterval.from - secondInterval.from;
        });
    });
    busy.reduce((prev, cur) => {
        return mergePersons(prev, cur);
    });
    let robberyMoments = getMomentsForAttack(busy[0], duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(robberyMoments[0]) && duration > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.exists()) {
                let robbery = new Date(robberyMoments[0].from);

                return template
                    .replace(/%DD/g, ACTION_DAYS[robbery.getDay() - 1])
                    .replace(/%HH/g, getNumberString(robbery.getHours()))
                    .replace(/%MM/g, getNumberString(robbery.getMinutes()));
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (this.exists) {
                if (robberyMoments[0].from + (duration + 30) * MS_IN_MINUTE <=
                robberyMoments[0].to) {
                    robberyMoments[0].from += 30 * MS_IN_MINUTE;

                    return true;
                } else if (robberyMoments.length > 1) {
                    robberyMoments.shift();

                    return true;
                }
            }

            return false;
        }
    };
};
