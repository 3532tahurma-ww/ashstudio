// Guide book: a cozy, paginated in-app manual. Two-page spreads on wide screens, single pages on phones.
import { h } from './dom.js';

const k = (...keys) => keys.map((x) => `<kbd>${x}</kbd>`).join('+');
const note = (t) => `<aside class="g-note">${t}</aside>`;

const FOREWORD = `<div class="g-front">
  <div class="g-ill">🍵 🎹 🌿</div>
  <h2>Bu kitap hakkında</h2>
  <p>Bir fincan çay al, yanına bir battaniye… Bu küçük kitap, Ash Studio'yu adım adım tanıman için yazıldı. Her bölüm uygulamanın bir köşesini anlatır; baştan sona okuyabilir ya da kenardaki kurdelelerden istediğin bölüme atlayabilirsin.</p>
  <p>Daha önce hiç müzik yapmamış olman sorun değil. Burada her şey denemeyle öğrenilir ve hiçbir şeyi kalıcı olarak bozamazsın: <b>Geri al</b> (${k('Ctrl', 'Z')}) her zaman yanında.</p>
  <p class="g-small">Sayfa çevirmek için ${k('←')} ${k('→')}, kitabı kapatmak için ${k('Esc')}. Telefonda sayfayı sağa-sola kaydırabilirsin.</p>
  <p class="g-sign">— Ash Studio atölyesinden sevgiyle</p>
</div>`;

const AFTERWORD = `<div class="g-front">
  <div class="g-orn">❦</div>
  <h2>Son söz</h2>
  <p>Kitabın sonuna geldin ama asıl hikâye şimdi başlıyor. Küçük bir ritimle başla, ona bir bas ekle, sonra bir melodi… Beğenmediğin her şeyi geri alabilir, beğendiğin her şeyi kaydedebilirsin.</p>
  <p>Takıldığında bu kitap hep üst çubuktaki 📖 düğmesinde ya da ${k('?')} tuşunda seni bekliyor olacak.</p>
  <div class="g-ill">🌙 🎶 🏡</div>
  <p class="g-sign">İyi müzikler!</p>
</div>`;

const CHAPTERS = [
  {
    icon: '🌱', title: 'Hoş geldin',
    pages: [
      `<p>Ash Studio tarayıcıda çalışan küçük bir müzik stüdyosudur. Ritim yazar, melodi çizer, parçaları bir şarkıya dizer ve sonucu WAV olarak dışa aktarırsın. Kurulum gerekmez; bir kez açtıktan sonra internet olmadan da çalışır.</p>
      <h3>Birkaç temel kavram</h3>
      <dl class="g-dl">
        <dt>Kanal</dt><dd>Tek bir ses kaynağı: bir davul, bir synth ya da bir ses dosyası (sample).</dd>
        <dt>Adım</dt><dd>Izgaradaki en küçük zaman birimi, bir 16'lık nota. <b>16 adım = 1 bar.</b></dd>
        <dt>Pattern</dt><dd>Kanalların birlikte çaldığı 1–8 barlık kısa bir müzik parçası.</dd>
        <dt>Playlist</dt><dd>Pattern'leri zaman çizgisine dizdiğin şarkı haritası.</dd>
        <dt>Şarkı</dt><dd>Playlist'in baştan sona çalınmış hali.</dd>
      </dl>`,
      `<h3>İlk beş dakikan</h3>
      <ol class="g-list">
        <li><b>Kanallar</b> sekmesinde <i>Kick</i> satırının 1, 5, 9 ve 13. kutularına tıkla.</li>
        <li>${k('Space')} ile çal. Duyduğun şey bir “dört vuruş” ritmi.</li>
        <li><i>Snare</i> satırında 5 ve 13. kutuları yak; artık ritmin bir omurgası var.</li>
        <li>Bir synth kanalının adına çift tıkla: <b>Piano Roll</b> açılır. Birkaç nota çiz.</li>
        <li><b>Playlist</b>'e geç, boş hücrelere tıklayarak pattern'i yan yana diz, üstten <b>SONG</b> moduna al ve dinle.</li>
      </ol>
      ${note('Takıldığında “Rastgele şarkı” düğmesine bas: tarzına göre hazır bir şarkı üretir. Sonra kanallarını tek tek inceleyerek çok şey öğrenirsin.')}`,
    ],
  },
  {
    icon: '🎛️', title: 'Üst çubuk',
    pages: [
      `<p>Ekranın en üstündeki çubuk stüdyonun kumanda masasıdır; hangi sekmede olursan ol hep oradadır.</p>
      <h3>Çal, duraklat, durdur</h3>
      <p>▶ düğmesi ya da ${k('Space')} çalmayı başlatır veya duraklatır. ■ <b>Durdur</b> çalmayı keser ve başa sarar.</p>
      <h3>PAT ve SONG</h3>
      <p><b>PAT</b> modunda yalnızca seçili pattern döngü halinde çalar; bir ritmi ya da melodiyi işlerken bu modu kullan. <b>SONG</b> modunda ise playlist baştan sona çalınır. Çalarken mod değiştirirsen çalma yeni modda baştan başlar.</p>
      <h3>BPM ve Swing</h3>
      <p><b>BPM</b> dakikadaki vuruş sayısıdır (40–300): 70 sakin, 120 hareketli, 140 koşturan bir tempodur. <b>Swing</b> her ikinci adımı biraz geciktirir; %0 düz ve makine gibi, %20–30 arası sallantılı ve insansı bir his verir.</p>`,
      `<h3>Konum göstergesi</h3>
      <p><b>1.1.1</b> biçimindeki sayı <i>bar . vuruş . adım</i> demektir. Örneğin <b>3.2.4</b>, üçüncü barın ikinci vuruşunun dördüncü adımıdır.</p>
      <h3>Pattern seçici</h3>
      <p>Açılır listeden düzenlemek istediğin pattern'i seçersin. Yanındaki <b>+</b> düğmesi aynı uzunlukta boş, yeni bir pattern açar.</p>
      <h3>📖 Rehber, 🌙 Tema, ☰ Menü</h3>
      <p>Kitap simgesi bu rehberi açar. Ay/güneş düğmesi açık ve koyu tema arasında geçiş yapar; seçimin hatırlanır. ☰ menüsünde proje kaydetme, açma ve dışa aktarma işlemleri bulunur (Bölüm 10).</p>
      ${note('Telefonda sekmeler ekranın altına iner; başparmağınla rahatça geçiş yaparsın.')}`,
    ],
  },
  {
    icon: '🥁', title: 'Kanallar',
    pages: [
      `<p>Kanallar sekmesi stüdyonun kalbidir. Her satır bir kanaldır ve soldan sağa şu parçalardan oluşur:</p>
      <ul class="g-list">
        <li><b>Işık</b> — kanalı açar veya sessize alır.</li>
        <li><b>Küçük sürgü</b> — kanalın ses seviyesi.</li>
        <li><b>Kanal adı</b> — tıkla: seç; çift tıkla: Piano Roll'da aç. Yanında küçük bir nokta varsa o kanalın piano roll notaları vardır.</li>
        <li><b>Adım kutuları</b> — yanan her kutu, o anda kanalın bir kez çalması demektir.</li>
      </ul>
      <p>Kutular dörderli gruplar halinde renklenir; her grup bir vuruştur. Fareyle basılı tutup sürüklersen kutuları boyarsın. Dokunmatik ekranda her dokunuş bir kutuyu açıp kapatır, parmağını kaydırmak ise ızgarayı kaydırır. Çalarken parlayan sütun o anki adımı gösterir.</p>`,
      `<h3>Pattern araç çubuğu</h3>
      <ul class="g-list">
        <li><b>Uzunluk</b> — 1, 2, 4 ya da 8 bar.</li>
        <li><b>Adlandır</b> — pattern'e anlamlı bir ad ver: “Nakarat”, “Giriş”…</li>
        <li><b>Klonla</b> — pattern'in hemen yanına bir kopyasını açar.</li>
        <li><b>Temizle</b> — tüm adımları ve notaları siler.</li>
        <li><b>Sil</b> — pattern'i ve playlist'teki bloklarını kaldırır. Son pattern silinemez.</li>
      </ul>
      <h3>Kanal eklemek</h3>
      <p><b>+ Kanal ekle</b> menüsünde üç grup bulunur: <b>Davul</b> (15 ses), <b>Synth</b> (14 hazır ses) ve <b>Sample</b> (bilgisayarındaki bir ses dosyası). Bir ses dosyasını uygulamanın üzerine sürükleyip bırakmak da yeni bir sample kanalı açar.</p>
      ${note('Klonla + küçük bir değişiklik = canlı bir şarkı. Nakaratın ikinci yarısında bir hi-hat eklemek bile fark yaratır.')}`,
      `<h3>Davul sesleri</h3>
      <div class="g-grid">
        <span><b>Kick</b> — tok, derin vuruş</span><span><b>Snare</b> — çıtırtılı trampet</span>
        <span><b>Clap</b> — el çırpma</span><span><b>Hi-Hat</b> — kısa, kapalı zil</span>
        <span><b>Open Hat</b> — uzayan açık zil</span><span><b>Tom</b> — perdeli, yuvarlak davul</span>
        <span><b>Perc</b> — metalik tıkırtı</span><span><b>Rim</b> — davul kenarı tık</span>
        <span><b>Shaker</b> — hışırtılı marakas</span><span><b>Cowbell</b> — inek çanı</span>
        <span><b>Conga</b> — sıcak el davulu</span><span><b>Crash</b> — uzun, patlayan zil</span>
        <span><b>Ride</b> — çınlayan ritim zili</span><span><b>Snap</b> — parmak şıklatma</span>
        <span><b>Wood Block</b> — tahta tok</span>
      </div>
      <h3>Davul ayarları</h3>
      <p><b>Tune</b> sesi ±12 yarım ton inceltir ya da kalınlaştırır. <b>Decay</b> sesin ne kadar uzun süreceğini belirler: 0.2× kısacık ve kuru, 2× uzun ve dolgun.</p>`,
      `<h3>Synth hazır sesleri</h3>
      <div class="g-grid">
        <span><b>Lead</b> — parlak ana melodi</span><span><b>Bass</b> — tok bas</span>
        <span><b>Pad</b> — yumuşak akor halısı</span><span><b>Pluck</b> — kısa, çekme tel</span>
        <span><b>Keys</b> — sade piyano tınısı</span><span><b>Flute</b> — nefesli, tatlı</span>
        <span><b>Bell</b> — çan ve kristal</span><span><b>Strings</b> — geniş yaylılar</span>
        <span><b>Organ</b> — dolgun org</span><span><b>Brass</b> — üflemeli bakır</span>
        <span><b>Marimba</b> — tahta tuşlar</span><span><b>EPiano</b> — elektrik piyano</span>
        <span><b>Acid</b> — vıcık vıcık bas</span><span><b>Sub</b> — derin, temiz alt bas</span>
      </div>
      <p>Hazır ses yalnızca bir başlangıç noktasıdır: seçtikten sonra aşağıdaki ayarlarla dilediğin gibi şekillendirebilirsin. Hazır sesi değiştirmek tüm ayarları o sesin değerlerine döndürür.</p>`,
      `<h3>Synth ayarları</h3>
      <dl class="g-dl">
        <dt>Dalga</dt><dd>Sesin ham dokusu. <i>Sine</i> yumuşak, <i>Triangle</i> flüt gibi, <i>Saw</i> parlak, <i>Square</i> boğuk ve retro; <i>SuperSaw</i> geniş, <i>Çan</i>, <i>Marimba</i>, <i>Org</i> ve <i>E.Piyano</i> ise karakterli tınılardır.</dd>
        <dt>Attack · Decay · Sustain · Release</dt><dd>Sesin zarfı: ne kadar hızlı başlar, ne kadar sürede yatışır, basılıyken hangi seviyede kalır ve bırakınca ne kadar uzar.</dd>
        <dt>Cutoff · Rezonans</dt><dd>Filtre parlaklığı ve kesim noktasındaki “vıyk” vurgusu.</dd>
        <dt>Filtre env</dt><dd>Her notanın başında filtrenin ne kadar açılacağı; vuruşlu, canlı sesler için artır.</dd>
        <dt>Detune · Oktav</dt><dd>İki sesi hafifçe akort dışı yaparak genişlik katar; oktav tüm kanalı yukarı/aşağı taşır.</dd>
      </dl>`,
      `<h3>Sample ayarları</h3>
      <p><b>Pitch</b> sesi ±24 yarım ton kaydırır, <b>Gain</b> ses seviyesini ayarlar. Kanala başka bir dosya yüklemek için sample düğmesini kullanırsın.</p>
      <h3>Ayar panelinin üst satırı</h3>
      <ul class="g-list">
        <li><b>Ad</b> ve <b>renk</b> — kanalını kolayca tanı.</li>
        <li>🔊 <b>Önizle</b> — sesi bir kez dinlet.</li>
        <li>🎲 <b>Rastgele</b> — bu pattern için kanala yeni bir ritim ya da melodi yazar (Bölüm 4).</li>
        <li>🎹 <b>Piano Roll</b>, ⧉ <b>Klonla</b>, 🗑 <b>Sil</b>.</li>
      </ul>
      <h3>Klavyeyle çalmak</h3>
      <p>Seçili kanalı bilgisayar klavyenle çalabilirsin: ${k('A')} Do'dur, üst sıradaki harfler siyah tuşlardır (Bölüm 11'deki küçük piyanoya bak).</p>`,
    ],
  },
  {
    icon: '🎲', title: 'Rastgele şarkı',
    pages: [
      `<p>Kanallar sekmesinin en üstündeki <b>Rastgele şarkı</b> şeridi, birkaç saniyede baştan sona bir şarkı yazar. Önce bir <b>tarz</b> seç, sonra <b>Üret ve çal</b>'a bas.</p>
      <p>Üretici tarza göre tempo, ton, gam ve akor yürüyüşü seçer; ardından davulları, basları, akorları, melodiyi ve bazen bir arpeji yazar. Şarkı şöyle dizilir:</p>
      <p class="g-center"><b>Giriş → A → B → A → B</b><br><span class="g-small">her bölüm 4 bar; girişte davul ve melodi susar</span></p>
      <h3>Tarzlar</h3>
      <p>Çiftlik · Kasaba · Festival · Yağmur · Mağara · Kış · Lo-fi · Caz · Pop. <b>Karışık tarz</b> her seferinde rastgele birini seçer.</p>
      ${note('Üretmek mevcut projenin yerine geçer; uygulama önce sorar. Sevdiğin projeyi önceden kaydetmeyi unutma!')}`,
      `<h3>Carmen tarzları</h3>
      <div class="g-grid">
        <span><b>Ana Menü</b> — yaylılar, e.piyano</span><span><b>Aksiyon</b> — hızlı, acid bas</span>
        <span><b>Sahil</b> — conga, marimba</span><span><b>Okul</b> — neşeli pop</span>
        <span><b>Orman</b> — flüt, tahta tık</span><span><b>Hastane</b> — sakin, davulsuz</span>
        <span><b>Ev</b> — sıcak, swing'li</span><span><b>Pazar</b> — org, cowbell</span>
        <span><b>Ofis</b> — düzenli, temiz</span><span><b>Park</b> — hafif, güneşli</span>
        <span><b>Romantik</b> — yavaş, yumuşak</span>
      </div>
      <h3>Tek kanal için rastgele</h3>
      <p>Bir kanalın ayar panelindeki 🎲 <b>Rastgele</b> düğmesi yalnızca o kanalı yeniden yazar. Davullar olasılıklı bir ritim alır; Bass, Sub ve Acid bir bas yürüyüşü; Pad, Strings ve Organ akorlar; diğer synth'ler ise projenin tonunda bir melodi.</p>
      ${note('Beğenmedin mi? Ctrl+Z ile geri al ve tekrar bas. Her basış yeni bir fikir.')}`,
    ],
  },
  {
    icon: '🎹', title: 'Piano Roll',
    pages: [
      `<p>Piano Roll melodi ve akor yazdığın yerdir. Solda dikey bir klavye, sağda zaman ızgarası bulunur: yukarı çıktıkça ses incelir, sağa gittikçe zaman ilerler.</p>
      <ul class="g-list">
        <li><b>Kanal</b> listesinden hangi kanala yazacağını seç.</li>
        <li><b>Nota</b> uzunluğu: 1/16'dan 1 bara kadar.</li>
        <li><b>Boş yere tıkla</b> — nota eklenir ve sesini duyarsın.</li>
        <li><b>Sürükle</b> — notayı taşı: yukarı-aşağı perde, sağa-sola zaman.</li>
        <li><b>Sağ kenarından tut</b> — uzat ya da kısalt. Son uzunluk hatırlanır.</li>
        <li><b>Notaya tıkla</b> (sürüklemeden) ya da <b>sağ tık</b> — sil.</li>
        <li><b>Soldaki klavyeye tıkla</b> — o perdeyi dinle.</li>
      </ul>
      <p><b>Notaları sil</b> yalnızca seçili kanalın bu pattern'deki notalarını temizler.</p>`,
      `<h3>Dokunmatik ekranda</h3>
      <p>Araç çubuğundaki <b>Düzenle / Kaydır</b> düğmesi, parmağının nota mı çizeceğini yoksa ızgarayı mı kaydıracağını belirler.</p>
      <h3>Adımlar ve notalar birlikte</h3>
      <p>Bir kanalın hem adım kutuları hem de piano roll notaları olabilir; ikisi birlikte çalar. Adım kutuları her zaman <b>Do4</b> perdesinde çalar. Davul kanallarına piano roll'dan nota yazarsan, notanın yüksekliği davulun perdesini değiştirir: yüksek nota daha ince bir tom ya da conga demektir.</p>
      ${note('Akor için aynı sütuna üç nota üst üste koy: Do + Mi + Sol. Pad ya da Strings ile çok güzel durur.')}`,
    ],
  },
  {
    icon: '🗺️', title: 'Playlist',
    pages: [
      `<p>Playlist şarkının haritasıdır. Yatay şeritler (satırlar) ve bar sütunlarından oluşur.</p>
      <ul class="g-list">
        <li><b>Yerleştir</b> modunda boş bir hücreye tıkla: seçili pattern o bara yerleşir ve uzunluğu kadar yer kaplar.</li>
        <li>Aynı şeritte başka bir blokla çakışırsa uygulama seni uyarır.</li>
        <li><b>Bir bloğa tıkla</b> — o pattern seçili hale gelir; düzenlemek için Kanallar'a dön.</li>
        <li><b>Sil</b> modu ya da bloğa <b>sağ tık</b> — bloğu kaldırır.</li>
      </ul>
      <p>Aynı pattern'i defalarca yerleştirebilirsin. Bunlar kopya değil, aynı pattern'in yansımalarıdır: pattern'i değiştirdiğinde hepsi birlikte değişir.</p>`,
      `<h3>Şarkıyı dinlemek</h3>
      <p>Üst çubuktan <b>SONG</b> modunu seç: playlist ilk bardan son bloğun bittiği yere kadar çalar. Farklı şeritlerdeki bloklar aynı anda çalar, böylece katman kurabilirsin: davul pattern'i bir şeritte, melodi pattern'i diğerinde.</p>
      <h3>Küçük bir şarkı iskeleti</h3>
      <ol class="g-list">
        <li>Bar 1–4: yalnızca akorlar (giriş)</li>
        <li>Bar 5–12: davul + bas + akor (kıta)</li>
        <li>Bar 13–20: hepsi + melodi (nakarat)</li>
        <li>Bar 21–24: davulsuz kapanış</li>
      </ol>
      ${note("Bir şarkıyı kanalları ayrı pattern'lere bölerek kurmak, sonradan düzenlemeyi çok kolaylaştırır.")}`,
    ],
  },
  {
    icon: '🎚️', title: 'Mixer',
    pages: [
      `<p>Mixer'da her kanalın kendi şeridi vardır. Burası seslerin birbirine karıştığı ve dengelendiği yerdir.</p>
      <dl class="g-dl">
        <dt>Fader</dt><dd>Dikey sürgü; kanalın sesi. Altında dB değeri yazar.</dd>
        <dt>Seviye ışığı</dt><dd>Kanal çaldıkça yükselen çubuk.</dd>
        <dt>Pan</dt><dd>Sesi sola ya da sağa yerleştirir.</dd>
        <dt>Reverb</dt><dd>Ortak bir oda yankısına ne kadar gönderileceği.</dd>
        <dt>Delay</dt><dd>Tempoya bağlı yankı; tekrarlar noktalı sekizlikte gelir.</dd>
        <dt>M · S</dt><dd><b>M</b> kanalı susturur. <b>S</b> (solo) yalnızca solo'lanan kanalları duyurur.</dd>
      </dl>
      <p>En sağdaki <b>MASTER</b> şeridi genel ses seviyesidir; ardından yumuşak bir kompresör tüm mixi toparlar.</p>`,
      `<h3>Sıcak bir mix için</h3>
      <ul class="g-list">
        <li>Kick ve bası ortada bırak; hi-hat, arp ve shaker'ı biraz yanlara aç.</li>
        <li>Pad ve yaylılara daha çok, kick ve basa çok az reverb ver.</li>
        <li>Melodiye hafif bir delay, onu boşlukta süzülür gibi gösterir.</li>
        <li>Bir ses duyulmuyorsa önce ötekileri kıs; her şeyi açmak yerine yer aç.</li>
        <li>Master ışığı sürekli tepede kalıyorsa genel sesi biraz indir.</li>
      </ul>
      ${note('Solo düğmesi bir kanalı tek başına dinlemenin en hızlı yolu. İşin bitince kapatmayı unutma; yoksa “ses gitti” sanabilirsin!')}`,
    ],
  },
  {
    icon: '🌊', title: 'Ayırıcı',
    pages: [
      `<p>Ayırıcı, hazır bir şarkıyı dört parçaya böler: <b>Davul</b>, <b>Bas</b>, <b>Vokal</b> ve <b>Diğer</b>. Bir dosyayı alana bırakman ya da tıklayıp seçmen yeterli.</p>
      <p>Her şey senin cihazında olur; internet gerekmez ve dosyan hiçbir yere gönderilmez.</p>
      <h3>Nasıl çalışır?</h3>
      <p>Ses kısa dilimlere bölünür ve her dilimin frekansları incelenir. Zamanda uzayan tonlar “armonik”, ani vuruşlar “perküsif” olarak ayrılır; vuruşlar davula gider. Sol ve sağ kanalda aynı duyulan, ortadaki sesler vokal olarak toplanır; alçak frekanslar basa ayrılır. Geriye kalan her şey “Diğer”dir.</p>
      <p>Uzun şarkılarda işlem biraz sürebilir; ilerleme çubuğu durumu gösterir.</p>`,
      `<h3>Ayrılan parçalarla neler yapılır?</h3>
      <ul class="g-list">
        <li><b>Hepsini çal</b> — dört parçayı birlikte dinle.</li>
        <li>▶ — yalnızca o parçayı çal.</li>
        <li><b>M</b> / <b>S</b> ve ses sürgüsü — parçaları susturarak, solo'layarak ya da kısarak dengeyi değiştir.</li>
        <li><b>WAV</b> — parçayı ayrı bir dosya olarak indir.</li>
        <li><b>Kanala ekle</b> / <b>Tümünü kanala ekle</b> — parçayı sample kanalı olarak projene taşı.</li>
      </ul>
      <h3>Beklentiler</h3>
      <p>Bu bir yapay zekâ değil, klasik ses işleme yöntemidir. En iyi sonucu net, stereo miksli pop ve elektronik şarkılarda verir; parçalar arasında biraz sızıntı olması normaldir.</p>
      ${note('Bir şarkının vokalini ayır, kendi ritminin üstüne koy: anında bir remiks!')}`,
    ],
  },
  {
    icon: '🍂', title: 'Örnekler',
    pages: [
      `<p>Örnekler sekmesinde, çiftlik oyunlarının sıcak havasında Ash Studio ile yazılmış özgün parçalar bulunur:</p>
      <div class="g-grid g-grid-1">
        <span>🌱 <b>Bahar Sabahı</b> — çiftlikte ilk gün</span>
        <span>🏡 <b>Kasaba Meydanı</b> — pazar yürüyüşü</span>
        <span>🌧️ <b>Yağmurlu Gün</b> — pencerede damlalar</span>
        <span>⛏️ <b>Maden Derinlikleri</b> — yankılı mağara</span>
        <span>🌻 <b>Yaz Festivali</b> — meydanda dans</span>
        <span>🍂 <b>Sonbahar Hasadı</b> — kızıl yapraklar</span>
        <span>❄️ <b>Kış Gecesi</b> — şömine çıtırtısı</span>
        <span>🌊 <b>Sahil Akşamı</b> — lo-fi gün batımı</span>
        <span>☕ <b>Kasaba Kafesi</b> — caz tadında</span>
      </div>
      <p><b>Aç</b> parçayı projeye yükler, <b>Aç ve çal</b> hemen dinletir. Örnekler senin oyun alanın: kanallarını, notalarını incele, değiştir ve kendi adınla kaydet.</p>`,
    ],
  },
  {
    icon: '💾', title: 'Dosyalar',
    pages: [
      `<p>☰ menüsü projenle ilgili bütün dosya işlerini toplar.</p>
      <ul class="g-list">
        <li><b>Proje adı</b> — kaydederken dosya adı olarak kullanılır.</li>
        <li><b>Yeni proje</b> — boş bir sayfa açar (önce sorar).</li>
        <li><b>Proje aç / kaydet (.ash)</b> — tüm proje tek bir dosyada; içe aktardığın ses örnekleri de içindedir. Kısayol: ${k('Ctrl', 'S')}.</li>
        <li><b>Geri al / Yinele</b> — ${k('Ctrl', 'Z')} ve ${k('Ctrl', 'Y')}.</li>
      </ul>
      <h3>Otomatik kayıt</h3>
      <p>Yaptığın her değişiklik tarayıcının içine sessizce kaydedilir; sayfayı kapatıp açtığında kaldığın yerden devam edersin. Ancak tarayıcı verilerini temizlersen bu kayıt da silinir.</p>
      ${note('Sevdiğin her projenin bir .ash yedeğini al. Küçük bir alışkanlık, büyük bir huzur.')}`,
      `<h3>Dışa aktarmak</h3>
      <p><b>WAV</b> — PAT modunda seçili pattern'i, SONG modunda bütün şarkıyı ses dosyası olarak çıkarır. Yankıların sönmesi için sona birkaç saniye eklenir.</p>
      <p><b>MIDI</b> — notaları ve davulları başka müzik programlarına taşımak için.</p>
      <h3>İçe aktarmak</h3>
      <p><b>Ses örneği</b> — her dosya yeni bir sample kanalı olur. <b>MIDI</b> — notalar seçili synth kanalına (yoksa yeni bir Keys kanalına) ve seçili pattern'e yazılır; dosyadaki tempo da alınır.</p>
      <h3>Sürükle ve bırak</h3>
      <p><b>.ash</b> dosyası projeyi açar, <b>.mid</b> MIDI olarak alınır, ses dosyaları sample kanalı olur. Ayırıcı sekmesindeyken bırakılan şarkı ise doğrudan ayrılır.</p>
      <p>Menüde <b>Uygulamayı yükle</b> görünüyorsa Ash Studio'yu bir uygulama gibi masaüstüne ya da telefonuna ekleyebilirsin.</p>`,
    ],
  },
  {
    icon: '🗝️', title: 'Kısayollar ve tarifler',
    pages: [
      `<table class="g-keys">
        <tr><td>${k('Space')}</td><td>Çal / duraklat</td></tr>
        <tr><td>${k('Ctrl', 'Z')}</td><td>Geri al</td></tr>
        <tr><td>${k('Ctrl', 'Y')} · ${k('Ctrl', 'Shift', 'Z')}</td><td>Yinele</td></tr>
        <tr><td>${k('Ctrl', 'S')}</td><td>Projeyi kaydet</td></tr>
        <tr><td>${k('?')} · ${k('F1')}</td><td>Bu rehberi aç</td></tr>
        <tr><td>${k('←')} ${k('→')} · ${k('Esc')}</td><td>Sayfa çevir · kitabı kapat</td></tr>
      </table>
      <h3>Klavye piyanosu</h3>
      <p>Seçili kanalı bu tuşlarla çalarsın; ${k('A')} orta Do'dur.</p>
      <div class="g-piano" aria-hidden="true">
        <i class="w">A</i><i class="w">S</i><i class="w">D</i><i class="w">F</i><i class="w">G</i><i class="w">H</i><i class="w">J</i><i class="w">K</i><i class="w">L</i><i class="w"></i>
        <i class="b" style="left:20px">W</i><i class="b" style="left:50px">E</i><i class="b" style="left:110px">T</i><i class="b" style="left:140px">Y</i><i class="b" style="left:170px">U</i><i class="b" style="left:230px">O</i><i class="b" style="left:260px">P</i>
      </div>`,
      `<h3>Tarif: yağmurlu lo-fi ritim</h3>
      <ol class="g-list">
        <li>BPM <b>80</b>, Swing <b>%25</b>.</li>
        <li>Kick: adım 1, 8, 11 · Snare: 5, 13 · Hi-Hat: tüm tek sayılı adımlar.</li>
        <li>EPiano kanalına dört barlık yavaş akorlar, Reverb 0.3.</li>
        <li>Sub kanalında akorların kök notaları, her bar başında uzun.</li>
        <li>Pluck ile birkaç seyrek nota, biraz Delay.</li>
      </ol>
      <h3>Ses gelmiyorsa</h3>
      <ul class="g-list">
        <li>Sayfaya bir kez tıkla; tarayıcılar sesi ancak bir dokunuştan sonra başlatır.</li>
        <li>Kanalın ışığı kapalı mı, mixer'da bir <b>S</b> açık mı kaldı?</li>
        <li>Doğru modda mısın? PAT boş bir pattern'i, SONG boş bir playlist'i çalıyor olabilir.</li>
      </ul>`,
    ],
  },
];

const RIBBON = ['#d98ba0', '#e2a868', '#9cb87a', '#7fa9c9', '#b496d6', '#e0c068', '#c98f6f', '#86b8a8', '#d4a5c4', '#a8a07a', '#8f9fd1'];

const PAGES = [{ ch: -1, html: FOREWORD }, { ch: -1, toc: true }];
CHAPTERS.forEach((c, i) => c.pages.forEach((html, j) => {
  if (!j) c.start = PAGES.length;
  PAGES.push({ ch: i, html, first: !j });
}));
PAGES.push({ ch: -1, html: AFTERWORD });

const mq = matchMedia('(max-width: 760px)');
let cur = 0, root = null, spread, prevBtn, nextBtn, pos, ribbons, cover, book, resumeBtn;

const single = () => mq.matches;
const leftOf = (i) => (single() ? i : i - (i % 2));

function chapHead(i) {
  return `<header class="g-chap"><span>Bölüm ${i + 1}</span><div class="g-chap-ic">${CHAPTERS[i].icon}</div><h2>${CHAPTERS[i].title}</h2></header>`;
}

function tocEl() {
  return h('div', { class: 'g-toc' },
    h('h2', {}, 'İçindekiler'),
    h('ol', {}, ...CHAPTERS.map((c, i) => h('li', {},
      h('button', { onclick: () => go(c.start) },
        h('span', { class: 'g-toc-ic' }, c.icon),
        h('span', {}, `${i + 1}. ${c.title}`),
        h('span', { class: 'g-toc-dots' }),
        h('span', { class: 'g-toc-n' }, String(c.start + 1)))))));
}

function pageEl(i) {
  const p = PAGES[i];
  if (!p) return h('article', { class: 'g-page g-blank' });
  const body = h('div', { class: 'g-body' });
  if (p.toc) body.append(tocEl());
  else body.innerHTML = (p.first ? chapHead(p.ch) : '') + p.html;
  return h('article', { class: 'g-page' + (p.first ? ' g-first' : '') },
    h('div', { class: 'g-run' }, p.ch >= 0 ? CHAPTERS[p.ch].title : 'Ash Studio'),
    body,
    h('div', { class: 'g-num' }, String(i + 1)));
}

function render(dir = 0) {
  const left = leftOf(cur), step = single() ? 1 : 2;
  spread.replaceChildren(pageEl(left), ...(single() ? [] : [pageEl(left + 1)]));
  spread.classList.remove('g-flip-next', 'g-flip-prev');
  if (dir) { void spread.offsetWidth; spread.classList.add(dir > 0 ? 'g-flip-next' : 'g-flip-prev'); }
  prevBtn.disabled = left === 0;
  nextBtn.disabled = left + step >= PAGES.length;
  pos.textContent = `${single() ? left + 1 : `${left + 1}–${Math.min(left + 2, PAGES.length)}`} / ${PAGES.length}`;
  const visible = PAGES.slice(left, left + step).map((p) => p.ch);
  const active = Math.max(...visible);
  ribbons.forEach((r, i) => r.classList.toggle('on', i === active));
  try { localStorage.setItem('ash-guide-page', String(cur)); } catch (e) { /* storage unavailable */ }
}

function go(i) {
  const next = Math.max(0, Math.min(PAGES.length - 1, i));
  const dir = Math.sign(leftOf(next) - leftOf(cur));
  cur = next;
  showBook();
  render(dir);
}
const turn = (d) => go(leftOf(cur) + d * (single() ? 1 : 2));

function showCover() {
  cover.hidden = false;
  book.hidden = true;
  resumeBtn.hidden = cur < 2;
  resumeBtn.textContent = `Kaldığın yerden (s. ${cur + 1})`;
  cover.querySelector('.g-cover-btn').focus();
}
function showBook() {
  cover.hidden = true;
  book.hidden = false;
}

function build() {
  prevBtn = h('button', { class: 'g-navbtn', title: 'Önceki sayfa (←)', 'aria-label': 'Önceki sayfa', onclick: () => turn(-1) }, '‹');
  nextBtn = h('button', { class: 'g-navbtn', title: 'Sonraki sayfa (→)', 'aria-label': 'Sonraki sayfa', onclick: () => turn(1) }, '›');
  pos = h('span', { class: 'g-pos' });
  spread = h('div', { class: 'g-spread' });
  ribbons = CHAPTERS.map((c, i) => h('button', { title: `${i + 1}. ${c.title}`, style: { '--rc': RIBBON[i % RIBBON.length] }, onclick: () => go(c.start) }, c.icon));

  let sx = null;
  spread.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') sx = e.clientX; });
  spread.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1);
  });

  resumeBtn = h('button', { class: 'g-cover-btn ghost', onclick: () => go(cur) });
  cover = h('div', { class: 'g-cover' },
    h('div', { class: 'g-emblem' }, h('img', { src: 'icons/icon.svg', alt: '', width: 56, height: 56 })),
    h('div', { class: 'g-cover-kicker' }, 'Küçük Stüdyo Rehberi'),
    h('h1', {}, 'Ash Studio'),
    h('div', { class: 'g-cover-orn' }, '✦ ❦ ✦'),
    h('p', {}, 'Ritimler, melodiler ve sıcak şarkılar üzerine bir el kitabı'),
    h('button', { class: 'g-cover-btn', onclick: () => go(0) }, 'Okumaya başla'),
    resumeBtn);

  book = h('div', { class: 'g-open', hidden: true },
    h('div', { class: 'g-spread-wrap' }, spread, h('nav', { class: 'g-ribbons', 'aria-label': 'Bölümler' }, ...ribbons)),
    h('div', { class: 'g-nav' },
      h('button', { class: 'g-navbtn text', onclick: showCover }, 'Kapak'),
      h('button', { class: 'g-navbtn text', onclick: () => go(1) }, 'İçindekiler'),
      prevBtn, pos, nextBtn));

  root = h('div', { class: 'guide', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Ash Studio rehberi', hidden: true,
    onclick: (e) => { if (e.target === root) closeGuide(); } },
  h('button', { class: 'btn icon g-close', title: 'Kapat (Esc)', 'aria-label': 'Kapat', onclick: closeGuide }, '✕'),
  h('div', { class: 'book' }, cover, book));
  document.body.append(root);
  mq.addEventListener('change', () => { if (!book.hidden) render(); });
}

export function openGuide() {
  if (!root) {
    build();
    try { cur = Math.max(0, Math.min(PAGES.length - 1, +localStorage.getItem('ash-guide-page') || 0)); } catch (e) { /* storage unavailable */ }
  }
  root.hidden = false;
  showCover();
}

function closeGuide() {
  root.hidden = true;
}

// Capture phase so the studio's own shortcuts (Space, note keys…) stay quiet while the book is open.
window.addEventListener('keydown', (e) => {
  if (root && !root.hidden) {
    if (e.key === 'Escape') closeGuide();
    else if (e.key === 'ArrowRight' && !book.hidden) turn(1);
    else if (e.key === 'ArrowLeft' && !book.hidden) turn(-1);
    e.stopPropagation();
    return;
  }
  if (e.target.matches?.('input[type=text], input[type=number], select, textarea')) return;
  if (e.key === 'F1' || (e.key === '?' && !e.ctrlKey && !e.metaKey)) { e.preventDefault(); e.stopPropagation(); openGuide(); }
}, true);
