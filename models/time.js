const mongoose = require('mongoose')



const timeSchema = mongoose.Schema({
    Room: {
        type: String,
    required: true
    },
    Starttime: {
        type:Number,
        required:true
    },
    Endtime: {
        type:Number,
        required:true
    },
    User: {
        type: String,
    }
})

  timeSchema.set('toJSON', {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject._id
      delete returnedObject.__v
    }
  })


  

  module.exports = mongoose.model('time', timeSchema)