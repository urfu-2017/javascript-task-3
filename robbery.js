'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;
const DayShift = {
    'ПН': 'ВТ',
    'ВТ': 'СР',
    'СР': 'ЧТ',
    'ЧТ': 'ПТ',
    'ПТ': 'СБ',
    'СБ': 'ВСК',
    'ВСК': 'ПН'
};

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    // console.info(schedule, duration, workingHours);
    let timezone = getTimeZone(workingHours);
    schedule = evenSchedule(schedule, timezone);
    schedule = cutSchedule(schedule);
    schedule = convertScheduleToMinutes (schedule);
    workingHours = convertBankScheduleToMinutes (workingHours);
    for (let person of Object.keys(schedule)) {
        schedule[person] = formatSchedule(schedule[person], workingHours);
    }
    let variants = mergeSchedule(schedule);
    let finalSchedule = findPeriod(variants, duration, workingHours);
    let normalDate;
    if (finalSchedule !== null) {
        normalDate = convertToNormalDate(finalSchedule);
    }
    // console.info(normalDate);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (finalSchedule !== null) {
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
            if (finalSchedule === null) {
                return '';
            }
            let parsedDate = parseDate(normalDate);


            return template
                .replace('%HH', parsedDate[1])
                .replace('%MM', parsedDate[2])
                .replace('%DD', parsedDate[0]);
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

function convertToNormalDate(schedule) {
    let day;
    switch (schedule[1]) {
        case 0:
            day = 'ПН';
            break;

        case 1:
            day = 'ВТ';
            break;

        default:
            day = 'СР';
            break;
    }
    let normalTime = extractExactTime(schedule[0]);

    return day + ' ' + normalTime;
}
function findPeriod(variants, duration, workingHours) {
    let holesOpt = [];
    let foundVariant = false;
    for (let i = 0; i < variants.length; i++) {
        if (variants[i].length > 2) {
            holesOpt = [findVariantWithHole(variants[i], duration, workingHours), i];
            foundVariant = holesOpt[0] !== null;
        }
        if (foundVariant) {
            break;
        }
        let borderOpt = searchBorder(variants, i, duration, workingHours);
        if (borderOpt[0] !== null) {
            return borderOpt;
        }
    }

    return (holesOpt[0] !== null) ? holesOpt : null;

}

function searchBorder(variants, i, duration, workingHours) {
    let openBank = Number(workingHours.from);
    let closeBank = Number(workingHours.to);
    let leftShift = variants[i][0] - openBank;
    let rightShift = closeBank - variants[i][1];
    if (duration <= leftShift) {
        return [openBank, i];
    }
    if (duration <= rightShift) {
        return [variants[i][1], i];
    }

    return [null, i];
}
function findVariantWithHole(variants, duration, workingHours) {
    let holes = [];
    for (let i = 1; i < variants.length; i += 2) {
        holes.push(variants[i]);
    }
    let startTime = Number(variants[0][0]);
    let finishTime = Number(variants[variants.length - 1][1]);
    let firstPeriod = startTime - Number(workingHours.from);
    if (duration <= firstPeriod) {
        return workingHours.from;
    }
    for (let hole of holes) {
        if (duration <= Number(hole[1]) - Number(hole[0])) {
            return hole[0];
        }
    }
    let lastPeriod = Number(workingHours.to) - finishTime;
    if (duration <= lastPeriod) {
        return finishTime;
    }

    return null;
}

function mergeSchedule(schedule1) {
    let monRecords = findRecords('ПН', schedule1);
    let tueRecords = findRecords('ВТ', schedule1);
    let wenRecords = findRecords('СР', schedule1);
    let monCommonTime = findCommon(monRecords);
    let tueCommonTime = findCommon(tueRecords);
    let wenCommonTime = findCommon(wenRecords);

    return [monCommonTime, tueCommonTime, wenCommonTime];

}

function findCommon(records) {
    let allRecords = [];
    for (let person of Object.keys(records)) {
        for (let date of records[person]) {
            allRecords.push(date);
        }
    }

    return calculatePeriods(allRecords);
}

function calculatePeriods(allRecords) {
    let startTime = Number(allRecords[0].from);
    let finishTime = Number(allRecords[0].to);
    // let holes = checkForHoles(allRecords);
    for (let element of allRecords) {
        startTime = (Number(element.from) <= startTime) ? Number(element.from) : startTime;
        finishTime = (Number(element.to) >= finishTime) ? Number(element.to) : finishTime;
    }

    return checkCoverage(startTime, finishTime, allRecords);
}

function checkCoverage(startTime, finishTime, allRecords) {
    let table = [finishTime - startTime];
    for (let record of allRecords) {
        let startTimeRecord = Number(record.from) - startTime;
        let finishTimeRcord = Number(record.to) - startTime;
        for (let i = startTimeRecord; i < finishTimeRcord; i++) {
            table[i] = true;
        }
    }
    let count = countElements(table);
    if (count !== table.length) {
        return findHoles(table, startTime);
    }

    return [startTime, finishTime];
}
function countElements(table) {
    let k = 0;
    for (let i = 0; i < table.length; i++) {
        if (typeof table[i] !== 'undefined') {
            k++;
        }
    }

    return k;
}

function findHoles(table, startTime) {
    let holes = [];
    let startIndex = 0;
    let finishIndex = 0;
    for (let i = 0; i < table.length - 1; i++) {
        if (table[i] === table[i + 1]) {
            finishIndex++;
        } else {
            holes.push([startIndex + startTime, finishIndex + 1 + startTime]);
            startIndex = finishIndex + 1;
            finishIndex = startIndex;
        }

    }
    holes.push([startIndex + startTime, finishIndex + 1 + startTime]);

    return holes;
}
function findRecords(day, schedule1) {
    let result = {};
    for (let person of Object.keys(schedule1)) {
        let dateArray = extractDayRecord(person, schedule1, day);
        result[person] = dateArray;
    }

    return result;
}
function extractDayRecord(person, schedule1, day) {
    // [
    //     { from: 'ПН 12:00+5', to: 'ПН 17:00+5' },
    //     { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
    // 
    let dateArray = [];
    for (let date of schedule1[person]) {
        let fromDate = date.from.split(' ');
        let toDate = date.to.split(' ');
        if (fromDate[0] === day) {
            dateArray.push({
                from: fromDate[1],
                to: toDate[1]
            });
        }
    }

    return dateArray;
}
function cutSchedule(schedule) {
    let result = {};
    for (let person of Object.keys(schedule)) {
        let dateArray = separatePersonSchedule(person, schedule);
        result[person] = dateArray;
    }

    return result;
}
function separatePersonSchedule(person, schedule) {
    let dateArray = [];
    for (let date of schedule[person]) {
        var record = separateDate(date);
        for (let splittedDate of record) {
            dateArray.push(splittedDate);
        }
    }

    return dateArray;
}
function separateDate(date) {
    let result = [];
    let fromDate = parseDate(date.from);
    let toDate = parseDate(date.to);
    let midnightPatternBefore = '23:59+' + fromDate[3];
    let midnightPatternAfter = '00:00+' + fromDate[3];

    while (fromDate[0] !== toDate[0]) {
        result.push({
            from: date.from,
            to: fromDate[0] + ' ' + midnightPatternBefore
        });
        fromDate[0] = DayShift[fromDate[0]];
        date.from = fromDate[0] + ' ' + midnightPatternAfter;
    }
    result.push({
        from: date.from,
        to: date.to
    });
    if (result.length === 0) {
        result.push(date);
    }

    return result;

}
function formatSchedule(personSchedule, workingHours) {
    let result = [];
    for (let date of personSchedule) {
        let fromDate = Number(date.from.split(' ')[1]);
        let toDate = Number(date.to.split(' ')[1]);

        if (fromDate > Number(workingHours.to)) {
            result.push({
                from: 'no',
                to: 'no'
            });
        } else {
            let fromTime = (fromDate >= Number(workingHours.from))
                ? fromDate : Number(workingHours.from);
            let toTime = (toDate <= Number(workingHours.to)) ? toDate : Number(workingHours.to);
            result.push({
                from: date.from.split(' ')[0] + ' ' + fromTime,
                to: date.to.split(' ')[0] + ' ' + toTime
            });
        }
    }

    return result;
}
function convertBankScheduleToMinutes(schedule) {
    // var bankWorkingHours = {from: '10:00+5',to: '18:00+5'};
    let fromDate = parseDate(schedule.from);
    let toDate = parseDate(schedule.to);

    return {
        from: Number(fromDate[0]) * 60 + Number(fromDate[2]),
        to: Number(toDate[0]) * 60 + Number(toDate[2])
    };
}

function extractExactTime(time) {
    let hours = parseInt(time / 60);
    let minutes = time % 60;
    if (minutes === 0) {
        minutes = '00';
    }

    return hours + ':' + minutes;
}
function convertScheduleToMinutes(schedule) {
    let result = {};
    for (let person of Object.keys(schedule)) {
        let dateArray = [];
        for (let date of schedule[person]) {
            var record = convertToMinutes(date);
            dateArray.push(record);
        }
        result[person] = dateArray;
    }

    return result;
}

/**
 * Переводит время в минуты 
 * @param {Object} date 
 * @returns {Object}
 */
function convertToMinutes(date) {
    // { from: 'ПН 12:00+5', to: 'ПН 17:00+5' },
    let fromDate = parseDate(date.from);
    let toDate = parseDate(date.to);


    return {
        from: fromDate[0] + ' ' + Number(Number(fromDate[1]) * 60 + Number(fromDate[2])),
        to: toDate[0] + ' ' + Number(Number(toDate[1]) * 60 + Number(toDate[2]))
    };
}

/**
 * Выравнивает расписание с учетом разных часовых поясов 
 * @param {Object} schedule 
 * @param {Number} timezone 
 * @returns {Object}
 */
function evenSchedule(schedule, timezone) {
    let result = {};
    for (let person of Object.keys(schedule)) {
        let dateArray = [];
        for (let date of schedule[person]) {
            var record = changeRecord(date, timezone);
            dateArray.push(record);
        }
        result[person] = dateArray;
    }

    return result;
}

/**
 * Выцыганивает часовой пояс из записи даты
 * @param {Object} hours 
 * @returns {Integer}
 */
function getTimeZone(hours) {
    return hours.from.split('+')[1];
}

/**
 * Изменяет запись даты с учетом изменение часового пояса
 * @param {Object} date 
 * @param {Number} timezone 
 * @returns {Object}
 */
function changeRecord(date, timezone) {
    //  { from: 'ПН 12:00+5', to: 'ПН 17:00+5' }
    if (getTimeZone(date) === timezone) {
        return date;
    }
    let rawDateFrom = parseDate(date.from);
    // ['ПН','12','00','5']
    rawDateFrom = normalizeDate(rawDateFrom, timezone);
    let rawDateTo = parseDate(date.to);
    // ['ПН','17','00','5']
    rawDateTo = normalizeDate(rawDateTo, timezone);

    //  { from: 'ПН 12:00+5', to: 'ПН 17:00+5' },
    return {
        from: rawDateFrom[0] + ' ' + rawDateFrom[1] + ':' + rawDateFrom[2] + '+' + rawDateFrom[3],
        to: rawDateTo[0] + ' ' + rawDateTo[1] + ':' + rawDateTo[2] + '+' + rawDateTo[3]
    };
}

/**
 * Парсинг даты в более удобный массив
 * @param {Object} date 
 * @returns {String[]} 
 */
function parseDate(date) {
    // 'ПН 09:00+3'
    let day = date.split(':')[0].split(' ')[0];
    let hours = date.split(':')[0].split(' ')[1];
    let minutes = date.split(':')[1].split('+')[0];
    let timezone = date.split(':')[1].split('+')[1];

    return [day, hours, minutes, timezone];
}

/**
 * Приводит время грабителя ко времени в часовом поясе банка 
 * @param {String[]} rawDate 
 * @param {Integer} timezone 
 * @returns {String[]}
 */
function normalizeDate(rawDate, timezone) {
    // ['ПН','17','00','5']
    let shift = timezone - parseInt(rawDate[3]);
    let hours = parseInt(rawDate[1]);
    let newHour = hours + shift;
    if (newHour > 24) {
        switch (rawDate[0]) {
            case 'ПН':
                rawDate[0] = 'ВТ';
                break;
            case 'ВТ':
                rawDate[0] = 'СР';
                break;
            case 'СР':
                rawDate[0] = 'ЧТ';
                break;
            default:
                break;
        }
        newHour = Number.parseInt(newHour / 24);
    }
    rawDate[1] = newHour;
    rawDate[3] = timezone;

    return rawDate;
}
