const mongoose = require("mongoose"),
      passportLocalMongoose = require("passport-local-mongoose")

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    schedule: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }],
    fitness: {type:Number, default: 0},
     work: {type:Number, default: 0},
     education: {type:Number, default: 0},
     lifestyle: {type:Number, default: 0}

});



userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", userSchema);