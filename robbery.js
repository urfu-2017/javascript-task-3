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
    // сюда пишется код реализации, а в ретёрнах ретёрна выводящие функцяшки
    // основная собирает 3 переменные как 3 строки и передаёт далее
    // доп. взять строки и убрать последнюю часть отвечающуу за часовой пояс и представить время в нужном формате

    function mainFunction() {
        let mainTimeZone = workingHours.from.substring
            ((workingHours.from.length - 1), workingHours.from.length);
        for (let i = 0; i >= 3; i++) {
            let newValueDanny = timeAdaptation(
                mainTimeZone, gangSchedule.Danny[i].from, gangSchedule.Danny[i].to);
            let newValueRusty = timeAdaptation(
                mainTimeZone, gangSchedule.Rusty[i].from, gangSchedule.Rusty[i].to);
            let newValueLinus = timeAdaptation(
                mainTimeZone, gangSchedule.Linus[i].from, gangSchedule.Linus[i].to);

            let searchOpportunity = searchOpportunity(
                newValueDanny, newValueRusty, newValueLinus);
            if (searchOpportunity) {
                return true;
            } else {

                return false;
            }
        }
    }

    // адптирует время под часовой пояс банка 
    function timeAdaptation(tz, begin, end) {
        let current = begin.substring(begin.length - 1, begin.length);
        begin = parseToDate(begin.substring(3, 8));
        end = parseToDate(end.substring(3, 8));
        let shift = tz - current;
        if (current !== tz) {
            begin.setHours(begin.getHours + shift);
            end.setHours(end.getHours + shift);
            //begin = performance(begin, shift);
            //end = performance(end, shift);
        }

        return { begin, end }
    }

    // переводит время в нужный диапазон по заданному сдвигу
    /*function performance(str, shift) {
        let num = Number(str.slice(0, 2)) + shift;
        str = str.replace(Number(str.slice(0, 2)), num);

        return str;
    }*/

    // эта фунция выясняет совпадет ли возможное совместное время для операции (если оно есть)
    function searchOpportunity(DannyOpp, RustyOpp, LinusOpp) {
        let optimalStart = optimalStart(DannyOpp.from, RustyOpp.from, LinusOpp.from);
        let optimalEnd = optimalStart(DannyOpp.to, RustyOpp.to, LinusOpp.to);
        if (optimalStart >= optimalEnd) {
            return false;
        } else {
            return difOfTime(optimalEnd, optimalStart);
        }
    }

    function difOfTime(time1, time2) {
        time1 = parseToDate(time1);
        time2 = parseToDate(time2);
        let resul = (time1 - time2) / 60000;
        return resul;
    }

    function parseToDate(str) {
        //let time = new Date('', '', '', time1.slice(0, 2), time1.slice(3, 6), 00, 00);
        let time = new Date;
        time.setHours(str.slice(0, 2));
        time.setMinutes(str.slice(3, 6));
        time.setSeconds(00);
        time.setMilliseconds(00);
        return time;
    }
    // исправить на никин алго
    function optimalStart(t1, t2, t3) {
        t1 = parseToDate(t1);
        t2 = parseToDate(t2);
        t3 = parseToDate(t3);
        let max;
        if (t1 > t2 && t1 > t3) {
            max = t1;
        } else if (t2 > t3) {
            max = t2;
        } else {
            max = t3;
        }

        return max;
    }

    function optimalEnd(t1, t2, t3) {
        t1 = parseToDate(t1);
        t2 = parseToDate(t2);
        t3 = parseToDate(t3);
        let min;
        if (t1 < t2 && t1 < t3) {
            min = t1;
        } else if (t2 < t3) {
            min = t2;
        } else {
            min = t3;
        }

        return min;
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (mainFunction()){
                return true;
            } else {
                return false;
            }
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            return template;
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
