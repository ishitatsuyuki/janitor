// Copyright © 2016 Jan Keromnes. All rights reserved.
// The following code is covered by the AGPL-3.0 license.

const selfapi = require('selfapi');
const db = require('../lib/db');

// Janitor API root resource.
const api = module.exports = selfapi({
  title: 'Janitor API',
  description:
    'A simple JSON API to interact with Janitor containers, hosts and projects.'
});

// Janitor API sub-resources.
api.api('/blog', require('./blog-api'));
api.api('/hosts', require('./hosts-api'));
api.api('/projects', require('./projects-api'));
api.api('/containers', require('./containers-api'));
api.api('/user', require('./user-api'));
api.api('/admin', require('./admin-api'));

// Misc small apis.
const status = api.api('/status', 'Get server status');
status.get({
  title: 'Get server status',
  description: 'Get server status including mode configuration',
  handler: (req, res) => {
    res.json({
      forceInsecure: db.get('security').forceInsecure
    });
  },
  examples: [{
    response: { body: JSON.stringify({ forceInsecure: true }) }
  }]
});
