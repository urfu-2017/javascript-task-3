'use strict';

/**
 *Функция возвращает true, если минутные отрезки segment1 и segment2 пересекаются.
 *@param {Segment} segment1
 *@param {Segment} segment2
 *@returns {Boolean}
 */
function isIntersection(segment1, segment2) {
    let arr = [segment1, segment2];
    arr.sort((s1, s2) => s1.start - s2.start);
    let first = arr[0];
    let second = arr[1];

    return (first.end <= second.end && first.end > second.start) ||
           (first.start <= second.start && first.end >= second.end);

}

/**
 * Функция выбирает время наиболее ранней возможности ограбления.
 * @param {Segment} workingSegment - время, когда банк работает.
 * @param {Number} [start] - ограбление должно начаться не позже этого времени.
 * @returns {Number} 
 */
function getStartingMoment(workingSegment, start) {
    if (start !== undefined && start >= workingSegment.start) {
        return start;
    }

    return workingSegment.start;
}

/**
 *Возвращает true, если в указанный промежуток времени (assumeSegmentRobbery)
 *ограбление возможно.
 *@param {Segment} assumeSegmentRobbery
 *@param {Segment[]} busySegments - массив объектов вида как и assumeSegmantRobbery.
 *Каждый элемент массива - момент времени когда грабитель занят.
 *@returns {Boolean} 
 */
function canRobbery(assumeSegmentRobbery, busySegments) {
    for (let busySegment of busySegments) {
        if (isIntersection(assumeSegmentRobbery, busySegment)) {
            return false;
        }
    }

    return true;
}

/**
 *Вернет временной отрезок, если ограбление возможно в промежутке workingSegment.
 *если ограбление невозможно, вернется null. 
 *@param {Segment} workingSegment - рабочее время банка.
 *@param {Segment[]} busySegments - время (минутные отрезки), когда грабители заняты.
 *@param {Number} durationWork
 *@param {Number} startingMonent - момент не раньше которого должно начаться ограбление
 *@returns {Segment | null}
 */
function getSegmentRobbery(workingSegment, busySegments, durationWork, startingMonent) {
    for (let assumeStartRobbery = startingMonent;
        assumeStartRobbery + durationWork <= workingSegment.end;
        assumeStartRobbery++) {
        let segmentRobbery = {
            start: assumeStartRobbery,
            end: assumeStartRobbery + durationWork
        };
        if (canRobbery(segmentRobbery, busySegments)) {
            return segmentRobbery;
        }
    }

    return null;
}

/**
 * Функция возвращает отрезок времени в который возможно произвести ограбление,
 * если ограбление невозможно - вернется null
 * @param {Segment[]} workingSegments - рабочие часы банка в форме минутных отрезков.
 * @param {Segment[]} busySegments - моменты времени в форме минутных отрезков,
 *                                   когда бандиты заняты.
 * @param {Number} durationWork - продолжительность ограбления.
 * @param {Number} [start] - начало ограбления.
 * @returns {Segment|null} 
 */
function findSegmentRobbery(workingSegments, busySegments, durationWork, start) {
    for (let workingSegment of workingSegments) {
        let startingMoment = getStartingMoment(workingSegment, start);
        let segmentRobbery = getSegmentRobbery(workingSegment, busySegments,
            durationWork, startingMoment);
        if (segmentRobbery !== null) {
            return segmentRobbery;
        }
    }

    return null;
}

module.exports.findSegmentRobbery = findSegmentRobbery;
