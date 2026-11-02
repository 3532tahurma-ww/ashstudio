// Guide book: a cozy, paginated in-app manual. Two-page spreads on wide screens, single pages on phones.
import { h } from './dom.js';

const k = (...keys) => keys.map((x) => `<kbd>${x}</kbd>`).join('+');
const note = (t) => `<aside class="g-note">${t}</aside>`;
// Mini step grid: rows of [label, pattern]; 'x' = hit, 'o' = soft hit, anything else = rest. Cells group by 4.
const beat = (rows, foot = '') => `<div class="g-beat" style="--n:${rows[0][1].length}">${rows.map(([name, s]) =>
  `<b>${name}</b>${[...s].map((c, i) => `<i class="${c === 'x' ? 'x' : c === 'o' ? 'o' : ''}${i && !(i % 4) ? ' q' : ''}"></i>`).join('')}`).join('')}</div>${foot ? `<p class="g-small g-center">${foot}</p>` : ''}`;

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
      `<h3>Şarkı ve vokal klipleri</h3>
      <p>Hazır bir şarkıyı, kendi kaydettiğin ham vokali ya da bir enstrüman kaydını doğrudan playlist'e koyabilirsin: <b>Şarkı / vokal ekle</b> düğmesine bas ya da dosyayı Playlist sekmesindeyken ekrana bırak. WAV, MP3, OGG gibi tarayıcının açabildiği her ses dosyası olur.</p>
      <ul class="g-list">
        <li>Her dosya kendi <b>sample kanalını</b> açar; mixer'da EQ, kompresör, reverb ile işlenir.</li>
        <li>Klip boş bir şeride, 1. bara yerleşir. Fareyle <b>sürükle</b>: vuruşlara yapışarak taşınır.</li>
        <li><b>Klibe tıkla</b>: üstte düzenleyici açılır.</li>
        <li>Bar numarasına tıklayınca şarkı oradan çalar; klip ortasından da doğru yerden başlar.</li>
      </ul>`,
      `<h3>Klip düzenleyici</h3>
      <dl class="g-dl">
        <dt>Başlangıç · Şerit</dt><dd>Klibin hangi barda ve hangi şeritte başlayacağı (çeyrek bar adımlarla).</dd>
        <dt>Seviye</dt><dd>Yalnızca bu klibin sesi, dB olarak.</dd>
        <dt>Baştan kırp · Uzunluk</dt><dd>Dosyanın başındaki sessizliği ya da istemediğin kısmı at; sonunu kısalt.</dd>
        <dt>Fade in · Fade out</dt><dd>Sesin yavaşça açılıp kapanması; tıkırtısız geçişler için birkaç yüz milisaniye bile yeter.</dd>
        <dt>Klonla</dt><dd>Klibin bir kopyasını hemen arkasına koyar: nakaratı tekrarlamak için ideal.</dd>
      </dl>
      ${note("Ses klipleri tempoyla esnemez. Hazır bir şarkının üstüne çalacaksan önce onun BPM'ini üst çubuğa yaz; ritmin onunla aynı hızda akar.")}`,
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
      `<h3>Mix: EQ ve kompresör</h3>
      <p>Her kanal şeridinde bir <b>EQ</b> ve bir <b>kompresör</b> vardır. Değere çift tıklarsan sıfırlanır.</p>
      <dl class="g-dl">
        <dt>Bas · Orta · Tiz</dt><dd>±12 dB. Bas kalınlık ve gümbürtü, Orta gövde ve “burun” sesi, Tiz parlaklık ve hava.</dd>
        <dt>Komp</dt><dd>Sesin yüksek yerlerini bastırıp alçak yerlerini öne çeker; ses daha dengeli ve yakın duyulur.</dd>
      </dl>
      <h3>Ham vokal için tarif</h3>
      <ol class="g-list">
        <li><b>Bas</b> −4…−6: mikrofon gümbürtüsünü al.</li>
        <li><b>Orta</b> −1…−2: boğukluk varsa biraz kıs.</li>
        <li><b>Tiz</b> +2…+4: netlik ve hava.</li>
        <li><b>Komp</b> %40–60: kelimeler eşit duyulsun.</li>
        <li><b>Reverb</b> 0.15–0.25, <b>Delay</b> 0.1: odaya yerleştir.</li>
      </ol>`,
      `<h3>Mastering</h3>
      <p>Mastering, bitmiş mix'i bir bütün olarak cilalamaktır. MASTER şeridinde bulunur:</p>
      <dl class="g-dl">
        <dt>Hazır…</dt><dd>Doğal, Sıcak, Parlak, Yüksek: iyi bir başlangıç noktası.</dd>
        <dt>EQ</dt><dd>Tüm şarkının rengi. Küçük oynat: ±1–3 dB çoğu zaman yeter.</dd>
        <dt>Glue</dt><dd>Hafif bir kompresör; kanalları birbirine “yapıştırır”.</dd>
        <dt>Loudness</dt><dd>Şarkıyı limiter'a doğru iter: daha yüksek ama fazlası sesi ezer.</dd>
      </dl>
      <p>En sonda bir <b>limiter</b> sesin patlamasını engeller. WAV dışa aktarımı tüm bu ayarlarla yapılır.</p>
      ${note('Mastering yaparken ara sıra Loudness\'ı sıfırlayıp aynı seviyede karşılaştır: “daha yüksek” her zaman “daha iyi” değildir.')}`,
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
        <li><b>Şarkı / vokal içe aktar</b> — ses dosyasını playlist'e klip olarak koyar (Bölüm 6).</li>
        <li><b>Proje aç / kaydet (.ash)</b> — tüm proje tek bir dosyada; içe aktardığın ses örnekleri de içindedir. Kısayol: ${k('Ctrl', 'S')}.</li>
        <li><b>Geri al / Yinele</b> — ${k('Ctrl', 'Z')} ve ${k('Ctrl', 'Y')}.</li>
      </ul>
      <h3>Her açılışta temiz sayfa</h3>
      <p>Ash Studio her açıldığında boş bir projeyle başlar; önceki çalışman otomatik olarak geri gelmez. Devam etmek istediğin projeyi kapatmadan önce <b>.ash</b> olarak kaydet, sonra <b>Proje aç</b> ile geri yükle.</p>
      ${note('Sevdiğin her projeyi .ash olarak kaydet. Küçük bir alışkanlık, büyük bir huzur.')}`,
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
  {
    icon: '🎼', title: 'Şarkı yapımı',
    pages: [
      `<p>Bu bölüm sıfırdan bir şarkı kurmayı adım adım anlatır. Hemen her şarkı aynı beş katmandan oluşur; hepsini aynı anda düşünmek yerine sırayla, alttan üste doğru kur:</p>
      <dl class="g-dl">
        <dt>1. Ritim</dt><dd>Kick, snare, hi-hat. Şarkının yürüyüşü. <i>Davul kanalları</i></dd>
        <dt>2. Bas</dt><dd>Kick'le kol kola yürüyen kalın ses. <i>Bass, Sub, Acid</i></dd>
        <dt>3. Akorlar</dt><dd>Duyguyu belirleyen ses halısı. <i>Pad, Keys, Strings, EPiano</i></dd>
        <dt>4. Melodi</dt><dd>Akılda kalan, mırıldanılan kısım. <i>Lead, Pluck, Flute, Bell</i></dd>
        <dt>5. Süsler</dt><dd>Fill'ler, crash, shaker, arpej. Geçişleri canlandırır.</dd>
      </dl>
      <p>Aşağıdaki ızgaralarda her kutu bir adımdır, 16 kutu 1 bar. Koyu kutu: vuruş; açık kutu: hafif (düşük sesli) vuruş. Kanallar sekmesinde aynı kutuları yakman yeterli.</p>`,
      `<h3>Dört vuruş · House, Disco</h3>
      <p class="g-small">BPM 120–128</p>
      ${beat([['Kick', 'x...x...x...x...'], ['Clap', '....x.......x...'], ['Open Hat', '..x...x...x...x.'], ['Hi-Hat', 'o.o.o.o.o.o.o.o.']])}
      <h3>Backbeat · Pop, Rock</h3>
      <p class="g-small">BPM 90–120</p>
      ${beat([['Kick', 'x.....x.x.......'], ['Snare', '....x.......x...'], ['Hi-Hat', 'x.x.x.x.x.x.x.x.']])}
      <h3>Boom-bap · Hip-hop, Lo-fi</h3>
      <p class="g-small">BPM 80–95, Swing %20–30</p>
      ${beat([['Kick', 'x......x..x.....'], ['Snare', '....x.......x.o.'], ['Hi-Hat', 'x.x.x.x.x.x.x.x.']])}`,
      `<h3>Trap</h3>
      <p class="g-small">BPM 130–150; snare yalnızca 9. adımda, bu yüzden yarı hızda hissedilir</p>
      ${beat([['Kick', 'x......x.x......'], ['Clap', '........x.......'], ['Hi-Hat', 'x.x.x.x.x.xxx.xx']])}
      <h3>Dembow · Reggaeton</h3>
      <p class="g-small">BPM 90–100</p>
      ${beat([['Kick', 'x...x...x...x...'], ['Snare', '...x..x....x..x.'], ['Shaker', 'o.o.o.o.o.o.o.o.']])}
      <h3>Fill · geçiş barı</h3>
      <p class="g-small">Bir bölüm bitmeden önceki son bar; ardından gelen ilk adıma Crash koy</p>
      ${beat([['Kick', 'x.......x.......'], ['Snare', '....x.....x.xxxx'], ['Tom', '........x.x.....']])}
      ${note('Ritmi canlı tutmak için: hi-hat\'lerin ses seviyesini adım adım değiştir, Swing\'i biraz aç, her 4. barda küçük bir değişiklik yap.')}`,
      `<h3>Bas: kick'e kilitlen</h3>
      <p>En sağlam bas, kick'le aynı adımlarda çalan bastır. Kick'in ritmini bas kanalına kopyala, sonra Piano Roll'da notaları akorların kök notalarına taşı.</p>
      ${beat([['Kick', 'x......x..x.....'], ['Bass', 'x......x..x.....']], 'Boom-bap: bas kick ile birlikte')}
      <p>House'ta ise bas kick'in arasına, vuruşun “ve”sine girer; ikisi birbirine çarpmaz ve zıplayan bir his oluşur.</p>
      ${beat([['Kick', 'x...x...x...x...'], ['Bass', '..x...x...x...x.']], 'House: bas kick\'lerin arasında')}
      ${note('Trap\'te uzun “808” bası için Sub kanalını seç, Decay ve Release\'i artır, notaları Piano Roll\'da 1/4 ya da 1/2 uzunlukta yaz.')}`,
      `<h3>Akorlar: hazır yürüyüşler</h3>
      <p>Bir pad ya da keys kanalı aç, Piano Roll'da her bara bir akor koy (nota uzunluğu: <b>1 bar</b>). Akorun üç notasını aynı sütuna üst üste diz.</p>
      <table class="g-keys">
        <tr><td><b>Pop</b></td><td>Do · Sol · Lam · Fa</td></tr>
        <tr><td><b>Hüzünlü</b></td><td>Lam · Fa · Do · Sol</td></tr>
        <tr><td><b>Epik</b></td><td>Lam · Sol · Fa · Mi</td></tr>
        <tr><td><b>Lo-fi / Caz</b></td><td>Rem7 · Sol7 · Domaj7 · Domaj7</td></tr>
      </table>
      <h3>Akorun notaları</h3>
      <div class="g-grid">
        <span><b>Do</b> — Do Mi Sol</span><span><b>Re m</b> — Re Fa La</span>
        <span><b>Mi</b> — Mi Sol# Si</span><span><b>Fa</b> — Fa La Do</span>
        <span><b>Sol</b> — Sol Si Re</span><span><b>La m</b> — La Do Mi</span>
        <span><b>Rem7</b> — Re Fa La Do</span><span><b>Sol7</b> — Sol Si Re Fa</span>
        <span><b>Domaj7</b> — Do Mi Sol Si</span>
      </div>`,
      `<h3>Melodi: yanlış nota yok</h3>
      <p>Yukarıdaki akorların hepsi <b>Do majör / La minör</b> tonundadır: piyanonun yalnızca <b>beyaz tuşlarını</b> kullanırsan hiçbir nota sırıtmaz. Daha da güvenli olsun istersen <b>pentatonik</b> gamla başla:</p>
      <p class="g-center"><b>Do · Re · Mi · Sol · La</b></p>
      <ul class="g-list">
        <li><b>Önce mırıldan.</b> Seçili kanalı klavye piyanosuyla (${k('A')}–${k('L')}) çalarak bir motif bul.</li>
        <li><b>Güçlü vuruşta akor notası.</b> Barın 1. ve 9. adımına o anki akorun notalarından birini koy.</li>
        <li><b>Soru–cevap.</b> 2 barlık bir motif yaz, sonraki 2 barda onu biraz değiştirerek tekrarla.</li>
        <li><b>Nefes bırak.</b> Melodinin arasında sessiz adımlar olsun; her kutuyu doldurma.</li>
        <li><b>Az nota, çok tekrar.</b> Akılda kalan melodiler genellikle 3–5 farklı notadan oluşur.</li>
      </ul>`,
      `<h3>Adım adım: aygıtlarla şarkı</h3>
      <ol class="g-list">
        <li><b>Üst çubuk</b> — BPM'i tarza göre ayarla.</li>
        <li><b>Kanallar</b> — pattern uzunluğunu <b>4 bar</b> yap, davul kanallarına ritmi yak, <b>Adlandır</b>: “Davul”.</li>
        <li><b>+ Yeni pattern</b> — “Bas”: Bass kanalı ekle, çift tıkla, Piano Roll'da bas notalarını yaz.</li>
        <li><b>+ Yeni pattern</b> — “Akor”: Pad ya da Keys ile 4 barlık yürüyüşü yaz.</li>
        <li><b>+ Yeni pattern</b> — “Melodi”: Lead ya da Pluck ile motifini yaz.</li>
        <li>“Davul”u seç, <b>Klonla</b>, son bara fill ekle: “Davul Fill”.</li>
        <li><b>Playlist</b> — her pattern'e ayrı bir şerit ver ve aşağıdaki haritaya göre diz.</li>
        <li><b>Mixer</b> — seviyeleri dengele (sonraki sayfa).</li>
        <li><b>SONG</b> modunda baştan sona dinle, ☰ menüsünden <b>WAV</b> olarak çıkar.</li>
      </ol>`,
      `<h3>Şarkı haritası</h3>
      <p class="g-small">Her kutu 1 bar. Giriş · Kıta · Nakarat · Kapanış</p>
      ${beat([['Akor', 'xxxxxxxxxxxxxxxxxxxxxxxx'], ['Davul', '....xxxxxxx.xxxxxxx.....'], ['Fill', '...........x.......x....'], ['Bas', '....xxxxxxxxxxxxxxxx....'], ['Melodi', '............xxxxxxxxxxxx']], 'Bar 1–4 giriş · 5–12 kıta · 13–20 nakarat · 21–24 kapanış')}
      <h3>Mix için başlangıç ayarları</h3>
      <table class="g-keys">
        <tr><td><b>Kick, Bas</b></td><td>En yüksek; Pan ortada, reverb yok</td></tr>
        <tr><td><b>Snare / Clap</b></td><td>Kick'ten biraz kısık; az reverb</td></tr>
        <tr><td><b>Hi-Hat, Shaker</b></td><td>Kısık; Pan hafif sağa ya da sola</td></tr>
        <tr><td><b>Akor</b></td><td>Arka planda; bol reverb</td></tr>
        <tr><td><b>Melodi</b></td><td>Akordan biraz yüksek; hafif delay</td></tr>
      </table>
      ${note('Bitti mi? Bir gün ara ver, sonra tekrar dinle. Taze kulak, en iyi mix aracıdır.')}`,
    ],
  },
  {
    icon: '🧩', title: 'Şarkının bölümleri',
    pages: [
      `<p>Bir şarkı baştan sona aynı kalmaz; bir hikâye gibi açılır, yükselir, soluklanır ve kapanır. Her bölümün kendi görevi, kendi enerjisi ve çoğu zaman kendi akorları vardır.</p>
      <dl class="g-dl">
        <dt>Giriş</dt><dd>Dinleyiciyi içeri davet eder. Az katman: yalnızca akor ya da melodinin bir parçası. 2–4 bar.</dd>
        <dt>Kıta</dt><dd>Hikâyeyi anlatır. Sade davul, alçak ve konuşur gibi bir melodi. Her kıtada sözler değişir, müzik aynı kalır.</dd>
        <dt>Ön nakarat</dt><dd>Gerilim kurar. Akorlar değişir, snare sıklaşır, melodi yükselir; “bir şey geliyor” hissi.</dd>
        <dt>Nakarat</dt><dd>Şarkının kalbi. En dolu, en yüksek, en akılda kalan kısım; her seferinde aynı tekrarlanır.</dd>
        <dt>Köprü</dt><dd>Şarkıda bir kez gelen sürpriz. Yeni akorlar, farklı ritim, bazen başka bir ton.</dd>
        <dt>Ara / Breakdown</dt><dd>Davullar çekilir, ortalık sakinleşir; bir sonraki patlamaya nefes hazırlığı.</dd>
        <dt>Drop</dt><dd>Elektronik müzikte nakaratın yerini alır: bekletilmiş enerji bir anda bırakılır.</dd>
        <dt>Kapanış</dt><dd>Girişi hatırlatır ya da nakaratı söndürerek bitirir; son akor “ev”e döner.</dd>
      </dl>`,
      `<h3>Bölümler arasında ne değişir?</h3>
      <ul class="g-list">
        <li><b>Katman sayısı</b> — girişte 1–2 kanal, nakaratta hepsi. Enerjiyi en kolay böyle yönetirsin.</li>
        <li><b>Ritim yoğunluğu</b> — kıtada 8'lik hi-hat, nakaratta 16'lık; köprüde kick yarıya iner.</li>
        <li><b>Perde (oktav)</b> — kıta melodisi alçakta, nakarat melodisi bir oktav yukarıda.</li>
        <li><b>Akor yürüyüşü</b> — her bölüm kendi 4 akoruna sahip olabilir.</li>
        <li><b>Ton</b> — bölümler farklı tonda olabilir (sonraki sayfa).</li>
        <li><b>Ses rengi</b> — kıtada Keys, nakaratta Strings + Pad; aynı akor çok daha geniş duyulur.</li>
      </ul>
      <h3>Enerji eğrisi</h3>
      <table class="g-keys">
        <tr><td>Giriş</td><td>●○○○○</td></tr>
        <tr><td>Kıta</td><td>●●○○○</td></tr>
        <tr><td>Ön nakarat</td><td>●●●○○</td></tr>
        <tr><td>Nakarat</td><td>●●●●○</td></tr>
        <tr><td>Köprü</td><td>●●○○○</td></tr>
        <tr><td>Son nakarat</td><td>●●●●●</td></tr>
        <tr><td>Kapanış</td><td>●○○○○</td></tr>
      </table>`,
      `<h3>Tonla oynamak</h3>
      <dl class="g-dl">
        <dt>Akraba tonlar</dt><dd>La minör ve Do majör aynı beyaz tuşları kullanır. Kıtayı Lam ile başlat (hüzünlü), nakaratı Do ile başlat (aydınlık): hiçbir nota değişmeden duygu değişir.</dd>
        <dt>Son nakaratta yükselme</dt><dd>Son nakaratı 1 ya da 2 yarım ton yukarıda çal. Pop'un en eski hilesidir; şarkıya son bir güç verir. Nakarat pattern'lerini <b>Klonla</b>, Piano Roll'da tüm notaları 2 satır yukarı taşı.</dd>
        <dt>Ödünç akor</dt><dd>Do majörde Fa yerine bir kez <b>Fa minör</b> (Fa La♭ Do) çal: tatlı, hüzünlü bir gölge düşer. Köprü için idealdir.</dd>
        <dt>Paralel ton</dt><dd>Do majörden <b>Do minöre</b> (Mi, La, Si yerine Mi♭, La♭, Si♭) geçmek, aynı yerde havanın kararması gibidir: oyunlarda “tehlike geldi” anı.</dd>
        <dt>Komşu ton</dt><dd>Köprüde Fa majöre ya da Sol majöre kaymak tazelik verir; nakarata dönerken eski tona dön.</dd>
      </dl>
      ${note('Ton değiştirirken bas ve akor kanallarını da birlikte taşı; yalnızca melodiyi taşırsan her şey sırıtır.')}`,
      `<h3>Örnek: bölüm bölüm bir pop şarkısı</h3>
      <p class="g-small">Do majör · BPM 104 · her bölüm ayrı pattern</p>
      <table class="g-keys">
        <tr><td><b>Giriş</b> 4</td><td>Lam · Fa · Do · Sol — yalnızca Pad, davul yok</td></tr>
        <tr><td><b>Kıta</b> 8</td><td>Aynı akorlar; Kick + Hi-Hat, Keys, alçak melodi</td></tr>
        <tr><td><b>Ön nakarat</b> 4</td><td>Fa · Sol · Fa · Sol; snare sıklaşır, son barda fill</td></tr>
        <tr><td><b>Nakarat</b> 8</td><td>Do · Sol · Lam · Fa; tam davul, Strings, melodi oktav yukarı</td></tr>
        <tr><td><b>Köprü</b> 4</td><td>Rem · Mim · Fa · Fam; davul yarıya iner</td></tr>
        <tr><td><b>Son nakarat</b> 8</td><td>Re majöre çık: Re · La · Sim · Sol; Crash ile başla</td></tr>
        <tr><td><b>Kapanış</b> 4</td><td>Girişin Pad'i, son akor Re'de uzun</td></tr>
      </table>
      <h3>Ash Studio'da kurmak</h3>
      <ol class="g-list">
        <li>Her bölüm için ayrı pattern aç ve adlandır: “Kıta Davul”, “Nakarat Akor”…</li>
        <li>Benzer bölümleri sıfırdan yazma: <b>Klonla</b>, sonra yalnızca farkı değiştir.</li>
        <li>Playlist'te bölüm sınırlarını şeritlere bakarak gör; her geçişin son barına fill koy.</li>
      </ol>`,
    ],
  },
  {
    icon: '🌍', title: 'Kültür ve tema',
    pages: [
      `<p>Bir müziğin “nerede” geçtiğini dört şey anlatır: <b>gam</b> (hangi notalar), <b>enstrüman</b> (hangi ses rengi), <b>ritim</b> ve <b>tempo</b>. Biri bile doğru seçilirse kulak hemen bir yere yerleşir.</p>
      <h3>Gamlar ve duyguları</h3>
      <p class="g-small">Hepsi kolay çalınsın diye beyaz tuşlara yakın yazıldı; # ve ♭ siyah tuştur.</p>
      <table class="g-keys">
        <tr><td><b>Majör</b></td><td>Do Re Mi Fa Sol La Si — neşeli, aydınlık</td></tr>
        <tr><td><b>Minör</b></td><td>La Si Do Re Mi Fa Sol — hüzünlü, ciddi</td></tr>
        <tr><td><b>Majör pentatonik</b></td><td>Do Re Mi Sol La — kır, folk, Uzak Doğu</td></tr>
        <tr><td><b>Minör pentatonik</b></td><td>La Do Re Mi Sol — blues, rock, Afrika</td></tr>
        <tr><td><b>Dorian</b></td><td>Re Mi Fa Sol La Si Do — caz, lo-fi, Kelt</td></tr>
        <tr><td><b>Mixolidyen</b></td><td>Sol La Si Do Re Mi Fa — rock, İrlanda, kovboy</td></tr>
        <tr><td><b>Lidyen</b></td><td>Fa Sol La Si Do Re Mi — rüya, sihir, uzay</td></tr>
        <tr><td><b>Harmonik minör</b></td><td>La Si Do Re Mi Fa Sol# — gizem, Balkan, klasik</td></tr>
        <tr><td><b>Hicaz</b></td><td>Mi Fa Sol# La Si Do Re — Anadolu, Orta Doğu, çöl</td></tr>
        <tr><td><b>Japon (In)</b></td><td>Mi Fa La Si Do — Japonya, sakin ve uzak</td></tr>
      </table>`,
      `<h3>Duyguya göre ton ve tempo</h3>
      <table class="g-keys">
        <tr><td><b>Neşeli</b></td><td>Majör · 110–130 BPM · Pluck, Marimba</td></tr>
        <tr><td><b>Hüzünlü</b></td><td>Minör · 60–80 · Keys, Strings</td></tr>
        <tr><td><b>Huzurlu</b></td><td>Majör pentatonik · 70–90 · Pad, Flute</td></tr>
        <tr><td><b>Gizemli</b></td><td>Harmonik minör · 70–90 · alçak Strings, Bell</td></tr>
        <tr><td><b>Gerilimli</b></td><td>Minör, tek notada ısrar · 130–150 · Bass, Tom</td></tr>
        <tr><td><b>Epik</b></td><td>Minör, Lam·Fa·Do·Sol · 90–110 · Brass, Strings</td></tr>
        <tr><td><b>Romantik</b></td><td>Majör 7'li akorlar · 65–80 · EPiano, Pad</td></tr>
      </table>
      <h3>Hangi ton?</h3>
      <p>Majör mü minör mü sorusu, Do mu Re mi sorusundan çok daha önemlidir. Yine de alçak tonlar (Mi, Fa) daha ağır ve karanlık, yüksek tonlar daha parlak duyulur. Vokal yazıyorsan tonu, şarkıcının rahat söyleyeceği yere göre seç.</p>
      ${note('Gerçek geleneklerde (makamlar, ragalar) piyanoda olmayan ara sesler vardır. Buradaki gamlar onların piyanodaki yakın benzerleridir.')}`,
      `<h3>Anadolu</h3>
      <p><b>Gam:</b> Hicaz, Uşşak (Re Mi Fa Sol La Si♭ Do). <b>Enstrümanlar:</b> bağlama → <i>Pluck</i>, kaval ve ney → <i>Flute</i>, zurna → <i>Lead</i>, davul ve darbuka → <i>Tom</i>, <i>Conga</i>, <i>Rim</i>.</p>
      <p class="g-small">Aksak ritmi 4/4 içinde 3+3+2 vurguyla taklit et</p>
      ${beat([['Tom', 'x..x..x.x..x..x.'], ['Rim', '.x.x.x.x.x.x.x.x']])}
      <h3>Orta Doğu</h3>
      <p><b>Gam:</b> Hicaz, harmonik minör. <b>Enstrümanlar:</b> ud ve kanun → <i>Pluck</i>, ney → <i>Flute</i>, darbuka → <i>Tom</i> (düm) + <i>Rim</i> (tek). Kök ve beşliyi uzun tutan bir <i>Pad</i> zemini.</p>
      <p class="g-small">Maksum: düm-tek-tek-düm-tek</p>
      ${beat([['Tom', 'x.......x.......'], ['Rim', '..x...x.....x...']])}`,
      `<h3>Uzak Doğu</h3>
      <p><b>Gam:</b> Japonya için In gamı, Çin için majör pentatonik. <b>Enstrümanlar:</b> koto → <i>Pluck</i>, shakuhachi → <i>Flute</i>, taiko → <i>Tom</i> (Tune düşük, Decay uzun), tapınak çanı → <i>Bell</i>. Bol boşluk, yavaş tempo.</p>
      <h3>Kelt ve ortaçağ</h3>
      <p><b>Gam:</b> Dorian, Mixolidyen. <b>Enstrümanlar:</b> düdük → <i>Flute</i>, arp → <i>Pluck</i>, keman → <i>Strings</i>, bodhrán → <i>Tom</i>. Swing'i %40'a aç: 6/8'lik oynak bir hisse yaklaşır.</p>
      <h3>Latin ve Karayip</h3>
      <p><b>Gam:</b> majör, minör, Dorian. <b>Enstrümanlar:</b> conga, bongo → <i>Conga</i>, klave → <i>Wood Block</i>, <i>Cowbell</i>, <i>Marimba</i>, trompet → <i>Brass</i>.</p>
      <p class="g-small">3-2 klave: bütün Latin ritminin iskeleti</p>
      ${beat([['Wood Block', 'x..x..x...x.x...'], ['Conga', '..o.x.o...o.x.o.']])}`,
      `<h3>Afrika</h3>
      <p><b>Gam:</b> pentatonikler. <b>Enstrümanlar:</b> djembe → <i>Conga</i>, balafon → <i>Marimba</i>, kalimba → <i>Bell</i>, <i>Shaker</i>. Farklı uzunlukta tekrar eden ritimleri üst üste koy.</p>
      <h3>Hindistan</h3>
      <p><b>Gam:</b> Bhairav raga (Do Re♭ Mi Fa Sol La♭ Si) ya da Hicaz. <b>Enstrümanlar:</b> sitar → <i>Pluck</i> (biraz Rezonans), tabla → <i>Conga</i> + <i>Tom</i>, tanpura → hiç susmayan <i>Pad</i> drone'u (Do + Sol).</p>
      <h3>Balkan</h3>
      <p><b>Gam:</b> harmonik minör, Hicaz. <b>Enstrümanlar:</b> akordeon → <i>Organ</i>, klarnet → <i>Flute</i>, bando → <i>Brass</i>. Hızlı tempo (140+), 3+3+2 vurgular.</p>
      <h3>Kovboy, blues, caz</h3>
      <p>Kovboy: majör pentatonik, <i>Pluck</i>, at yürüyüşü gibi kick. Blues: minör pentatonik + Re# (blues notası), Swing yüksek. Caz: Dorian, 7'li akorlar, <i>EPiano</i>, <i>Ride</i>, <i>Sub</i>.</p>`,
      `<h3>Temaya göre</h3>
      <table class="g-keys">
        <tr><td><b>Orman</b></td><td>Majör pentatonik · Flute, Marimba, Wood Block</td></tr>
        <tr><td><b>Çöl</b></td><td>Hicaz · Flute, Pluck, Conga, Pad drone</td></tr>
        <tr><td><b>Kale</b></td><td>Dorian · Strings, Brass, Tom marşı</td></tr>
        <tr><td><b>Su altı</b></td><td>Majör 7'li akorlar · EPiano, Marimba, bol Delay</td></tr>
        <tr><td><b>Kış</b></td><td>Majör · Bell, Strings, Shaker (kızak zili)</td></tr>
        <tr><td><b>Uzay</b></td><td>Lidyen · Pad, Bell, uzun Reverb, davulsuz</td></tr>
        <tr><td><b>Korku</b></td><td>Harmonik minör · alçak Strings, tek Bell, düzensiz Tom</td></tr>
        <tr><td><b>Şehir gecesi</b></td><td>Minör · SuperSaw Pad, oktav zıplayan Bass, 100–118</td></tr>
        <tr><td><b>Savaş</b></td><td>Minör · Brass, Strings, Tom ostinato, 140</td></tr>
        <tr><td><b>Masal</b></td><td>Lidyen · Bell arpej, Strings, Flute</td></tr>
      </table>
      ${note('Bir yeri anlatmak için üç işaret yeter: doğru gam, bir imza enstrüman, bir tanıdık ritim. Gerisini kendi tarzınla doldur.')}`,
    ],
  },
];

const RIBBON = ['#d98ba0', '#e2a868', '#9cb87a', '#7fa9c9', '#b496d6', '#e0c068', '#c98f6f', '#86b8a8', '#d4a5c4', '#a8a07a', '#8f9fd1', '#c97a7a', '#7fb7c9', '#c9a46f'];

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
