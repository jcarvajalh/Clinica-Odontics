/**
 * Sirve el sitio estático de dist/ y avisa al celular (ntfy) cuando alguien abre una página.
 *
 * Variables (en Cloudflare → Worker → Settings → Variables and Secrets):
 *   NTFY_TOPIC  (Secret)  Nombre del tema de ntfy al que estás suscrito en el celular.
 *
 * Enlaces por persona:  https://…/?p=dra-elizeth  → el aviso dice "Abrió: dra-elizeth".
 * Para no avisarte de tus propias visitas abre una vez:  https://…/?yo=1  (se recuerda 1 año en ese navegador).
 */

const BOTS = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|slack|discord|skype|vkshare|embedly|pinterest|linkedin|quora|redditbot|bingpreview|headless|lighthouse|curl|wget|python|node-fetch|axios|go-http|java\/|okhttp/i;
const REPEAT_MIN = 30; // no repetir el aviso del mismo navegador antes de 30 min

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Marca "soy yo": silencia los avisos en este navegador
    if (url.searchParams.has('yo')) {
      url.searchParams.delete('yo');
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.pathname + url.search,
          'Set-Cookie': 'od_me=1; Path=/; Max-Age=31536000; Secure; HttpOnly; SameSite=Lax',
        },
      });
    }

    const res = await env.ASSETS.fetch(request);

    const type = res.headers.get('content-type') || '';
    if (request.method !== 'GET' || res.status !== 200 || !type.includes('text/html')) return res;

    const ua = request.headers.get('user-agent') || '';
    const cookies = request.headers.get('cookie') || '';
    const prefetch = /prefetch|prerender/i.test(
      (request.headers.get('purpose') || '') + (request.headers.get('sec-purpose') || '')
    );
    if (!ua || BOTS.test(ua) || prefetch || cookies.includes('od_me=1') || cookies.includes('od_seen=1')) return res;

    if (env.NTFY_TOPIC) ctx.waitUntil(notify(env.NTFY_TOPIC, request, url, ua).catch(() => {}));

    const out = new Response(res.body, res);
    out.headers.append('Set-Cookie', `od_seen=1; Path=/; Max-Age=${REPEAT_MIN * 60}; Secure; HttpOnly; SameSite=Lax`);
    return out;
  },
};

async function notify(topic, request, url, ua) {
  const cf = request.cf || {};
  const who = url.searchParams.get('p');
  const page = url.pathname.replace(/^\/$/, '/ (inicio)');
  const place = [cf.city, cf.country].filter(Boolean).join(', ') || 'ubicación desconocida';
  const hour = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date());
  let ref = request.headers.get('referer') || '';
  try { if (ref) ref = new URL(ref).hostname; } catch { ref = ''; }

  const lines = [
    who ? `Abrió: ${who}` : null,
    `Página: ${page}`,
    `Desde: ${place}`,
    `Dispositivo: ${device(ua)}`,
    ref && ref !== url.hostname ? `Llegó desde: ${ref}` : null,
    `Hora: ${hour}`,
  ].filter(Boolean);

  await fetch('https://ntfy.sh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      title: who ? `${who} abrió la demo Odontics` : 'Abrieron la demo Odontics',
      message: lines.join('\n'),
      tags: ['eyes'],
      click: url.origin + url.pathname,
    }),
  });
}

function device(ua) {
  const os = /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Android' : 'Tablet Android')
    : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'Mac'
    : /Linux/.test(ua) ? 'Linux' : 'otro';
  const br = /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /SamsungBrowser/.test(ua) ? 'Samsung'
    : /Instagram/.test(ua) ? 'Instagram'
    : /FBAN|FBAV/.test(ua) ? 'Facebook'
    : /CriOS|Chrome\//.test(ua) ? 'Chrome'
    : /FxiOS|Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari' : '';
  return br ? `${os} · ${br}` : os;
}
