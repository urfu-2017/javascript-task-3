'use strict';

/**
 *Функция возвращает true, если минутные отрезки segment1 и segment2 пересекаются.
 *@param {Object} segment1 - объекта вида {start:number, end: number, timezone:number}
 *@param {Object} segment2
 *@returns {Boolean}
 */
function isIntersection(segment1, segment2) {
    let first;
    let second;
    if (segment1.start <= segment2.start) {
        first = segment1;
        second = segment2;
    } else {
        first = segment2;
        second = segment1;
    }

    return (first.end <= second.end && first.end > second.start) ||
           (first.start <= second.start && first.end >= second.end);

}

function getStartingMoment(workingSegment, start) {
    if (start !== undefined && start >= workingSegment.start) {
        return start;
    }

    return workingSegment.start;
}

/**
 *Возвращает true, если в указанный промежуток времени (assumeSegmentRobbery)
 *ограбление возможно.
 *@param {Object} assumeSegmentRobbery - объект вида {start: number, end: number, zimezone:number}
 *@param {Array} busySegments - массив объектов вида как и assumeSegmantRobbery.
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
 *@param {Object} workingSegment - рабочее время банка.
 *@param {Array} busySegments - время (минутные отрезки), когда грабители заняты.
 *@param {Number} durationWork
 *@param {Number} startingMonent - момент не раньше которого должно начаться ограбление
 *@returns {Object}
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


function findSegmentRobbery(workingSegments, busySegments, durationWork, start) {
    for (let workingSegment of workingSegments) {
        let startingMonent = getStartingMoment(workingSegment, start);
        let segmentRobbery = getSegmentRobbery(workingSegment, busySegments,
            durationWork, startingMonent);
        if (segmentRobbery !== null) {
            return segmentRobbery;
        }
    }

    return null;
}

module.exports.findSegmentRobbery = findSegmentRobbery;
