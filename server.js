const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require('body-parser')
const cors = require('cors')
const nodemailer = require('nodemailer');
const { request, response } = require("express");

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mobilyteamm@gmail.com',
    pass: '' //erased
  }
});

var mailOptions = {
  from: 'mobilyteamm@gmail.com',
  to: '',
  subject: 'Sending Email using Node.js',
  text: ''
  // html: '<h1>Hi Smartherd</h1><p>Your Messsage</p>'        
};


const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'crud',
})

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}))

app.get('/api/get',(req,res)=>{

  const insert = "SELECT * FROM crud.mobiles;"
  db.query(insert, (err,result)=>{
    res.send(result)
  })
})

app.get('/brand/:brand',(req,res)=>{
  const brand = req.params.brand;
  const insert = "SELECT * FROM crud.mobiles where brand=?;"
  db.query(insert, brand,(err,result)=>{
    res.send(result)
  })
})

app.get('/network/:network',(req,res)=>{
  const network = req.params.network;
  const insert = "SELECT * FROM crud.mobiles where id in (select id from crud.mob_specs where network=?);"
  db.query(insert, network,(err,result)=>{
    res.send(result)
  })
})

app.get('/ram/:ram',(req,res)=>{
  const ram = req.params.ram;
  const insert = "SELECT * FROM crud.mobiles where id in (select id from crud.mob_specs where ram=?);"
  db.query(insert, ram,(err,result)=>{
    res.send(result)
  })
})

app.get('/price/:price',(req,res)=>{
  const price = req.params.price.split('-');
  const minPrice = price[0];
  const maxPrice = price[1];
  
  const insert = "SELECT * FROM crud.mobiles where id in (select id from crud.mob_specs where price>? and price<?);"
  db.query(insert, [minPrice,maxPrice],(err,result)=>{
    
    res.send(result)
  })
})

app.get('/api/specs/:id',(req,res)=>{
	const id = req.params.id;
  const insert = "select * from crud.mob_specs where id=?;"
  db.query(insert, id, (err,result)=>{
    res.send(result)
  })
})

var rand = function() {
  return Math.random().toString(36).substr(2); // remove `0.`
};

var token = function() {
  return rand() + rand();
};

app.post('/register', (req,res)=>{
  const username = req.body.username;
  const phone = req.body.phone;
  const email = req.body.email;
  const address = req.body.address;
  const password = req.body.password;
     
  const insert = "insert into crud.users(username,phone,email,address,password) values(?,?,?,?,?)"
  db.query(insert, [username,phone,email,address,password], (err,result)=>{
    
    res.send(result)
  })
})

app.post('/login', (req,res)=>{
  const username = req.body.username;
  const password = req.body.password;
     
  const insert = "SELECT * FROM crud.users where username=? and password= ?"
  db.query(insert, [username, password], (err,result)=>{
    if(err)
      res.send({err:err})

    if (result.length>0)
    {
      res.send(result)
    }
    else res.send({message: "wrong credentials"})

  })
})

app.get('/logged/:username',(req,res)=>{
  
	const username = req.params.username;
  const insert = "select * from crud.users where username=?;"
  db.query(insert, username, (err,result)=>{
    res.send(result)
  })
})

app.post('/loggedShop',(req,res)=>{
  const username = req.body.username;
  const insert = "select * from crud.user_mobile where phone=(select phone from crud.users where username = ?)"
  db.query(insert, username, (err,result)=>{
    res.send(result)
  })
})


app.post('/add_new', (req,res)=>{
  const username = req.body.username;
  const brand = req.body.brand;
  const model = req.body.model;
  const img = req.body.img;
  const price = req.body.price;
  const condition = req.body.condition;
  const insert = "insert into crud.user_mobile values((select phone from crud.users where username=?), ?, ?, ?, ?, ?)"
  db.query(insert, [username,brand,model,img,price,condition], (err,result)=>{
    res.send(result)
  })
})

app.post('/new',(req,res)=>{
  const brand = req.body.brand;
  const model = req.body.model;
  const city = req.body.city;
  const insert = 'select * from crud.seller_info where phone in (select phone from crud.user_mobile where brand=? and model=? and address in (select address from crud.seller_info where LOCATE(?,address) > 0))';
  db.query(insert, [brand,model,city], (err,result)=>{
    res.send(result)
  })
})



app.post('/show_new',(req,res)=>{
  const phone = req.body.phone;
  const insert = 'select brand, model, img, price from crud.user_mobile where phone=? and mob_condition=?';
  db.query(insert, [phone,'New'], (err,result)=>{
    res.send(result)
  })
})

app.post('/show_used',(req,res)=>{
  const phone = req.body.phone;
  const insert = 'select brand, model, img, price from crud.user_mobile where phone=? and mob_condition!=?';
  db.query(insert, [phone,'New'], (err,result)=>{
    res.send(result)
  })
})

app.post('/send_email',(req,res)=>{
  mailOptions.to=req.body.email;
  mailOptions.text=token();
   transporter.sendMail(mailOptions);
  res.end()
})


app.post('/reset_password',(req,res)=>{
  const email = mailOptions.to;
  const token = mailOptions.text;
  const tokenCame = req.body.token;
  const username = req.body.username;
  const password = req.body.password;
  const insert = 'select * from crud.users where username=? and email=?';
  db.query(insert, [username,email], (err,response)=>{
    if(err) console.log(err)
    
    
     if(!response.length) res.send('wrong username')


    mailOptions.to='';
    mailOptions.text='';
    
    if(response !== null && !(!response.length) && token===tokenCame){
     db.query(`update crud.users set password=? where username=? and email=?`, [password,username,email]); 
    }
  })
})

app.post('/validateUser', (req,res)=>{
const username = req.body.username;
const insert = 'select username from crud.users where username=?'
db.query(insert, username, (err,result)=>{
  if(result.length)
   res.send(result[0].username)
})
})


app.post('/deleteMobile', (req,res)=>{
  const brand = req.body.brand; 
  const model = req.body.model; 
  const price = req.body.price; 
  const condition = req.body.condition; 
  const phone = req.body.phone; 
  const insert = 'delete from crud.user_mobile where brand=? and model=? and price=? and mob_condition=? and phone=?';
  db.query(insert, [brand,model,price,condition,phone], (err,result)=>{
    if(err) console.log(err) 
  })
})




  app.post('/adminLogin', (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
       
    const insert = "SELECT * FROM crud.admin where username=? and password= ?"
    db.query(insert, [username, password], (err,result)=>{
      if(err)
        res.send({err:err})
  
      if (result.length>0)
      {
       res.send('logged in')
      }
      else
      {
        res.send({message: "wrong credentials"})
      } 
  
    })
  })
  

  app.post('/addMobile', (req,res)=>{
 console.log(req.body.spec.brand)
 const phoneName = req.body.spec.phoneName;
 const brand = req.body.spec.brand;
 const network = req.body.spec.network;
 const img = req.body.spec.img;
 const os = req.body.spec.os;
 const ui = req.body.spec.ui;
 const processor = req.body.spec.processor;
 const gpu = req.body.spec.gpu;
 const dimension = req.body.spec.dimension;
 const weight = req.body.spec.weight;
 const screenType = req.body.spec.screenType;
 const screenSize = req.body.spec.screenSize;
 const resolution = req.body.spec.resolution;
 const ram = req.body.spec.ram;
 const rom = req.body.spec.rom;
 const primaryCam = req.body.spec.primaryCam;
 const secondaryCam = req.body.spec.secondaryCam;
 const battery = req.body.spec.battery;
 const price = req.body.spec.price;
 var id = '';
    const insert1 = "insert into crud.mobiles(name, img, price, brand) values(?,?,?,?)";
    db.query(insert1, [phoneName,img,price,brand])
    const insert2 = "SELECT id FROM crud.mobiles ORDER BY id desc LIMIT 1";
    db.query(insert2, (err,result)=>{
      id=result[0].id
    })
    const insert3 = "insert into crud.user_mobile(id, name, price, brand, img, os, ui, dimesion, weight, processor, gpu, screen_size, screen_type, resolution, ram, rom, primary_cam, secondary_cam, battery, network) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    db.query(insert3, [id,phoneName,price.brand,img,os,ui,dimension,weight,processor,gpu,screenSize,screenType,resolution,ram,rom,primaryCam,secondaryCam,battery,network]
      )
  })

app.listen(process.env.PORT || 3001);
