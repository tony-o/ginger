var jade = require("jade");
var alfred = require("alfred");
var express = require("express");
var passport = require("passport");
var strategy = require("passport-google").Strategy;

var app = express();

passport.serializeUser(function(user,done){
  done(null,user);
});

passport.deserializeUser(function(user,done){
  done(null,user);
});

passport.use(new strategy({
    returnURL:"http://localhost:5006/auth/return"
    ,realm:"http://localhost:5006"
  },function(id,profile,done){
    profile.id = id;
    return done(null,profile);
}));

app.configure(function(){
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({"secret":"asdfT1m3"}));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + "/html"));
  app.set("views",__dirname + "/views");
  app.set("view engine","jade");
});

app.get("/auth/google",passport.authenticate("google"));
app.get("/auth/return",passport.authenticate("google",{
    "failureRedirect":"/login"
  }),function(req,res){
    res.redirect("/account");
});

var authenticated = function(req,res,next){
  if(!req.isAuthenticated()){
    res.redirect("/login");
    return;
  }
  return next();
};

app.get("/account",authenticated,function(req,res){
  res.render("account",{locals:{
    title:"account"
    ,user:req.user
  }});
});

app.get("/dashboard",authenticated,function(req,res){
  db.tasks.find({"status":"open"}).all(function(err,data){
    res.render("dashboard",{locals:{
      title:"dashboard"
      ,user:req.user
      ,data:err?err:data
    }});
  });
});

app.get("/create/:model",authenticated,function(req,res){
  res.render("create",{locals:{
    title:"add " + req.params.model
    ,model:require("./models/" + req.params.model)
  }});
});

app.get("/",function(req,res){
  res.redirect("/login");
});

app.get("/login",function(req,res){
  res.render("login",{
    title:"login"
  });
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

var db;
alfred.open("database",function(er,d){
  if(er){
    console.error(er);
    return;
  }
  db = d;
  db.ensure("tasks",function(){});
  app.listen(5006);
});
