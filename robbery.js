'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const GANG_TIME_PATTERN = /([А-Я]{2}) (\d\d?):(\d\d?)\+(\d+)/;
const BANK_TIME_PATTERN = /(\d\d):(\d\d)\+(\d+)/;
const DAYS_INDICES = { 'ВС': 0, 'ПН': 1, 'ВТ': 2, 'СР': 3, 'ЧТ': 4, 'ПТ': 5, 'СБ': 6 };
let GANG_SCHEDULE = [];


function transformBankTime(bankTime) {
    const [fromMatch, hoursFrom, minutesFrom] = BANK_TIME_PATTERN.exec(bankTime.from);
    const [toMatch, hoursTo, minutesTo] = BANK_TIME_PATTERN.exec(bankTime.to);
    if (!fromMatch || !toMatch) {
        throw new TypeError('Working hours in wrong format');
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

function getHoursInBankZone(currentHours, currentZone, bankZone) {
    currentHours = Number(currentHours);
    currentZone = Number(currentZone);
    bankZone = Number(bankZone);
    if (isNaN(currentHours)) {
        throw new TypeError('Hours format is not a number');
    }

    return currentHours + bankZone - currentZone;
}

function getProcessedTime(timeString, bankTimeShift) {
    const [match, day, ...values] = GANG_TIME_PATTERN.exec(timeString);
    if (!match) {
        return;
    }
    const [hours, minutes, zone] = values.map(Number);
    let dayIndex = DAYS_INDICES[day];
    let bankZoneHours = getHoursInBankZone(hours, zone, bankTimeShift);
    if (bankZoneHours >= 24) {
        bankZoneHours %= 24;
        dayIndex++;
    } else if (bankZoneHours < 0) {
        bankZoneHours += 24;
        dayIndex--;
    }

    return { day: dayIndex, hours: bankZoneHours, minutes };
}

function pushToSchedule(index, item) {
    if (!GANG_SCHEDULE[index]) {
        GANG_SCHEDULE[index] = [];
    }
    GANG_SCHEDULE[index].push(item);
}

function processActivity(activity, bankTimeShift) {
    const from = getProcessedTime(activity.from, bankTimeShift);
    const to = getProcessedTime(activity.to, bankTimeShift);
    if (from.day !== to.day) {
        if (from.day >= 1 && from.day < GANG_SCHEDULE.length - 1) {
            let firstDay = getPeriodTillDayEnd(from);
            pushToSchedule(from.day, firstDay);
        }
        const secondDay = getPeriodFromDayStart(to);
        let startDay = from.day + 1;
        while (startDay !== to.day) {
            pushToSchedule(startDay, getFullDayEvent(startDay));
            startDay++;
        }
        if (to.day >= 1 && to.day < 4) {
            pushToSchedule(to.day, secondDay);
        }
    } else {
        pushToSchedule(from.day, { from, to });
    }
}

function transformSchedule(schedule, bankHours) {
    const bankTimeShift = BANK_TIME_PATTERN.exec(bankHours.from)[3];
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

    return first.hours < second.hours;
}

function areEventsEqual(first, second) {
    return isEarlier(first, second) && isEarlier(second, first);
}

function getMinTime(first, second) {
    if (isEarlier(first, second)) {
        return first;
    }

    return second;
}

function getMaxTime(first, second) {
    if (isEarlier(first, second)) {
        return second;
    }

    return first;
}

function getUnitedEvents(activities) {
    let counter = 0;
    while (counter < activities.length - 1) {
        let current = activities[counter];
        let next = activities[counter + 1];
        if (!isEarlier(current.to, next.from)) {
            current.from = getMinTime(current.from, next.from);
            current.to = getMaxTime(current.to, next.to);
            activities.splice(counter + 1, 1);
            continue;
        }
        counter++;
    }

    return activities;
}

function getFullDayEvent(day) {
    return {
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
    };
}

function getPeriodFromDayStart(timeObject) {
    return {
        from: { day: timeObject.day, hours: 0, minutes: 0 },
        to: timeObject
    };
}

function getPeriodTillDayEnd(timeObject) {
    return {
        from: timeObject,
        to: { day: timeObject.day, hours: 23, minutes: 59 }
    };
}

function getFreeTime(activities, day) {
    let result = [];
    if (activities.length === 0) {
        return [getFullDayEvent(day)];
    }

    result.push(getPeriodFromDayStart(activities[0].from));

    for (let i = 0; i < activities.length - 1; i++) {
        result.push({ from: activities[i].to, to: activities[i + 1].from });
    }

    result.push(getPeriodTillDayEnd(activities[activities.length - 1].to));
    result = result.filter(time => !areEventsEqual(time.from, time.to));

    return result;
}

function getIntersectedEvents(activities, time) {
    return activities.map(activity => {
        return {
            from: getMaxTime(activity.from, time.from),
            to: getMinTime(activity.to, time.to),
            day: activity.from.day
        };
    });
}

function getEventLength(event) {
    if (!event) {
        return 0;
    }

    return (event.to.hours - event.from.hours) * 60 + (event.to.minutes - event.from.minutes);
}

function getLaterEvent(event, hours, minutes) {
    event.from.hours += hours;
    event.from.minutes += minutes;
    if (event.from.minutes >= 60) {
        event.from.hours++;
        event.from.minutes %= 60;
    }

    return event;
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
    GANG_SCHEDULE = [];
    transformSchedule(schedule, workingHours);
    const freeTime = GANG_SCHEDULE
        .filter(events => events[0].from.day > 0 && events[0].from.day < 4)
        .map(day => day.sort(sortEventsByEnd))
        .map(getUnitedEvents)
        .map(getFreeTime);
    const transformedWorkingHours = transformBankTime(workingHours);
    const freeTimeWhileBankWorks = freeTime
        .map(day => getIntersectedEvents(day, transformedWorkingHours));
    const freeTimesLongEnough = freeTimeWhileBankWorks
        .map(day => day.filter(event => getEventLength(event) >= duration));
    const robberyTimes = [].concat(...freeTimesLongEnough);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return Boolean(robberyTimes.length) || Boolean(this._currentTime);
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
            if (!this.exists()) {
                return '';
            }
            const time = this._currentTime;
            const hours = time.from.hours.toLocaleString('ru-RU', { minimumIntegerDigits: 2 });
            const minutes = time.from.minutes.toLocaleString('ru-RU', { minimumIntegerDigits: 2 });
            const day = Object.keys(DAYS_INDICES)
                .filter(dayString => DAYS_INDICES[dayString] === time.day)[0];

            return template.replace('%HH', hours)
                .replace('%MM', minutes)
                .replace('%DD', day);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (getEventLength(this._currentTime) >= duration + 30) {
                this._currentTime = getLaterEvent(this._currentTime, 0, 30);

                return true;
            }
            robberyTimes.splice(0, 1);
            const nextTime = robberyTimes[0];
            if (!nextTime) {
                return false;
            }
            this._currentTime = nextTime;

            return true;
        }
    };
};
