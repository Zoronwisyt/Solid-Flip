/* ============================================
   WIPE LAYER GENERATOR — APPLICATION LOGIC
   Alight Motion XML Export · Full-Screen Wipe Masking
   ============================================ */

(() => {
  'use strict';

  // ---- State ----
  const state = {
    baseWidth: 1080,
    baseHeight: 1350,
    projectWidth: 1080,
    projectHeight: 1350,
    solidWidth: 1080,
    solidHeight: 1350,
    layerCount: 5,
    splitDirection: 'horizontal',
    solidColor: '#64E4DC',
    wipeAngle: 0,
    wipeSoftness: 0,
    aspectLocked: true,
  };

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const canvas = $('#previewCanvas');
  const ctx = canvas.getContext('2d');

  // Controls
  const layerCountInput = $('#layerCount');
  const layerMinusBtn = $('#layerMinus');
  const layerPlusBtn = $('#layerPlus');
  const splitDirectionGroup = $('#splitDirection');
  const projectScaleSelect = $('#projectScale');
  const solidWidthInput = $('#solidWidth');
  const solidHeightInput = $('#solidHeight');
  const aspectLinkBtn = $('#aspectLinkBtn');
  const aspectHint = $('#aspectHint');
  const solidColorInput = $('#solidColor');
  const colorValueSpan = $('#colorValue');
  const wipeAngleInput = $('#wipeAngle');
  const wipeAngleValue = $('#wipeAngleValue');
  const wipeSoftnessInput = $('#wipeSoftness');
  const wipeSoftnessValue = $('#wipeSoftnessValue');

  // Display
  const wipeXDisplay = $('#wipeXDisplay');
  const wipeYDisplay = $('#wipeYDisplay');
  const previewDimensions = $('#previewDimensions');
  const crosshairLabel = $('#crosshairLabel');
  const formulaContent = $('#formulaContent');
  const xmlCode = $('#xmlCode');

  // Buttons
  const copyXmlBtn = $('#copyXmlBtn');
  const downloadXmlBtn = $('#downloadXmlBtn');

  // Toast
  const toast = $('#toast');
  const toastMessage = $('#toastMessage');

  // ---- Utility Functions ----
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function getLayerColor(index, total) {
    const { r, g, b } = hexToRgb(state.solidColor);
    const { h, s, l } = rgbToHsl(r, g, b);
    const range = Math.min(20, 40 / total);
    const offset = (index / Math.max(1, total - 1) - 0.5) * range;
    const newL = Math.max(10, Math.min(90, l + offset));
    return `hsl(${h}, ${s}%, ${newL}%)`;
  }

  function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ---- Layer Calculation ----
  function calculateLayers() {
    const layers = [];
    const n = state.layerCount;

    for (let i = 0; i < n; i++) {
      const startVal = i / n;
      const endVal = (i + 1) / n;

      layers.push({
        index: i + 1,
        locX: state.projectWidth / 2,
        locY: state.projectHeight / 2,
        width: state.solidWidth,
        height: state.solidHeight,
        wipeStart: startVal,
        wipeEnd: endVal
      });
    }
    return layers;
  }

  // ---- Canvas Rendering ----
  function renderPreview() {
    const container = $('#canvasContainer');
    const maxW = container.clientWidth - 48;
    const maxH = container.clientHeight - 48;

    const ratio = state.projectWidth / state.projectHeight;
    let drawW, drawH;
    if (maxW / maxH > ratio) {
      drawH = Math.min(maxH, 500);
      drawW = drawH * ratio;
    } else {
      drawW = Math.min(maxW, 400);
      drawH = drawW / ratio;
    }

    canvas.style.width = drawW + 'px';
    canvas.style.height = drawH + 'px';

    const dpr = window.devicePixelRatio || 1;
    canvas.width = drawW * dpr;
    canvas.height = drawH * dpr;
    ctx.scale(dpr, dpr);

    const scaleF = drawW / state.projectWidth;
    const layers = calculateLayers();

    // Clear
    ctx.clearRect(0, 0, drawW, drawH);

    // Draw each layer as a sliced rect based on wipe start/end
    layers.forEach((layer, idx) => {
      ctx.save();

      const solidW = layer.width * scaleF;
      const solidH = layer.height * scaleF;
      const solidLeft = (layer.locX * scaleF) - (solidW / 2);
      const solidTop = (layer.locY * scaleF) - (solidH / 2);

      let lx, ly, lw, lh;

      if (state.splitDirection === 'horizontal') {
        lx = solidLeft;
        lw = solidW;
        ly = solidTop + layer.wipeStart * solidH;
        lh = (layer.wipeEnd - layer.wipeStart) * solidH;
      } else {
        lx = solidLeft + layer.wipeStart * solidW;
        lw = (layer.wipeEnd - layer.wipeStart) * solidW;
        ly = solidTop;
        lh = solidH;
      }

      // Clip to mask
      ctx.beginPath();
      ctx.rect(lx, ly, lw, lh);
      ctx.clip();

      // Draw full layer fill
      ctx.fillStyle = getLayerColor(idx, layers.length);
      ctx.fillRect(solidLeft, solidTop, solidW, solidH);

      // Layer label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = `${Math.max(9, 12 * scaleF * 3)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`C${layer.index}`, lx + lw / 2, ly + lh / 2);

      ctx.restore();
    });

    // Draw grid lines between layers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    layers.forEach((layer, idx) => {
      if (idx === 0) return;
      const solidW = layer.width * scaleF;
      const solidH = layer.height * scaleF;
      const solidLeft = (layer.locX * scaleF) - (solidW / 2);
      const solidTop = (layer.locY * scaleF) - (solidH / 2);

      ctx.beginPath();
      if (state.splitDirection === 'horizontal') {
        const y = solidTop + layer.wipeStart * solidH;
        ctx.moveTo(solidLeft, y);
        ctx.lineTo(solidLeft + solidW, y);
      } else {
        const x = solidLeft + layer.wipeStart * solidW;
        ctx.moveTo(x, solidTop);
        ctx.lineTo(x, solidTop + solidH);
      }
      ctx.stroke();
    });

    ctx.setLineDash([]);

    // Draw central crosshair (Location of all layers)
    const cx = (state.projectWidth / 2) * scaleF;
    const cy = (state.projectHeight / 2) * scaleF;
    const crossSize = 12;

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(cx - crossSize, cy);
    ctx.lineTo(cx + crossSize, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - crossSize);
    ctx.lineTo(cx, cy + crossSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Draw border for canvas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, drawW - 1, drawH - 1);
  }

  // ---- Update Functions ----
  function updateProjectSize() {
    const scale = parseFloat(projectScaleSelect.value) || 1;
    state.projectWidth = state.baseWidth * scale;
    state.projectHeight = state.baseHeight * scale;

    previewDimensions.textContent = `${state.projectWidth} × ${state.projectHeight}`;
    wipeXDisplay.textContent = state.projectWidth / 2;
    wipeYDisplay.textContent = state.projectHeight / 2;
    crosshairLabel.textContent = `Center: ${state.projectWidth / 2}, ${state.projectHeight / 2}`;
  }

  function updateFormulas() {
    const n = state.layerCount;
    let html = '';

    html += `<div class="formula-line"><span class="formula-label">Project</span><span class="formula-expr">${state.projectWidth} × ${state.projectHeight}</span></div>`;
    html += `<div class="formula-line"><span class="formula-label">Solid</span><span class="formula-expr">${state.solidWidth} × ${state.solidHeight}</span></div>`;
    html += `<div class="formula-line"><span class="formula-label">Location</span><span class="formula-expr">${state.projectWidth / 2}, ${state.projectHeight / 2}</span></div>`;
    html += `<div class="formula-line" style="margin-top:6px;"><span class="formula-label">Wipe Start</span><span class="formula-expr">i / ${n}</span></div>`;
    html += `<div class="formula-line"><span class="formula-label">Wipe End</span><span class="formula-expr">(i + 1) / ${n}</span></div>`;

    formulaContent.innerHTML = html;
  }

  function updateLayerTable() {
    const layers = calculateLayers();
    let html = '';

    layers.forEach((layer) => {
      html += `<tr>
        <td class="layer-index">${layer.index}</td>
        <td>${layer.locX}</td>
        <td>${layer.locY}</td>
        <td>${layer.width}×${layer.height}</td>
        <td>${layer.wipeStart.toFixed(4)}</td>
        <td>${layer.wipeEnd.toFixed(4)}</td>
      </tr>`;
    });

    const tbody = $('#layerTableBody');
    if (tbody) tbody.innerHTML = html;
  }

  // ---- Alight Motion XML Generation ----
  function generateAlightMotionXML() {
    const layers = calculateLayers();
    const t = '  '; // indent
    const totalTime = 3999;
    const fps = 30;

    let hexColor = state.solidColor.toUpperCase();
    if (hexColor.startsWith('#')) hexColor = hexColor.substring(1);
    const amColor = `#FF${hexColor}`;

    let xml = `<?xml version='1.0' encoding='UTF-8' ?>\n`;
    xml += `<!--\n`;
    xml += `Created by ALIGHT MOTION XMLS Rectangle Wipe Generator\n`;
    xml += `Exported: ${new Date().toLocaleString()}\n`;
    xml += `-->\n`;

    xml += `<scene title="Wipe Layers ${state.layerCount}x" width="${state.projectWidth}" height="${state.projectHeight}" exportWidth="${state.projectWidth}" exportHeight="${state.projectHeight}" bgcolor="#FF000000" totalTime="${totalTime}" fps="${fps}" modifiedTime="${Date.now()}" amver="859" ffver="107" am="com.alightcreative.motion/6.2.53" amplatform="ios" precompose="dynamicResolution" retime="freeze">\n`;

    xml += `${t}<bookmark t="0"/>\n`;
    xml += `${t}<bookmark t="5000"/>\n`;

    const effAngle = state.splitDirection === 'horizontal' ? 0 : 90;

    // Generate layers in reverse so layer 1 is at the bottom (matching AM export order)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const layerLabel = i === 0 ? "Rectangle 1" : `Rectangle 1 Copy${i > 1 ? ' ' + i : ''}`;

      xml += `${t}<shape id="${layer.index}" label="${layerLabel}" startTime="0" endTime="${totalTime}" fillType="color" s=".rect">\n`;

      xml += `${t}${t}<transform>\n`;
      xml += `${t}${t}${t}<location value="${layer.locX.toFixed(6)},${layer.locY.toFixed(6)},0.000000"/>\n`;
      xml += `${t}${t}${t}<scale value="1.000000,1.000000"/>\n`;
      xml += `${t}${t}</transform>\n`;

      xml += `${t}${t}<fillColor value="${amColor}"/>\n`;

      xml += `${t}${t}<effect id="com.alightcreative.effects.wipe2" locallyApplied="true">\n`;

      // Omit end if 1.0, omit start if 0.0 (matching AM behavior)
      if (layer.wipeEnd < 1.0) {
        xml += `${t}${t}${t}<property name="end" type="float" value="${layer.wipeEnd.toFixed(6)}"/>\n`;
      }
      if (layer.wipeStart > 0.0) {
        xml += `${t}${t}${t}<property name="start" type="float" value="${layer.wipeStart.toFixed(6)}"/>\n`;
      }
      if (effAngle !== 0) {
        xml += `${t}${t}${t}<property name="angle" type="float" value="${effAngle.toFixed(6)}"/>\n`;
      }

      xml += `${t}${t}</effect>\n`;

      // AM interprets 'size' on vector shapes as half-extents (radius from center)
      xml += `${t}${t}<property name="size" type="vec2" value="${(layer.width / 2).toFixed(6)},${(layer.height / 2).toFixed(6)}"/>\n`;

      xml += `${t}</shape>\n`;
    }

    xml += `</scene>\n`;

    return xml;
  }

  function renderXML() {
    const raw = generateAlightMotionXML();
    const highlighted = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="xml-comment">$1</span>')
      .replace(/(&lt;\?.*?\?&gt;)/g, '<span class="xml-decl">$1</span>')
      .replace(/(&lt;\/?)(\w+)/g, '$1<span class="xml-tag">$2</span>')
      .replace(/([\w]+)(=)/g, '<span class="xml-attr">$1</span>$2')
      .replace(/(".*?")/g, '<span class="xml-val">$1</span>');

    xmlCode.innerHTML = highlighted;
  }

  // ---- Full Update ----
  function fullUpdate() {
    updateProjectSize();
    updateFormulas();
    updateLayerTable();
    renderXML();
    renderPreview();
  }

  // ---- Event Handlers ----

  // Layer count
  layerCountInput.addEventListener('input', () => {
    let val = parseInt(layerCountInput.value);
    if (isNaN(val) || val < 2) val = 2;
    if (val > 50) val = 50;
    state.layerCount = val;
    fullUpdate();
  });

  layerMinusBtn.addEventListener('click', () => {
    if (state.layerCount > 2) {
      state.layerCount--;
      layerCountInput.value = state.layerCount;
      fullUpdate();
    }
  });

  layerPlusBtn.addEventListener('click', () => {
    if (state.layerCount < 50) {
      state.layerCount++;
      layerCountInput.value = state.layerCount;
      fullUpdate();
    }
  });

  // Split direction
  splitDirectionGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    splitDirectionGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.splitDirection = btn.dataset.value;
    fullUpdate();
  });

  // Project size
  projectScaleSelect.addEventListener('change', () => {
    fullUpdate();
  });

  // Aspect ratio link/unlink
  aspectLinkBtn.addEventListener('click', () => {
    state.aspectLocked = !state.aspectLocked;
    aspectLinkBtn.classList.toggle('active', state.aspectLocked);

    if (state.aspectLocked) {
      // Re-linking: snap height to 4:5 ratio based on current width
      state.solidHeight = state.solidWidth * 5 / 4;
      solidHeightInput.value = state.solidHeight;
      aspectHint.textContent = 'Ratio locked at 4:5';
    } else {
      aspectHint.textContent = 'Ratio unlocked — free size';
    }
    fullUpdate();
  });

  // Solid width
  solidWidthInput.addEventListener('input', () => {
    const w = parseFloat(solidWidthInput.value);
    if (!isNaN(w) && w > 0) {
      state.solidWidth = w;
      if (state.aspectLocked) {
        state.solidHeight = w * 5 / 4;
        solidHeightInput.value = state.solidHeight;
      }
      fullUpdate();
    }
  });

  // Solid height
  solidHeightInput.addEventListener('input', () => {
    const h = parseFloat(solidHeightInput.value);
    if (!isNaN(h) && h > 0) {
      state.solidHeight = h;
      if (state.aspectLocked) {
        state.solidWidth = h * 4 / 5;
        solidWidthInput.value = state.solidWidth;
      }
      fullUpdate();
    }
  });

  // Solid color
  solidColorInput.addEventListener('input', () => {
    state.solidColor = solidColorInput.value;
    colorValueSpan.textContent = solidColorInput.value;
    fullUpdate();
  });

  // Wipe angle
  if (wipeAngleInput) {
    wipeAngleInput.addEventListener('input', () => {
      state.wipeAngle = parseInt(wipeAngleInput.value);
      wipeAngleValue.textContent = state.wipeAngle + '°';
      fullUpdate();
    });
  }

  // Wipe softness
  if (wipeSoftnessInput) {
    wipeSoftnessInput.addEventListener('input', () => {
      state.wipeSoftness = parseInt(wipeSoftnessInput.value);
      wipeSoftnessValue.textContent = state.wipeSoftness;
      fullUpdate();
    });
  }

  // Copy XML
  copyXmlBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(generateAlightMotionXML());
      showToast('Copied XML to clipboard!');
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = generateAlightMotionXML();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Copied XML to clipboard!');
    }
  });

  // Download XML
  downloadXmlBtn.addEventListener('click', () => {
    const xml = generateAlightMotionXML();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wipe-layers-${state.layerCount}x-${state.projectWidth}x${state.projectHeight}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded XML!');
  });

  // Window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => renderPreview(), 100);
  });

  // ---- Initialize ----
  fullUpdate();
})();
