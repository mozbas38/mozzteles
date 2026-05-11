import os
import glob

replacements = {
    "bandera": "bayrak",
    "Sin bandera para país": "Ülke için bayrak yok",
    "Ir a la página oficial de esta transmisión": "Bu yayının resmi sayfasına git",
    "Icono ": "İkon ",
    "No disponible para la combinación seleccionada": "Seçilen kombinasyon için mevcut değil",
    "Señales desde:": "Sinyal kaynakları:",
    "dibujos animados": "çizgi filmler",
    "auto": "araba",
    "negocios": "iş",
    "clásico": "klasik",
    "comedia": "komedi",
    "huevo": "yemek",
    "cultura": "kültür",
    "documental": "belgesel",
    "educación": "eğitim",
    "entretenimiento": "eğlence",
    "familia": "aile",
    "general": "genel",
    "niños": "çocuk",
    "legislativo": "yasama",
    "estilo de vida": "yaşam tarzı",
    "películas": "filmler",
    "música": "müzik",
    "noticias": "haberler",
    "al aire libre": "açık hava",
    "relajado": "rahatlama",
    "religion": "din",
    "ciencia": "bilim",
    "series": "dizi",
    "tienda": "alışveriş",
    "deportes": "spor",
    "viaje": "gezi",
    "clima": "hava durumu",
    "adultos": "yetişkin",
    "indefinido": "tanımsız",
}

for filepath in glob.glob('assets/js/**/*.js', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

