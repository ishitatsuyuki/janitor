// Copyright © 2017 Jan Keromnes. All rights reserved.
// The following code is covered by the AGPL-3.0 license.

const jsonpatch = require('fast-json-patch');
const selfapi = require('selfapi');

const configurations = require('../lib/configurations');
const db = require('../lib/db');
const log = require('../lib/log');
const machines = require('../lib/machines');
const users = require('../lib/users');

// API resource to manage a Janitor user.
const userAPI = module.exports = selfapi({
  title: 'User',

  beforeEachTest: next => {
    const user = db.get('users')['admin@example.com'];
    user.profile.name = 'User';
    next();
  }
});

userAPI.get({
  title: 'Get the authenticated user',

  handler: (request, response) => {
    const { user } = request;
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    response.json(user.profile);
  },

  examples: [{
    response: {
      body: JSON.stringify({ name: 'User' })
    }
  }]
});

const loginAPI = userAPI.api('/login', 'Log in');

loginAPI.post({
  title: 'Log in',
  description: 'Request e-mail challenge to log in',

  handler: (req, res) => {
    const { user } = req;
    if (user) {
      res.json({ status: 'logged-in' });
      return;
    }

    const email = req.body.email;
    users.sendLoginEmail(email, req, res, error => {
      if (error) {
        const message = String(error);
        log(message, '(while emailing ' + email + ')');
        res.status(500).json({ status: 'error', message: message });
        return;
      }
      res.json({ status: 'email-sent' });
    });
  },
  examples: []
});

const logoutAPI = userAPI.api('/logout', 'Log out');

logoutAPI.post({
  title: 'Log out',
  handler: (req, res) => {
    users.logout(req, res, (error) => {
      if (error) {
        res.statusCode(500);
      }
      res.end();
    });
  },
  examples: []
});

userAPI.patch({
  title: 'Update the authenticated user',
  description: 'Update the user\'s profile information (with JSON Patch).',

  handler: (request, response) => {
    const { user } = request;
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    try {
      const operations = request.body;
      jsonpatch.applyPatch(user.profile, operations, true);
    } catch (error) {
      log('[fail] patching user.profile', error);
      response.statusCode = 400; // Bad Request
      response.json({ error: 'Invalid JSON Patch' });
      return;
    }

    db.save();
    response.json(user.profile);
  },

  examples: [{
    request: {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        { op: 'add', path: '/name', value: 'Different Name' }
      ])
    },
    response: {
      body: JSON.stringify({ name: 'Different Name' })
    }
  }]
});

// API sub-resource to manage user emails.
const emailsAPI = userAPI.api('/emails');

emailsAPI.get({
  title: 'Get all email addresses',

  handler: (request, response) => {
    const { user } = request;
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    response.json(user.emails);
  },

  examples: [{
    response: {
      body: JSON.stringify(['admin@example.com'])
    }
  }]
});

// API sub-resource to manage personal configuration files.
const configurationsAPI = userAPI.api('/configurations', {
  beforeEachTest: next => {
    const user = db.get('users')['admin@example.com'];
    user.configurations = { '.gitconfig': '[user]\nname = User' };
    next();
  }
});

configurationsAPI.get({
  title: 'Get all user configurations',

  handler ({ user }, response) {
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    response.json(user.configurations);
  },

  examples: [{
    response: {
      body: JSON.stringify({ '.gitconfig': '[user]\nname = User' })
    }
  }]
});

configurationsAPI.patch({
  title: 'Update user configurations',
  description: 'Update any user configuration file(s) (using JSON Patch).',

  handler (request, response) {
    const { user } = request;
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    try {
      const operations = request.body;
      const changedFiles = operations
        .map(operation => operation.path.replace(/^\//, ''));

      for (const file of changedFiles) {
        if (!configurations.allowed.includes(file)) {
          response.statusCode = 400; // Bad Request
          response.json({ error: `Updating ${file} is forbidden` });
          return;
        }
      }

      jsonpatch.applyPatch(user.configurations, operations, true);
    } catch (error) {
      log('[fail] patching user.configurations', error);
      response.statusCode = 400; // Bad Request
      response.json({ error: 'Invalid JSON Patch' });
      return;
    }

    db.save();
    response.json(user.configurations);
  },

  examples: [{
    request: {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        { op: 'add', path: '/.gitconfig', value: '[user]\nname = Sally' }
      ])
    },
    response: {
      body: JSON.stringify({ '.gitconfig': '[user]\nname = Sally' })
    }
  }]
});

// API sub-resource to manage a single configuration file.
const configurationAPI = configurationsAPI.api('/:file');

configurationAPI.delete({
  title: 'Reset a user configuration',
  description: 'Reset a user configuration file to its default template value.',

  handler ({ user, params }, response) {
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    configurations.resetToDefault(user, params.file, error => {
      if (error) {
        response.statusCode = 500; // Internal Server Error
        response.json({ error: 'Could not reset configuration' });
        return;
      }

      response.statusCode = 204; // No Content
      response.end();
    });
  },

  examples: [{
    request: {
      urlParameters: { file: '.gitconfig' },
    },
    response: {
      status: 204
    }
  }]
});

configurationAPI.put({
  title: 'Deploy a user configuration',
  description:
    'Install or overwrite a configuration file in all the user\'s containers ' +
    '(any local changes will be lost!)',

  handler ({ user, params }, response) {
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    const { file } = params;
    machines.deployConfigurationInAllContainers(user, file).then(count => {
      response.json({
        message: 'Successfully deployed to ' + count + ' container' +
          (count === 1 ? '' : 's')
      });
    }).catch(error => {
      log('[fail] could not deploy configuration file:', file, error);
      response.statusCode = 500; // Internal Server Error
      response.json({ error: 'Could not deploy configuration' });
    });
  },

  examples: [{
    request: {
      urlParameters: { file: '.gitconfig' },
    },
    response: {
      body: JSON.stringify({
        message: 'Successfully deployed to 1 container'
      })
    }
  }]
});

// API sub-resource to manage specific types of user credentials.
const credentialsAPI = userAPI.api('/credentials/:type');

credentialsAPI.delete({
  title: 'Delete user credentials',

  handler: (request, response) => {
    const { user } = request;
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }
    switch (request.params.type) {
      case 'cloud9':
        users.destroyCloud9Account(user);
        break;

      case 'github':
        users.destroyGitHubAccount(user);
        break;

      default:
        response.statusCode = 400; // Bad Request
        response.json({ error: 'Invalid credentials type' });
        return;
    }

    db.save();
    response.statusCode = 204; // No Content
    response.end();
  },

  examples: [{
    request: {
      urlParameters: { type: 'github' }
    },
    response: {
      status: 204
    }
  }]
});

// API sub-resource to manage user notifications.
const notificationsAPI = userAPI.api('/notifications', {
  beforeEachTest: next => {
    const user = db.get('users')['admin@example.com'];
    user.notifications.enabled = false;
    next();
  }
});

notificationsAPI.get({
  title: 'Get all user notifications',

  handler (request, response) {
    const { user } = request;
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    response.json(user.notifications.feed.map(({ notification }) => notification));
  },

  examples: [{
    response: {
      body: JSON.stringify([])
    }
  }]
});

// API sub-resource to enable or disable user notifications.
const notificationsEnabledAPI = notificationsAPI.api('/enabled', {
  beforeEachTest: notificationsAPI.beforeEachTest
});

notificationsEnabledAPI.get({
  title: 'Get the notification settings of the user',

  handler: (request, response) => {
    const { user } = request;
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    response.json({ enabled: user.notifications.enabled });
  },

  examples: [{
    response: {
      body: JSON.stringify({ enabled: false })
    }
  }]
});

notificationsEnabledAPI.put({
  title: 'Enable or disable user notifications',

  handler: (request, response) => {
    const { user } = request;
    if (!user) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    if ('enabled' in request.query) {
      let enabled;
      try {
        enabled = JSON.parse(request.query.enabled);
        if (typeof (enabled) !== 'boolean') throw new Error('Type mismatch');
      } catch (err) {
        response.statusCode = 400; // Bad Request
        response.json({ error: 'Parameter \'enabled\' should be "true" or "false"' });
        return;
      }
      user.notifications.enabled = enabled;
      db.save();
      response.json({ enabled });
      return;
    }

    try {
      const { enabled } = request.body;
      if (typeof (enabled) !== 'boolean') {
        throw new Error('Invalid type for \'enabled\': ' + typeof (enabled));
      }

      user.notifications.enabled = enabled;
      db.save();
      response.json({ enabled: user.notifications.enabled });
    } catch (error) {
      response.statusCode = 400; // Bad Request
      response.json({ error: 'Problems parsing JSON' });
    }
  },

  examples: [{
    request: {
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{ "enabled": true }',
    },
    response: {
      body: JSON.stringify({ enabled: true })
    },
  }, {
    request: {
      queryParameters: { enabled: true }
    },
    response: {
      body: JSON.stringify({ enabled: true })
    },
  }]
});
