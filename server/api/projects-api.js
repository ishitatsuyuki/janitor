// Copyright © 2017 Jan Keromnes. All rights reserved.
// The following code is covered by the AGPL-3.0 license.

const selfapi = require('selfapi');

const db = require('../lib/db');
const log = require('../lib/log');
const machines = require('../lib/machines');
const users = require('../lib/users');

// API resource to manage Janitor software projects.
const projectsAPI = module.exports = selfapi({
  title: 'Projects'
});

projectsAPI.get({
  title: 'List projects',
  description:
    'List all the software projects supported by this Janitor instance.',

  handler: (request, response) => {
    const projects = db.get('projects');
    const filtered = Object.keys(projects).reduce((prev, key) => {
      const cur = projects[key];
      prev[key] = {
        name: cur.name,
        description: cur.description,
        icon: cur.icon,
        dockerHost: cur.docker.host,
        updated: cur.data.updated
      };
      return prev;
    }, {});
    response.json(filtered);
  },

  examples: [{
    response: {
      body: JSON.stringify({
        'test-project': {
          name: 'Test Project',
          description: '',
          icon: '',
          dockerHost: 'example.com',
          updated: 1500000000000
        }
      })
    }
  }]
});

// API sub-resource to manage a single software project.
const projectAPI = projectsAPI.api('/:project');

projectAPI.post('pull', {
  title: 'Pull a project',
  description: 'Trigger a Docker image pull for a given software project.',

  handler: (request, response) => {
    const { user, params } = request;
    // FIXME: Make this API handler accessible to Docker Hub web hooks, so that
    // it's easy to automatically deploy new project images.
    if (!users.isAdmin(user)) {
      response.statusCode = 403; // Forbidden
      response.json({ error: 'Unauthorized' });
      return;
    }

    const projectId = params.project;
    const projects = db.get('projects');
    if (!projects[projectId]) {
      response.statusCode = 404; // Not Found
      response.json({ error: 'Project not found' });
      return;
    }

    machines.pull(projectId, (error, data) => {
      if (error) {
        log('[fail] pulling project', projectId, error);
        response.statusCode = 500; // Internal Server Error
        response.json({ error: 'Could not pull project' });
        return;
      }

      response.json(data);
    });
  },

  examples: [{
    request: {
      urlParameters: { project: 'test-project' }
    },
    response: {
      body: JSON.stringify({
        image: 'image:latest',
        created: 1500000000000,
      })
    }
  }]
});
