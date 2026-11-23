"""Empaqueta cada página de fuente/ en un HTML autocontenido (CSS, JS e imágenes en línea).

Uso, desde esta carpeta:  python construir.py .
Genera index.html, carillas.html, etc. junto a este script.
"""
import base64, os, re, sys

root = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
src = os.path.join(root, 'fuente')
css = open(os.path.join(src, 'styles.css'), encoding='utf-8').read()
js = open(os.path.join(src, 'main.js'), encoding='utf-8').read()
MIME = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'svg': 'image/svg+xml'}
cache = {}

def data_uri(rel):
    if rel not in cache:
        ext = rel.rsplit('.', 1)[1].lower()
        raw = open(os.path.join(root, 'assets', rel), 'rb').read()
        cache[rel] = 'data:%s;base64,%s' % (MIME[ext], base64.b64encode(raw).decode())
    return cache[rel]

for name in sorted(os.listdir(src)):
    if not name.endswith('.html'):
        continue
    html = open(os.path.join(src, name), encoding='utf-8').read()
    html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')
    html = html.replace('<script src="main.js"></script>', '<script>\n' + js + '\n</script>')
    html = re.sub(r'\.\./assets/([\w/\-.]+\.(?:jpg|jpeg|png|svg))', lambda m: data_uri(m.group(1)), html)
    # Avatares de reseñas: el JS concatena una ruta base + nombre de archivo
    if "const A = '../assets/avatars/';" in html:
        html = html.replace("const A = '../assets/avatars/';", "const A = '';")
        for f in sorted(os.listdir(os.path.join(root, 'assets', 'avatars'))):
            html = html.replace("a: '%s'" % f, "a: '%s'" % data_uri('avatars/' + f))
    left = re.findall(r'\.\./assets/\S{0,30}', html)
    assert not left, (name, left)
    open(os.path.join(root, name), 'w', encoding='utf-8', newline='\n').write(html)
    print('built', name, len(html))
