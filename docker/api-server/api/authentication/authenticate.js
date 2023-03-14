
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
const keyCache = new Map();

const fetchPublicRsaKey = async ({realm, authServerUrl, useCache}) => {
    const url = `${authServerUrl}/auth/realms/${realm}/protocol/openid-connect/certs`;
    let publicRsaKey;
    if (useCache && keyCache[url]) {
        return keyCache.get(url);
    } else {
        const publicCertsString = await fetch(url, {method: `GET`,
            headers: {"Content-Type": `application/json`}});
        const publicCertsJson = await publicCertsString.json();
        publicCertsJson.keys.forEach((key) => {
            if (key.alg === `RS256`) {
                publicRsaKey = key.x5c;
            }
        });
        const publicRsaKeyString = `-----BEGIN CERTIFICATE-----\n${publicRsaKey}\n-----END CERTIFICATE-----`;
        return publicRsaKeyString;
    }
};

const checkAuthenticated = async (req, res, next) => {
    const token = req.headers.authorization.split(` `)[1];
    const rsaKey = await fetchPublicRsaKey({realm: `jag`,
        authServerUrl: `http://auth-keycloak:8080`});
    jwt.verify(token, rsaKey, {algorithms: [`RS256`]}, (err, decodedToken) => {
        if (err) {
            console.log(err);
        } else {
            req.user = decodedToken
            next();
        }
    });
};

export {checkAuthenticated};
