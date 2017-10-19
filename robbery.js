'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

function parseTime(timeString, containsDay) {
    let daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    let day = 0;
    if (containsDay) {
        let dayName = timeString.match(/(..)/)[1];
        day = daysOfWeek.indexOf(dayName);
    }
    let numbers = timeString.match(/(\d+):(\d+)\+(\d+)$/);
    let hours = Number.parseInt(numbers[1]);
    let minutes = Number.parseInt(numbers[2]);
    let timeZone = Number.parseInt(numbers[3]);

    return (24 * day + hours - timeZone) * 60 + minutes;
}

function convertRobbersSchedule(schedule) {
    let newSchedule = [];
    let keys = ['Danny', 'Rusty', 'Linus'];
    keys.forEach(key => {
        schedule[key].forEach(interval => {
            newSchedule.push({
                from: parseTime(interval.from, true),
                to: parseTime(interval.to, true)
            });
        });
    });

    return newSchedule;
}

function removeEmptyIntervals(schedule) {
    return schedule.filter(interval => interval.from !== interval.to);
}

function checkIntersection(a, b) {
    return ((a.from <= b.to && a.from >= b.from) ||
            (a.to <= b.to && a.to >= b.from) ||
            (a.from < b.from && a.to > b.to));
}

function uniteIntersectedIntervals(a, b) {
    return {
        from: Math.min(a.from, b.from),
        to: Math.max(a.to, b.to)
    };
}

function addInterval(intervals, newInterval) {
    let result = [];
    intervals.forEach(interval => {
        if (checkIntersection(interval, newInterval)) {
            newInterval = uniteIntersectedIntervals(interval, newInterval);
        } else {
            result.push(interval);
        }
    });
    result.push(newInterval);

    return result;
}

function removeScheduleIntersections(schedule) {
    let unitedSchedule = [];
    schedule.forEach(interval => {
        unitedSchedule = addInterval(unitedSchedule, interval);
    });

    return unitedSchedule;
}

function sortSchedule(schedule) {
    return schedule.sort((a, b) => {
        a = a.from;
        b = b.from;
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        }

        return 0;
    });
}

function convertBankSchedule(schedule) {
    let from = parseTime(schedule.from, false);
    let to = parseTime(schedule.to, false);

    return [0, 1, 2].map(day => {
        return {
            from: from + day * 24 * 60,
            to: to + day * 24 * 60
        };
    });
}

function joinOnTimeline(schedule, bankSchedule) {
    let timeline = [];
    schedule.forEach(busyInterval => {
        timeline.push({
            time: busyInterval.from,
            type: 'busyStart'
        });
        timeline.push({
            time: busyInterval.to,
            type: 'busyEnd'
        });
    });
    bankSchedule.forEach(bankInterval => {
        timeline.push({
            time: bankInterval.from,
            type: 'bankStart'
        });
        timeline.push({
            time: bankInterval.to,
            type: 'bankEnd'
        });
    });
    timeline.sort((a, b) => {
        if (a.time < b.time) {
            return -1;
        } else if (a.time > b.time) {
            return 1;
        }
        let sortPriority = ['busyEnd', 'bankStart', 'busyStart', 'bankEnd'];

        return sortPriority.indexOf(a.type) - sortPriority.indexOf(b.type);
    });

    return timeline;
}

function switchState(previous, type) {
    switch (type) {
        case 'bankStart':
            previous.bank = true;
            break;
        case 'bankEnd':
            previous.bank = false;
            break;
        case 'busyStart':
            previous.busy = true;
            break;
        case 'busyEnd':
            previous.busy = false;
            break;
        default:
            break;
    }
}

function findRobberyIntervals(schedule, bankSchedule) {
    let freeTime = [];
    let timeline = joinOnTimeline(schedule, bankSchedule);
    let addFreeTime = (from, to) => freeTime.push(
        {
            from: from, to: to
        }
    );
    timeline.reduce((previous, point) => {
        if (previous === null) {
            previous = {
                start: null,
                busy: false,
                bank: false
            };
        }
        switchState(previous, point.type);
        if (previous.start !== null) {
            addFreeTime(previous.start, point.time);
            previous.start = null;
        }
        if (!previous.busy && previous.bank) {
            previous.start = point.time;
        }

        return previous;
    }, null);

    return freeTime;
}

function findStartTimes(robberyIntervals, duration) {
    let startTimes = [];
    // let lastRobberyTime = 0;
    // if (robberyIntervals.length > 0) {
    //     lastRobberyTime = robberyIntervals[0].from - 30;
    // }
    robberyIntervals.forEach(interval => {
        // for (let time = Math.max(interval.from, lastRobberyTime + 30);
        for (let time = interval.from;
            time + duration <= interval.to;
            time += 30) {
            // lastRobberyTime = time;
            startTimes.push(time);
        }
    });

    return startTimes;
}

function extractBankTimeZone(time) {
    return Number.parseInt(time.match(/\+(\d+)$/)[1]);
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
    schedule = convertRobbersSchedule(schedule);
    schedule = removeEmptyIntervals(schedule);
    schedule = removeScheduleIntersections(schedule);
    schedule = sortSchedule(schedule);
    let bankSchedule = convertBankSchedule(workingHours);
    let robberyIntervals = findRobberyIntervals(schedule, bankSchedule);
    let startTimes = findStartTimes(robberyIntervals, duration);
    let bankTimeZone = extractBankTimeZone(workingHours.from);

    return {
        startTimes: startTimes,
        currentPos: 0,
        bankTimeZone: bankTimeZone,

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return this.startTimes.length > 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.startTimes.length === 0) {
                return '';
            }
            let daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
            let time = this.startTimes[this.currentPos] + this.bankTimeZone * 60;
            let day = daysOfWeek[Math.floor(time / (24 * 60))];
            time = time % (24 * 60);
            let formatNumber = number => {
                let text = number.toString();
                if (text.length === 1) {
                    text = '0'.concat(text);
                }

                return text;
            };
            let hours = formatNumber(Math.floor(time / 60));
            let minutes = formatNumber(time % 60);

            return template
                .replace(/%DD/g, day)
                .replace(/%HH/g, hours)
                .replace(/%MM/g, minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (this.currentPos === this.startTimes.length - 1 || this.startTimes.length === 0) {
                return false;
            }
            this.currentPos++;

            return true;
        }
    };
};
