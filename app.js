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
    splitDirection: 'horizontal',
    solidColor: '#64E4DC',
    wipeAngle: 0,
    wipeSoftness: 0,
    aspectLocked: true,
    projectDurationStr: '00:05:00',
    fps: 60,
    beat1Str: '00:00:00',
    beat2Str: '00:02:00',
    beat3Str: '00:04:00',
    sectionCount: 1,
    sections: [
      { 
        subSectionCount: 1,
        subSections: [
          {
            layerCount: 5,
            splitDirection: 'global',
            customPivot: false,
            pivotX: 0.5,
            pivotY: 0.5,
            animOrder: 'topDown', 
            startAngle: 0, 
            endAngle: 90, 
            axis: 0, 
            customEasing: false, 
            easing: '0.25, 0.10, 0.25, 1.00',
            customTiming: false,
            beat1Str: '00:00:00',
            beat2Str: '00:02:00',
            beat3Str: '00:04:00'
          }
        ]
      }
    ],
    flipEnabled: true,
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
  const beat1Input = $('#beat1');
  const beat2Input = $('#beat2');
  const beat3Input = $('#beat3');
  const flipToggleGroup = $('#flipToggle');
  const flipPivotXInput = $('#flipPivotX');
  const flipPivotYInput = $('#flipPivotY');
  
  const sectionCountInput = $('#sectionCount');
  const sectionMinusBtn = $('#sectionMinus');
  const sectionPlusBtn = $('#sectionPlus');
  const sectionsContainer = $('#sectionsContainer');
  
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

  function getLayerColor(index, total, sectionIdx = 0, sCount = 1) {
    const { r, g, b } = hexToRgb(state.solidColor);
    const { h, s, l } = rgbToHsl(r, g, b);
    const range = Math.min(20, 40 / total);
    const offset = (index / Math.max(1, total - 1) - 0.5) * range;
    const newL = Math.max(10, Math.min(90, l + offset));
    
    let newH = h;
    if (sCount > 1) {
      newH = (h + (sectionIdx * (360 / sCount))) % 360;
    }
    
    return `hsl(${newH}, ${s}%, ${newL}%)`;
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
    const sCount = state.sectionCount;

    const globalB1 = parseTimeToSeconds(state.beat1Str);
    const globalB2 = parseTimeToSeconds(state.beat2Str);
    const globalB3 = parseTimeToSeconds(state.beat3Str);

    let globalLayerIndex = 0;

    for (let s = 0; s < sCount; s++) {
      const sec = state.sections[s];
      
      let secXStart = 0, secXEnd = 1, secYStart = 0, secYEnd = 1;
      if (state.splitDirection === 'horizontal') {
        secYStart = s / sCount;
        secYEnd = (s + 1) / sCount;
      } else {
        secXStart = s / sCount;
        secXEnd = (s + 1) / sCount;
      }

      const subCount = sec.subSections ? sec.subSections.length : 1;
      
      for (let sub = 0; sub < subCount; sub++) {
        const subSec = sec.subSections ? sec.subSections[sub] : sec;
        const subLayerCount = subSec.layerCount || 1;
        
        const subPivotX = subSec.customPivot ? (subSec.pivotX !== undefined ? subSec.pivotX : 0.5) : state.flipPivotX;
        const subPivotY = subSec.customPivot ? (subSec.pivotY !== undefined ? subSec.pivotY : 0.5) : state.flipPivotY;
        
        let subXStart = secXStart, subXEnd = secXEnd, subYStart = secYStart, subYEnd = secYEnd;
        
        if (state.splitDirection === 'horizontal') {
          const secYRange = secYEnd - secYStart;
          subYStart = secYStart + (sub / subCount) * secYRange;
          subYEnd = secYStart + ((sub + 1) / subCount) * secYRange;
        } else {
          const secXRange = secXEnd - secXStart;
          subXStart = secXStart + (sub / subCount) * secXRange;
          subXEnd = secXStart + ((sub + 1) / subCount) * secXRange;
        }

        const b1 = subSec.customTiming ? parseTimeToSeconds(subSec.beat1Str) : globalB1;
        const b2 = subSec.customTiming ? parseTimeToSeconds(subSec.beat2Str) : globalB2;
        const b3 = subSec.customTiming ? parseTimeToSeconds(subSec.beat3Str) : globalB3;

        const subDir = (subSec.splitDirection && subSec.splitDirection !== 'global') ? subSec.splitDirection : state.splitDirection;

        for (let l = 0; l < subLayerCount; l++) {
          let layerXStart = subXStart, layerXEnd = subXEnd, layerYStart = subYStart, layerYEnd = subYEnd;
          
          if (subDir === 'horizontal') {
            const subYRange = subYEnd - subYStart;
            layerYStart = subYStart + (l / subLayerCount) * subYRange;
            layerYEnd = subYStart + ((l + 1) / subLayerCount) * subYRange;
          } else {
            const subXRange = subXEnd - subXStart;
            layerXStart = subXStart + (l / subLayerCount) * subXRange;
            layerXEnd = subXStart + ((l + 1) / subLayerCount) * subXRange;
          }

          let localOrderIdx = l;
          if (subSec.animOrder === 'bottomUp') {
            localOrderIdx = subLayerCount - 1 - l;
          }

          let flipEnd = b2;
          if (subLayerCount > 1) {
            flipEnd = b2 + (b3 - b2) * (localOrderIdx / (subLayerCount - 1));
          }

          layers.push({
            index: globalLayerIndex + 1,
            locX: state.projectWidth / 2,
            locY: state.projectHeight / 2,
            width: state.solidWidth,
            height: state.solidHeight,
            wipeXStart: layerXStart,
            wipeXEnd: layerXEnd,
            wipeYStart: layerYStart,
            wipeYEnd: layerYEnd,
            flipStartT: b1,
            flipEndT: flipEnd,
            flipStartAngle: subSec.startAngle,
            flipEndAngle: subSec.endAngle,
            flipAxis: subSec.axis,
            pivotX: subPivotX,
            pivotY: subPivotY,
            sectionIdx: s,
            subSectionIdx: sub,
            flipEasing: subSec.customEasing ? subSec.easing : state.flipEasing
          });
          
          globalLayerIndex++;
        }
      }
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

      let flipAngle = layer.flipStartAngle;
      if (state.flipEnabled && timeSec > layer.flipStartT) {
        if (timeSec >= layer.flipEndT) {
          flipAngle = layer.flipEndAngle;
        } else {
          const progress = (timeSec - layer.flipStartT) / (layer.flipEndT - layer.flipStartT);
          const [x1, y1, x2, y2] = layer.flipEasing.split(',').map(Number);
          const eased = bezierY(progress, x1, y1, x2, y2);
          flipAngle = layer.flipStartAngle + (layer.flipEndAngle - layer.flipStartAngle) * eased;
        }
      }

      const solidW = layer.width * scaleF;
      const solidH = layer.height * scaleF;
      const solidLeft = (layer.locX * scaleF) - (solidW / 2);
      const solidTop = (layer.locY * scaleF) - (solidH / 2);

      // --- 3D FLIP EMULATION ---
      if (state.flipEnabled) {
        const px = solidLeft + (layer.pivotX * solidW);
        const py = solidTop + (layer.pivotY * solidH);
        
        ctx.translate(px, py);
        
        // In 2D, scaleX simulates a Y-axis flip (left/right). Axis 0 = left/right flip in Alight Motion.
        // So we rotate by the axis angle to align, scale X by cos(flipAngle), then rotate back.
        const axisRad = (layer.flipAxis * Math.PI) / 180;
        ctx.rotate(-axisRad);
        
        const flipRad = (flipAngle * Math.PI) / 180;
        ctx.scale(Math.cos(flipRad), 1);
        
        ctx.rotate(axisRad);
        ctx.translate(-px, -py);
      }

      const lx = solidLeft + layer.wipeXStart * solidW;
      const lw = (layer.wipeXEnd - layer.wipeXStart) * solidW;
      const ly = solidTop + layer.wipeYStart * solidH;
      const lh = (layer.wipeYEnd - layer.wipeYStart) * solidH;

      // Clip to mask
      ctx.beginPath();
      ctx.rect(lx, ly, lw, lh);
      ctx.clip();

      // Draw full layer fill
      ctx.fillStyle = getLayerColor(idx, layers.length, layer.sectionIdx, state.sectionCount);
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
      const solidW = layer.width * scaleF;
      const solidH = layer.height * scaleF;
      const solidLeft = (layer.locX * scaleF) - (solidW / 2);
      const solidTop = (layer.locY * scaleF) - (solidH / 2);

      const lx = solidLeft + layer.wipeXStart * solidW;
      const lw = (layer.wipeXEnd - layer.wipeXStart) * solidW;
      const ly = solidTop + layer.wipeYStart * solidH;
      const lh = (layer.wipeYEnd - layer.wipeYStart) * solidH;

      ctx.strokeRect(lx, ly, lw, lh);
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

  function renderSectionsUI() {
    const container = $('#sectionsContainer');
    let html = '';
    const sCount = state.sectionCount;

    for (let i = 0; i < sCount; i++) {
      const sec = state.sections[i];
      const subCount = sec.subSections ? sec.subSections.length : 1;
      
      html += `
        <div class="section-block" data-index="${i}">
          <div class="section-header">Section ${i + 1}</div>
          
          <div class="control-group">
            <label>Sub-sections</label>
            <div class="stepper-input">
              <button class="stepper-btn sec-sub-minus">−</button>
              <input type="number" class="sec-sub-count" min="1" max="10" value="${subCount}">
              <button class="stepper-btn sec-sub-plus">+</button>
            </div>
          </div>
          
          <div class="sub-sections-container" style="margin-top: 12px; padding-left: 12px; border-left: 2px solid var(--border-subtle);">
      `;

      for (let j = 0; j < subCount; j++) {
        const subSec = sec.subSections ? sec.subSections[j] : sec;
        
        html += `
          <div class="sub-section-block" data-sec-index="${i}" data-sub-index="${j}" style="margin-bottom: 16px;">
            <div class="section-header" style="font-size: 0.75rem; color: var(--text-secondary);">Sub-section ${j + 1}</div>
            
            <div class="control-group">
              <label>Custom Pivot</label>
              <div class="toggle-group sub-pivot-toggle">
                <button class="toggle-btn ${subSec.customPivot ? 'active' : ''}" data-value="on">On</button>
                <button class="toggle-btn ${!subSec.customPivot ? 'active' : ''}" data-value="off">Off</button>
              </div>
            </div>
            
            <div class="sub-pivot-container" style="display: ${subSec.customPivot ? 'block' : 'none'}; margin-top: 10px; padding-bottom: 10px;">
              <div class="control-group">
                <label>Sub-section Pivot</label>
                <div class="solid-size-row">
                  <div class="input-group" style="flex:1">
                    <input type="number" class="sub-pivot-x" value="${subSec.pivotX !== undefined ? subSec.pivotX : 0.5}" step="0.1" title="Pivot X">
                    <div class="input-suffix">PX</div>
                  </div>
                  <div class="input-group" style="flex:1">
                    <input type="number" class="sub-pivot-y" value="${subSec.pivotY !== undefined ? subSec.pivotY : 0.5}" step="0.1" title="Pivot Y">
                    <div class="input-suffix">PY</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="control-group">
              <label>Layers in Sub-section</label>
              <div class="stepper-input">
                <button class="stepper-btn sub-layer-minus">−</button>
                <input type="number" class="sub-layer-count" min="1" max="50" value="${subSec.layerCount || 5}">
                <button class="stepper-btn sub-layer-plus">+</button>
              </div>
            </div>

            <div class="control-group">
              <label>Split Direction</label>
              <select class="sub-split-direction">
                <option value="global" ${subSec.splitDirection === 'global' ? 'selected' : ''}>Global Default</option>
                <option value="horizontal" ${subSec.splitDirection === 'horizontal' ? 'selected' : ''}>Horizontal</option>
                <option value="vertical" ${subSec.splitDirection === 'vertical' ? 'selected' : ''}>Vertical</option>
              </select>
            </div>

            <div class="control-group">
              <label>Animation Order</label>
              <select class="sub-anim-order">
                <option value="topDown" ${subSec.animOrder === 'topDown' ? 'selected' : ''}>Top to Bottom</option>
                <option value="bottomUp" ${subSec.animOrder === 'bottomUp' ? 'selected' : ''}>Bottom to Top</option>
              </select>
            </div>

            <div class="control-group">
              <label>Flip Angle Start/End</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-start-angle" value="${subSec.startAngle}" step="1">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-end-angle" value="${subSec.endAngle}" step="1">
                  <div class="input-suffix">E</div>
                </div>
              </div>
            </div>

            <div class="control-group">
              <label>Flip Axis</label>
              <div class="input-group">
                <input type="number" class="sub-axis" value="${subSec.axis}" step="1">
                <div class="input-suffix">AXIS</div>
              </div>
            </div>

            <div class="control-group">
              <label>Custom Easing</label>
              <div class="toggle-group sub-easing-toggle">
                <button class="toggle-btn ${subSec.customEasing ? 'active' : ''}" data-value="on">On</button>
                <button class="toggle-btn ${!subSec.customEasing ? 'active' : ''}" data-value="off">Off</button>
              </div>
            </div>
            
            <div class="control-group sub-easing-btn-container" style="display: ${subSec.customEasing ? 'block' : 'none'}; margin-top: 10px;">
              <button class="sub-open-graph-btn" style="width:100%; padding: 8px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); color: var(--text-primary); border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                Edit Sub-section Easing
              </button>
            </div>

            <div class="control-group" style="margin-top: 16px;">
              <label>Custom Timing</label>
              <div class="toggle-group sub-timing-toggle">
                <button class="toggle-btn ${subSec.customTiming ? 'active' : ''}" data-value="on">On</button>
                <button class="toggle-btn ${!subSec.customTiming ? 'active' : ''}" data-value="off">Off</button>
              </div>
            </div>
            
            <div class="sub-timing-container" style="display: ${subSec.customTiming ? 'block' : 'none'}; margin-top: 10px; padding-left: 10px; border-left: 2px solid var(--border-subtle);">
              <div class="control-group">
                <label>Beat 1 (All Start)</label>
                <input type="text" class="time-input sub-beat1" value="${subSec.beat1Str}" placeholder="MM:SS:FF">
              </div>
              <div class="control-group">
                <label>Beat 2 (First Ends)</label>
                <input type="text" class="time-input sub-beat2" value="${subSec.beat2Str}" placeholder="MM:SS:FF">
              </div>
              <div class="control-group">
                <label>Beat 3 (Last Ends)</label>
                <input type="text" class="time-input sub-beat3" value="${subSec.beat3Str}" placeholder="MM:SS:FF">
              </div>
            </div>
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
    }
    container.innerHTML = html;

    container.querySelectorAll('.section-block').forEach(block => {
      const secIdx = parseInt(block.dataset.index);
      
      const subInput = block.querySelector('.sec-sub-count');
      
      block.querySelector('.sec-sub-minus').addEventListener('click', () => {
        let val = parseInt(subInput.value) || 1;
        if (val > 1) {
          val--;
          subInput.value = val;
          state.sections[secIdx].subSectionCount = val;
          while (state.sections[secIdx].subSections.length > val) {
            state.sections[secIdx].subSections.pop();
          }
          renderSectionsUI();
          fullUpdate();
        }
      });

      block.querySelector('.sec-sub-plus').addEventListener('click', () => {
        let val = parseInt(subInput.value) || 1;
        if (val < 10) {
          val++;
          subInput.value = val;
          state.sections[secIdx].subSectionCount = val;
          while (state.sections[secIdx].subSections.length < val) {
            const last = state.sections[secIdx].subSections[state.sections[secIdx].subSections.length - 1];
            state.sections[secIdx].subSections.push({ ...last });
          }
          renderSectionsUI();
          fullUpdate();
        }
      });

      subInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 10) val = 10;
        state.sections[secIdx].subSectionCount = val;
        while (state.sections[secIdx].subSections.length < val) {
          const last = state.sections[secIdx].subSections[state.sections[secIdx].subSections.length - 1];
          state.sections[secIdx].subSections.push({ ...last });
        }
        while (state.sections[secIdx].subSections.length > val) {
          state.sections[secIdx].subSections.pop();
        }
        renderSectionsUI();
        fullUpdate();
      });
    });

    container.querySelectorAll('.sub-section-block').forEach(block => {
      const secIdx = parseInt(block.dataset.secIndex);
      const subIdx = parseInt(block.dataset.subIndex);
      const subSec = state.sections[secIdx].subSections[subIdx];
      
      const layerInput = block.querySelector('.sub-layer-count');
      
      block.querySelector('.sub-layer-minus').addEventListener('click', () => {
        let val = parseInt(layerInput.value) || 1;
        if (val > 1) {
          val--;
          layerInput.value = val;
          subSec.layerCount = val;
          fullUpdate();
        }
      });

      block.querySelector('.sub-layer-plus').addEventListener('click', () => {
        let val = parseInt(layerInput.value) || 1;
        if (val < 50) {
          val++;
          layerInput.value = val;
          subSec.layerCount = val;
          fullUpdate();
        }
      });

      layerInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 50) val = 50;
        subSec.layerCount = val;
        fullUpdate();
      });

      block.querySelector('.sub-pivot-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        subSec.customPivot = (btn.dataset.value === 'on');
        if (subSec.pivotX === undefined) subSec.pivotX = 0.5;
        if (subSec.pivotY === undefined) subSec.pivotY = 0.5;
        renderSectionsUI();
        fullUpdate();
      });

      block.querySelector('.sub-pivot-x').addEventListener('input', (e) => {
        subSec.pivotX = parseFloat(e.target.value) || 0;
        fullUpdate();
      });

      block.querySelector('.sub-pivot-y').addEventListener('input', (e) => {
        subSec.pivotY = parseFloat(e.target.value) || 0;
        fullUpdate();
      });

      block.querySelector('.sub-split-direction').addEventListener('change', (e) => {
        subSec.splitDirection = e.target.value;
        fullUpdate();
      });

      block.querySelector('.sub-anim-order').addEventListener('change', (e) => {
        subSec.animOrder = e.target.value;
        fullUpdate();
      });
      
      block.querySelector('.sub-start-angle').addEventListener('input', (e) => {
        subSec.startAngle = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-end-angle').addEventListener('input', (e) => {
        subSec.endAngle = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-axis').addEventListener('input', (e) => {
        subSec.axis = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-easing-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        subSec.customEasing = (btn.dataset.value === 'on');
        renderSectionsUI();
        fullUpdate();
      });
      
      const editBtn = block.querySelector('.sub-open-graph-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          currentEditingSection = `${secIdx}-${subIdx}`;
          graphModal.style.display = 'flex';
        });
      }

      block.querySelector('.sub-timing-toggle').addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        subSec.customTiming = (btn.dataset.value === 'on');
        renderSectionsUI();
        fullUpdate();
      });
      
      block.querySelector('.sub-beat1').addEventListener('input', (e) => {
        subSec.beat1Str = e.target.value;
        fullUpdate();
      });
      
      block.querySelector('.sub-beat2').addEventListener('input', (e) => {
        subSec.beat2Str = e.target.value;
        fullUpdate();
      });
      
      block.querySelector('.sub-beat3').addEventListener('input', (e) => {
        subSec.beat3Str = e.target.value;
        fullUpdate();
      });
    });
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
    const layers = calculateLayers();
    const n = layers.length;
    let html = '';

    html += `<div class="formula-line"><span class="formula-label">Project</span><span class="formula-expr">${state.projectWidth} × ${state.projectHeight}</span></div>`;
    html += `<div class="formula-line"><span class="formula-label">Solid</span><span class="formula-expr">${state.solidWidth} × ${state.solidHeight}</span></div>`;
    html += `<div class="formula-line"><span class="formula-label">Location</span><span class="formula-expr">${state.projectWidth / 2}, ${state.projectHeight / 2}</span></div>`;
    html += `<div class="formula-line" style="margin-top:6px;"><span class="formula-label">Wipe X</span><span class="formula-expr">Dynamic</span></div>`;
    html += `<div class="formula-line"><span class="formula-label">Wipe Y</span><span class="formula-expr">Dynamic</span></div>`;

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
        <td>${layer.wipeXStart.toFixed(2)} - ${layer.wipeXEnd.toFixed(2)}</td>
        <td>${layer.wipeYStart.toFixed(2)} - ${layer.wipeYEnd.toFixed(2)}</td>
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

    xml += `<scene title="Wipe Layers ${layers.length}x" width="${state.projectWidth}" height="${state.projectHeight}" exportWidth="${state.projectWidth}" exportHeight="${state.projectHeight}" bgcolor="#FF000000" totalTime="${totalTimeMs}" fps="${fps}" modifiedTime="${Date.now()}" amver="859" ffver="107" am="com.alightcreative.motion/6.2.53" amplatform="ios" precompose="dynamicResolution" retime="freeze">\n`;

    xml += `${t}<bookmark t="0"/>\n`;
    xml += `${t}<bookmark t="5000"/>\n`;

    const effAngle = state.splitDirection === 'horizontal' ? 90 : 0;

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

      if (layer.wipeYStart > 0.0 || layer.wipeYEnd < 1.0) {
        xml += `${t}${t}<effect id="com.alightcreative.effects.wipe2" locallyApplied="true">\n`;
        if (layer.wipeYEnd < 1.0) xml += `${t}${t}${t}<property name="end" type="float" value="${layer.wipeYEnd.toFixed(6)}"/>\n`;
        if (layer.wipeYStart > 0.0) xml += `${t}${t}${t}<property name="start" type="float" value="${layer.wipeYStart.toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}<property name="angle" type="float" value="90.000000"/>\n`;
        xml += `${t}${t}</effect>\n`;
      }
      if (layer.wipeXStart > 0.0 || layer.wipeXEnd < 1.0) {
        xml += `${t}${t}<effect id="com.alightcreative.effects.wipe2" locallyApplied="true">\n`;
        if (layer.wipeXEnd < 1.0) xml += `${t}${t}${t}<property name="end" type="float" value="${layer.wipeXEnd.toFixed(6)}"/>\n`;
        if (layer.wipeXStart > 0.0) xml += `${t}${t}${t}<property name="start" type="float" value="${layer.wipeXStart.toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}<property name="angle" type="float" value="0.000000"/>\n`;
        xml += `${t}${t}</effect>\n`;
      }

      if (state.flipEnabled) {
        // AM keyframes use a normalized time (0.0 to 1.0) relative to the layer's duration
        const projDurationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
        const normStart = layer.flipStartT / projDurationSec;
        const normEnd = layer.flipEndT / projDurationSec;

        // Flip Layer Effect
        xml += `${t}${t}<effect id="com.alightcreative.effects.flip3" locallyApplied="true">\n`;
        xml += `${t}${t}${t}<property name="axis" type="float" value="${layer.flipAxis.toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}<property name="pivot" type="vec2" value="${layer.pivotX.toFixed(6)},${layer.pivotY.toFixed(6)}"/>\n`;
        xml += `${t}${t}${t}<property name="angle" type="float">\n`;
        xml += `${t}${t}${t}${t}<kf t="${normStart.toFixed(6)}" v="${layer.flipStartAngle.toFixed(6)}" />\n`;
        
        let easingStr = '';
        if (layer.flipEasing) {
          const bezierParts = layer.flipEasing.split(',').map(s => s.trim());
          easingStr = ` e="cubicBezier ${bezierParts.join(' ')}"`;
        }
        
        xml += `${t}${t}${t}${t}<kf t="${normEnd.toFixed(6)}" v="${layer.flipEndAngle.toFixed(6)}"${easingStr} />\n`;
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
  beat1Input.addEventListener('input', () => {
    state.beat1Str = beat1Input.value;
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
  flipToggleGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    flipToggleGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.flipEnabled = btn.dataset.value === 'on';
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

  function setSectionCount(val) {
    if (val < 1) val = 1;
    if (val > 10) val = 10;
    state.sectionCount = val;
    sectionCountInput.value = val;
    
    while (state.sections.length < val) {
      const last = state.sections[state.sections.length - 1];
      const newSec = { ...last };
      if (last.subSections) {
        newSec.subSections = last.subSections.map(sub => ({ ...sub }));
      }
      state.sections.push(newSec);
    }
    while (state.sections.length > val) {
      state.sections.pop();
    }
    
    renderSectionsUI();
    fullUpdate();
  }

  sectionCountInput.addEventListener('input', () => {
    setSectionCount(parseInt(sectionCountInput.value) || 1);
  });
  sectionMinusBtn.addEventListener('click', () => setSectionCount(state.sectionCount - 1));
  sectionPlusBtn.addEventListener('click', () => setSectionCount(state.sectionCount + 1));

  // Modal and Graph Message Listener
  let currentEditingSection = -1; // -1 means global

  openGraphBtn.addEventListener('click', () => {
    currentEditingSection = -1;
    graphModal.style.display = 'flex';
  });
  
  closeGraphBtn.addEventListener('click', () => {
    graphModal.style.display = 'none';
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'BEZIER_UPDATE') {
      const { x1, y1, x2, y2 } = event.data;
      const easingStr = `${x1}, ${y1}, ${x2}, ${y2}`;
      
      if (currentEditingSection === -1) {
        state.flipEasing = easingStr;
      } else if (typeof currentEditingSection === 'string' && currentEditingSection.includes('-')) {
        const [secIdx, subIdx] = currentEditingSection.split('-').map(Number);
        if (state.sections[secIdx] && state.sections[secIdx].subSections[subIdx]) {
          state.sections[secIdx].subSections[subIdx].easing = easingStr;
        }
      } else if (state.sections[currentEditingSection]) {
        // Fallback for old state
        state.sections[currentEditingSection].easing = easingStr;
      }
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
    const layers = calculateLayers();
    const xml = generateAlightMotionXML();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wipe-layers-${layers.length}x-${state.projectWidth}x${state.projectHeight}.xml`;
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
  renderSectionsUI();
  fullUpdate();
})();
