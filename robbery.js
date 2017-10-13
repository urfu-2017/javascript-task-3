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
    // Создаю расписание из schedule в удобной для работы форме
    let rasp = createRasp(schedule, workingHours);
    // Создаю массив из свободных/занятых "получасов"
    let timeMap = createTimeMap(rasp);
    // Создаю массив интервалов, когда все свободны(включая открытый банк)
    let timeToWorkArray = findMoment(timeMap);
    // Узнаю, сколько "получасов" необходимо для ограбления
    let halfHours = parseInt(duration / 30);
    halfHours += (duration % 30 !== 0 ? 1 : 0);
    // Нахожу все точные даты старта ограбления в исходной форме
    let timeToStart = [];
    timeToWorkArray.forEach((interval) => {
        if (interval.length >= halfHours) {
            timeToStart.push(toMainViewDate(interval[0] / 2, // Количество часов
                Number(workingHours.from.split('+')[1]))); // Часовой пояс банка
        }
    });

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            // Если в массиве начал ограблений есть запись
            if (timeToStart.length) {
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
            // Если в массиве начал ограблений есть запись
            if (timeToStart.length) {
                // Заменяю в шаблоне данные
                template = template.replace('%HH', timeToStart[0][1]);
                if (timeToStart[0][2] === 0) {
                    timeToStart[0][2] = '00';
                }
                template = template.replace('%MM', timeToStart[0][2]);
                template = template.replace('%DD', timeToStart[0][0]);

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
            return false;
        }
    };
};
// Создаю удобное расписание из schedule
function createRasp(schedule, workingHours) {
    let rasp = {};
    // Перебираю каждую запись-человека в объекте и добавляю удобное
    // Время старта, привденное к +0 часовому поясу и
    // Если учесть, что на ограбление 3 дня, значит
    // Всего 72 часа в сумме, расмотрим их как 0-72 часы начала
    // Пример: ВТ 11:00+5 станет => ВТ 6:00+0 => 30:00
    for (const person in schedule) {
        if (person) {
            rasp[person] = [];
            schedule[person].forEach((info) => {
                rasp[person].push([prettyDate(info.from), prettyDate(info.to)]);
            });
        }
    }
    // Отдельно часы работы банка, зацикленные на каждый день
    rasp.Bank = [];
    for (let i = 0; i < 3; i++) {
        rasp.Bank.push([prettyDate(workingHours.from) + 24 * i,
            prettyDate(workingHours.to) + 24 * i]);
    }

    return rasp;
}
// К рабочему виду
function prettyDate(timeString) {
    let returnTimeInHours = 0;
    let dayOfWeek = timeString.match(/[А-Я]+/g);
    let timeStringValues = timeString.match(/\d+/g);
    if (dayOfWeek && dayOfWeek[0] === 'ПН') {
        returnTimeInHours += 0;
    }
    if (dayOfWeek && dayOfWeek[0] === 'ВТ') {
        returnTimeInHours += 24;
    }
    if (dayOfWeek && dayOfWeek[0] === 'СР') {
        returnTimeInHours += 48;
    }
    returnTimeInHours += (Number(timeStringValues[0]) - Number(timeStringValues[2]));
    returnTimeInHours += (Number(timeStringValues[1]) !== 0 ? 0.5 : 0);

    return returnTimeInHours;
}
// Принимая время работы создаем массив из 144 получасов в 72 часах
function createTimeArrayPerson(time) {
    let timeArray = [];
    for (let i = 0; i < 144; i++) {
        timeArray.push(' ');
    }
    time.forEach((interval) => {
        let start = interval[0];
        let end = interval[1];
        for (let i = start; i < end; i += 0.5) { // Шагая по получасу, добавляем в ячейки
            timeArray[i * 2] = 1;
        }
    });

    return timeArray;
}
// Банк аналогичен, только в часы работы он свободен(инверсия человеку)
function createTimeArrayBank(time) {
    let timeArray = [];
    for (let i = 0; i < 144; i++) {
        timeArray.push(1);
    }
    time.forEach((interval) => {
        let start = interval[0];
        let end = interval[1];
        for (let i = start; i < end; i += 0.5) {
            timeArray[i * 2] = ' ';
        }
    });

    return timeArray;
}
// Создаю массивы свободности человека по получасам
// Т.е. [0,0,0,1,1,1,1...] Значит, что человек свободен с 01:30 и т.д.
// Для банка отдельно(инверсия занятости)
function createTimeMap(rasp) {
    let timeMap = [];
    for (const person in rasp) {
        if (person !== 'Bank') {
            timeMap.push(createTimeArrayPerson(rasp[person]));
        } else {
            timeMap.push(createTimeArrayBank(rasp[person]));
        }
    }

    return timeMap;
}
// Находим нужные моменты как сравнение свободности всех
// Троих участников и банка в каждый получас, и сохраняем 
// Порядковый номер этого получаса
function findMoment(timeMap) {
    let findArray = [];
    for (let i = 0; i < 144; i++) {
        if (timeMap[0][i] === timeMap[1][i] &&
            timeMap[1][i] === timeMap[2][i] &&
            timeMap[2][i] === timeMap[3][i] &&
            timeMap[3][i] === ' ') {
            findArray.push(i);
        }
    }
    // Группируем получасы, котоыре идут подряд, в один интервал
    let findGroupArray = [];
    for (let i = 0; i < findArray.length;) {
        let arr = [];
        do {
            arr.push(findArray[i]);
            i += 1;
        } while (findArray[i - 1] + 1 === findArray[i]);
        findGroupArray.push(arr);
    }

    return findGroupArray;
}
// Приводим дату к исходному виду, учитывая часовой пояс банка
function toMainViewDate(hours, GMT) {
    let mainDate = [];
    let dayOfWeek = parseInt(hours / 24);
    if (dayOfWeek === 0) {
        mainDate.push('ПН');
        mainDate.push(hours - 0 - (hours % 1) + GMT);
        mainDate.push(hours % 1 * 60);
    }
    if (dayOfWeek === 1) {
        mainDate.push('ВТ');
        mainDate.push(hours - 24 - (hours % 1) + GMT);
        mainDate.push(hours % 1 * 60);
    }
    if (dayOfWeek === 2) {
        mainDate.push('СР');
        mainDate.push(hours - 48 - (hours % 1) + GMT);
        mainDate.push(hours % 1 * 60);
    }

    return mainDate;
}
