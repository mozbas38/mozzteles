import os
import glob

replacements = {
    "Ya estas en modo visión única": "Zaten tekli görünüm modundasınız",
    "Ya estas en modo visión cuadrícula": "Zaten ızgara görünümü modundasınız",
    "Ya estas en modo visión libre": "Zaten serbest görünüm modundasınız",
    "Ha ocurrido un error durante la actualización del estado botones personalizar overlay.": "Özelleştirme butonlarının durumunu güncellerken bir hata oluştu.",
    "habilitados": "etkin",
    "deshabilitados": "devre dışı",
    "Logos en botones": "Butonlardaki logolar",
    "Actualizando listado de canales...": "Kanal listesi güncelleniyor...",
    "Listado y canales activos actualizados correctamente": "Liste ve aktif kanallar başarıyla güncellendi",
    "Error": "Hata",
    "Ingresa la URL a tu archivo .m3u antes de cargarla.": "Yüklemeden önce .m3u dosyanızın URL'sini girin.",
    "La URL ingresada no es válida.": "Girilen URL geçerli değil.",
    "Lista personalizada cargada correctamente.": "Özel liste başarıyla yüklendi.",
    "No fue posible cargar la lista personalizada.": "Özel liste yüklenemedi.",
    "Pega el contenido completo de tu archivo .m3u antes de continuar.": "Devam etmeden önce .m3u dosyanızın tüm içeriğini yapıştırın.",
    "Lista manual cargada correctamente.": "Manuel liste başarıyla yüklendi.",
    "No fue posible procesar el texto pegado.": "Yapıştırılan metin işlenemedi.",
    "Canales omitidos al cargar desde URL": "URL'den yüklenirken atlanan kanallar",
    "Error durante carga inicial": "İlk yükleme sırasında hata",
    "Ha ocurrido un error durante la creación canal para ser insertado - ID:": "Eklenecek kanal oluşturulurken bir hata oluştu - ID:",
    "Ha ocurrido un error durante la eliminación canal - ID:": "Kanal kaldırılırken bir hata oluştu - ID:",
    "sin señales activas.": "aktif sinyal yok.",
    "Ha ocurrido un error durante la carga de canales predeterminados.": "Varsayılan kanallar yüklenirken bir hata oluştu.",
    "Error al inicializar Clappr para canal": "Kanal için Clappr başlatılamadı",
    "Se usará Video.js.": "Video.js kullanılacak.",
    "Error al inicializar Shaka Player para canal": "Kanal için Shaka Player başlatılamadı",
    "Error al inicializar OPlayer para canal": "Kanal için OPlayer başlatılamadı",
    "Error al inicializar Video.js para canal": "Kanal için Video.js başlatılamadı",
    "Se procesará el siguiente canal.": "Sonraki kanal işlenecek.",
    "Error al crear overlay para canal": "Kanal için overlay oluşturulamadı",
    "no tiene señales definidas. Se procesará el siguiente canal.": "tanımlanmış sinyallere sahip değil. Sonraki kanal işlenecek.",
    "Error al intentar cambiar señal para canal": "Kanal için sinyal değiştirilirken hata oluştu",
    "Error al cargar canales predeterminados": "Varsayılan kanallar yüklenirken hata",
    "Ha ocurrido un error al intentar quitar todos los canales.": "Tüm kanalları kaldırmaya çalışırken bir hata oluştu.",
    "Error al intentar eliminar almacenamiento local": "Yerel depolamayı silmeye çalışırken hata",
    "Error al solicitar entrar a pantalla completa": "Tam ekrana geçiş isteğinde hata",
    "Error al solicitar salir de pantalla completa": "Tam ekrandan çıkış isteğinde hata",
    "Error al intentar guardar canales en el almacenamiento local.": "Kanalları yerel depolamaya kaydetmeye çalışırken hata.",
    "Ha ocurrido un error al intentar filtrar canales.": "Kanalları filtrelemeye çalışırken bir hata oluştu.",
    "Ha ocurrido un error al intentar cambiar canal:": "Kanalı değiştirmeye çalışırken bir hata oluştu:",
    "por canal:": "yeni kanal:",
    "Ha ocurrido un error durante la carga de orden de paneles para modo \"Visión Única\".": "\"Tekli Görünüm\" modu için panel sırasını yüklerken bir hata oluştu.",
    "Lista personalizada": "Özel Liste",
    "Ha ocurrido un error al intentar activar el modo \"Visión Única\".": "\"Tekli Görünüm\" modunu etkinleştirmeye çalışırken bir hata oluştu.",
    "Ha ocurrido un error durante eliminación de canal activo en modo \"Visión Única\".": "\"Tekli Görünüm\" modunda aktif kanalı kaldırırken bir hata oluştu.",
    "Ha ocurrido un error al intentar desactivar el modo \"Visión Única\".": "\"Tekli Görünüm\" modunu devre dışı bırakmaya çalışırken bir hata oluştu.",
    "Ha ocurrido un error al intentar ajustar el numero de canales por fila.": "Satır başına kanal sayısını ayarlamaya çalışırken bir hata oluştu.",
    "Ha ocurrido un error durante la creación de botones para los canales.": "Kanal butonlarını oluştururken bir hata oluştu.",
    "Ha ocurrido un error al intentar activar filtro país.": "Ülke filtresini etkinleştirmeye çalışırken bir hata oluştu.",
    "Ha ocurrido un error durante la creación de botones para filtrado por país.": "Ülke filtresi için butonlar oluşturulurken bir hata oluştu.",
    "Ha ocurrido un error al intentar activar filtro categoría.": "Kategori filtresini etkinleştirmeye çalışırken bir hata oluştu.",
    "Ha ocurrido un error durante la creación de botones para filtrado por categoría.": "Kategori filtresi için butonlar oluşturulurken bir hata oluştu.",
    "Señal preferida para": "Tercih edilen sinyal:",
    "no disponible.": "kullanılamıyor.",
    "Cargando listas personalizadas previas...": "Önceki özel listeler yükleniyor...",
    "Lista personalizada eliminada correctamente.": "Özel liste başarıyla silindi.",
    "Ha ocurrido un error al intentar eliminar lista personalizada.": "Özel listeyi silmeye çalışırken bir hata oluştu."
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

