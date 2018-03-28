const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { Nuxt, Builder } = require('nuxt');
const { promisify } = require('util');
const helmet = require('helmet');
const http = require('http');
const https = require('https');
const selfapi = require('selfapi');

const api = require('./api/');
const blog = require('./lib/blog');
const boot = require('./lib/boot');
const db = require('./lib/db');
const github = require('./lib/github');
const hosts = require('./lib/hosts');
const log = require('./lib/log');
const machines = require('./lib/machines');
const users = require('./lib/users');

const app = express();

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js');
config.dev = !(process.env.NODE_ENV === 'production');

async function start () {
  await promisify(boot.executeInParallel)([
    boot.forwardHttp,
    boot.ensureHttpsCertificates,
    boot.ensureDockerTlsCertificates
  ]);

  // You can customize these values in './db.json'.
  const hostname = db.get('hostname', 'localhost');
  const https = db.get('https');
  const ports = db.get('ports');
  const security = db.get('security');

  if (!security.forceInsecure) {
    app.use(helmet());
  } else {
    log('[warning] disabled all https security policies');
  }

  app.use(compression());
  app.use(bodyParser.json());
  app.use(cookieParser());

  // Authenticate signed-in user requests and sessions with a server middleware.
  app.use((request, response, next) => {
    users.get(request, response, (user, session) => {
      request.session = session;
      request.user = user;
      next();
    });
  });

  // Authenticate OAuth2 requests with a server middleware.
  app.use((request, response, next) => {
    request.oauth2scope = users.getOAuth2ScopeWithUser(request);
    next();
  });

  // Init Nuxt.js
  const nuxt = new Nuxt(config);

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt);
    await builder.build();
  }

  // Mount the Janitor API.
  selfapi(app, '/api', api);

  // Give nuxt middleware to express
  app.use(nuxt.render);

  // Listen the server
  let server;
  if (security.forceHttp) {
    server = http.createServer(app);
  } else {
    server = https.createServer({
      key: https.key,
      cert: https.crt,
      ca: https.ca
    }, app);
  }
  server.listen(ports.https);
  log('[ok] Janitor → http' + (security.forceHttp ? '' : 's') + '://' +
    hostname + ':' + ports.https);
}

start();
