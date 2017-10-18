'use strict';

const { Timeline } = require('./timeline');

const MIN_AS_MILLIS = 60 * 1000;
const HOUR_AS_MILLIS = 60 * MIN_AS_MILLIS;
const LATER_TIMEOUT = 30 * MIN_AS_MILLIS;

/**
 * Рекурсивная апроксимация пересекающихся временных интервалов
 * @param {Timeline[]} timelines
 * @returns {Timeline[]}
 */
function mergeTimelines(timelines) {
    const merged = timelines.reduce((result, timeline) => {
        for (let i = 0; i < result.length; i++) {
            if (result[i].isIntersected(timeline)) {
                result[i] = result[i].union(timeline);

                return result;
            }
        }

        return result.concat(timeline);
    }, []);

    return (merged.length === timelines.length) ? merged : mergeTimelines(merged);
}

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
exports.getAppropriateMoment = (schedule, duration, workingHours) => {
    const worksIntervals = [
        new Timeline('ПН ' + workingHours.from, 'ПН ' + workingHours.to),
        new Timeline('ВТ ' + workingHours.from, 'ВТ ' + workingHours.to),
        new Timeline('СР ' + workingHours.from, 'СР ' + workingHours.to)
    ];

    const array = mergeTimelines(Object.values(schedule)
        .reduce((result, robber) => result.concat(robber), [])
        .map(timeline => new Timeline(timeline.from, timeline.to)));

    const durationMillis = duration * MIN_AS_MILLIS;

    const moments = worksIntervals.reduce((previous, day) => {
        for (let time = day.from; time <= day.to - durationMillis; time += MIN_AS_MILLIS) {
            const candidate = new Timeline(time, time + durationMillis);
            candidate.timezone = day.timezone;
            candidate.dayFrom = day.dayFrom;

            if (!array.some((timeline) => timeline.isIntersected(candidate))) {
                previous.push(candidate);
            }
        }

        return previous;
    }, []);

    let moment = moments[0];

    return {

        /**
         * Возвращает true, если временной интервал существует
         * @returns {Boolean}
         */
        exists: function () {
            return moment !== undefined;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (this.exists()) {
                const date = new Date(moment.from);
                const timezone = moment.timezone + date.getTimezoneOffset() / 60;
                date.setTime(moment.from + timezone * HOUR_AS_MILLIS);

                return template.replace('%HH', String(date.getHours()).padStart(2, '0'))
                    .replace('%MM', String(date.getMinutes()).padStart(2, '0'))
                    .replace('%DD', moment.dayFrom);
            }

            return '';
        },

        /**
         * Попробовать найти часы для ограбления на 30 минут позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (!this.exists()) {
                return false;
            }

            for (const newMoment of moments) {
                if (newMoment.from >= LATER_TIMEOUT + moment.from) {
                    moment = newMoment;

                    return true;
                }
            }

            return false;
        }
    };
};
