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
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let bankTimezone = getTimezone(workingHours.from);
    let bandBusyTime = { 'ПН': [], 'ВТ': [], 'СР': [] };
    for (let busyTimeList of Object.values(schedule)) {
        for (let currentBusyTime of busyTimeList) {
            createGeneralSchedule(bandBusyTime, currentBusyTime, bankTimezone);
        }
    }
    let timesForRob = { 'ПН': [], 'ВТ': [], 'СР': [] };
    for (let day of Object.keys(bandBusyTime)) {
        let scheduleInWorkHours = cutSchedule(bandBusyTime[day], workingHours);
        let sortedSchedule = scheduleInWorkHours.sort(sortSchedule);
        let modifiedSchedule = uniteSchedule(sortedSchedule);
        timesForRob[day] = findSuitableTime(modifiedSchedule, duration, workingHours);
    }

    return {
        currentRobStart: undefined,

        getNewTime: function () {
            for (let day of Object.keys(timesForRob)) {
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
            for (let day of Object.keys(timesForRob)) {
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
            let [robHour, robMinutes] = this.currentRobStart.time.split(':');
            let result = template.replace(/%DD/, this.currentRobStart.robDay)
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
            if (this.currentRobStart === undefined) {
                this.getNewTime(timesForRob);
            }
            let exist = false;
            if (this.currentRobStart !== undefined &&
                    timesForRob[this.currentRobStart.robDay].length !== 0 &&
                    timesForRob[this.currentRobStart.robDay][0].freeTime >= duration + 30) {
                this.currentRobStart.time = sumTime(this.currentRobStart.time, '00:30');
                timesForRob[this.currentRobStart.robDay][0].freeTime -= 30;
                exist = true;
            } else {
                if (this.currentRobStart !== undefined) {
                    timesForRob[this.currentRobStart.robDay].splice(0, 1);
                }
                exist = this.getNewTime(timesForRob);
            }

            return exist;
        }
    };
};

function createGeneralSchedule(bandBusyTime, currentBusyTime, bankTimezone) {
    let from = transformTime(currentBusyTime.from, bankTimezone);
    let to = transformTime(currentBusyTime.to, bankTimezone);
    if (from.day === to.day) {
        if (from.day in bandBusyTime) {
            bandBusyTime[from.day].push({ from: from.time, to: to.time });
        }
    } else {
        let busyDays = divideIntoDays(from, to);
        addToGeneralSchedule(busyDays, bandBusyTime);
    }
}

function addToGeneralSchedule(busyDays, bandBusyTime) {
    for (let day of Object.keys(busyDays)) {
        if (day in bandBusyTime) {
            bandBusyTime[day].push(busyDays[day]);
        }
    }
}

function sumTime(first, second) {
    let [hourFirst, minuteFirst] = first.split(':');
    let [hourSecond, minuteSecond] = second.split(':');
    let minuteSum = parseInt(minuteSecond) + parseInt(minuteFirst);
    let hourSum = parseInt(hourSecond) + parseInt(hourFirst);
    if (minuteSum >= 60) {
        hourSum += 1;
        minuteSum %= 60;
    }

    return hourSum.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false }) +
         ':' + minuteSum.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
}

function findSuitableTime(schedule, duration, workingHours) {
    let robTime = [];
    let startHour = workingHours.from.split('+')[0];
    let endHour = workingHours.to.split('+')[0];
    if (schedule.length === 0) {
        return [{ start: startHour, freeTime: diffTime(startHour, endHour) }];
    }
    let diffWithStart = diffTime(startHour, schedule[0].from);
    if (diffWithStart >= duration) {
        robTime.push({ start: startHour, freeTime: diffWithStart });
    }
    addFreeSegments(schedule, robTime, duration);
    let diffWithEnd = diffTime(schedule[schedule.length - 1].to, endHour);
    if (diffWithEnd >= duration) {
        robTime.push({ start: schedule[schedule.length - 1].to, freeTime: diffWithEnd });
    }

    return robTime;
}

function addFreeSegments(schedule, robTime, duration) {
    for (let i = 0; i < schedule.length - 1; i++) {
        let diff = diffTime(schedule[i].to, schedule[i + 1].from);
        if (diff >= duration) {
            robTime.push({ start: schedule[i].to, freeTime: diff });
        }
    }
}

function diffTime(first, second) {
    let [hourFirst, minuteFirst] = first.split(':');
    let [hourSecond, minuteSecond] = second.split(':');
    let minuteDiff = parseInt(minuteSecond) - parseInt(minuteFirst);
    let hourDiff = parseInt(hourSecond) - parseInt(hourFirst);
    if (minuteDiff < 0) {
        hourDiff -= 1;
        minuteDiff = 60 + minuteDiff;
    }

    return hourDiff * 60 + minuteDiff;
}

function cutSchedule(schedule, workingHours) {
    let startHour = workingHours.from.split('+')[0];
    let endHour = workingHours.to.split('+')[0];
    let newSchedule = [];
    for (let currentSegment of schedule) {
        if (currentSegment.to < startHour || currentSegment.from > endHour) {
            continue;
        } else if (currentSegment.from < startHour && currentSegment.to > startHour) {
            newSchedule.push({ from: startHour, to: currentSegment.to });
        } else if ((currentSegment.from < endHour && currentSegment.to > endHour)) {
            newSchedule.push({ from: currentSegment.from, to: endHour });
        } else {
            newSchedule.push(currentSegment);
        }
    }

    return newSchedule;
}

function sortSchedule(first, second) {
    let result = 0;
    if (first.from > second.from) {
        result = 1;
    } else if (first.from < second.from) {
        result = -1;
    }

    return result;
}

function uniteSchedule(schedule) {
    let counter = 0;
    while (counter < schedule.length - 1) {
        if (schedule[counter].to >= schedule[counter + 1].from) {
            schedule[counter] =
            { from: minTime(schedule[counter].from, schedule[counter + 1].from),
                to: maxTime(schedule[counter].to, schedule[counter + 1].to) };
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

function divideIntoDays(from, to) {
    let weekDays = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ'];
    let segmentByDays = {};
    let startDay = weekDays.indexOf(from.day);
    let endDay = weekDays.indexOf(to.day);
    segmentByDays[from.day] = { from: from.time, to: '23:59' };
    segmentByDays[to.day] = { from: '00:00', to: to.time };
    for (let i = startDay + 1; i < endDay; i++) {
        segmentByDays[weekDays[i]] = { from: '00:00', to: '23:59' };
    }

    return segmentByDays;
}

function transformTime(dayAndTime, bankTimezone) {
    let [day, hours, minutes, currentTimezone] = dayAndTime.split(/[ :+]/);
    let diff = bankTimezone - currentTimezone;
    let dayShift = 0;
    hours = parseInt(hours) + diff;
    if (hours < 0) {
        hours += 24;
        dayShift = -1;
    }
    if (hours >= 24) {
        hours %= 24;
        dayShift = +1;
    }
    day = getWeekDay(day, dayShift);
    hours = hours.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

    return { day, time: `${hours}:${minutes}` };
}

function getWeekDay(currentDay, shift) {
    let weekDays = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ'];
    let currentIndex = weekDays.indexOf(currentDay);

    return weekDays[currentIndex + shift];
}


function getTimezone(time) {
    return parseInt(time.split('+')[1]);
}
