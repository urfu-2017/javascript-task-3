'use strict';
var robbery = require('./robbery');

var gangSchedule = {
    Danny: [
        { from: 'ПН 12:00+5', to: 'ПН 17:00+5' },
        { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
    ],
    Rusty: [
        { from: 'ПН 11:30+5', to: 'ПН 16:30+5' },
        { from: 'ВТ 13:00+5', to: 'ВТ 16:00+5' }
    ],
    Linus: [
        { from: 'ПН 09:00+3', to: 'ПН 14:00+3' },
        { from: 'ПН 21:00+3', to: 'ВТ 09:30+3' },
        { from: 'СР 09:30+3', to: 'СР 15:00+3' }
    ]
};

var bankWorkingHours = {
    from: '10:00+5',
    to: '18:00+5'
};

var longMoment = robbery.getAppropriateMoment(gangSchedule, 90, bankWorkingHours);
longMoment.exists();
console.info(longMoment.format());
