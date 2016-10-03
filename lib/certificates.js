// Copyright © 2016 Jan Keromnes. All rights reserved.
// The following code is covered by the AGPL-3.0 license.

let child_process = require('child_process');
let forge = require('node-forge');
let letsencrypt = require('le-acme-core');

// ACME protocol client to interact with the Let's Encrypt service.
let client = letsencrypt.ACME.create({
  rsaKeySize: 4096
});

// The URL prefix that Let's Encrypt will use to challenge our identity.
// Source: https://ietf-wg-acme.github.io/acme/#http
let letsEncryptChallengePrefix =
  letsencrypt.acmeChallengePrefix || '/.well-known/acme-challenge/';

// ACME protocol challenge tokens proving our identity to Let's Encrypt.
let letsEncryptChallenges = {};


// Generate an RSA public and private key pair in forge format (binary).

function generateRSAKeyPair (callback) {

  // Generate a new 4096-bit RSA private key (up to 100x faster than forge).
  child_process.exec('openssl genrsa 4096', (error, stdout, stderr) => {

    if (error) {
      callback(error);
      return;
    }

    // Convert OpenSSL's PEM output format to binary forge representation.
    let privateKey = forge.pki.privateKeyFromPem(stdout);

    // Extract the public key from the private key.
    let publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);

    callback(null, {
      privateKey: privateKey,
      publicKey: publicKey
    });

  });

}

exports.generateRSAKeyPair = generateRSAKeyPair;


// Generate an SSH public and private key pair in OpenSSH format.

function createSSHKeyPair (callback) {

  generateRSAKeyPair((error, keypair) => {

    if (error) {
      callback(error);
      return;
    }

    let fingerprint = forge.ssh.getPublicKeyFingerprint(keypair.publicKey, {
      encoding: 'hex',
      delimiter: ':'
    });

    let sshKeyPair = {
      fingerprint: fingerprint,
      privateKey: forge.ssh.privateKeyToOpenSSH(keypair.privateKey),
      publicKey: forge.ssh.publicKeyToOpenSSH(keypair.publicKey)
    };

    callback(null, sshKeyPair);

  });

}

exports.createSSHKeyPair = createSSHKeyPair;


// Generate an HTTPS certificate using Let's Encrypt (https://letsencrypt.org/).

function createHTTPSCertificate (parameters, callback) {

  let hostname = parameters.hostname;
  let accountEmail = parameters.accountEmail;
  let accountKey = parameters.accountKey || null;
  let httpsKey = parameters.httpsKey || null;
  let letsEncryptUrl = parameters.letsEncryptUrl || client.stagingServerUrl;

  let acmeUrls = null;
  let registered = ('accountKey' in parameters);

  // Wait for all required tasks to finish before proceding (see tasks below).
  function done () {

    if (!acmeUrls || !accountKey || !httpsKey) {
      // Some tasks are not finished yet. Let's wait.
      return;
    }

    if (!registered) {
      // One more task to wait for: Register to Let's Encrypt.
      registerLetsEncryptAccount({
        accountEmail: accountEmail,
        accountKey: accountKey,
        acmeUrls: acmeUrls
      }, (error, registration) => {
        if (error) {
          callback(error);
          return;
        }
        registered = true;
        done();
      });
      return;
    }

    // All required tasks are now finished, destroy the `done` callback.
    done = null;

    // We can now actually request an HTTPS certificate from Let's Encrypt.
    requestLetsEncryptCertificate({
      hostname: hostname,
      acmeUrls: acmeUrls,
      accountKey: accountKey,
      httpsKey: httpsKey
    }, (error, certificate) => {
      if (error) {
        callback(error);
        return;
      }
      callback(null, certificate, accountKey);
    });

  }

  // Task: Use the given Let's Encrypt URL to discover its ACME protocol URLs.
  client.getAcmeUrls(letsEncryptUrl, (error, urls) => {
    if (error) {
      callback(error);
      return;
    }
    acmeUrls = urls;
    done();
  });

  if (!accountKey) {
    // Task: Generate a new account private key in PEM format.
    generateRSAKeyPair((error, keypair) => {
      if (error) {
        callback(error);
        return;
      }
      accountKey = forge.pki.privateKeyToPem(keypair.privateKey);
      done();
    });
  }

  if (!httpsKey) {
    // Task: Generate a new HTTPS private key in PEM format.
    generateRSAKeyPair((error, keypair) => {
      if (error) {
        callback(error);
        return;
      }
      httpsKey = forge.pki.privateKeyToPem(keypair.privateKey);
      done();
    });
  }

}

exports.createHTTPSCertificate = createHTTPSCertificate;


// Expose the URL prefix that Let's Encrypt will use to challenge our identity.

exports.letsEncryptChallengePrefix = letsEncryptChallengePrefix;


// Look for an identity token that satisfies the given Let's Encrypt challenge.

function getLetsEncryptChallengeToken (url) {

  if (!url || !url.startsWith(letsEncryptChallengePrefix)) {
    // Not a Let's Encrypt challenge URL.
    return null;
  }

  let key = url.slice(letsEncryptChallengePrefix.length);
  let token = letsEncryptChallenges[key] || null;

  if (!key || !token) {
    return null;
  }

  return token;

}

exports.getLetsEncryptChallengeToken = getLetsEncryptChallengeToken;


// Register a new Let's Encrypt account.

function registerLetsEncryptAccount (parameters, callback) {

  let accountEmail = parameters.accountEmail;
  let accountKey = parameters.accountKey;
  let acmeUrls = parameters.acmeUrls;

  let options = {
    newRegUrl: acmeUrls.newReg,
    email: accountEmail,
    accountKeypair: {
      privateKeyPem: accountKey
    },
    agreeToTerms: (url, agree) => {
      // Agree to anything. Now please send us all your money.
      agree(null, url);
    }
  };

  client.registerNewAccount(options, callback);

} // Don't export `registerLetsEncryptAccount`.


// Request HTTPS certificate issuance by Let's Encrypt via the ACME protocol.

function requestLetsEncryptCertificate (parameters, callback) {

  let hostname = parameters.hostname;
  let acmeUrls = parameters.acmeUrls;
  let accountKey = parameters.accountKey;
  let httpsKey = parameters.httpsKey;

  let options = {
    newAuthzUrl: acmeUrls.newAuthz,
    newCertUrl: acmeUrls.newCert,
    accountKeypair: {
      privateKeyPem: accountKey
    },
    domainKeypair: {
      privateKeyPem: httpsKey
    },
    setChallenge: (hostname, key, token, done) => {
      letsEncryptChallenges[key] = token;
      done();
    },
    removeChallenge: (hostname, key, done) => {
      delete letsEncryptChallenges[key];
      done();
    },
    domains: [
      hostname
    ]
  };

  client.getCertificate(options, callback);

} // Don't export `requestLetsEncryptCertificate`.