'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

const timeRE = new RegExp('^(.{2})\\s(\\d{2}):(\\d{2})\\+(\\d)$');
// noinspection NonAsciiCharacters
const dayNumberByName = {
    'ПН': 0,
    'ВТ': 1,
    'СР': 2,
    'ЧТ': 3,
    'ПТ': 4,
    'СБ': 5,
    'ВС': 6
};

const minutesInDay = 1440;
const minutesInHour = 60;
const open = 0;
const close = 1;
let timeBeforeStart;
let timeAfterEnd;

function getMinutesFromWeekStart(timeString) {
    let parsed = timeRE.exec(timeString);

    return (dayNumberByName[parsed[1]] * minutesInDay +
        (parseInt(parsed[2]) - parseInt(parsed[4])) * minutesInHour + parseInt(parsed[3]));
}

function getEvents(schedule) {
    let events = [];
    for (let timePeriod of schedule) {
        events.push({ time: getMinutesFromWeekStart(timePeriod.from), type: open });
        events.push({ time: getMinutesFromWeekStart(timePeriod.to), type: close });
    }

    return events;
}

function getEventsFromRobberSchedule(robberSchedule) {
    let events = [];
    events.push({ time: timeBeforeStart, type: open });
    for (let timePeriod of robberSchedule) {
        events.push({ time: getMinutesFromWeekStart(timePeriod.from), type: close });
        events.push({ time: getMinutesFromWeekStart(timePeriod.to), type: open });
    }
    events.push({ time: timeAfterEnd, type: close });

    return events;
}

function getEventsFromBankWorkingHours(bankWorkingHours) {
    let bankWorkingHoursByDays = Object.keys(dayNumberByName).slice(0, 3)
        .map(function (day) {
            return {
                from: day + ' ' + bankWorkingHours.from,
                to: day + ' ' + bankWorkingHours.to
            };
        });

    return getEvents(bankWorkingHoursByDays);
}

// Use ScanLine algorithm
function getCommonMomentRanges(events, enoughOpenedForRobbery) {
    events.sort(function (first, second) {
        let result = first.time - second.time;
        if (result !== 0) {
            return result;
        }

        return first.type - second.type;
    });
    let openedCount = 0;
    let notStarted = timeBeforeStart - 1;
    let rangeStarted = notStarted;
    let ranges = [];
    for (let event of events) {
        if (event.type === open) {
            openedCount++;
        } else {
            openedCount--;
        }
        if (openedCount >= enoughOpenedForRobbery && rangeStarted === notStarted) {
            rangeStarted = event.time;
        }
        if (openedCount < enoughOpenedForRobbery && rangeStarted !== notStarted) {
            ranges.push({ from: rangeStarted, to: event.time });
            rangeStarted = notStarted;
        }
    }

    return ranges;
}

function getDay(timeInMinutes) {
    let dayNumber = Math.floor(timeInMinutes / minutesInDay);
    for (let name of Object.keys(dayNumberByName)) {
        if (dayNumberByName[name] === dayNumber) {
            return name;
        }
    }
}

function formatNumber(number) {
    return number < 10 ? '0' + number : number;
}

exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    let bankTimeZone = parseInt(workingHours.from[workingHours.from.length - 1]);
    timeBeforeStart = getMinutesFromWeekStart('ПН 00:00+' + bankTimeZone);
    timeAfterEnd = getMinutesFromWeekStart('ВС 23:59+' + bankTimeZone);
    let bankEvents = getEventsFromBankWorkingHours(workingHours);
    for (let key of Object.keys(schedule)) {
        bankEvents = bankEvents.concat(getEventsFromRobberSchedule(schedule[key]));
    }
    let commonMomentRanges = getCommonMomentRanges(bankEvents, Object.keys(schedule).length + 1);
    let robberyRanges = [];
    for (let range of commonMomentRanges) {
        if (range.to - range.from >= duration) {
            robberyRanges.push({ from: range.from, to: range.to - duration });
        }
    }

    return {
        exists: function () {
            return robberyRanges.length > 0;
        },
        format: function (template) {
            if (robberyRanges.length === 0) {
                return '';
            }
            let timeInBankTimezone = robberyRanges[0].from + bankTimeZone * minutesInHour;
            let day = getDay(timeInBankTimezone);
            let hour = formatNumber(Math.floor(timeInBankTimezone / 60) % 24);
            let minute = formatNumber(timeInBankTimezone % 60);
            template = template.replace('%DD', day);
            template = template.replace('%HH', hour);
            template = template.replace('%MM', minute);

            return template;
        },
        tryLater: function () {
            if (robberyRanges.length === 0) {
                return false;
            }
            let minimalTime = robberyRanges[0].from + 30;
            for (let i = 0; i < robberyRanges.length; ++i) {
                if (robberyRanges[i].to >= minimalTime) {
                    robberyRanges = robberyRanges.slice(i);
                    robberyRanges[0].from = Math.max(robberyRanges[0].from, minimalTime);

                    return true;
                }
            }

            return false;
        }
    };
};
