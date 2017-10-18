'use strict';

const DATE_STRING_FORMAT = /(ПН|ВТ|СР)\s(\d\d):(\d\d)\+(\d+)/;
const DAYS = { 'ПН': 1, 'ВТ': 2, 'СР': 3 };
const MINUTE_AS_MILLISECONDS = 60 * 1000;
const HOUR_AS_MILLISECONDS = 60 * MINUTE_AS_MILLISECONDS;

/**
 * Конвертирует строковое представление времени в UNIX time
 * @param {String} date
 * @returns {Number}
 */
function parseDateString(date) {
    const [, day, hours, minutes, timezone] = DATE_STRING_FORMAT.exec(date);

    return Date.parse(`${DAYS[day]} Jan 2017 ${hours}:${minutes}:00 GMT+${timezone}`);
}

class AppropriateMoment {

    /**
     * @param {Object} schedule – Расписание Банды
     * @param {Object[]} workingHours – Расписание работы банка
     * @param {Number} duration - Время на ограбление в миллисекундах
     */
    constructor(schedule, workingHours, duration) {
        const bankSchedule = workingHours.map(this._parseTimeline);
        const gangSchedule = this._mergeTimelines(Object.values(schedule).reduce((result, robber) =>
            result.concat(robber.map(this._parseTimeline)), []));

        this._moments = bankSchedule.reduce((result, day, index) => {
            for (let time = day.from; time <= day.to - duration; time += MINUTE_AS_MILLISECONDS) {
                const candidate = { from: time, to: time + duration };
                if (gangSchedule.every((timeline) => !this._areIntersected(timeline, candidate))) {
                    result.push({ time, day: Object.keys(DAYS)[index] });
                }
            }

            return result;
        }, []).reverse();

        this._moment = this._moments.pop();
        this._bankTimezone = Number(workingHours[0].from.split('+')[1]);
    }

    /**
     * Найдено ли время
     * @returns {Boolean}
     */
    exists() {
        return this._moment !== undefined;
    }

    /**
     * Возвращает отформатированную строку с часами для ограбления
     * Например,
     *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
     * @param {String} template
     * @returns {String}
     */
    format(template) {
        if (!this.exists()) {
            return '';
        }

        const date = new Date(this._moment.time);
        const timezone = this._bankTimezone + date.getTimezoneOffset() / 60;
        date.setTime(this._moment.time + timezone * HOUR_AS_MILLISECONDS);
        console.info(this._moment);

        return template
            .replace('%DD', this._moment.day)
            .replace('%HH', date.getHours())
            .replace('%MM', String(date.getMinutes()).padStart(2, '0'));
    }

    /**
     * Попробовать найти часы для ограбления позже [*]
     * @star
     * @returns {Boolean}
     */
    tryLater() {
        return false;
    }

    /**
     * Конвертирует концы временного отрезка из строкового представления в UNIX time
     * @param {Object} timeline
     * @param {String} timeline.from
     * @param {String} timeline.to
     * @returns {Object}
     */
    _parseTimeline(timeline) {
        return { from: parseDateString(timeline.from), to: parseDateString(timeline.to) };
    }

    /**
     * Проверяет пересекаются ли временные отрезки
     * @param {Object} timeline1 
     * @param {Object} timeline2
     * @returns {Boolean}
     */
    _areIntersected(timeline1, timeline2) {
        return (
            (timeline1.from <= timeline2.from && timeline1.to >= timeline2.to) ||
            (timeline2.from <= timeline1.from && timeline2.to >= timeline1.to) ||
            (timeline1.from < timeline2.from && timeline1.to > timeline2.from) ||
            (timeline1.to > timeline2.to && timeline1.from < timeline2.to)
        );
    }

    /**
     * Объединяет пересекающиеся временные отрезки
     * @param {Array} timelines
     * @returns {Array}
     */
    _mergeTimelines(timelines) {
        const merged = timelines.reduce((result, timeline) => {
            for (const mergedTimeline of result) {
                if (this._areIntersected(mergedTimeline, timeline)) {
                    mergedTimeline.from = mergedTimeline.from <= timeline.from
                        ? mergedTimeline.from : timeline.from;

                    mergedTimeline.to = mergedTimeline.to >= timeline.to
                        ? mergedTimeline.to : timeline.to;

                    return result;
                }
            }

            return result.concat(timeline);
        }, []);

        return (merged.length === timelines.length) ? merged : this._mergeTimelines(merged);
    }
}

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
 * @returns {AppropriateMoment}
 */
exports.getAppropriateMoment = (schedule, duration, workingHours) => {
    const bankSchedule = [
        { from: `ПН ${workingHours.from}`, to: `ПН ${workingHours.to}` },
        { from: `ВТ ${workingHours.from}`, to: `ВТ ${workingHours.to}` },
        { from: `СР ${workingHours.from}`, to: `СР ${workingHours.to}` }
    ];

    return new AppropriateMoment(schedule, bankSchedule, duration * MINUTE_AS_MILLISECONDS);
};
