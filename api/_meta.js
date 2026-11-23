// Acesso à API oficial da Meta usando as chaves guardadas na variável META_TOKENS (Vercel).
// META_TOKENS aceita: o JSON inteiro de "me/accounts?fields=name,access_token,instagram_business_account"
// copiado do Explorador da Graph API, OU uma lista de chaves de Página separadas por vírgula/linha.
const GRAPH = 'https://graph.facebook.com/v27.0';

function lerChaves() {
  const bruto = (process.env.META_TOKENS || '').trim();
  if (!bruto) return [];
  try {
    const j = JSON.parse(bruto);
    const itens = Array.isArray(j) ? j : (j.data || []);
    return itens.map(p => (typeof p === 'string' ? p : p.access_token)).filter(Boolean);
  } catch {
    return bruto.split(/[\s,;]+/).filter(t => t.length > 50);
  }
}

async function graph(caminho, params, token) {
  const url = new URL(`${GRAPH}/${caminho}`);
  for (const [k, v] of Object.entries(params || {})) if (v !== undefined && v !== '') url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) { const e = new Error(j.error.message); e.status = 502; throw e; }
  return j;
}

let cache = null, cacheEm = 0;
// [{igId, username, token}] — um por Página que tem Instagram ligado
async function perfis() {
  if (cache && Date.now() - cacheEm < 10 * 60 * 1000) return cache;
  const lista = [];
  for (const token of lerChaves()) {
    try {
      const me = await graph('me', { fields: 'instagram_business_account{id,username}' }, token);
      if (me.instagram_business_account)
        lista.push({ igId: me.instagram_business_account.id, username: me.instagram_business_account.username, token });
    } catch { /* chave inválida ou vencida: ignora */ }
  }
  cache = lista; cacheEm = Date.now();
  return lista;
}

async function tokenDo(igId) {
  const p = (await perfis()).find(x => x.igId === String(igId));
  if (!p) { const e = new Error('Perfil não conectado.'); e.status = 404; throw e; }
  return p.token;
}

function responder(res, fn) {
  return fn().then(
    dados => { res.setHeader('Cache-Control', 'no-store'); res.status(200).json(dados); },
    e => res.status(e.status || 500).json({ erro: e.message })
  );
}

module.exports = { graph, perfis, tokenDo, responder };
