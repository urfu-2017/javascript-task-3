'use strict';

/**
 * @param {NoteTime} noteTime - момент времени.
 * @returns {Number} - количество минут прошедших с 00:00 понедельника до noteTime.
 */
function quantityMinutes(noteTime) {
    let minutesInDay = 24 * 60;
    let dayToMinute = {
        'ПН': 0,
        'ВТ': minutesInDay,
        'СР': minutesInDay * 2,
        'ЧТ': minutesInDay * 3,
        'ПТ': minutesInDay * 4,
        'СБ': minutesInDay * 5,
        'ВС': minutesInDay * 6
    };
    let time = noteTime.match(/\d{2}:\d{2}/)[0];
    let day = noteTime.substr(0, 2).toUpperCase();

    return parseInt(time.substr(0, 2), 10) * 60 +
           parseInt(time.substr(3), 10) +
           dayToMinute[day];
}

/**
 * Конвертирует объект BusyTime в Segment
 * @param {BusyTime} recordSchedule
 * @returns {Segment}
 */
function toMinuteSegment(recordSchedule) {
    let start = quantityMinutes(recordSchedule.from);
    let end = quantityMinutes(recordSchedule.to);
    let timezone = parseInt((recordSchedule.from.split('+')[1]), 10);

    return { start, end, timezone };
}

/**
 * Конвертирует границы минутного отрезка в новый часовой пояс.
 * Возвращает тот же самый отрезок.
 * @param {Segment} segment
 * @param {Number} newTimezone
 * @returns {Segment}
 */
function shiftSegment(segment, newTimezone) {
    let offsetMinutes = (newTimezone - segment.timezone) * 60;
    segment.start = segment.start + offsetMinutes;
    segment.end = segment.end + offsetMinutes;
    segment.timezone = newTimezone;

    return segment;
}

/**
 *Преобразует рабочие часы банка в три минутных отрезка.
 *Каждый отрезок соответствует времени работы банка в понедельник, вторник и среду.
 *@param {String} workingHours - строка в формате "HH:MM +timezone"
 *@returns {Segment[]}
 */
function toWorkingSegments(workingHours) {
    let monday = toMinuteSegment(
        {
            from: `ПН ${workingHours.from}`,
            to: `ПН ${workingHours.to}`
        }
    );
    let minutesInDay = 24 * 60;
    let tuesday = {
        start: monday.start + minutesInDay,
        end: monday.end + minutesInDay
    };
    let wednesday = {
        start: tuesday.start + minutesInDay,
        end: tuesday.end + minutesInDay
    };

    return [monday, tuesday, wednesday];
}

/**
 *Преобразует все записи расписания в минутные отрезки, сдвигая их границы
 *к указанному часовому поясу.
 *@param {Object} schedule
 *@param {Number} timezone
 *@returns {Segment[]} 
 */
function toSegments(schedule, timezone) {
    let result = [];
    for (let scheduleRobber of Object.values(schedule)) {
        for (let recordSchedule of scheduleRobber) {
            result.push(shiftSegment(toMinuteSegment(recordSchedule), timezone));
        }
    }

    return result;
}

/**
 *По переданному количеству минут возращает дату.
 *Дата представляет собой объект с полями day, hour, minute.
 *@param {Number} numberMinuts - количество минут с 00:00 понедельника.
 *@returns {Object}
 *
 */
function minuteToDate(numberMinuts) {
    let minutesInDay = 24 * 60;
    let map = {
        0: 'ПН',
        1: 'ВТ',
        2: 'СР'
    };
    let day = map[Math.floor(numberMinuts / minutesInDay)];
    let format = (str) => str.length === 1 ? '0' + str : str;
    let hour = format(String(Math.floor((numberMinuts % minutesInDay) / 60)));
    let minute = format(String(numberMinuts % 60));

    return { day, hour, minute };
}

module.exports.toWorkingSegments = toWorkingSegments;
module.exports.toSegments = toSegments;
module.exports.toDate = minuteToDate;
