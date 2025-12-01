let currentUser = null;
let appliedJobIds = new Set();

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

function searchJobs() {
  const searchBox = document.getElementById('searchBox');
  if (!searchBox) return;
  const query = searchBox.value.toLowerCase();
  const jobs = document.querySelectorAll('#jobList > div');
  jobs.forEach(job => {
    const role = job.getAttribute('data-role').toLowerCase();
    const company = job.getAttribute('data-company').toLowerCase();
    job.style.display = (role.includes(query) || company.includes(query)) ? 'block' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initPortal();
});

async function initPortal() {
  await hydrateSession();
  initHeaderInteractions();
  initContactForm();
  initLoginForm();
  initJobApplyFlow();
  initAppliedJobsPage();
  initAdminPage();
  initChatbot();
}

async function hydrateSession() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
    } else {
      currentUser = null;
    }
  } catch (err) {
    console.warn('Unable to fetch session', err);
    currentUser = null;
  } finally {
    updateProfileInitial();
  }
}

function initHeaderInteractions() {
  const profile = document.getElementById('profile-initial');
  const logoutMenu = document.getElementById('logout-menu');
  const logoutBtn = document.getElementById('logout-btn');

  if (!profile || !logoutMenu || !logoutBtn) return;

  profile.addEventListener('click', () => {
    if (!currentUser) return;
    logoutMenu.classList.toggle('hidden');
  });

  logoutBtn.addEventListener('click', async () => {
    await logout();
  });

  document.addEventListener('click', (event) => {
    if (!profile.contains(event.target) && !logoutMenu.contains(event.target)) {
      logoutMenu.classList.add('hidden');
    }
  });
}

function updateProfileInitial() {
  const profile = document.getElementById('profile-initial');
  const logoutMenu = document.getElementById('logout-menu');
  if (!profile) return;

  if (currentUser) {
    const firstInitial = currentUser.username?.charAt(0)?.toUpperCase() || 'U';
    profile.textContent = firstInitial;
    profile.classList.remove('bg-gray-600');
    profile.classList.add('bg-[#e94560]');
  } else {
    profile.innerHTML = '<a href="login.html" class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden"><i class="fas fa-user text-xl text-gray-300"></i></a>';
    profile.classList.remove('bg-[#e94560]');
    logoutMenu?.classList.add('hidden');
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (err) {
    console.error('Logout error', err);
  } finally {
    currentUser = null;
    appliedJobIds.clear();
    window.location.href = 'login.html';
  }
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('contactModal')?.classList.remove('hidden');
    form.reset();
  });
}

function closeContactModal() {
  document.getElementById('contactModal')?.classList.add('hidden');
}

function openApplyForm(button) {
  const card = button.closest('div');
  if (!card) return;
  const jobId = card.getAttribute('data-job-id');
  const company = card.getAttribute('data-company');
  const role = card.getAttribute('data-role');
  const desc = card.getAttribute('data-description');

  document.getElementById('jobTitle').textContent = `${company} - ${role}`;
  document.getElementById('jobDescription').innerHTML = desc;
  document.getElementById('currentJobId').value = jobId;
  document.getElementById('currentJobTitle').value = `${company} - ${role}`;
  document.getElementById('applyModal').classList.remove('hidden');
}

function closeApplyModal() {
  document.getElementById('applyModal')?.classList.add('hidden');
}

function closeSuccessModal() {
  document.getElementById('successModal')?.classList.add('hidden');
}

function initJobApplyFlow() {
  const applyForm = document.getElementById('applyForm');
  if (!applyForm) return;

  applyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(applyForm);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Application failed.' }));
        alert(err.message || 'Application failed.');
        return;
      }

      const jobId = formData.get('jobId');
      appliedJobIds.add(jobId);
      updateJobCardsState();

      document.getElementById('successModal').classList.remove('hidden');
      closeApplyModal();
      applyForm.reset();
    } catch (error) {
      console.error('Application submit error', error);
      alert('Something went wrong. Please try again.');
    }
  });

  if (currentUser) {
    fetchAndCacheAppliedJobs();
  }
}

async function fetchAndCacheAppliedJobs() {
  try {
    const result = await fetchApplications();
    appliedJobIds = new Set(result.map(app => app.job_id));
    updateJobCardsState();
  } catch (err) {
    console.warn('Unable to load applied jobs for badges', err);
  }
}

function updateJobCardsState() {
  const cards = document.querySelectorAll('#jobList > div');
  cards.forEach(card => {
    const jobId = card.getAttribute('data-job-id');
    const button = card.querySelector('.apply-btn');
    if (!button) return;
    if (appliedJobIds.has(jobId)) {
      button.textContent = 'Applied';
      button.disabled = true;
      button.classList.remove('bg-[#e94560]', 'hover:bg-[#c2334d]');
      button.classList.add('bg-green-600', 'cursor-not-allowed');
    } else {
      button.textContent = 'Apply Now';
      button.disabled = false;
      button.classList.add('bg-[#e94560]');
      button.classList.remove('bg-green-600', 'cursor-not-allowed');
    }
  });
}

function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;
  const errorBox = document.getElementById('loginError');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Login failed' }));
        if (errorBox) {
          errorBox.textContent = err.message || 'Login failed';
          errorBox.classList.remove('hidden');
        } else {
          alert(err.message || 'Login failed');
        }
        return;
      }

      const data = await res.json();
      currentUser = data.user;
      if (errorBox) errorBox.classList.add('hidden');

      if (currentUser.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error('Login error', error);
      if (errorBox) {
        errorBox.textContent = 'Unable to log in. Try again later.';
        errorBox.classList.remove('hidden');
      }
    }
  });
}

async function initAppliedJobsPage() {
  const tableBody = document.getElementById('appliedJobsBody');
  if (!tableBody) return;
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  const emptyState = document.getElementById('applied-empty');
  const errorBox = document.getElementById('applied-error');

  try {
    const applications = await fetchApplications();
    renderApplications(tableBody, applications);
    if (!applications.length) {
      emptyState?.classList.remove('hidden');
      document.getElementById('applied-table-wrapper')?.classList.add('hidden');
    }
  } catch (err) {
    console.error('Applied jobs load error', err);
    if (errorBox) {
      errorBox.textContent = 'Unable to load your applications right now.';
      errorBox.classList.remove('hidden');
    }
  }
}

async function initAdminPage() {
  const tableBody = document.getElementById('adminApplicationsBody');
  const errorBox = document.getElementById('admin-error');
  if (!tableBody) return;

  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  if (currentUser.role !== 'admin') {
    if (errorBox) {
      errorBox.textContent = 'You need admin access to view this page.';
      errorBox.classList.remove('hidden');
    }
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  try {
    const applications = await fetchApplications();
    renderApplications(tableBody, applications);
  } catch (err) {
    console.error('Admin applications error', err);
    if (errorBox) {
      errorBox.textContent = 'Unable to load applications. Please try again.';
      errorBox.classList.remove('hidden');
    }
  }
}

async function fetchApplications() {
  const res = await fetch('/api/applications', { credentials: 'include' });
  if (res.status === 401) {
    window.location.href = 'login.html';
    return [];
  }
  if (!res.ok) {
    throw new Error('Failed to fetch applications');
  }
  const data = await res.json();
  return data.applications || [];
}

function renderApplications(targetBody, applications) {
  targetBody.innerHTML = '';
  applications.forEach(app => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-6 py-4">
        <p class="font-semibold text-white">${app.job_title}</p>
        <p class="text-xs text-gray-400">${app.job_id}</p>
      </td>
      <td class="px-6 py-4 text-gray-200">${app.applicant_name}</td>
      <td class="px-6 py-4 text-gray-300">${app.applicant_email}</td>
      <td class="px-6 py-4 text-gray-300">${new Date(app.applied_at).toLocaleString()}</td>
      <td class="px-6 py-4 text-center">
        <a href="${app.resume_file_path}" target="_blank" class="text-[#e94560] underline">Resume</a>
      </td>
    `;
    targetBody.appendChild(tr);
  });
}

function initChatbot() {
  const chatbotButton = document.getElementById('chatbot-button');
  const chatbotWindow = document.getElementById('chatbot-window');
  const closeChatbotButton = document.getElementById('close-chatbot');
  const chatbox = document.getElementById('chatbot-messages');
  const userInput = document.getElementById('user-input');

  if (!chatbotButton || !chatbotWindow || !closeChatbotButton || !chatbox || !userInput) {
    return;
  }

  chatbotButton.addEventListener('click', () => {
    chatbotWindow.classList.toggle('hidden');
    if (!chatbotWindow.classList.contains('hidden')) {
      userInput.focus();
    }
  });

  closeChatbotButton.addEventListener('click', () => {
    chatbotWindow.classList.add('hidden');
  });

  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && userInput.value.trim() !== '') {
      const userMessage = userInput.value.trim();
      appendChatMessage(userMessage, 'user');
      userInput.value = '';
      setTimeout(() => {
        respondToUser(userMessage);
      }, 400);
    }
  });
}

function appendChatMessage(message, sender) {
  const chatbox = document.getElementById('chatbot-messages');
  if (!chatbox) return;
  const wrapper = document.createElement('div');
  wrapper.classList.add('flex');
  if (sender === 'user') {
    wrapper.classList.add('justify-end');
    wrapper.innerHTML = `<div class="bg-[#e94560] text-white p-3 rounded-lg max-w-[80%]">${message}</div>`;
  } else {
    wrapper.classList.add('justify-start');
    wrapper.innerHTML = `<div class="bg-gray-700 text-gray-100 p-3 rounded-lg max-w-[80%]">${message}</div>`;
  }
  chatbox.appendChild(wrapper);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function respondToUser(message) {
  const lower = message.toLowerCase();
  let botResponse = "I'm sorry, I don't understand that. You can ask me about Home, Jobs, Apply, or Contact.";

  if (lower.includes('home')) {
    botResponse = '🏠 The Home section highlights the portal and helps you start browsing jobs quickly.';
  } else if (lower.includes('about')) {
    botResponse = 'ℹ️ The About section shares how Capstone Job Portal supports students and job seekers.';
  } else if (lower.includes('jobs') || lower.includes('roles')) {
    botResponse = "💼 The Jobs section lists every opening with detailed descriptions. Use search to filter quickly.";
  } else if (lower.includes('apply') || lower.includes('application')) {
    botResponse = "📝 Click “Apply Now” on any job to submit your name, email, and resume.";
  } else if (lower.includes('contact')) {
    botResponse = '📩 Use the Contact section to send us a message and we will reply soon.';
  } else if (lower.includes('applied')) {
    botResponse = '📋 Track everything you submitted from the Applied Jobs page (login required).';
  } else if (lower.includes('admin')) {
    botResponse = '🛠 Admins can log in to review every application in one dashboard.';
  }

  appendChatMessage(botResponse, 'bot');
}