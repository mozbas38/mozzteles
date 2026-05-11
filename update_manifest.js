const fs = require('fs');
const path = require('path');
const manifestPath = path.join(__dirname, 'site.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

manifest.name = "Reji Masası";
manifest.short_name = "Reji";
manifest.description = "Çoklu IPTV ve M3U8 izleme kontrol merkezi";
manifest.lang = "tr";

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
