'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

let daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    let currentRobberyIndex = 0;
    let availableRobberyDates = [];
    let bankTimezone = getTimezoneFromString(workingHours.from);
    let timesegments = convertScheduleToSegments(schedule, bankTimezone);
    let banksegments = convertBankTimeToSegments(workingHours, bankTimezone);
    timesegments = timesegments.concat(banksegments);
    let timePoints = convertSegmentsToTimes(timesegments);
    availableRobberyDates = searchFreeDates(timePoints, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return availableRobberyDates.length > currentRobberyIndex;
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

            return formatTime(availableRobberyDates[currentRobberyIndex], template);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            currentRobberyIndex++;
            if (this.exists()) {
                return true;
            }
            currentRobberyIndex--;

            return false;
        }
    };
};

function getRobberyTimesFromFreeSegment(segment, robberyDuration) {
    let times = [];
    let currentTime = segment.from;
    while (currentTime + robberyDuration <= segment.to) {
        times.push(currentTime);
        currentTime += 30;
    }

    return times;
}

function searchFreeSegments(timePoints) {
    let currentNesting = 1;
    let freeSegments = [];
    let currentStartTime = 0;
    for (let timePoint of timePoints) {
        if (currentNesting === 0) {
            freeSegments.push({ from: currentStartTime, to: timePoint.minutes });
        }
        if (timePoint.isStart) {
            currentNesting++;
        } else {
            currentNesting--;
        }
        currentStartTime = timePoint.minutes;
    }

    return freeSegments;
}

function compareTimes(time1, time2) {
    if (time1.minutes < time2.minutes) {
        return -1;
    }
    if (time1.minutes > time2.minutes) {
        return 1;
    }

    return 0;
}

function searchFreeDates(timePoints, duration) {
    timePoints.sort(compareTimes);
    let freeSegments = searchFreeSegments(timePoints);
    let robberyTimes = [];
    for (let segment of freeSegments) {
        robberyTimes = robberyTimes.concat(getRobberyTimesFromFreeSegment(segment, duration));
    }
    let freeDates = [];
    for (let time of robberyTimes) {
        freeDates.push(convertMinutesToDate(time));
    }

    return freeDates;
}

function formatTime(time, template) {
    return template
        .replace(/%HH/, zfill(time.hours, 2))
        .replace(/%MM/, zfill(time.minutes, 2))
        .replace(/%DD/, time.day);
}

function zfill(number, maxLen) {
    let currentNumber = String(number);
    while (maxLen - currentNumber.length > 0) {
        currentNumber = '0' + currentNumber;
    }

    return currentNumber;
}

function parseDate(date) {
    let splited = date.split(' ');
    let time = parseTime(splited[splited.length - 1]);
    if (splited.length === 2) {
        time.day = splited[0];
    }

    return time;
}

function getTimezoneFromString(time) {
    return Number(/\+(\d*?)$/.exec(time)[1]);
}

function parseTime(time) {
    let parsed = /^(\d\d):(\d\d)\+(.*?)$/.exec(time);

    return {
        hours: Number(parsed[1]),
        minutes: Number(parsed[2]),
        timezone: Number(parsed[3])
    };
}

function normalizeTime(time, defaultTimezone) {
    let timezoneOffset = defaultTimezone - time.timezone;
    time.hours += timezoneOffset;

    return time;
}

function convertToMinutes(time) {
    let hours = time.hours;
    let indexOfDayInWeek = daysOfWeek.indexOf(time.day);
    if (indexOfDayInWeek !== -1) {
        hours += indexOfDayInWeek * 24;
    }

    return hours * 60 + time.minutes;
}

function convertToTimeSegment(time, bankTimezone) {
    return {
        from: convertStringTimeToMinutes(time.from, bankTimezone),
        to: convertStringTimeToMinutes(time.to, bankTimezone)
    };
}

function convertScheduleToSegments(schedule, bankTimezone) {
    let timesegments = [];
    for (let robber of Object.keys(schedule)) {
        for (let robberyTime of schedule[robber]) {
            timesegments.push(convertToTimeSegment(robberyTime, bankTimezone));
        }
    }

    return timesegments;
}

function convertBankTimeToSegments(bankTime, bankTimezone) {
    let segments = [];
    let days = daysOfWeek.slice(0, 3);
    for (let day of days) {
        let segment = convertToTimeSegment({
            from: `${day} ${bankTime.from}`,
            to: `${day} ${bankTime.to}`
        },
        bankTimezone);
        segments.push({ from: segment.to, to: segment.from });
    }

    return segments;
}

function convertSegmentsToTimes(segments) {
    let times = [];
    for (let segment of segments) {
        times = times.concat(convertSegmentToTimes(segment));
    }

    return times;
}

function convertSegmentToTimes(segment) {
    return [{ minutes: segment.from, isStart: true }, { minutes: segment.to, isStart: false }];
}

function convertStringTimeToMinutes(stringTime, bankTimezone) {
    let parsedTime = parseDate(stringTime);
    let normalizedTime = normalizeTime(parsedTime, bankTimezone);

    return convertToMinutes(normalizedTime);
}

function convertMinutesToDate(minutes) {
    let hours = Math.floor(minutes / 60);
    minutes %= 60;
    let day = daysOfWeek[Math.floor(hours / 24)];
    hours %= 24;

    return { day, hours, minutes };
}
