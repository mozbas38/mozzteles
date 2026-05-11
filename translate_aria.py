import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    'aria-label="grupo de botones para abrir selector canales"': 'aria-label="kanal seçiciyi açma buton grubu"',
    'aria-label="Toggle navigation"': 'aria-label="Gezinmeyi aç/kapat"',
    'aria-label="Toggle radio para grupo botones"': 'aria-label="Buton grubu için radyo butonunu aç/kapat"',
    'aria-label="Toggle radio para grupo botones por categoría"': 'aria-label="Kategoriye göre buton grubu için radyo butonunu aç/kapat"',
    'aria-label="Close"': 'aria-label="Kapat"',
    'aria-label="grupo botones flotantes"': 'aria-label="kayan butonlar grubu"',
    'aria-label="Acceso a personalizaciones"': 'aria-label="Kişiselleştirmelere erişim"',
    'aria-label="button group botones dentro overlay"': 'aria-label="overlay içi buton grubu"',
    'aria-label="Selector reproductor m3u8"': 'aria-label="m3u8 oynatıcı seçici"',
    'aria-label="grupo botones número transmisiones por fila"': 'aria-label="satır başına yayın sayısı buton grubu"',
    'aria-label="button group posicion botones flotantes"': 'aria-label="kayan buton konumu buton grubu"'
}

for old, new in replacements.items():
    html = html.replace(old, new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
