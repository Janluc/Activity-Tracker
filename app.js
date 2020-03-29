const express = require("express"),
      app = express(),
      mongoose = require("mongoose"),
      passport = require("passport"),
      bodyParser = require("body-parser"),
      User = require("./models/User"),
      Item = require("./models/Item"),
      LocalStrategy = require("passport-local"),
      passportLocalMongoose = require("passport-local-mongoose"),
      methodOverride = require("method-override"),
      http = require("http").Server(app),
      io = require("socket.io")(http);
      env = require("dotenv").config()


mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

url = process.env.DATABASEURL
mongoose.connect(url, { useNewUrlParser: true });

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));

app.use(require("express-session")({
    secret: process.env.SECRETCODE,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

http.listen(3000, function(){
    console.log("Init on port 3000")
});



app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

app.get("/", function(req, res){
    res.render("index")
});

app.post("/", passport.authenticate("local", {
    successRedirect: "/schedule",
    failureRedirect: "/"
}) ,function(req, res){
    
});

app.get("/new", function(req, res){
    res.render("new")
});

app.post("/new", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, newUser){
        if (err) {
            console.log(req.body.username)
            console.log(err)
            res.redirect("/new")
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/schedule/' + newUser._id)
            });
        }
    });
});

app.get("/schedule", function(req,res){
    if (req.user) {
        res.redirect("/schedule/" + req.user._id)
    } else{
        res.redirect("/")
    }
});

app.get("/schedule/:id", function(req, res){
    User.findById(req.params.id).populate("schedule").exec(function(err, foundUser){
        if (!foundUser && !req.user && err) {
            res.redirect("/")
            console.log("Error")
        } else{
            res.render("home", {user: foundUser})
        }
    })    
});

app.post("/schedule/:id/item/new", function(req, res){

    User.findById(req.params.id, function(err, foundUser){
        if (!foundUser && err) {
            
        } else{
            let bodyItem = {
                description: req.body.schedule.description,
                category: req.body.schedule.category,
                creator: req.user
            }
            Item.create(bodyItem, function(err, foundItem){
                if(err){
                    console.log("err")
                } else{
                    foundItem.isCompleted = false;
                    foundItem.save();

                    foundUser.schedule.push(foundItem);
                    foundUser.save();
                    res.redirect("/schedule/" + foundUser._id)
                }
            });
        }
    })
});

app.delete("/schedule/:id/item/:itemid", function(req, res){
    Item.findByIdAndRemove(req.params.itemid, function(err){
        if(err){
            console.log("error deleting")
        } else{
            res.redirect("/schedule")
        }
    });
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

io.on('connection', function(socket){
    
    socket.on('identify',function(data){
        let dataID = data.dataID;
        let userID = data.userID;
        

        User.findById(userID, function(err, foundUser){
            if(!foundUser && err){
                res.redirect("/")

            } else{

                Item.findOne({creator: foundUser._id, description: dataID}, function(err, foundItem){
                    if (err){

                    } else {
                        if(foundItem.isCompleted == false){
                            foundItem.isCompleted = true;

                            if(foundItem.category == 'Fitness'){foundUser.fitness += 1;} 
                            else if(foundItem.category == 'Education') {foundUser.education += 1} 
                            else if(foundItem.category == 'Work') {foundUser.work += 1} 
                            else if(foundItem.category == 'Lifestyle') {foundUser.lifestyle += 1}
                            
                            foundItem.save();
                            foundUser.save();
                        } else if(foundItem.isCompleted){
                            foundItem.isCompleted = false;

                            if(foundItem.category == 'Fitness'){foundUser.fitness -= 1;} 
                            else if(foundItem.category == 'Education') {foundUser.education -= 1} 
                            else if(foundItem.category == 'Work') {foundUser.work -= 1} 
                            else if(foundItem.category == 'Lifestyle') {foundUser.lifestyle -= 1}
                            foundItem.save()
                            foundUser.save();
                        }
                    }
                });
            }
        });
    });
});
