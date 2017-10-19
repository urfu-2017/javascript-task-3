'use strict';

exports.isStar = false;

const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const HOURS_DAY = 24;
const MIN_DAY = HOURS_DAY * 60;
const DAYS_FOR_ROBBERY = 3;
const FIRST_MIN = 0;
const LAST_MIN = MIN_DAY * DAYS_FOR_ROBBERY;

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

    // интервалы времени, в которые открыт банк
    let bankOpen = bankTimeInterval(workingHours);
    // интервалы времени, в которые заняты грабители
    let robbersBusy = robbersTimeInterval(schedule, workingHours);
    // массив минут, в которые свободны грабители, и открыт банк
    let freeTimeWithBank = findFreeTime(robbersBusy, bankOpen);
    // интервалы времени, в которых свободны грабители, и открыт банк
    let freeDurations = checkDuration(freeTimeWithBank);
    // время ограбления
    let goal = compareDurations(duration, freeDurations);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (goal || goal === 0) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */

        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            let goodTime = timeFormat(goal);

            return template.replace('%DD', goodTime.day)
                .replace('%HH', toPrettyTime(goodTime.hours))
                .replace('%MM', toPrettyTime(goodTime.minutes));
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

// привожу время к итоовому формату
function timeFormat(firstTime) {
    let goodTime = new Date(firstTime * 60 * 1000).getTime() / 1000 / 60;
    let day = DAYS[Math.floor(goodTime / MIN_DAY)];
    goodTime -= MIN_DAY * DAYS.indexOf(day);
    let hours = parseInt(goodTime / 60);
    let minutes = Math.round(goodTime % 60);

    return { day: day, hours: hours, minutes: minutes };
}

// сравниваю нужную длительность ограбления с возможными
function compareDurations(duration, freeDurations) {
    for (const el of freeDurations) {
        if (duration <= el.duration) {
            return el.from;
        }
    }
}

// нахожу начало возможного интервала ограбление и его продолжительность
function checkDuration(readyTime) {
    readyTime.push(null);
    let freeDurations = [];
    let from = readyTime[0];
    let counter = 0;
    let preMinute = readyTime[0] - 1;
    for (const minute of readyTime) {
        if (minute === preMinute + 1) {
            counter += 1;
            preMinute = minute;
        } else {
            freeDurations.push({ duration: counter, from: from });
            counter = 1;
            preMinute = minute;
            from = minute;
        }
    }

    return freeDurations;
}

// минуты, в которые банк открыт, и грабители свободны (возвращается массив минут)
function findFreeTime(robbers, bank) {
    let robbersReadyWithBank = [];
    for (const interval of bank) {
        for (let i = interval.from; i < interval.to; i++) {
            robbersReadyWithBank.push(compareMinutes(i, robbers));
        }
    }
    robbersReadyWithBank = robbersReadyWithBank.filter((x) => x !== null);

    return robbersReadyWithBank;
}

// возвращает минуту, если она подходит для ограбления (открыт банк, свободны грабители)
function compareMinutes(minute, robbers) {
    for (const interval of robbers) {
        if (minute >= interval.from && minute < interval.to) {
            return null;
        }
    }

    return minute;
}

// распределяем время работы банка по дням недели (воображаемая временная прямая)
// !!!!!!!ИЗМЕНИЛ 3 на CONST
function bankTimeInterval(workingHours) {
    let bankTime = bankTimeToUtc(workingHours);
    let timeIntervals = [];
    for (let day = 0; day < DAYS_FOR_ROBBERY; day++) {
        let timeFrom = (bankTime[0].from + MIN_DAY * day);
        let timeTo = (bankTime[0].to + MIN_DAY * day);
        timeIntervals.push({ from: timeFrom, to: timeTo });
    }

    return timeIntervals;
}

// массив интервалов времени, в которые заняты грабители
function robbersTimeInterval(schedule, workingHours) {
    let robberInterval = [];
    let robberTime = robbersTime(schedule, workingHours);
    for (const el in robberTime) {
        if (el) {
            let timeFrom = (robberTime[el].from + MIN_DAY * DAYS.indexOf(robberTime[el].dayFrom));
            let timeTo = (robberTime[el].to + MIN_DAY * DAYS.indexOf(robberTime[el].dayTo));
            robberInterval.push({ from: timeFrom, to: timeTo, robber: robberTime[el].name });
        }
    }

    return robberInterval;
}

function bankTimeToUtc(workingHours) {
    const regExp = /(\d+):(\d+)/;
    const offset = Number(workingHours.from.split('+')[1]);
    const bankTime = [];
    let timeFrom = workingHours.from.match(regExp).map(Number);
    let timeTo = workingHours.to.match(regExp).map(Number);
    let bankFrom = Date.UTC(1970, 0, 1, timeFrom[1], timeFrom[2]) +
        (checkDeltaTimeZone(offset, workingHours) * 1000 * 60 * 60);
    let bankTo = Date.UTC(1970, 0, 1, timeTo[1], timeTo[2]) +
        (checkDeltaTimeZone(offset, workingHours) * 1000 * 60 * 60);
    bankTime.push({
        from: (bankFrom / 60 / 1000),
        to: (bankTo / 60 / 1000)
    });

    return bankTime;
}

function robbersTime(schedule, workingHours) {
    let robberTime = [];
    for (const key in schedule) {
        if (key) {
            robberTime = robberTime.concat(robbersTimeToUtc(schedule[key], key, workingHours));
        }
    }

    return robberTime;
}

function robbersTimeToUtc(robberTime, name, workingHours) {
    let robber = [];
    const regExp = /([А-Яа-я]+)\s(\d+):(\d+)/;
    for (const key in robberTime) {
        if (key) {
            let timeFrom = robberTime[key].from.match(regExp);
            let timeTo = robberTime[key].to.match(regExp);
            let offset = getOffset(robberTime[key].from, robberTime[key].to);
            let utcTimeFrom = Date.UTC(1970, 0, 1, Number(timeFrom[2]), Number(timeFrom[3]));
            let utcTimeTo = Date.UTC(1970, 0, 1, Number(timeTo[2]), Number(timeTo[3]));
            let robberFrom = utcTimeFrom +
                (checkDeltaTimeZone(offset.from, workingHours) * 1000 * 60 * 60);
            let robberTo = utcTimeTo +
                (checkDeltaTimeZone(offset.to, workingHours) * 1000 * 60 * 60);
            robberFrom = checkRobberFrom(robberFrom);
            robberTo = checkRobberTo(robberTo);
            robber.push({
                dayFrom: timeFrom[1],
                from: (robberFrom),
                dayTo: timeTo[1],
                to: (robberTo),
                name: name
            });
        }
    }

    return robber;
}

// возвращает разницу между часовым поясом банка и входящим
function checkDeltaTimeZone(timeZone, workingHours) {
    let gmt = workingHours.from.split('+')[1];
    let delta = Number(gmt) - Number(timeZone);

    return delta;
}

// привожу часы и минуты 0-9 в нормальный формат
function toPrettyTime(time) {
    if (time >= 0 && time < 10) {
        return '0' + String(time);
    }

    return time;
}

// если время уходит за минимально возможное, тогда оно приравнивается к минимуму
// !!!!!!!ДОБАВИЛ CONST вместо 0
function checkRobberFrom(robberFrom) {
    robberFrom = robberFrom / 1000 / 60;
    if (robberFrom < FIRST_MIN) {
        robberFrom = FIRST_MIN;
    }

    return robberFrom;
}

// если время уходит за максимально возможное, тогда оно приравнивается к максимуму
// !!!!!!!ДОБАВИЛ CONST вместо 4320
function checkRobberTo(robberTo) {
    robberTo = robberTo / 1000 / 60;
    if (robberTo > LAST_MIN) {
        robberTo = LAST_MIN;
    }

    return robberTo;
}

// если часовой пояс дробный, то привожу его в нормальный вид
function getOffset(timeFrom, timeTo) {
    const offsetFrom = Number(timeFrom.split('+')[1]);
    const offsetTo = Number(timeTo.split('+')[1]);

    return { from: offsetFrom, to: offsetTo };
}
