require('dotenv').config()
const express = require("express");
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require("express-session");
const passportLocalMongoose = require('passport-local-mongoose');
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const LocalStrategy = require('passport-local').Strategy;
// const {User,UserSchema} = require("./user");
var val;

const app = express();
app.use(cors());
app.use(bodyParser.json());
const nextDay=1000*60*60*24;
app.use(session({
  secret:process.env.SECRET,
  resave:true,
  saveUninitialized:true,
  cookie:{maxAge:nextDay}
}))

mongoose.connect(process.env.MONGOURI);


var UserSchema = new mongoose.Schema({
    email: {type: String, required:true, unique:true},
    username : {type: String, unique: true, required:true},
    cart:[{pizza:String,quantity:Number,username:String,base:String,sauce:String,cheese:String,veggies:String,totalPrice:Number}],

});

var OrderSchema = new mongoose.Schema({
  pizza:String,
  status:String,
  username:String,
  base:String,
  sauce:String,
  cheese:String,
  veggies:String,
  quantity:Number,
  totalPrice:Number
})

var CustomSchema = new mongoose.Schema({
  key:{type:Number,default:1},
  base1:{type:Number,default:10},
  base2:{type:Number,default:10},
  base3:{type:Number,default:10},
  base4:{type:Number,default:10},
  base5:{type:Number,default:10},
  sauce1:{type:Number,default:10},
  sauce2:{type:Number,default:10},
  sauce3:{type:Number,default:10},
  sauce4:{type:Number,default:10},
  sauce5:{type:Number,default:10},
  cheese1:{type:Number,default:10},
  cheese2:{type:Number,default:10},
  veggies1:{type:Number,default:10},
  veggies2:{type:Number,default:10},
  veggies3:{type:Number,default:10}
})

UserSchema.plugin(passportLocalMongoose);

const User  = mongoose.model("User", UserSchema);
const Order = mongoose.model("Order",OrderSchema);
const CustomPizz = mongoose.model("CustomPizz",CustomSchema);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));

app.post('/register', function(req, res) {

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'testmail19253@gmail.com',
      pass: process.env.MY_PASS
    }
  });
  val = Math.floor(1000 + Math.random() * 9000);
  val=String(val);
  var mailOptions = {
    from: process.env.EMAIL,
    to: req.body.email,
    subject: "One Time Password(OTP)",
    text: val
  };
    
   
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
      // res.status(200).json({success:true,message:"User can be verified with email otp."});
    }
  });

    Users=new User({email: req.body.email, username : req.body.username});
          User.register(Users, req.body.password, function(err, user) {
            if (err) {
              res.json({success:false, message: "This mail is already registered."})
            }else{
              res.json({success: true, message: "Your account successflully created.",_id:user._id})
            }
          });
});

app.post("/checkotp",(req,res)=>{
  if(req.body.otp===val){
    res.json({success:true,message:"logUser"})
  }else{
    res.json({success:false,message:"loginFail"})
  }
})

app.post("/removeuser",(req,res)=>{
  _id = req.body.userID;
  console.log(_id);
  User.findByIdAndDelete(_id, function (err, docs) {
    if (err){
        res.json({success:false,message:err});
    }
    else{
        res.json({success:true,message:"Wrong OTP, Try Again!."});
    }
});
})





app.post('/login', (req, res, next) => {
  passport.authenticate('local',
  (err, user, info) => {
    if (err) {
      res.json({success:false,message:err});
      return;
    }

    if (!user) {
      res.json({success:false,message:"No user found."});
      return;
    }

    req.logIn(user, function(err) {
      if (err) {
        res.json({success:false,message:err});
        return;
      }else{
        if(user.username==="Ritesh"){
          res.json({success:true,message:"admin",user:user});
          return;
        }else{
          res.json({success:true,message:"user loggedIn",user:user});
          return;
        }

      }


    });

  })(req, res);
});

app.post("/userorder",(req,res)=>{
  const{username,pizza,quantity,totalPrice} = req.body;
  // console.log(username,pizza,quantity,totalPrice);
  User.findOne({username},(err,user)=>{
    if(err){
      console.log(err);
      return;
    }

    user.cart.unshift({username,pizza,quantity,totalPrice});

    user.save();


  });
});

app.post("/cart",(req,res)=>{
  const{username} = req.body;

  User.findOne({username},(err,user)=>{
    // console.log(user);
    res.json(user.cart);
  })
})

app.post("/removefromcartt",(req,res)=>{
  const{username,_id} = req.body;

  User.findOne({username},(err,user)=>{
    if(err){
      console.log(err);
      return;
    }
    // console.log(user.cart);
    var newcart = user.cart.filter((oneOrder)=>{
      return oneOrder._id!=_id;
    })
    user.cart = newcart;
    user.save();
    // console.log(newcart);
  })

})

app.post("/addtoorders",(req,res)=>{
  const{username,_id} = req.body;

  User.findOne({username},(err,user)=>{
    if(err){
      console.log(err);
      return;
    }
    var neworder = user.cart.filter((one)=>{

      return one._id==_id;
    })

    // user.orders.unshift(neworder[0]);
    const objj = neworder[0];
    const order = new Order({
      pizza:objj.pizza,
      username:objj.username,
      base:objj.base,
      sauce:objj.sauce,
      cheese:objj.cheese,
      veggies:objj.veggies,
      quantity:objj.quantity,
      totalPrice:objj.totalPrice
    });
    order.save();

    var newcart = user.cart.filter((oneOrder)=>{
      return oneOrder._id!=_id;
    })
    user.cart = newcart;


    user.save() ;
  })

});

app.post("/getorders",(req,res)=>{
  const username = req.body.username;
  // User.findOne({username},(err,user)=>{
  //   res.json(user.orders);
  // })

  Order.find({username},(err,orders)=>{
    // console.log(orders);
    res.json(orders);
  })
})

app.post("/custompizzacart",(req,res)=>{
  const{pizza, username, base, sauce, cheese, veggies, totalPrice, quantity } = req.body;

  User.findOne({username},(err,user)=>{
    if(err){
      console.log(err);
      return;
    }
    // console.log(pizza, username, base, sauce, cheese, veggies, totalPrice, quantity);
    user.cart.unshift({pizza, username, base, sauce, cheese, veggies, totalPrice, quantity});
    user.save();
  })

})

app.get("/getallorders",(req,res)=>{
  Order.find({})
  .then((orders)=>{
    if(orders){
          // console.log(orders);
          res.json(orders);
    }

  })
  .catch((err)=>{
    console.log(err);
  })
})

app.post("/changestatus",(req,res)=>{
  const {status,_id} =  req.body;
// console.log(_id);
  Order.findOne({_id},(err,order)=>{
if(err){
  console.log(err);
  return;
}
// console.log("inner",_id);
    order.status = status;
     order.save();



  })
})

app.post("/changecustomitems",(req,res)=>{
  var makeobj = false;
  const {pizzaCount,custom} = req.body;
  // console.log(pizzaCount,custom);


  CustomPizz.findOne({key:1},(err,doc)=>{
    if (err) {
      console.log(err);
      return;
    }
    if(doc===null){
      var set = new CustomPizz({
        base1:1,base2:1,base3:1,base4:1,base5:1,sauce1:1,sauce2:1,sauce3:1,
        sauce4:1,sauce5:1,cheese1:1,cheese2:1,veggies1:1,veggies2:1,veggies3:1
      });
      set.save();
    }else{
      switch (custom) {
        case "base1":
          doc.base1=pizzaCount;
          break;
        case "base2":
          doc.base2=pizzaCount;
          break;
        case "base3":
            doc.base3=pizzaCount;
            break;
        case "base4":
            doc.base4=pizzaCount;
            break;
        case "base5":
            doc.base5=pizzaCount;
            break;
        case "sauce1":
            doc.sauce1=pizzaCount;
            break;
        case "sauce2":
            doc.sauce2=pizzaCount;
            break;
        case "sauce3":
            doc.sauce3=pizzaCount;
            break;
        case "sauce4":
            doc.sauce4=pizzaCount;
            break;
        case "sauce5":
            doc.sauce5=pizzaCount;
            break;
        case "cheese1":
            doc.cheese1=pizzaCount;
            break;
        case "cheese2":
            doc.cheese2=pizzaCount;
            break;
        case "veggies1":
            doc.veggies1=pizzaCount;
            break;
        case "veggies2":
            doc.veggies2=pizzaCount;
            break;
        case "veggies3":
            doc.veggies3=pizzaCount;
            break;
        default:console.log(custom);

      }
      doc.save();
    }

  })

})

app.get("/getcount",(req,res)=>{
  CustomPizz.findOne({key:1},(err,doc)=>{
    res.send(doc);
  })
})

app.post("/minuscustom",(req,res)=>{
  const {val} = req.body;
  var ifTrue = false;
  var ofs="" ;
  CustomPizz.findOne({key:1},(err,doc)=>{
    switch (val) {
      case "base1":
        doc.base1=doc.base1-1;
        if(doc.base1===5){ifTrue=true};
        ofs = "Cheese burst base";
        break;
      case "base2":
        doc.base2=doc.base2-1;
        if(doc.base2===5){ifTrue=true};
        ofs = "Dough base";
        break;
      case "base3":
          doc.base3=doc.base3-1;
          if(doc.base3===5){ifTrue=true};
          ofs = "Mini pizza base";
          break;
      case "base4":
          doc.base4=doc.base4-1;
          if(doc.base4===5){ifTrue=true};
          ofs = "Plane base";
          break;
      case "base5":
          doc.base5=doc.base5-1;
          if(doc.base5===5){ifTrue=true};
          ofs = "Thin crust base";
          break;
      case "sauce1":
          doc.sauce1=doc.sauce1-1;
          if(doc.sauce1===5){ifTrue=true};
          ofs = "Buffalo sauce";
          break;
      case "sauce2":
          doc.sauce2=doc.sauce2-1;
          if(doc.sauce2===5){ifTrue=true};
          ofs = "Garlic Ranche sauce";
          break;
      case "sauce3":
          doc.sauce3=doc.sauce3-1;
          if(doc.sauce3===5){ifTrue=true};
          ofs = "Hummus sauce";
          break;
      case "sauce4":
          doc.sauce4=doc.sauce4-1;
          if(doc.sauce4===5){ifTrue=true};
          ofs = "Marinara sauce";
          break;
      case "sauce5":
          doc.sauce5=doc.sauce5-1;
          if(doc.sauce5===5){ifTrue=true};
          ofs = "Pesto sauce";
          break;
      case "cheese1":
          doc.cheese1=doc.cheese1-1;
          if(doc.cheese1===5){ifTrue=true};
          ofs = "Mozzarella cheese";
          break;
      case "cheese2":
          doc.cheese2=doc.cheese2-1;
          if(doc.cheese2===5){ifTrue=true};
          ofs = "Cheddar cheese";
          break;
      case "veggies1":
          doc.veggies1=doc.veggies1-1;
          if(doc.veggies1===5){ifTrue=true};
          ofs = "Bell peppers";
          break;
      case "veggies2":
          doc.veggies2=doc.veggies2-1;
          if(doc.veggies2===5){ifTrue=true};
          ofs = "Egg plant";
          break;
      case "veggies3":
          doc.veggies3=doc.veggies3-1;
          if(doc.veggies3===5){ifTrue=true};
          ofs = "Yellow squash";
          break;
      default:console.log(custom);


    }
doc.save();

if(ifTrue){
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'testmail19253@gmail.com',
      pass: process.env.MY_PASS
    }
  });
  val = Math.floor(1000 + Math.random() * 9000);
  val=String(val);
  var mailOptions = {
    from: process.env.EMAIL,
    to: process.env.MY_EMAIL,
    subject: "Alert",
    html: ofs + "<span> getting Out Of Stock</span>"
  };
    
   
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Alert sent: ' + info.response);
      // res.status(200).json({success:true,message:"User can be verified with email otp."});
    }
  });


}

  })
})


app.get("/logout",function(req,res){

  req.logout(function(err) {
     if (!err) { res.send("Successfully Logout"); }

   });
});



app.listen("4000",()=>{
  console.log("server is running on port 4000");
});
