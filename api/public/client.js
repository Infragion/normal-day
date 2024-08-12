// client-side js
// run by the browser each time your view template is loaded

console.log("hello world :o");

async function username_to_userid(username) {
  if (/^[!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]*$/.test(username)) {
    return undefined
  }
  if (username.length < 3){
    return undefined
  }
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
  const userId = userData.data[0];

  return userId;
}

// async function IsUsernameExists(User){
//   const response = await fetch(
//     `https://auth.roblox.com/v1/usernames/validate?request.username=${User}&request.birthday=1337-04-20`,
//     {
//       method: 'GET',
//       mode: 'no-cors',
//     },
//   );

//   const json = await response.json();
//   const code = json.code;

//   if (code === 1){
//     return true;
//   }
//   if (code === 0){
//     return false;
//   }
// }


// async function IsUserBanned(User){
//   await fetch(`https://www.roblox.com/users/profile?username=${await username_to_userid(User)}`).then((response) => {
//     if (response.ok) {
//       return false;
//     }
//     return true;
//   })
// }

// our default array of dreams
const dreams = [];

// define variables that reference elements on our page
const dreamsList = document.getElementById("dreams");
const dreamsForm = document.forms[0];
const dreamInput = dreamsForm.elements["search-box"];

const src ="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28' fill='none'%3E%3Cg clip-path='url(%23clip0_8_46)'%3E%3Crect x='5.88818' width='22.89' height='22.89' transform='rotate(15 5.88818 0)' fill='%230066FF'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M20.543 8.7508L20.549 8.7568C21.15 9.3578 21.15 10.3318 20.549 10.9328L11.817 19.6648L7.45 15.2968C6.85 14.6958 6.85 13.7218 7.45 13.1218L7.457 13.1148C8.058 12.5138 9.031 12.5138 9.633 13.1148L11.817 15.2998L18.367 8.7508C18.968 8.1498 19.942 8.1498 20.543 8.7508Z' fill='white'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_8_46'%3E%3Crect width='28' height='28' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E"

// a helper function that creates a list item for a given dream
const appendNewDream = async function(User) {
  var Error = false;
  const regex = /^[\w.-]+$/;
  const regex2 = /^[a-zA-Z0-9]+_[a-zA-Z0-9]+_[a-zA-Z0-9]+$/;
  if (User !== undefined && regex.test(User) === false && regex2.test(User) === false) {
    // res.json({ error: '400: Bad Request' })
    Error = true;
  }

  if (User !== undefined && User.length < 3){
    // res.json({ error: '400: Bad Request' })
    Error = true;
  }
  
  if (User !== undefined && User.charAt(0) === '_'){
    // res.json({ error: '400: Bad Request' })
    Error = true;
  }
  // if (User !== undefined && await IsUsernameExists(User) === false){
  //   // res.json({ error: '400: Bad Request' })
  //   Error = true;
  // }
  // if (User !== undefined && await IsUserBanned(User) === true){
  //   // res.json({ error: '400: Bad Request' })
  //   Error = true;
  // }
  const regex3 = /_/g; // Regex pattern to match underscores globally
  const underscoresCount = (User.match(regex3) || []).length; // Count underscores in the string

  if (underscoresCount >= 2) {
    Error = true;
  } 
  if (Error === true){
    console.log("alert")
    document.getElementById("alert").style.display = 'block';
  }
  else{
    console.log("redirect")
    window.location.href = `/?username=${User}`; 
  }
};

// iterate through every dream and add it to our page
dreams.forEach(function(dream) {
  appendNewDream(dream);
});

// listen for the form to be submitted and add a new dream when it is
dreamsForm.onsubmit = function(event) {
  // stop our form submission from refreshing the page
  event.preventDefault();

  // get dream value and add it to the list
  dreams.push(dreamInput.value);
  appendNewDream(dreamInput.value);

  // reset form
  dreamInput.focus();
};

const EarlyAccessText = document.getElementById("EarlyAccess")
const EarlyAccessText2 = document.getElementById("EarlyAccess2")

if (document.body.contains(EarlyAccessText) && EarlyAccessText.innerHTML != 'Early Access'){
  EarlyAccessText.remove()
  EarlyAccessText2.remove()
}
