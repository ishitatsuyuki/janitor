// Copyright © 2017 Jan Keromnes. All rights reserved.
// The following code is covered by the AGPL-3.0 license.

const jsonpatch = require('fast-json-patch');
const selfapi = require('selfapi');

const azure = require('../lib/azure');
const db = require('../lib/db');
const log = require('../lib/log');
const users = require('../lib/users');

// API resource to manage the Janitor instance itself.
const adminAPI = module.exports = selfapi({
  title: 'Admin'
});

// API sub-resource to manage Azure hosting.
const azureAPI = adminAPI.api('/azure');

azureAPI.patch('/credentials', {
  title: 'Update Azure credentials',
  description: 'Update Azure Active Directory application credentials (with JSON Patch).',

  handler: (request, response) => {
    const { user } = request;
    if (!user || !users.isAdmin(user)) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    const { credentials } = db.get('azure');

    try {
      const operations = request.body;
      jsonpatch.applyPatch(credentials, operations, true);
    } catch (error) {
      log('[fail] patching azure credentials', error);
      response.statusCode = 400; // Bad Request
      response.json({ error: 'Invalid JSON Patch' });
      return;
    }

    db.save();
    response.json({ message: 'JSON Patch applied' });
  },

  examples: [{
    request: {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        { op: 'replace', path: '/tenantId', value: '1234-5678' }
      ])
    },
    response: {
      body: JSON.stringify({ message: 'JSON Patch applied' })
    }
  }],
});

azureAPI.get('/virtualmachines', {
  title: 'List all virtual machines',
  description: 'List all virtual machines in Azure.',

  handler: async (request, response) => {
    const { user } = request;
    if (!user || !users.isAdmin(user)) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    try {
      const virtualMachines = await azure.getAllVirtualMachines();
      response.json(virtualMachines);
    } catch (error) {
      log('[fail] fetching azure virtual machines', error);
      response.statusCode = 500; // Internal Server Error
      response.json({ error: 'Could not fetch virtual machines' });
    }
  },

  examples: [],
});

// API sub-resource to manage OAuth2 providers.
const oauth2providersAPI = adminAPI.api('/oauth2providers', {
  beforeEachTest: next => {
    const providers = db.get('oauth2providers');
    if (!providers.github) {
      // FIXME Remove this if block when the GitHub pull request is merged:
      // https://github.com/JanitorTechnology/janitor/pull/80
      providers.github = {
        id: '',
        secret: '',
        hostname: 'github.com',
        api: 'api.github.com'
      };
    }
    providers.github.id = '1234';
    providers.github.secret = '123456';
    next();
  }
});

oauth2providersAPI.get({
  title: 'List OAuth2 providers',

  handler: (request, response) => {
    const { user } = request;
    if (!user || !users.isAdmin(user)) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    const providers = db.get('oauth2providers');
    response.json(providers);
  },

  examples: [{
    response: {
      body: JSON.stringify({
        github: {
          id: '1234',
          secret: '123456',
          hostname: 'github.com',
          api: 'api.github.com'
        }
      })
    }
  }]
});

// API sub-resource to manage a single OAuth2 provider.
const oauth2providerAPI = oauth2providersAPI.api('/:provider', {
  beforeEachTest: oauth2providersAPI.beforeEachTest
});

oauth2providerAPI.patch({
  title: 'Update an OAuth2 provider',
  description: 'Update an OAuth2 provider configuration (with JSON Patch).',

  handler: (request, response) => {
    const { user } = request;
    if (!user || !users.isAdmin(user)) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    const { provider: providerId } = request.params;
    const provider = db.get('oauth2providers')[providerId];
    if (!provider) {
      response.statusCode = 404;
      response.json({ error: 'Provider not found' });
      return;
    }

    try {
      const operations = request.body;
      jsonpatch.applyPatch(provider, operations, true);
    } catch (error) {
      log('[fail] patching oauth2 provider', error);
      response.statusCode = 400; // Bad Request
      response.json({ error: 'Invalid JSON Patch' });
      return;
    }

    db.save();
    response.json(provider);
  },

  examples: [{
    request: {
      urlParameters: { provider: 'github' },
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        { op: 'add', path: '/secret', value: '654321' },
      ]),
    },
    response: {
      body: JSON.stringify({
        id: '1234',
        secret: '654321',
        hostname: 'github.com',
        api: 'api.github.com',
      }),
    }
  }]
});
