/**
 * Calendar Module - Calendar-Notes-Discord
 * Provides month grid, interactive day schedule (Agenda & Hour Timeline),
 * smart time selection with duration presets, and Discord alert settings.
 */

const Calendar = {
  currentDate: new Date(),
  selectedDate: new Date().toISOString().split('T')[0],
  dayViewMode: 'timeline', // 'timeline' or 'agenda'
  editingEventId: null,
  events: [],

  init() {
    this.loadEvents();
    this.renderMonth();
    this.selectDate(this.selectedDate);
  },

  loadEvents() {
    const saved = localStorage.getItem('calnotes_events');
    if (saved) {
      try {
        this.events = JSON.parse(saved);
      } catch (e) {
        this.events = [];
      }
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      this.events = [
        {
          id: 'evt-1',
          title: 'Design Sync & Feature Planning',
          date: todayStr,
          allDay: false,
          startTime: '09:30',
          endTime: '10:30',
          durationMinutes: 60,
          category: 'work',
          location: 'Discord Voice #dev-lounge',
          description: 'Review updated calendar UX and notes editor architecture.',
          notifyDiscord: true,
          discordAlertTime: '15m'
        },
        {
          id: 'evt-2',
          title: 'Discord Webhook Integration Test',
          date: todayStr,
          allDay: false,
          startTime: '14:00',
          endTime: '14:45',
          durationMinutes: 45,
          category: 'urgent',
          location: 'Discord Channel #alerts',
          description: 'Trigger calendar event embed to the channel.',
          notifyDiscord: true,
          discordAlertTime: 'at_time'
        },
        {
          id: 'evt-3',
          title: 'Tailscale Mobile App Verification',
          date: tomorrowStr,
          allDay: false,
          startTime: '11:00',
          endTime: '12:00',
          durationMinutes: 60,
          category: 'personal',
          location: 'Phone PWA',
          description: 'Verify touch responsiveness and offline caching.',
          notifyDiscord: false,
          discordAlertTime: '1h'
        }
      ];
      this.saveEvents();
    }
  },

  saveEvents() {
    localStorage.setItem('calnotes_events', JSON.stringify(this.events));
    if (window.App && typeof App.updateStats === 'function') {
      App.updateStats();
    }
  },

  setDayViewMode(mode) {
    this.dayViewMode = mode;
    const btnTimeline = document.getElementById('btn-mode-timeline');
    const btnAgenda = document.getElementById('btn-mode-agenda');

    if (mode === 'timeline') {
      if (btnTimeline) btnTimeline.className = 'px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white shadow-sm transition';
      if (btnAgenda) btnAgenda.className = 'px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 transition';
    } else {
      if (btnTimeline) btnTimeline.className = 'px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 transition';
      if (btnAgenda) btnAgenda.className = 'px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white shadow-sm transition';
    }

    this.renderDayEvents(this.selectedDate);
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderMonth();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderMonth();
  },

  goToToday() {
    this.currentDate = new Date();
    const todayStr = this.currentDate.toISOString().split('T')[0];
    this.renderMonth();
    this.selectDate(todayStr);
  },

  getCategoryMeta(category) {
    switch (category) {
      case 'work':
        return { name: 'Work', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400', badge: 'bg-blue-600' };
      case 'personal':
        return { name: 'Personal', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400', badge: 'bg-emerald-600' };
      case 'urgent':
        return { name: 'Urgent', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-400', badge: 'bg-rose-600' };
      case 'routine':
        return { name: 'Routine', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', dot: 'bg-purple-400', badge: 'bg-purple-600' };
      case 'social':
        return { name: 'Social', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400', badge: 'bg-amber-600' };
      default:
        return { name: 'General', bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30', dot: 'bg-slate-400', badge: 'bg-slate-600' };
    }
  },

  renderMonth() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const titleEl = document.getElementById('calendar-month-title');
    if (titleEl) {
      titleEl.textContent = `${monthNames[month]} ${year}`;
    }

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = document.getElementById('calendar-days-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell flex flex-col items-center justify-start p-1 rounded-xl text-slate-600 opacity-30 text-xs md:text-sm';
      cell.innerHTML = `<span class="mt-1">${dayNum}</span>`;
      grid.appendChild(cell);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = (dateStr === todayStr);
      const isSelected = (dateStr === this.selectedDate);

      const dayEvents = this.events.filter(e => e.date === dateStr);

      const cell = document.createElement('div');
      let baseClass = 'calendar-day-cell relative flex flex-col items-center md:items-start justify-between p-1.5 md:p-2 rounded-xl cursor-pointer transition-all duration-150 ';

      if (isSelected) {
        baseClass += 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold ring-2 ring-blue-400 ';
      } else if (isToday) {
        baseClass += 'bg-slate-800/90 text-blue-400 font-bold border border-blue-500/50 hover:bg-slate-800 ';
      } else {
        baseClass += 'bg-slate-900/60 text-slate-300 hover:bg-slate-800/80 border border-slate-800/70 ';
      }

      cell.className = baseClass;
      cell.onclick = () => this.selectDate(dateStr);

      // Desktop preview pills + Mobile dots
      let eventIndicators = '';
      if (dayEvents.length > 0) {
        // Mobile view: dots
        const mobileDots = dayEvents.slice(0, 3).map(e => {
          const meta = this.getCategoryMeta(e.category);
          return `<span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : meta.dot}"></span>`;
        }).join('');

        // Desktop view: mini pills with event title
        const desktopPills = dayEvents.slice(0, 2).map(e => {
          const meta = this.getCategoryMeta(e.category);
          return `
            <div class="hidden md:flex items-center gap-1 w-full text-[10px] px-1.5 py-0.5 rounded truncate ${isSelected ? 'bg-white/20 text-white' : `${meta.bg} ${meta.text}`}">
              <span class="w-1 h-1 rounded-full shrink-0 ${isSelected ? 'bg-white' : meta.dot}"></span>
              <span class="truncate">${escapeHtml(e.title)}</span>
            </div>
          `;
        }).join('');

        eventIndicators = `
          <div class="flex md:hidden items-center gap-0.5 mt-1">${mobileDots}${dayEvents.length > 3 ? '<span class="text-[8px] leading-none">+</span>' : ''}</div>
          <div class="hidden md:flex flex-col gap-1 w-full mt-1">${desktopPills}${dayEvents.length > 2 ? `<span class="text-[9px] ${isSelected ? 'text-white' : 'text-slate-400'}">+${dayEvents.length - 2} more</span>` : ''}</div>
        `;
      }

      cell.innerHTML = `
        <span class="text-xs md:text-sm leading-none">${day}</span>
        ${eventIndicators}
      `;

      grid.appendChild(cell);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this.renderMonth();
    this.renderDayEvents(dateStr);

    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const formatted = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    const badge = document.getElementById('selected-date-badge');
    if (badge) badge.textContent = formatted;

    const dateHeader = document.getElementById('day-events-header');
    if (dateHeader) {
      dateHeader.textContent = `Schedule for ${d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
    }
  },

  renderDayEvents(dateStr) {
    const container = document.getElementById('day-events-container');
    if (!container) return;

    const dayEvents = this.events.filter(e => e.date === dateStr);

    // Also look up notes linked to this date
    let linkedNotes = [];
    if (window.Notes && Array.isArray(Notes.notes)) {
      linkedNotes = Notes.notes.filter(n => n.linkedDate === dateStr);
    }

    if (this.dayViewMode === 'timeline') {
      this.renderTimelineView(container, dayEvents, linkedNotes);
    } else {
      this.renderAgendaView(container, dayEvents, linkedNotes);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderTimelineView(container, dayEvents, linkedNotes) {
    // Generate hours 7 AM to 10 PM
    const startHour = 7;
    const endHour = 22;
    let timelineHtml = '<div class="space-y-0 relative border-l border-slate-800 ml-2">';

    // Show All-day events at top if any
    const allDayEvents = dayEvents.filter(e => e.allDay);
    if (allDayEvents.length > 0) {
      timelineHtml += `
        <div class="mb-3 pl-4">
          <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">All-Day Events</span>
          <div class="space-y-1.5">
            ${allDayEvents.map(e => this.renderEventCard(e)).join('')}
          </div>
        </div>
      `;
    }

    for (let h = startHour; h <= endHour; h++) {
      const hourStr = String(h).padStart(2, '0') + ':00';
      const displayLabel = formatHourLabel(h);

      // Find events matching this hour
      const matchingEvents = dayEvents.filter(e => {
        if (e.allDay || !e.startTime) return false;
        const eHour = parseInt(e.startTime.split(':')[0], 10);
        return eHour === h;
      });

      timelineHtml += `
        <div class="timeline-hour-slot group hover:bg-slate-800/20 transition">
          <div class="timeline-hour-label">${displayLabel}</div>
          <div class="timeline-hour-content flex flex-col gap-1.5">
            ${matchingEvents.map(e => this.renderEventCard(e)).join('')}
          </div>
        </div>
      `;
    }

    timelineHtml += '</div>';

    // Linked Notes Section
    if (linkedNotes.length > 0) {
      timelineHtml += `
        <div class="mt-6 pt-4 border-t border-slate-800/80">
          <div class="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
            <i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-400"></i>
            Notes Attached to this Date (${linkedNotes.length})
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${linkedNotes.map(n => `
              <div onclick="App.switchTab('notes'); Notes.openEditor('${n.id}')"
                   class="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/40 cursor-pointer flex items-center justify-between transition">
                <span class="text-xs font-medium text-slate-200 truncate">${escapeHtml(n.title)}</span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-500"></i>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = timelineHtml;
  },

  renderAgendaView(container, dayEvents, linkedNotes) {
    if (dayEvents.length === 0 && linkedNotes.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <i data-lucide="calendar-check" class="w-8 h-8 mb-2 opacity-40 text-blue-400"></i>
          <p class="text-sm font-semibold text-slate-300">Open Schedule</p>
          <p class="text-xs text-slate-500 mt-1">No events scheduled for this day yet.</p>
          <button onclick="Calendar.openNewEventModal('${this.selectedDate}')" class="mt-3 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition">
            + Schedule Event
          </button>
        </div>
      `;
      return;
    }

    dayEvents.sort((a, b) => {
      if (a.allDay) return -1;
      if (b.allDay) return 1;
      return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
    });

    let html = `
      <div class="space-y-2.5">
        ${dayEvents.map(e => this.renderEventCard(e)).join('')}
      </div>
    `;

    if (linkedNotes.length > 0) {
      html += `
        <div class="mt-5 pt-4 border-t border-slate-800">
          <div class="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
            <i data-lucide="file-text" class="w-3.5 h-3.5 text-blue-400"></i>
            Notes Attached to this Date (${linkedNotes.length})
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${linkedNotes.map(n => `
              <div onclick="App.switchTab('notes'); Notes.openEditor('${n.id}')"
                   class="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/40 cursor-pointer flex items-center justify-between transition">
                <span class="text-xs font-medium text-slate-200 truncate">${escapeHtml(n.title)}</span>
                <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-500"></i>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  renderEventCard(event) {
    const meta = this.getCategoryMeta(event.category);
    const timeDisplay = event.allDay 
      ? 'All Day' 
      : `${formatTimeAMPM(event.startTime)} - ${formatTimeAMPM(event.endTime)}`;

    return `
      <div class="flex items-start justify-between p-3 rounded-xl ${meta.bg} border ${meta.border} transition hover:scale-[1.01] cursor-pointer"
           onclick="Calendar.openEditEventModal('${event.id}')">
        <div class="flex-1 pr-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="w-2 h-2 rounded-full ${meta.dot}"></span>
            <h4 class="text-xs md:text-sm font-semibold text-slate-100">${escapeHtml(event.title)}</h4>
            ${event.notifyDiscord ? `
              <span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <i data-lucide="bell" class="w-2.5 h-2.5"></i> Discord
              </span>
            ` : ''}
          </div>

          <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span class="font-mono text-slate-300">${timeDisplay}</span>
            <span>•</span>
            <span class="capitalize text-slate-400">${meta.name}</span>
            ${event.location ? `<span>•</span><span class="text-slate-400 truncate max-w-[140px]">${escapeHtml(event.location)}</span>` : ''}
          </div>

          ${event.description ? `<p class="text-[11px] text-slate-300 mt-1.5 leading-relaxed line-clamp-2">${escapeHtml(event.description)}</p>` : ''}
        </div>

        <div class="flex items-center gap-1" onclick="event.stopPropagation()">
          <button onclick="Calendar.deleteEvent('${event.id}')" class="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition" title="Delete event">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  },

  openNewEventModal(prefilledDate = null) {
    this.editingEventId = null;
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    form.reset();

    const titleEl = document.getElementById('event-modal-title');
    if (titleEl) titleEl.textContent = 'Schedule New Event';

    const dateInput = document.getElementById('event-date-input');
    dateInput.value = prefilledDate || this.selectedDate || new Date().toISOString().split('T')[0];

    // Default time: next rounded hour
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    const startTimeStr = String(nextHour).padStart(2, '0') + ':00';
    const endTimeStr = String((nextHour + 1) % 24).padStart(2, '0') + ':00';

    document.getElementById('event-time-start').value = startTimeStr;
    document.getElementById('event-time-end').value = endTimeStr;
    document.getElementById('event-allday-toggle').checked = false;
    document.getElementById('time-inputs-container').classList.remove('opacity-40', 'pointer-events-none');

    // Highlight 1h duration pill
    this.setDurationPreset(60);

    modal.classList.remove('hidden');
    document.getElementById('event-title-input').focus();
  },

  openEditEventModal(id) {
    const event = this.events.find(e => e.id === id);
    if (!event) return;

    this.editingEventId = id;
    const modal = document.getElementById('event-modal');
    const titleEl = document.getElementById('event-modal-title');
    if (titleEl) titleEl.textContent = 'Edit Event';

    document.getElementById('event-title-input').value = event.title || '';
    document.getElementById('event-date-input').value = event.date;
    document.getElementById('event-allday-toggle').checked = !!event.allDay;
    document.getElementById('event-time-start').value = event.startTime || '09:00';
    document.getElementById('event-time-end').value = event.endTime || '10:00';
    document.getElementById('event-category-select').value = event.category || 'work';
    document.getElementById('event-location-input').value = event.location || '';
    document.getElementById('event-desc-input').value = event.description || '';
    document.getElementById('event-discord-toggle').checked = !!event.notifyDiscord;
    document.getElementById('event-discord-timing').value = event.discordAlertTime || '15m';

    if (event.allDay) {
      document.getElementById('time-inputs-container').classList.add('opacity-40', 'pointer-events-none');
    } else {
      document.getElementById('time-inputs-container').classList.remove('opacity-40', 'pointer-events-none');
    }

    modal.classList.remove('hidden');
  },

  setDurationPreset(minutes) {
    // Highlight selected pill
    document.querySelectorAll('[data-duration-pill]').forEach(pill => {
      const pMin = parseInt(pill.getAttribute('data-duration-pill'), 10);
      if (pMin === minutes) {
        pill.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white shadow-sm';
      } else {
        pill.className = 'px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition';
      }
    });

    const startInput = document.getElementById('event-time-start');
    const endInput = document.getElementById('event-time-end');
    if (!startInput || !endInput || !startInput.value) return;

    const [sh, sm] = startInput.value.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(sh, sm, 0, 0);

    const endDate = new Date(startDate.getTime() + minutes * 60000);
    const eh = String(endDate.getHours()).padStart(2, '0');
    const em = String(endDate.getMinutes()).padStart(2, '0');
    endInput.value = `${eh}:${em}`;
  },

  addOrUpdateEvent(eventData) {
    if (this.editingEventId) {
      const idx = this.events.findIndex(e => e.id === this.editingEventId);
      if (idx !== -1) {
        this.events[idx] = { ...this.events[idx], ...eventData, id: this.editingEventId };
      }
      App.showToast('Event updated!');
    } else {
      this.events.push({
        ...eventData,
        id: 'evt-' + Date.now()
      });
      App.showToast('Event scheduled!');
    }

    this.saveEvents();
    this.renderMonth();
    this.renderDayEvents(this.selectedDate);
    this.editingEventId = null;
  },

  deleteEvent(id) {
    if (confirm('Delete this event?')) {
      this.events = this.events.filter(e => e.id !== id);
      this.saveEvents();
      this.renderMonth();
      this.renderDayEvents(this.selectedDate);
      App.showToast('Event deleted');
    }
  }
};

function formatTimeAMPM(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function formatHourLabel(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH} ${period}`;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
