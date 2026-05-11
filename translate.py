import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

replacements = {
    r"Teles - Noticias de Chile \(y el mundo\)": "Reji Masası - Çoklu IPTV ve M3U8 izleme kontrol merkezi",
    r"PWA Código Abierto para ver/comparar preseleccionadas transmisiones de noticias provenientes de Chile \(y el mundo\).": "Çoklu IPTV ve M3U8 izleme kontrol merkezi.",
    r"teles": "Reji Masası",  # Watch out for this replacing class names or urls.
    r"Ha ocurrido un error al intentar cargar el archivo que contiene los canales": "Kanalları içeren dosyayı yüklerken bir hata oluştu",
    r"Pulsa para recargar": "Yenilemek için tıkla",
    r"Reiniciar almacenamiento local": "Yerel depolamayı sıfırla",
    r"Música Ambiente": "Arka Plan Müziği",
    r"Canales": "Kanallar",
    r"Añadir/Quitar canales": "Kanal Ekle/Kaldır",
    r"Cargar predeterminados": "Varsayılanları Yükle",
    r"Quitar activos": "Aktif Olanları Kaldır",
    r"Buscar canal...": "Kanal ara...",
    r"Cambiar canal": "Kanal Değiştir",
    r"Compartir": "Paylaş",
    r"Opciones de pantalla": "Ekran seçenekleri",
    r"Tema": "Tema",
    r"Claro": "Açık",
    r"Oscuro": "Koyu",
    r"Mostrar logos canales": "Kanal logolarını göster",
    r"Tamaño": "Boyut",
    r"100% altura": "%100 Yükseklik",
    r"Número de canales por fila": "Satır başına kanal sayısı",
    r"Entrar pantalla completa": "Tam Ekrana Geç",
    r"Botones flotantes": "Kayan Butonlar",
    r"Texto botones": "Buton Metni",
    r"Compartir configuración actual": "Mevcut Yapılandırmayı Paylaş",
    r"URL dinámica": "Dinamik URL",
    r"Información": "Bilgi",
    r"Añadir lista personalizada \(\.m3u\)": "Özel Liste Ekle (.m3u)",
    r"Cargar lista": "Listeyi Yükle",
    r"Combinar canales similares": "Benzer Kanalları Birleştir",
    r"Combinar coincidencias": "Eşleşenleri Birleştir",
    r"Pegar lista manual \(\.m3u\)": "Manuel Liste Yapıştır (.m3u)",
    r"Cargar desde texto": "Metinden Yükle",
    r"Logo en fondo": "Arka Planda Logo",
    r"Reiniciar personalizaciones": "Kişiselleştirmeleri Sıfırla",
    r"Instalar": "Yükle",
    r"Cerrar": "Kapat",
    r"¿Estás seguro de que deseas reiniciar todas tus personalizaciones\?": "Tüm kişiselleştirmelerinizi sıfırlamak istediğinizden emin misiniz?",
    r"Al hacerlo, todas las entradas que hayan sido creadas por este sitio en tu navegador a través de tu almacenamiento local \(localStorage\) serán eliminadas\. Esto es equivalente a recargar la página desde cero\.": "Bunu yaptığınızda, bu sitenin tarayıcınızda oluşturduğu yerel depolama (localStorage) verileri silinir. Bu, sayfayı sıfırdan yüklemeye eşdeğerdir.",
    r"Si estas presentando problemas con el funcionamiento de la página es recomendable proseguir y/o borrar la caché del navegador\.": "Sayfanın çalışmasında sorun yaşıyorsanız devam etmeniz ve/veya tarayıcı önbelleğini temizlemeniz önerilir.",
    r"Configuración": "Ayarlar",
    r"Personalizar": "Özelleştir",
    r"Añadir": "Ekle",
    r"Pantalla completa": "Tam Ekran",
    r"Salir pantalla completa": "Tam Ekrandan Çık",
    r"Actual:": "Mevcut:",
    r"Preferido": "Tercih Edilen",
    r"solo en visión cuadrícula": "sadece ızgara görünümünde",
    r"Reproductor preferido para transmisiones \(\.m3u8\)": "Yayınlar (.m3u8) için tercih edilen oynatıcı",
    r"No hay listas guardadas aún": "Henüz kaydedilmiş liste yok",
    r"Genera un enlace que intenta restaurar tu selección actual de canales activos en visión cuadrícula": "Izgara görünümündeki mevcut kanal seçiminizi geri yüklemeye çalışan bir bağlantı oluşturur.",
    r"Los canales se añadirán al final del listado actual sin borrar los predeterminados. La respuesta dependerá del origen de la lista \(puede fallar por CORS\)": "Kanallar varsayılanları silmeden listeye eklenecektir. (CORS nedeniyle başarısız olabilir)",
    r"Pega el contenido completo del archivo. Se aplicará la misma preferencia de combinación de canales": "Dosyanın tüm içeriğini yapıştırın. Aynı kanal birleştirme tercihi uygulanacaktır.",
    r"Cuando está activo, al añadir o quitar canales se actualiza el parámetro <code>c</code> en la barra de direcciones para que puedas compartir o recargar tu vista actual sin depender de localStorage": "Aktif olduğunda, kanal eklediğinizde veya çıkardığınızda adres çubuğundaki <code>c</code> parametresi güncellenir, böylece localStorage'a bağlı kalmadan görünümü paylaşabilir veya yeniden yükleyebilirsiniz.",
    r"Copiar enlace": "Bağlantıyı kopyala",
    r"Copiar setup": "Kurulumu kopyala",
    r"Este botón sirve para limpiar datos del sitio. Se te pedirá confirmar este paso": "Bu buton site verilerini temizlemeye yarar. Onay istenecektir.",
    r"12 a lo enfermo": "12 çok fazla",
    r"enlace sitio": "site bağlantısı",
    r"enlace configuración canales": "kanal yapılandırma bağlantısı",
    r"ocultar fondo": "arka planı gizle",
    r"ocultar texto botones flotante": "kayan buton metnini gizle",
    r"alternar uso 100% altura disponible": "mevcut 100% yüksekliği değiştir",
    r"mostrar logos en botones de canales": "kanal butonlarında logoları göster",
    r"Sincronizar el estado actual en la URL": "Mevcut durumu URL ile senkronize et",
    r"Reproducir música ambiente": "Arka plan müziği çal"
}

# Apply replacements without touching class names/tags if possible.
# Need to be careful with 'teles', maybe replace it manually if it's text.
# Let's handle 'teles' specifically.
html = re.sub(r'>teles<', '>Reji Masası<', html)
html = re.sub(r'alt="logo teles"', 'alt="logo Reji Masası"', html)
html = re.sub(r'<title>Teles - Noticias de Chile \(y el mundo\)</title>', '<title>Reji Masası - Çoklu IPTV ve M3U8 izleme kontrol merkezi</title>', html)

for old, new in replacements.items():
    if old != "teles":
        html = re.sub(old, new, html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
