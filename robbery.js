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
    let GMT = workingHours.from.split('+')[1]; // Создаю базовый часовой пояс - пояс банка
    // Создаю расписание из schedule в удобной для работы форме
    let rasp = createRasp(schedule, GMT, workingHours);

    let freeTime = []; // Массив свободны минут (!)
    for (let i = 0; i < (72 * 60); i += 1) { // Заполняю массив, сверяя свободность каждой минуты
        if (elementInInterval(i, rasp.Danny) === false &&
            elementInInterval(i, rasp.Rusty) === false &&
            elementInInterval(i, rasp.Linus) === false &&
            elementInInterval(i, rasp.Bank) === true) {

            freeTime.push(i); // Пушу минуту в массив, если свободна
        }
    }
    let groupFreeTimes = groupMinutes(freeTime); // Группирую свободные минуты в интервалы(массивы)
    let startTimes = findTimeToStart(groupFreeTimes, duration); // Массив стартовых минут

    let startTimeCounter = 0; // Счетчик для вывода нужного стартового времени(Смотри методы ниже)

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (startTimes.length) { // Если существует хоть одна запись
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
            if (startTimes.length) {
                return template
                    .replace('%HH', startTimes[startTimeCounter][1])
                    .replace('%MM', startTimes[startTimeCounter][2])
                    .replace('%DD', startTimes[startTimeCounter][0]);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            // Если существует следующий элемент, то значит альтернатива
            // Есть и счетчик стартовыхВремен ++ 
            if (startTimes[startTimeCounter + 1]) {
                startTimeCounter += 1;

                return true;
            }

            return false;
        }
    };
};
// Создаю удобное расписание из schedule
function createRasp(schedule, GMT, workingHours) {
    let rasp = {};
    for (const person in schedule) {
        if (person) {
            rasp[person] = [];
            schedule[person].forEach(info => {
                let fromData = info.from.match(/\d+/g); // Пример ['12', '30', '5']
                let toData = info.to.match(/\d+/g);
                let delta = GMT - fromData[2]; // Считаю разницу в часовых поясах

                let fromDay = info.from.split(' ')[0]; // Пример 'ПН'
                let toDay = info.to.split(' ')[0];

                let fromDataToTime = dateToMinutes(fromData, delta, fromDay); // Перевожу в минуты
                let toDataToTime = dateToMinutes(toData, delta, toDay); // Перевожу в минуты

                rasp[person].push([fromDataToTime, toDataToTime]); // Пушу новый ОТиДО
            });
        }
    }

    rasp.Bank = addBankToRasp(workingHours, GMT); // Отдельно добавляю банк

    return rasp;
}

function dateToMinutes(timeData, delta, Day) {
    // Формирю время в минутах как (ЧАСЫ + дельтаЧасовыхПоясов) * на 60 минут + минуты
    let time = (Number(timeData[0]) + Number(delta)) * 60 + Number(timeData[1]);
    if (Day === 'ВТ') { // Если день вторник, то накинуть ко времени еще сутки(в минутах)
        time += 24 * 60;
    }
    if (Day === 'СР') { // Аналогично
        time += 48 * 60;
    }
    // Обрабатываю, если вышло за грани начшего часового пояса, то ставить границу
    if (time < 0) {
        time = 0;
    }

    if (time > 72 * 60) {
        time = 72 * 60;
    }

    return time;
}

function addBankToRasp(workingHours, GMT) {
    let fromData = workingHours.from.match(/\d+/g);
    let toData = workingHours.to.match(/\d+/g);
    let delta = Number(GMT) - Number(fromData[2]);
    let fromDataToTime = dateToMinutes(fromData, delta, 'ПН'); // Т.к. банк ежедневный -> ПН пойдет
    let toDataToTime = dateToMinutes(toData, delta, 'ПН');

    if (fromDataToTime !== toDataToTime) {
        // Возвращаю свободные часы банка на каждый день
        return [[fromDataToTime, toDataToTime],
            [fromDataToTime + (24 * 60), toDataToTime + (24 * 60)],
            [fromDataToTime + (48 * 60), toDataToTime + (48 * 60)]];
    }

    return [];
}

function elementInInterval(el, intervals) {
    // Есть ли минута(ее номер) в заданом интервале [от;до)
    let booleanReturn = false;
    booleanReturn = intervals.some(interval => el >= interval[0] && el < interval[1]);

    return booleanReturn;
}

function groupMinutes(freeTime) {
    // Группирую минуты в массиве минут
    // Из [0,1,2,3,23,24,994,995,996] -> [[0,1,2],[23,23],[994,995,996]]
    let findGroupArray = [];
    for (let i = 0; i < freeTime.length;) {
        let arr = [];
        do {
            arr.push(freeTime[i]);
            i += 1;
        } while (freeTime[i - 1] + 1 === freeTime[i]);
        findGroupArray.push(arr);
    }

    return findGroupArray;
}

function findTimeToStart(groupFreeTime, duration) {
    // Ищу подходящее время для старта, если кол-во минут в интервале
    // Мнеьше или равно времени ограбления
    // Также шагаю по полчаса для нахождения соседнего времени
    // В одном и том же интервале(Это для допЗадания)
    let startArray = [];
    groupFreeTime.forEach((interval) => {
        if (duration <= interval.length) {
            startArray.push(interval[0]);
        }

        let extraDuration = duration + 30;
        let extraCounter = 1;
        while (extraDuration <= interval.length) {
            startArray.push(interval[0 + (extraCounter * 30)]);
            extraDuration = extraDuration + 30;
            extraCounter += 1;
        }
    });
    // Привожу в минуты в вид [День, Час, Минута]
    startArray.forEach((time) => {
        let hour = parseInt(time / 60);
        let minute = time % 60;
        let day = 'ПН';
        if (hour >= 24 && hour < 48) {
            hour -= 24;
            day = 'ВТ';
        }
        if (hour >= 48 && hour <= 72) {
            hour -= 48;
            day = 'СР';
        }
        hour = timeToPretty(hour);
        minute = timeToPretty(minute);
        startArray[startArray.indexOf(time)] = [day, hour, minute];
    });

    return startArray;
}

function timeToPretty(hourMinute) {
    // Обрабатываю числа 0-9 в вид 00-09
    if (hourMinute >= 0 && hourMinute < 10) {
        return ('0' + hourMinute);
    }

    return hourMinute;
}
