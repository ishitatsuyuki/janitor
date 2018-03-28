// Copyright © 2017 Jan Keromnes. All rights reserved.
// The following code is covered by the AGPL-3.0 license.

const selfapi = require('selfapi');

const db = require('../lib/db');

// API resource to manage Janitor containers.
const containersAPI = module.exports = selfapi({
  title: 'Containers'
});

containersAPI.get({
  title: 'List containers',
  description:
    'List all the containers accessible by the current user.',

  handler: (req, res) => {
    const { user } = req;
    const filtered = Object.keys(user.machines).reduce((acc, key) => {
      const proj = user.machines[key];
      const projects = db.get('projects');
      return acc.concat(proj.filter((cur) => cur.status !== 'new').map((cur) => ({
        project: key,
        id: cur.id,
        name: cur.properties.name || `${projects[key].name} #${cur.id}`,
        status: cur.status,
        dockerHost: cur.docker.host,
        dockerContainer: cur.docker.container.slice(0, 16),
        dockerPorts: cur.docker.ports,
        updated: cur.data.updated
      })));
    }, []);
    res.json(filtered);
  },

  examples: []
});
