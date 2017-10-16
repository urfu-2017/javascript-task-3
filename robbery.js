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
    console.info(schedule, duration, workingHours);
    let answers = [];
    if (isDataCorrect(schedule, duration, workingHours)) {
        let DannyBusyTime = timeWhenSomeoneIsBusy(schedule.Danny);
        let RustyBusyTime = timeWhenSomeoneIsBusy(schedule.Rusty);
        let LinusBusyTime = timeWhenSomeoneIsBusy(schedule.Linus);
        let workTime = workingHoursToMinutes(workingHours);
        let DannyFreeTimes = timeWhenSomeoneIsFree(DannyBusyTime, workTime, duration, workingHours);
        let RustyFreeTimes = timeWhenSomeoneIsFree(RustyBusyTime, workTime, duration, workingHours);
        let LinusFreeTimes = timeWhenSomeoneIsFree(LinusBusyTime, workTime, duration, workingHours);

        answers = canTheyThief(DannyFreeTimes, RustyFreeTimes, LinusFreeTimes, duration);


    } else {
        answers = [];
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (answers.length !== 0) {
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
            if (answers.length !== 0) {
                let [day, hour, minute] = minutesToData(answers[0][0], workingHours);
                if (minute === '0') {
                    minute += '0';
                }
                if (hour === '0') {
                    hour += '0';
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
            return tryToFindLaterTimeline(answers, duration);
        }
    };
};

function tryToFindLaterTimeline(answers, duration) {
    for (let i = 0; i < answers.length; i++) {
        if (answers[i][0] >= answers[0][0] + 30 && answers[i][1] - answers[i][0] >= duration) {
            answers[0] = answers[i];

            return true;
        }
        if (answers[i][0] < answers[0][0] + 30 && answers[0][1] - answers[0][0] - 30 >= duration) {
            answers[0][0] += 30;

            return true;
        }
    }

    return false;
}

function isDataCorrect(schedule, duration, workingHours) {
    return typeof (schedule) === 'object' && duration >= 0 &&
        duration < 24 * 60 && typeof (workingHours) === 'object';
}

function minutesToData(minutes, workingHours) {
    let day = 'ПН';
    let hour = String(Math.floor(minutes / 60) + workingHours.to.slice(9, 10));
    let minute = String(minutes % 60);
    if (Math.floor(minutes / 24 / 60) === 1) {
        day = 'ВТ';
        hour = String(Math.floor((minutes - 24 * 60) / 60) + Number(workingHours.to.slice(6, 7)));
        minute = String(minutes - 24 * 60 - Math.floor((minutes - 24 * 60) / 60) * 60);
    }
    if (Math.floor(minutes / 24 / 60) === 2) {
        day = 'СР';
        hour = String(Math.floor((minutes - 48 * 60) / 60) + Number(workingHours.to.slice(6, 7)));
        minute = String(minutes - 48 * 60 - Math.floor((minutes - 48 * 60) / 60) * 60);
    }

    return [day, hour, minute];
}

function canTheyThief(DannyFreeTimes, RustyFreeTimes, LinusFreeTimes, duration) {
    let intersection = [];
    let answers = [];
    while (DannyFreeTimes.length > 0 && RustyFreeTimes.length > 0 && LinusFreeTimes.length > 0) {
        intersection = intersect(DannyFreeTimes[0], RustyFreeTimes[0], LinusFreeTimes[0]);
        getManWithEarliestTimeline(DannyFreeTimes, RustyFreeTimes, LinusFreeTimes).shift();
        if (intersection[1] - intersection[0] >= duration) {
            answers.push(intersection);
        }
    }

    return answers;
}

function intersect(timeline1, timeline2, timeline3) {
    let latestStart = Math.max(timeline1[0], timeline2[0], timeline3[0]);
    let earliestEnd = Math.min(timeline1[1], timeline2[1], timeline3[1]);

    return [latestStart, earliestEnd];
}

function getManWithEarliestTimeline(DannyFreeTimes, RustyFreeTimes, LinusFreeTimes) {
    let min = Math.min(DannyFreeTimes[0][0], RustyFreeTimes[0][0], LinusFreeTimes[0][0]);
    if (min === DannyFreeTimes[0][0]) {
        return DannyFreeTimes;
    }
    if (min === RustyFreeTimes[0][0]) {
        return RustyFreeTimes;
    }

    return LinusFreeTimes;
}

function timeWhenSomeoneIsFree(someoneSchedule, workTimes, duration, workingHours) {
    let freeTimes = [];
    for (let workTime of workTimes) {
        getTimeToThief(workTime, someoneSchedule, duration, freeTimes);
    }
    if (freeTimes.length !== 0) {
        freeTimes.push([Math.max(freeTimes[freeTimes.length - 1][1],
            someoneSchedule[someoneSchedule.length - 1][1]),
        48 * 60 + partWorkingHoursToMinutes(workingHours.to) -
        Number(workingHours.to.slice(6, 7)) * 60]);
    }

    return freeTimes;
}

function getTimeToThief(workTime, someoneSchedule, duration, freeTimes) {
    for (let timeline of someoneSchedule) {
        if (withinLeft(timeline, workTime, duration).length !== 0 &&
            !itemInArray(withinLeft(timeline, workTime, duration), freeTimes)) {
            freeTimes.push(withinLeft(timeline, workTime, duration));
        }
        if (withinRight(timeline, workTime, duration).length !== 0 &&
            !itemInArray(withinRight(timeline, workTime, duration), freeTimes)) {
            freeTimes.push(withinRight(timeline, workTime, duration));
        }
        if (left(timeline, workTime, duration).length !== 0 &&
            !itemInArray(left(timeline, workTime, duration), freeTimes)) {
            freeTimes.push(left(timeline, workTime, duration));
        }
        if (right(timeline, workTime, duration).length !== 0 &&
            !itemInArray(right(timeline, workTime, duration), freeTimes)) {
            freeTimes.push(right(timeline, workTime, duration));
        }
    }

    return freeTimes;
}


function itemInArray(time, array) {
    for (let item of array) {
        if (time === item) {
            return true;
        }
    }

    return false;
}

function withinLeft(timeline, workTime, duration) {
    // внутри
    if (timeline[0] >= workTime[0] && timeline[1] <= workTime[1]) {
        if (timeline[0] - workTime[0] >= duration) {
            return [workTime[0], timeline[0]];
        }
    }

    return [];
}

function withinRight(timeline, workTime, duration) {
    if (timeline[0] >= workTime[0] && timeline[1] <= workTime[1]) {
        if (workTime[1] - timeline[1] >= duration) {
            return [timeline[1], workTime[1]];
        }
    }

    return [];
}

function left(timeline, workTime, duration) {
    // начало работы пересек
    if (timeline[0] <= workTime[0] && timeline[1] <= workTime[1] && timeline[1] >= workTime[0]) {
        if (workTime[1] - timeline[1] >= duration) {
            return [timeline[1], workTime[1]];
        }
    }

    return [];
}

function right(timeline, workTime, duration) {
    // конец работы пересек
    if (timeline[0] >= workTime[0] && timeline[1] >= workTime[1] && timeline[0] <= workTime[1]) {
        if (timeline[0] - workTime[0] >= duration) {
            return [workTime[0], timeline[0]];
        }
    }
    if (timeline[0] <= workTime[0] && timeline[1] >= workTime[1]) {
        if (workTime[1] - workTime[0] >= duration) {
            return [workTime[0], workTime[1]];
        }
    }

    return [];
}

function workingHoursToMinutes(workingHours) {
    let from = partWorkingHoursToMinutes(workingHours.from);
    let to = partWorkingHoursToMinutes(workingHours.to);

    return [[from, to], [from + 24 * 60, to + 24 * 60], [from + 48 * 60, to + 48 * 60]];
}

function partWorkingHoursToMinutes(part) {
    let ours = Number(part.slice(0, 2));
    let minutes = Number(part.slice(3, 5));
    let timezone = Number(part.slice(6, 7));

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
    let start = partOfNoteToMinutes(note.from);
    let end = partOfNoteToMinutes(note.to);

    return [start, end];
}

function partOfNoteToMinutes(part) {
    let day = part.slice(0, 2);
    let ours = Number(part.slice(3, 5));
    let minutes = Number(part.slice(6, 8));
    let timezone = Number(part.slice(9, 10));
    if (day === 'ВТ') {
        ours += 24;
    }
    if (day === 'СР') {
        ours += 48;
    }

    return ours * 60 + minutes - timezone * 60;
}

