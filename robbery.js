'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;

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
    let DannyBusy = timeWhenSomeoneIsBusy(schedule.Danny);
    let RustyBusy = timeWhenSomeoneIsBusy(schedule.Rusty);
    let LinusBusy = timeWhenSomeoneIsBusy(schedule.Linus);
    let workTimelines = workingHoursToTimelines(workingHours);
    let busyTime = DannyBusy.concat(RustyBusy.concat(LinusBusy));
    let start = -1;
    if (typeof (duration) === 'number' && duration > 0) {
        start = getStart(workTimelines, busyTime, duration);
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (start !== -1) {
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
            if (start !== -1) {
                let [day, hour, minute] = minutesToData(start, workingHours);
                if (Number(minute) < 10) {
                    minute = '0' + minute;
                }
                if (Number(hour) < 10) {
                    hour = '0' + hour;
                }

                return template.replace('%DD', day)
                    .replace('%HH', hour)
                    .replace('%MM', minute);
            }

            return '';
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

function minutesToData(minutes, workingHours) {
    let day = 'ПН';
    let hour = String(Math.floor(minutes / 60) + Number(workingHours.to.slice(6, 8)));
    let minute = String(minutes % 60);
    if (Number(hour) / 24 === 1) {
        day = 'ВТ';
        hour = String(Math.floor((minutes - 24 * 60) / 60) + Number(workingHours.to.slice(6, 8)));
        minute = String(minutes - 24 * 60 - Math.floor((minutes - 24 * 60) / 60) * 60);
    }
    if (Number(hour) / 24 === 2) {
        day = 'СР';
        hour = String(Math.floor((minutes - 48 * 60) / 60) + Number(workingHours.to.slice(6, 8)));
        minute = String(minutes - 48 * 60 - Math.floor((minutes - 48 * 60) / 60) * 60);
    }
    if (minutes > 24 * 3 * 60) {
        return [];
    }

    return [day, hour, minute];
}

function getStart(workTimelines, busyTime, duration) {
    for (let workTimeline of workTimelines) {
        let start = some(workTimeline, busyTime, duration);
        if (start !== -1) {
            return start;
        }
    }

    return -1;
}

function some(workTimeline, busyTime, duration) {
    let timeline = [workTimeline[0], workTimeline[0] + duration];
    while (timeline[1] <= workTimeline[1]) {
        if (!workTimelineIntersectBusyTime(timeline, busyTime)) {
            return timeline[0];
        }
        timeline[0] += 1;
        timeline[1] += 1;
    }

    return -1;
}

function workTimelineIntersectBusyTime(workTimeline, busyTime) {
    for (let busyTimeline of busyTime) {
        if (intersect(workTimeline, busyTimeline)) {
            return true;
        }
    }

    return false;
}

function intersect(timeline1, timeline2) {
    if (timeline1[0] > timeline2[0] && timeline1[0] < timeline2[1]) {
        return true;
    }
    if (timeline1[1] < timeline2[1] && timeline1[1] > timeline2[0]) {
        return true;
    }

    return false;
}

function workingHoursToTimelines(workingHours) {
    let from = partWorkingHoursToTimelines(workingHours.from);
    let to = partWorkingHoursToTimelines(workingHours.to);

    return [[from, to], [from + 24 * 60, to + 24 * 60], [from + 48 * 60, to + 48 * 60]];
}

function partWorkingHoursToTimelines(part) {
    let ours = Number(part.slice(0, 2));
    let minutes = Number(part.slice(3, 5));
    let timezone = Number(part.slice(6, 8));

    return ours * 60 + minutes - timezone * 60;
}

function timeWhenSomeoneIsBusy(manSchedule) {
    let timelines = [];
    for (let note of manSchedule) {
        timelines.push(noteToMinutes(note));
    }

    return timelines;
}

function noteToMinutes(note) {
    return [partOfNoteToMinutes(note.from), partOfNoteToMinutes(note.to)];
}

function partOfNoteToMinutes(part) {
    let day = part.slice(0, 2);
    let ours = Number(part.slice(3, 5));
    let minutes = Number(part.slice(6, 8));
    let timezone = Number(part.slice(9, 11));
    if (day === 'ВТ') {
        ours += 24;
    }
    if (day === 'СР') {
        ours += 48;
    }
    if (day !== 'ПН' && day !== 'ВТ' && day !== 'СР') {
        ours += 72;
    }

    return ours * 60 + minutes - timezone * 60;
}

