/**
 * RootTech Telephony - Universal Popup & Background Floating Audio Player
 * Supports modal popup, live waveform animation, background audio playback on minimize,
 * 60fps seekbar scrubber, live drag-seek, forward/rewind controls, speed toggle, volume control, and direct download.
 */

(function () {
  'use strict';

  // Inject Audio Player markup into the DOM if not already present
  function injectAudioPlayerMarkup() {
    if (document.getElementById('audioPlayerModal')) return;

    // Generate 24 animated wave bars for the visualizer
    let waveBarsHtml = '';
    for (let i = 0; i < 24; i++) {
      const delay = (i * 0.05).toFixed(2);
      const height = (8 + (i % 6) * 4);
      waveBarsHtml += `<div class="wave-bar" style="animation-delay:${delay}s; height:${height}px;"></div>`;
    }

    const container = document.createElement('div');
    container.id = 'audioPlayerRoot';
    container.innerHTML = `
      <!-- HIDDEN GLOBAL HTML5 AUDIO ELEMENT -->
      <audio id="globalAudioPlayerElement" preload="auto"></audio>

      <!-- FULL AUDIO PLAYER MODAL POPUP -->
      <div id="audioPlayerModal" class="audio-player-modal hidden" onclick="handleAudioModalBackdropClick(event)">
        <div class="audio-player-card" id="audioPlayerCard">
          
          <!-- Header -->
          <div class="audio-player-header">
            <div class="audio-player-title-wrap">
              <div class="audio-player-icon">
                <i class="fa-solid fa-headphones"></i>
              </div>
              <div>
                <div style="font-size:14px; font-weight:700; color:var(--text-bright); display:flex; align-items:center; gap:8px;">
                  <span>Call Recording</span>
                  <span id="playerCallBadge" class="badge badge-purple" style="font-size:10px;">#0</span>
                </div>
                <div style="font-size:11px; color:var(--text-dim);" id="playerHeaderSubtitle">RootTech Telephony Storage</div>
              </div>
            </div>
            
            <div class="audio-player-header-actions">
              <button type="button" class="audio-ctrl-btn minimize-btn" onclick="minimizeAudioPlayer()" title="Minimize & Play in Background (_)">
                <i class="fa-solid fa-minus"></i>
              </button>
              <a id="playerDownloadBtn" href="#" download="recording.wav" target="_blank" class="audio-ctrl-btn" title="Download Audio WAV">
                <i class="fa-solid fa-download"></i>
              </a>
              <button type="button" class="audio-ctrl-btn close-btn" onclick="closeAudioPlayer()" title="Close Audio (Esc)">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="audio-player-body">
            
            <!-- Metadata Card -->
            <div class="audio-meta-card">
              <div class="audio-meta-grid">
                <div class="audio-meta-item">
                  <span class="audio-meta-label"><i class="fa-solid fa-phone-volume"></i> Caller</span>
                  <span class="audio-meta-value" id="playerCallerNum">-</span>
                </div>
                <div class="audio-meta-item">
                  <span class="audio-meta-label"><i class="fa-solid fa-arrow-right-to-bracket"></i> Destination</span>
                  <span class="audio-meta-value" id="playerDestNum">-</span>
                </div>
                <div class="audio-meta-item">
                  <span class="audio-meta-label"><i class="fa-solid fa-hashtag"></i> Booking / ID</span>
                  <span class="audio-meta-value" id="playerBookingId">-</span>
                </div>
                <div class="audio-meta-item">
                  <span class="audio-meta-label"><i class="fa-regular fa-clock"></i> Date & Time</span>
                  <span class="audio-meta-value" id="playerCallTime">-</span>
                </div>
              </div>
            </div>

            <!-- Waveform Animation -->
            <div class="audio-waveform-container" id="playerWaveContainer">
              ${waveBarsHtml}
            </div>

            <!-- Progress Bar / Scrubber -->
            <div class="audio-progress-wrap">
              <div class="audio-progress-bar" id="playerProgressBar" onclick="handleSeekbarClick(event)">
                <div class="audio-progress-fill" id="playerProgressFill">
                  <div class="audio-progress-handle" id="playerProgressHandle"></div>
                </div>
              </div>
              <div class="audio-time-row">
                <span id="playerCurrentTime">00:00</span>
                <span id="playerTotalDuration">00:00</span>
              </div>
            </div>

            <!-- Controls Row -->
            <div class="audio-controls-row">
              
              <!-- Speed Selector -->
              <div>
                <button type="button" class="audio-speed-btn" id="playerSpeedBtn" onclick="cyclePlaybackSpeed()" title="Change Playback Speed">
                  1.0x
                </button>
              </div>

              <!-- Main Playback Actions -->
              <div class="audio-main-actions">
                <button type="button" class="audio-skip-btn" onclick="skipAudio(-10)" title="Rewind 10 seconds (Left Arrow)">
                  <i class="fa-solid fa-rotate-left"></i>
                </button>
                <button type="button" class="audio-play-big-btn" id="playerPlayBigBtn" onclick="toggleAudioPlayback()" title="Play / Pause (Space)">
                  <i class="fa-solid fa-play" id="playerPlayIcon"></i>
                </button>
                <button type="button" class="audio-skip-btn" onclick="skipAudio(10)" title="Forward 10 seconds (Right Arrow)">
                  <i class="fa-solid fa-rotate-right"></i>
                </button>
              </div>

              <!-- Volume Control -->
              <div class="audio-volume-wrap">
                <button type="button" class="audio-ctrl-btn" onclick="toggleAudioMute()" title="Mute / Unmute (M)" style="border:none; background:transparent;">
                  <i class="fa-solid fa-volume-high" id="playerVolumeIcon"></i>
                </button>
                <input type="range" class="audio-volume-slider" id="playerVolumeSlider" min="0" max="1" step="0.05" value="1" oninput="handleVolumeChange(event)" title="Volume">
              </div>

            </div>

          </div>
        </div>
      </div>

      <!-- FLOATING MINIMIZED PLAYER BAR (BACKGROUND PLAYBACK) -->
      <div id="audioPlayerFloatingBar" class="audio-floating-bar hidden">
        <div class="floating-eq-mini" id="floatingEqMini">
          <div class="floating-eq-bar" style="animation-delay:0s;"></div>
          <div class="floating-eq-bar" style="animation-delay:0.2s;"></div>
          <div class="floating-eq-bar" style="animation-delay:0.4s;"></div>
        </div>

        <div class="floating-info-click" onclick="restoreAudioPlayer()" title="Click to Expand Full Player">
          <div class="floating-title" id="floatingTitle">Call Recording</div>
          <div class="floating-time"><span id="floatingCurrentTime">00:00</span> / <span id="floatingDuration">00:00</span></div>
        </div>

        <button type="button" class="floating-play-btn" onclick="toggleAudioPlayback()" title="Play / Pause">
          <i class="fa-solid fa-play" id="floatingPlayIcon"></i>
        </button>

        <button type="button" class="floating-action-btn" onclick="restoreAudioPlayer()" title="Expand Full View">
          <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
        </button>

        <button type="button" class="floating-action-btn" onclick="closeAudioPlayer()" title="Close Player">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;

    document.body.appendChild(container);
    initAudioEventListeners();
    attachScrubberDragListeners();
  }

  // State Management
  const speeds = [1.0, 1.25, 1.5, 2.0];
  let currentSpeedIndex = 0;
  let audioEl = null;
  let currentTrackDuration = 30;
  let animFrameId = null;
  let progressTimer = null;
  let isDraggingScrubber = false;

  function parseDurationSeconds(val) {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isFinite(val) && val > 0 ? val : 0;
    if (typeof val === 'string') {
      val = val.trim().replace(/s$/i, '');
      if (val.includes(':')) {
        const parts = val.split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return parts[0] * 60 + parts[1];
        }
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num) && num > 0 ? num : 0;
    }
    return 0;
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function getEffectiveDuration() {
    if (audioEl && audioEl.duration && isFinite(audioEl.duration) && audioEl.duration > 0) {
      currentTrackDuration = audioEl.duration;
    }
    return currentTrackDuration > 0 ? currentTrackDuration : 30;
  }

  function updateProgress() {
    if (!audioEl || isDraggingScrubber) return;
    const current = audioEl.currentTime || 0;
    const duration = getEffectiveDuration();

    const percent = duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;

    const fill = document.getElementById('playerProgressFill');
    if (fill) {
      fill.style.width = `${percent.toFixed(2)}%`;
    }

    const currText = formatTime(current);
    const durText = formatTime(duration);

    const elCurr = document.getElementById('playerCurrentTime');
    const elDur = document.getElementById('playerTotalDuration');
    const elFloatCurr = document.getElementById('floatingCurrentTime');
    const elFloatDur = document.getElementById('floatingDuration');

    if (elCurr) elCurr.textContent = currText;
    if (elDur) elDur.textContent = durText;
    if (elFloatCurr) elFloatCurr.textContent = currText;
    if (elFloatDur) elFloatDur.textContent = durText;
  }

  function progressLoop() {
    if (audioEl && !audioEl.paused && !isDraggingScrubber) {
      updateProgress();
      animFrameId = requestAnimationFrame(progressLoop);
    }
  }

  function startProgressTimer() {
    stopProgressTimer();
    animFrameId = requestAnimationFrame(progressLoop);
    progressTimer = setInterval(updateProgress, 60);
  }

  function stopProgressTimer() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function handleScrubMove(clientX) {
    const bar = document.getElementById('playerProgressBar');
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const width = rect.width || 1;
    const percent = Math.max(0, Math.min(1, clickX / width));

    const duration = getEffectiveDuration();
    const targetTime = percent * duration;

    // Immediate visual update during drag
    const fill = document.getElementById('playerProgressFill');
    if (fill) {
      fill.style.width = `${(percent * 100).toFixed(2)}%`;
    }
    const elCurr = document.getElementById('playerCurrentTime');
    if (elCurr) {
      elCurr.textContent = formatTime(targetTime);
    }

    return targetTime;
  }

  function attachScrubberDragListeners() {
    const bar = document.getElementById('playerProgressBar');
    if (!bar) return;

    // Mouse drag scrubbing
    bar.addEventListener('mousedown', (e) => {
      isDraggingScrubber = true;
      handleScrubMove(e.clientX);

      const onMouseMove = (moveEvt) => {
        if (isDraggingScrubber) {
          handleScrubMove(moveEvt.clientX);
        }
      };

      const onMouseUp = (upEvt) => {
        if (isDraggingScrubber) {
          isDraggingScrubber = false;
          const targetTime = handleScrubMove(upEvt.clientX);
          if (audioEl && typeof targetTime === 'number') {
            try {
              audioEl.currentTime = targetTime;
            } catch (_) {}
            updateProgress();
          }
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // Touch drag scrubbing for mobile/tablets
    bar.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        isDraggingScrubber = true;
        handleScrubMove(e.touches[0].clientX);
      }
    }, { passive: true });

    bar.addEventListener('touchmove', (e) => {
      if (isDraggingScrubber && e.touches && e.touches.length > 0) {
        handleScrubMove(e.touches[0].clientX);
      }
    }, { passive: true });

    bar.addEventListener('touchend', (e) => {
      if (isDraggingScrubber) {
        isDraggingScrubber = false;
        if (e.changedTouches && e.changedTouches.length > 0) {
          const targetTime = handleScrubMove(e.changedTouches[0].clientX);
          if (audioEl && typeof targetTime === 'number') {
            try {
              audioEl.currentTime = targetTime;
            } catch (_) {}
            updateProgress();
          }
        }
      }
    });
  }

  function initAudioEventListeners() {
    audioEl = document.getElementById('globalAudioPlayerElement');
    if (!audioEl) return;

    audioEl.addEventListener('play', () => {
      updatePlayState(true);
      startProgressTimer();
    });

    audioEl.addEventListener('playing', () => {
      updatePlayState(true);
      startProgressTimer();
    });

    audioEl.addEventListener('pause', () => {
      updatePlayState(false);
      stopProgressTimer();
      updateProgress();
    });

    audioEl.addEventListener('ended', () => {
      updatePlayState(false);
      stopProgressTimer();
      const fill = document.getElementById('playerProgressFill');
      if (fill) fill.style.width = '100%';
      const elCurr = document.getElementById('playerCurrentTime');
      const elDur = document.getElementById('playerTotalDuration');
      if (elCurr && elDur) elCurr.textContent = elDur.textContent;
    });

    audioEl.addEventListener('timeupdate', () => {
      updateProgress();
    });

    const handleDurationUpdate = () => {
      if (!audioEl) return;
      if (audioEl.duration && isFinite(audioEl.duration) && audioEl.duration > 0) {
        currentTrackDuration = audioEl.duration;
      }
      updateProgress();
    };

    audioEl.addEventListener('loadedmetadata', handleDurationUpdate);
    audioEl.addEventListener('durationchange', handleDurationUpdate);
    audioEl.addEventListener('canplay', handleDurationUpdate);

    audioEl.addEventListener('error', (err) => {
      console.warn('Audio playback notice:', err);
      stopProgressTimer();
    });

    // Universal Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('audioPlayerModal');
      const floatBar = document.getElementById('audioPlayerFloatingBar');
      const isVisible = (modal && !modal.classList.contains('hidden')) || (floatBar && !floatBar.classList.contains('hidden'));

      if (isVisible && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'Escape') {
          closeAudioPlayer();
        } else if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          toggleAudioPlayback();
        } else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') {
          e.preventDefault();
          skipAudio(-5);
        } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          skipAudio(5);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          changeVolumeRelative(0.1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          changeVolumeRelative(-0.1);
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          toggleAudioMute();
        }
      }
    });
  }

  function changeVolumeRelative(delta) {
    if (!audioEl) return;
    const newVol = Math.max(0, Math.min(1, (audioEl.volume || 1) + delta));
    audioEl.volume = newVol;
    audioEl.muted = (newVol === 0);
    const slider = document.getElementById('playerVolumeSlider');
    if (slider) slider.value = newVol;
    updateVolumeIcon(newVol);
  }

  function updatePlayState(isPlaying) {
    const card = document.getElementById('audioPlayerCard');
    const floatBar = document.getElementById('audioPlayerFloatingBar');
    const playIcon = document.getElementById('playerPlayIcon');
    const floatPlayIcon = document.getElementById('floatingPlayIcon');

    if (isPlaying) {
      if (card) card.classList.add('playing');
      if (floatBar) floatBar.classList.add('playing');
      if (playIcon) playIcon.className = 'fa-solid fa-pause';
      if (floatPlayIcon) floatPlayIcon.className = 'fa-solid fa-pause';
    } else {
      if (card) card.classList.remove('playing');
      if (floatBar) floatBar.classList.remove('playing');
      if (playIcon) playIcon.className = 'fa-solid fa-play';
      if (floatPlayIcon) floatPlayIcon.className = 'fa-solid fa-play';
    }
  }

  // Universal Public API: Open Audio Player Modal
  window.openAudioPlayer = function (audioUrl, meta = {}) {
    injectAudioPlayerMarkup();
    if (!audioEl) audioEl = document.getElementById('globalAudioPlayerElement');

    // Reset & Initialize Duration
    stopProgressTimer();
    const parsedDur = parseDurationSeconds(meta.duration || meta.dur || 0);
    currentTrackDuration = parsedDur > 0 ? parsedDur : 30;

    const fill = document.getElementById('playerProgressFill');
    if (fill) fill.style.width = '0%';
    const elCurr = document.getElementById('playerCurrentTime');
    const elDur = document.getElementById('playerTotalDuration');
    const elFloatCurr = document.getElementById('floatingCurrentTime');
    const elFloatDur = document.getElementById('floatingDuration');
    if (elCurr) elCurr.textContent = '00:00';
    if (elDur) elDur.textContent = formatTime(currentTrackDuration);
    if (elFloatCurr) elFloatCurr.textContent = '00:00';
    if (elFloatDur) elFloatDur.textContent = formatTime(currentTrackDuration);

    // Populate Metadata
    const callBadge = document.getElementById('playerCallBadge');
    const callerEl = document.getElementById('playerCallerNum');
    const destEl = document.getElementById('playerDestNum');
    const bookingEl = document.getElementById('playerBookingId');
    const timeEl = document.getElementById('playerCallTime');
    const subtitleEl = document.getElementById('playerHeaderSubtitle');
    const downloadBtn = document.getElementById('playerDownloadBtn');
    const floatTitle = document.getElementById('floatingTitle');

    const callId = meta.id || meta.play_id || '0';
    const caller = meta.caller || meta.caller_number || '-';
    const dest = meta.destination || meta.destination_number || '-';
    const booking = meta.bookingId || meta.booking_id || 'N/A';
    const time = meta.time || meta.start_time || new Date().toLocaleString();

    if (callBadge) callBadge.textContent = `#${callId}`;
    if (callerEl) callerEl.textContent = caller;
    if (destEl) destEl.textContent = dest;
    if (bookingEl) bookingEl.textContent = booking;
    if (timeEl) timeEl.textContent = time;
    if (subtitleEl) subtitleEl.textContent = `${caller} ➔ ${dest}`;
    if (downloadBtn) {
      downloadBtn.href = audioUrl;
      downloadBtn.download = `call_recording_${callId}.wav`;
    }
    if (floatTitle) {
      floatTitle.textContent = `Call #${callId}: ${caller}`;
    }

    // Set Audio Source & Start Playback
    if (audioEl) {
      audioEl.src = audioUrl;
      audioEl.playbackRate = speeds[currentSpeedIndex];
      audioEl.currentTime = 0;
      audioEl.play().then(() => {
        updatePlayState(true);
        startProgressTimer();
      }).catch(e => {
        console.log('Autoplay deferred until user interaction:', e);
      });
    }

    // Display Popup Modal & Hide Minimized Bar
    const modal = document.getElementById('audioPlayerModal');
    const floatBar = document.getElementById('audioPlayerFloatingBar');

    if (modal) modal.classList.remove('hidden');
    if (floatBar) floatBar.classList.add('hidden');
  };

  // Minimize Audio Player: Hides Modal, Shows Floating Bar, Audio Continues in Background!
  window.minimizeAudioPlayer = function () {
    const modal = document.getElementById('audioPlayerModal');
    const floatBar = document.getElementById('audioPlayerFloatingBar');

    if (modal) modal.classList.add('hidden');
    if (floatBar) floatBar.classList.remove('hidden');

    if (typeof window.showToast === 'function') {
      window.showToast('Audio playing in background. Click floating widget to expand.', 'info');
    }
  };

  // Restore Audio Player from Minimized Floating Bar
  window.restoreAudioPlayer = function () {
    const modal = document.getElementById('audioPlayerModal');
    const floatBar = document.getElementById('audioPlayerFloatingBar');

    if (modal) modal.classList.remove('hidden');
    if (floatBar) floatBar.classList.add('hidden');
  };

  // Close Audio Player Completely
  window.closeAudioPlayer = function () {
    stopProgressTimer();
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.src = '';
    }

    const fill = document.getElementById('playerProgressFill');
    if (fill) fill.style.width = '0%';
    const elCurr = document.getElementById('playerCurrentTime');
    const elDur = document.getElementById('playerTotalDuration');
    if (elCurr) elCurr.textContent = '00:00';
    if (elDur) elDur.textContent = '00:00';

    const modal = document.getElementById('audioPlayerModal');
    const floatBar = document.getElementById('audioPlayerFloatingBar');

    if (modal) modal.classList.add('hidden');
    if (floatBar) floatBar.classList.add('hidden');
    updatePlayState(false);
  };

  // Toggle Play / Pause
  window.toggleAudioPlayback = function () {
    if (!audioEl) return;
    if (audioEl.paused) {
      audioEl.play().catch(console.error);
    } else {
      audioEl.pause();
    }
  };

  // Seekbar Click / Scrub
  window.handleSeekbarClick = function (e) {
    if (!audioEl) return;
    const targetTime = handleScrubMove(e.clientX);
    if (typeof targetTime === 'number') {
      try {
        audioEl.currentTime = targetTime;
      } catch (err) {
        console.warn('Seek error:', err);
      }
      updateProgress();
    }
  };

  // Skip Forward / Backward in Seconds (+10s or -10s)
  window.skipAudio = function (seconds) {
    if (!audioEl) return;
    const duration = getEffectiveDuration();
    const cur = audioEl.currentTime || 0;
    const target = Math.max(0, Math.min(duration, cur + seconds));
    
    try {
      audioEl.currentTime = target;
    } catch (err) {
      console.warn('Skip error:', err);
    }
    updateProgress();
  };

  // Cycle Playback Speed (1.0x, 1.25x, 1.5x, 2.0x)
  window.cyclePlaybackSpeed = function () {
    if (!audioEl) return;
    currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
    const speed = speeds[currentSpeedIndex];
    audioEl.playbackRate = speed;
    const btn = document.getElementById('playerSpeedBtn');
    if (btn) btn.textContent = `${speed}x`;
  };

  // Volume Change
  window.handleVolumeChange = function (e) {
    if (!audioEl) return;
    const val = parseFloat(e.target.value);
    audioEl.volume = val;
    audioEl.muted = (val === 0);
    updateVolumeIcon(val);
  };

  // Toggle Mute
  window.toggleAudioMute = function () {
    if (!audioEl) return;
    audioEl.muted = !audioEl.muted;
    const slider = document.getElementById('playerVolumeSlider');
    if (slider) slider.value = audioEl.muted ? 0 : audioEl.volume;
    updateVolumeIcon(audioEl.muted ? 0 : audioEl.volume);
  };

  function updateVolumeIcon(vol) {
    const icon = document.getElementById('playerVolumeIcon');
    if (!icon) return;
    if (vol === 0) {
      icon.className = 'fa-solid fa-volume-xmark';
    } else if (vol < 0.5) {
      icon.className = 'fa-solid fa-volume-low';
    } else {
      icon.className = 'fa-solid fa-volume-high';
    }
  }

  // Backdrop click closes or minimizes
  window.handleAudioModalBackdropClick = function (e) {
    if (e.target.id === 'audioPlayerModal') {
      minimizeAudioPlayer();
    }
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAudioPlayerMarkup);
  } else {
    injectAudioPlayerMarkup();
  }

})();
