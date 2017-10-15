'use strict';

function areIntersected(interval1, interval2) {
    return interval1.to >= interval2.from && interval1.from <= interval2.to;
}

exports.mergeIntervals = function (intervals) {
    let result = [];
    intervals.sort((a, b) => a.from < b.from ? -1 : 1);
    result.push(intervals[0]);
    for (let i = 1; i < intervals.length; i++) {
        let last = result[result.length - 1];
        if (!areIntersected(last, intervals[i])) {
            result.push(intervals[i]);
            continue;
        }
        if (last.to < intervals[i].to) {
            last.to = intervals[i].to;
        }
    }

    return result;
};

exports.cutBeginning = function (mergedIntervals, beginning) {
    let length = mergedIntervals.length;
    for (let i = 0; i < length; i++) {
        if (mergedIntervals[i].to < beginning) {
            mergedIntervals.shift();
            i--;
            length = mergedIntervals.length;
            continue;
        }
        if (mergedIntervals[i].from < beginning) {
            mergedIntervals[i].from = beginning;
            continue;
        }
        break;
    }
};

exports.cutEnd = function (mergedIntervals, end) {
    for (let i = mergedIntervals.length - 1; i >= 0; i--) {
        if (mergedIntervals[i].from > end) {
            mergedIntervals.pop();
            continue;
        }
        if (mergedIntervals[i].to > end) {
            mergedIntervals[i].to = end;
            continue;
        }
        break;
    }
};

exports.cutEnds = function (mergedIntervals, beginning, end) {
    exports.cutBeginning(mergedIntervals, beginning);
    exports.cutEnd(mergedIntervals, end);
    if (mergedIntervals.length === 0) {
        mergedIntervals.unshift({ from: beginning, to: beginning });
        mergedIntervals.push({ from: end, to: end });
    }
    if (mergedIntervals[0].from > beginning) {
        mergedIntervals.unshift({ from: beginning, to: beginning });
    }
    if (mergedIntervals[mergedIntervals.length - 1].to < end) {
        mergedIntervals.push({ from: end, to: end });
    }
};
