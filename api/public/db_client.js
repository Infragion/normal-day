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

document.getElementById('login').addEventListener('click', async function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`/api/login?username=${username}&password=${password}`, {method: "POST"})
    const json = await res.json()
    console.log(json.identified);
    if (typeof(json.hash) === 'string' && json.identified === true) {
        document.cookie = `${username}_${json.hash}`;
        window.location.href = '/db';
    }
});