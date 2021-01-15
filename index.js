const http = require('http')
const express = require('express')
const app = express()
const mongoose = require('mongoose')
var bodyParser = require('body-parser')
const cors = require('cors')

//Loads the handlebars module
const handlebars = require('express-handlebars');

//Sets our app to use the handlebars engine
app.set('view engine', 'hbs');

app.engine('hbs', handlebars({
  layoutsDir: __dirname + '/views/layouts',
  extname:"hbs",
  defaultLayout: 'planB',
  partialsDir: __dirname + '/views/partials/'
  }));

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
//app.use(bodyParser.json()

app.use(express.static('public'))

app.use((err, req, res, next) => {
  if (err) {
    res.status(400).send('error parsing data')
  } else {
    next()
  }
})


const reservationRouter = require(`./controllers/reservation.js`)


require('dotenv').config()

const mongoUrl = process.env.MONGO 

mongoose.connect(mongoUrl, {
    useCreateIndex: true,
    useUnifiedTopology:true,
    useNewUrlParser:true,
    useFindAndModify:false
    })


app.use(express.json())


app.use('/reservation', reservationRouter)


/*app.get('/', (req, res) => {
  //Serves the body of the page aka "main.handlebars" to the container //aka "index.handlebars"
  res.render('main', {layout : 'index'});

  });
*/
app.get("/",(req,res)=>
{
  res.sendFile('main.html', {root: __dirname })
})

app.get('*', (req,res) =>{
res.send("There is nothing here") 
});

const PORT =  process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})