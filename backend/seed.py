import asyncio
import logging
import os
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select

from database import AsyncSessionLocal
from models import (
    AdminUser, Article, ArticleCategory, Faq, HomepageSection, Package, PackageCompanion, PackageFacility,
    PackageGallery, PackageItinerary, ProductCategory, SiteSetting, Tag, Testimonial,
)
from seed_articles import ARTICLES
from storage import client as sb_client
from utils import slugify

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("seed")

IMG = {
    "hero": "https://images.unsplash.com/photo-1720549973451-018d3623b55a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "kaaba": "https://images.unsplash.com/photo-1592326871020-04f58c1a52f3?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "madinah": "https://images.unsplash.com/photo-1667454496584-9838026037af?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "turkey": "https://images.unsplash.com/photo-1567712595315-545da0d341b2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&fit=crop&w=300&h=300",
}

ADDRESS = "Jl. Teuku Nyak Arief No. 13, Lamgugob, Kec. Syiah Kuala, Kota Banda Aceh, Aceh 24415, Indonesia"

SETTINGS = {
    "brand": {"name": "Makki Madani Tour & Travel", "short_name": "Makki Madani", "legal_name": "PT. Makki Madani Indonesia", "tagline": "Teman Perjalanan Menuju Tanah Suci", "founded_year": 2026, "logo_url": "", "logo_dark_url": "", "favicon_url": ""},
    "theme": {"primary": "#0F766E", "primary_dark": "#115E59", "primary_light": "#CCFBF1", "accent": "#D97706", "navy": "#0F172A", "dark_mode_enabled": True},
    "contact": {"whatsapp": "082223492533", "phone": "082223492533", "email": "", "address": ADDRESS, "city": "Banda Aceh", "maps_link": "https://www.google.com/maps/search/?api=1&query=Jl.+Teuku+Nyak+Arief+No.+13+Lamgugob+Syiah+Kuala+Banda+Aceh", "maps_embed_url": "https://www.google.com/maps?q=Jl.+Teuku+Nyak+Arief+No.+13+Lamgugob+Syiah+Kuala+Banda+Aceh+24415&output=embed", "office_hours": "Senin – Sabtu, 09.00 – 17.00 WIB", "service_areas": ["Aceh", "Banda Aceh", "Sumatra", "Jakarta", "Seluruh Indonesia"]},
    "social": {"instagram": "https://instagram.com/makkimadani", "tiktok": "https://tiktok.com/@makkimadani", "youtube": "https://youtube.com/@makkimadani", "facebook": "https://facebook.com/makkimadani", "handle": "@makki madani"},
    "whatsapp": {
        "number": "082223492533", "group_url": "", "cta_label": "Konsultasi Sekarang", "registration_form_name": "Form Pendaftaran Paket",
        "default_message": "Assalamu'alaikum, saya ingin konsultasi mengenai program Umrah, Haji, atau Wisata Halal Makki Madani. Mohon informasinya.",
        "package_template": "Assalamu'alaikum, saya ingin mendapatkan informasi paket {paket} untuk keberangkatan {tanggal}. Mohon informasi lengkapnya.",
        "registration_template": "Assalamu'alaikum, saya ingin konsultasi {layanan}\n*Nama:* {nama}\n*WhatsApp:* {wa}\n*Paket:* {paket}\n*Rencana:* {rencana}\n*Catatan:* {catatan}\n*Form:* {form}\n*URL:* {url}\nMohon dibantu informasinya, terima kasih.",
    },
    "seo": {"site_url": os.environ.get("PUBLIC_SITE_URL", ""), "default_title": "Makki Madani Tour & Travel | Travel Umrah & Haji Banda Aceh", "title_suffix": " | Makki Madani Tour & Travel", "default_description": "Makki Madani Tour & Travel, travel umrah dan haji berkantor di Banda Aceh dengan pendampingan ibadah yang aman, nyaman, dan kekeluargaan. Melayani jamaah dari Aceh, Sumatra, Jakarta, dan seluruh Indonesia.", "keywords": ["travel umroh Aceh", "travel umroh Banda Aceh", "paket umroh Aceh", "travel umroh Jakarta", "paket umroh Jakarta", "travel haji khusus Jakarta", "travel umrah Aceh terpercaya"], "og_image_url": IMG["hero"], "twitter_handle": "", "google_site_verification": "", "locations": ["Aceh", "Banda Aceh", "Sumatra", "Jakarta", "Indonesia"]},
    "legal": {"ppiu": "[PLACEHOLDER — nomor izin PPIU akan diperbarui]", "pihk": "[PLACEHOLDER — nomor izin PIHK akan diperbarui]", "company_legal": "[PLACEHOLDER — akta pendirian & legalitas PT. Makki Madani Indonesia]", "nib": "[PLACEHOLDER]", "npwp": "[PLACEHOLDER]", "notes": "Informasi legalitas dan perizinan akan diperbarui setelah dokumen resmi tersedia. Kami tidak mencantumkan klaim perizinan yang belum terverifikasi.",
              "privacy_policy": "<h2>Kebijakan Privasi</h2><p>PT. Makki Madani Indonesia menghormati privasi Anda. Data yang Anda kirimkan melalui formulir pendaftaran dan konsultasi (nama, jenis kelamin, alamat, nomor WhatsApp, dan email) digunakan semata-mata untuk keperluan layanan perjalanan ibadah dan komunikasi terkait paket yang Anda minati.</p><h3>Penggunaan Data</h3><ul><li>Menghubungi Anda untuk konsultasi dan konfirmasi pendaftaran.</li><li>Memproses administrasi perjalanan.</li><li>Mengirimkan informasi paket apabila Anda berlangganan.</li></ul><h3>Keamanan</h3><p>Data disimpan pada sistem yang terlindungi dan hanya dapat diakses oleh admin berwenang. Kami tidak menjual data pribadi kepada pihak ketiga.</p><h3>Hak Anda</h3><p>Anda dapat meminta perubahan atau penghapusan data dengan menghubungi kami melalui WhatsApp resmi.</p><p><em>Dokumen ini dapat diperbarui sewaktu-waktu melalui dashboard admin.</em></p>",
              "terms": "<h2>Syarat & Ketentuan</h2><p>Dengan mengisi formulir pendaftaran di situs ini, Anda menyatakan bahwa data yang diberikan benar dan dapat dihubungi untuk proses konsultasi.</p><h3>Pendaftaran</h3><ul><li>Pengisian formulir belum merupakan konfirmasi keberangkatan hingga proses administrasi dan pembayaran dinyatakan lengkap oleh admin.</li><li>Kuota kursi bersifat terbatas dan dapat berubah.</li></ul><h3>Pembayaran</h3><ul><li>Skema DP dan pelunasan dijelaskan pada setiap paket dan dikonfirmasi oleh admin.</li><li>Ketentuan pembatalan dan pengembalian dana mengikuti kebijakan perusahaan yang disampaikan saat konsultasi.</li></ul><h3>Perubahan</h3><p>Jadwal, maskapai, dan hotel dapat berubah mengikuti kebijakan pihak otoritas, maskapai, atau penyedia layanan dengan pemberitahuan.</p><p><em>Dokumen ini dapat diperbarui sewaktu-waktu melalui dashboard admin.</em></p>"},
    "footer": {"description": "Travel Umrah Aceh yang hadir dengan pelayanan aman, nyaman, dan kekeluargaan. Berkantor di Banda Aceh dan melayani jamaah dari seluruh Aceh hingga luar Aceh.", "copyright": "© {year} PT. Makki Madani Indonesia. Hak cipta dilindungi.", "show_newsletter": True, "newsletter_title": "Dapatkan info paket & jadwal terbaru", "quick_links": [{"label": "Paket Umrah", "href": "/packages/umrah"}, {"label": "Paket Haji", "href": "/packages/haji"}, {"label": "Wisata Halal", "href": "/packages/wisata"}, {"label": "Tentang Kami", "href": "/about"}, {"label": "Artikel", "href": "/articles"}, {"label": "Kontak", "href": "/contact"}]},
    "about": {
        "profile": "Travel Umrah Aceh yang hadir dengan pelayanan aman, nyaman, dan kekeluargaan bagi masyarakat Aceh.\n\nFokus kami pada perjalanan Umrah berkualitas, pendampingan ibadah, serta kemitraan di seluruh Aceh hingga luar Aceh.",
        "vision": "Menjadi teman perjalanan ibadah yang amanah bagi jamaah Aceh dan Indonesia menuju Tanah Suci.",
        "mission": ["Menyelenggarakan perjalanan Umrah, Haji, dan wisata halal yang tertib, aman, dan nyaman.", "Menghadirkan pendampingan ibadah oleh pembimbing yang berpengalaman.", "Membangun kemitraan yang sehat di seluruh Aceh hingga luar Aceh.", "Melayani jamaah dengan semangat kekeluargaan dan transparansi."],
        "history": "Makki Madani Tour & Travel didirikan pada tahun 2026 di Banda Aceh di bawah PT. Makki Madani Indonesia. Berawal dari keinginan untuk menghadirkan layanan perjalanan ibadah yang dekat dengan masyarakat Aceh, kami tumbuh dengan prinsip pelayanan yang amanah dan kekeluargaan.",
        "pembina": [{"name": "Abi Drs. Tgk. H. M. Daud Hasbi, M.Ag.", "role": "Pembina", "photo_url": ""}, {"name": "Abi H. Muhammad Faisal Sanusi, S.Ag., M.Ag.", "role": "Pembina", "photo_url": ""}],
        "penasihat": [{"name": "Abi Drs. Tgk. H. Asnawi Abdullah, M.A.", "role": "Penasihat", "photo_url": ""}, {"name": "Ummi Zakiah Zainun, LC., M.Ag.", "role": "Penasihat", "photo_url": ""}],
        "values": [{"title": "Amanah", "description": "Setiap kepercayaan jamaah kami jaga dengan transparansi."}, {"title": "Kekeluargaan", "description": "Jamaah adalah keluarga; kami mendampingi dari persiapan hingga kepulangan."}, {"title": "Berkualitas", "description": "Pemilihan hotel, maskapai, dan pembimbing dilakukan dengan cermat."}],
        "office_image_url": "",
    },
    "general": {"language": "id", "currency": "IDR", "announcement": "", "show_announcement": False, "google_analytics_id": ""},
}

SECTIONS = [
    ("hero", "Teman Perjalanan Menuju Tanah Suci", "Travel Umrah, Haji, dan Wisata Halal berkantor di Banda Aceh. Pendampingan ibadah yang aman, nyaman, dan kekeluargaan untuk jamaah Aceh hingga seluruh Indonesia.",
     {"image_url": IMG["hero"], "badge": "Travel Umrah & Haji · Banda Aceh", "primary_cta_label": "Konsultasi Sekarang", "secondary_cta_label": "Lihat Paket", "secondary_cta_link": "/packages", "highlights": [{"title": "Pembimbing Berpengalaman", "description": "Didampingi tokoh & pembimbing ibadah"}, {"title": "Berkantor di Banda Aceh", "description": "Mudah dijangkau jamaah Aceh"}, {"title": "Pelayanan Kekeluargaan", "description": "Dari persiapan hingga kepulangan"}]}),
    ("search", "Cari Paket Perjalanan", "Temukan paket berdasarkan jenis program, kategori, dan bulan keberangkatan.", {}),
    ("umrah", "Paket Umrah", "Pilihan program Umrah dengan pendampingan ibadah yang menenangkan.", {"group": "UMRAH", "limit": 6}),
    ("haji", "Paket Haji", "Program Haji dengan persiapan matang dan bimbingan manasik.", {"group": "HAJI", "limit": 3}),
    ("wisata", "Wisata Halal", "Perjalanan wisata halal ke berbagai destinasi pilihan.", {"group": "WISATA", "limit": 3}),
    ("why_us", "Kenapa Memilih Makki Madani", "Kami hadir sebagai teman perjalanan yang amanah dan dekat dengan jamaah.",
     {"items": [{"icon": "HeartHandshake", "title": "Pendampingan Kekeluargaan", "description": "Jamaah didampingi sejak konsultasi, manasik, hingga kepulangan."}, {"icon": "BookOpenCheck", "title": "Bimbingan Ibadah", "description": "Manasik dan muthawwif berpengalaman mendampingi setiap rangkaian ibadah."}, {"icon": "Building2", "title": "Hotel & Penerbangan Terpilih", "description": "Akomodasi dan maskapai dipilih dengan cermat demi kenyamanan jamaah."}, {"icon": "MapPinned", "title": "Berkantor di Banda Aceh", "description": "Kantor fisik yang mudah dikunjungi untuk konsultasi langsung."}]}),
    ("promo", "Promo & Informasi Terbaru", "Ikuti informasi keberangkatan terdekat dan penawaran khusus.", {"image_url": IMG["madinah"], "badge": "Info Keberangkatan", "cta_label": "Lihat Paket Umrah", "cta_link": "/packages/umrah", "note": "Konten promo dapat diganti dari dashboard admin."}),
    ("pembimbing", "Tokoh Pembimbing & Pendamping", "Perjalanan ibadah didampingi tokoh dan pembimbing yang berpengalaman.",
     {"people": [{"name": "Ummi Zakiah Zainun, LC., M.Ag.", "title": "Pembimbing & Penasihat", "photo_url": "", "quote": "Basuh Luka Hati di Tanah Haram, Bersiap Menjemput Berkah Ramadhan.", "lines": ["Ketua II Dewan Pengurus Pusat WAZIN Jakarta", "Sekretaris PERWATT Provinsi Aceh", "Sekretaris Umum MES Aceh Besar", "Wakil Bendahara II ICMI Orda Aceh Besar"]}]}),
    ("testimonials", "Cerita Jamaah", "Pengalaman jamaah yang telah berangkat bersama kami.", {}),
    ("articles", "Artikel & Panduan", "Bekal pengetahuan sebelum berangkat ke Tanah Suci.", {"limit": 3}),
    ("faq", "Pertanyaan yang Sering Diajukan", "Jawaban atas pertanyaan umum seputar pendaftaran dan perjalanan.", {}),
    ("cta", "Siap Merencanakan Perjalanan Ibadah Anda?", "Tim kami siap membantu memilih paket yang sesuai kebutuhan dan waktu Anda.", {"primary_cta_label": "Konsultasi Sekarang", "secondary_cta_label": "Lihat Paket", "image_url": IMG["kaaba"]}),
]

CATEGORIES = {
    "HAJI": ["Haji Reguler", "Haji Khusus", "Haji Plus"],
    "UMRAH": ["Umrah Reguler", "Umrah Premium", "Umrah Ramadan", "Umrah Syawal", "Umrah Muharram", "Umrah Maulid Nabi", "Umrah Akhir Tahun", "Umrah Plus Turki", "Umrah Plus Dubai", "Umrah Plus Aqsa", "Umrah Plus Mesir", "Custom Family", "Custom Corporate", "Custom Independent"],
    "WISATA": ["Wisata Halal", "Turki", "Dubai", "Jepang", "Eropa", "Aceh", "Malaysia", "Thailand", "Korea"],
}

UMRAH_ITINERARY_12 = [
    (1, "Keberangkatan dari Banda Aceh", "Berkumpul di Bandara Sultan Iskandar Muda (BTJ), pengarahan singkat, dan penerbangan menuju Jeddah."),
    (2, "Tiba di Jeddah – Menuju Madinah", "Tiba di Bandara King Abdulaziz, perjalanan darat menuju Madinah, check-in hotel dan istirahat."),
    (3, "Madinah – Ziarah Raudhah", "Shalat berjamaah di Masjid Nabawi, ziarah Raudhah dan makam Rasulullah ﷺ sesuai jadwal."),
    (4, "Madinah – City Tour", "Ziarah Masjid Quba, Jabal Uhud, Masjid Qiblatain, dan kebun kurma."),
    (5, "Madinah – Ibadah Mandiri", "Memperbanyak ibadah di Masjid Nabawi dan kajian bersama pembimbing."),
    (6, "Madinah – Makkah (Miqat Bir Ali)", "Berihram di Bir Ali, perjalanan ke Makkah, check-in hotel, lalu melaksanakan umrah pertama."),
    (7, "Makkah – Ibadah di Masjidil Haram", "Shalat berjamaah, thawaf sunnah, dan kajian bersama pembimbing."),
    (8, "Makkah – City Tour & Thaif", "Ziarah Jabal Tsur, Jabal Rahmah, Arafah, Muzdalifah, Mina, dan perjalanan ke Thaif."),
    (9, "Makkah – Umrah Kedua (Opsional)", "Mengambil miqat di Ji'ranah atau Tan'im untuk umrah kedua bagi yang berkenan."),
    (10, "Makkah – Ibadah Mandiri", "Memaksimalkan ibadah di Masjidil Haram dan persiapan kepulangan."),
    (11, "Thawaf Wada – Menuju Jeddah", "Thawaf wada, check-out hotel, perjalanan ke Jeddah dan penerbangan pulang."),
    (12, "Tiba di Banda Aceh", "Tiba kembali di Bandara Sultan Iskandar Muda. Semoga menjadi umrah yang mabrur."),
]

PACKAGES = [
    {
        "name": "Umrah Bersama Ummi Zakiah Zainun, LC., M.Ag.", "category": "Umrah Reguler", "product_type": "Umrah Pendampingan Tokoh",
        "short_description": "Umrah 12 hari bersama Ummi Zakiah Zainun, LC., M.Ag. dengan penerbangan Garuda Indonesia langsung dari Banda Aceh, plus city tour Makkah, Madinah, dan Thaif.",
        "full_description": "Program umrah 12 hari dengan pendampingan langsung Ummi Zakiah Zainun, LC., M.Ag. Perjalanan dirancang untuk memberi ketenangan ibadah: penerbangan Garuda Indonesia rute Banda Aceh – Jeddah, hotel dekat Masjidil Haram dan Masjid Nabawi, serta muthawwif berpengalaman. Dilengkapi ziarah dan city tour di Makkah, Madinah, dan Thaif.",
        "is_featured": True, "price": 34500000, "dp_amount": 10000000, "payment_notes": "DP Rp10.000.000 saat pendaftaran, pelunasan selambat-lambatnya 45 hari sebelum keberangkatan.",
        "departure_date": date(2027, 1, 20), "return_date": date(2027, 1, 31), "duration_days": 12,
        "departure_airport": "Bandara Sultan Iskandar Muda (BTJ), Banda Aceh", "arrival_airport": "King Abdulaziz International Airport (JED), Jeddah", "airline": "Garuda Indonesia", "route": "BTJ - JED", "flight_info": "Penerbangan Garuda Indonesia langsung dari Banda Aceh. Jadwal penerbangan final diinformasikan H-7 keberangkatan.",
        "makkah_hotel": "Snood Ajyad / Setaraf", "makkah_hotel_rating": 4, "makkah_hotel_distance": "± 300 m dari Masjidil Haram", "madinah_hotel": "Abraj Taba / Setaraf", "madinah_hotel_rating": 4, "madinah_hotel_distance": "± 150 m dari Masjid Nabawi", "room_type": "Quad (sekamar berempat)", "other_accommodation": "Upgrade kamar double/triple tersedia dengan penyesuaian biaya.",
        "total_seats": 40, "seats_filled": 12, "limited_threshold": 8, "is_active": True, "is_published": True,
        "flyer_url": IMG["kaaba"], "hero_image_url": IMG["kaaba"], "extra_cities": ["Makkah", "Madinah", "Thaif"],
        "notes": "Harga dapat berubah mengikuti kurs dan kebijakan maskapai. Perlengkapan umrah diberikan saat manasik.",
        "terms": "Pendaftaran dianggap sah setelah DP diterima. Pembatalan mengikuti ketentuan yang disampaikan saat konsultasi. Paspor minimal berlaku 8 bulan dari tanggal keberangkatan.",
        "included": ["Tiket Pesawat Garuda Indonesia", "Visa Umrah", "Akomodasi Hotel", "Manasik Umrah", "Transportasi Selama di Tanah Suci", "Ziarah & City Tour", "Air Zamzam 5 Liter", "Muthawwif Berpengalaman"],
        "excluded": ["Pembuatan paspor", "Suntik meningitis & vaksin", "Pengeluaran pribadi", "Kelebihan bagasi"],
        "itinerary": UMRAH_ITINERARY_12,
        "gallery": [(IMG["kaaba"], "Masjidil Haram, Makkah"), (IMG["madinah"], "Masjid Nabawi, Madinah"), (IMG["hero"], "Suasana ibadah jamaah")],
        "companions": [{"name": "Ummi Zakiah Zainun, LC., M.Ag.", "title": "Pembimbing Utama", "bio": "Pembimbing ibadah dan penasihat Makki Madani Tour & Travel yang aktif dalam organisasi keumatan di Aceh dan Jakarta.", "photo_url": "", "quote": "Basuh Luka Hati di Tanah Haram, Bersiap Menjemput Berkah Ramadhan.", "profile_lines": ["Ketua II Dewan Pengurus Pusat WAZIN Jakarta", "Sekretaris PERWATT Provinsi Aceh", "Sekretaris Umum MES Aceh Besar", "Wakil Bendahara II ICMI Orda Aceh Besar"]}],
        "faqs": [("Apakah manasik dilakukan sebelum berangkat?", "Ya, manasik umrah dilaksanakan di Banda Aceh sebelum keberangkatan dan termasuk dalam paket."), ("Bagaimana skema pembayaran?", "DP Rp10.000.000 saat pendaftaran, pelunasan paling lambat 45 hari sebelum keberangkatan."), ("Apakah bisa upgrade kamar?", "Bisa. Upgrade ke kamar double atau triple tersedia dengan penyesuaian biaya.")],
    },
    {
        "name": "Umrah Premium 9 Hari", "category": "Umrah Premium", "product_type": "Umrah Premium",
        "short_description": "Contoh paket umrah premium 9 hari dengan hotel bintang 5 dekat Masjidil Haram. Data ilustrasi — ubah dari dashboard.",
        "full_description": "Paket contoh untuk menampilkan struktur program umrah premium. Seluruh detail (harga, hotel, maskapai, jadwal) merupakan ilustrasi dan harus diperbarui oleh admin.",
        "is_featured": True, "price": 45000000, "dp_amount": 15000000, "payment_notes": "Ilustrasi skema DP — ubah sesuai kebijakan.",
        "departure_date": date(2027, 3, 10), "return_date": date(2027, 3, 18), "duration_days": 9,
        "departure_airport": "Bandara Sultan Iskandar Muda (BTJ)", "arrival_airport": "Jeddah (JED)", "airline": "Saudia / Setaraf", "route": "BTJ - KUL - JED", "flight_info": "Ilustrasi penerbangan.",
        "makkah_hotel": "Hotel Bintang 5 / Setaraf", "makkah_hotel_rating": 5, "makkah_hotel_distance": "± 100 m dari Masjidil Haram", "madinah_hotel": "Hotel Bintang 5 / Setaraf", "madinah_hotel_rating": 5, "madinah_hotel_distance": "± 100 m dari Masjid Nabawi", "room_type": "Double / Triple",
        "total_seats": 25, "seats_filled": 21, "limited_threshold": 5, "is_active": True, "is_published": True,
        "flyer_url": IMG["madinah"], "hero_image_url": IMG["madinah"], "extra_cities": ["Makkah", "Madinah"],
        "notes": "Paket contoh (placeholder).", "terms": "Ketentuan mengikuti kebijakan perusahaan.",
        "included": ["Tiket pesawat PP", "Visa umrah", "Hotel bintang 5", "Manasik", "Muthawwif", "Transportasi", "Air zamzam"], "excluded": ["Paspor", "Vaksin", "Pengeluaran pribadi"],
        "itinerary": UMRAH_ITINERARY_12[:9], "gallery": [(IMG["madinah"], "Masjid Nabawi")], "companions": [], "faqs": [],
    },
    {
        "name": "Umrah Plus Turki 12 Hari", "category": "Umrah Plus Turki", "product_type": "Umrah Plus",
        "short_description": "Contoh paket umrah dilanjutkan wisata halal Istanbul & Bursa. Data ilustrasi — ubah dari dashboard.",
        "full_description": "Paket contoh untuk program Umrah Plus Turki. Detail merupakan ilustrasi dan harus diperbarui oleh admin.",
        "is_featured": False, "price": 42000000, "dp_amount": 12000000,
        "departure_date": date(2027, 5, 5), "return_date": date(2027, 5, 16), "duration_days": 12,
        "departure_airport": "BTJ", "arrival_airport": "JED", "airline": "Turkish Airlines / Setaraf", "route": "BTJ - IST - JED",
        "makkah_hotel": "Hotel Bintang 4 / Setaraf", "makkah_hotel_rating": 4, "madinah_hotel": "Hotel Bintang 4 / Setaraf", "madinah_hotel_rating": 4, "room_type": "Quad",
        "total_seats": 30, "seats_filled": 0, "limited_threshold": 5, "is_active": True, "is_published": True,
        "flyer_url": IMG["turkey"], "hero_image_url": IMG["turkey"], "extra_cities": ["Makkah", "Madinah", "Istanbul", "Bursa"],
        "notes": "Paket contoh (placeholder).", "included": ["Tiket pesawat PP", "Visa umrah", "Hotel", "Tur Istanbul & Bursa", "Muthawwif", "Tour leader"], "excluded": ["Paspor", "Pengeluaran pribadi", "Tipping"],
        "itinerary": [(1, "Berangkat dari Banda Aceh", "Penerbangan menuju Istanbul."), (2, "Istanbul", "Tur Blue Mosque, Hagia Sophia, Topkapi."), (3, "Bursa", "Ziarah Masjid Agung Bursa dan Uludag."), (4, "Istanbul – Jeddah", "Penerbangan menuju Jeddah, lanjut Madinah.")] + [(i + 4, t, d) for i, t, d in UMRAH_ITINERARY_12[2:10]],
        "gallery": [(IMG["turkey"], "Istanbul")], "companions": [], "faqs": [],
    },
    {
        "name": "Haji Khusus 1449 H", "category": "Haji Khusus", "product_type": "Haji Khusus",
        "short_description": "Contoh paket haji khusus. Harga, kuota, dan jadwal merupakan ilustrasi dan wajib diperbarui sesuai ketentuan resmi.",
        "full_description": "Paket contoh untuk struktur program Haji Khusus. Seluruh informasi bersifat placeholder dan tidak mencerminkan kuota atau regulasi resmi.",
        "is_featured": True, "price": 0, "dp_amount": 0, "payment_notes": "Hubungi admin untuk informasi biaya dan skema pembayaran.",
        "departure_date": None, "duration_days": 26, "departure_airport": "BTJ / CGK", "arrival_airport": "JED / MED", "airline": "Diinformasikan kemudian",
        "makkah_hotel": "Diinformasikan kemudian", "madinah_hotel": "Diinformasikan kemudian", "room_type": "Quad",
        "total_seats": 20, "seats_filled": 0, "limited_threshold": 3, "is_active": True, "is_published": True,
        "flyer_url": IMG["hero"], "hero_image_url": IMG["hero"], "extra_cities": ["Makkah", "Madinah", "Arafah", "Mina"],
        "notes": "Paket contoh (placeholder). Informasi kuota haji mengikuti ketentuan pemerintah.",
        "included": ["Bimbingan manasik haji", "Pendampingan pembimbing", "Akomodasi & konsumsi"], "excluded": ["Pembuatan paspor", "Vaksin", "Dam"],
        "itinerary": [(1, "Manasik & Persiapan", "Rangkaian manasik haji di Banda Aceh."), (2, "Keberangkatan", "Penerbangan menuju Tanah Suci.")], "gallery": [], "companions": [], "faqs": [],
    },
    {
        "name": "Wisata Halal Turki 8 Hari", "category": "Turki", "product_type": "Wisata Halal",
        "short_description": "Contoh paket wisata halal Istanbul – Cappadocia – Bursa. Data ilustrasi — ubah dari dashboard.",
        "full_description": "Paket contoh wisata halal ke Turki dengan hotel ramah muslim dan makanan halal. Detail bersifat ilustrasi.",
        "is_featured": False, "price": 28000000, "dp_amount": 8000000,
        "departure_date": date(2027, 6, 15), "return_date": date(2027, 6, 22), "duration_days": 8,
        "departure_airport": "BTJ / CGK", "arrival_airport": "IST", "airline": "Turkish Airlines / Setaraf", "route": "CGK - IST",
        "other_accommodation": "Hotel bintang 4 ramah muslim di Istanbul, Cappadocia, dan Bursa.", "room_type": "Twin",
        "total_seats": 20, "seats_filled": 20, "limited_threshold": 4, "is_active": True, "is_published": True,
        "flyer_url": IMG["turkey"], "hero_image_url": IMG["turkey"], "extra_cities": ["Istanbul", "Cappadocia", "Bursa"],
        "notes": "Paket contoh (placeholder).", "included": ["Tiket pesawat PP", "Hotel bintang 4", "Makan halal 3x sehari", "Tour leader", "Tiket masuk objek wisata"], "excluded": ["Pengeluaran pribadi", "Tipping", "Asuransi tambahan"],
        "itinerary": [(1, "Jakarta – Istanbul", "Penerbangan menuju Istanbul."), (2, "Istanbul", "Blue Mosque, Hagia Sophia, Grand Bazaar."), (3, "Cappadocia", "Penerbangan domestik, Goreme, Uchisar."), (4, "Cappadocia", "Balon udara (opsional), Pasabag, Avanos."), (5, "Bursa", "Masjid Agung Bursa, Green Mosque."), (6, "Istanbul", "Bosphorus cruise."), (7, "Istanbul – Jakarta", "Penerbangan pulang."), (8, "Tiba di Jakarta", "Tiba di Jakarta.")],
        "gallery": [(IMG["turkey"], "Istanbul")], "companions": [], "faqs": [],
    },
    {
        "name": "Wisata Aceh Heritage 3 Hari", "category": "Aceh", "product_type": "Wisata Halal Domestik",
        "short_description": "Contoh paket wisata religi & sejarah Banda Aceh – Sabang. Data ilustrasi — ubah dari dashboard.",
        "full_description": "Menelusuri Masjid Raya Baiturrahman, Museum Tsunami, Kapal PLTD Apung, hingga keindahan Sabang. Detail bersifat ilustrasi.",
        "is_featured": False, "price": 3500000, "dp_amount": 1000000,
        "departure_date": date(2026, 9, 12), "return_date": date(2026, 9, 14), "duration_days": 3,
        "departure_airport": "Banda Aceh", "arrival_airport": "Banda Aceh", "airline": "-", "route": "Banda Aceh - Sabang",
        "other_accommodation": "Hotel bintang 3 di Banda Aceh dan Sabang.", "room_type": "Twin",
        "total_seats": 15, "seats_filled": 4, "limited_threshold": 3, "is_active": False, "is_published": True,
        "flyer_url": IMG["hero"], "hero_image_url": IMG["hero"], "extra_cities": ["Banda Aceh", "Sabang"],
        "notes": "Paket contoh (placeholder) dengan status nonaktif untuk menunjukkan status CLOSED.", "included": ["Transportasi", "Hotel", "Makan", "Tiket kapal Sabang", "Pemandu"], "excluded": ["Pengeluaran pribadi"],
        "itinerary": [(1, "Banda Aceh", "Masjid Raya Baiturrahman, Museum Tsunami, PLTD Apung."), (2, "Sabang", "Pantai Iboih, Kilometer Nol."), (3, "Kembali", "Kembali ke Banda Aceh.")], "gallery": [], "companions": [], "faqs": [],
    },
]

FAQS = [
    ("Bagaimana cara mendaftar paket umrah?", "Pilih paket yang diminati, klik tombol \"Daftar Paket\", lalu isi formulir singkat. Tim kami akan menghubungi Anda melalui WhatsApp untuk konsultasi dan kelengkapan dokumen."),
    ("Dokumen apa saja yang perlu disiapkan?", "Umumnya paspor yang masih berlaku minimal 8 bulan, pas foto, KTP, kartu keluarga, dan buku vaksin meningitis. Daftar lengkap akan disampaikan saat konsultasi karena dapat berubah mengikuti ketentuan terbaru."),
    ("Apakah ada bimbingan manasik?", "Ya. Setiap paket umrah dan haji kami menyertakan manasik sebelum keberangkatan serta pendampingan muthawwif selama di Tanah Suci."),
    ("Bagaimana skema pembayaran?", "Pendaftaran dikonfirmasi dengan DP sesuai paket, dilanjutkan pelunasan sebelum keberangkatan. Rincian tertera pada tiap paket dan dapat dikonsultasikan dengan admin."),
    ("Apakah melayani jamaah dari luar Aceh?", "Tentu. Kami melayani jamaah dari Aceh, Sumatra, Jakarta, dan seluruh Indonesia. Titik keberangkatan dapat disesuaikan."),
    ("Di mana lokasi kantor Makki Madani?", f"Kantor kami berada di {ADDRESS}. Silakan berkunjung pada jam operasional atau hubungi WhatsApp terlebih dahulu."),
]

TESTIMONIALS = [
    ("Nama Jamaah (Contoh)", "Banda Aceh", "Umrah Reguler", "Contoh testimoni. Ganti dengan cerita jamaah asli melalui dashboard admin — Website → Testimonials."),
    ("Nama Jamaah (Contoh)", "Aceh Besar", "Umrah Plus Turki", "Contoh testimoni placeholder. Konten ini ditandai sebagai contoh dan dapat dihapus atau diubah oleh Super Admin."),
    ("Nama Jamaah (Contoh)", "Jakarta", "Umrah Premium", "Contoh testimoni placeholder. Kami tidak menampilkan testimoni fiktif; silakan unggah testimoni nyata jamaah."),
]

ARTICLE_CATEGORIES = [("UMRAH", "Panduan dan tips seputar ibadah umrah."), ("HAJI", "Persiapan dan panduan ibadah haji."), ("TRAVEL", "Tips memilih travel, hotel, dan maskapai.")]
TAGS = ["Umrah", "Haji", "Tips", "Persiapan", "Aceh", "Banda Aceh", "Jakarta", "Hotel", "Maskapai", "Pemula", "Perlengkapan", "Biaya"]


async def seed_admin(db):
    email = os.environ["SEED_ADMIN_EMAIL"].strip().lower()
    password = os.environ["SEED_ADMIN_PASSWORD"]
    auth_id = None
    try:
        res = sb_client().auth.admin.create_user({"email": email, "password": password, "email_confirm": True, "user_metadata": {"is_admin": True}})
        auth_id = res.user.id if res.user else None
        log.info("created supabase auth user %s", email)
    except Exception as exc:
        log.info("auth user create skipped: %s", str(exc)[:120])
        try:
            page = sb_client().auth.admin.list_users()
            for u in page:
                if (u.email or "").lower() == email:
                    auth_id = u.id
                    sb_client().auth.admin.update_user_by_id(u.id, {"password": password, "email_confirm": True})
        except Exception as exc2:
            log.warning("list users failed: %s", exc2)
    existing = await db.scalar(select(AdminUser).where(AdminUser.email == email))
    if not existing:
        db.add(AdminUser(email=email, auth_user_id=auth_id, full_name="Super Admin", role="SUPER_ADMIN", is_active=True))
    elif auth_id and existing.auth_user_id != auth_id:
        existing.auth_user_id = auth_id
    await db.commit()


async def seed_settings(db):
    for key, value in SETTINGS.items():
        if not await db.get(SiteSetting, key):
            db.add(SiteSetting(key=key, value=value))
    for i, (key, title, subtitle, content) in enumerate(SECTIONS):
        if not await db.scalar(select(HomepageSection).where(HomepageSection.key == key)):
            db.add(HomepageSection(key=key, title=title, subtitle=subtitle, content=content, sort_order=i, is_active=True))
    await db.commit()


async def seed_categories(db):
    if await db.scalar(select(func.count(ProductCategory.id))):
        return
    order = 0
    for group, names in CATEGORIES.items():
        for name in names:
            db.add(ProductCategory(name=name, slug=slugify(f"{group}-{name}" if group == "WISATA" and name not in ("Wisata Halal",) else name), group_type=group, sort_order=order, is_active=True, description=f"Program {name} dari Makki Madani Tour & Travel."))
            order += 1
    await db.commit()


async def seed_packages(db):
    if await db.scalar(select(func.count(Package.id))):
        return
    cats = {c.name: c for c in (await db.execute(select(ProductCategory))).scalars().all()}
    for n, p in enumerate(PACKAGES, start=1):
        cat = cats[p["category"]]
        pkg = Package(
            code=f"PKG-{n:04d}", name=p["name"], slug=slugify(p["name"]), category_id=cat.id, product_type=p.get("product_type"),
            short_description=p.get("short_description"), full_description=p.get("full_description"), is_featured=p.get("is_featured", False),
            price=p.get("price", 0), dp_amount=p.get("dp_amount", 0), payment_notes=p.get("payment_notes"),
            departure_date=p.get("departure_date"), return_date=p.get("return_date"), duration_days=p.get("duration_days"),
            departure_airport=p.get("departure_airport"), arrival_airport=p.get("arrival_airport"), airline=p.get("airline"), flight_info=p.get("flight_info"), route=p.get("route"),
            makkah_hotel=p.get("makkah_hotel"), makkah_hotel_rating=p.get("makkah_hotel_rating"), makkah_hotel_distance=p.get("makkah_hotel_distance"),
            madinah_hotel=p.get("madinah_hotel"), madinah_hotel_rating=p.get("madinah_hotel_rating"), madinah_hotel_distance=p.get("madinah_hotel_distance"),
            room_type=p.get("room_type"), other_accommodation=p.get("other_accommodation"),
            total_seats=p.get("total_seats", 0), seats_filled=p.get("seats_filled", 0), limited_threshold=p.get("limited_threshold", 5),
            is_active=p.get("is_active", True), is_published=p.get("is_published", True), flyer_url=p.get("flyer_url"), hero_image_url=p.get("hero_image_url"),
            extra_cities=p.get("extra_cities", []), notes=p.get("notes"), terms=p.get("terms"), booking_cta_label="Daftar Paket", whatsapp_cta_label="Konsultasi WhatsApp",
        )
        pkg.itineraries = [PackageItinerary(day_number=d, title=t, description=desc, sort_order=i) for i, (d, t, desc) in enumerate(p.get("itinerary", []))]
        pkg.facilities = [PackageFacility(kind="INCLUDED", label=l, sort_order=i) for i, l in enumerate(p.get("included", []))] + [PackageFacility(kind="EXCLUDED", label=l, sort_order=i) for i, l in enumerate(p.get("excluded", []))]
        pkg.gallery = [PackageGallery(image_url=u, caption=c, sort_order=i) for i, (u, c) in enumerate(p.get("gallery", []))]
        pkg.companions = [PackageCompanion(sort_order=i, **c) for i, c in enumerate(p.get("companions", []))]
        pkg.faqs = [Faq(question=q, answer=a, category="PACKAGE", sort_order=i) for i, (q, a) in enumerate(p.get("faqs", []))]
        db.add(pkg)
    await db.commit()


async def seed_misc(db):
    if not await db.scalar(select(func.count(Faq.id)).where(Faq.package_id.is_(None))):
        for i, (q, a) in enumerate(FAQS):
            db.add(Faq(question=q, answer=a, category="UMUM", sort_order=i))
    if not await db.scalar(select(func.count(Testimonial.id))):
        for i, (name, origin, label, content) in enumerate(TESTIMONIALS):
            db.add(Testimonial(name=name, origin=origin, package_label=label, content=content, rating=5, is_active=True, is_placeholder=True, sort_order=i))
    await db.commit()


async def seed_articles(db):
    if await db.scalar(select(func.count(Article.id))):
        return
    cats = {}
    for i, (name, desc) in enumerate(ARTICLE_CATEGORIES):
        c = await db.scalar(select(ArticleCategory).where(ArticleCategory.slug == slugify(name)))
        if not c:
            c = ArticleCategory(name=name, slug=slugify(name), description=desc, sort_order=i)
            db.add(c)
            await db.flush()
        cats[name] = c
    tags = {}
    for name in TAGS:
        t = await db.scalar(select(Tag).where(Tag.slug == slugify(name)))
        if not t:
            t = Tag(name=name, slug=slugify(name))
            db.add(t)
            await db.flush()
        tags[name] = t
    base = datetime.now(timezone.utc) - timedelta(days=len(ARTICLES))
    for i, a in enumerate(ARTICLES):
        art = Article(
            title=a["title"], slug=slugify(a["title"]), excerpt=a["excerpt"], content=a["content"], category_id=cats[a["category"]].id,
            author_name="Tim Makki Madani", status=a.get("status", "PUBLISHED"), published_at=(base + timedelta(days=i)) if a.get("status", "PUBLISHED") == "PUBLISHED" else None,
            seo_title=a["title"], seo_description=a["excerpt"][:300], is_featured=a.get("featured", False), featured_image_url=a.get("image", IMG["kaaba"]),
            sources=[{"label": "Referensi akan diperbarui oleh admin", "url": ""}],
        )
        art.tags = [tags[t] for t in a.get("tags", []) if t in tags]
        db.add(art)
    await db.commit()


async def main():
    async with AsyncSessionLocal() as db:
        await seed_admin(db)
        await seed_settings(db)
        await seed_categories(db)
        await seed_packages(db)
        await seed_misc(db)
        await seed_articles(db)
    log.info("seed complete")


if __name__ == "__main__":
    asyncio.run(main())
