/* SHA256 generator + validator compatible with Laravel hash("sha256",$password) */

async function sha256(text){

    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    const hashHex = hashArray
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    return hashHex;
}

/* verify SHA256 */

async function verifySHA256(password, hash){

    const generated = await sha256(password);

    return generated === hash.toLowerCase();
}