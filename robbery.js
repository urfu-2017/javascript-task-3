'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = false;
let week = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
let index = [0, 24, 48, 72, 96, 120, 144];
const MINUTES_IN_WEEK = 7 * 24 * 60;

let timeZone;

let intervalTime = {
    from: undefined,
    to: undefined
};

// массив с интервалами времени когда все свободны
let freeTime = {};

// массив с интервалами времени когда все заняты
let busyTime;

// массив с интервалами, когда можно провести ограбление
let intervalsForRobbery;

// массив с интервалами для доп задания
let intervalsForTry;

let tryL;
let metka;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    freeTime = {
        Bank: [],
        Robbery: []
    };
    busyTime = [];
    intervalsForRobbery = [];
    intervalsForTry = [];
    tryL = 0;
    parseData(schedule, workingHours);
    // необходимо урезать интервалы в зависимости от времени работы банка
    trimAnIntervals();
    intervalsForRobbery.sort(sortIntervals);
    intervalsForRobbery = selection(duration);
    if (intervalsForRobbery.length !== 0) {
        ifCalltryLater(duration);
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            tryL = 0;
            metka = false;

            return intervalsForRobbery.length !== 0;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            let obj = {};
            if (intervalsForRobbery.length > tryL && !metka) {
                obj = normFormTime(intervalsForRobbery[0]);
            }
            if (metka && tryL <= intervalsForTry.length && intervalsForTry.length !== 0) {
                obj = normFormTime(intervalsForTry[tryL]);
                metka = false;
            }
            if (Object.keys(obj).length) {
                template = template.replace(/%DD/, obj.dayWeek);
                template = template.replace(/%HH/, obj.hour);
                template = template.replace(/%MM/, obj.min);

                return template;
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            tryL++;
            metka = true;
            if (intervalsForTry[tryL] !== undefined) {
                metka = true;

                return true;
            }
            tryL--;

            return false;
        }
    };
};

// ищет следующий интервал который начинается через 30 сек
function ifCalltryLater(duration) {
    findTry(duration, -1);
    for (let i = 0; i < intervalsForRobbery.length - 1; i++) {
        let next = intervalsForRobbery[i + 1].from - intervalsForRobbery[i].to;
        if (next >= 30) {
            findTry(duration, i);
        }
    }
}

// добавляет подходяшие интервалы для доп. условия
function findTry(duration, num) {
    intervalsForTry.push(intervalsForRobbery[num + 1]);
    let dur = 30;
    while (intervalsForRobbery[num + 1].duration - dur >= duration) {
        let inter = {};
        inter.from = intervalsForRobbery[num + 1].from + dur;
        inter.to = intervalsForRobbery[num + 1].to;
        intervalsForTry.push(inter);
        dur += 30;
    }
}

// парсим данные
function parseData(schedule, workingHours) {
    let fromBank = parseTime(workingHours.from, 'bank');
    let toBank = parseTime(workingHours.to, 'bank');
    for (let i = 0; i < 3; i++) {
        let workTime = Object.create(intervalTime);
        workTime.from = fromBank + index[i] * 60;
        workTime.to = toBank + index[i] * 60;
        if (workTime.to === 0) {
            freeTime.Bank = [];

            return;
        }
        freeTime.Bank.push(workTime);
    }
    parseSchedule(schedule.Danny);
    parseSchedule(schedule.Rusty);
    parseSchedule(schedule.Linus);
    interpretatorIntervals();
}

// переводим время в новый формат
function parseTime(time, flag) {
    let assHour = time.split(':');
    let assMin = assHour[1].split('+');
    let newTime = Number(assHour[0]) * 60 + Number(assMin[0]);
    switch (flag) {
        case 'bank':
            timeZone = Number(assMin[1]);
            break;
        case 'from':
            newTime += (timeZone - Number(assMin[1])) * 60;
            break;
        case 'to':
            newTime += (timeZone - Number(assMin[1])) * 60;
            break;
        default:
            break;
    }

    return newTime;
}

// парсим данные воров
function parseSchedule(schedulePeople) {
    if (schedulePeople.length === 0) {
        addNormInterval(0, 72 * 60 - 1);

        return;
    }
    for (let i = 0; i < schedulePeople.length; i++) {
        let dayWeekFrom = schedulePeople[i].from.split(' ');
        let dayWeekTo = schedulePeople[i].to.split(' ');
        let timeFrom;
        let timeTo;
        timeFrom = parseTime(dayWeekFrom[1], 'from');
        timeTo = parseTime(dayWeekTo[1], 'to');
        timeFrom = timeWithWeek(timeFrom, dayWeekFrom[0]);
        timeTo = timeWithWeek(timeTo, dayWeekTo[0]);
        linkage(timeFrom, timeTo);
    }
}

// учитываем день недели для времени
function timeWithWeek(time, dayWeek) {
    for (let i = 0; i < 7; i++) {
        if (dayWeek === week[i]) {
            time += index[i] * 60;
        }
    }

    return withSun(time);
}

// проверка с ВС
function withSun(time) {
    if (time >= MINUTES_IN_WEEK) {
        time = time - MINUTES_IN_WEEK;
    }
    if (time < 0) {
        time = 0;
    }

    return time;
}

// добавление интервалов с занятым временем в массив
function linkage(timeFrom, timeTo) {
    let intervalTimePeople = Object.create(intervalTime);
    intervalTimePeople = checkIntervalIntercection (timeFrom, timeTo, intervalTimePeople);
    busyTime.push(intervalTimePeople);
}

// объединение пересекающихся интервалов с занятым временем
function checkIntervalIntercection(timeFrom, timeTo, intervalCh) {
    for (let i = 0; i < busyTime.length; i++) {
        if (timeFrom >= busyTime[i].from && timeTo <= busyTime[i].to ||
            timeFrom <= busyTime[i].from && timeTo >= busyTime[i].to) {
            busyTime[i].from = Math.min(timeFrom, busyTime[i].from);
            busyTime[i].to = Math.max(timeTo, busyTime[i].to);

            return intervalCh;
        }
        if (timeFrom >= busyTime[i].from && timeFrom <= busyTime[i].to) {
            busyTime[i].to = timeTo;

            return intervalCh;
        }
        if (timeTo <= busyTime[i].to && timeTo >= busyTime[i].from) {
            busyTime[i].from = timeFrom;

            return intervalCh;
        }
    }
    intervalCh.from = timeFrom;
    intervalCh.to = timeTo;

    return intervalCh;
}

// инверсия занятых интервалов
function interpretatorIntervals() {
    let busyTimeSort = busyTime.filter(function (item) {

        return Object.keys(item).length !== 0;
    })
        .sort(function (a, b) {
            return sortIntervals(a, b);
        });
    if (busyTimeSort[0].from !== 0) {
        addNormInterval(0, busyTimeSort[0].from);
    }
    for (let i = 1; i < busyTimeSort.length; i++) {
        addNormInterval(busyTimeSort[i - 1].to, busyTimeSort[i].from);
    }
    if (busyTimeSort[busyTimeSort.length - 1].to < 168 * 60 - 1) {
        addNormInterval(busyTimeSort[busyTimeSort.length - 1].to, 168 * 60 - 1);
    }
}

function sortIntervals(a, b) {

    return a.from - b.from;
}

// добавляем интервал свободного времени в массив
function addNormInterval(from, to) {
    let parseInter = Object.create(intervalTime);
    parseInter.from = from;
    parseInter.to = to;
    freeTime.Robbery.push(parseInter);
}

// урезаем интервалы в зависимости от времениработы банка
function trimAnIntervals() {
    while (freeTime.Robbery.length) {
        bustWithBank();
    }
}

// перебираем в зависимости от работы банка
function bustWithBank() {
    for (let indexBank = 0; indexBank < freeTime.Bank.length; indexBank++) {
        if (compareAndCut(freeTime.Bank[indexBank], freeTime.Robbery[0], indexBank)) {
            break;
        }
    }
}

// функция сравнивания интервалов
function compareAndCut(timeBank, interval, indexBank) {
    if (entrance(timeBank, interval)) {

        return true;
    }
    // входит ли хоть в один интервал банка?
    // удалять только если он не относится ни к одному интервалу банка
    let k = 0;
    freeTime.Bank.forEach(function (element) {
        if (interval.from >= element.from && interval.to <= element.to) {
            k++;
        }
    });
    // удалять только если он не относится ни к одному интервалу банка
    if (k !== 0) {
        freeTime.Robbery.splice(0, 1);
        freeTime.Robbery.push(interval);

        return false;
    }
    if (indexBank === freeTime.Bank.length - 1) {
        freeTime.Robbery.splice(0, 1);
    } else {
        freeTime.Robbery.splice(0, 1);
        freeTime.Robbery.push(interval);
    }
}

// входит только или начало или конец
function entrance(timeBank, interval) {
    // если входит полностью
    if (interval.from >= timeBank.from && interval.to <= timeBank.to) {
        intervalsForRobbery.push({
            from: interval.from,
            to: interval.to,
            duration: interval.to - interval.from
        });
        freeTime.Robbery.splice(0, 1);

        return true;
    }
    // если и начало и конец не входят
    if (interval.from <= timeBank.from && interval.to >= timeBank.to) {
        intervalsForRobbery.push({
            from: timeBank.from,
            to: timeBank.to,
            duration: timeBank.to - timeBank.from
        });
        freeTime.Robbery.splice(0, 1);
        freeTime.Robbery.push({ from: interval.from, to: timeBank.from });
        freeTime.Robbery.push({ from: timeBank.to, to: interval.to });

        return true;
    }
    if (intersection(timeBank, interval)) {

        return true;
    }

    return false;
}

function intersection(timeBank, interval) {
    // если начало не входит, а конец входит в рамки работы банка
    if (interval.from <= timeBank.from &&
        (interval.to <= timeBank.to && interval.to > timeBank.from) &&
        timeBank.from - interval.to !== 0) {
        intervalsForRobbery.push({
            from: timeBank.from,
            to: interval.to,
            duration: interval.to - timeBank.from
        });
        freeTime.Robbery.splice(0, 1);
        freeTime.Robbery.push({ from: interval.from, to: timeBank.from });

        return true;
    }
    // если не входит конец, а начало входит
    if ((interval.from >= timeBank.from && interval.from < timeBank.to) &&
    interval.to >= timeBank.to &&
    interval.from - timeBank.to !== 0) {
        intervalsForRobbery.push({
            from: interval.from,
            to: timeBank.to,
            duration: timeBank.to - interval.from
        });
        freeTime.Robbery.splice(0, 1);
        freeTime.Robbery.push({ from: timeBank.to, to: interval.to });

        return true;
    }

    return false;
}

function selection(duration) {

    return intervalsForRobbery.filter(item => {

        return item.duration >= duration;
    });
}

// перевод данных в нормальный формат времени
function normFormTime(interval) {
    let parseInterval = {};
    let min = interval.from % 60;

    if (min < 10) {
        min = '0' + min;
    }
    parseInterval.min = min;
    let dayWeek = 0;
    for (let i = 0; i < index.length - 1; i++) {
        if (interval.from >= index[i] * 60 && interval.from <= index[i + 1] * 60) {
            dayWeek = i;
        }
    }
    let hour = (interval.from - parseInterval.min - (index[dayWeek] * 60)) / 60;
    if (hour < 10) {
        hour = '0' + hour;
    }
    parseInterval.hour = hour;
    parseInterval.dayWeek = week[dayWeek];

    return parseInterval;
}
