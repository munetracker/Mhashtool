/* Default Dark Theme */

(function () {

    const theme = localStorage.getItem("theme") || "dark";

    if (theme === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeBtn").innerText = "☀ Light Mode";
    } else {
        document.getElementById("themeBtn").innerText = "🌙 Dark Mode";
    }

})();

/* Toggle theme */

function toggleDark(){

    const isDark = document.body.classList.toggle("dark");

    localStorage.setItem("theme", isDark ? "dark" : "light");

    document.getElementById("themeBtn").innerText =
        isDark ? "☀ Light Mode" : "🌙 Dark Mode";

}

/* Worker for argon */

let worker = new Worker("./argonWorker.js");

worker.onmessage = function(e){

    if(!e.data.success){
        alert(e.data.error);
        return;
    }

    if (e.data.mode === "generate") {

        document.getElementById("result").value = e.data.hash;

        updateSQL(e.data.hash);

    }

    if(e.data.mode === "verify"){

        const el = document.getElementById("verifyResult");

        if(e.data.valid){
            el.innerText="✅ Password MATCHES hash";
            el.className="success";
        }else{
            el.innerText="❌ Password does NOT match";
            el.className="fail";
        }

    }

};

/* Generate hash */

async function generateHash(){

    const password=document.getElementById("password").value;
    const algo=document.getElementById("algo").value;

    if(!password){
        alert("Enter password");
        return;
    }

    /* SHA256 */

    if(algo==="sha256"){

        const hash = await sha256(password);

        document.getElementById("result").value = hash;
        updateSQL(hash);
        return;
    }

    /* bcrypt */

    if(algo==="bcrypt"){

        const salt=dcodeIO.bcrypt.genSaltSync(10);
        const hash=dcodeIO.bcrypt.hashSync(password,salt);

        document.getElementById("result").value=hash;
        updateSQL(hash);
        return;
    }

    /* argon */

    document.getElementById("result").value="Generating Argon2 hash...";

    let type;

    if(algo==="argon2i") type=1;
    if(algo==="argon2id") type=2;

    worker.postMessage({
        action:"generate",
        password:password,
        type:type
    });

}

/* Verify hash */

async function verifyHash(){

    const password=document.getElementById("verifyPassword").value.trim();
    const hash=document.getElementById("verifyHash").value.trim();

    if(!password || !hash){
        alert("Enter password and hash");
        return;
    }

    let valid=false;

    try{

        if(hash.startsWith("$2")){
            valid=dcodeIO.bcrypt.compareSync(password,hash);
        }

        else if(hash.startsWith("$argon2")){

            document.getElementById("verifyResult").innerText="Verifying Argon2...";

            worker.postMessage({
                action:"verify",
                password:password,
                hash:hash
            });

            return;

        }

        else if(hash.length === 64){

            const valid = await verifySHA256(password, hash);

            const el=document.getElementById("verifyResult");

            if(valid){
                el.innerText="✅ Password MATCHES SHA256 hash";
                el.className="success";
            }else{
                el.innerText="❌ Password does NOT match SHA256";
                el.className="fail";
            }

            return;
        }
        else{
            document.getElementById("verifyResult").innerText="❌ Unknown hash format";
            return;
        }

    }catch(err){

        document.getElementById("verifyResult").innerText="❌ Verification error: "+err;
        return;
    }

    const el=document.getElementById("verifyResult");

    if(valid){
        el.innerText="✅ Password MATCHES hash";
        el.className="success";
    }else{
        el.innerText="❌ Password does NOT match";
        el.className="fail";
    }

}

function copyHash() {

    const text = document.getElementById("result").value;

    if (!text) {
        alert("Nothing to copy.");
        return;
    }

    navigator.clipboard.writeText(text);

    alert("Hash copied!");
}


function updateSQL(hash) {

    const username =
        document.getElementById("username").value.trim() ||
        "juan_dela_cruz";

    document.getElementById("sqlResult").value =
`UPDATE users SET password='${hash}' WHERE username='${username}';`;

}

function copySQL() {

    const sql = document.getElementById("sqlResult").value;

    if (!sql) {
        alert("Nothing to copy.");
        return;
    }

    navigator.clipboard.writeText(sql);

    alert("SQL copied!");

}

document.getElementById("username").addEventListener("input", () => {

    const hash = document.getElementById("result").value.trim();

    if (hash)
        updateSQL(hash);

});