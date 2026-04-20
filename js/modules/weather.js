/**
 * VDLV Site Tracker — Weather & Site Conditions Module
 */

const weatherState = { AM: '', PM: '' };

function selectWeather(btn, period) {
  btn.closest('.weather-options').querySelectorAll('.weather-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  weatherState[period] = btn.textContent.trim();
  document.getElementById('dashWeather').textContent = (weatherState.AM || '—') + ' / ' + (weatherState.PM || '—');
}

function getWeatherState() { return weatherState; }
function setWeatherState(am, pm) {
  weatherState.AM = am;
  weatherState.PM = pm;
}
