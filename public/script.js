let goals = [];
let goalToEndIndex = null;
let charts = []; // store chart instances


function addGoal() {
  const name = document.getElementById('goalName').value;
  const target = parseFloat(document.getElementById('goalTarget').value);

  if (!name || !target) {
    alert("Please enter a goal name and target amount.");
    return;
  }

  const goal = { 
  name, 
  target, 
  current: 0, 
  history: [] // stores {date, total}
 };


  goals.push(goal);
  renderGoals();

  // Clear form
  document.getElementById('goalName').value = '';
  document.getElementById('goalTarget').value = '';

  // Switch back to Goals tab after adding
  showSection('goals');
}

function addSavings(index, amount) {
  if (amount <= 0) return;
  goals[index].current += amount;

  // Record the transaction with date
  goals[index].history.push({
    date: new Date().toLocaleDateString(),
    amount: amount,
    total: goals[index].current
  });

  renderGoals();
}


function openEndGoalModal(index) {
  goalToEndIndex = index;
  document.getElementById('modalGoalName').innerText = `Goal: "${goals[index].name}"`;
  document.getElementById('endGoalModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('endGoalModal').style.display = 'none';
  goalToEndIndex = null;
}

function confirmEndGoal() {
  if (goalToEndIndex !== null) {
    goals.splice(goalToEndIndex, 1);
    renderGoals();
  }
  closeModal();
}

function renderGoals() {
  const list = document.getElementById('goalList');
  list.innerHTML = '';

  if (goals.length === 0) {
    list.innerHTML = "<p>No goals yet. Add one in the Add Goal tab.</p>";
    return;
  }

  goals.forEach((goal, index) => {
    const percent = Math.min((goal.current / goal.target) * 100, 100);

    const div = document.createElement('div');
    div.className = 'goal';
    div.innerHTML = `
      <h3>${goal.name}</h3>
      <p>Saved: $${goal.current.toFixed(2)} / $${goal.target.toFixed(2)}</p>
      <div class="progress-bar">
        <div class="progress" style="width:${percent}%"></div>
      </div>
      <div class="goal-actions">
        <input type="number" id="save${index}" placeholder="Add savings">
        <button onclick="addSavings(${index}, parseFloat(document.getElementById('save${index}').value) || 0)">Add</button>
        <button class="end-btn" onclick="openEndGoalModal(${index})">End Goal</button>
      </div>
    `;
    list.appendChild(div);
  });
  renderReports();
}

function toggleMode() {
  document.body.classList.toggle('dark');
}

function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  // Show selected section
  document.getElementById(sectionId).classList.add('active');

  // Update navbar active state
  const buttons = document.querySelectorAll('.navbar button');
  buttons.forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('nav-' + sectionId);
  activeBtn.classList.add('active');

  // Move indicator under active button
  const indicator = document.querySelector('.nav-indicator');
  const rect = activeBtn.getBoundingClientRect();
  const navRect = activeBtn.parentElement.getBoundingClientRect();

  indicator.style.width = rect.width + "px";
  indicator.style.left = (rect.left - navRect.left) + "px";
}

// Initialize
window.addEventListener('load', () => {
  renderGoals();

  // Position indicator under default active tab
  const activeBtn = document.querySelector('.navbar button.active');
  const indicator = document.querySelector('.nav-indicator');
  const rect = activeBtn.getBoundingClientRect();
  const navRect = activeBtn.parentElement.getBoundingClientRect();

  indicator.style.width = rect.width + "px";
  indicator.style.left = (rect.left - navRect.left) + "px";
});

// Recalculate indicator on window resize
window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('.navbar button.active');
  if (activeBtn) {
    const indicator = document.querySelector('.nav-indicator');
    const rect = activeBtn.getBoundingClientRect();
    const navRect = activeBtn.parentElement.getBoundingClientRect();

    indicator.style.width = rect.width + "px";
    indicator.style.left = (rect.left - navRect.left) + "px";
  }
});

function renderReports() {
  const reportsSection = document.getElementById('reports');
  reportsSection.innerHTML = '';

  // Destroy old charts
  charts.forEach(chart => chart.destroy());
  charts = [];

  if (goals.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'report-card';
    placeholder.innerHTML = `
      <h3>Reports</h3>
      <p>No data available yet.</p>
    `;
    reportsSection.appendChild(placeholder);
    return;
  }

  goals.forEach((goal, i) => {
    const card = document.createElement('div');
    card.className = 'report-card';
    card.innerHTML = `
      <h3>${goal.name}</h3>
      <canvas id="chart${i}" height="200"></canvas>
    `;
    reportsSection.appendChild(card);

    const labels = goal.history.length > 0 
      ? goal.history.map(h => h.date) 
      : [new Date().toLocaleDateString()];
    const data = goal.history.length > 0 
      ? goal.history.map(h => h.total) 
      : [0];

    const ctx = document.getElementById(`chart${i}`).getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Savings Progress',
          data: data,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#2ecc71'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: goal.target
          }
        }
      }
    });

    charts.push(chart); // store reference
  });
}




function drawLineChart(canvasId, history, target) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (history.length === 0) {
    ctx.fillText("No savings yet", 10, 50);
    return;
  }

  // Scale values
  const maxY = target;
  const stepX = canvas.width / (history.length - 1 || 1);

  ctx.beginPath();
  ctx.moveTo(0, canvas.height - (history[0].total / maxY) * canvas.height);

  history.forEach((point, idx) => {
    const x = idx * stepX;
    const y = canvas.height - (point.total / maxY) * canvas.height;
    ctx.lineTo(x, y);
    // Mark the point
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.moveTo(x, y);
  });

  ctx.strokeStyle = "#4CAF50";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Labels
  ctx.fillStyle = "#333";
  ctx.font = "12px Arial";
  history.forEach((point, idx) => {
    const x = idx * stepX;
    const y = canvas.height - (point.total / maxY) * canvas.height;
    ctx.fillText(point.date, x - 15, canvas.height - 5);
  });
}

async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const msg = await res.text();
  document.getElementById('accountStatus').innerText = msg;

  if (msg.toLowerCase().includes("success")) {
    unlockApp();          // hide login page, show app
    showSection('goals'); // go straight to Goals tab
  }
}

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const msg = await res.text();
  document.getElementById('accountStatus').innerText = msg;

  if (msg.toLowerCase().includes("success")) {
    unlockApp();          // hide login page, show app
    showSection('goals'); // go straight to Goals tab
  }
}

async function logout() {
  const res = await fetch('/logout', { method: 'POST' });
  const msg = await res.text();
  document.getElementById('accountStatus').innerText = msg;

  // Return user to login page
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}



function unlockApp() {
  // Hide the login page
  const loginPage = document.getElementById('loginPage');
  loginPage.classList.remove('active');
  loginPage.classList.add('hidden');

  // Show the main app
  const app = document.getElementById('app');
  app.classList.remove('hidden');

  // Optionally set the default section to Goals
  showSection('goals');
}

