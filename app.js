/* Libro Illustrato – App base (vanilla JS) */
(function(){
  'use strict';

  // State
  const state = {
    pages: [], // each page: { bg:'#fff', size:'A4', elements:[...]}
    current: 0,
    selection: null, // {pageIndex, elIndex}
  };

  // DOM
  const canvas = document.getElementById('canvas');
  const thumbnails = document.getElementById('thumbnails');
  const pageLabel = document.getElementById('pageLabel');
  const noSelection = document.getElementById('noSelection');
  const propsBox = document.getElementById('props');

  // Toolbar buttons
  const btnNew = document.getElementById('newProject');
  const btnOpen = document.getElementById('openProject');
  const fileOpen = document.getElementById('openFile');
  const btnSave = document.getElementById('saveProject');
  const btnExportPDF = document.getElementById('exportPDF');
  const btnAddText = document.getElementById('addText');
  const btnAddImage = document.getElementById('addImage');
  const fileImage = document.getElementById('imageInput');
  const btnAddPage = document.getElementById('addPage');
  const btnDuplicatePage = document.getElementById('duplicatePage');
  const btnDeletePage = document.getElementById('deletePage');
  const btnPrev = document.getElementById('prevPage');
  const btnNext = document.getElementById('nextPage');
  const btnQuickGuide = document.getElementById('quickGuide');
  const guideModal = document.getElementById('guideModal');
  const closeGuide = document.getElementById('closeGuide');

  // Inspector inputs
  const propX = document.getElementById('propX');
  const propY = document.getElementById('propY');
  const propW = document.getElementById('propW');
  const propH = document.getElementById('propH');
  const propText = document.getElementById('propText');
  const propFontSize = document.getElementById('propFontSize');
  const propColor = document.getElementById('propColor');
  const propAlign = document.getElementById('propAlign');
  const propFill = document.getElementById('propFill');
  const propStroke = document.getElementById('propStroke');
  const propStrokeW = document.getElementById('propStrokeW');
  const propRadius = document.getElementById('propRadius');
  const replaceImage = document.getElementById('replaceImage');
  const pageBg = document.getElementById('pageBg');
  const pageSize = document.getElementById('pageSize');

  const textProps = document.getElementById('textProps');
  const shapeProps = document.getElementById('shapeProps');
  const imageProps = document.getElementById('imageProps');
  const cornerRadiusWrap = document.getElementById('cornerRadiusWrap');

  const bringFront = document.getElementById('bringFront');
  const sendBack = document.getElementById('sendBack');
  const deleteEl = document.getElementById('deleteEl');

  // Helpers
  function createPage(){
    return { bg:'#FFFFFF', size:'A4', elements:[] };
  }
  function updatePageSize(page, el){
    const size = page.size;
    let w=794, h=1123; // A4 default (approx 96 dpi)
    if(size === 'Square'){ w = 1080; h = 1080; }
    if(size === 'Instagram'){ w = 1080; h = 1350; }
    if(size === 'Letter'){ w = 816; h = 1056; }
    el.style.width = w+'px';
    el.style.height = h+'px';
  }
  function ensurePage(){
    if(state.pages.length === 0){
      state.pages.push(createPage());
      state.current = 0;
    }
  }
  function render(){
    ensurePage();
    // Clear canvas
    canvas.innerHTML = '';
    const page = state.pages[state.current];
    const pageEl = document.createElement('div');
    pageEl.className = 'page';
    pageEl.style.background = page.bg;
    updatePageSize(page, canvas);
    canvas.appendChild(pageEl);

    // Render elements
    page.elements.forEach((el, idx)=>{
      const node = document.createElement('div');
      node.className = `el ${el.type}` + (el.shape ? ' '+el.shape : '');
      node.style.left = (el.x||0)+'px';
      node.style.top = (el.y||0)+'px';
      node.style.width = (el.w||100)+'px';
      node.style.height = (el.h||50)+'px';
      node.dataset.index = idx;

      if(el.type === 'text'){
        node.style.color = el.color || '#111827';
        node.style.fontSize = (el.fs||24)+'px';
        node.style.textAlign = el.align || 'left';
        const wrap = document.createElement('div');
        wrap.textContent = el.text || 'Testo';
        node.appendChild(wrap);
      }

      if(el.type === 'shape'){
        node.style.background = el.fill || '#FFD166';
        node.style.borderColor = el.stroke || '#111827';
        node.style.borderWidth = (el.sw||2)+'px';
        node.style.borderStyle = 'solid';
        if(el.shape === 'rect'){
          node.style.borderRadius = (el.radius||12)+'px';
        } else if(el.shape === 'circle'){
          node.style.borderRadius = '9999px';
        }
      }

      if(el.type === 'image'){
        const img = document.createElement('img');
        img.src = el.src;
        node.appendChild(img);
      }

      // selection handles
      addHandles(node);
      // events
      enableDraggable(node);

      pageEl.appendChild(node);
    });

    // Thumbnails
    thumbnails.innerHTML = '';
    state.pages.forEach((p, i)=>{
      const th = document.createElement('div');
      th.className = 'thumbnail'+(i===state.current?' active':'');
      th.role = 'listitem';
      const num = document.createElement('div');
      num.className = 'num';
      num.textContent = i+1;
      const c = document.createElement('canvas');
      c.width = 160; c.height = 220; // aspect preview
      const ctx = c.getContext('2d');
      // bg
      ctx.fillStyle = p.bg || '#fff';
      ctx.fillRect(0,0,c.width,c.height);
      // simple render of elements
      p.elements.forEach(e=>{
        ctx.save();
        if(e.type==='shape'){
          ctx.fillStyle = e.fill||'#FFD166';
          ctx.strokeStyle = e.stroke||'#111827';
          ctx.lineWidth = 1;
          const rx = e.x*(c.width/794);
          const ry = e.y*(c.height/1123);
          const rw = e.w*(c.width/794);
          const rh = e.h*(c.height/1123);
          if(e.shape==='circle'){
            ctx.beginPath();
            ctx.ellipse(rx+rw/2, ry+rh/2, rw/2, rh/2, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(rx,ry,rw,rh);
            ctx.strokeRect(rx,ry,rw,rh);
          }
        }
        if(e.type==='text'){
          ctx.fillStyle = e.color||'#111827';
          ctx.font = 'bold 12px system-ui';
          const rx = e.x*(c.width/794);
          const ry = e.y*(c.height/1123);
          ctx.fillText((e.text||'Testo').slice(0,12), rx+4, ry+14);
        }
        if(e.type==='image'){
          // skip heavy preview; draw placeholder
          ctx.fillStyle = '#e5e7eb';
          const rx = e.x*(c.width/794);
          const ry = e.y*(c.height/1123);
          const rw = e.w*(c.width/794);
          const rh = e.h*(c.height/1123);
          ctx.fillRect(rx,ry,rw,rh);
          ctx.strokeStyle = '#9ca3af';
          ctx.strokeRect(rx,ry,rw,rh);
        }
        ctx.restore();
      });
      th.appendChild(num);
      th.appendChild(c);
      th.addEventListener('click', ()=>{ state.current = i; state.selection=null; render(); });
      thumbnails.appendChild(th);
    });

    pageLabel.textContent = `Pag. ${state.current+1}/${state.pages.length}`;
    updateInspector();
  }

  function addHandles(node){
    ['tl','tr','bl','br'].forEach(p=>{
      const h = document.createElement('div');
      h.className = 'handle '+p;
      node.appendChild(h);
    });
  }

  function select(node){
    [...document.querySelectorAll('.el')].forEach(n=>n.classList.remove('selected'));
    node.classList.add('selected');
    const idx = parseInt(node.dataset.index,10);
    state.selection = { pageIndex: state.current, elIndex: idx };
    updateInspector();
  }

  function deselect(){
    [...document.querySelectorAll('.el')].forEach(n=>n.classList.remove('selected'));
    state.selection = null;
    updateInspector();
  }

  function enableDraggable(node){
    let startX=0, startY=0, startLeft=0, startTop=0, resizing=false, resizeCorner=null, startW=0, startH=0;

    node.addEventListener('mousedown', (e)=>{
      if(e.target.classList.contains('handle')){
        resizing = true;
        resizeCorner = [...e.target.classList].includes('br')?'br':
                       [...e.target.classList].includes('tl')?'tl':
                       [...e.target.classList].includes('tr')?'tr':'bl';
      } else {
        resizing = false;
      }
      select(node);
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseFloat(node.style.left)||0;
      startTop = parseFloat(node.style.top)||0;
      startW = parseFloat(node.style.width)||100;
      startH = parseFloat(node.style.height)||50;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    function onMove(e){
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if(resizing){
        let w = startW, h = startH, l = startLeft, t = startTop;
        if(resizeCorner==='br'){ w = startW + dx; h = startH + dy; }
        if(resizeCorner==='tl'){ w = startW - dx; h = startH - dy; l = startLeft + dx; t = startTop + dy; }
        if(resizeCorner==='tr'){ w = startW + dx; h = startH - dy; t = startTop + dy; }
        if(resizeCorner==='bl'){ w = startW - dx; h = startH + dy; l = startLeft + dx; }
        node.style.width = Math.max(20,w)+'px';
        node.style.height = Math.max(20,h)+'px';
        node.style.left = l+'px';
        node.style.top = t+'px';
      } else {
        node.style.left = (startLeft + dx)+'px';
        node.style.top = (startTop + dy)+'px';
      }
      syncNodeToState(node);
    }
    function onUp(){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
  }

  function syncNodeToState(node){
    const sel = state.selection;
    if(!sel) return;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    el.x = parseFloat(node.style.left)||0;
    el.y = parseFloat(node.style.top)||0;
    el.w = parseFloat(node.style.width)||0;
    el.h = parseFloat(node.style.height)||0;
    updateInspectorInputs(el);
    renderThumbnailsOnly();
  }

  function renderThumbnailsOnly(){
    // simple refresh to reflect sizes/positions
    state.pages[state.current] = state.pages[state.current]; // no-op; just to be explicit
    const children = [...thumbnails.children];
    const t = children[state.current];
    if(!t) return;
    // full rebuild thumbnails for simplicity
    render();
  }

  // Inspector update
  function updateInspector(){
    const sel = state.selection;
    if(!sel){
      noSelection.hidden = false;
      propsBox.hidden = true;
      return;
    }
    noSelection.hidden = true;
    propsBox.hidden = false;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    updateInspectorInputs(el);
    // Toggle prop groups
    textProps.hidden = el.type!=='text';
    shapeProps.hidden = el.type!=='shape';
    imageProps.hidden = el.type!=='image';
    cornerRadiusWrap.style.display = (el.type==='shape' && el.shape==='rect') ? 'flex' : 'none';
  }

  function updateInspectorInputs(el){
    propX.value = Math.round(el.x||0);
    propY.value = Math.round(el.y||0);
    propW.value = Math.round(el.w||100);
    propH.value = Math.round(el.h||50);
    if(el.type==='text'){
      propText.value = el.text||'';
      propFontSize.value = el.fs||24;
      propColor.value = el.color||'#111827';
      propAlign.value = el.align||'left';
    }
    if(el.type==='shape'){
      propFill.value = el.fill||'#FFD166';
      propStroke.value = el.stroke||'#111827';
      propStrokeW.value = el.sw||2;
      propRadius.value = el.radius||12;
    }
  }

  // Bind inspector inputs
  [propX,propY,propW,propH].forEach(inp=>{
    inp.addEventListener('input', ()=>{
      const sel = state.selection; if(!sel) return;
      const el = state.pages[sel.pageIndex].elements[sel.elIndex];
      el.x = parseFloat(propX.value)||0;
      el.y = parseFloat(propY.value)||0;
      el.w = parseFloat(propW.value)||0;
      el.h = parseFloat(propH.value)||0;
      render();
    });
  });
  propText.addEventListener('input', ()=>{
    const sel = state.selection; if(!sel) return;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    el.text = propText.value;
    render();
  });
  propFontSize.addEventListener('input', ()=>{
    const sel = state.selection; if(!sel) return;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    el.fs = parseFloat(propFontSize.value)||24;
    render();
  });
  propColor.addEventListener('input', ()=>{
    const sel = state.selection; if(!sel) return;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    el.color = propColor.value;
    render();
  });
  propAlign.addEventListener('input', ()=>{
    const sel = state.selection; if(!sel) return;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    el.align = propAlign.value;
    render();
  });
  propFill.addEventListener('input', ()=>{
    const sel = state.selection; if(!sel) return;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    el.fill = propFill.value;
    render();
  });
  propStroke.addEventListener('input', ()=>{
    const sel = state.selection; if(!sel) return;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    el.stroke = propStroke.value;
    render();
  });
  propStrokeW.addEventListener('input', ()=>{
    const sel = state.selection; if(!sel) return;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    el.sw = parseFloat(propStrokeW.value)||2;
    render();
  });
  propRadius.addEventListener('input', ()=>{
    const sel = state.selection; if(!sel) return;
    const el = state.pages[sel.pageIndex].elements[sel.elIndex];
    el.radius = parseFloat(propRadius.value)||12;
    render();
  });

  pageBg.addEventListener('input', ()=>{
    const p = state.pages[state.current];
    p.bg = pageBg.value;
    render();
  });
  pageSize.addEventListener('input', ()=>{
    const p = state.pages[state.current];
    p.size = pageSize.value;
    render();
  });

  bringFront.addEventListener('click', ()=>{
    const sel = state.selection; if(!sel) return;
    const arr = state.pages[sel.pageIndex].elements;
    const [el] = arr.splice(sel.elIndex,1);
    arr.push(el);
    state.selection.elIndex = arr.length-1;
    render();
  });
  sendBack.addEventListener('click', ()=>{
    const sel = state.selection; if(!sel) return;
    const arr = state.pages[sel.pageIndex].elements;
    const [el] = arr.splice(sel.elIndex,1);
    arr.unshift(el);
    state.selection.elIndex = 0;
    render();
  });
  deleteEl.addEventListener('click', ()=>{
    const sel = state.selection; if(!sel) return;
    const arr = state.pages[sel.pageIndex].elements;
    arr.splice(sel.elIndex,1);
    state.selection=null;
    render();
  });

  // Toolbar actions
  btnNew.addEventListener('click', ()=>{
    if(confirm('Sicura? Questo azzera il progetto corrente.')){
      state.pages = [createPage()];
      state.current = 0;
      state.selection = null;
      render();
    }
  });
  btnOpen.addEventListener('click', ()=> fileOpen.click());
  fileOpen.addEventListener('change', (e)=>{
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        if(Array.isArray(data.pages)){
          state.pages = data.pages;
          state.current = 0;
          state.selection = null;
          render();
        } else { alert('File non valido.'); }
      }catch(err){ alert('Errore apertura file: '+err.message); }
    };
    reader.readAsText(f);
  });

  btnSave.addEventListener('click', ()=>{
    const data = { pages: state.pages, meta:{ app:'LibroIllustrato', v:1 } };
    const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'progetto.ilp';
    a.click();
    URL.revokeObjectURL(url);
  });

  btnExportPDF.addEventListener('click', ()=>{
    // Open print-friendly window
    const w = window.open('', '_blank');
    const doc = w.document;
    doc.write(`<!DOCTYPE html><html><head><title>Esporta PDF</title>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 12mm; }
        *{box-sizing:border-box}
        body{margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Arial, sans-serif;}
        .page{page-break-after: always; width: 210mm; height: 297mm; position: relative; overflow:hidden; border:0}
        .el{position:absolute}
        .text{white-space:pre-wrap}
        .rect{border-style:solid}
        .circle{border-radius:9999px; border-style:solid}
        img{display:block; width:100%; height:100%; object-fit:cover}
      </style>
    </head><body>`);
    state.pages.forEach(p=>{
      // Convert from canvas px (A4 approx 794x1123) to mm scale
      const scaleX = 210 / 794;
      const scaleY = 297 / 1123;
      doc.write(`<div class="page" style="background:${p.bg}">`);
      p.elements.forEach(el=>{
        const left = (el.x||0) * scaleX;
        const top = (el.y||0) * scaleY;
        const wpx = (el.w||100) * scaleX;
        const hpx = (el.h||50) * scaleY;
        if(el.type==='text'){
          doc.write(`<div class="el text" style="left:${left}mm; top:${top}mm; width:${wpx}mm; height:${hpx}mm; color:${el.color||'#111'}; font-size:${(el.fs||24)*scaleX*0.75}mm; text-align:${el.align||'left'}">${(el.text||'')}</div>`);
        }
        if(el.type==='shape'){
          const radius = el.shape==='rect' ? `border-radius:${(el.radius||12)*scaleX}mm;` : '';
          const circle = el.shape==='circle' ? 'border-radius:9999px;' : '';
          doc.write(`<div class="el ${el.shape}" style="left:${left}mm; top:${top}mm; width:${wpx}mm; height:${hpx}mm; background:${el.fill||'#FFD166'}; border-color:${el.stroke||'#111'}; border-width:${(el.sw||2)*scaleX}mm; ${radius}${circle}"></div>`);
        }
        if(el.type==='image'){
          const src = el.src;
          doc.write(`<div class="el" style="left:${left}mm; top:${top}mm; width:${wpx}mm; height:${hpx}mm;"><img src="${src}"/></div>`);
        }
      });
      doc.write(`</div>`);
    });
    doc.write(`</body></html>`);
    doc.close();
    w.focus();
    w.print();
  });

  btnAddText.addEventListener('click', ()=>{
    const p = state.pages[state.current];
    p.elements.push({ type:'text', x:40, y:40, w:300, h:80, fs:28, color:'#111827', align:'left', text:'Scrivi qui...' });
    state.selection = { pageIndex: state.current, elIndex: p.elements.length-1 };
    render();
  });

  btnAddImage.addEventListener('click', ()=> fileImage.click());
  fileImage.addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      const p = state.pages[state.current];
      p.elements.push({ type:'image', x:80, y:80, w:300, h:200, src: reader.result });
      state.selection = { pageIndex: state.current, elIndex: p.elements.length-1 };
      render();
    };
    reader.readAsDataURL(f);
  });
  replaceImage.addEventListener('click', ()=>{
    if(!state.selection) return;
    const sel = state.selection;
    fileImage.onchange = (e)=>{
      const f = e.target.files[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        const el = state.pages[sel.pageIndex].elements[sel.elIndex];
        el.src = reader.result;
        render();
        fileImage.onchange = null; // reset
      };
      reader.readAsDataURL(f);
    };
    fileImage.click();
  });

  document.querySelectorAll('.shape').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const type = btn.dataset.shape;
      const p = state.pages[state.current];
      const base = { type:'shape', shape:type, x:120, y:120, w:180, h:120, fill:'#FFD166', stroke:'#111827', sw:2 };
      if(type==='rect'){ base.radius = 12; }
      p.elements.push(base);
      state.selection = { pageIndex: state.current, elIndex: p.elements.length-1 };
      render();
    });
  });

  btnAddPage.addEventListener('click', ()=>{
    state.pages.push(createPage());
    state.current = state.pages.length-1;
    state.selection = null;
    render();
  });
  btnDuplicatePage.addEventListener('click', ()=>{
    const p = state.pages[state.current];
    const copy = JSON.parse(JSON.stringify(p));
    state.pages.splice(state.current+1,0,copy);
    state.current = state.current+1;
    state.selection = null;
    render();
  });
  btnDeletePage.addEventListener('click', ()=>{
    if(state.pages.length<=1){ alert('Deve esserci almeno una pagina.'); return; }
    if(confirm('Eliminare questa pagina?')){
      state.pages.splice(state.current,1);
      state.current = Math.max(0, state.current-1);
      state.selection = null;
      render();
    }
  });
  btnPrev.addEventListener('click', ()=>{
    state.current = Math.max(0, state.current-1);
    state.selection = null;
    render();
  });
  btnNext.addEventListener('click', ()=>{
    state.current = Math.min(state.pages.length-1, state.current+1);
    state.selection = null;
    render();
  });

  btnQuickGuide.addEventListener('click', ()=>{
    guideModal.hidden = false;
  });
  closeGuide.addEventListener('click', ()=> guideModal.hidden = true);
  guideModal.addEventListener('click', (e)=>{ if(e.target===guideModal) guideModal.hidden = true; });

  // Click selection logic
  canvas.addEventListener('mousedown', (e)=>{
    if(e.target.classList.contains('page') || e.target===canvas){
      deselect();
    } else {
      const el = e.target.closest('.el');
      if(el) select(el);
    }
  });

  // Init
  ensurePage();
  render();
})();