const { perfis, responder } = require('./_meta');

// GET /api/perfis -> [{igId, username}]
module.exports = (req, res) => responder(res, async () =>
  (await perfis()).map(({ igId, username }) => ({ igId, username })));
