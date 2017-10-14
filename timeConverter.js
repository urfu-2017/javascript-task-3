'use strict';

/**
 * Возвращает количество минут, прошедших с 00:00 понедельника до переданного момента
 * @param {String} time - Время в формате HH:MM
 * @param {String} day - Двухбуквенное сокращение дня недели
 * @returns {Number}
 */
function quantityMinutes(time, day) {
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

    return parseInt(time.substr(0, 2), 10) * 60 +
           parseInt(time.substr(3), 10) +
           dayToMinute[day];
}

/**
 * @param {String} element - Строка в формате "DD HH:MM+timezone" 
 * @returns {Object} 
 */
function parseElementRecord(element) {
    let time = element.match(/\d{2}:\d{2}/)[0];
    let day = element.substr(0, 2).toUpperCase();

    return { time, day };
}

/**
 * Преобразует объект {from: "DD HH:MM+timezone", to:...} (те элемент расписания)
 * в объект, представляющий собой отрезок, началом которого является количество минут
 * с 00:00 понедельника до момена from, а концом - до момента to. Также в возвращаемом объекте 
 * сохраняется часовой пояс.
 * @param {Object} recordSchedule - {from: "DD HH:MM+timezone", to:...}
 * @returns {Object} - { start:number, end:number, timezone:number }
 */
function toMinuteSegment(recordSchedule) {

    let from = parseElementRecord(recordSchedule.from);
    let to = parseElementRecord(recordSchedule.to);
    let start = quantityMinutes(from.time, from.day);
    let end = quantityMinutes(to.time, to.day);
    let timezone = parseInt((recordSchedule.from.split('+')[1]), 10);

    return { start, end, timezone };
}

/**
 * Конвертирует границы минутного отрезка в новый часовой пояс.
 * Возвращает тот же самый отрезок.
 * @param {Object} segment
 * @param {Object} newTimezone
 * @returns {Object}
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
 *@param {String} workingHours
 *@returns {Array}
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
 *@returns {Array} 
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
