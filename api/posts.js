const { graph, tokenDo, responder } = require('./_meta');

// GET /api/posts?ig=<igId>&since=<unix>&until=<unix>&after=<cursor>
// Uma página (até 100) de posts do perfil: {data:[{id,shortcode,comments_count,timestamp}], after}
module.exports = (req, res) => responder(res, async () => {
  const { ig, since, until, after } = req.query;
  const token = await tokenDo(ig);
  const j = await graph(`${ig}/media`, {
    fields: 'id,shortcode,comments_count,timestamp', limit: 100, since, until, after,
  }, token);
  return { data: j.data || [], after: j.paging && j.paging.next ? j.paging.cursors.after : null };
});
