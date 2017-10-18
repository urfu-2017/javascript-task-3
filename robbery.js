'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const GANG_TIME_PATTERN = /([А-Я]{2}) (\d\d?):(\d\d?)\+(\d+)/;
const DAYS_INDICES = { 'ВС': 0, 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
let GANG_SCHEDULE = [[], [], [], [], []];


function transformBankTime(bankTime, pattern) {
    let [fromMatch, hoursFrom, minutesFrom] = pattern.exec(bankTime.from);
    let [toMatch, hoursTo, minutesTo] = pattern.exec(bankTime.to);
    if (!fromMatch || !toMatch) {
        throw new TypeError('Working 5hours in wrong format');
    }

    return {
        from: {
            hours: Number(hoursFrom),
            minutes: Number(minutesFrom)
        },
        to: {
            hours: Number(hoursTo),
            minutes: Number(minutesTo)
        }
    };
}

function correctTimeZone(currentHours, currentZone, bankZone) {
    let result = Number(currentHours);
    currentZone = Number(currentZone);
    bankZone = Number(bankZone);
    if (isNaN(result)) {
        throw new TypeError('Hours format is not a number');
    }
    result += (bankZone - currentZone);

    return result;
}

function extractTime(string, bankTimeShift) {
    let [match, day, ...values] = GANG_TIME_PATTERN.exec(string);
    if (!match) {
        return;
    }
    let [hours, minutes, zone] = values.map(Number);
    let index = DAYS_INDICES[day];
    let correctedHours = correctTimeZone(hours, zone, bankTimeShift);
    if (correctedHours >= 24) {
        correctedHours %= 24;
        index++;
    } else if (correctedHours < 0) {
        correctedHours += 24;
        index--;
    }

    return { day: index, hours: correctedHours, minutes };
}

function processActivity(activity, bankTimeShift) {
    let from = extractTime(activity.from, bankTimeShift);
    let to = extractTime(activity.to, bankTimeShift);
    if (from.day !== to.day) {
        if (from.day >= 1 && from.day < GANG_SCHEDULE.length - 1) {
            let firstDay = { from, to: { day: from.day, hours: 23, minutes: 59 } };
            GANG_SCHEDULE[from.day].push(firstDay);
        }

        let secondDay = { from: { day: to.day, hours: 0, minutes: 0 }, to };
        let startDay = from.day + 1;
        while (startDay !== to.day) {
            GANG_SCHEDULE[startDay].push({
                from: { day: startDay, hours: 0, minutes: 0 },
                to: { day: startDay, hours: 23, minutes: 59 }
            });
            startDay++;
        }
        if (to.day >= 1 && to.day < GANG_SCHEDULE.length - 1) {
            GANG_SCHEDULE[to.day].push(secondDay);
        }
    } else {
        GANG_SCHEDULE[from.day].push({ from, to });
    }
}

function transformSchedule(schedule, bankHours) {
    const bankTimePattern = /(\d\d:\d\d)\+(\d+)/;
    const bankTimeShift = bankTimePattern.exec(bankHours.from)[2];
    for (let name of Object.keys(schedule)) {
        for (let activity of schedule[name]) {
            processActivity(activity, bankTimeShift);
        }
    }
}

function sortEventsByEnd(first, second) {
    if (first.to.hours === second.to.hours) {
        return first.to.minutes - second.to.minutes;
    }

    return first.to.hours - second.to.hours;
}

function isEarlier(first, second) {
    if (first.hours === second.hours) {
        return first.minutes <= second.minutes;
    }

    return first.hours <= second.hours;
}

function eventsAreEqual(first, second) {
    return isEarlier(first, second) && isEarlier(second, first);
}

function getMin(first, second) {
    if (isEarlier(first, second)) {
        return first;
    }

    return second;
}

function getMax(first, second) {
    if (isEarlier(first, second)) {
        return second;
    }

    return first;
}

function uniteActivities(activities) {
    let counter = 0;
    while (counter < activities.length - 1) {
        let current = activities[counter];
        let next = activities[counter + 1];
        if (!isEarlier(current.to, next.from)) {
            current.from = getMin(current.from, next.from);
            current.to = getMax(current.to, next.to);
            activities.splice(counter + 1, 1);
            continue;
        }
        counter++;
    }

    return activities;
}

function negateActivities(activities, day) {
    let result = [];
    if (activities.length === 0) {
        return [{
            from: {
                day: day,
                hours: 0,
                minutes: 0
            },
            to: {
                day: day,
                hours: 23,
                minutes: 59
            }
        }];
    }

    result.push({
        from: {
            day: activities[0].from.day, hours: 0, minutes: 0
        }, to: activities[0].from
    });
    for (let i = 0; i < activities.length - 1; i++) {
        result.push({ from: activities[i].to, to: activities[i + 1].from });
    }
    result.push({
        from: activities[activities.length - 1].to,
        to: {
            day: activities[activities.length - 1].to.day, hours: 23, minutes: 59
        }
    });
    result = result.filter(time => !eventsAreEqual(time.from, time.to));

    return result;
}

function intersectTimes(activities, time) {
    return activities.map(activity => {
        return {
            from: getMax(activity.from, time.from),
            to: getMin(activity.to, time.to),
            day: activity.from.day
        };
    });
}

function getEventLength(event) {
    if (event === undefined) {
        return 0;
    }

    return (event.to.hours - event.from.hours) * 60 + (event.to.minutes - event.from.minutes);
}

function shiftLater(event, hours, minutes) {
    event.from.hours += hours;
    event.from.minutes += minutes;
    if (event.from.minutes >= 60) {
        event.from.hours++;
        event.from.minutes %= 60;
    }

    return event;
}

// function scheduleToString(schedule) {
//     return (schedule.map(day => day.map(
//         activity => `${activity.from.hours}:${activity.from.minutes}-
// ${activity.to.hours}:${activity.to.minutes}`)));
// }

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    GANG_SCHEDULE = [[], [], [], [], []];
    const bankTimePattern = /(\d\d?):(\d\d?)/;
    transformSchedule(schedule, workingHours);
    let freeTime = GANG_SCHEDULE.slice(1, 4).map(day => day.sort(sortEventsByEnd))
        .map(uniteActivities)
        .map(negateActivities);
    // console.info(scheduleToString(freeTime));
    let transformedWorkingHours = transformBankTime(workingHours, bankTimePattern);
    let robberyTimesByDays = freeTime
        .map(day => intersectTimes(day, transformedWorkingHours)
            .filter(event => getEventLength(event) >= duration));
    let robberyTimes = [].concat(...robberyTimesByDays);

    return {
        robberyTimes: robberyTimes.slice(),

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return robberyTimes.length !== 0 || this._currentTime !== undefined;
        },

        getFirstTime: function () {
            return robberyTimes[0];
        },

        _currentTime: robberyTimes[0],

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let time = this._currentTime;
            if (!this.exists() || time === undefined || time === null) {
                return '';
            }
            let hours = time.from.hours.toLocaleString(undefined, { minimumIntegerDigits: 2 });
            let minutes = time.from.minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 });
            let day = Object.keys(DAYS_INDICES)
                .filter(dayString => DAYS_INDICES[dayString] === time.day)[0];
            template = template.replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', day);

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (getEventLength(this._currentTime) >= duration + 30) {
                this._currentTime = shiftLater(this._currentTime, 0, 30);

                return true;
            }
            robberyTimes.splice(0, 1);
            let nextTime = this.getFirstTime();
            if (nextTime === undefined) {
                return false;
            }
            this._currentTime = nextTime;

            return true;
        }
    };
};
