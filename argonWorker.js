importScripts('argon2-bundled.min.js');

self.onmessage = async function(e){

    const {action, password, type, hash} = e.data;

    try{

        if(action === "generate"){

            const result = await argon2.hash({
                pass: password,
                salt: crypto.getRandomValues(new Uint8Array(16)),
                time: 4,
                mem: 65536,
                parallelism: 1,
                hashLen: 32,
                type: type
            });

            self.postMessage({
                success: true,
                mode: "generate",
                hash: result.encoded
            });

        }

        if(action === "verify"){

            const valid = await argon2.verify({
                pass: password,
                encoded: hash
            });

            self.postMessage({
                success: true,
                mode: "verify",
                valid: valid
            });

        }

    }catch(err){

        self.postMessage({
            success: false,
            error: err.toString()
        });

    }

};