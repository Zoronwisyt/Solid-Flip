/* ============================================
   WIPE LAYER GENERATOR — APPLICATION LOGIC
   Alight Motion XML Export · Full-Screen Wipe Masking
   ============================================ */

(() => {
  'use strict';

  // Alight Motion can round independently scaled, fractional-pixel shapes in a
  // way that reveals the transparent canvas between two edge-to-edge tiles.
  // Expand each mask tile by this amount on every edge so adjacent tiles overlap.
  const MASK_SEAM_OVERSCAN_PX = 2;

  // ---- State ----
  const state = {
    baseWidth: 1080,
    baseHeight: 1350,
    projectWidth: 1080,
    projectHeight: 1350,
    solidWidth: 1080,
    solidHeight: 1350,
    splitDirection: 'horizontal',
    wipeMethod: 'wipe',
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
            pivotX: 0,
            pivotY: 0,
            animOrder: 'topDown', 
            startAngle: 0, 
            endAngle: 90, 
            axis: 0, 
            cubeXStart: 0,
            cubeXEnd: 0,
            cubeYStart: 0,
            cubeYEnd: 0,
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
    animType: 'flip', // 'none', 'flip', 'cube', 'box'
    flipPivotX: 0,
    flipPivotY: 0,
    box: {
      orientAllStartStr: '00:00:00',
      orientFirstEndStr: '00:02:00',
      orientLastEndStr: '00:04:00',
      orientStartX: 0,
      orientStartY: 0,
      orientStartZ: 0,
      orientEndX: 0,
      orientEndY: 180,
      orientEndZ: 0,
      rotateAllStartStr: '00:01:00',
      rotateFirstEndStr: '00:03:00',
      rotateLastEndStr: '00:05:00',
      rotateStartX: 0,
      rotateStartY: 0,
      rotateStartZ: 0,
      rotateEndX: 0,
      rotateEndY: 180,
      rotateEndZ: 0,
      depth: 0.01,
      scale: 3.51,
      orientEasing: '0.25, 0.10, 0.25, 1.00',
      rotateEasing: '0.25, 0.10, 0.25, 1.00',
    },
    flipEasing: '0.79, 0.00, 0.59, 1.00',
    isPlaying: false,
    currentTimeSec: 0,
  };

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const canvas = $('#previewCanvas');
  const ctx = canvas.getContext('2d');

  // Controls
  const splitDirectionGroup = $('#splitDirection');
  const wipeMethodGroup = $('#wipeMethod');
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
  const globalTimingControls = $('#globalTimingControls');
  const beat1Input = $('#beat1');
  const beat2Input = $('#beat2');
  const beat3Input = $('#beat3');
  const animTypeToggleGroup = $('#animTypeToggle');
  const flipPivotXInput = $('#flipPivotX');
  const flipPivotYInput = $('#flipPivotY');

  // Box Controls
  const boxEffectControls = $('#boxEffectControls');
  const boxOrientAllStartInput = $('#boxOrientAllStart');
  const boxOrientFirstEndInput = $('#boxOrientFirstEnd');
  const boxOrientLastEndInput = $('#boxOrientLastEnd');
  const boxOrientStartXInput = $('#boxOrientStartX');
  const boxOrientStartYInput = $('#boxOrientStartY');
  const boxOrientStartZInput = $('#boxOrientStartZ');
  const boxOrientEndXInput = $('#boxOrientEndX');
  const boxOrientEndYInput = $('#boxOrientEndY');
  const boxOrientEndZInput = $('#boxOrientEndZ');
  const boxRotateAllStartInput = $('#boxRotateAllStart');
  const boxRotateFirstEndInput = $('#boxRotateFirstEnd');
  const boxRotateLastEndInput = $('#boxRotateLastEnd');
  const boxRotateStartXInput = $('#boxRotateStartX');
  const boxRotateStartYInput = $('#boxRotateStartY');
  const boxRotateStartZInput = $('#boxRotateStartZ');
  const boxRotateEndXInput = $('#boxRotateEndX');
  const boxRotateEndYInput = $('#boxRotateEndY');
  const boxRotateEndZInput = $('#boxRotateEndZ');
  const boxOrientEasingBtn = $('#boxOrientEasingBtn');
  const boxRotateEasingBtn = $('#boxRotateEasingBtn');
  
  const sectionCountInput = $('#sectionCount');
  const sectionMinusBtn = $('#sectionMinus');
  const sectionPlusBtn = $('#sectionPlus');
  const sectionsContainer = $('#sectionsContainer');
  
  const openGraphBtn = $('#openGraphBtn');
  const closeGraphBtn = $('#closeGraphBtn');
  const graphModal = $('#graphModal');
  const graphIframe = $('#graphIframe');
  const graphIframe2 = $('#graphIframe2');

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
  const copySettingsBtn = $('#copySettingsBtn');
  const importSettingsBtn = $('#importSettingsBtn');
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

  function eulerToQuaternion(x, y, z) {
    // Convert degrees to radians
    const radX = x * Math.PI / 180;
    const radY = y * Math.PI / 180;
    const radZ = z * Math.PI / 180;

    const cy = Math.cos(radZ * 0.5);
    const sy = Math.sin(radZ * 0.5);
    const cp = Math.cos(radY * 0.5);
    const sp = Math.sin(radY * 0.5);
    const cr = Math.cos(radX * 0.5);
    const sr = Math.sin(radX * 0.5);

    const w = cr * cp * cy + sr * sp * sy;
    const x_q = sr * cp * cy - cr * sp * sy;
    const y_q = cr * sp * cy + sr * cp * sy;
    const z_q = cr * cp * sy - sr * sp * cy;

    return { w, x: x_q, y: y_q, z: z_q };
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
        
        const subPivotX = subSec.customPivot ? (subSec.pivotX !== undefined ? subSec.pivotX : 0) : state.flipPivotX;
        const subPivotY = subSec.customPivot ? (subSec.pivotY !== undefined ? subSec.pivotY : 0) : state.flipPivotY;
        
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

          const staggerRatio = (subLayerCount > 1) ? (localOrderIdx / (subLayerCount - 1)) : 0;
          const flipEnd = b2 + (b3 - b2) * staggerRatio;

          const orientAllStart = parseTimeToSeconds(state.box.orientAllStartStr);
          const orientFirstEnd = parseTimeToSeconds(state.box.orientFirstEndStr);
          const orientLastEnd = parseTimeToSeconds(state.box.orientLastEndStr);
          const orientStart = orientAllStart;
          const orientEnd = orientFirstEnd + (orientLastEnd - orientFirstEnd) * staggerRatio;

          const rotateAllStart = parseTimeToSeconds(state.box.rotateAllStartStr);
          const rotateFirstEnd = parseTimeToSeconds(state.box.rotateFirstEndStr);
          const rotateLastEnd = parseTimeToSeconds(state.box.rotateLastEndStr);
          const rotateStart = rotateAllStart;
          const rotateEnd = rotateFirstEnd + (rotateLastEnd - rotateFirstEnd) * staggerRatio;

          const layerProps = {
            index: globalLayerIndex + 1,
            flipStartT: b1,
            flipEndT: flipEnd,
            orientStartT: orientStart,
            orientEndT: orientEnd,
            rotateStartT: rotateStart,
            rotateEndT: rotateEnd,
            flipStartAngle: subSec.startAngle,
            flipEndAngle: subSec.endAngle,
            flipAxis: subSec.axis,
            cubeXStart: subSec.cubeXStart || 0,
            cubeXEnd: subSec.cubeXEnd || 0,
            cubeYStart: subSec.cubeYStart || 0,
            cubeYEnd: subSec.cubeYEnd || 0,
            pivotX: subPivotX,
            pivotY: subPivotY,
            sectionIdx: s,
            subSectionIdx: sub,
            flipEasing: subSec.customEasing ? subSec.easing : state.flipEasing
          };

          if (state.wipeMethod === 'mask') {
            const tileWidth = (layerXEnd - layerXStart) * state.solidWidth;
            const tileHeight = (layerYEnd - layerYStart) * state.solidHeight;
            // Keep the tile's calculated center, but extend all four edges by
            // two pixels. A shared edge therefore has a four-pixel overlap,
            // eliminating anti-aliasing/rounding seams in the imported XML.
            const layerWidth = tileWidth + (MASK_SEAM_OVERSCAN_PX * 2);
            const layerHeight = tileHeight + (MASK_SEAM_OVERSCAN_PX * 2);
            const solidOriginX = (state.projectWidth - state.solidWidth) / 2;
            const solidOriginY = (state.projectHeight - state.solidHeight) / 2;
            const layerLocX = solidOriginX + (layerXStart * state.solidWidth) + (tileWidth / 2);
            const layerLocY = solidOriginY + (layerYStart * state.solidHeight) + (tileHeight / 2);

            Object.assign(layerProps, {
              locX: layerLocX,
              locY: layerLocY,
              width: layerWidth,
              height: layerHeight,
              wipeXStart: 0,
              wipeXEnd: 1,
              wipeYStart: 0,
              wipeYEnd: 1,
            });
          } else { // 'wipe' method
            Object.assign(layerProps, {
              locX: state.projectWidth / 2,
              locY: state.projectHeight / 2,
              width: state.solidWidth,
              height: state.solidHeight,
              wipeXStart: layerXStart,
              wipeXEnd: layerXEnd,
              wipeYStart: layerYStart,
              wipeYEnd: layerYEnd,
            });
          }

          layers.push(layerProps);
          
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

    // Draw each layer
    layers.forEach((layer, idx) => {
      ctx.save();

      let eased = 0;
      if ((state.animType === 'flip' || state.animType === 'cube') && timeSec > layer.flipStartT) {
        if (timeSec >= layer.flipEndT) {
          eased = 1;
        } else {
          const progress = (timeSec - layer.flipStartT) / (layer.flipEndT - layer.flipStartT);
          const [x1, y1, x2, y2] = layer.flipEasing.split(',').map(Number);
          eased = bezierY(progress, x1, y1, x2, y2);
        }
      }

      let flipAngle = layer.flipStartAngle + (layer.flipEndAngle - layer.flipStartAngle) * eased;
      let cubeRotX = layer.cubeXStart + (layer.cubeXEnd - layer.cubeXStart) * eased;
      let cubeRotY = layer.cubeYStart + (layer.cubeYEnd - layer.cubeYStart) * eased;

      const layerW = layer.width * scaleF;
      const layerH = layer.height * scaleF;
      const layerLeft = (layer.locX * scaleF) - (layerW / 2);
      const layerTop = (layer.locY * scaleF) - (layerH / 2);

      // --- 3D FLIP/CUBE EMULATION ---
      if (state.animType === 'flip' || state.animType === 'cube' || state.animType === 'box') {
        const normPivotX = (layer.pivotX / 200) + 0.5;
        const normPivotY = (layer.pivotY / 200) + 0.5;
        const px = layerLeft + (normPivotX * layerW);
        const py = layerTop + (normPivotY * layerH);
        
        ctx.translate(px, py);
        
        if (state.animType === 'flip') {
          const axisRad = (layer.flipAxis * Math.PI) / 180;
          ctx.rotate(-axisRad);
          const flipRad = (flipAngle * Math.PI) / 180;
          ctx.scale(Math.cos(flipRad), 1);
          ctx.rotate(axisRad);
        } else if (state.animType === 'cube') {
          const radX = (cubeRotX * Math.PI) / 180;
          const radY = (cubeRotY * Math.PI) / 180;
          ctx.scale(Math.cos(radY), Math.cos(radX));
        } else if (state.animType === 'box') {
            // Orientation progress
            let orientEased = 0;
            const orientStartT = layer.orientStartT;
            const orientEndT = layer.orientEndT;
            if (timeSec > orientStartT && orientEndT > orientStartT) {
                if (timeSec >= orientEndT) {
                    orientEased = 1;
                } else {
                    const progress = (timeSec - orientStartT) / (orientEndT - orientStartT);
                    const [x1, y1, x2, y2] = state.box.orientEasing.split(',').map(Number);
                    orientEased = bezierY(progress, x1, y1, x2, y2);
                }
            }

            // Rotation progress
            let rotateEased = 0;
            const rotateStartT = layer.rotateStartT;
            const rotateEndT = layer.rotateEndT;
            if (timeSec > rotateStartT && rotateEndT > rotateStartT) {
                if (timeSec >= rotateEndT) {
                    rotateEased = 1;
                } else {
                    const progress = (timeSec - rotateStartT) / (rotateEndT - rotateStartT);
                    const [x1, y1, x2, y2] = state.box.rotateEasing.split(',').map(Number);
                    rotateEased = bezierY(progress, x1, y1, x2, y2);
                }
            }

            // Interpolate angles
            const orientRotX = state.box.orientStartX + (state.box.orientEndX - state.box.orientStartX) * orientEased;
            const orientRotY = state.box.orientStartY + (state.box.orientEndY - state.box.orientStartY) * orientEased;
            
            const rotateRotX = state.box.rotateStartX + (state.box.rotateEndX - state.box.rotateStartX) * rotateEased;
            const rotateRotY = state.box.rotateStartY + (state.box.rotateEndY - state.box.rotateStartY) * rotateEased;

            // Combine rotations for 2D preview (simplification)
            const combinedRotX = orientRotX + rotateRotX;
            const combinedRotY = orientRotY + rotateRotY;

            // Apply transformation (similar to cube)
            const radX = (combinedRotX * Math.PI) / 180;
            const radY = (combinedRotY * Math.PI) / 180;
            ctx.scale(Math.cos(radY), Math.cos(radX));
        }
        
        ctx.translate(-px, -py);
      }

      if (state.wipeMethod === 'wipe') {
        const solidW = state.solidWidth * scaleF;
        const solidH = state.solidHeight * scaleF;
        const solidLeft = (state.projectWidth / 2 * scaleF) - (solidW / 2);
        const solidTop = (state.projectHeight / 2 * scaleF) - (solidH / 2);

        const lx = solidLeft + layer.wipeXStart * solidW;
        const lw = (layer.wipeXEnd - layer.wipeXStart) * solidW;
        const ly = solidTop + layer.wipeYStart * solidH;
        const lh = (layer.wipeYEnd - layer.wipeYStart) * solidH;

        ctx.beginPath();
        ctx.rect(lx, ly, lw, lh);
        ctx.clip();

        ctx.fillStyle = getLayerColor(idx, layers.length, layer.sectionIdx, state.sectionCount);
        ctx.fillRect(solidLeft, solidTop, solidW, solidH);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `${Math.max(9, 12 * scaleF * 3)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`C${layer.index}`, lx + lw / 2, ly + lh / 2);

      } else { // 'mask' method
        ctx.fillStyle = getLayerColor(idx, layers.length, layer.sectionIdx, state.sectionCount);
        ctx.fillRect(layerLeft, layerTop, layerW, layerH);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `${Math.max(9, 12 * scaleF * 3)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`C${layer.index}`, layerLeft + layerW / 2, layerTop + layerH / 2);
      }

      ctx.restore();
    });

    // Draw grid lines between layers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    layers.forEach((layer) => {
      const layerW = layer.width * scaleF;
      const layerH = layer.height * scaleF;
      const layerLeft = (layer.locX * scaleF) - (layerW / 2);
      const layerTop = (layer.locY * scaleF) - (layerH / 2);
      ctx.strokeRect(layerLeft, layerTop, layerW, layerH);
    });

    ctx.setLineDash([]);

    // Draw central crosshair
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
                    <input type="number" class="sub-pivot-x" value="${subSec.pivotX !== undefined ? subSec.pivotX : 0}" step="1" title="Pivot X">
                    <div class="input-suffix">PX</div>
                  </div>
                  <div class="input-group" style="flex:1">
                    <input type="number" class="sub-pivot-y" value="${subSec.pivotY !== undefined ? subSec.pivotY : 0}" step="1" title="Pivot Y">
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

            <div class="control-group anim-flip-only" style="display: ${state.animType === 'flip' ? 'block' : 'none'}">
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

            <div class="control-group anim-flip-only" style="display: ${state.animType === 'flip' ? 'block' : 'none'}">
              <label>Flip Axis</label>
              <div class="input-group">
                <input type="number" class="sub-axis" value="${subSec.axis}" step="1">
                <div class="input-suffix">AXIS</div>
              </div>
            </div>

            <div class="control-group anim-cube-only" style="display: ${state.animType === 'cube' ? 'block' : 'none'}">
              <label>Cube Rotation X (Up/Down)</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-cube-x-start" value="${subSec.cubeXStart || 0}" step="1">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-cube-x-end" value="${subSec.cubeXEnd || 0}" step="1">
                  <div class="input-suffix">E</div>
                </div>
              </div>
            </div>

            <div class="control-group anim-cube-only" style="display: ${state.animType === 'cube' ? 'block' : 'none'}">
              <label>Cube Rotation Y (Left/Right)</label>
              <div class="solid-size-row">
                <div class="input-group">
                  <input type="number" class="sub-cube-y-start" value="${subSec.cubeYStart || 0}" step="1">
                  <div class="input-suffix">S</div>
                </div>
                <div class="input-group">
                  <input type="number" class="sub-cube-y-end" value="${subSec.cubeYEnd || 0}" step="1">
                  <div class="input-suffix">E</div>
                </div>
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
        subSec.customPivot = btn.dataset.value === 'on';
        if (subSec.pivotX === undefined) subSec.pivotX = 0;
        if (subSec.pivotY === undefined) subSec.pivotY = 0;
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
      
      block.querySelector('.sub-cube-x-start')?.addEventListener('input', (e) => {
        subSec.cubeXStart = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-cube-x-end')?.addEventListener('input', (e) => {
        subSec.cubeXEnd = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-cube-y-start')?.addEventListener('input', (e) => {
        subSec.cubeYStart = parseFloat(e.target.value) || 0;
        fullUpdate();
      });
      
      block.querySelector('.sub-cube-y-end')?.addEventListener('input', (e) => {
        subSec.cubeYEnd = parseFloat(e.target.value) || 0;
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

      let finalLocX = layer.locX;
      let finalLocY = layer.locY;
      let finalScaleX = 1.0;
      let finalScaleY = 1.0;
      let finalSizeX = layer.width / 2;
      let finalSizeY = layer.height / 2;

      // For mask method, we use absolute positioning and calculate scale from a base size.
      if (state.wipeMethod === 'mask') {
        finalSizeX = 100.0;
        finalSizeY = 100.0;
        finalScaleX = layer.width / 200.0;
        finalScaleY = layer.height / 200.0;
      }

      xml += `${t}<shape id="${layer.index}" label="${layerLabel}" startTime="0" endTime="${totalTimeMs}" fillType="color" s=".rect">\n`;

      xml += `${t}${t}<transform>\n`;
      xml += `${t}${t}${t}<location value="${finalLocX.toFixed(6)},${finalLocY.toFixed(6)},0.000000"/>\n`;
      xml += `${t}${t}${t}<scale value="${finalScaleX.toFixed(6)},${finalScaleY.toFixed(6)}"/>\n`;
      xml += `${t}${t}</transform>\n`;

      xml += `${t}${t}<fillColor value="${amColor}"/>\n`;

      if (state.wipeMethod === 'wipe') {
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
      }

      if (state.animType === 'flip' || state.animType === 'cube' || state.animType === 'box') {
        // AM keyframes use a normalized time (0.0 to 1.0) relative to the layer's duration
        const projDurationSec = parseTimeToSeconds(state.projectDurationStr) || 1;
        const normStart = layer.flipStartT / projDurationSec;
        const normEnd = layer.flipEndT / projDurationSec;

        let easingStr = '';
        if (layer.flipEasing) {
          const bezierParts = layer.flipEasing.split(',').map(s => s.trim());
          easingStr = ` e="cubicBezier ${bezierParts.join(' ')}"`;
        }

        if (state.animType === 'flip') {
          // Flip Layer Effect
          xml += `${t}${t}<effect id="com.alightcreative.effects.flip3" locallyApplied="true">\n`;
          xml += `${t}${t}${t}<property name="axis" type="float" value="${layer.flipAxis.toFixed(6)}"/>\n`;
          xml += `${t}${t}${t}<property name="pivot" type="vec2" value="${layer.pivotX.toFixed(6)},${layer.pivotY.toFixed(6)}"/>\n`;
          xml += `${t}${t}${t}<property name="angle" type="float">\n`;
          xml += `${t}${t}${t}${t}<kf t="${normStart.toFixed(6)}" v="${layer.flipStartAngle.toFixed(6)}" />\n`;
          xml += `${t}${t}${t}${t}<kf t="${normEnd.toFixed(6)}" v="${layer.flipEndAngle.toFixed(6)}"${easingStr} />\n`;
          xml += `${t}${t}${t}</property>\n`;
          xml += `${t}${t}</effect>\n`;
        } else if (state.animType === 'cube') {
          // Cube Effect
          // Mask layers use a 100 x 100 base shape, so calibrate the cube from
          // the known-good 625 x 78.1 layer rather than from the full project.
          // For vertical cuts the reference axes are swapped. This keeps the
          // same correction when the split direction changes:
          //   cubeScale = 1.97 * sqrt((layerW * layerH) / (refW * refH))
          const isHorizontalSplit = state.splitDirection === 'horizontal';
          const maskCubeReferenceWidth = isHorizontalSplit ? 625 : 78.1;
          const maskCubeReferenceHeight = isHorizontalSplit ? 78.1 : 625;
          const maskCubeReferenceScale = 1.97;
          const maskCubeAreaRatio = (layer.width * layer.height) /
            (maskCubeReferenceWidth * maskCubeReferenceHeight);
          const cubeScale = state.wipeMethod === 'mask'
            ? maskCubeReferenceScale * Math.sqrt(Math.max(maskCubeAreaRatio, 0))
            : 1.32 * (layer.width / (state.projectWidth * (650 / 1080)));
          
          const cubeWidth = state.projectWidth / 1000;
          const cubeHeight = state.wipeMethod === 'mask' && state.splitDirection !== 'horizontal'
            ? 1.056
            : state.projectHeight / 1000;
          const cubeDepth = state.projectWidth / 1000;
          
          xml += `${t}${t}<effect id="com.alightcreative.effects.cube2" locallyApplied="true">\n`;
          xml += `${t}${t}${t}<property name="depth" type="float" value="${cubeDepth.toFixed(6)}"/>\n`;
          xml += `${t}${t}${t}<property name="height" type="float" value="${cubeHeight.toFixed(6)}"/>\n`;
          
          // Rotation (X, Y, Z)
          xml += `${t}${t}${t}<property name="rotate" type="vec3">\n`;
          
          xml += `${t}${t}${t}${t}<kf t="${normStart.toFixed(6)}" v="${layer.cubeXStart.toFixed(6)},${layer.cubeYStart.toFixed(6)},0.000000" />\n`;
          
          xml += `${t}${t}${t}${t}<kf t="${normEnd.toFixed(6)}" v="${layer.cubeXEnd.toFixed(6)},${layer.cubeYEnd.toFixed(6)},0.000000"${easingStr} />\n`;
          
          xml += `${t}${t}${t}</property>\n`;
          
          xml += `${t}${t}${t}<property name="position" type="vec3" value="0.000000,0.000000,0.000000"/>\n`;
          xml += `${t}${t}${t}<property name="scale" type="float" value="${cubeScale.toFixed(6)}"/>\n`;
          xml += `${t}${t}${t}<property name="shadingType" type="int" value="0"/>\n`;
          xml += `${t}${t}${t}<property name="width" type="float" value="${cubeWidth.toFixed(6)}"/>\n`;
          xml += `${t}${t}</effect>\n`;

        } else if (state.animType === 'box') {
          // Box Effect
          xml += `${t}${t}<effect id="com.alightcreative.effects.box" locallyApplied="true">\n`;
          xml += `${t}${t}${t}<property name="depth" type="float" value="${state.box.depth.toFixed(6)}"/>\n`;
          xml += `${t}${t}${t}<property name="scale" type="float" value="${state.box.scale.toFixed(6)}"/>\n`;

          // --- Orientation ---
          const normOrientStart = layer.orientStartT / projDurationSec;
          const normOrientEnd = layer.orientEndT / projDurationSec;
          const startQuat = eulerToQuaternion(state.box.orientStartX, state.box.orientStartY, state.box.orientStartZ);
          const endQuat = eulerToQuaternion(state.box.orientEndX, state.box.orientEndY, state.box.orientEndZ);
          const orientEasingStr = ` e="cubicBezier ${state.box.orientEasing.replace(/, /g, ' ')}"`;
          const rotateEasingStr = ` e="cubicBezier ${state.box.rotateEasing.replace(/, /g, ' ')}"`;

          xml += `${t}${t}${t}<property name="orient" type="quat">\n`;
          xml += `${t}${t}${t}${t}<kf t="${normOrientStart.toFixed(6)}" v="${startQuat.w.toFixed(6)},${startQuat.x.toFixed(6)},${startQuat.y.toFixed(6)},${startQuat.z.toFixed(6)}" />\n`;
          xml += `${t}${t}${t}${t}<kf t="${normOrientEnd.toFixed(6)}" v="${endQuat.w.toFixed(6)},${endQuat.x.toFixed(6)},${endQuat.y.toFixed(6)},${endQuat.z.toFixed(6)}" ${orientEasingStr} />\n`;
          xml += `${t}${t}${t}</property>\n`;

          // --- Rotation ---
          const normRotateStart = layer.rotateStartT / projDurationSec;
          const normRotateEnd = layer.rotateEndT / projDurationSec;

          xml += `${t}${t}${t}<property name="rotate" type="vec3">\n`;
          xml += `${t}${t}${t}${t}<kf t="${normRotateStart.toFixed(6)}" v="${state.box.rotateStartX.toFixed(6)},${state.box.rotateStartY.toFixed(6)},${state.box.rotateStartZ.toFixed(6)}" />\n`;
          xml += `${t}${t}${t}${t}<kf t="${normRotateEnd.toFixed(6)}" v="${state.box.rotateEndX.toFixed(6)},${state.box.rotateEndY.toFixed(6)},${state.box.rotateEndZ.toFixed(6)}" ${rotateEasingStr} />\n`;
          xml += `${t}${t}${t}</property>\n`;

          xml += `${t}${t}${t}<property name="height" type="float" value="1.0"/>\n`;
          xml += `${t}${t}${t}<property name="shadingType" type="int" value="1"/>\n`;
          xml += `${t}${t}${t}<property name="shadingType" type="int" value="1"/>\n`;

          xml += `${t}${t}</effect>\n`;
        }
      }

      // AM interprets 'size' on vector shapes as half-extents (radius from center)
      if (state.wipeMethod === 'mask') {
        xml += `${t}${t}<property name="size" type="vec2" value="100.0,100.0"/>\n`;
      } else if (state.animType === 'cube') {
        xml += `${t}${t}<property name="size" type="vec2" value="${(state.projectWidth / 2).toFixed(6)},${(state.projectHeight / 2).toFixed(6)}"/>\n`;
      } else {
        xml += `${t}${t}<property name="size" type="vec2" value="${(layer.width / 2).toFixed(6)},${(layer.height / 2).toFixed(6)}"/>\n`;
      }

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

  // Wipe method
  wipeMethodGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    wipeMethodGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.wipeMethod = btn.dataset.value;
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
  animTypeToggleGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    animTypeToggleGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.animType = btn.dataset.value;
    showToast('Experimental feature — animation types are still in development.');

    // Show/hide Box controls
    if (boxEffectControls) {
      boxEffectControls.style.display = state.animType === 'box' ? 'block' : 'none';
    }
    if (globalTimingControls) {
      globalTimingControls.style.display = state.animType === 'box' ? 'none' : 'block';
    }

    renderSectionsUI();
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
  let currentEditingTarget = 'global'; // 'global', 'box-orient', 'box-rotate', or 'sub-section-X-Y'

  openGraphBtn.addEventListener('click', () => {
    currentEditingTarget = 'global';
    graphModal.style.display = 'flex';
  });
  
  closeGraphBtn.addEventListener('click', () => {
    graphModal.style.display = 'none';
  });

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'BEZIER_UPDATE') {
      const { x1, y1, x2, y2 } = event.data;
      const easingStr = `${x1}, ${y1}, ${x2}, ${y2}`;
      
      if (currentEditingTarget === 'global') {
        state.flipEasing = easingStr;
      } else if (currentEditingTarget === 'box-orient') {
        state.box.orientEasing = easingStr;
      } else if (currentEditingTarget === 'box-rotate') {
        state.box.rotateEasing = easingStr;
      } else if (currentEditingTarget.startsWith('sub-section-')) {
        const [, secIdx, subIdx] = currentEditingTarget.split('-').map(Number);
        if (state.sections[secIdx] && state.sections[secIdx].subSections[subIdx]) {
          state.sections[secIdx].subSections[subIdx].easing = easingStr;
        }
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
      // Fallback for browsers that don't support navigator.clipboard
      try {
        const textarea = document.createElement('textarea');
        textarea.value = generateAlightMotionXML();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copied XML to clipboard!');
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        showToast('Failed to copy XML.', true);
      }
    }
  });

  // ---- Settings Import/Export ----

  function deepMerge(target, source) {
    const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj);

    // Create a new object to avoid modifying the original target state directly
    let output = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key];

        // Recurse for nested objects
        if (isObject(targetValue) && isObject(sourceValue)) {
          output[key] = deepMerge(targetValue, sourceValue);
        }
        // Handle arrays: overwrite target array with source array
        // This is a simpler approach than deep-merging array elements, which can be complex.
        // It assumes the imported array is complete and valid.
        else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
          output[key] = sourceValue;
        }
        // Handle primitive values
        else if (targetValue !== undefined && typeof targetValue === typeof sourceValue) {
          output[key] = sourceValue;
        }
        // Otherwise, ignore the key from the source to prevent pollution
      }
    }
    return output;
  }


  copySettingsBtn.addEventListener('click', () => {
    try {
      // Create a clean copy of the state for serialization
      const stateToSave = { ...state };
      // These are not useful to save as they are runtime-specific
      delete stateToSave.isPlaying;
      delete stateToSave.currentTimeSec;

      const settingsString = JSON.stringify(stateToSave);
      const encodedSettings = btoa(settingsString);
      navigator.clipboard.writeText(encodedSettings);
      showToast('Settings copied to clipboard!');
    } catch (error) {
      console.error("Error copying settings:", error);
      showToast('Error copying settings.', true);
    }
  });

  importSettingsBtn.addEventListener('click', () => {
    const encodedSettings = prompt("Paste your settings string below:");
    if (!encodedSettings || encodedSettings.trim() === '') return;

    try {
      const settingsString = atob(encodedSettings);
      const importedState = JSON.parse(settingsString);

      // Safely merge the imported state into the current state
      const newState = deepMerge(state, importedState);
      
      // Now, we need to re-assign the new properties back to the original state object
      // This preserves the original state object reference, which is important for the app.
      Object.keys(newState).forEach(key => {
        state[key] = newState[key];
      });

      // Refresh UI with new values from the merged state
      updateUIFromState();
      
      showToast('Settings imported successfully!');
    } catch (error) {
      console.error("Error importing settings:", error);
      showToast('Invalid or corrupted settings string.', true);
    }
  });

  function updateUIFromState() {
    // Update all input fields and UI elements to reflect the current state
    projectScaleSelect.value = state.projectWidth / state.baseWidth;
    solidWidthInput.value = state.solidWidth;
    solidHeightInput.value = state.solidHeight;
    aspectLinkBtn.classList.toggle('active', state.aspectLocked);
    solidColorInput.value = state.solidColor;
    colorValueSpan.textContent = state.solidColor;
    
    document.querySelector(`#splitDirection .toggle-btn[data-value='${state.splitDirection}']`).click();
    document.querySelector(`#wipeMethod .toggle-btn[data-value='${state.wipeMethod}']`).click();
    
    projectDurationInput.value = state.projectDurationStr;
    projectFpsInput.value = state.fps;
    beat1Input.value = state.beat1Str;
    beat2Input.value = state.beat2Str;
    beat3Input.value = state.beat3Str;

    document.querySelector(`#animTypeToggle .toggle-btn[data-value='${state.animType}']`).click();
    
    flipPivotXInput.value = state.flipPivotX;
    flipPivotYInput.value = state.flipPivotY;

    // Box controls
    boxOrientAllStartInput.value = state.box.orientAllStartStr;
    boxOrientFirstEndInput.value = state.box.orientFirstEndStr;
    boxOrientLastEndInput.value = state.box.orientLastEndStr;
    boxOrientStartXInput.value = state.box.orientStartX;
    boxOrientStartYInput.value = state.box.orientStartY;
    boxOrientStartZInput.value = state.box.orientStartZ;
    boxOrientEndXInput.value = state.box.orientEndX;
    boxOrientEndYInput.value = state.box.orientEndY;
    boxOrientEndZInput.value = state.box.orientEndZ;
    boxRotateAllStartInput.value = state.box.rotateAllStartStr;
    boxRotateFirstEndInput.value = state.box.rotateFirstEndStr;
    boxRotateLastEndInput.value = state.box.rotateLastEndStr;
    boxRotateStartXInput.value = state.box.rotateStartX;
    boxRotateStartYInput.value = state.box.rotateStartY;
    boxRotateStartZInput.value = state.box.rotateStartZ;
    boxRotateEndXInput.value = state.box.rotateEndX;
    boxRotateEndYInput.value = state.box.rotateEndY;
    boxRotateEndZInput.value = state.box.rotateEndZ;

    sectionCountInput.value = state.sectionCount;

    // This will re-render the sections and sub-sections, which is crucial
    renderSectionsUI(); 
    // Finally, do a full update to recalculate everything and redraw the canvas
    fullUpdate();
  }

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

  // Box Control Handlers
  if (boxEffectControls) {
    boxOrientAllStartInput.addEventListener('input', () => { state.box.orientAllStartStr = boxOrientAllStartInput.value; fullUpdate(); });
    boxOrientFirstEndInput.addEventListener('input', () => { state.box.orientFirstEndStr = boxOrientFirstEndInput.value; fullUpdate(); });
    boxOrientLastEndInput.addEventListener('input', () => { state.box.orientLastEndStr = boxOrientLastEndInput.value; fullUpdate(); });
    boxOrientStartXInput.addEventListener('input', () => { state.box.orientStartX = parseFloat(boxOrientStartXInput.value) || 0; fullUpdate(); });
    boxOrientStartYInput.addEventListener('input', () => { state.box.orientStartY = parseFloat(boxOrientStartYInput.value) || 0; fullUpdate(); });
    boxOrientStartZInput.addEventListener('input', () => { state.box.orientStartZ = parseFloat(boxOrientStartZInput.value) || 0; fullUpdate(); });
    boxOrientEndXInput.addEventListener('input', () => { state.box.orientEndX = parseFloat(boxOrientEndXInput.value) || 0; fullUpdate(); });
    boxOrientEndYInput.addEventListener('input', () => { state.box.orientEndY = parseFloat(boxOrientEndYInput.value) || 0; fullUpdate(); });
    boxOrientEndZInput.addEventListener('input', () => { state.box.orientEndZ = parseFloat(boxOrientEndZInput.value) || 0; fullUpdate(); });
    
    boxRotateAllStartInput.addEventListener('input', () => { state.box.rotateAllStartStr = boxRotateAllStartInput.value; fullUpdate(); });
    boxRotateFirstEndInput.addEventListener('input', () => { state.box.rotateFirstEndStr = boxRotateFirstEndInput.value; fullUpdate(); });
    boxRotateLastEndInput.addEventListener('input', () => { state.box.rotateLastEndStr = boxRotateLastEndInput.value; fullUpdate(); });
    boxRotateStartXInput.addEventListener('input', () => { state.box.rotateStartX = parseFloat(boxRotateStartXInput.value) || 0; fullUpdate(); });
    boxRotateStartYInput.addEventListener('input', () => { state.box.rotateStartY = parseFloat(boxRotateStartYInput.value) || 0; fullUpdate(); });
    boxRotateStartZInput.addEventListener('input', () => { state.box.rotateStartZ = parseFloat(boxRotateStartZInput.value) || 0; fullUpdate(); });
    boxRotateEndXInput.addEventListener('input', () => { state.box.rotateEndX = parseFloat(boxRotateEndXInput.value) || 0; fullUpdate(); });
    boxRotateEndYInput.addEventListener('input', () => { state.box.rotateEndY = parseFloat(boxRotateEndYInput.value) || 0; fullUpdate(); });
    boxRotateEndZInput.addEventListener('input', () => { state.box.rotateEndZ = parseFloat(boxRotateEndZInput.value) || 0; fullUpdate(); });

    boxOrientEasingBtn.addEventListener('click', () => {
      currentEditingTarget = 'box-orient';
      graphIframe.style.display = 'block';
      graphIframe2.style.display = 'none';
      graphModal.style.display = 'flex';
    });

    boxRotateEasingBtn.addEventListener('click', () => {
      currentEditingTarget = 'box-rotate';
      graphIframe.style.display = 'none';
      graphIframe2.style.display = 'block';
      graphModal.style.display = 'flex';
    });
  }

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
