const textInput = document.getElementById('textInput');
const voiceSelect = document.getElementById('voiceSelect');
const voiceSearch = document.getElementById('voiceSearch');
const rateRange = document.getElementById('rateRange');
const pitchRange = document.getElementById('pitchRange');
const volumeRange = document.getElementById('volumeRange');
const rateValue = document.getElementById('rateValue');
const pitchValue = document.getElementById('pitchValue');
const volumeValue = document.getElementById('volumeValue');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const audioPlayer = document.getElementById('audioPlayer');
const downloadLink = document.getElementById('downloadLink');
const errorBox = document.getElementById('errorBox');
const successBox = document.getElementById('successBox');
const selectedVoice = document.getElementById('selectedVoice');
const resultStatus = document.getElementById('resultStatus');
const charCount = document.getElementById('charCount');
const statusPill = document.getElementById('statusPill');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

let allVoices = [];
let generationHistory = [];

const HISTORY_STORAGE_KEY = 'sound-studio-history';
const MAX_HISTORY_ITEMS = 8;

function clampLabel(value, suffix) {
  if (value === 0) {
    return `+0${suffix}`;
  }

  return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

function updateControls() {
  rateValue.textContent = `${rateRange.value > 0 ? '+' : ''}${rateRange.value}%`;
  pitchValue.textContent = `${pitchRange.value > 0 ? '+' : ''}${pitchRange.value}Hz`;
  volumeValue.textContent = `${volumeRange.value > 0 ? '+' : ''}${volumeRange.value}%`;
  charCount.textContent = `${textInput.value.length} / 5000`;
}

function setMessage(target, text) {
  target.textContent = text;
  target.hidden = !text;
}

function setBusy(isBusy) {
  generateBtn.disabled = isBusy;
  generateBtn.textContent = isBusy ? 'กำลังสร้าง...' : 'สร้างเสียง';
  statusPill.textContent = isBusy ? 'กำลังประมวลผล' : 'พร้อมใช้งาน';
}

function formatVoiceLabel(voice) {
  const locale = voice.Locale ? ` • ${voice.Locale}` : '';
  const gender = voice.Gender ? ` • ${voice.Gender}` : '';
  return `${voice.Name}${locale}${gender}`;
}

function updateSelectedVoice() {
  const option = voiceSelect.selectedOptions[0];
  selectedVoice.textContent = option ? option.textContent : '-';
}

function getCurrentVoiceMeta() {
  const option = voiceSelect.selectedOptions[0];
  if (!option) {
    return { label: '-', value: '' };
  }

  return {
    label: option.textContent || '-',
    value: option.value || '',
  };
}

function saveHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(generationHistory));
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    generationHistory = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(generationHistory)) {
      generationHistory = [];
    }
  } catch {
    generationHistory = [];
  }
}

function formatHistoryTime(timestamp) {
  try {
    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

function createHistorySnippet(text) {
  return text.length > 64 ? `${text.slice(0, 64)}...` : text;
}

function applyHistoryItem(item) {
  textInput.value = item.text || '';
  rateRange.value = item.rateValue ?? 0;
  pitchRange.value = item.pitchValue ?? 0;
  volumeRange.value = item.volumeValue ?? 0;

  updateControls();

  if (item.voiceValue) {
    voiceSelect.value = item.voiceValue;
    if (voiceSelect.value !== item.voiceValue) {
      const fallbackIndex = Array.from(voiceSelect.options).findIndex((option) => option.value === item.voiceValue);
      if (fallbackIndex >= 0) {
        voiceSelect.selectedIndex = fallbackIndex;
      }
    }
  }

  updateSelectedVoice();
  if (item.audioUrl) {
    audioPlayer.src = item.audioUrl;
    downloadLink.href = item.audioUrl;
    downloadLink.download = item.filename || 'sound.mp3';
    downloadLink.classList.remove('disabled');
    downloadLink.textContent = 'ดาวน์โหลดไฟล์ MP3';
    resultStatus.textContent = 'โหลดจากประวัติแล้ว';
  }
  setMessage(errorBox, '');
  setMessage(successBox, '');
}

function renderHistory() {
  historyList.innerHTML = '';

  if (!generationHistory.length) {
    const empty = document.createElement('p');
    empty.className = 'history-empty';
    empty.textContent = 'ยังไม่มีประวัติการสร้างเสียง';
    historyList.appendChild(empty);
    return;
  }

  generationHistory.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'history-item';

    const header = document.createElement('div');
    header.className = 'history-item-header';

    const title = document.createElement('strong');
    title.textContent = item.voiceLabel || 'เสียงไม่ระบุ';

    const meta = document.createElement('span');
    meta.textContent = formatHistoryTime(item.createdAt);

    header.append(title, meta);

    const text = document.createElement('p');
    text.className = 'history-text';
    text.textContent = createHistorySnippet(item.text || '');

    const settings = document.createElement('div');
    settings.className = 'history-settings';
    settings.textContent = `${item.rateLabel || '+0%'} • ${item.pitchLabel || '+0Hz'} • ${item.volumeLabel || '+0%'}`;

    const actions = document.createElement('div');
    actions.className = 'history-actions';

    const useBtn = document.createElement('button');
    useBtn.type = 'button';
    useBtn.className = 'ghost small';
    useBtn.textContent = 'ใช้รายการนี้';
    useBtn.addEventListener('click', () => applyHistoryItem(item));

    const downloadBtn = document.createElement('a');
    downloadBtn.className = `download-link history-download${item.audioUrl ? '' : ' disabled'}`;
    downloadBtn.href = item.audioUrl || '#';
    downloadBtn.download = item.filename || 'sound.mp3';
    downloadBtn.textContent = 'ดาวน์โหลด';

    actions.append(useBtn, downloadBtn);
    card.append(header, text, settings, actions);
    historyList.appendChild(card);
  });
}

function pushHistoryItem(item) {
  generationHistory = [item, ...generationHistory.filter((entry) => entry.id !== item.id)].slice(0, MAX_HISTORY_ITEMS);
  saveHistory();
  renderHistory();
}

function renderVoices(filterText = '') {
  const query = filterText.trim().toLowerCase();
  const current = voiceSelect.value;
  const filtered = allVoices.filter((voice) => {
    if (!query) return true;
    return [voice.Name, voice.ShortName, voice.Locale, voice.Gender].join(' ').toLowerCase().includes(query);
  });

  voiceSelect.innerHTML = '';
  filtered.forEach((voice) => {
    const option = document.createElement('option');
    option.value = voice.ShortName || voice.Name;
    option.textContent = formatVoiceLabel(voice);
    voiceSelect.appendChild(option);
  });

  if (filtered.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'ไม่พบเสียงที่ตรงกับคำค้นหา';
    voiceSelect.appendChild(option);
  } else if (filtered.some((voice) => (voice.ShortName || voice.Name) === current)) {
    voiceSelect.value = current;
  } else {
    voiceSelect.selectedIndex = 0;
  }

  updateSelectedVoice();
}

async function loadVoices() {
  try {
    const response = await fetch('/api/voices');
    if (!response.ok) {
      throw new Error('โหลดรายการเสียงไม่สำเร็จ');
    }

    const data = await response.json();
    allVoices = Array.isArray(data.voices) ? data.voices : [];
    renderVoices();
  } catch (error) {
    setMessage(errorBox, error.message || 'โหลดเสียงไม่สำเร็จ');
  }
}

async function generateAudio() {
  const text = textInput.value.trim();
  if (!text) {
    setMessage(errorBox, 'กรุณาพิมพ์ข้อความก่อน');
    return;
  }

  const voice = voiceSelect.value;
  if (!voice) {
    setMessage(errorBox, 'กรุณาเลือกเสียง');
    return;
  }

  const voiceMeta = getCurrentVoiceMeta();

  setBusy(true);
  setMessage(errorBox, '');
  setMessage(successBox, '');
  resultStatus.textContent = 'กำลังสร้างไฟล์เสียง';

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
        rate: clampLabel(Number(rateRange.value), '%'),
        pitch: clampLabel(Number(pitchRange.value), 'Hz'),
        volume: clampLabel(Number(volumeRange.value), '%'),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const detail = data.detail;
      const message = Array.isArray(detail)
        ? detail
            .map((item) => item.msg || item.message || item.loc?.join('.') || JSON.stringify(item))
            .join(', ')
        : (typeof detail === 'string' ? detail : 'สร้างไฟล์เสียงไม่สำเร็จ');
      throw new Error(message);
    }

    const url = data.download_url;
    audioPlayer.src = url;
    downloadLink.href = url;
    downloadLink.download = data.filename || 'sound.mp3';
    downloadLink.classList.remove('disabled');
    downloadLink.textContent = 'ดาวน์โหลดไฟล์ MP3';
    resultStatus.textContent = 'พร้อมดาวน์โหลด';
    setMessage(successBox, data.message || 'สร้างไฟล์เสียงสำเร็จ');

    pushHistoryItem({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      voiceValue: voice,
      voiceLabel: voiceMeta.label,
      rateValue: Number(rateRange.value),
      pitchValue: Number(pitchRange.value),
      volumeValue: Number(volumeRange.value),
      rateLabel: clampLabel(Number(rateRange.value), '%'),
      pitchLabel: clampLabel(Number(pitchRange.value), 'Hz'),
      volumeLabel: clampLabel(Number(volumeRange.value), '%'),
      filename: data.filename || 'sound.mp3',
      audioUrl: url,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    resultStatus.textContent = 'เกิดข้อผิดพลาด';
    setMessage(errorBox, error.message || 'สร้างไฟล์เสียงไม่สำเร็จ');
  } finally {
    setBusy(false);
  }
}

textInput.addEventListener('input', updateControls);
rateRange.addEventListener('input', updateControls);
pitchRange.addEventListener('input', updateControls);
volumeRange.addEventListener('input', updateControls);
voiceSelect.addEventListener('change', updateSelectedVoice);
voiceSearch.addEventListener('input', (event) => renderVoices(event.target.value));
generateBtn.addEventListener('click', generateAudio);
clearBtn.addEventListener('click', () => {
  textInput.value = '';
  audioPlayer.removeAttribute('src');
  audioPlayer.load();
  downloadLink.href = '#';
  downloadLink.download = '';
  downloadLink.classList.add('disabled');
  downloadLink.textContent = 'ยังไม่มีไฟล์ให้ดาวน์โหลด';
  setMessage(errorBox, '');
  setMessage(successBox, '');
  resultStatus.textContent = 'รอสร้างไฟล์';
  updateControls();
});

clearHistoryBtn.addEventListener('click', () => {
  generationHistory = [];
  saveHistory();
  renderHistory();
});

updateControls();
loadHistory();
renderHistory();
loadVoices();