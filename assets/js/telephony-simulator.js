/**
 * RootTech In-Browser Telephony Simulator & Audio Synthesis Engine
 * Features:
 *  - Native Web Audio API Dual-Frequency Telephone Ringing (440Hz + 480Hz)
 *  - Real-Time Inbound Screen-Pop Popup
 *  - Comprehensive Caller 360° In-Call History & Past Conversation Timeline
 *  - Live Agent Notes & Call Disposition Logging (Instant API Save)
 *  - Floating Call Controls (Live Timer, Mute, Hold, Hangup)
 *  - Call Recording Playback Simulation
 */

class TelephonySimulator {
  constructor() {
    this.audioCtx = null;
    this.isRinging = false;
    this.ringInterval = null;

    this.activeCall = null;
    this.callTimerInterval = null;
    this.callDurationSec = 0;

    this.mode = localStorage.getItem('pbx_telephony_mode') || 'simulator';
  }

  // Initialize Web Audio Context on user gesture
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Dual-frequency phone ring generator (440Hz + 480Hz standard PBX tone)
  startRinging() {
    if (this.isRinging) return;
    const ctx = this.getAudioContext();
    this.isRinging = true;

    if (!ctx) return;

    const playRingBurst = () => {
      if (!this.isRinging) return;
      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + 1.8);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 2.0);
        osc2.stop(ctx.currentTime + 2.0);
      } catch (e) {
        console.warn('AudioContext error:', e);
      }
    };

    playRingBurst();
    this.ringInterval = setInterval(playRingBurst, 4000);
  }

  stopRinging() {
    this.isRinging = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  // Play short connect / hangup beep
  playTone(freq = 600, duration = 0.2) {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  // Toggle Mode (Live PBX vs Simulator)
  toggleMode() {
    const newMode = (this.mode === 'simulator') ? 'live' : 'simulator';
    this.setMode(newMode);
  }

  setMode(mode) {
    this.mode = mode;
    localStorage.setItem('pbx_telephony_mode', mode);
    this.updateModeBadge();
    if (typeof showToast === 'function') {
      showToast('Telephony Mode switched to: ' + (mode === 'simulator' ? 'SIMULATOR / SANDBOX' : 'LIVE PBX GATEWAY'), 'info');
    }
  }

  isSimulator() {
    return this.mode === 'simulator';
  }

  updateModeBadge() {
    const badge = document.getElementById('telephonyModeBadge');
    if (badge) {
      if (this.mode === 'simulator') {
        badge.innerHTML = `
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-amber); box-shadow:0 0 6px var(--accent-amber); animation: pulse 1.5s infinite;"></span>
          <span style="font-size: 11px; color: var(--accent-amber); font-weight: 700;">Simulator Active</span>
        `;
        badge.setAttribute('title', 'Browser Telephony Simulator is ACTIVE (No Zoiper required). Click to toggle Live PBX.');
      } else {
        badge.innerHTML = `
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-emerald); box-shadow:0 0 6px var(--accent-emerald);"></span>
          <span style="font-size: 11px; color: var(--accent-emerald); font-weight: 600;">Live PBX Gateway</span>
        `;
        badge.setAttribute('title', 'Live Asterisk Gateway Active. Click to switch to Simulator Mode.');
      }
    }
  }

  // Trigger Simulated Inbound Call (Screen-Pop + Ringing)
  simulateInboundCall(options = {}) {
    const callerNumber = options.callerNumber || ('9198765' + Math.floor(10000 + Math.random() * 90000));
    const customerName = options.customerName || 'Priya Sharma';
    const maidName = options.maidName || 'Sunita Devi';
    const bookingId = options.bookingId || ('BK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
    const didNumber = options.didNumber || '912612385555';

    this.activeCall = {
      direction: 'inbound',
      callerNumber: callerNumber,
      customerName: customerName,
      maidName: maidName,
      bookingId: bookingId,
      didNumber: didNumber,
      startTime: new Date()
    };

    // Start Audio Ringing Tone in Browser
    this.startRinging();

    // Render & Open Screen-Pop Modal
    this.showInboundScreenPop(this.activeCall);
  }

  // Render Inbound Call Screen-Pop UI
  showInboundScreenPop(callData) {
    let modal = document.getElementById('simInboundModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'simInboundModal';
      modal.className = 'modal-overlay open';
      modal.style.zIndex = '9999';
      document.body.appendChild(modal);
    }

    const safeCaller = this.escapeHtml(callData.callerNumber);
    const safeCust = this.escapeHtml(callData.customerName);
    const safeBooking = this.escapeHtml(callData.bookingId);
    const safeDid = this.escapeHtml(callData.didNumber);

    modal.innerHTML = `
      <div class="glass-panel modal-box" style="max-width: 460px; border-top: 4px solid var(--accent-emerald); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--badge-emerald-bg); color: var(--accent-emerald); display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 12px; animation: pulse 1.2s infinite;">
            <i class="fa-solid fa-phone-volume"></i>
          </div>
          <h3 style="margin: 0; color: var(--text-bright); font-size: 18px; font-weight: 700;">Incoming Customer Call</h3>
          <p style="margin: 4px 0 0 0; color: var(--accent-emerald); font-size: 12px; font-weight: 600;">Queue: root-support &bull; Ringing Extension 1001</p>
        </div>

        <div style="background: var(--bg-card-hover); border-radius: var(--radius-md); padding: 14px 16px; border: 1px solid var(--border-glass); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: var(--text-muted);">Caller DID Mask:</span>
            <span style="font-weight: 600; color: var(--text-bright); font-family: monospace;">${safeDid}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: var(--text-muted);">Customer:</span>
            <span style="font-weight: 600; color: var(--accent-cyan);">${safeCust}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
            <span style="color: var(--text-muted);">Phone Number:</span>
            <span style="font-weight: 600; color: var(--text-bright); font-family: monospace;">${safeCaller}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: var(--text-muted);">Booking ID:</span>
            <span class="badge badge-purple">${safeBooking}</span>
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button type="button" class="btn btn-primary" onclick="telephonySimulator.answerCall()" style="flex: 1; background: var(--accent-emerald); border-color: var(--accent-emerald); padding: 12px; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <i class="fa-solid fa-phone"></i>
            <span>Answer Call</span>
          </button>
          <button type="button" class="btn btn-danger" onclick="telephonySimulator.rejectCall()" style="flex: 1; padding: 12px; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <i class="fa-solid fa-phone-slash"></i>
            <span>Decline</span>
          </button>
        </div>
      </div>
    `;

    modal.classList.add('open');
    modal.style.display = 'flex';
  }

  // Answer Inbound or Outbound Call -> Opens Full Caller 360° Live Modal
  answerCall() {
    this.stopRinging();
    this.playTone(880, 0.15);

    const modal = document.getElementById('simInboundModal');
    if (modal) {
      modal.remove();
    }

    this.callDurationSec = 0;
    this.openCaller360Modal(this.activeCall);

    this.callTimerInterval = setInterval(() => {
      this.callDurationSec++;
      const mins = String(Math.floor(this.callDurationSec / 60)).padStart(2, '0');
      const secs = String(this.callDurationSec % 60).padStart(2, '0');
      const timerEl = document.getElementById('sim360CallTimer');
      if (timerEl) {
        timerEl.textContent = `${mins}:${secs}`;
      }
    }, 1000);

    if (typeof showToast === 'function') {
      showToast('Call Connected! Caller 360° Profile & Notes Loaded.', 'success');
    }
  }

  // Open Full Screen Caller 360° Interactive Panel
  async openCaller360Modal(callData) {
    let modal = document.getElementById('simCaller360Modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'simCaller360Modal';
      modal.className = 'modal-overlay open';
      modal.style.zIndex = '9998';
      document.body.appendChild(modal);
    }

    const safeCust = this.escapeHtml((callData && callData.customerName) || 'Priya Sharma');
    const safeCaller = this.escapeHtml((callData && callData.callerNumber) || '919876543210');
    const safeBooking = this.escapeHtml((callData && callData.bookingId) || 'BK-2026-9812');
    const safeDid = this.escapeHtml((callData && callData.didNumber) || '912612385555');

    modal.innerHTML = `
      <div class="glass-panel modal-box" style="width: 95vw; max-width: 960px; max-height: 90vh; overflow-y: auto; padding: 24px; border-top: 4px solid var(--accent-emerald); box-shadow: 0 25px 60px rgba(0,0,0,0.6);">
        
        <!-- Top Live Call Status Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; padding-bottom: 18px; border-bottom: 1px solid var(--border-glass); margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--badge-emerald-bg); color: var(--accent-emerald); display: flex; align-items: center; justify-content: center; font-size: 20px; animation: pulse 1.5s infinite;">
              <i class="fa-solid fa-headset"></i>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h3 style="margin: 0; color: var(--text-bright); font-size: 18px; font-weight: 700;">Active Call: ${safeCust}</h3>
                <span class="badge badge-emerald"><i class="fa-solid fa-signal"></i> LIVE</span>
              </div>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                Caller: <strong style="color:var(--text-bright);">${safeCaller}</strong> &bull; DID: <strong>${safeDid}</strong> &bull; Booking: <span class="badge badge-purple">${safeBooking}</span>
              </div>
            </div>
          </div>

          <!-- Live Timer & In-Call Buttons -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-family: monospace; font-size: 18px; font-weight: 700; color: var(--accent-emerald); background: var(--bg-card-hover); padding: 6px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-glass);" id="sim360CallTimer">
              00:00
            </div>

            <button type="button" class="btn btn-secondary btn-sm" onclick="telephonySimulator.toggleMute(this)" title="Mute Microphone">
              <i class="fa-solid fa-microphone"></i>
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="telephonySimulator.toggleHold(this)" title="Hold Call">
              <i class="fa-solid fa-pause"></i>
            </button>
            <button type="button" class="btn btn-danger" onclick="telephonySimulator.endCall()" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-weight: 600;">
              <i class="fa-solid fa-phone-slash"></i>
              <span>End Call</span>
            </button>
          </div>
        </div>

        <!-- Main 2-Column Workspace Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px;">
          
          <!-- LEFT COLUMN: CALL HISTORY TIMELINE -->
          <div style="background: var(--bg-card-hover); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--border-glass);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--text-bright); display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-timeline" style="color: var(--accent-cyan);"></i>
                Past Call History & Recordings
              </h4>
              <span class="badge badge-cyan" id="sim360CallCount">Loading...</span>
            </div>

            <div id="sim360CallsTimeline" style="display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow-y: auto; padding-right: 4px;">
              <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                <div class="spinner" style="margin: 0 auto 8px;"></div> Fetching caller records...
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: AGENT NOTES & DISPOSITION -->
          <div style="background: var(--bg-card-hover); border-radius: var(--radius-md); padding: 18px; border: 1px solid var(--border-glass); display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--text-bright); display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-clipboard-list" style="color: var(--accent-purple);"></i>
                Agent Interaction Notes & Remarks
              </h4>
            </div>

            <!-- Historical Notes Feed -->
            <div id="sim360NotesFeed" style="display: flex; flex-direction: column; gap: 10px; max-height: 220px; overflow-y: auto; margin-bottom: 16px; padding-right: 4px;">
              <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                <div class="spinner" style="margin: 0 auto 8px;"></div> Loading past notes...
              </div>
            </div>

            <!-- Live Note Taking Form -->
            <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-glass);">
              <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <div style="flex: 1;">
                  <label class="form-label" style="font-size: 11px; margin-bottom: 4px;">Call Disposition</label>
                  <select id="simNoteDisposition" class="form-input" style="padding: 6px 10px; font-size: 12px;">
                    <option value="Call Resolved">✅ Call Resolved / Query Answered</option>
                    <option value="Information Provided">ℹ️ Information Provided</option>
                    <option value="Payment Confirmed">💳 Payment / Booking Confirmed</option>
                    <option value="Follow-up Required">⏳ Follow-up Required</option>
                    <option value="Callback Requested">📞 Callback Requested</option>
                    <option value="Complaint Logged">⚠️ Complaint / Escalation</option>
                  </select>
                </div>
              </div>

              <div style="margin-bottom: 10px;">
                <label class="form-label" style="font-size: 11px; margin-bottom: 4px;">Live Call Notes</label>
                <textarea id="simNoteText" class="form-input" rows="2" placeholder="Type key remarks or customer requests here..." style="font-size: 12px; resize: vertical;"></textarea>
              </div>

              <button type="button" class="btn btn-primary btn-sm" onclick="telephonySimulator.saveCallerNote()" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Save Note to Caller Profile</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    `;

    modal.classList.add('open');
    modal.style.display = 'flex';

    // Fetch live caller history & notes from API
    this.fetchCallerHistory(safeCaller);
  }

  // Fetch Caller History from API
  async fetchCallerHistory(phone) {
    const timelineEl = document.getElementById('sim360CallsTimeline');
    const notesFeedEl = document.getElementById('sim360NotesFeed');
    const countEl = document.getElementById('sim360CallCount');

    try {
      const res = await fetch(`api.php?action=caller_history&phone=${encodeURIComponent(phone)}`);
      const data = await res.json();

      if (data && data.success) {
        // 1. Render Past Calls Timeline
        if (countEl) countEl.textContent = `${(data.calls || []).length} Past Calls`;

        if (timelineEl) {
          if (!data.calls || data.calls.length === 0) {
            timelineEl.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:12px;">First time caller. No past calls.</div>`;
          } else {
            timelineEl.innerHTML = data.calls.map(c => `
              <div style="background:var(--bg-card); border-radius:var(--radius-sm); padding:10px 12px; border:1px solid var(--border-glass); font-size:12px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <strong style="color:var(--accent-cyan);">${this.escapeHtml(c.agent_name || 'Agent')}</strong>
                  <span class="badge badge-emerald" style="font-size:10px;">${this.escapeHtml(c.status || 'ANSWERED')}</span>
                </div>
                <div style="display:flex; justify-content:space-between; color:var(--text-muted); font-size:11px; margin-bottom:6px;">
                  <span><i class="fa-solid fa-calendar"></i> ${this.escapeHtml(c.datetime || '')}</span>
                  <span><i class="fa-solid fa-clock"></i> Duration: ${c.duration}s</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span class="badge badge-purple" style="font-size:10px;">${this.escapeHtml(c.direction || 'Inbound')}</span>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="telephonySimulator.playMockRecording('${this.escapeHtml(c.agent_name)}', ${c.duration})" style="padding:2px 8px; font-size:11px;">
                    <i class="fa-solid fa-play"></i> Play Audio
                  </button>
                </div>
              </div>
            `).join('');
          }
        }

        // 2. Render Past Notes Feed
        if (notesFeedEl) {
          if (!data.notes || data.notes.length === 0) {
            notesFeedEl.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:12px;">No past notes on this caller.</div>`;
          } else {
            notesFeedEl.innerHTML = data.notes.map(n => `
              <div style="background:var(--bg-card); border-radius:var(--radius-sm); padding:10px 12px; border-left:3px solid var(--accent-purple); border-top:1px solid var(--border-glass); border-right:1px solid var(--border-glass); border-bottom:1px solid var(--border-glass); font-size:12px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <strong style="color:var(--text-bright);">${this.escapeHtml(n.agent_name || 'Agent')}</strong>
                  <span class="badge badge-cyan" style="font-size:10px;">${this.escapeHtml(n.disposition || 'Note')}</span>
                </div>
                <p style="margin:4px 0 6px 0; color:var(--text-bright); font-size:12px; line-height:1.4;">${this.escapeHtml(n.note_text || '')}</p>
                <div style="font-size:10px; color:var(--text-muted); text-align:right;">
                  <i class="fa-solid fa-clock"></i> ${this.escapeHtml(n.timestamp || '')}
                </div>
              </div>
            `).join('');
          }
        }

      }
    } catch (e) {
      if (timelineEl) timelineEl.innerHTML = `<div style="color:#fca5a5; font-size:12px;">Error loading caller timeline.</div>`;
    }
  }

  // Save Agent Note via API
  async saveCallerNote() {
    const textEl = document.getElementById('simNoteText');
    const dispEl = document.getElementById('simNoteDisposition');
    const noteText = textEl ? textEl.value.trim() : '';
    const disposition = dispEl ? dispEl.value : 'Call Resolved';

    if (!noteText) {
      if (typeof showToast === 'function') showToast('Please enter note text before saving.', 'error');
      return;
    }

    const phone = (this.activeCall && this.activeCall.callerNumber) || '919876543210';
    const bookingId = (this.activeCall && this.activeCall.bookingId) || 'BK-2026-9812';

    try {
      const res = await fetch('api.php?action=save_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          booking_id: bookingId,
          disposition: disposition,
          note_text: noteText
        })
      });

      const data = await res.json();
      if (data && data.success) {
        if (typeof showToast === 'function') showToast('Note saved to Caller Profile!', 'success');
        if (textEl) textEl.value = '';

        // Append to feed immediately
        const feed = document.getElementById('sim360NotesFeed');
        if (feed) {
          const div = document.createElement('div');
          div.style.cssText = 'background:var(--bg-card); border-radius:var(--radius-sm); padding:10px 12px; border-left:3px solid var(--accent-emerald); border-top:1px solid var(--border-glass); border-right:1px solid var(--border-glass); border-bottom:1px solid var(--border-glass); font-size:12px; animation:fadeIn 0.3s ease;';
          div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong style="color:var(--accent-emerald);">You (Current Agent)</strong>
              <span class="badge badge-emerald" style="font-size:10px;">${this.escapeHtml(disposition)}</span>
            </div>
            <p style="margin:4px 0 6px 0; color:var(--text-bright); font-size:12px; line-height:1.4;">${this.escapeHtml(noteText)}</p>
            <div style="font-size:10px; color:var(--text-muted); text-align:right;">
              <i class="fa-solid fa-clock"></i> Just now
            </div>
          `;
          feed.insertBefore(div, feed.firstChild);
        }
      }
    } catch (e) {
      if (typeof showToast === 'function') showToast('Failed to save note.', 'error');
    }
  }

  toggleMute(btn) {
    const isMuted = btn.classList.toggle('btn-danger');
    btn.innerHTML = isMuted ? '<i class="fa-solid fa-microphone-slash"></i>' : '<i class="fa-solid fa-microphone"></i>';
    if (typeof showToast === 'function') {
      showToast(isMuted ? 'Microphone Muted' : 'Microphone Unmuted', 'info');
    }
  }

  toggleHold(btn) {
    const isHeld = btn.classList.toggle('btn-danger');
    btn.innerHTML = isHeld ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
    if (typeof showToast === 'function') {
      showToast(isHeld ? 'Call Placed on Hold' : 'Call Resumed', 'info');
    }
  }

  // End Active Call & Log to Activity Table
  endCall() {
    this.stopRinging();
    this.playTone(400, 0.2);

    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }

    const modal360 = document.getElementById('simCaller360Modal');
    if (modal360) modal360.remove();

    const modalInbound = document.getElementById('simInboundModal');
    if (modalInbound) modalInbound.remove();

    const duration = this.callDurationSec;
    if (typeof showToast === 'function') {
      showToast(`Call Ended. Duration: ${duration} seconds. Logged as ANSWERED.`, 'info');
    }

    // Add Simulated Record to UI Table if present
    this.appendMockCallRecord(this.activeCall, duration);
    this.activeCall = null;
  }

  rejectCall() {
    this.stopRinging();
    this.playTone(300, 0.3);

    const modal = document.getElementById('simInboundModal');
    if (modal) modal.remove();

    if (typeof showToast === 'function') {
      showToast('Call Declined / Rejected by Agent.', 'info');
    }
    this.activeCall = null;
  }

  // Outbound Click-to-Call Flow Simulation
  simulateOutboundCall(target = 'customer', bookingId = 'BK202600123') {
    if (typeof showToast === 'function') {
      showToast(`Initiating Outbound Call to ${target.toUpperCase()} for Booking ${bookingId}...`, 'info');
    }

    const targetNumber = (target === 'maid') ? '919123456789' : '919876543210';
    const targetLabel = (target === 'maid') ? 'Sunita Devi (Maid)' : 'Priya Sharma (Customer)';

    this.activeCall = {
      direction: 'outbound',
      callerNumber: targetNumber,
      customerName: targetLabel,
      bookingId: bookingId,
      didNumber: '912612385555',
      startTime: new Date()
    };

    // Simulate Softphone ringing first, then customer answers after 2.5s
    this.startRinging();

    setTimeout(() => {
      if (this.isRinging) {
        this.answerCall();
      }
    }, 2500);
  }

  // Prepend new call to Dashboard & Recordings Table
  appendMockCallRecord(callData, duration) {
    if (!callData) return;

    const tbody = document.getElementById('recordingsTableBody') || document.getElementById('overviewTableBody') || document.getElementById('recentCallsTableBody');
    if (!tbody) return;

    const now = new Date();
    const timeStr = now.toISOString().slice(0, 19).replace('T', ' ');

    const safeBooking = this.escapeHtml(callData.bookingId || 'BK-DEMO');
    const safeCaller = this.escapeHtml(callData.callerNumber || '');
    const safeName = this.escapeHtml(callData.customerName || '');

    const tr = document.createElement('tr');
    tr.style.animation = 'fadeIn 0.5s ease';
    tr.style.background = 'rgba(16, 185, 129, 0.05)';

    tr.innerHTML = `
      <td><span class="badge badge-purple">${safeBooking}</span></td>
      <td><strong>${safeCaller}</strong><br><small style="color:var(--accent-cyan);">${safeName}</small></td>
      <td><span class="badge badge-cyan">${callData.direction === 'inbound' ? 'Inbound' : 'Outbound'}</span></td>
      <td><span class="badge badge-emerald"><i class="fa-solid fa-circle-check"></i> ANSWERED</span></td>
      <td><b>${duration}s</b></td>
      <td style="font-size:12px; color:var(--text-muted);">${timeStr}</td>
      <td style="text-align:right;">
        <button type="button" class="btn btn-sm btn-primary" onclick="telephonySimulator.playMockRecording('${safeName}', ${duration})" title="Play Sample Audio">
          <i class="fa-solid fa-play"></i> Play
        </button>
      </td>
    `;

    tbody.insertBefore(tr, tbody.firstChild);
  }

  // Play Mock Recording Sample
  playMockRecording(name, duration) {
    this.playTone(520, 0.3);
    if (typeof showToast === 'function') {
      showToast(`Playing sample audio recording for ${name || 'Customer'} (${duration || 15}s)...`, 'success');
    }
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Global Singleton Instance
window.telephonySimulator = new TelephonySimulator();

// DOM Ready Mode Badge Binding
document.addEventListener('DOMContentLoaded', () => {
  if (window.telephonySimulator) {
    window.telephonySimulator.updateModeBadge();
  }
});