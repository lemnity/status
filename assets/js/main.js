(function(){
  document.documentElement.classList.add('js');

  /* Лоадер: скрыть после загрузки страницы, но не раньше, чем логотип успеет проявиться.
     Анимации первого экрана и появление при прокрутке стартуют после него (afterLoader) */
  var root=document.documentElement, waiting=[];
  function afterLoader(fn){ if(root.classList.contains('loaded')) fn(); else waiting.push(fn); }
  (function(){
    var el=document.getElementById('loader');
    function release(){ root.classList.add('loaded'); waiting.splice(0).forEach(function(fn){fn()}); }
    if(!el){ release(); return; }
    var t0=Date.now(), MIN=900;
    function hide(){setTimeout(function(){el.classList.add('done');setTimeout(release,250);setTimeout(function(){el.remove()},600)},Math.max(0,MIN-(Date.now()-t0)))}
    if(document.readyState==='complete') hide(); else window.addEventListener('load',hide);
  })();

  /* Цели аналитики: Яндекс.Метрика (если подключена) + dataLayer */
  var YM_ID = null; // ← номер счётчика Метрики statussk.ru
  function goal(name, params){
    try{ if(YM_ID && typeof window.ym==='function') window.ym(YM_ID,'reachGoal',name,params||{}); }catch(e){}
    try{ (window.dataLayer=window.dataLayer||[]).push({event:name,page:'vnedrenie-mstroy'}); }catch(e){}
  }

  /* Мобильное меню */
  var header=document.querySelector('.site-header'), burger=document.querySelector('.burger');
  function setMenu(open){
    header.classList.toggle('open',open);
    burger.setAttribute('aria-expanded',open?'true':'false');
    burger.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
  }
  burger.addEventListener('click',function(){setMenu(!header.classList.contains('open'))});
  document.querySelectorAll('#mnav a').forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&header.classList.contains('open')){setMenu(false);burger.focus()}});

  /* Целевые действия: цель + тема заявки + фокус в форму */
  var topic=document.getElementById('f-topic'), topicLabel=document.getElementById('topic-label');
  document.addEventListener('click',function(e){
    var el=e.target.closest('[data-goal]'); if(!el) return;
    goal(el.getAttribute('data-goal'));
    var t=el.getAttribute('data-topic'); if(t){topic.value=t;topicLabel.textContent=t}
    if(el.getAttribute('href')==='#lead'){
      setTimeout(function(){var f=document.getElementById('f-name'); if(f&&!document.getElementById('lead-form').classList.contains('sent')) f.focus({preventScroll:true});},550);
    }
  });

  /* Слайдер первого экрана: бесконечный цикл */
  (function(){
    var root=document.getElementById('hs'); if(!root) return;
    var slides=[].slice.call(root.querySelectorAll('.hs-slide')), n=slides.length, i=0, DUR=6000;
    var cap=document.getElementById('hs-cap'), num=document.getElementById('hs-n'), play=document.getElementById('hs-play'), prog=root.querySelector('.hs-progress');
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    var userPaused=reduce, hold=false, timer=null, left=DUR, started=0;
    root.style.setProperty('--hs-dur',DUR+'ms');
    var bars=slides.map(function(){var b=document.createElement('span');prog.appendChild(b);return b});
    function running(){return !userPaused&&!hold&&!document.hidden}
    function tick(){clearTimeout(timer);timer=null;if(!running())return;started=Date.now();timer=setTimeout(function(){go(i+1)},left)}
    function stop(){if(timer){clearTimeout(timer);timer=null;left=Math.max(0,left-(Date.now()-started))}}
    function sync(){root.classList.toggle('paused',userPaused);root.classList.toggle('hold',hold||document.hidden);if(running())tick();else stop()}
    function go(k){
      k=(k%n+n)%n; if(k===i) return;
      slides.forEach(function(s){s.classList.remove('is-prev')});
      slides[i].classList.remove('is-on');slides[i].classList.add('is-prev');
      i=k;slides[i].classList.add('is-on');
      var txt=slides[i].querySelector('img').getAttribute('data-cap');
      cap.style.opacity=0;setTimeout(function(){cap.textContent=txt;cap.style.opacity=1},220);
      num.textContent=String(i+1).padStart(2,'0');
      bars.forEach(function(b,j){b.classList.remove('run');b.classList.toggle('done',j<i)});
      void bars[i].offsetWidth;bars[i].classList.add('run');
      clearTimeout(timer);timer=null;left=DUR;tick();
    }
    play.addEventListener('click',function(){
      userPaused=!userPaused;
      play.setAttribute('aria-pressed',userPaused?'true':'false');
      play.setAttribute('aria-label',userPaused?'Запустить слайдер':'Остановить слайдер');
      sync();
    });
    document.getElementById('hs-next').addEventListener('click',function(){go(i+1)});
    document.getElementById('hs-prev').addEventListener('click',function(){go(i-1)});
    var media=root.parentNode;
    media.addEventListener('mouseenter',function(){hold=true;sync()});
    media.addEventListener('mouseleave',function(){hold=false;sync()});
    root.addEventListener('focusin',function(){hold=true;sync()});
    root.addEventListener('focusout',function(e){if(!root.contains(e.relatedTarget)){hold=false;sync()}});
    document.addEventListener('visibilitychange',sync);
    root.addEventListener('keydown',function(e){if(e.key==='ArrowRight')go(i+1);else if(e.key==='ArrowLeft')go(i-1)});
    var x0=null,y0=null;
    root.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse')return;x0=e.clientX;y0=e.clientY});
    root.addEventListener('pointerup',function(e){if(x0===null)return;var dx=e.clientX-x0,dy=e.clientY-y0;x0=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))go(dx<0?i+1:i-1)});
    if(reduce){play.setAttribute('aria-pressed','true');play.setAttribute('aria-label','Запустить слайдер')}
    bars[0].classList.add('run');sync();
  })();

  /* Полоса показателей: отсчёт чисел при появлении в кадре */
  (function(){
    var box=document.getElementById('stats'); if(!box) return;
    var nums=[].slice.call(box.querySelectorAll('b[data-to]'));
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    function run(){
      box.classList.add('go');
      if(reduce) return;
      nums.forEach(function(el,k){
        var to=+el.getAttribute('data-to'), dur=1600, t0=null, delay=150+k*150;
        el.textContent='0';
        setTimeout(function(){
          requestAnimationFrame(function step(ts){
            if(t0===null) t0=ts;
            var p=Math.min(1,(ts-t0)/dur), e=1-Math.pow(1-p,4);
            el.textContent=String(Math.round(to*e));
            if(p<1) requestAnimationFrame(step);
          });
        },delay);
      });
    }
    if(!('IntersectionObserver' in window)){box.classList.add('go');return}
    var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();run()}},{threshold:.35});
    io.observe(box);
  })();

  /* «Дорога» шагов: укладывается при появлении в кадре */
  (function(){
    var r=document.getElementById('route'); if(!r) return;
    if(!('IntersectionObserver' in window)){r.classList.add('go');return}
    var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();setTimeout(function(){r.classList.add('go')},250)}},{threshold:.4});
    io.observe(r);
  })();

  /* Модули MStroy */
  var MODULES=[
    {k:'build',name:'Управление строительными процессами',text:'План работ по объекту, фиксация фактического выполнения и сравнение с планом. Руководитель видит, на каких участках работы идут с отставанием.',
     rows:[['Земляные работы · участок 1','ok','В графике'],['Устройство опор · ось 3','wait','Отставание'],['Монтаж пролётного строения','new','Начато'],['Устройство дорожной одежды','new','Запланировано']]},
    {k:'docs',name:'Исполнительная документация',text:'Хранение исполнительной документации по объекту в одном месте, поиск актуальных версий и отслеживание статуса согласования.',
     rows:[['АОСР · армирование ростверка','ok','Подписан'],['Исполнительная схема · ось 3','wait','На согласовании'],['Журнал бетонных работ','ok','Актуален'],['АОСР · гидроизоляция','new','Черновик']]},
    {k:'people',name:'Управление трудовыми ресурсами',text:'Учёт персонала на объектах и рабочего времени. Видно, сколько людей задействовано на каждом участке.',
     rows:[['Бригада монтажников · 12 чел.','ok','На объекте'],['Бригада бетонщиков · 8 чел.','ok','На объекте'],['Геодезисты · 2 чел.','new','Выезд 08:00'],['Табель за неделю','wait','Проверка']]},
    {k:'control',name:'Строительный контроль',text:'Фиксация замечаний по качеству работ с привязкой к объекту и контроль сроков их устранения.',
     rows:[['Замечание № 14 · защитный слой бетона','wait','В работе'],['Замечание № 13 · сварные швы','ok','Устранено'],['Входной контроль арматуры','ok','Принято'],['Предписание № 5','new','Новое']]},
    {k:'tech',name:'Управление машинами и механизмами',text:'Учёт строительной техники на объектах и её загрузки. Помогает планировать перемещение машин между участками.',
     rows:[['Автокран 50 т','ok','В работе'],['Экскаватор гусеничный','ok','В работе'],['Автобетоносмесители × 3','new','По графику'],['Каток дорожный','wait','Простой']]},
    {k:'classifier',name:'Классификатор строительной информации',text:'Единые правила структурирования данных проекта, чтобы все участники называли и искали информацию одинаково.',
     rows:[['Конструктивные элементы','ok','Согласован'],['Виды работ','ok','Согласован'],['Материалы и изделия','wait','Дополняется'],['Типы документов','ok','Согласован']]},
    {k:'cde',name:'Информационная модель и среда общих данных',text:'Работа с информационной моделью объекта и доступ участников проекта к общей среде данных, в пределах доступного функционала платформы.',
     rows:[['Модель · пролётное строение','ok','Актуальна'],['Модель · опоры','wait','Обновление'],['Доступ подрядчиков','ok','Настроен'],['Связь модели с документами','new','В работе']]}
  ];
  /* аккордеон: одна колонка всегда раскрыта; стрелки переключают модули */
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var acc=document.getElementById('acc'), items=[], current=-1;
  var plus='<svg class="acc-plus" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>';
  MODULES.forEach(function(m,i){
    var n=String(i+1).padStart(2,'0'), it=document.createElement('div'); it.className='acc-item';
    it.innerHTML='<button type="button" class="acc-tab" id="acc-'+m.k+'" aria-expanded="false" aria-controls="accb-'+m.k+'">'+plus+
      '<span class="acc-name">'+esc(m.name)+'</span><span class="acc-num" aria-hidden="true">'+(i+1)+'</span></button>'+
      '<div class="acc-body" id="accb-'+m.k+'" role="region" aria-labelledby="acc-'+m.k+'">'+
        '<div class="mod-stage blueprint"><span class="mono cap">Интерфейс модуля · '+n+'</span>'+
          '<div class="ui mod-shot" aria-hidden="true"><div class="ui-bar"><span class="ui-dots"><i></i><i></i><i></i></span><span class="ui-title">'+esc(m.name)+'</span><span class="ui-tag">MStroy</span></div>'+
          '<div class="ui-body"><div class="ui-side">'+MODULES.map(function(x,j){return '<span'+(j===i?' class="on"':'')+'>'+esc(x.name)+'</span>'}).join('')+'</div>'+
          '<div class="ui-main"><div class="shot-rows">'+m.rows.map(function(r){return '<div class="shot-row"><span>'+esc(r[0])+'</span><span class="pill '+r[1]+'">'+esc(r[2])+'</span></div>'}).join('')+'</div></div></div></div></div>'+
        '<div><h3>'+esc(m.name)+'</h3><p>'+esc(m.text)+'</p></div></div>';
    var btn=it.querySelector('.acc-tab');
    btn.addEventListener('click',function(){select(i)});
    btn.addEventListener('keydown',function(e){
      var k=null; if(e.key==='ArrowRight'||e.key==='ArrowDown') k=(i+1)%MODULES.length; if(e.key==='ArrowLeft'||e.key==='ArrowUp') k=(i-1+MODULES.length)%MODULES.length;
      if(e.key==='Home') k=0; if(e.key==='End') k=MODULES.length-1;
      if(k!==null){e.preventDefault();select(k);items[k].querySelector('.acc-tab').focus()}
    });
    acc.appendChild(it); items.push(it);
  });
  function select(i){
    if(i===current) return; current=i;
    items.forEach(function(it,j){ it.classList.toggle('open',j===i); var b=it.querySelector('.acc-tab'); b.setAttribute('aria-expanded',j===i?'true':'false'); b.setAttribute('aria-disabled',j===i?'true':'false'); });
  }
  select(0);

  /* Форма заявки */
  var form=document.getElementById('lead-form'), started=false, t0=Date.now();
  try{
    var q=new URLSearchParams(location.search);
    var src=q.get('utm_source')?[q.get('utm_source'),q.get('utm_medium'),q.get('utm_campaign')].filter(Boolean).join(' / '):(document.referrer||'прямой заход');
    document.getElementById('f-source').value=src;
    document.getElementById('f-landing').value=location.href;
  }catch(e){}
  form.addEventListener('focusin',function(){ if(!started){started=true;goal('mstroy_form_start')} });

  var rules={
    'f-name':function(v){return v.trim().length>=2},
    'f-company':function(v){return v.trim().length>=2},
    'f-contact':function(v){v=v.trim();return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)||v.replace(/\D/g,'').length>=10},
    'f-task':function(v){return v.trim().length>=5}
  };
  function check(id){
    var el=document.getElementById(id), ok=rules[id](el.value), f=el.closest('.field');
    f.classList.toggle('invalid',!ok);
    el.setAttribute('aria-invalid',ok?'false':'true');
    if(!ok) el.setAttribute('aria-describedby','e-'+id.slice(2)); else el.removeAttribute('aria-describedby');
    return ok;
  }
  Object.keys(rules).forEach(function(id){
    var el=document.getElementById(id);
    el.addEventListener('blur',function(){ if(el.value) check(id) });
    el.addEventListener('input',function(){ if(el.closest('.field').classList.contains('invalid')) check(id) });
  });
  var consent=document.getElementById('f-consent'), cw=document.getElementById('consent-wrap'), errBox=document.getElementById('form-error');
  consent.addEventListener('change',function(){cw.classList.toggle('invalid',!consent.checked)});

  form.addEventListener('submit',function(e){
    e.preventDefault();
    var bad=[];
    Object.keys(rules).forEach(function(id){ if(!check(id)) bad.push(document.getElementById(id)) });
    cw.classList.toggle('invalid',!consent.checked);
    if(bad.length||!consent.checked){
      errBox.textContent=bad.length?'Заполните отмеченные поля.':'Подтвердите согласие на обработку персональных данных.';
      errBox.classList.add('show');
      (bad[0]||consent).focus();
      return;
    }
    errBox.classList.remove('show');
    // Антиспам: заполнена ловушка или форма отправлена быстрее 3 секунд — молча не отправляем
    if(document.getElementById('f-website').value||Date.now()-t0<3000){form.classList.add('sent');return;}

    var data={}; new FormData(form).forEach(function(v,k){data[k]=v});
    var btn=document.getElementById('f-submit'), bt=document.getElementById('f-submit-text');
    btn.disabled=true;bt.textContent='Отправляем…';

    // ПОДКЛЮЧЕНИЕ: на Tilda заявки уходят через «Приём данных» (почта / CRM).
    // Здесь заменить на принятый канал, например:
    // fetch('/lead', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)})
    Promise.resolve(data).then(function(){
      goal('mstroy_form_submit',{topic:data.topic});
      form.classList.add('sent');
      var h=document.getElementById('success-title'); if(h) h.focus();
    }).catch(function(){
      btn.disabled=false;bt.textContent='Обсудить внедрение';
      errBox.textContent='Не удалось отправить заявку. Попробуйте ещё раз или позвоните: +7 (345) 254-02-95.';
      errBox.classList.add('show');
    });
  });

  /* Заголовки: режем на слова, каждое выезжает из-под маски с небольшой задержкой.
     Элемент с классом tag («MStroy» в h1) идёт одним словом, остальные теги (em) режутся внутри; неразрывный пробел слова не разделяет */
  var motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heads=motion?[].slice.call(document.querySelectorAll('main h1, main h2')):[];
  heads.forEach(function(h){
    var n=0;
    function wrap(node){ var w=document.createElement('span'),i=document.createElement('span'); w.className='w'; i.className='wi'; i.style.setProperty('--i',n++); w.appendChild(i); node.parentNode.replaceChild(w,node); i.appendChild(node); }
    (function walk(el){
      [].slice.call(el.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var parts=c.textContent.split(/([ \t\n\r]+)/), frag=document.createDocumentFragment();
          parts.forEach(function(t){ if(!t) return; var tn=document.createTextNode(t); frag.appendChild(tn); });
          var nodes=[].slice.call(frag.childNodes); c.parentNode.replaceChild(frag,c);
          nodes.forEach(function(tn){ if(/[^ \t\n\r]/.test(tn.textContent)) wrap(tn); });
        } else if(c.nodeType===1){ if(c.classList.contains('tag')) wrap(c); else walk(c); }
      });
    })(h);
    h.style.setProperty('--words',n); h.classList.add('split');
  });

  /* Появление при прокрутке (то, что уже в кадре, показываем сразу) — после лоадера */
  afterLoader(function(){
    var items=[].slice.call(document.querySelectorAll('.rv')).concat(heads);
    function show(el){ el.classList.add(el.classList.contains('split')?'on':'in'); if(el.classList.contains('rv')) el.classList.add('in'); }
    if('IntersectionObserver' in window && motion){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
      items.forEach(function(el){ if(el.getBoundingClientRect().top<innerHeight*.92) show(el); else io.observe(el); });
    } else items.forEach(show);
  });
  /* ── WOW-слой ── */
  var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* Плавная прокрутка (Lenis): только мышь/тачпад и без «уменьшения движения»; якоря — с учётом шапки */
  if(motion&&fine&&window.Lenis){
    var head=document.querySelector('.site-header');
    var lenis=new Lenis({lerp:.1,anchors:{offset:-((head?head.offsetHeight:64)+8)}});
    (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(0);
    var mnav=document.getElementById('mnav'); if(mnav) mnav.setAttribute('data-lenis-prevent','');
  }

  /* Кнопки: подпись режем на буквы (читалкам — целиком, через .sr) */
  if(motion&&fine) [].slice.call(document.querySelectorAll('.btn')).forEach(function(b){
    var holder=b.querySelector('#f-submit-text')||b, tn=[].slice.call(holder.childNodes).filter(function(n){return n.nodeType===3&&n.textContent.trim()})[0];
    if(!tn||holder.id==='f-submit-text') return; /* подпись отправки меняется скриптом формы — не трогаем */
    var txt=tn.textContent.trim(), w=document.createElement('span'), sr=document.createElement('span'), vis=document.createElement('span');
    sr.className='sr'; sr.textContent=txt; vis.className='bt'; vis.setAttribute('aria-hidden','true');
    txt.split('').forEach(function(c,i){var ch=document.createElement('span'); ch.className='ch'; ch.style.setProperty('--d',(i*.018)+'s'); ch.textContent=c===' '?' ':c; vis.appendChild(ch)});
    w.appendChild(sr); w.appendChild(vis); holder.replaceChild(w,tn); w.style.display='contents';
  });

  /* Перекрестие над слайдером: плавно догоняет курсор, без курсора стоит в своей точке */
  (function(){
    var m=document.querySelector('.hero-media'); if(!m||!motion||!fine) return;
    var c=document.createElement('div'); c.className='hm-cross'; c.setAttribute('aria-hidden','true');
    c.innerHTML='<i class="h"></i><i class="v"></i><b></b><span class="mono"></span>'; m.appendChild(c);
    var lab=c.querySelector('span'), tx=0, ty=0, x=0, y=0, running=false;
    function home(){var r=m.getBoundingClientRect(); tx=r.width*.42; ty=r.height*.6}
    home(); x=tx; y=ty;
    function tick(){
      x+=(tx-x)*.12; y+=(ty-y)*.12;
      c.style.setProperty('--x',x.toFixed(1)+'px'); c.style.setProperty('--y',y.toFixed(1)+'px');
      lab.textContent='X '+String(Math.round(x)).padStart(4,'0')+' · Y '+String(Math.round(y)).padStart(4,'0');
      if(Math.abs(tx-x)>.3||Math.abs(ty-y)>.3) requestAnimationFrame(tick); else running=false;
    }
    function go(){ if(!running){running=true;requestAnimationFrame(tick)} }
    m.addEventListener('pointermove',function(e){var r=m.getBoundingClientRect(); tx=e.clientX-r.left; ty=e.clientY-r.top; go()});
    m.addEventListener('pointerleave',function(){home();go()});
    addEventListener('resize',function(){home();go()});
    afterLoader(function(){setTimeout(function(){m.classList.add('cross-on');go()},600)});
  })();

  /* По прокрутке: финальный заголовок проявляется по словам, фото — лёгкий параллакс */
  (function(){
    if(!motion) return;
    var fh=document.getElementById('h-final'), words=fh&&fh.classList.contains('split')?[].slice.call(fh.querySelectorAll('.wi')):[];
    if(words.length) fh.classList.add('scrub');
    var px=[].slice.call(document.querySelectorAll('.fit-media img,.why-photo img'));
    px.forEach(function(i){i.classList.add('px')});
    var queued=false;
    function update(){
      queued=false; var vh=innerHeight;
      if(words.length){
        var r=fh.getBoundingClientRect(), end=scrollY+vh>=root.scrollHeight-4, p=end?1:Math.min(1,Math.max(0,(vh*.92-r.top)/(vh*.4)));
        words.forEach(function(w,i){var k=Math.min(1,Math.max(0,p*words.length-i)); w.style.setProperty('--o',(.14+.86*k).toFixed(3))});
      }
      px.forEach(function(i){var r=i.parentNode.getBoundingClientRect(); if(r.bottom<0||r.top>vh) return; var k=(r.top+r.height/2-vh/2)/(vh/2+r.height/2); i.style.setProperty('--py',(k*-7).toFixed(2)+'%')});
    }
    function q(){ if(!queued){queued=true;requestAnimationFrame(update)} }
    addEventListener('scroll',q,{passive:true}); addEventListener('resize',q); update();
  })();
  /* ── Слой 2: скобки на кнопках (только мышь, без «уменьшения движения») ── */
  if(motion&&fine){
    /* скобки: появляются при наведении и смещаются к курсору на 3–4 px */
    [].slice.call(document.querySelectorAll('.btn')).forEach(function(b){
      var bk=document.createElement('span'); bk.className='bk'; bk.setAttribute('aria-hidden','true'); b.appendChild(bk);
      b.addEventListener('pointermove',function(e){ var r=b.getBoundingClientRect(); bk.style.setProperty('--bx',(((e.clientX-r.left)/r.width-.5)*8).toFixed(1)+'px'); bk.style.setProperty('--by',(((e.clientY-r.top)/r.height-.5)*4).toFixed(1)+'px') });
      b.addEventListener('pointerleave',function(){ bk.style.removeProperty('--bx'); bk.style.removeProperty('--by') });
    });
  }
})();
