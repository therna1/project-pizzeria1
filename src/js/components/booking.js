import { select, templates, settings, classNames } from '/js/settings.js';
import utils from '/js/utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';



class Booking {
    constructor(element) {
        const thisBooking = this;

        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();

    };

    getData() {
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.dom.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.dom.datePicker.maxDate);
        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ]

        };


        const urls = {
            booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
        }

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),

        ])

            .then(function (allResponses) {
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ])
            })
            .then(function ([bookings, eventsCurrent, eventsRepeat]) {
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat)
            })
    };

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;
        thisBooking.booked = {};

        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table)
        };

        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table)
        };

        let minDate = thisBooking.dom.datePicker.minDate;
        let maxDate = thisBooking.dom.datePicker.maxDate;
        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table)
                };
            };
        };
        
        thisBooking.updateDOM();
    };

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {}
        };

        let startHour = utils.hourToNumber(hour)
        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }
            thisBooking.booked[date][hourBlock].push(table);

        };
    };


    updateDOM() {
        const thisBooking = this;

        thisBooking.date = thisBooking.dom.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.dom.hourPicker.value);

        let allAvailable = false;
        if (typeof thisBooking.booked[thisBooking.date] == 'undefined'
            || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined') {
            allAvailable = true;
        };

        for (let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId)
            };

            table.classList.remove('selected')

            if (!allAvailable
                && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
                table.classList.add(classNames.booking.tableBooked)
            } else {
                table.classList.remove(classNames.booking.tableBooked)
            };
        };
    };


    render(element) {
        const thisBooking = this;

        const HTML = templates.bookingWidget();
        thisBooking.element = utils.createDOMFromHTML(HTML);
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;

        thisBooking.dom.wrapper.appendChild(thisBooking.element);
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.tablesWrapper = thisBooking.dom.wrapper.querySelector('.floor-plan')
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.cart.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.cart.address);
        thisBooking.dom.form = thisBooking.dom.wrapper.querySelector('.booking-form');

    };

    initWidgets() {
        const thisBooking = this;

        thisBooking.dom.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.dom.hourPicker = new HourPicker(thisBooking.dom.hourPicker);


        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.updateDOM();
        });

        thisBooking.dom.tablesWrapper.addEventListener('click', function (event) {
            event.preventDefault();
            if (event.target.classList.contains('table')) {
                if (event.target.classList.contains(classNames.booking.tableBooked)) {
                    alert('zajęty stolik');
                } else {
                    for (let table of thisBooking.dom.tables) {
                        table.classList.remove('selected');
                    };
                    event.target.classList.add('selected');
                };
            };
        });


        thisBooking.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisBooking.sendBooking();
           
        });
    };


    sendBooking() {
        const thisBooking = this;
        const url = settings.db.url + '/' + settings.db.booking;

        let payload = {

            date: thisBooking.dom.datePicker.correctValue,
            hour: thisBooking.dom.hourPicker.correctValue,
            table: [],
            duration: thisBooking.dom.hoursAmount.correctValue,
            ppl: thisBooking.dom.peopleAmount.correctValue,
            starters: [],
            phone: thisBooking.dom.phone.value,
            address: thisBooking.dom.address.value

        };

        for (let table of thisBooking.dom.tables) {
            if (table.classList.contains('selected')) {
                let tableId = table.getAttribute('data-table')
                payload.table.push(tableId)
            };
        };

        let inputs = document.querySelectorAll('.booking-options div .checkbox label input');

        for (let input of inputs) {
            if (input.name == 'starter') {
            };
            if (input.checked == true) {
                payload.starters.push(input.value)
            };
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };
        fetch(url, options)

    };

};

export default Booking;