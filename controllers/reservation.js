const reservationRouter = require('express').Router()
const time = require('../models/time')


reservationRouter.post("/", (req, res) => {

    var d = new Date(req.body.reservation);

    const room = req.body.room
  // const year = parseInt(req.body.year)
  //  const month = parseInt(req.body.month)
  //  const day = parseInt(req.body.day)
    const year = d.getFullYear()
    const month = d.getMonth() +1
     const day =d.getDate()
    const hour = parseInt(req.body.hour)
    const duration = parseInt(req.body.duration)
    const user = req.body.user


    //Varatut ajat millisekunteina
    let startMil = new Date(year, month - 1, day, hour).getTime()
    let endMil = new Date(year, month - 1, day, hour + duration).getTime()


    if(room.trim()==="")
    {
        return res.render("main",{layout: 'index', info: "You have to choose class"})
    }
    //Jos syötteessä virhe
    if (isNaN(startMil) || isNaN(endMil) || (endMil < startMil)) {
        
        return res.render('main', {layout: 'index', info: "Error in reservation time"});
       // return res.status(400).send("Error in reservation time")
    }

    time.find({ Room: room }).then((finded_room) => {

        //Tarkistetaan onko huone varattu
        let reserved = false;
        reserved = isReserved(startMil, endMil, finded_room)
       
        if (reserved === false) {
            //luodaan uusi varaus
            const time_var = new time({
                Room: room,
                Starttime: startMil,
                Endtime: endMil,
                User: user
            })

            time_var.save().then((saved_time) => {
                let converted = convertAndGather(saved_time)
                console.log(converted)
                res.render('main', {layout: 'index', info:"Reservation added", reservation: converted});
                //return res.send(converted)
            }).catch((error) => {
                res.status(400).send(error.message)
            })
        }
        else {
            res.render('main', {layout: 'index', info: "Room was reserved"});
           // return res.end("Room was reserved")
        }
    })

})


reservationRouter.post("/delete", (req, res) => {

    const id = req.body.deleteId

    console.log(id)
    time.findByIdAndDelete(id).then((deleted) => {
        res.render('main', {layout: 'index', info: "Reservation deleted"});
      //  res.send("Reservation deleted")
    }).catch((error) => {
        res.status(400).send("Error in id")
    })
})

reservationRouter.get("", (req, res) => {
    

    //Tähän kerätään hakuehdot
    let query = {};
    

    let room = req.query.room

    if (room !== undefined  && room.trim()!=="" ) {
        let title = "Room";
        let value = req.query.room.trim();
        query[title] = value;
    }

   
    //Päiväys pitää olla muodossa ddmmyyyy

    let date = req.query.date
    let searchDay = req.query.searchDay 
    if (date !== undefined && date.length === 10 && searchDay === "etsi" ) {
        const day = parseInt(req.query.date.substring(8, 10))
        const month = parseInt(req.query.date.substring(5, 7))
        const year = parseInt(req.query.date.substring(0, 4))

        console.log(day)
        console.log(month)
        console.log(year)
        //Näytetään yhden päivän varaukset

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


    if (req.query.user !== undefined && req.query.user.trim() != "") {
        let titleUser = "User";
        let valueUser = req.query.user.trim();
        query[titleUser] = valueUser;
    }
    
    console.log(query)



    let result = []

    time.find(query).sort({ Room: 1, Starttime: 1 }).then((finded) => {
        result = convertAndGather(finded)
        if(result.length >0)
        {
        res.render('main', {layout: 'index', info:"Search results",reservation: result});
        }
        else
        {
            res.render('main', {layout: 'index', info:"No reservations found"});
        }
        //return res.send(result)
    })
})



//Muuttaa ohjelman käyttämät millisekunnit tavalliseksi ajaksi
let convertAndGather = (resultToConvert) => {

    const converted = []

    if (Array.isArray(resultToConvert)) {
        //Jos array
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
        //Jos yksittäinen object
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

//Tarkistaa onko luokka varattu, skipillä toteutetaan
//ettei muokattavan varauksen vanha aika vaikuta tarkastuksessa
let isReserved = (startMil, endMil, times, skip = 0) => {
    
    let reserved = false

    times.forEach((time) => {

        if (String(time._id) !== skip) {
            if ((time.Starttime <= startMil) && (startMil < time.Endtime)) {
                reserved = true

            }
            else if ((time.Starttime < endMil) && (endMil <= time.Endtime)) {
                reserved = true


            }
            else if ((startMil <= time.Starttime) && (time.Starttime < endMil)) {
                reserved = true


            }
            else if ((startMil < time.Endtime) && (time.Endtime <= endMil)) {
                reserved = true


            }
        }
    })
    return reserved
}




module.exports = reservationRouter