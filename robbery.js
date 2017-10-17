'use strict';

const DATE_FORMAT = /(ПН|ВТ|СР)\s(\d\d):(\d\d)\+(\d)/;
const DAYS = { 'ПН': 1, 'ВТ': 2, 'СР': 3 };
const MILLIS_OF_MIN = 60000;
const TRY_COOLDOWN = 30 * MILLIS_OF_MIN;

function parseDate(date) {
    const [, day, hours, minutes, timezone] = date.match(DATE_FORMAT);

    return Date.UTC(2017, 4, DAYS[day], hours - timezone, minutes);
}

class AppropriateMoment {

    /**
     * @param {Object} schedule – Расписание Банды
     * @param {Number} duration - Время на ограбление в минутах
     * @param {Object} workingHours – Время работы банка
     * @param {String} workingHours.from – Время открытия, например, "10:00+5"
     * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
     */
    constructor(schedule, duration, workingHours) {
        const bankSchedule = Object.keys(DAYS).map(day => ({
            from: parseDate(`${day} ${workingHours.from}`),
            to: parseDate(`${day} ${workingHours.to}`)
        }));

        const gangSchedule = this._mergeTimelines(Object.values(schedule)
            .map(robber => robber.map(t => ({
                from: parseDate(t.from),
                to: parseDate(t.to)
            })))
        );

        duration = duration * MILLIS_OF_MIN;

        this._moments = bankSchedule.reduce((result, day) => {
            for (let from = day.from; from <= day.to - duration; from += TRY_COOLDOWN) {
                const candidate = { from, to: from + duration };

                if (!gangSchedule.some((timeline) => this._areIntersected(timeline, candidate))) {
                    result.push(candidate.from);
                }
            }

            return result;
        }, []).reverse();

        this._moment = this._moments.pop();
        this._bankTimezone = Number(workingHours.to.split('+')[1]);
    }

    /**
     * Найдено ли время
     * @returns {Boolean}
     */
    exists() {
        return Boolean(this._moment);
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


        const offsetInMillis = this._bankTimezone * 60 * MILLIS_OF_MIN;
        const date = new Date(this._moment + offsetInMillis);

        return template
            .replace('%HH', date.getUTCHours())
            .replace('%MM', String(date.getUTCMinutes()).padStart(2, '0'))
            .replace('%DD', Object.keys(DAYS)[date.getUTCDay() - 1]);
    }

    /**
     * Попробовать найти часы для ограбления позже [*]
     * @star
     * @returns {Boolean}
     */
    tryLater() {
        if (this.exists() && this._moments.length !== 0) {
            this._moment = this._moments.pop();

            return true;
        }

        return false;
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
                    mergedTimeline.from = Math.min(mergedTimeline.from, timeline.from);
                    mergedTimeline.to = Math.max(mergedTimeline.to, timeline.to);

                    return result;
                }
            }

            return result.concat(timeline);
        }, []);

        return (merged.length === timelines.length) ? merged : this._mergeTimelines(merged);
    }

    /**
     * Пересекаются ли временные отрезки
     * @param {Object} timeline1 
     * @param {Object} timeline2
     * @returns {Boolean}
     */
    _areIntersected(timeline1, timeline2) {
        return timeline1.from < timeline2.to && timeline1.to > timeline2.from;
    }
}

exports.isStar = true;
exports.getAppropriateMoment = (schedule, duration, workingHours) =>
    new AppropriateMoment(schedule, duration, workingHours);
