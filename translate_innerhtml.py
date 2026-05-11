import os
import glob

replacements = {
    "Cargando...": "Yükleniyor...",
    "Procesando...": "İşleniyor...",
    "Seleccionar señal": "Sinyal Seç",
    "Seleccionar diferente señal": "Farklı sinyal seç",
    "<span>Mover</span>": "<span>Taşı</span>",
    "<span>Cambiar</span>": "<span>Değiştir</span>",
    "Sitio Web": "Web Sitesi",
    "<span>Quitar</span>": "<span>Kaldır</span>",
    "Salir pantalla completa": "Tam ekrandan çık",
    "Entrar pantalla completa": "Tam ekrana geç",
    "Copiado exitoso!": "Kopyalama başarılı!",
    "Copiado fallido!": "Kopyalama başarısız!",
    "No hay listas guardadas.": "Kaydedilmiş liste yok.",
    "Fijada": "Sabitlendi",
    "No fijada": "Sabitlenmedi",
    "Aplicar": "Uygula",
    "Quitar": "Kaldır",
    "[solo en visión cuadrícula/libre]": "[sadece ızgara/serbest görünümde]",
    "Copiar setup": "Kurulumu kopyala",
    "Copiar enlace": "Bağlantıyı kopyala",
    "Activa primero canales": "Önce kanalları aktif et",
    "País: Todos los países": "Ülke: Tüm Ülkeler",
    "País:": "Ülke:",
    "Categoría: Todas": "Kategori: Tümü",
    "Categoría:": "Kategori:",
    "Pulsa para recargar": "Yenilemek için tıkla"
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

