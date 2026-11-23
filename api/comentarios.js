const { graph, tokenDo, responder } = require('./_meta');

// GET /api/comentarios?ig=<igId>&media=<mediaId>&after=<cursor>
// Uma página (até 50) de comentários com respostas: {data:[{username,text,timestamp,resposta}], after}
module.exports = (req, res) => responder(res, async () => {
  const { ig, media, after } = req.query;
  if (!/^\d+$/.test(String(media || ''))) { const e = new Error('Post inválido.'); e.status = 400; throw e; }
  const token = await tokenDo(ig);
  const j = await graph(`${media}/comments`, {
    fields: 'username,text,timestamp,replies.limit(100){username,text,timestamp}', limit: 50, after,
  }, token);
  const data = [];
  for (const c of j.data || []) {
    data.push({ username: c.username, text: c.text, timestamp: c.timestamp, resposta: false });
    if (c.replies) for (const r of c.replies.data)
      data.push({ username: r.username, text: r.text, timestamp: r.timestamp, resposta: true });
  }
  return { data, after: j.paging && j.paging.next ? j.paging.cursors.after : null };
});
