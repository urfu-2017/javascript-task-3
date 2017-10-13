'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

var MIN_PER_DAY = 1440;
var MIN_PER_HOUR = 60;
var DAYS = ['ПН', 'ВТ', 'СР'];

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {

    var answerArray = getAnswerArray();

    var answer = answerArray.length === 0 ? -1 : answerArray[0][0];

    var arrayOfGoodTime = getArrOfGoodTime();

    var tryLaterCounter = 0;

    function getArrOfGoodTime() {
        if (answer < 0) {
            return [];
        }
        var resultArray = [];
        var arr = answerArray;
        var ans = answer;
        for (var i = 0; i < arr.length; i ++) {
            ans = arr[i][0];
            while (ans + duration <= arr[i][1]) {
                resultArray.push(ans);
                ans += 30;
            }
        }
        resultArray.splice(0, 1);

        return resultArray;
    }

    function getBusyIntervals() {

        var arrIntervals = [];

        for (var friend in schedule) {
            if ({}.hasOwnProperty.call(schedule, friend)) {
                arrIntervals = arrIntervals.concat(getArrayOfBusyInterval(schedule[friend]));
            }
        }

        var bankStartWork = getTimestamp(workingHours.from);
        var bankFinishWork = getTimestamp(workingHours.to);
        arrIntervals.push([0, bankStartWork], [bankFinishWork, bankStartWork + MIN_PER_DAY],
            [bankFinishWork + MIN_PER_DAY, bankStartWork + MIN_PER_DAY * 2],
            [bankFinishWork + MIN_PER_DAY * 2, MIN_PER_DAY * 3 - 1]);

        return arrIntervals;
    }

    function getAnswerArray() {
        var busyIntervals = getBusyIntervals();

        var sortAndMergeArray = mergeRange(busyIntervals);

        var start = sortAndMergeArray[0][1];
        var finish = 0;
        var resArray = [];
        for (var i = 1; i < sortAndMergeArray.length; i++) {
            finish = sortAndMergeArray[i][0];
            if (finish - start >= duration) {
                resArray.push([start, finish]);
            }
            start = sortAndMergeArray[i][1];
        }

        return resArray;
    }


    function getArrayOfBusyInterval(scheduleArray) {
        var timeArray = [];
        for (var i = 0; i < scheduleArray.length; i++) {
            timeArray.push(
                [getTimestamp(scheduleArray[i].from),
                    getTimestamp(scheduleArray[i].to)
                ]);
        }

        return timeArray;
    }

    function mergeRange(array) {
        var sortedArray = array.sort(function (a, b) {
            return a[0] - b[0];
        });
        var resultArray = [];
        var prevStart = sortedArray[0][0];
        var prevFinish = sortedArray[0][1];
        for (var i = 1; i < sortedArray.length; i++) {
            if (sortedArray[i][0] <= prevFinish) {
                prevFinish = Math.max(sortedArray[i][1], prevFinish);
            } else {
                resultArray.push([prevStart, prevFinish]);
                prevStart = sortedArray[i][0];
                prevFinish = sortedArray[i][1];
            }
        }
        resultArray.push([prevStart, prevFinish]);

        return resultArray;
    }

    /**
     * Извлекает из строки со временим значение часового пояса
     * @param {String} stringTime строка формата 'ПН 12:00+5'
     * @returns {Number}
     */
    function getUTC(stringTime) {
        return Number(stringTime.substring(stringTime.length - 1));
    }

    /**
     * Получает из записи типа 'ПН 09:00+3' колличество минут // todo заменить всё регуляркой
     * @param {String} stringTime
     * @returns {Number} колличество минут
     */
    function getTimestamp(stringTime) {
        var mainUTC = getUTC(workingHours.from);
        if (stringTime.length === 7) {
            var h = Number(stringTime.substring(0, 2));
            var m = Number(stringTime.substring(3, 5));

            return m + MIN_PER_HOUR * h;
        }
        var day = 0;
        if (stringTime.substring(0, 2) === 'ВТ') {
            day = MIN_PER_DAY;
        } else if (stringTime.substring(0, 2) === 'СР') {
            day = MIN_PER_DAY * 2;
        }
        var UTC = getUTC(stringTime);
        var hours = Number(stringTime.substring(3, 5));
        var minuts = Number(stringTime.substring(6, 8));

        return minuts + MIN_PER_HOUR * hours + MIN_PER_HOUR * (mainUTC - UTC) + day;
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return answer >= 0;
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
            var day = Math.floor(answer / MIN_PER_DAY);
            var hours = Math.floor((answer - day * MIN_PER_DAY) / MIN_PER_HOUR);
            var minutes = answer - day * MIN_PER_DAY - hours * MIN_PER_HOUR;

            var dayStr = DAYS[day];

            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (hours < 10) {
                hours = '0' + hours;
            }

            return template.replace(/%DD/, dayStr)
                .replace(/%HH/, hours)
                .replace(/%MM/, minutes);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists() || arrayOfGoodTime.length === tryLaterCounter) {
                return false;
            }
            answer = arrayOfGoodTime[tryLaterCounter];
            tryLaterCounter++;

            return true;
        }
    };
};
