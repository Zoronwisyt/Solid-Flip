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
    projectDurationStr: '00:05:00',
    fps: 60,
    beat2Str: '00:02:00',
    beat3Str: '00:04:00',
    animOrder: 'topDown',
    flipEnabled: true,
    flipStartAngle: 0,
    flipEndAngle: 90,
    flipAxis: 0,
    flipPivotX: 0.5,
    flipPivotY: 0.5,
    flipEasing: '0.25, 0.10, 0.25, 1.00',
    isPlaying: false,
    currentTimeSec: 0,
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

  // Animation & Timing
  const projectDurationInput = $('#projectDuration');
  const projectFpsInput = $('#projectFps');
  const beat2Input = $('#beat2');
  const beat3Input = $('#beat3');
  const animOrderSelect = $('#animOrder');
  const flipToggleGroup = $('#flipToggle');
  const flipStartAngleInput = $('#flipStartAngle');
  const flipEndAngleInput = $('#flipEndAngle');
  const flipAxisInput = $('#flipAxis');
  const flipPivotXInput = $('#flipPivotX');
  const flipPivotYInput = $('#flipPivotY');
  
  const openGraphBtn = $('#openGraphBtn');
  const closeGraphBtn = $('#closeGraphBtn');
  const graphModal = $('#graphModal');

  // Display
  const wipeXDisplay = $('#wipeXDisplay');
  const wipeYDisplay = $('#wipeYDisplay');
  const previewDimensions = $('#previewDimensions');
  const crosshairLabel = $('#crosshairLabel');
  const formulaContent = $('#formulaContent');
  const xmlCode = $('#xmlCode');
  
  // Playback
  const playBtn = $('#playBtn');
  const playIcon = $('#playIcon');
  const playbackScrubber = $('#playbackScrubber');
  const playbackTimeDisplay = $('#playbackTimeDisplay');

  // Buttons
  const toggleXmlBtn = $('#toggleXmlBtn');
  const copyXmlBtn = $('#copyXmlBtn');
  const downloadXmlBtn = $('#downloadXmlBtn');
  const xmlCodeContainer = $('#xmlCodeContainer');

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

  function bezierY(t, x1, y1, x2, y2) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function sampleX(u) { return ((ax * u + bx) * u + cx) * u; }
    function sampleY(u) { return ((ay * u + by) * u + cy) * u; }
    function derivX(u) { return (3 * ax * u + 2 * bx) * u + cx; }
    let u = t;
    for (let i = 0; i < 8; i++) {
      const xErr = sampleX(u) - t;
      if (Math.abs(xErr) < 1e-6) break;
      const d = Math.abs(derivX(u)) < 1e-6 ? 1e-6 : derivX(u);
      u -= xErr / d;
    }
    return sampleY(Math.max(0, Math.min(1, u)));
  }

  function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function parseTimeToSeconds(timeStr) {
    // Format: MM:SS:FF where FF = frame number (0 to fps-1)
    const parts = timeStr.split(':');
    let m = 0, s = 0, f = 0;
    if (parts.length === 3) {
      m = parseInt(parts[0]) || 0;
      s = parseInt(parts[1]) || 0;
      f = parseInt(parts[2]) || 0;
    } else if (parts.length === 2) {
      s = parseInt(parts[0]) || 0;
      f = parseInt(parts[1]) || 0;
    } else {
      s = parseFloat(timeStr) || 0;
      return s;
    }
    return m * 60 + s + (f / state.fps);
  }

  // ---- Layer Calculation ----
  function calculateLayers() {
    const layers = [];
    const n = state.layerCount;

    const b1 = 0; // Hardcoded to 0 as requested
    const b2 = parseTimeToSeconds(state.beat2Str);
    const b3 = parseTimeToSeconds(state.beat3Str);

    for (let i = 0; i < n; i++) {
      const startVal = i / n;
      const endVal = (i + 1) / n;

      let orderIdx = (state.animOrder === 'bottomUp') ? (n - 1 - i) : i;
      let flipEnd = b2;
      if (n > 1) {
        flipEnd = b2 + (b3 - b2) * (orderIdx / (n - 1));
      }

      layers.push({
        index: i + 1,
        locX: state.projectWidth / 2,
        locY: state.projectHeight / 2,
        width: state.solidWidth,
        height: state.solidHeight,
        wipeStart: startVal,
        wipeEnd: endVal,
        flipStartT: b1,
        flipEndT: flipEnd
      });
    }
    return layers;
  }

  // ---- Canvas Rendering ----
  function renderPreview(timeSec = state.currentTimeSec) {
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

      let flipAngle = state.flipStartAngle;
      if (state.flipEnabled && timeSec > layer.flipStartT) {
        if (timeSec >= layer.flipEndT) {
          flipAngle = state.flipEndAngle;
        } else {
          const progress = (timeSec - layer.flipStartT) / (layer.flipEndT - layer.flipStartT);
          const [x1, y1, x2, y2] = state.flipEasing.split(',').map(Number);
          const eased = bezierY(progress, x1, y1, x2, y2);
          flipAngle = state.flipStartAngle + (state.flipEndAngle - state.flipStartAngle) * eased;
        }
      }

      const solidW = layer.width * scaleF;
      const solidH = layer.height * scaleF;
      const solidLeft = (layer.locX * scaleF) - (solidW / 2);
      const solidTop = (layer.locY * scaleF) - (solidH / 2);

      // --- 3D FLIP EMULATION ---
      if (state.flipEnabled) {
        const px = solidLeft + (state.flipPivotX * solidW);
        const py = solidTop + (state.flipPivotY * solidH);
        
        ctx.translate(px, py);
        
        // In 2D, scaleX simulates a Y-axis flip (left/right). Axis 0 = left/right flip in Alight Motion.
        // So we rotate by the axis angle to align, scale X by cos(flipAngle), then rotate back.
        const axisRad = (state.flipAxis * Math.PI) / 180;
        ctx.rotate(-axisRad);
        
        const flipRad = (flipAngle * Math.PI) / 180;
        ctx.scale(Math.cos(flipRad), 1);
        
        ctx.rotate(axisRad);
        ctx.translate(-px, -py);
      }

      let lx, ly, lw, lh;

      if (state.splitDirection === 'vertical') {
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
      if (state.splitDirection === 'vertical') {
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
    const totalTimeMs = Math.round(parseTimeToSeconds(state.projectDurationStr) * 1000);
    const fps = state.fps;

    let hexColor = state.solidColor.toUpperCase();
    if (hexColor.startsWith('#')) hexColor = hexColor.substring(1);
    const amColor = `#FF${hexColor}`;

    let xml = `<?xml version='1.0' encoding='UTF-8' ?>\n`;
    xml += `<!--\n`;
    xml += `Created by ALIGHT MOTION XMLS Rectangle Wipe Generator\n`;
    xml += `Exported: ${new Date().toLocaleString()}\n`;
    xml += `-->\n`;

    xml += `<scene title="Wipe Layers ${state.layerCount}x" width="${state.projectWidth}" height="${state.projectHeight}" exportWidth="${state.projectWidth}" exportHeight="${state.projectHeight}" bgcolor="#FF000000" totalTime="${totalTimeMs}" fps="${fps}" modifiedTime="${Date.now()}" amver="859" ffver="107" am="com.alightcreative.motion/6.2.53" amplatform="ios" precompose="dynamicResolution" retime="freeze">\n`;

    xml += `${t}<bookmark t="0"/>\n`;
    xml += `${t}<bookmark t="5000"/>\n`;

    const effAngle = state.splitDirection === 'vertical' ? 0 : 90;

    // Generate layers in reverse so layer 1 is at the bottom (matching AM export order)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const layerLabel = i === 0 ? "Rectangle 1" : `Rectangle 1 Copy${i > 1 ? ' ' + i : ''}`;

      xml += `${t}<shape id="${layer.index}" label="${layerLabel}" startTime="0" endTime="${totalTimeMs}" fillType="color" s=".rect">\n`;

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

      if (state.flipEnabled) {
        // AM keyframes use a normalized time (0.0 to 1.0) relative to the layer's duration
        const projDurationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
        const normStart = layer.flipStartT / projDurationSec;
        const normEnd = layer.flipEndT / projDurationSec;

        // Flip Layer Effect
        xml += `${t}${t}<effect id="com.alightcreative.effects.flip3" locallyApplied="true">\n`;
        xml += `${t}${t}${t}<property name="axis" type="float" value="${state.flipAxis.toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}<property name="pivot" type="vec2" value="${state.flipPivotX.toFixed(6)},${state.flipPivotY.toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}<property name="angle" type="float">\n`;
        xml += `${t}${t}${t}${t}<kf t="${normStart.toFixed(6)}" v="${state.flipStartAngle.toFixed(6)}" />\n`;
        
        let easingStr = '';
        if (state.flipEasing) {
          const bezierParts = state.flipEasing.split(',').map(s => s.trim());
          easingStr = ` e="cubicBezier ${bezierParts.join(' ')}"`;
        }
        
        xml += `${t}${t}${t}${t}<kf t="${normEnd.toFixed(6)}" v="${state.flipEndAngle.toFixed(6)}"${easingStr} />\n`;
        xml += `${t}${t}${t}</property>\n`;
        xml += `${t}${t}</effect>\n`;
      }

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
    updateScrubberUI();
    renderXML();
    renderPreview();
  }

  // ---- Playback Loop ----
  let animFrameId = null;
  let lastTimeMs = 0;

  function togglePlay() {
    state.isPlaying = !state.isPlaying;
    if (state.isPlaying) {
      playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
      const durationSec = parseTimeToSeconds(state.projectDurationStr);
      if (state.currentTimeSec >= durationSec) state.currentTimeSec = 0;
      lastTimeMs = performance.now();
      animFrameId = requestAnimationFrame(playLoop);
    } else {
      playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      cancelAnimationFrame(animFrameId);
    }
  }

  function playLoop(now) {
    if (!state.isPlaying) return;
    const deltaMs = now - lastTimeMs;
    lastTimeMs = now;
    state.currentTimeSec += deltaMs / 1000;
    
    const durationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
    if (state.currentTimeSec >= durationSec) {
      state.currentTimeSec = durationSec;
      togglePlay();
    }
    
    updateScrubberUI();
    renderPreview(state.currentTimeSec);
    if (state.isPlaying) animFrameId = requestAnimationFrame(playLoop);
  }

  function updateScrubberUI() {
    const durationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
    playbackScrubber.max = durationSec;
    playbackScrubber.value = state.currentTimeSec;
    playbackTimeDisplay.textContent = state.currentTimeSec.toFixed(2) + 's';
  }

  playBtn.addEventListener('click', togglePlay);
  playbackScrubber.addEventListener('input', () => {
    state.currentTimeSec = parseFloat(playbackScrubber.value);
    updateScrubberUI();
    renderPreview(state.currentTimeSec);
  });

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

  // Animation & Timing
  projectDurationInput.addEventListener('input', () => {
    state.projectDurationStr = projectDurationInput.value;
    fullUpdate();
  });
  projectFpsInput.addEventListener('input', () => {
    state.fps = parseInt(projectFpsInput.value) || 60;
    fullUpdate();
  });
  beat2Input.addEventListener('input', () => {
    state.beat2Str = beat2Input.value;
    fullUpdate();
  });
  beat3Input.addEventListener('input', () => {
    state.beat3Str = beat3Input.value;
    fullUpdate();
  });
  animOrderSelect.addEventListener('change', () => {
    state.animOrder = animOrderSelect.value;
    fullUpdate();
  });
  flipToggleGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    flipToggleGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.flipEnabled = btn.dataset.value === 'on';
    fullUpdate();
  });
  flipStartAngleInput.addEventListener('input', () => {
    state.flipStartAngle = parseFloat(flipStartAngleInput.value) || 0;
    fullUpdate();
  });
  flipEndAngleInput.addEventListener('input', () => {
    state.flipEndAngle = parseFloat(flipEndAngleInput.value) || 0;
    fullUpdate();
  });
  flipAxisInput.addEventListener('input', () => {
    state.flipAxis = parseFloat(flipAxisInput.value) || 0;
    fullUpdate();
  });
  flipPivotXInput.addEventListener('input', () => {
    state.flipPivotX = parseFloat(flipPivotXInput.value) || 0;
    fullUpdate();
  });
  flipPivotYInput.addEventListener('input', () => {
    state.flipPivotY = parseFloat(flipPivotYInput.value) || 0;
    fullUpdate();
  });

  // Modal and Graph Message Listener
  openGraphBtn.addEventListener('click', () => {
    graphModal.style.display = 'flex';
  });
  
  closeGraphBtn.addEventListener('click', () => {
    graphModal.style.display = 'none';
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'BEZIER_UPDATE') {
      const { x1, y1, x2, y2 } = event.data;
      state.flipEasing = `${x1}, ${y1}, ${x2}, ${y2}`;
      fullUpdate();
    }
  });

  // Toggle XML Visibility
  let xmlVisible = false;
  toggleXmlBtn.addEventListener('click', () => {
    xmlVisible = !xmlVisible;
    xmlCodeContainer.style.display = xmlVisible ? 'block' : 'none';
    
    if (xmlVisible) {
      toggleXmlBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
      toggleXmlBtn.title = "Hide XML";
    } else {
      toggleXmlBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
      toggleXmlBtn.title = "Show XML";
    }
  });

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
