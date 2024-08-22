function PosEnd(end) {
    let len = end.value.length;

    // Mostly for Web Browsers
    if (end.setSelectionRange) {
        end.focus();
        end.setSelectionRange(len, len);
    } else if (end.createTextRange) {
        let t = end.createTextRange();
        t.collapse(true);
        t.moveEnd('character', len);
        t.moveStart('character', len);
        t.select();
    }
}

window.addEventListener("DOMContentLoaded", (event) => {
    const el = document.getElementById('search');
    if (el) {
        el.addEventListener("click", function() {
            const tofind = document.getElementById(document.getElementById('sinput').value)
            PosEnd(tofind)
        });
    }
});

// fetch(`/db/upd?key=${keys[key]}&value=document.getElementById(${cashid}`)

function DB_upd(key, value) {
    const val = document.getElementById(`${value}`).value;

    fetch(`/db/upd?key=${key}&value=${val}`, {method: "POST"});
}

function DB_del(key) {
    fetch(`/db/del?key=${key}`)
}

async function DB_login(username, password) {
    await fetch(`/api/login?username=${username}&password=${password}`, {method: "POST"}).then(response => { 
        console.log(response.json()); 
      }) 
}

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

document.getElementById('login').addEventListener('click', async function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    console.log(json.identified);
    const res = await fetch(`/api/login`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password })
    });
    const json = await res.json()
    if (typeof(json.hash) === 'string' && json.identified === true) {
        document.cookie = `${ascii_to_hex(username)}.${json.hash}`;
        console.log(document.cookie)
        window.location.href = '/db';
    }
});
