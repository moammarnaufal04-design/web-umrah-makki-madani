"""Initial SEO article content. Facts that may change over time are referenced to the admin-editable 'Referensi' section."""

NOTE = "<p><em>Catatan: Ketentuan, biaya, dan regulasi dapat berubah. Perbarui bagian Referensi melalui dashboard admin bila ada pembaruan resmi.</em></p>"


def html(paragraphs):
    return "".join(paragraphs) + NOTE


ARTICLES = [
    {
        "title": "Persiapan Umrah: Panduan Lengkap Sebelum Berangkat", "category": "UMRAH", "tags": ["Umrah", "Persiapan", "Pemula"], "featured": True,
        "excerpt": "Checklist persiapan umrah dari niat, fisik, dokumen, hingga mental agar ibadah berjalan tenang dan khusyuk.",
        "content": html([
            "<p>Perjalanan umrah adalah undangan istimewa. Persiapan yang matang membantu jamaah fokus beribadah tanpa terganggu urusan teknis. Berikut panduan ringkas yang kami rangkum dari pengalaman mendampingi jamaah dari Aceh dan sekitarnya.</p>",
            "<h2>1. Luruskan Niat</h2><p>Mulailah dengan niat yang bersih semata-mata karena Allah. Perbanyak doa agar dimudahkan sejak persiapan hingga kepulangan.</p>",
            "<h2>2. Persiapan Fisik</h2><p>Rangkaian thawaf dan sa'i membutuhkan stamina. Biasakan berjalan kaki 30–45 menit setiap hari beberapa minggu sebelum berangkat, jaga pola makan, dan konsultasikan kondisi kesehatan kepada dokter.</p>",
            "<h2>3. Dokumen Perjalanan</h2><p>Pastikan paspor masih berlaku sesuai ketentuan yang disyaratkan, siapkan pas foto, dan lengkapi dokumen yang diminta travel. Daftar dokumen dapat berubah, jadi selalu konfirmasi kepada admin.</p>",
            "<h2>4. Pelajari Manasik</h2><p>Ikuti manasik yang diadakan travel. Pahami rukun, wajib, dan larangan ihram agar ibadah sah dan tenang.</p>",
            "<h2>5. Persiapan Mental</h2><p>Siapkan diri untuk sabar menghadapi keramaian, cuaca, dan perbedaan budaya. Jadikan setiap tantangan sebagai bagian dari ibadah.</p>",
        ]),
    },
    {
        "title": "Memahami Komponen Biaya Umrah", "category": "UMRAH", "tags": ["Umrah", "Biaya", "Tips"],
        "excerpt": "Apa saja yang membentuk harga paket umrah? Pahami komponennya agar bisa membandingkan paket dengan adil.",
        "content": html([
            "<p>Harga paket umrah antar travel bisa berbeda cukup jauh. Perbedaan itu umumnya bersumber dari komponen berikut.</p>",
            "<h2>Tiket Pesawat</h2><p>Rute langsung atau transit, maskapai, serta musim keberangkatan sangat memengaruhi harga. Keberangkatan dari Banda Aceh dengan penerbangan langsung memiliki karakter biaya tersendiri dibanding transit.</p>",
            "<h2>Hotel dan Jarak ke Masjid</h2><p>Semakin dekat hotel ke Masjidil Haram dan Masjid Nabawi, biasanya semakin tinggi biayanya. Bintang hotel dan tipe kamar (quad, triple, double) juga menentukan.</p>",
            "<h2>Visa, Transportasi, dan Handling</h2><p>Biaya visa umrah, bus antar kota, muthawwif, serta layanan bandara termasuk dalam paket.</p>",
            "<h2>Perlengkapan dan Manasik</h2><p>Koper, kain ihram, seragam, buku panduan, dan sesi manasik biasanya sudah termasuk.</p>",
            "<h2>Tips Membandingkan</h2><p>Bandingkan paket dengan durasi, hotel, dan maskapai setara. Perhatikan apa yang <strong>tidak termasuk</strong> agar tidak ada biaya tak terduga.</p>",
        ]),
    },
    {
        "title": "Rukun Umrah yang Wajib Dipahami Jamaah", "category": "UMRAH", "tags": ["Umrah", "Pemula"],
        "excerpt": "Ihram, thawaf, sa'i, tahallul, dan tertib — penjelasan ringkas rukun umrah beserta hikmahnya.",
        "content": html([
            "<p>Rukun umrah adalah amalan pokok yang menentukan sahnya umrah. Jika salah satunya ditinggalkan, umrah tidak sah dan tidak dapat diganti dengan dam.</p>",
            "<h2>1. Ihram</h2><p>Berniat memulai umrah dari miqat sambil mengenakan pakaian ihram. Sejak saat itu berlaku larangan-larangan ihram.</p>",
            "<h2>2. Thawaf</h2><p>Mengelilingi Ka'bah tujuh putaran dimulai dari Hajar Aswad dengan posisi Ka'bah di sebelah kiri.</p>",
            "<h2>3. Sa'i</h2><p>Berjalan antara bukit Shafa dan Marwah sebanyak tujuh kali perjalanan.</p>",
            "<h2>4. Tahallul</h2><p>Mencukur atau memendekkan rambut sebagai tanda selesainya rangkaian umrah.</p>",
            "<h2>5. Tertib</h2><p>Melaksanakan rukun secara berurutan.</p><p>Pembimbing kami akan mengulang materi ini saat manasik agar jamaah mantap sebelum berangkat.</p>",
        ]),
    },
    {
        "title": "Wajib Umrah dan Larangan Ihram", "category": "UMRAH", "tags": ["Umrah"],
        "excerpt": "Perbedaan rukun dan wajib umrah, serta hal-hal yang dilarang selama berihram.",
        "content": html([
            "<p>Berbeda dengan rukun, wajib umrah apabila ditinggalkan umrah tetap sah namun wajib membayar dam. Dua wajib umrah yang umum disebut para ulama adalah berihram dari miqat dan menjauhi larangan ihram.</p>",
            "<h2>Larangan Ihram</h2><ul><li>Memakai pakaian berjahit (bagi laki-laki) dan menutup kepala.</li><li>Menutup wajah dan memakai sarung tangan (bagi perempuan).</li><li>Memakai wewangian.</li><li>Memotong kuku dan mencukur rambut sebelum tahallul.</li><li>Berburu atau membunuh binatang buruan.</li><li>Melangsungkan akad nikah, serta hal-hal yang mengarah pada hubungan suami istri.</li></ul>",
            "<p>Materi ini akan dijelaskan lebih detail oleh pembimbing saat manasik, termasuk pendapat ulama mengenai hal-hal yang diperselisihkan.</p>",
        ]),
    },
    {
        "title": "Tata Cara Umrah dari Miqat hingga Tahallul", "category": "UMRAH", "tags": ["Umrah", "Pemula"],
        "excerpt": "Urutan praktis pelaksanaan umrah yang mudah diikuti jamaah pemula.",
        "content": html([
            "<h2>1. Di Miqat</h2><p>Mandi, berwudhu, mengenakan ihram, shalat sunnah ihram, lalu berniat umrah dan bertalbiyah.</p>",
            "<h2>2. Memasuki Masjidil Haram</h2><p>Masuk dengan kaki kanan sambil berdoa, menuju Hajar Aswad untuk memulai thawaf.</p>",
            "<h2>3. Thawaf</h2><p>Tujuh putaran, berdoa dengan bahasa yang dipahami, diakhiri shalat sunnah di belakang Maqam Ibrahim bila memungkinkan, lalu minum air zamzam.</p>",
            "<h2>4. Sa'i</h2><p>Memulai dari Shafa menuju Marwah, tujuh perjalanan, sambil berdoa dan berdzikir.</p>",
            "<h2>5. Tahallul</h2><p>Memotong rambut; laki-laki disunnahkan mencukur habis, perempuan memotong sepanjang ruas jari.</p>",
        ]),
    },
    {
        "title": "Perlengkapan Umrah: Daftar Barang yang Perlu Dibawa", "category": "UMRAH", "tags": ["Umrah", "Perlengkapan", "Persiapan"],
        "excerpt": "Checklist koper umrah: pakaian, perlengkapan ibadah, obat pribadi, dan barang kecil yang sering terlupa.",
        "content": html([
            "<h2>Perlengkapan Ibadah</h2><ul><li>Kain ihram (laki-laki) atau pakaian ihram (perempuan) minimal dua set.</li><li>Sajadah tipis, tasbih, Al-Qur'an saku atau aplikasi.</li><li>Buku doa dan panduan manasik.</li></ul>",
            "<h2>Pakaian dan Alas Kaki</h2><ul><li>Pakaian longgar dan sopan untuk di luar waktu ihram.</li><li>Sandal yang nyaman dan tas sandal kecil.</li><li>Kaus kaki, jaket tipis untuk pendingin ruangan.</li></ul>",
            "<h2>Kesehatan</h2><ul><li>Obat pribadi dan resep dokter.</li><li>Masker, pelembap bibir, tabir surya tanpa wewangian untuk saat ihram.</li></ul>",
            "<h2>Lainnya</h2><ul><li>Botol semprot kecil, tas pinggang, adaptor colokan, power bank.</li><li>Fotokopi dokumen penting disimpan terpisah.</li></ul>",
        ]),
    },
    {
        "title": "Tips Umrah Pertama Kali agar Tenang dan Khusyuk", "category": "UMRAH", "tags": ["Umrah", "Tips", "Pemula"],
        "excerpt": "Panduan praktis untuk jamaah yang baru pertama kali berangkat umrah.",
        "content": html([
            "<p>Umrah pertama sering diiringi rasa cemas. Beberapa tips berikut membantu Anda lebih tenang.</p>",
            "<ul><li><strong>Ikuti manasik dengan serius</strong> dan jangan ragu bertanya kepada pembimbing.</li><li><strong>Kenali rombongan</strong> dan simpan nomor tour leader serta muthawwif.</li><li><strong>Ingat landmark hotel</strong> agar tidak tersesat saat kembali dari masjid.</li><li><strong>Jaga kondisi tubuh</strong>: minum cukup, istirahat, dan tidak memaksakan diri.</li><li><strong>Fokus pada ibadah</strong>, kurangi aktivitas belanja yang menguras tenaga.</li></ul>",
        ]),
    },
    {
        "title": "Perbedaan Umrah dan Haji yang Perlu Diketahui", "category": "UMRAH", "tags": ["Umrah", "Haji"],
        "excerpt": "Hukum, waktu, rukun, dan durasi — ini perbedaan mendasar antara umrah dan haji.",
        "content": html([
            "<h2>Hukum</h2><p>Haji termasuk rukun Islam dan wajib sekali seumur hidup bagi yang mampu; umrah hukumnya diperselisihkan antara wajib dan sunnah muakkadah.</p>",
            "<h2>Waktu</h2><p>Haji hanya dilaksanakan pada bulan Dzulhijjah dengan puncaknya wukuf di Arafah; umrah dapat dilakukan kapan saja sepanjang tahun.</p>",
            "<h2>Rukun</h2><p>Haji memiliki rukun tambahan yaitu wukuf di Arafah, serta rangkaian mabit di Muzdalifah dan Mina serta melontar jumrah.</p>",
            "<h2>Durasi dan Kuota</h2><p>Haji memerlukan waktu lebih panjang dan mengikuti kuota pemerintah, sedangkan umrah lebih fleksibel.</p>",
        ]),
    },
    {
        "title": "Tips Memilih Travel Umrah yang Amanah", "category": "UMRAH", "tags": ["Umrah", "Tips", "Aceh", "Banda Aceh"],
        "excerpt": "Hal-hal yang perlu diperiksa sebelum memilih travel umrah, terutama bagi jamaah di Aceh dan sekitarnya.",
        "content": html([
            "<ul><li><strong>Legalitas</strong>: pastikan travel memiliki izin resmi penyelenggara perjalanan ibadah umrah dan tanyakan nomor izinnya.</li><li><strong>Kantor fisik</strong> yang bisa dikunjungi, misalnya di Banda Aceh untuk jamaah Aceh.</li><li><strong>Transparansi paket</strong>: hotel, maskapai, jarak hotel, dan rincian yang tidak termasuk dijelaskan jelas.</li><li><strong>Pembimbing</strong>: adanya pembimbing ibadah dan muthawwif berpengalaman.</li><li><strong>Rekam jejak</strong>: testimoni jamaah nyata dan konsistensi jadwal keberangkatan.</li><li><strong>Harga wajar</strong>: waspadai harga yang terlalu murah dibanding komponen biayanya.</li></ul>",
        ]),
    },
    {
        "title": "Persiapan Haji: Langkah Awal Menuju Baitullah", "category": "HAJI", "tags": ["Haji", "Persiapan"], "featured": True,
        "excerpt": "Dari pendaftaran hingga pembekalan manasik, inilah tahapan persiapan haji yang perlu dipahami.",
        "content": html([
            "<p>Ibadah haji membutuhkan persiapan jangka panjang. Berikut tahapan umumnya.</p>",
            "<h2>Pendaftaran</h2><p>Pendaftaran haji mengikuti mekanisme dan ketentuan pemerintah. Jalur haji khusus memiliki prosedur tersendiri yang dapat dikonsultasikan dengan travel.</p>",
            "<h2>Kesehatan</h2><p>Pemeriksaan kesehatan dan vaksinasi sesuai ketentuan. Mulai latihan fisik rutin jauh-jauh hari.</p>",
            "<h2>Manasik</h2><p>Ikuti manasik secara bertahap untuk memahami rangkaian wukuf, mabit, dan melontar jumrah.</p>",
            "<h2>Keluarga dan Pekerjaan</h2><p>Siapkan pendelegasian urusan selama berada di Tanah Suci yang durasinya cukup panjang.</p>",
        ]),
    },
    {
        "title": "Rukun Haji dan Penjelasannya", "category": "HAJI", "tags": ["Haji"],
        "excerpt": "Ihram, wukuf, thawaf ifadhah, sa'i, tahallul, dan tertib — inilah rukun haji.",
        "content": html([
            "<ul><li><strong>Ihram</strong> — berniat haji dari miqat.</li><li><strong>Wukuf di Arafah</strong> — berdiam di Arafah pada 9 Dzulhijjah; inti dari haji.</li><li><strong>Thawaf Ifadhah</strong> — thawaf rukun setelah wukuf.</li><li><strong>Sa'i</strong> — antara Shafa dan Marwah.</li><li><strong>Tahallul</strong> — mencukur atau memendekkan rambut.</li><li><strong>Tertib</strong> — berurutan sesuai ketentuan.</li></ul>",
        ]),
    },
    {
        "title": "Wajib Haji yang Harus Ditunaikan", "category": "HAJI", "tags": ["Haji"],
        "excerpt": "Mabit di Muzdalifah dan Mina, melontar jumrah, hingga thawaf wada — rangkaian wajib haji.",
        "content": html([
            "<ul><li>Berihram dari miqat.</li><li>Mabit (bermalam) di Muzdalifah.</li><li>Mabit di Mina pada hari-hari tasyrik.</li><li>Melontar jumrah Aqabah dan tiga jumrah pada hari tasyrik.</li><li>Thawaf wada sebelum meninggalkan Makkah.</li><li>Menjauhi larangan ihram.</li></ul><p>Meninggalkan wajib haji mengharuskan dam, namun haji tetap sah.</p>",
        ]),
    },
    {
        "title": "Tata Cara Haji: Rangkaian 8–13 Dzulhijjah", "category": "HAJI", "tags": ["Haji", "Pemula"],
        "excerpt": "Gambaran hari per hari pelaksanaan haji dari Tarwiyah hingga Nafar.",
        "content": html([
            "<h2>8 Dzulhijjah (Tarwiyah)</h2><p>Berihram dan bergerak menuju Mina atau langsung ke Arafah sesuai pengaturan.</p>",
            "<h2>9 Dzulhijjah (Arafah)</h2><p>Wukuf di Arafah dari tergelincir matahari hingga terbenam, lalu bergerak ke Muzdalifah untuk mabit.</p>",
            "<h2>10 Dzulhijjah (Nahr)</h2><p>Melontar jumrah Aqabah, menyembelih hadyu, tahallul awal, thawaf ifadhah dan sa'i.</p>",
            "<h2>11–13 Dzulhijjah (Tasyrik)</h2><p>Mabit di Mina dan melontar tiga jumrah; nafar awal pada 12 Dzulhijjah atau nafar tsani pada 13 Dzulhijjah.</p>",
        ]),
    },
    {
        "title": "Perlengkapan Haji yang Perlu Disiapkan", "category": "HAJI", "tags": ["Haji", "Perlengkapan"],
        "excerpt": "Daftar perlengkapan haji untuk masa tinggal yang lebih panjang dan kondisi di Arafah–Mina.",
        "content": html([
            "<ul><li>Pakaian ihram cadangan dan pakaian harian secukupnya untuk durasi panjang.</li><li>Perlengkapan tidur ringan untuk Mina dan Muzdalifah.</li><li>Obat pribadi dalam jumlah cukup, vitamin, dan pelindung panas.</li><li>Kantong kerikil, tas kecil anti air, dan alas kaki nyaman.</li><li>Dokumen, identitas rombongan, dan gelang identitas.</li></ul>",
        ]),
    },
    {
        "title": "Perbedaan Haji dan Umrah dari Sisi Pelaksanaan", "category": "HAJI", "tags": ["Haji", "Umrah"],
        "excerpt": "Membandingkan rangkaian ibadah haji dan umrah untuk membantu perencanaan.",
        "content": html([
            "<p>Umrah terdiri dari ihram, thawaf, sa'i, dan tahallul yang dapat selesai dalam beberapa jam. Haji menambahkan wukuf di Arafah, mabit di Muzdalifah dan Mina, serta melontar jumrah dalam rentang beberapa hari pada bulan Dzulhijjah.</p><p>Dari sisi perencanaan, haji memerlukan masa tunggu dan persiapan lebih panjang, sedangkan umrah dapat direncanakan lebih fleksibel sepanjang tahun.</p>",
        ]),
    },
    {
        "title": "Tips Memilih Paket Umrah Sesuai Kebutuhan", "category": "TRAVEL", "tags": ["Umrah", "Tips", "Biaya"], "featured": True,
        "excerpt": "Reguler, premium, atau plus wisata? Begini cara memilih paket umrah yang pas untuk Anda dan keluarga.",
        "content": html([
            "<h2>Tentukan Prioritas</h2><p>Apakah Anda mengutamakan kedekatan hotel, durasi, pendamping tertentu, atau tambahan wisata seperti Turki dan Dubai?</p>",
            "<h2>Perhatikan Waktu</h2><p>Musim Ramadan dan liburan biasanya lebih padat. Umrah di luar musim ramai sering lebih tenang.</p>",
            "<h2>Cek Detail</h2><p>Baca fasilitas yang termasuk dan tidak termasuk, tipe kamar, serta kebijakan pembayaran.</p>",
            "<h2>Konsultasikan</h2><p>Tim travel dapat membantu menyesuaikan paket, termasuk paket custom untuk keluarga atau instansi.</p>",
        ]),
    },
    {
        "title": "Tips Memilih Hotel di Makkah dan Madinah", "category": "TRAVEL", "tags": ["Hotel", "Tips"],
        "excerpt": "Jarak, bintang, tipe kamar, dan fasilitas — faktor penting dalam memilih hotel saat umrah.",
        "content": html([
            "<ul><li><strong>Jarak ke masjid</strong>: semakin dekat semakin memudahkan shalat berjamaah, terutama bagi lansia.</li><li><strong>Bintang dan fasilitas</strong>: sarapan, lift memadai, dan kebersihan.</li><li><strong>Tipe kamar</strong>: quad lebih ekonomis, double lebih privat.</li><li><strong>Istilah \"setaraf\"</strong>: tanyakan daftar hotel alternatif yang dimaksud.</li></ul>",
        ]),
    },
    {
        "title": "Tips Memilih Maskapai untuk Perjalanan Umrah", "category": "TRAVEL", "tags": ["Maskapai", "Tips", "Aceh"],
        "excerpt": "Penerbangan langsung atau transit? Pertimbangan memilih maskapai, khususnya bagi jamaah dari Banda Aceh.",
        "content": html([
            "<p>Bagi jamaah dari Aceh, ketersediaan penerbangan langsung dari Bandara Sultan Iskandar Muda menjadi nilai tambah karena mengurangi kelelahan transit.</p><ul><li><strong>Durasi dan transit</strong>: pertimbangkan lama transit dan kenyamanan bandara.</li><li><strong>Bagasi</strong>: periksa kuota bagasi, termasuk untuk air zamzam.</li><li><strong>Jadwal</strong>: waktu tiba yang nyaman memudahkan check-in hotel.</li><li><strong>Reputasi layanan</strong>: ketepatan waktu dan penanganan jamaah lansia.</li></ul>",
        ]),
    },
    {
        "title": "Panduan Jamaah Pemula: Dari Pendaftaran hingga Pulang", "category": "TRAVEL", "tags": ["Pemula", "Persiapan"],
        "excerpt": "Alur lengkap perjalanan umrah bagi pemula: konsultasi, pendaftaran, manasik, keberangkatan, hingga kepulangan.",
        "content": html([
            "<h2>1. Konsultasi</h2><p>Hubungi travel melalui WhatsApp atau datang ke kantor untuk memilih paket.</p>",
            "<h2>2. Pendaftaran & DP</h2><p>Isi formulir, serahkan dokumen, dan bayar DP untuk mengunci kursi.</p>",
            "<h2>3. Pelunasan & Manasik</h2><p>Lunasi sesuai jadwal dan ikuti manasik.</p>",
            "<h2>4. Keberangkatan</h2><p>Berkumpul di bandara sesuai jadwal; tour leader mendampingi.</p>",
            "<h2>5. Di Tanah Suci</h2><p>Ikuti arahan muthawwif, jaga kesehatan, fokus ibadah.</p>",
            "<h2>6. Kepulangan</h2><p>Thawaf wada, kembali ke tanah air, dan jaga semangat ibadah pasca umrah.</p>",
        ]),
    },
    {
        "title": "Travel Umrah Aceh: Mengapa Berangkat dari Banda Aceh Lebih Nyaman", "category": "TRAVEL", "tags": ["Aceh", "Banda Aceh", "Umrah"],
        "excerpt": "Keunggulan berangkat umrah bersama travel yang berkantor di Banda Aceh bagi jamaah Aceh dan Sumatra.",
        "content": html([
            "<p>Bagi masyarakat Aceh, memilih travel yang berkantor di Banda Aceh memberi kemudahan: konsultasi tatap muka, manasik dekat rumah, dan keberangkatan dari Bandara Sultan Iskandar Muda.</p><p>Makki Madani Tour & Travel berkantor di Jl. Teuku Nyak Arief No. 13, Lamgugob, Banda Aceh, dan melayani jamaah dari seluruh Aceh, Sumatra, Jakarta, hingga seluruh Indonesia dengan semangat kekeluargaan.</p>",
        ]),
    },
]
