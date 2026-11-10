(function () {
  "use strict";

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  const formatNum = (num) => new Intl.NumberFormat('id-ID').format(num);

  const styles = getComputedStyle(document.documentElement);
  const colorAccent = styles.getPropertyValue("--accent").trim() || "#435a4a";
  const colorMuted = styles.getPropertyValue("--muted").trim() || "#888";

  Chart.defaults.font.family = "'Futura','Century Gothic',sans-serif";
  Chart.defaults.color = colorMuted;

  // Deteksi kalau tombol Dark Mode diklik, reload halaman biar warna chart berubah
  const themeToggleBtn = document.getElementById("theme-toggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      setTimeout(() => window.location.reload(), 100);
    });
  }

  let chartTrend, chartChannel, chartCategory;

  const modal = document.getElementById("detailModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  document.getElementById("closeModal").addEventListener("click", () => modal.close());

  function showModal(title, details) {
    modalTitle.textContent = "Detail: " + title;
    modalBody.innerHTML = `
      <div class="detail-row"><span>Total Pendapatan</span><strong>${formatRp(details.revenue)}</strong></div>
      <div class="detail-row"><span>Barang Terjual</span><strong>${formatNum(details.items)} pcs</strong></div>
      <div class="detail-row"><span>Jumlah Pesanan</span><strong>${formatNum(details.orders)} transaksi</strong></div>
    `;
    modal.showModal();
  }

  fetch("data/kpi.json")
    .then((r) => r.json())
    .then((data) => {
      const select = document.getElementById("monthFilter");
      
      select.innerHTML = `<option value="all_time">Semua Waktu (All Time)</option>`;
      Object.keys(data.monthly).forEach(month => {
        select.innerHTML += `<option value="${month}">${month}</option>`;
      });

      renderDashboard("all_time", data);

      select.addEventListener("change", (e) => {
        renderDashboard(e.target.value, data);
      });
    })
    .catch((err) => {
      console.error("Gagal load data:", err);
      alert("Gagal memuat data JSON. Pastikan file ada dan Anda menggunakan Live Server.");
    });

  
  function renderDashboard(periodKey, data) {
    const activeData = periodKey === "all_time" ? data.all_time : data.monthly[periodKey];

    document.getElementById("kpi-revenue").textContent = formatRp(activeData.kpi.revenue);
    document.getElementById("kpi-profit").textContent = formatRp(activeData.kpi.profit);
    document.getElementById("kpi-orders").textContent = formatNum(activeData.kpi.orders) + " Trx";
    document.getElementById("kpi-aov").textContent = formatRp(activeData.kpi.aov);
    document.getElementById("kpi-customers").textContent = formatNum(activeData.kpi.customers) + " Orang";

    if (chartTrend) chartTrend.destroy();
    if (chartChannel) chartChannel.destroy();
    if (chartCategory) chartCategory.destroy();

    // --- LOGIKA GRAFIK TREN ---
    let trendDataLabels, trendDataValues, trendTitleText;

    if (periodKey === "all_time") {
      trendDataLabels = data.trend.labels;
      trendDataValues = data.trend.values;
      trendTitleText = "Tren Pendapatan (Rp) per Bulan";
    } else {
      // Hilangkan kata "Hari" di label
      trendDataLabels = data.daily[periodKey].labels.map(label => label.replace("Hari ", ""));
      trendDataValues = data.daily[periodKey].values;
      trendTitleText = "Tren Pendapatan Harian (" + periodKey + ")";
    }

    document.getElementById("trendTitle").textContent = trendTitleText;

    chartTrend = new Chart(document.getElementById("trendChart"), {
      type: "line",
      data: {
        labels: trendDataLabels,
        datasets: [{
          label: "Pendapatan",
          data: trendDataValues,
          borderColor: colorAccent,
          backgroundColor: "rgba(67,90,74,0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { 
            callbacks: { 
              label: (ctx) => formatRp(ctx.raw),
              title: (ctx) => (periodKey === "all_time" ? ctx[0].label : "Tanggal " + ctx[0].label) 
            } 
          }
        },
        scales: {
          y: { 
            ticks: { callback: (val) => "Rp " + (val/1000000) + " Jt" } 
          },
          x: { 
            grid: { display: false }, 
            ticks: { 
              autoSkip: false,       
              maxRotation: 90,       
              minRotation: 0,
              font: { size: 11 }     
            } 
          }
        }
      } 
    });

    const createBarChart = (canvasId, dataObj) => {
      return new Chart(document.getElementById(canvasId), {
        type: "bar",
        data: {
          labels: dataObj.labels,
          datasets: [{ data: dataObj.values, backgroundColor: colorAccent, borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => formatRp(ctx.raw) } }
          },
          scales: {
            y: { ticks: { callback: (val) => "Rp " + (val/1000000) + " Jt" } },
            x: { ticks: {autoSkip: false, maxRotation: 45, minRotation: 45} }
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const label = dataObj.labels[elements[0].index];
              showModal(label + (periodKey === "all_time" ? "" : ` (${periodKey})`), dataObj.details[label]);
            }
          }
        }
      });
    };

    chartChannel = createBarChart("channelChart", activeData.channel);
    chartCategory = createBarChart("categoryChart", activeData.kategori);
  }
})();
