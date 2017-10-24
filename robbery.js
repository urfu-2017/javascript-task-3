'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

let BANK_TIME_ZONE;
const WEEK_DAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
let DURATION;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    BANK_TIME_ZONE = getTimezone(workingHours.from);
    DURATION = duration;
    const bandBusyTime = { 'ВС': [], 'ПН': [], 'ВТ': [], 'СР': [], 'ЧТ': [], 'ПТ': [], 'СБ': [] };
    for (const busyTimeList of Object.values(schedule)) {
        for (const currentBusyTime of busyTimeList) {
            createGeneralSchedule(bandBusyTime, currentBusyTime);
        }
    }
    deleteUnsuitableDays(bandBusyTime);
    const timesForRob = { 'ПН': [], 'ВТ': [], 'СР': [] };
    for (const day of Object.keys(bandBusyTime)) {
        const scheduleInWorkHours = cutSchedule(bandBusyTime[day], workingHours);
        const sortedSchedule = scheduleInWorkHours.sort(sortSchedule);
        const unitedSchedule = uniteTimeSegments(sortedSchedule);
        timesForRob[day] = findSuitableTime(unitedSchedule, duration, workingHours);
    }

    return {
        currentRobStart: undefined,

        getNewTime: function () {
            for (const day of Object.keys(timesForRob)) {
                if (timesForRob[day].length !== 0) {
                    this.currentRobStart = { robDay: day, time: timesForRob[day][0].start };

                    return true;
                }
            }

            return false;
        },

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            for (const day of Object.keys(timesForRob)) {
                if (timesForRob[day].length > 0) {

                    return true;
                }
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
            if (!this.exists() && this.currentRobStart === undefined) {
                return '';
            }
            if (this.currentRobStart === undefined) {
                this.getNewTime(timesForRob);
            }
            const [robHour, robMinutes] = this.currentRobStart.time.split(':');
            const result = template
                .replace(/%DD/, this.currentRobStart.robDay)
                .replace(/%HH/, robHour)
                .replace(/%MM/, robMinutes);

            return result;
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

function getTimezone(time) {
    return parseInt(time.split('+')[1], 10);
}

function createGeneralSchedule(bandBusyTime, currentBusyTime) {
    const from = transformTime(currentBusyTime.from);
    const to = transformTime(currentBusyTime.to);
    let busyDays = {};
    busyDays[from.day] = { from: from.time, to: to.time };
    if (from.day !== to.day) {
        busyDays = divideIntoDays(from, to);
    }
    addToGeneralSchedule(busyDays, bandBusyTime);
}

function transformTime(dayAndTime) {
    let [day, hours, minutes, currentTimezone] = dayAndTime.split(/[ :+]/);
    const diff = BANK_TIME_ZONE - currentTimezone;
    let dayShift = 0;
    hours = parseInt(hours, 10) + diff;
    if (hours < 0) {
        hours += 24;
        dayShift = -1;
    }
    if (hours >= 24) {
        hours %= 24;
        dayShift = +1;
    }
    day = getWeekDay(day, dayShift);
    hours = hours.toLocaleString('en-US', { minimumIntegerDigits: 2 });

    return { day, time: `${hours}:${minutes}` };
}

function getWeekDay(currentDay, shift) {
    const currentIndex = WEEK_DAYS.indexOf(currentDay);

    return WEEK_DAYS[currentIndex + shift];
}

function divideIntoDays(from, to) {
    const segmentByDays = {};
    const startDay = WEEK_DAYS.indexOf(from.day);
    const endDay = WEEK_DAYS.indexOf(to.day);
    segmentByDays[from.day] = { from: from.time, to: '23:59' };
    segmentByDays[to.day] = { from: '00:00', to: to.time };
    for (let i = startDay + 1; i < endDay; i++) {
        segmentByDays[WEEK_DAYS[i]] = { from: '00:00', to: '23:59' };
    }

    return segmentByDays;
}

function addToGeneralSchedule(busyDays, bandBusyTime) {
    for (const day of Object.keys(busyDays)) {
        bandBusyTime[day].push(busyDays[day]);
    }
}

function deleteUnsuitableDays(bandBusyTime) {
    delete bandBusyTime['ВС'];
    delete bandBusyTime['ЧТ'];
    delete bandBusyTime['ПТ'];
    delete bandBusyTime['СБ'];
}

function cutSchedule(schedule, workingHours) {
    const startHour = workingHours.from.split('+')[0];
    const endHour = workingHours.to.split('+')[0];
    if (startHour === endHour) {
        return [];
    }
    const newSchedule = addSegmentsInWorkHours(schedule, startHour, endHour);

    return newSchedule;
}

function addSegmentsInWorkHours(schedule, startHour, endHour) {
    return schedule.reduce((result, currentSegment) => {
        let newElement;
        if (currentSegment.to < startHour || currentSegment.from > endHour) {
            return result;
        } else if (currentSegment.from < startHour && currentSegment.to > startHour) {
            newElement = { from: startHour, to: currentSegment.to };
        } else if ((currentSegment.from < endHour && currentSegment.to > endHour)) {
            newElement = { from: currentSegment.from, to: endHour };
        } else {
            newElement = currentSegment;
        }
        result.push(newElement);

        return result;
    }, []);
}

function sortSchedule(a, b) {
    if (a.from > b.from) {
        return 1;
    }
    if (a.from < b.from) {
        return -1;
    }

    return 0;
}

function uniteTimeSegments(schedule) {
    let counter = 0;
    while (counter < schedule.length - 1) {
        if (schedule[counter].to >= schedule[counter + 1].from) {
            schedule[counter] = {
                from: minTime(schedule[counter].from, schedule[counter + 1].from),
                to: maxTime(schedule[counter].to, schedule[counter + 1].to)
            };
            schedule.splice(counter + 1, 1);
        } else {
            counter++;
        }
    }

    return schedule;
}

function maxTime(first, second) {
    let max = first;
    if (first < second) {
        max = second;
    }

    return max;
}

function minTime(first, second) {
    let min = first;
    if (first > second) {
        min = second;
    }

    return min;
}

function findSuitableTime(schedule, duration, workingHours) {
    const robTime = [];
    const startHour = workingHours.from.split('+')[0];
    const endHour = workingHours.to.split('+')[0];
    const workingHoursAmount = diffTime(startHour, endHour);
    if (schedule.length === 0) {
        if (workingHoursAmount >= duration) {
            return [{ start: startHour, freeTime: workingHoursAmount }];
        }

        return [];
    }
    const diffWithStart = diffTime(startHour, schedule[0].from);
    compareStartDiffWithDuration(diffWithStart, robTime, startHour);
    addFreeSegments(schedule, robTime, duration);
    const diffWithEnd = diffTime(schedule[schedule.length - 1].to, endHour);
    compareEndDiffWithDuration(diffWithEnd, robTime, schedule);

    return robTime;
}

function diffTime(first, second) {
    const [hourFirst, minuteFirst] = first.split(':');
    const [hourSecond, minuteSecond] = second.split(':');
    let minuteDiff = parseInt(minuteSecond, 10) - parseInt(minuteFirst, 10);
    let hourDiff = parseInt(hourSecond, 10) - parseInt(hourFirst, 10);
    if (minuteDiff < 0) {
        hourDiff -= 1;
        minuteDiff = 60 + minuteDiff;
    }

    return hourDiff * 60 + minuteDiff;
}

function compareStartDiffWithDuration(diff, robTime, startHour) {
    if (diff >= DURATION) {
        robTime.push({ start: startHour, freeTime: diff });
    }
}

function compareEndDiffWithDuration(diff, robTime, schedule) {
    if (diff >= DURATION) {
        robTime.push({ start: schedule[schedule.length - 1].to, freeTime: diff });
    }
}

function addFreeSegments(schedule, robTime, duration) {
    for (let i = 0; i < schedule.length - 1; i++) {
        const diff = diffTime(schedule[i].to, schedule[i + 1].from);
        if (diff >= duration) {
            robTime.push({ start: schedule[i].to, freeTime: diff });
        }
    }
}
