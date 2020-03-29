const mongoose = require("mongoose");

let itemSchema = new mongoose.Schema({
    description: String,
    category: String,
    isCompleted: Boolean,
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
})

let Item = mongoose.model("Item", itemSchema)

module.exports = Item;