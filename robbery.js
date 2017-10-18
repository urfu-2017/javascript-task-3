'use strict';

exports.isStar = false;

const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

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

    let bankOpen = bankTimeInterval(workingHours);
    let robbersBusy = robbersTimeInterval(schedule);
    let freeTimeWithBank = findFreeTime(robbersBusy, bankOpen);
    let freeDurations = checkDuration(freeTimeWithBank);
    let goal = compareDurations(duration, freeDurations);
    let timeZone = getTimeZone(workingHours);


    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (goal) {
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
            let goodTime = timeFormat(goal, timeZone);

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

// function checkTime(firstTime) {
//     if (firstTime < 0) {
//         firstTime = 0;
//     }
//     if (firstTime > 4320) {
//         firstTime = 4320;
//     }

//     return firstTime;
// }

function timeFormat(firstTime) {
    let goodTime = new Date(firstTime * 60 * 1000).getTime() / 1000 / 60;
    let day = '';
    if (goodTime >= 0 && goodTime < 1440) {
        day = 'ПН';
    }
    if (goodTime >= 1440 && goodTime < 2880) {
        day = 'ВТ';
        goodTime -= 1440;
    }
    if (goodTime >= 2880 && goodTime < 4320) {
        day = 'СР';
        goodTime -= 2880;
    }
    let hours = parseInt(goodTime / 60);
    let minutes = Math.round(goodTime % 60);

    return { day: day, hours: hours, minutes: minutes };
}

function getTimeZone(workingHours) {
    const regExp = /[+-](\d{1})$/;
    let timeZone = workingHours.from.match(regExp);

    return Number(timeZone[1]);
}

function compareDurations(duration, freeDurations) {
    for (const el of freeDurations) {
        if (duration <= el.duration) {
            return el.from;
        }
    }
}

function checkDuration(readyTime) {
    let freeDurations = [];
    let from = readyTime[0];
    let counter = 0;
    let preMinute = readyTime[0] - 1;
    for (const minute of readyTime) {
        if (minute === preMinute + 1) {
            counter += 1;
            preMinute = minute;
        } else {
            freeDurations.push({ duration: counter, from: Math.round(from) });
            counter = 1;
            preMinute = minute;
            from = minute;
        }
    }
    console.info(freeDurations);

    return freeDurations;
}

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

function compareMinutes(minute, robbers) {
    for (const interval of robbers) {
        if (minute >= interval.from && minute < interval.to) {
            return null;
        }
    }

    return minute;
}

function bankTimeInterval(workingHours) {
    let bankTime = bankTimeToUtc(workingHours);
    let timeIntervals = [];
    for (let day = 0; day < 3; day++) {
        let timeFrom = (bankTime[0].from + 1440 * day);
        let timeTo = (bankTime[0].to + 1440 * day);
        timeIntervals.push({ from: timeFrom, to: timeTo });
    }

    return timeIntervals;
}

function robbersTimeInterval(schedule) {
    let robberInterval = [];
    let robberTime = robbersTime(schedule);
    for (const el in robberTime) {
        if (el) {
            let timeFrom = (robberTime[el].from + 1440 * DAYS.indexOf(robberTime[el].dayFrom));
            let timeTo = (robberTime[el].to + 1440 * DAYS.indexOf(robberTime[el].dayTo));
            robberInterval.push({ from: timeFrom, to: timeTo, robber: robberTime[el].name });
        }
    }

    return robberInterval;
}

function bankTimeToUtc(workingHours) {
    const regExp = /(\d{2}):(\d{2})[+-](\d{1})/;
    const bankTime = [];
    let timeFrom = workingHours.from.match(regExp).map(Number);
    let timeTo = workingHours.to.match(regExp).map(Number);
    let bankFrom = Date.UTC(1970, 0, 1, timeFrom[1], timeFrom[2]) +
        (checkDeltaTimeZone(timeFrom[3]) * 1000 * 60 * 60);
    let bankTo = Date.UTC(1970, 0, 1, timeTo[1], timeTo[2]) +
        (checkDeltaTimeZone(timeFrom[3]) * 1000 * 60 * 60);
    // if (bankFrom < 0) {
    //     bankFrom = 0;
    // }
    // if (bankTo > 4320) {
    //     bankTo = 4320;
    // }
    bankTime.push({
        from: (bankFrom / 60 / 1000),
        to: (bankTo / 60 / 1000)
    });

    return bankTime;
}

function robbersTime(schedule) {
    let robberTime = [];
    for (const key in schedule) {
        if (key) {
            robberTime = robberTime.concat(robbersTimeToUtc(schedule[key], key));
        }
    }

    return robberTime;
}

function robbersTimeToUtc(robberTime, name) {
    let robber = [];
    const regExp = /([А-Яа-я]{2})\s(\d{2}):(\d{2})[+-](\d{1})/;
    for (const key in robberTime) {
        if (key) {
            let timeFrom = robberTime[key].from.match(regExp);
            let timeTo = robberTime[key].to.match(regExp);
            let utcTimeFrom = Date.UTC(1970, 0, 1, Number(timeFrom[2]), Number(timeFrom[3]));
            let utcTimeTo = Date.UTC(1970, 0, 1, Number(timeTo[2]), Number(timeTo[3]));
            let robberFrom = utcTimeFrom + (checkDeltaTimeZone(timeFrom[4]) * 1000 * 60 * 60);
            let robberTo = utcTimeTo + (checkDeltaTimeZone(timeFrom[4]) * 1000 * 60 * 60);
            // if (robberFrom < 0) {
            //     robberFrom = 0;
            // }
            // if (robberTo > 4320) {
            //     robberTo = 4320;
            // } 
            robber.push({
                dayFrom: timeFrom[1],
                from: (robberFrom / 60 / 1000),
                dayTo: timeTo[1],
                to: (robberTo / 60 / 1000),
                name: name
            });
        }
    }

    return robber;
}

function checkDeltaTimeZone(timeZone) {
    let delta = 5 - timeZone;

    return delta;
}

function toPrettyTime(time) {
    if (time >= 0 && time < 10) {
        return '0' + String(time);
    }

    return time;
}
