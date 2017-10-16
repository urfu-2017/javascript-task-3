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
 * @returns {Object}
 */
const MILLIS_IN_MINUTE = 60 * 1000;
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    // console.info(schedule, duration, workingHours);
    let bankOffset = getBankOffset(workingHours.from);
    let timespans = parseShedule(schedule);
    unionTimespans(timespans);
    let infos = getInfos(timespans, workingHours);
    fillFree(infos);
    let durationInMillis = duration * MILLIS_IN_MINUTE;
    let goodTime = searchStart(infos, durationInMillis);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(goodTime);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return formatTime(template, goodTime, bankOffset);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let frees = getFrees(infos);
            if (frees.length === 0) {
                return false;
            }

            let nextPossible = goodTime + 30 * MILLIS_IN_MINUTE;
            if (checkPossible(frees, nextPossible)) {
                goodTime = nextPossible;

                return true;
            }
            let timeInOtherFree = getTimeInOtherFree(frees, nextPossible);
            if (timeInOtherFree) {
                goodTime = timeInOtherFree;

                return true;
            }

            return false;
        }
    };

    function getTimeInOtherFree(frees, time) {
        for (let free of frees) {
            if (free.from < time) {
                continue;
            }
            if (free.from + durationInMillis <= free.to) {
                return free.from;
            }
        }

        return false;
    }

    function checkPossible(frees, nextPossible) {
        let nextIndex = getIndex(frees, nextPossible);
        if (nextIndex === false) {
            return false;
        }
        if (nextPossible + durationInMillis <= frees[nextIndex].to) {
            return nextPossible;
        }

        return false;
    }
};


function getFrees(infos) {
    let frees = [];
    infos.forEach(function (currentDay) {
        frees = frees.concat(currentDay.free);
    });

    return frees;
}

function getIndex(frees, time) {
    let indexFree = 0;
    while (time < frees[indexFree].from || time > frees[indexFree].to) {
        indexFree++;
        if (indexFree >= frees.length) {
            return false;
        }
    }

    return indexFree;
}

function getInfos(timespans, workingHours) {
    let infoOnDay = [];
    for (var day = 0; day < 3; day++) {
        infoOnDay[day] = {};
        let startWork = parseWorkTime(workingHours.from, day);
        let endWork = parseWorkTime(workingHours.to, day);
        infoOnDay[day].crosses = crossesWorkingHours(timespans, startWork, endWork);
        infoOnDay[day].start = startWork;
        infoOnDay[day].end = endWork;
    }

    return infoOnDay;
}

function parseShedule(schedule) {
    let timespans = [];
    for (var man in schedule) {
        if (schedule.hasOwnProperty(man)) {
            let times = schedule[man];
            fillTimespans(times, timespans);
        }
    }

    return timespans;

    function fillTimespans(times, array) {
        for (let time of times) {
            let timespan = {};
            timespan.from = parseTime(time.from);
            timespan.to = parseTime(time.to);
            array.push(timespan);
        }
    }
}

let days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function parseTime(time) {
    let result = /(..) (\d\d):(\d\d)\+(\d+)/.exec(time);
    let day = days.indexOf(result[1]);
    let hours = Number(result[2]);
    let minutes = Number(result[3]);
    let offset = Number(result[4]);

    return Date.UTC(2017, 9, 16 + day, hours - offset, minutes);
}

function parseWorkTime(time, day = 0) {
    let result = /(\d\d):(\d\d)\+(\d+)/.exec(time);
    let hours = Number(result[1]);
    let minutes = Number(result[2]);
    let offset = Number(result[3]);

    return Date.UTC(2017, 9, 16 + day, hours - offset, minutes);
}

function getBankOffset(time) {
    return Number(time.substring(6));
}

function unionTimespans(timespans) {
    timespans.sort((a, b) => a.from - b.from);
    for (let i = 0; i + 1 < timespans.length; i++) {
        if (timespans[i].to >= timespans[i + 1].from) {
            timespans[i + 1].to = Math.max(timespans[i].to, timespans[i + 1].to);
            timespans[i + 1].from = Math.min(timespans[i].from, timespans[i + 1].from);
            delete timespans[i];
        }
    }
    timespans.sort((a, b) => a.from - b.from);
    let firstUndef = timespans.indexOf(undefined);
    if (firstUndef !== -1) {
        timespans.splice(firstUndef);
    }
}

function crossesWorkingHours(timespans, startWork, endWork) {
    return timespans.filter(timespan => {
        return !(timespan.to <= startWork || timespan.from >= endWork);
    }).sort((a, b) => a.from - b.from);
}

let startWeek = Date.UTC(2017, 9, 16);
let startWeekDate = new Date(startWeek);
function formatTime(template, time, offset) {
    if (!time) {
        return '';
    }
    let date = new Date(time);
    let hours = date.getUTCHours() + offset;
    var day = date.getUTCDay() - startWeekDate.getUTCDay();
    if (hours > 23) {
        hours -= 24;
        day++;
    }
    var minutes = date.getUTCMinutes();
    template = template.replace('%MM', (minutes < 10 ? '0' : '') + minutes);
    template = template.replace('%HH', (hours < 10 ? '0' : '') + hours);
    template = template.replace('%DD', days[day]);

    return template;
}

function getFree(currentDay) {
    let frees = [];
    let points = getPoints(currentDay);
    for (let i = 0; i + 1 < points.length; i += 2) {
        frees.push({
            from: points[i],
            to: points[i + 1]
        });
    }

    return frees;
}

function fillFree(infos) {
    for (let [day, currentDay] of infos.entries()) {
        infos[day].free = getFree(currentDay);
    }
}

function getPoints(currentDay) {
    let points = [];
    let crosses = currentDay.crosses;
    if (currentDay.crosses.length === 0) {
        return [currentDay.start, currentDay.end];
    }
    if (crosses[0].from > currentDay.start) {
        points.push(currentDay.start);
        points.push(crosses[0].from);
    }
    for (let i = 0; i + 1 < crosses.length; i++) {
        points.push(crosses[i].to);
        points.push(crosses[i + 1].from);
    }
    if (crosses[crosses.length - 1].to < currentDay.end) {
        points.push(crosses[crosses.length - 1].to);
        points.push(currentDay.end);
    }

    return points;
}

function searchStart(infos, duration) {
    let search = null;
    for (let currentDay of infos) {
        search = getNiceStart(currentDay.free, duration);
        if (search) {
            break;
        }
    }

    return search;
}

function getNiceStart(frees, duration) {
    for (let timespan of frees) {
        if (checkFreeSize(timespan, duration)) {
            return timespan.from;
        }
    }

    return null;
}

/**
 * 
 * @param {Object} timespan 
 * @param {Number} duration in millis
 * @returns {Boolean}
 */
function checkFreeSize(timespan, duration) {
    return timespan.to - timespan.from >= duration;
}
