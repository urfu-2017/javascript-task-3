'use strict';

let robbery = require('./robbery');

let gangSchedule = {
    Danny: [
        { from: 'ПН 01:30+5', to: 'ПН 20:00+5' },
        { from: 'ВТ 09:00+5', to: 'ВТ 20:00+5' },
        { from: 'СР 09:00+5', to: 'СР 20:00+5' }
    ],
    Rusty: [
        { from: 'ПН 13:00+5', to: 'ПН 20:00+5' },
        { from: 'ВТ 09:00+5', to: 'ВТ 20:00+5' },
        { from: 'СР 09:00+5', to: 'СР 20:00+5' }
    ],
    Linus: [
        { from: 'ПН 13:00+5', to: 'ПН 20:00+5' },
        { from: 'ВТ 09:00+5', to: 'ВТ 20:00+5' },
        { from: 'СР 09:00+5', to: 'СР 20:00+5' }
    ]
};

let bankWorkingHours = {
    from: '00:00+5',
    to: '23:59+5'
};

// Время не существует
let longMoment = robbery.getAppropriateMoment(gangSchedule, 121, bankWorkingHours);

// Выведется false и ""
console.info(longMoment.exists());
console.info(longMoment.format('Метим на %DD, старт в %HH:%MM!'));

// Время существует
let moment = robbery.getAppropriateMoment(gangSchedule, 90, bankWorkingHours);

// Выведется true и "Метим на ВТ, старт в 11:30!"
console.info(moment.exists());
console.info(moment.format('Метим на %DD, старт в %HH:%MM!'));

if (robbery.isStar) {
    // Вернет true
    moment.tryLater();
    // "ВТ 16:00"
    console.info(moment.format('%DD %HH:%MM'));

    // Вернет true
    moment.tryLater();
    // "ВТ 16:30"
    console.info(moment.format('%DD %HH:%MM'));

    // Вернет true
    moment.tryLater();
    // "СР 10:00"
    console.info(moment.format('%DD %HH:%MM'));

    // Вернет false
    moment.tryLater();
    // "СР 10:00"
    console.info(moment.format('%DD %HH:%MM'));
}
