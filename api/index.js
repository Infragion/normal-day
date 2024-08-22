const express = require("express");
const nodefetch = require("node-fetch");
const cookieParser = require('cookie-parser');
const { kv } =  require('@vercel/kv');
const axios = require("axios");
const { scryptSync, randomBytes, timingSafeEqual } = require('crypto');
const path = require("path");
const cors = require("cors");
const { serialize } = require("v8");

const app = express();

// app.disable('x-powered-by');

app.use('/', express.static(path.join(__dirname, 'public')))
app.use(cookieParser());
app.use(express.json())
app.use(cors());

app.use(function (req, res, next) {  
  // res.header("token", "some-token");
  console.log(res.get("token"))
  next();
});

const EarlyAccessPlayers = [1359183163, 3343655985, 1165987937, 1329269335]

async function IsEarlyAccess(UserId){
  function EA(value){
    return value == UserId
  }
  if (EarlyAccessPlayers.find(EA)){
    return 'Early Access';
  }
  else{
    return '';
  }
}

async function Data(userid, datastore) {
  const response = await axios
    .get(
      `https://apis.roblox.com/datastores/v1/universes/${process.env.UNIVERSE_ID}/standard-datastores/datastore/entries/entry`,
      {
        params: {
          datastoreName: datastore,
          entryKey: userid,
        },
        headers: {
          "x-api-key": process.env.OPENCLOUD_KEY,
        },
      }
    )
    .catch((err) => {
      //console.log(err.response.data.message);
      return err.response.data.message;
    });
  if (response) {
    //console.log(response.data);
    return JSON.stringify(response.data);
  }
}

async function IsAlpha(UserId){
  const URL = `https://inventory.roblox.com/v1/users/${UserId}/items/1/662706674/is-owned`;
  const response = await fetch(URL);
  
  const Data = await response.json();
  if (Data == true){
    return 'Alpha';
  }
  else{
    const URL2 = `https://inventory.roblox.com/v1/users/${UserId}/items/1/205842622/is-owned`;
    const response2 = await fetch(URL2);
    const Data2 = await response2.json();
    if (Data2 == true){
      return 'Alpha';
    }
    else{
      return '';
    }
  }
}

async function SpacingNeeded(userid){
  const is = await IsEarlyAccess(userid)
  if (is == 'Early Access') {
    if (await IsAlpha(userid) == 'Alpha'){
      return ''
    }
    else {
      return 'none'
  }
  }
  else {
    return 'block'
  }
}

async function userid_to_username(userid) {
  const url = `https://users.roblox.com/v1/users/${userid}`;
  const response = await fetch(url);

  const avatarData = await response.json();
  const imageUrl = avatarData.name;

  return imageUrl;
}
async function username_to_userid(username) {
  const rawResponse = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({"usernames": [username], "excludeBannedUsers": true})
  });
  const content = await rawResponse.json();
  return content.data[0].id
}

async function is_verfified(username) {
  const url = "https://users.roblox.com/v1/usernames/users"

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      usernames: [username],
      excludeBannedUsers: false,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })

  const userData = await response.json()
  const isVerified = userData.data[0].hasVerifiedBadge;
  if (isVerified === true){
    return "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28' fill='none'%3E%3Cg clip-path='url(%23clip0_8_46)'%3E%3Crect x='5.88818' width='22.89' height='22.89' transform='rotate(15 5.88818 0)' fill='%230066FF'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M20.543 8.7508L20.549 8.7568C21.15 9.3578 21.15 10.3318 20.549 10.9328L11.817 19.6648L7.45 15.2968C6.85 14.6958 6.85 13.7218 7.45 13.1218L7.457 13.1148C8.058 12.5138 9.031 12.5138 9.633 13.1148L11.817 15.2998L18.367 8.7508C18.968 8.1498 19.942 8.1498 20.543 8.7508Z' fill='white'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_8_46'%3E%3Crect width='28' height='28' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E"
  }
  else{
    return ''
  }
}

// console.log(username_to_userid("Infragion"));

async function get_profilepic(userid) {
  const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userid}&size=420x420&format=Png&isCircular=true`;
  // const response = await axios.get(url)
  // const avatarData = await response.json()
  // const imageUrl = avatarData.data[0].imageUrl
  // return imageUrl

  const response = await fetch(url);

  const avatarData = await response.json()
  const imageUrl = avatarData.data[0].imageUrl

  return imageUrl
}

async function IsUsernameExists(User){
  const response = await fetch(`https://auth.roblox.com/v1/usernames/validate?request.username=${User}&request.birthday=1337-04-20`);

  const json = await response.json()
  const code = json.code

  if (code === 1){
    return true;
  }
  if (code === 0){
    return false;
  }
}

app.get("/db", async (req, res) => {
  if (req.headers.cookie === undefined){
    res.status(200).redirect("/login"); return 0;
  }
  const raw = req.headers.cookie.split('.');
  const username = hex_to_ascii(raw[0].toString())
  const hash = raw[1].toString().concat('.', raw[2].toString()).toString()
  if (hash == await kv.get(`${username}:user`)) {
    const keys = await kv.keys("*")
    let code = "<head> <script src='/db_client.js'></script> </head> <input id='sinput' style='position: absolute; top: 1%; right: 6%;' placeholder='Username' type='text'> <button id='search' style='position: absolute; top: 1%; right: 1%;'>Search</button>"
    for (var key in keys) {
      if (keys.hasOwnProperty(key)) {
        const cashid = keys[key].substring(0, keys[key].length - 5)+'_cash'
        code = code + `
        <div id='${keys[key].substring(0, keys[key].length - 5)+'_div'}' style="margin-bottom: 10px;">
          <input type='text' disabled="true" id='${keys[key].substring(0, keys[key].length - 5)}' value='${keys[key]}'>
          <input type='text' id='${keys[key].substring(0, keys[key].length - 5)+'_cash'}' value='${await kv.get(keys[key])}'>
          <button onclick='DB_upd("${keys[key]}", "${keys[key].substring(0, keys[key].length - 5)+'_cash'}")' id='${keys[key].substring(0, keys[key].length - 5)+'_upd'}'>Update</button>
          <button onclick='fetch("/db/del?key=${keys[key]}", {method: "POST"}); document.getElementById("${keys[key].substring(0, keys[key].length - 5)+'_div'}").remove()' id='${keys[key].substring(0, keys[key].length - 5)+'_del'}' style="background-color: red;">Delete</button>
        </div>
        `
      }
    }
    res.status(200).send(code)
  }
  else{
    res.status(200).redirect("/login");
  }
})

function ascii_to_hex(str)
{
    // Initialize an empty array to store the hexadecimal values
    var arr1 = [];
    
    // Iterate through each character in the input string
    for (var n = 0, l = str.length; n < l; n++)
    {
        // Convert the ASCII value of the current character to its hexadecimal representation
        var hex = Number(str.charCodeAt(n)).toString(16);
        
        // Push the hexadecimal value to the array
        arr1.push(hex);
    }
    
    // Join the hexadecimal values in the array to form a single string
    return arr1.join('');
}



function hex_to_ascii(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

function hashy (string) {
  const salt = randomBytes(16).toString('hex');
  const hashedString = scryptSync(string, salt, 32).toString('hex');
  const shashedString = `${salt}:${hashedString}`;

  return shashedString;

  // const hash = await new Promise((resolve, reject) => {
  //   bcrypt.hash(password, saltRounds, function(err, hash) {
  //     if (err) reject(err)
  //     resolve(hash)
  //   });
  // })

  // return hash
}
console.log(hashy("RoosterArrowMistral"))

async function compare(string, hash) {
  console.log("compare", {string, hash})
  const [salt, key] = hash.split('.')
  const hashedBuffer = scryptSync(string, salt, 32);

  const keyBuffer = Buffer.from(key, 'hex');
  const match = timingSafeEqual(hashedBuffer, keyBuffer);
  return match;
  
  // const compare = await new Promise((resolve, reject) => {
  //   bcrypt.compare(string, hash, function(err, sigma) {
  //     if (err) reject(err)
  //     resolve(sigma)
  //   });
  // })

  // return compare
}

app.get('/login', async (req, res) => {
  // console.log(await hash("RoosterArrowMistral"))
  // console.log(await compare("test", await kv.get("admin:user")))
  if (req.headers.cookie === undefined){res.status(200).send(`
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet">
    <script defer src="/db_client.js"></script>
    <link rel="stylesheet" href="/login_style.css" type="text/css">
  </head>
  <body>
    <div class="container">
      <p>Login</p>
      <input id="username" placeholder="Username">
      <br>
      <input id="password" placeholder="Password">
      <br>
      <button id='login'>Login</button>
    </div>
  </body>
  `); return 0;}
  const raw = req.headers.cookie.split('.');
  const username = hex_to_ascii(raw[0].toString())
  const hash = raw[1].toString().concat('.', raw[2].toString()).toString()
  // const { salt, hash } = shash.split(':');
  if (hash === await kv.get(`${username}:user`)) {
    res.status(200).redirect("/db");
  }
  else{
    res.status(200).send(`
  <head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet">
    <script defer src="/db_client.js"></script>
    <link rel="stylesheet" href="/login_style.css" type="text/css">
  </head>
  <body>
    <div class="container">
      <p>Login</p>
      <input id="username" placeholder="Username">
      <br>
      <input id="password" placeholder="Password">
      <br>
      <button id='login'>Login</button>
    </div>
  </body>
  `)
  }
});

app.get('/db/del', async (req, res) => {
  if (req.headers.cookie === undefined) {res.status(401).json( {error: 401, message: "Unathorized"}); return 0}
  const raw = req.headers.cookie.split('_');
  const username = raw[0].toString()
  const hash = raw[1].toString()

  if (hash === await kv.get(`${username}:user`)) {
    res.status(200).json( {error: 400, message: "Bad Request"} );
  }
  else {
    res.status(401).json( {error: 401, message: "Unathorized"});
  }
});

app.post('/db/del', async (req, res) => {
  if (req.headers.cookie === undefined) {res.status(401).json( {error: 401, message: "Unathorized"}); return 0}
  const raw = req.headers.cookie.split('_');
  const username = raw[0].toString()
  const hash = raw[1].toString()

  if (hash === await kv.get(`${username}:user`)) {
    try {
      const key = req.query.key;
      if (key === undefined) {
        res.status(400).json( {error: 400, message: "Bad Request"} )
      }
      await kv.del(key);
    }
  
    catch (error) {
      res.send(error);
    }
  
    finally {
      res.status(200).json( {error: 200, message: "Success"} );
    } 
  }
  else{
    res.status(401).json( {error: 401, message: "Unathorized"});
  }
});

app.get('/db/upd', async (req, res) => {
  if (req.headers.cookie === undefined) {res.status(401).json( {error: 401, message: "Unathorized"}); return 0}
  const raw = req.headers.cookie.split('_');
  const username = raw[0].toString()
  const hash = raw[1].toString()

  if (hash === await kv.get(`${username}:user`)) {
    res.status(200).json( {error: 400, message: "Bad Request"} );
  }
  else{
    res.status(401).json( {error: 401, message: "Unathorized"});
  }
});

app.post('/db/upd', async (req, res) => {
  if (req.headers.cookie === undefined) {res.status(401).json( {error: 401, message: "Unathorized"}); return 0}
  const raw = req.headers.cookie.split('_');
  const username = raw[0].toString()
  const hash = raw[1].toString()

  if (hash === await kv.get(`${username}:user`)) {
    try {
      const key = req.query.key;
      const val = req.query.value;

      if (key && val === undefined) {
        res.status(400).json( {error: 400, message: "Bad Request"} )
      }
      if (key === undefined) {
        res.status(400).json( {error: 400, message: "Bad Request"} )
      }
      if (val === undefined) {
        res.status(400).json( {error: 400, message: "Bad Request"} )
      }

      await kv.set(key, val);
    }
    catch (error) {
      res.send(error);
    }
    finally {
      res.status(200).json( {error: 200, message: "Success"} );
    }
  }
  else{
    res.status(401).json( {error: 401, message: "Unathorized"} )
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const body = req.body;
    const username = body.username;
    const password = body.password;
    console.log(req.body)
    console.log(username, password)
    console.log("point 1")
    const temp = await kv.get(`${username}:user`);
    console.log("point 2")
    const identify = await compare(password, temp)
    console.log("point 3")

    if (identify === true) {
      res.json( { identified: await compare(password, await kv.get(`${username}:user`)), hash: await kv.get(`${username}:user`) } )
    }
    if (identify === false) {
      res.json( { identified: await compare(password, await kv.get(`${username}:user`)) } )
    }
  }
  catch (error) {
    console.log(error);
  }
  finally {
    console.log("Success");
  }
});

app.get('/api/:service/:userid', async (req, res) => {
  const service = req.params.service.toLowerCase();
  const userid = req.params.userid;
  const services = {
    cash: { ServiceUp: true, Data: {cash: parseInt(await Data(userid, `CashData`))} },
    bounty: { ServiceUp: true, Data: {bounty: parseInt(await Data(userid, `BountyData`))} },
    inventory: { ServiceUp: false, Data: {} }
  }
  if (services[service] == undefined) {
    res.json({error: 404, message: "Service not found."})
  }
  else{
    if (services[service]['ServiceUp'] == false) {
      res.json({error: 404, message: "Service is down."})
    }
    else{
      res.json({Data: services[service]['Data'] })
    }
  }
})

app.get("/db/:name", async (req, res) => {
  const user = req.params.name
  //res.json({user: user})
  res.json( await kv.get(`${user}:cash`) );
})

app.get("/", async (req, res) => {
  var User = req.query.username;
  const currentYear = new Date().getFullYear()
  const User2 = req.query.username;
  if (await IsUsernameExists(User2) === false){
    res.send(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="description" content="normal day Database">
      
          <title>normal day Database</title>
      
          <link id="favicon" rel="icon" href="https://cdn.glitch.global/28c8c998-a442-42bd-a2ac-792bb7c18471/e2c2e91c989faec690034d6ed23b99ee.webp?v=1712847949804" type="image/x-icon">
          <!-- import the webpage's stylesheet -->
          <script src="https://kit.fontawesome.com/85a64fa0b4.js" crossorigin="anonymous"></script>
          <link rel="stylesheet" href="/style.css">
      
          <!-- import the webpage's client-side javascript file -->
          <script src="/client.js" defer></script>
        </head>
        <body>
          <nav class="navbar navbar-dark navbar-expand-sm" style="background-color: rgba(0, 0, 0, 0.3); !important;">
            <div class="container">
            <a class="" href="/" style="">
              <img src="https://cdn.glitch.global/28c8c998-a442-42bd-a2ac-792bb7c18471/e2c2e91c989faec690034d6ed23b99ee.webp?v=1712847949804" class="" alt="" width="40%">
            </a>
               <ul class="navbar-nav">
                      <li class="nav-item">
                          <a class="nav-link" href="https://www.roblox.com/groups/32921167">
                            Group
                          </a>
                      </li>
                      
                  </ul>
            </div>
          </nav>
            <div style="text-align: center; display: block;" class="alert" id="alert">
            <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span> 
            <strong>400:</strong> Bad Request
          </div>
          <header>
            <h1 style="text-align: center;">normal day Players Database</h1>
          </header>
          <!--<img style="filter: drop-shadow(15px 15px 15px black); max-width: 50%; border-radius: 10px; text-align: center; display: flex; margin-left: auto; margin-right: auto; z-index: 2;" draggable="false" src="https://cdn.glitch.global/28c8c998-a442-42bd-a2ac-792bb7c18471/dealer.png?v=1712607771843">-->
      
          <main style="text-align: center; padding-top: 25px;">
      
            <form>
              <label>
                <div class="input-group input-group-lg">
                  <input autocomplete="off" class="form-control" id="search-box" placeholder="Username" name="username" spellcheck="false" style="font-family: 'Consolas', monospace" type="search">
                  <div class="input-group-append">
                      <button class="btn" title="Search" type="submit"><i class="fa fa-magnifying-glass" aria-hidden="true"></i></button>
                  </div>
              </div>
              </label>
              
              
            </form>
      
            <section class="dreams">
              <ul id="dreams"></ul>
            </section>
          </main>
        </body>
      </html>
      `
    )
  }
  var Error = 'none';
  const regex = /^[\w.-]+$/;
  console.log(regex.test(User))
  if (User !== undefined && regex.test(User) === false) {
    // res.json({ error: '400: Bad Request' })
    // return 0;
  }

  if (User !== undefined && User.length < 3){
    // res.json({ error: '400: Bad Request' })
    // return 0;
  }
  
  if (User !== undefined && User.charAt(0) === '_'){
    // res.json({ error: '400: Bad Request' })
    // return 0;
  }
  if (typeof User !== "undefined") {
    var User = await userid_to_username(await username_to_userid(User));
    var cash = await Data(await username_to_userid(User), `CashData`).then(function(result){return result}, function(error){return error});
    var bounty = await Data(await username_to_userid(User), `BountyData`).then(function(result){return result}, function(error){return error})
    //console.log(typeof await is_verfified(User))
    if (User2 !== User){
      return res.redirect(`/?username=${User}`)
    }
    if (cash == null){
      cash = "0";
    }
    if (bounty == null){
      bounty = "0";
    }
    if (await username_to_userid(User) == null){
      // res.json({ error: '400: Bad Request' })
      // var Error = true;
      console.log("bad request")
      // return
    }
    if (await get_profilepic(await username_to_userid(User)) == ''){
      // res.json({error: "400: Bad Request"})
      // var Error = true;
      // return 0;
    }
    res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="normal day Database">

    <title>${User}'s Information</title>

    <link id="favicon" rel="icon" href="https://cdn.glitch.global/28c8c998-a442-42bd-a2ac-792bb7c18471/e2c2e91c989faec690034d6ed23b99ee.webp?v=1712847949804" type="image/x-icon">
    <!-- import the webpage's stylesheet -->
    <script src="https://kit.fontawesome.com/85a64fa0b4.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="/style.css">

    <!-- import the webpage's client-side javascript file -->
    <script src="/client.js" defer></script>
  </head>
  <body>
  <nav class="navbar navbar-dark navbar-expand-sm" style="background-color: rgba(0, 0, 0, 0.3); !important;">
  <div class="container">
  <a class="" href="/" style="">
    <img src="https://cdn.glitch.global/28c8c998-a442-42bd-a2ac-792bb7c18471/e2c2e91c989faec690034d6ed23b99ee.webp?v=1712847949804" class="" alt="" width="40%">
  </a>
     <ul class="navbar-nav">
            <li class="nav-item">
                <a class="nav-link" href="https://www.roblox.com/groups/32921167">
                  Group
                </a>
            </li>
            
        </ul>
  </div>
</nav>
  <div style="text-align: center; display: ${Error};" class="alert" id="alert">
      <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span> 
      <strong>400:</strong> Bad Request
    </div>
  <div class="container">
    <header>
      <h1 style="text-align: center; padding-bottom: 15px;">${
        User
      }'s Information</h1>
    </header>
    <div class="row">
    </div>
    <!--<img class="img-fluid" style="max-width: 50%; text-align: center; display: block; margin-left: auto; margin-right: auto;" src="https://cdn.glitch.global/28c8c998-a442-42bd-a2ac-792bb7c18471/dealer.png?v=1712607771843">-->

    <main style="text-align: center; padding-bottom: 35px;">
<form>
        <label>
          <div class="input-group input-group-lg">
            <input autocomplete="off" class="form-control" id="search-box" placeholder="Username" name="username" spellcheck="false" style="font-family: 'Consolas', monospace" type="search">
            <div class="input-group-append">
                <button class="btn" title="Search" type="submit"><i class="fa fa-magnifying-glass" aria-hidden="true"></i></button>
            </div>
        </div>
        </label>
        
        
      </form>
      <section class="dreams">
        <ul id="dreams"></ul>
      </section>
    <div class="row">
        <div class="col-md order-md-10">
            <div style="width: 75%;" class="card mb-3">
                <div class="card-header py-1">
                    <strong>
                        Profile </strong>
                </div>
                <div class="card-body py-1">
    <div class="row no-gutters">
                        <div class="col col-lg-4"><strong>Roblox ID</strong></div>
                        <div class="col-auto" id="userid"><samp>
                            
                                ${await username_to_userid(User)}
                            
</samp></div>
                    </div>
                    
                    <div class="row no-gutters">
                        <div class="col col-lg-4"><strong>Username</strong></div>
                        <div class="col-auto" id="username">${User} </div>
                        <img style="height: 1.25em;" class="profile-verified-badge-icon" id="profile-verified-badge-icon" src="${await is_verfified(User)}">
                    </div>
                    <div class="row no-gutters">
                        <div class="col col-lg-4"><strong>Cash</strong></div>
                        <div class="col-auto" id="cash">\$${cash.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                    </div>
<div class="row no-gutters">
                        <div class="col col-lg-4"><strong>Bounty</strong></div>
                        <div class="col-auto" id="cash">\$${bounty.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                    </div>
                </div>
                
            </div>
        </div>
      <div style="width: 25%;" class="col-md-auto order-md-1">
            <div class="card mb-3">
                <div class="card-body text-center p-0">
                    
                        <img id="profilepic" style="width: 15%; height: 15%;" src="${await get_profilepic(await username_to_userid(User))}">
                    
                </div>
            </div>
            
            <div class="card mb-3">
                <div class="card-header py-1">
                    <strong>
                        Status
                    </strong>
                </div>
                <div class="card-body" style="padding: 2px">
                    <div id="status" style="margin: auto; text-align: center;">
                                <strong>${await IsAlpha(await username_to_userid(User))}</strong><br style="display: ${await SpacingNeeded(await username_to_userid(User))};">
                                <strong id="EarlyAccess">${await IsEarlyAccess(await username_to_userid(User))}</strong>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </div>
    </main>
    <footer class="bg-light3 text-center text-white" style="margin-top: auto;">
      <div class="text-center p-3" style="background-color: rgba(0, 0, 0, 0.2);">© 2024 <a class="text-white" href="https://normal-day.vercel.app">normal day</a>. All Rights Reserved.
      </div>
    </footer>
  </body>
</html>
`);
    // res.sendFile(path.join(__dirname+'/views/view.html'));
  }
  else{
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="normal day Database">
    
        <title>normal day Database</title>
    
        <link id="favicon" rel="icon" href="https://cdn.glitch.global/28c8c998-a442-42bd-a2ac-792bb7c18471/e2c2e91c989faec690034d6ed23b99ee.webp?v=1712847949804" type="image/x-icon">
        <!-- import the webpage's stylesheet -->
        <script src="https://kit.fontawesome.com/85a64fa0b4.js" crossorigin="anonymous"></script>
        <link rel="stylesheet" href="/style.css">
    
        <!-- import the webpage's client-side javascript file -->
        <script src="/client.js" defer></script>
      </head>
      <body>
        <nav class="navbar navbar-dark navbar-expand-sm" style="background-color: rgba(0, 0, 0, 0.3); !important;">
          <div class="container">
          <a class="" href="/" style="">
            <img src="https://cdn.glitch.global/28c8c998-a442-42bd-a2ac-792bb7c18471/e2c2e91c989faec690034d6ed23b99ee.webp?v=1712847949804" class="" alt="" width="40%">
          </a>
             <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" href="https://www.roblox.com/groups/32921167">
                          Group
                        </a>
                    </li>
                    
                </ul>
          </div>
        </nav>
          <div style="text-align: center; display: none;" class="alert" id="alert">
          <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span> 
          <strong>400:</strong> Bad Request
        </div>
        <header>
          <h1 style="text-align: center; padding-bottom: 15px;">normal day Players Database</h1>
        </header>
        <img style="filter: drop-shadow(15px 15px 15px black); max-width: 35%; border-radius: 10px; text-align: center; display: flex; margin-left: auto; margin-right: auto; z-index: 2;" draggable="false" src="https://cdn.glitch.global/28c8c998-a442-42bd-a2ac-792bb7c18471/dealer.png?v=1712607771843">
    
        <main style="text-align: center; padding-top: 35px;">
    
          <form>
            <label>
              <div class="input-group input-group-lg">
                <input autocomplete="off" class="form-control" id="search-box" placeholder="Username" name="username" spellcheck="false" style="font-family: 'Consolas', monospace" type="search">
                <div class="input-group-append">
                    <button class="btn" title="Search" type="submit"><i class="fa fa-magnifying-glass" aria-hidden="true"></i></button>
                </div>
            </div>
            </label>
            
            
          </form>
    
          <section class="dreams">
            <ul id="dreams"></ul>
          </section>
        </main>
        <footer class="bg-light3 text-center text-white" style="margin-top: auto;">
          <div class="text-center p-3" style="background-color: rgba(0, 0, 0, 0.2);">© 2024 <a class="text-white" href="https://normal-day.vercel.app">normal day</a>. All Rights Reserved.
          </div>
        </footer>
      </body>
    </html>
    `)
  }
})
app.get("/admin/clear", async (req, res) => {
  req.cookies.username = null;
  res.json({code: 0, message: 'Success!'})
});

app.get("/admin", async (req, res) => {
  const User = req.query.username
  // const Password = req.query.password
  // await kv.set(`${User}`, `${Password}`);
  // res.send(`<h1>Success! ${await kv.get(User)}</h1>`)
  // if(req.cookies.username == null){
  //   var hour = 3600000;
  if (req.cookies.username === undefined){
    var hour = 3600000;
    // req.session.cookie.maxAge = 120; //2 weeks
    res.cookie('username', `${User}`, {
      maxAge: 3600 * 24,
      secure: true,
    });
    console.log(req.cookies.username);
    res.json({message: 'cookie'})
  }
  else{
    res.json(`${await kv.get(req.cookies.username)}`); 
  }
  // req.session.username.maxAge = 60; //2 weeks
  // }
  // else{
  //   res.json(`${await kv.get(req.cookies.username)}`);
  // }
})

app.get("/profile/Infragion", async (req, res) => {
  res.sendFile(__dirname + "/views/infragion.html")
})

app.listen(1337, () => console.log("Server ready on port 1337."));

module.exports = app;
