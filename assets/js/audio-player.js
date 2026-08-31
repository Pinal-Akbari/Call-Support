/**
 * RootTech Telephony - Universal Popup & Background Floating Audio Player
 * Supports modal popup, live waveform animation, background audio playback on minimize,
 * seekbar scrubber, speed toggle, volume control, and direct download.
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
                <div class="audio-progress-fill" id="playerProgressFill"></div>
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
                <button type="button" class="audio-skip-btn" onclick="skipAudio(-10)" title="Rewind 10 seconds">
                  <i class="fa-solid fa-rotate-left"></i>
                </button>
                <button type="button" class="audio-play-big-btn" id="playerPlayBigBtn" onclick="toggleAudioPlayback()" title="Play / Pause">
                  <i class="fa-solid fa-play" id="playerPlayIcon"></i>
                </button>
                <button type="button" class="audio-skip-btn" onclick="skipAudio(10)" title="Forward 10 seconds">
                  <i class="fa-solid fa-rotate-right"></i>
                </button>
              </div>

              <!-- Volume Control -->
              <div class="audio-volume-wrap">
                <button type="button" class="audio-ctrl-btn" onclick="toggleAudioMute()" title="Mute / Unmute" style="border:none; background:transparent;">
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
  }

  // State Management
  const speeds = [1.0, 1.25, 1.5, 2.0];
  let currentSpeedIndex = 0;
  let audioEl = null;

  function initAudioEventListeners() {
    audioEl = document.getElementById('globalAudioPlayerElement');
    if (!audioEl) return;

    audioEl.addEventListener('play', () => {
      updatePlayState(true);
    });

    audioEl.addEventListener('pause', () => {
      updatePlayState(false);
    });

    audioEl.addEventListener('ended', () => {
      updatePlayState(false);
      const fill = document.getElementById('playerProgressFill');
      if (fill) fill.style.width = '100%';
    });

    audioEl.addEventListener('timeupdate', () => {
      if (!audioEl || isNaN(audioEl.duration)) return;
      const current = audioEl.currentTime;
      const duration = audioEl.duration;
      const percent = duration > 0 ? (current / duration) * 100 : 0;

      const fill = document.getElementById('playerProgressFill');
      if (fill) fill.style.width = `${percent}%`;

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
    });

    audioEl.addEventListener('loadedmetadata', () => {
      if (!audioEl) return;
      const durText = formatTime(audioEl.duration);
      const elDur = document.getElementById('playerTotalDuration');
      const elFloatDur = document.getElementById('floatingDuration');
      if (elDur) elDur.textContent = durText;
      if (elFloatDur) elFloatDur.textContent = durText;
    });

    audioEl.addEventListener('error', (err) => {
      console.warn('Audio playback notice:', err);
      if (typeof window.showToast === 'function') {
        window.showToast('Audio stream loaded or connecting to PBX gateway...', 'info');
      }
    });

    // Keyboard controls: Space to play/pause, Esc to close
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('audioPlayerModal');
      const floatBar = document.getElementById('audioPlayerFloatingBar');
      const isVisible = (modal && !modal.classList.contains('hidden')) || (floatBar && !floatBar.classList.contains('hidden'));

      if (isVisible && e.key === 'Escape') {
        closeAudioPlayer();
      }
    });
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
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
      audioEl.play().catch(e => {
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
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.src = '';
    }

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
    if (!audioEl || isNaN(audioEl.duration)) return;
    const bar = document.getElementById('playerProgressBar');
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, clickX / width));
    audioEl.currentTime = percent * audioEl.duration;
  };

  // Skip Forward / Backward in Seconds
  window.skipAudio = function (seconds) {
    if (!audioEl) return;
    audioEl.currentTime = Math.max(0, Math.min(audioEl.duration || 0, audioEl.currentTime + seconds));
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
