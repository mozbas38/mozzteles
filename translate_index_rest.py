import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    '<meta property="og:title" content="teles">': '<meta property="og:title" content="Reji Masası">',
    '<meta name="twitter:title" content="teles">': '<meta name="twitter:title" content="Reji Masası">',
    '"teles"</span> es un proyecto de código abierto': '"Reji Masası"</span> açık kaynaklı bir projedir',
    '"teles"</span> no decodifica transmisiones. Los': '"Reji Masası"</span> yayınları çözmez.',
    '"teles"</span> no posee ningún tipo de monetización,': '"Reji Masası"</span> hiçbir şekilde paraya çevrilmez,',
    '"teles"</span> no ofrece canales de pago bajo': '"Reji Masası"</span> ücretli kanallar sunmaz.',
    'PWA Código Abierto para ver/comparar preseleccionadas transmisiones de noticias provenientes de Chile (y el mundo).': 'Çoklu IPTV ve M3U8 izleme kontrol merkezi.',
    'contáctame': 'iletişime geç'
}

for old, new in replacements.items():
    html = html.replace(old, new)

# And we also need to translate the URL encoded strings in share buttons
html = html.replace("PWA%20C%C3%B3digo%20Abierto%20para%20ver%2Fcomparar%20preseleccionadas%20transmisiones%20de%20canales%20de%20noticias%20provenientes%20de%20Chile%20(y%20el%20mundo).", "%C3%87oklu%20IPTV%20ve%20M3U8%20izleme%20kontrol%20merkezi.")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
