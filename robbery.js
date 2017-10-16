'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const RUSSIAN_WEEK = {
    ВТ: { next: 'СР' },
    ПН: { next: 'ВТ' },
    СР: { next: 'ЧТ' },
    ЧТ: { next: 'ПТ' },
    ПТ: { next: 'СБ' },
    СБ: { next: 'ВС' },
    ВС: { next: 'ПН' }
};

const ROBBERY_DAYS = ['ПН', 'ВТ', 'СР'];


/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    let normalizedSchedule = normalizeSchedule(schedule, workingHours);
    let robberyDaysSchedule = fillActionDays(normalizedSchedule, ROBBERY_DAYS);
    let availableTime = {};
    ROBBERY_DAYS.forEach(day => {
        availableTime[day] = [...findRobberyTime(robberyDaysSchedule[day], duration, workingHours)];
    });
    let startTimesGenerator = startTimeGenerator(getStartTimes(availableTime, ROBBERY_DAYS));
    let startTime = startTimesGenerator.next().value;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return startTime && true;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!startTime) {
                return '';
            }
            let startHour = startTime.startHours;
            let startMinute = startTime.startMinutes;
            let startDay = startTime.day;
            if (startHour <= 1) {
                startHour = '0' + startHour;
            }
            if (startMinute <= 1) {
                startMinute = '0' + startMinute;
            }

            return template.replace('%HH', startHour)
                .replace('%MM', startMinute)
                .replace('%DD', startDay);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            let next = startTimesGenerator.next();
            if (!next.done) {
                startTime = next.value;
            }

            return !next.done;
        }
    };
}
;

function* startTimeGenerator(startTimes) {
    for (let i = 0; i < startTimes.length; i++) {
        yield startTimes[i];
    }
}


function getStartTimes(availableTime, robberyDays) {
    let startTimes = [];
    robberyDays.forEach(day => {
        if (availableTime.hasOwnProperty(day)) {
            availableTime[day].forEach(time => {
                startTimes.push({
                    day: day,
                    startHours: String(time.from.getHours()),
                    startMinutes: String(time.from.getMinutes())
                });
            });
        }
    });

    return startTimes;
}

function findRobberyTime(scheduleOfDay, duration, workingHours) {
    let availableTime = [];
    availableTime.push({
        from: new Date(0, 0, 0, getHours(workingHours.from),
            getMinutes(workingHours.from)),
        to: new Date(0, 0, 0, getHours(workingHours.to), getMinutes(workingHours.to))
    });

    scheduleOfDay.map(segment => {
        return {
            from: new Date(0, 0, 0, getHours(segment.from), getMinutes(segment.from)),
            to: new Date(0, 0, 0, getHours(segment.to), getMinutes(segment.to))
        };
    }).forEach(busyTime => {
        availableTime = availableTime.reduce((acc, time) => {
            return [...acc, ...mergeAvailableAndBusyTime(time, busyTime)];
        }, []);
    });

    return availableTime.filter(time => {
        return new Date(time.from.getTime() + duration * 60000).getTime() <=
            time.to.getTime();
    }).reduce((acc, time) => {
        return [...acc, ...findLater(time, duration)];
    }, []);
}

function findLater(time, duration) {
    let laterTime = new Date(time.from.getTime() + 30 * 60000);
    let laterTimes = [];
    laterTimes.push(time);
    while (new Date(laterTime.getTime() + duration * 60000).getTime() <= time.to.getTime()) {
        laterTimes.push({
            from: laterTime,
            to: time.to
        });
        laterTime = new Date(laterTime.getTime() + 30 * 60000);
    }

    return laterTimes;
}

function mergeAvailableAndBusyTime(availableTime, busyTime) {
    let separatedAvailableTime = [];
    if (Math.min(availableTime.to.getTime(), busyTime.to.getTime()) -
        Math.max(availableTime.from.getTime(), busyTime.from.getTime()) < 0) {
        separatedAvailableTime.push(availableTime);

        return separatedAvailableTime;
    }
    if (availableTime.from.getTime() >= busyTime.from.getTime()) {
        if (availableTime.to.getTime() > busyTime.to.getTime()) {
            availableTime.from = busyTime.to;
            separatedAvailableTime.push(availableTime);

        }
    } else if (availableTime.to.getTime() <= busyTime.to.getTime()) {
        availableTime.to = busyTime.from;
        separatedAvailableTime.push(availableTime);
    } else {
        separatedAvailableTime.push({
            from: availableTime.from,
            to: busyTime.from
        });
        separatedAvailableTime.push({
            from: busyTime.to,
            to: availableTime.to
        });
    }

    return separatedAvailableTime;
}


function fillActionDays(schedule, actionDays) {
    let filledDays = {};
    actionDays.forEach(day => {
        filledDays[day] = [];
    });
    Object.keys(schedule).forEach(name => {
        if (schedule.hasOwnProperty(name)) {
            schedule[name].forEach(segment => {
                let day = getDay(segment.to);
                if (filledDays.hasOwnProperty(day)) {
                    filledDays[day].push(segment);
                }
            });
        }
    });

    return filledDays;
}

function normalizeSchedule(schedule, workingHours) {
    let newSchedule = schedule;
    Object.keys(schedule).forEach(name => {
        if (newSchedule.hasOwnProperty(name)) {
            newSchedule[name] = equalizeShifts(newSchedule[name], getShift(workingHours));
            newSchedule[name] = newSchedule[name].reduce(separateSegments, []);
        }
    });

    return newSchedule;
}

function equalizeShifts(scheduleBlock, mainShift) {
    return scheduleBlock.map(segment => {
        let time = new Date();
        let difference = Number(getShift(segment)) - Number(mainShift);

        time.setHours(Number(getHours(segment.from)) - difference);
        let newFrom = segment.from.replace(/\d\d:/,
            time.getHours() + ':').replace(/\+\d$/, '');
        if (Number(time.getHours()) - Number(getHours(segment.from)) < 0 && difference < 0) {
            newFrom = newFrom.replace(/[А-Я]{2}/, RUSSIAN_WEEK[getDay(segment.from)].next);
        }

        time.setHours(Number(getHours(segment.to)) - difference);
        let newTo = segment.to.replace(/\d\d:/,
            time.getHours() + ':').replace(/\+\d$/, '');
        if (Number(time.getHours()) - Number(getHours(segment.to)) < 0 && difference < 0) {
            newTo = newTo.replace(/[А-Я]{2}/, RUSSIAN_WEEK[getDay(segment.to)].next);
        }

        return {
            from: newFrom,
            to: newTo
        };
    });

}


/**
 * Разделяет строки из расписания типа:
 * "from 'A XX:XX' to 'B YY:YY'" (одна строка "соединяет" два разных дня)
 * на две новые строки "from 'A XX:XX' to 'A 23:59'" и "from B 00:00 to B YY:YY"
 * и возвращает их
 * @param {Object} segment отрезок времени из расписания участника
 * @returns {Object}
 */
function separateSegment(segment) {
    let separatedSegments = [];
    let tempSegment = segment;
    separatedSegments.push({
        from: tempSegment.from.replace(/\+\d/, ''),
        to: getDay(tempSegment.from) + ' 23:59'
    });
    while (getDay(tempSegment.from) !== getDay(segment.to)) {
        let nextDay = RUSSIAN_WEEK[getDay(tempSegment.from)].next;
        if (nextDay === getDay(segment.to)) {
            tempSegment = {
                from: nextDay + ' 00:00',
                to: segment.to.replace(/\+\d/, '')
            };
        } else {
            tempSegment = {
                from: nextDay + ' 00:00',
                to: nextDay + ' 23:59'
            };
        }
        separatedSegments.push(tempSegment);
    }

    return separatedSegments;
}

function separateSegments(acc, segment) {
    if (getDay(segment.from) !== getDay(segment.to)) {
        return [...acc, ...separateSegment(segment)];
    }

    return [...acc, segment];
}


/**
 * Возвращает день недели в виде ХХ
 * @param {String} time вида " YY:XX+5"
 * @returns {String}
 */

function getDay(time) {
    return time.substr(0, 2);
}

function getTime(time) {
    return /\d\d:\d\d/.exec(time)[0];
}

function getHours(time) {
    return getTime(time).substr(0, 2);
}

function getMinutes(time) {
    return getTime(time).substr(3, 2);
}


function getShift(time) {
    return /\d$/.exec(time.to)[0];
}
