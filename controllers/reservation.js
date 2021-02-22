const reservationRouter = require('express').Router()
const time = require('../models/time')

//Add a reservation
reservationRouter.post("/", (req, res) => {


    //Gets input from form
    var d = new Date(req.body.reservation);

    const room = req.body.room.trim()
    // const year = parseInt(req.body.year)
    //  const month = parseInt(req.body.month)
    //  const day = parseInt(req.body.day)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hour = parseInt(req.body.hour)
    const duration = parseInt(req.body.duration)
    const user = req.body.user


    //Reservation in milliseconds
    let startMil = new Date(year, month - 1, day, hour).getTime()
    let endMil = new Date(year, month - 1, day, hour + duration).getTime()

    //if no class given, print error
    if (room.trim() === "") {
        return res.render("main", { layout: 'index', info: "You have to choose class" })
    }
    //Check for error in reservation
    if (isNaN(startMil) || isNaN(endMil) || (endMil < startMil)) {

        return res.render('main', { layout: 'index', info: "Error in reservation time" });
    
    }

    //Gets classes previous reservations
    time.find({ Room: room }).sort({ Starttime: 1 }).then((finded_room) => {

        //Let's check if class is already reserved at given time

        let ReservedText = isReserved(startMil, endMil, finded_room)

        if (ReservedText.trim() === "") {
            //If not already reserved, create new reservation
            const time_var = new time({
                Room: room,
                Starttime: startMil,
                Endtime: endMil,
                User: user
            })

            //Save the reservation
            time_var.save().then((saved_time) => {
                //Convert millisecond to "normal" time
                let converted = convertAndGather(saved_time)

                //Render input using handelsbar
                res.render('main', { layout: 'index', info: "Reservation added", reservation: converted });
        
            }).catch((error) => {
                res.status(400).send(error.message)
            })
        }
        //If class was already reserved
        else {
            //render reservation information using handelsbar
            res.render('main', { layout: 'index', info: ReservedText });
        }
    })

})


//Delete reservation
reservationRouter.post("/delete", (req, res) => {

    const id = req.body.deleteId

    time.findByIdAndDelete(id).then((deleted) => {
        res.render('main', { layout: 'index', info: "Reservation deleted" }
    }).catch((error) => {
        res.status(400).send("Error in id")
    })
})

// Gets reservations whichs pass the given search criteria
reservationRouter.get("", (req, res) => {



    let query = {};


    let room = req.query.room


    //if search class
    if (room !== undefined && room.trim() !== "") {
        let title = "Room";
        let value = req.query.room.trim();
        query[title] = value;
    }


    //if search date

    let date = req.query.date
    let searchDay = req.query.searchDay
    if (date !== undefined && date.length === 10 && searchDay === "etsi") {
        const day = parseInt(req.query.date.substring(8, 10))
        const month = parseInt(req.query.date.substring(5, 7))
        const year = parseInt(req.query.date.substring(0, 4))

        //Show one day reservation

        let s = new Date(year, month - 1, day)
        let e = new Date(year, month - 1, day + 1)

        let beginning = "$gte"
        let end = "$lt"
        let Starttime2 = {}
        Starttime2[beginning] = s
        Starttime2[end] = e
        let title2 = "Starttime";

        //Starttime: { $gte: s , $lt: e }

        query[title2] = Starttime2;

    }

    //If search user

    if (req.query.user !== undefined && req.query.user.trim() != "") {
        let titleUser = "User";
        let valueUser = req.query.user.trim();
        query[titleUser] = valueUser;
    }


    let result = []

    //Prints seach results
    time.find(query).sort({ Room: 1, Starttime: 1 }).then((finded) => {

        //Convert milliseconds to "normal" time
        result = convertAndGather(finded)
        if (result.length > 0) {
            res.render('main', { layout: 'index', info: "Search results", reservation: result });
        }
        else {
            res.render('main', { layout: 'index', info: "No reservations found" });
        }
        //return res.send(result)
    })
})



//Converts milliseconds to "normal" time
let convertAndGather = (resultToConvert) => {

    const converted = []

    if (Array.isArray(resultToConvert)) {
        //If array
        resultToConvert.forEach((time) => {
            let oneReservation = {
                room: time.Room,
                startTime: new Date(time.Starttime).toLocaleString(),
                endTime: new Date(time.Endtime).toLocaleString(),
                user: time.User,
                id: time._id
            }

            converted.push(oneReservation)
        })

    }
    else {
        //If object
        let oneReservation = {
            room: resultToConvert.Room,
            startTime: new Date(resultToConvert.Starttime).toLocaleString(),
            endTime: new Date(resultToConvert.Endtime).toLocaleString(),
            user: resultToConvert.User,
            id: resultToConvert._id
        }
        converted.push(oneReservation)
    }
    return converted
}

//Functio that checks if class is already reserved at given time
let isReserved = (startMil, endMil, times, skip = 0) => {

    let text = ""

    times.forEach((time) => {


        if (String(time._id) !== skip) {
            if ((time.Starttime <= startMil) && (startMil < time.Endtime)) {
                text = formatText(text,time)

            }
            else if ((time.Starttime < endMil) && (endMil <= time.Endtime)) {
                text = formatText(text,time)
            }
            else if ((startMil <= time.Starttime) && (time.Starttime < endMil)) {
             text = formatText(text,time)
            }
            else if ((startMil < time.Endtime) && (time.Endtime <= endMil)) {
            text = formatText(text,time)

            }
        }
    })
    return text
}


// Fuction after this are used to generate text to already reserved time
let formatText = (text, time) => {
    let reservedTime = convertAndGather(time)


    if (text.trim() === "") {
        text = "Class " + reservedTime[0].room + " was reserved "+ onlyDay(reservedTime[0].startTime)+" <br>"
    }

    text += removeDay(reservedTime[0].startTime) + " - " + removeDay(reservedTime[0].endTime) + "<br>"

    return text
}
let removeDay = (input) => {
    let remove = input
    return remove.substring(remove.indexOf(" ") + 1);
}
let onlyDay = (input) =>
{
    return input.substring(0,input.indexOf(" "));
}



module.exports = reservationRouter