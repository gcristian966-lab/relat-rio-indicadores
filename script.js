const fileInput = document.getElementById('fileInput');
const monthFilter = document.getElementById('monthFilter');
const sectorFilter = document.getElementById('sectorFilter');
const typeFilter = document.getElementById('typeFilter');
const correlationResult = document.getElementById('correlationResult');

let accidentData = [];

// Função para ler CSV
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    parseCSV(text);
    updateFilters();
    renderCharts();
  };
  reader.readAsText(file);
});

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const headers = lines[0].split(',');
  accidentData = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i].trim());
    return obj;
  });
}

function updateFilters() {
  const months = [...new Set(accidentData.map(d => d.Mes))];
  const sectors = [...new Set(accidentData.map(d => d.Setor))];
  const types = [...new Set(accidentData.map(d => d.Tipo))];

  fillFilter(monthFilter, months);
  fillFilter(sectorFilter, sectors);
  fillFilter(typeFilter, types);
}

function fillFilter(select, values) {
  select.innerHTML = '<option value="todos">Todos</option>';
  values.forEach(v => {
    const option = document.createElement('option');
    option.value = v;
    option.textContent = v;
    select.appendChild(option);
  });
}

[monthFilter, sectorFilter, typeFilter].forEach(f => f.addEventListener('change', renderCharts));

function getFilteredData() {
  return accidentData.filter(d => {
    return (monthFilter.value === 'todos' || d.Mes === monthFilter.value) &&
           (sectorFilter.value === 'todos' || d.Setor === sectorFilter.value) &&
           (typeFilter.value === 'todos' || d.Tipo === typeFilter.value);
  });
}

let chartLine, chartBar, chartScatter;

function renderCharts() {
  const filtered = getFilteredData();

  const labels = filtered.map(d => d.Mes);
  const values = filtered.map(d => Number(d.Afastamentos) || 0);
  const diasPerdidos = filtered.map(d => Number(d.DiasPerdidos) || 0);

  if (chartLine) chartLine.destroy();
  chartLine = new Chart(document.getElementById('chartLine'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Afastamentos', data: values, borderColor: '#0056b3', fill: false }] },
  });

  if (chartBar) chartBar.destroy();
  chartBar = new Chart(document.getElementById('chartBar'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Dias Perdidos', data: diasPerdidos, backgroundColor: '#28a745' }] },
  });

  if (chartScatter) chartScatter.destroy();
  chartScatter = new Chart(document.getElementById('chartScatter'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Correlação Afastamentos x Dias Perdidos',
        data: filtered.map(d => ({ x: Number(d.Afastamentos), y: Number(d.DiasPerdidos) })),
        backgroundColor: '#dc3545'
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Afastamentos' } },
        y: { title: { display: true, text: 'Dias Perdidos' } }
      }
    }
  });

  // Calcular correlação de Pearson
  const r = pearson(values, diasPerdidos);
  correlationResult.textContent = `Correlação (r): ${r.toFixed(2)}`;
}

function pearson(x, y) {
  const n = x.length;
  const sumX = x.reduce((a,b) => a+b, 0);
  const sumY = y.reduce((a,b) => a+b, 0);
  const sumXY = x.reduce((a,b,i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a,b) => a + b*b, 0);
  const sumY2 = y.reduce((a,b) => a + b*b, 0);
  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt((n * sumX2 - sumX**2) * (n * sumY2 - sumY**2));
  return denominator === 0 ? 0 : numerator / denominator;
}
