require('dotenv').config({path: __dirname + "/.env"});
const stripe = require('stripe')('sk_test_4eC39HqLyjWDarjtT1zdp7dc');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const fs = require("fs");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const saltRounds = 10;

const YOUR_DOMAIN = 'http://localhost:3000' || "https://salty-island-33223.herokuapp.com";

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

const mongoDbAtlasPassword = process.env.MONGO_PASS;
const mongoDbUsername = process.env.MONGO_USERNAME;

const uri = "mongodb+srv://" + mongoDbUsername + ":" + mongoDbAtlasPassword + "@cluster0.ujcg9.mongodb.net/userDB?retryWrites=true&w=majority";

mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
.then( () => {
    console.log("Connected to the database");
})
.catch( (err) => {
    console.log(err);
});
 

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    cart: Array
});


const User = mongoose.model("User",userSchema);

let rawdata = fs.readFileSync("product.json");
let products = JSON.parse(rawdata);

let totalPrice = 0;
let userLoggedIn;
let count = 0;
let price = 0;


app.get("/", (req,res) => {
    res.render("home",{count: count});
})


app.get("/shop", (req,res) => {
    res.render("shop", {products: products,count: count,userInfo: userLoggedIn});
})

app.post("/shop", (req,res) => {


    let product_info = req.body.addToCart;

    products.forEach((product) => {
        if(product_info === "product-" + product.product_id) {

            User.findByIdAndUpdate({_id: userLoggedIn._id},{$push: {cart: product}},{new: true,returnOriginal: false}, (err,updatedItem) => {
                if(err){
                    console.log(err);
                }
                else{
                    userLoggedIn = updatedItem;
                    count = userLoggedIn.cart.length;
                    products.forEach( (product) => {
                        userLoggedIn.cart.forEach( (item) => {
                            if(item.product_id === product.product_id){
                                totalPrice += parseInt(product.price);
                            }
                        })
                    })
                    res.redirect("/shop");
                }
            });

        }
    });

})


app.get("/cart",(req,res) => {


    if(userLoggedIn === undefined){
        totalPrice = 0;
        res.render("cartEmpty",{count: count,total: totalPrice,userInfo: userLoggedIn});
    }
    else if(userLoggedIn !== undefined){
        count = userLoggedIn.cart.length;

            userLoggedIn.cart.forEach( (item) => {
                products.forEach( (product) => {
                    if(item.product_name === product.product_name && price !==totalPrice){
                        totalPrice += parseInt(item.price);
                    }
                });    
            });
            price = totalPrice;
        

        if(count === 0){
            res.render("cartEmpty",{count: count,total: totalPrice,userInfo: userLoggedIn})
        }
        else{
            res.render("cart",{count: count,total: totalPrice,userInfo: userLoggedIn});
        }
    }
})


app.get("/deleteItem", (req,res) => {
    res.redirect("/cart");
})

app.post("/deleteItem", (req,res) => {
    let product_info = req.body.deleteItemFromCart;

    
    for(let i=0; i<userLoggedIn.cart.length; i++){
        if(userLoggedIn.cart[i].product_id === product_info){
            User.findByIdAndUpdate({_id: userLoggedIn._id},{$pull: {cart: {product_id: product_info}}},{new: true,returnOriginal: false}, (err,updateDoc) => {
                if(err){
                    console.log(err);
                }
                else{
                    userLoggedIn = updateDoc;
                    count = userLoggedIn.cart.length;
                    
                    if(count === 0){
                        res.render("cartEmpty",{count: count,total: totalPrice,userInfo: userLoggedIn});
                    }
                    else{
                        res.render("cart",{count: count,total: totalPrice,userInfo: userLoggedIn});
                    }
                }
            });
        }
    }

})

app.post("/signup", (req,res) => {

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const name = req.body.name;
        const email = req.body.email;
        const password = hash;

        const newUser = new User({
            username: name,
            email: email,
            password: password,
            cart: []
        });

        newUser.save((err,userInfo) => {
            if(err){
                console.log(err);
            
            }
            else{
                userLoggedIn = userInfo;
                count = userLoggedIn.cart.length;
                res.render("loggedin",{userInfo: userLoggedIn,count: count});
            }
        })
    });


})

app.post("/login", (req,res) => {
    const registeredEmail = req.body.email;
    const registerdPassword = req.body.password;

    User.findOne({email: registeredEmail}, (err,foundUser) => {
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                bcrypt.compare(registerdPassword, foundUser.password, function(err, result) {
                    if(result){
                        userLoggedIn = foundUser;
                        count = userLoggedIn.cart.length;
                        res.render("loggedin",{userInfo: userLoggedIn,count: count});
                    }
                });
                
            }
        }
    })

})

app.get("/success", (req,res) => {
    res.render("success");
})

app.get("/cancel", (req,res) => {
    res.render("cancel");
})

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
                name: 'Stubborn Attachments',
                images: ['https://i.imgur.com/EHyR2nP.png'],
          },
          unit_amount: totalPrice * 100,
        },
        quantity: 1
      },
    ],
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}/success`,
    cancel_url: `${YOUR_DOMAIN}/cancel`,
  });

  res.json({ id: session.id });
});



app.listen(process.env.PORT || 3000, (req,res) => {
    console.log("Server started at port 3000");
    
})