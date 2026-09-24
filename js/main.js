// ===== 登录/注册模块 =====
const DEFAULT_ACCOUNTS = [
  { email: 'admin@yimirror.com', password: 'admin123', role: '管理员' },
  { email: 'user1@yimirror.com', password: '123456',  role: '普通用户' },
  { email: 'demo@yimirror.com',  password: 'demo',    role: '演示账号' }
];

const USERS_STORAGE_KEY = 'yimirror_users';
const PASSWORD_OVERRIDES_KEY = 'yimirror_password_overrides';

function getPasswordOverrides() {
  try {
    return JSON.parse(localStorage.getItem(PASSWORD_OVERRIDES_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function setPasswordOverride(email, password) {
  const overrides = getPasswordOverrides();
  overrides[email] = password;
  localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(overrides));
}

function getAccounts() {
  let extra = [];
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (stored) extra = JSON.parse(stored);
  } catch (e) {
    extra = [];
  }
  const overrides = getPasswordOverrides();
  return [...extra, ...DEFAULT_ACCOUNTS].map(a =>
    overrides[a.email] ? { ...a, password: overrides[a.email] } : a
  );
}

function saveAccounts(accounts) {
  const defaultEmails = new Set(DEFAULT_ACCOUNTS.map(a => a.email));
  const extra = accounts.filter(a => !defaultEmails.has(a.email));
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(extra));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let currentUser = null;
let registerCode = null;
let codeTimer = null;

function initLogin() {
  const loginOverlay    = document.getElementById('login-overlay');
  const tabLogin        = document.getElementById('tab-login');
  const tabRegister     = document.getElementById('tab-register');
  const loginPanel      = document.getElementById('login-form-panel');
  const registerPanel   = document.getElementById('register-form-panel');

  const loginEmail      = document.getElementById('login-email');
  const loginPassword   = document.getElementById('login-password');
  const loginError      = document.getElementById('login-error');
  const loginBtn        = document.getElementById('login-btn');

  const registerEmail   = document.getElementById('register-email');
  const registerCodeEl  = document.getElementById('register-code');
  const registerPassword= document.getElementById('register-password');
  const registerError   = document.getElementById('register-error');
  const registerBtn     = document.getElementById('register-btn');
  const sendCodeBtn     = document.getElementById('send-code-btn');
  const codeHint        = document.getElementById('code-hint');

  const userArea        = document.getElementById('user-area');
  const currentUsernameEl = document.getElementById('current-username');
  const logoutBtn       = document.getElementById('logout-btn');
  const footerHint      = document.getElementById('login-footer-hint');

  const loginTabs       = document.getElementById('login-tabs');
  const forgotPanel     = document.getElementById('forgot-form-panel');
  const forgotLink      = document.getElementById('forgot-password-link');
  const backToLoginLink = document.getElementById('back-to-login-link');
  const resetEmail      = document.getElementById('reset-email');
  const resetCodeEl     = document.getElementById('reset-code');
  const resetSendCodeBtn= document.getElementById('reset-send-code-btn');
  const resetCodeHint   = document.getElementById('reset-code-hint');
  const resetPassword   = document.getElementById('reset-password');
  const resetPasswordConfirm = document.getElementById('reset-password-confirm');
  const resetError      = document.getElementById('reset-error');
  const resetBtn        = document.getElementById('reset-btn');

  let resetCode = null;
  let resetCodeTimer = null;

  loginEmail.value = 'admin@yimirror.com';
  loginPassword.value = 'admin123';

  function switchMode(mode) {
    const isLogin = mode === 'login';
    const isRegister = mode === 'register';
    const isForgot = mode === 'forgot';
    if (loginTabs) loginTabs.style.display = isForgot ? 'none' : 'flex';
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', isRegister);
    loginPanel.style.display = isLogin ? 'block' : 'none';
    registerPanel.style.display = isRegister ? 'block' : 'none';
    if (forgotPanel) forgotPanel.style.display = isForgot ? 'block' : 'none';
    loginError.textContent = '';
    registerError.textContent = '';
    if (resetError) resetError.textContent = '';
    footerHint.textContent = isLogin
      ? '演示账号：admin@yimirror.com / admin123'
      : (isRegister ? '注册成功后即可使用邮箱登录' : '通过邮箱验证码重置密码');
    if (isLogin) loginEmail.focus();
    else if (isRegister) registerEmail.focus();
    else if (isForgot && resetEmail) resetEmail.focus();
  }

  function doLogin() {
    const email = loginEmail.value.trim().toLowerCase();
    const pwd   = loginPassword.value;
    if (!email || !pwd) {
      loginError.textContent = '请输入邮箱和密码';
      return;
    }
    const account = getAccounts().find(a => a.email === email && a.password === pwd);
    if (!account) {
      loginError.textContent = '邮箱或密码错误';
      loginPassword.value = '';
      return;
    }
    currentUser = account;
    loginOverlay.style.display = 'none';
    userArea.style.display = 'flex';
    currentUsernameEl.textContent = account.email.split('@')[0];
    const landingPage = document.getElementById('landing-page');
    if (landingPage) landingPage.style.display = 'block';
    loginError.textContent = '';
    loginPassword.value = '';
  }

  function doLogout() {
    currentUser = null;
    loginOverlay.style.display = 'flex';
    userArea.style.display = 'none';
    const landingPage = document.getElementById('landing-page');
    if (landingPage) landingPage.style.display = 'none';
    loginEmail.value = '';
    loginPassword.value = '';
    loginError.textContent = '';
    loginEmail.focus();
  }

  function resetCodeButton() {
    if (codeTimer) {
      clearInterval(codeTimer);
      codeTimer = null;
    }
    sendCodeBtn.disabled = false;
    sendCodeBtn.textContent = '获取验证码';
  }

  function sendCode() {
    const email = registerEmail.value.trim().toLowerCase();
    if (!email) {
      registerError.textContent = '请先输入邮箱';
      registerEmail.focus();
      return;
    }
    if (!isValidEmail(email)) {
      registerError.textContent = '邮箱格式不正确';
      registerEmail.focus();
      return;
    }
    if (getAccounts().some(a => a.email === email)) {
      registerError.textContent = '该邮箱已注册，请直接登录';
      return;
    }
    registerError.textContent = '';
    registerCode = String(Math.floor(100000 + Math.random() * 900000));
    codeHint.textContent = '验证码已发送（演示环境）：' + registerCode + '，5 分钟内有效';
    let seconds = 60;
    sendCodeBtn.disabled = true;
    sendCodeBtn.textContent = seconds + 's 后重发';
    codeTimer = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        resetCodeButton();
      } else {
        sendCodeBtn.textContent = seconds + 's 后重发';
      }
    }, 1000);
  }

  function doRegister() {
    const email = registerEmail.value.trim().toLowerCase();
    const code  = registerCodeEl.value.trim();
    const pwd   = registerPassword.value;
    if (!email || !code || !pwd) {
      registerError.textContent = '请填写邮箱、验证码和密码';
      return;
    }
    if (!isValidEmail(email)) {
      registerError.textContent = '邮箱格式不正确';
      return;
    }
    if (getAccounts().some(a => a.email === email)) {
      registerError.textContent = '该邮箱已注册，请直接登录';
      return;
    }
    if (!registerCode || code !== registerCode) {
      registerError.textContent = '验证码错误';
      return;
    }
    if (pwd.length < 6) {
      registerError.textContent = '密码至少需要 6 位';
      return;
    }
    const accounts = getAccounts();
    accounts.push({ email, password: pwd, role: '普通用户' });
    saveAccounts(accounts);
    resetCodeButton();
    registerCode = null;
    registerCodeEl.value = '';
    registerPassword.value = '';
    codeHint.textContent = '';
    loginEmail.value = email;
    loginPassword.value = '';
    switchMode('login');
    loginError.textContent = '注册成功，请登录';
  }

  function resetResetCodeButton() {
    if (resetCodeTimer) {
      clearInterval(resetCodeTimer);
      resetCodeTimer = null;
    }
    if (resetSendCodeBtn) {
      resetSendCodeBtn.disabled = false;
      resetSendCodeBtn.textContent = '获取验证码';
    }
  }

  function sendResetCode() {
    const email = resetEmail.value.trim().toLowerCase();
    if (!email) {
      resetError.textContent = '请先输入邮箱';
      resetEmail.focus();
      return;
    }
    if (!isValidEmail(email)) {
      resetError.textContent = '邮箱格式不正确';
      resetEmail.focus();
      return;
    }
    if (!getAccounts().some(a => a.email === email)) {
      resetError.textContent = '该邮箱未注册，请先注册';
      return;
    }
    resetError.textContent = '';
    resetCode = String(Math.floor(100000 + Math.random() * 900000));
    resetCodeHint.textContent = '验证码已发送（演示环境）：' + resetCode + '，5 分钟内有效';
    let seconds = 60;
    resetSendCodeBtn.disabled = true;
    resetSendCodeBtn.textContent = seconds + 's 后重发';
    resetCodeTimer = setInterval(() => {
      seconds--;
      if (seconds <= 0) {
        resetResetCodeButton();
      } else {
        resetSendCodeBtn.textContent = seconds + 's 后重发';
      }
    }, 1000);
  }

  function doResetPassword() {
    const email = resetEmail.value.trim().toLowerCase();
    const code = resetCodeEl.value.trim();
    const pwd = resetPassword.value;
    const confirm = resetPasswordConfirm.value;
    if (!email || !code || !pwd || !confirm) {
      resetError.textContent = '请填写完整信息';
      return;
    }
    if (!isValidEmail(email)) {
      resetError.textContent = '邮箱格式不正确';
      return;
    }
    if (!getAccounts().some(a => a.email === email)) {
      resetError.textContent = '该邮箱未注册，请先注册';
      return;
    }
    if (!resetCode || code !== resetCode) {
      resetError.textContent = '验证码错误';
      return;
    }
    if (pwd.length < 6) {
      resetError.textContent = '密码至少需要 6 位';
      return;
    }
    if (pwd !== confirm) {
      resetError.textContent = '两次输入的密码不一致';
      return;
    }
    setPasswordOverride(email, pwd);
    resetResetCodeButton();
    resetCode = null;
    resetCodeEl.value = '';
    resetPassword.value = '';
    resetPasswordConfirm.value = '';
    resetCodeHint.textContent = '';
    loginEmail.value = email;
    loginPassword.value = '';
    switchMode('login');
    loginError.textContent = '密码已重置，请用新密码登录';
  }

  if (tabLogin) tabLogin.addEventListener('click', () => switchMode('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchMode('register'));
  if (loginBtn) loginBtn.addEventListener('click', doLogin);
  if (loginPassword) loginPassword.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  if (loginEmail) loginEmail.addEventListener('keydown', e => { if (e.key === 'Enter') loginPassword.focus(); });
  if (registerBtn) registerBtn.addEventListener('click', doRegister);
  if (sendCodeBtn) sendCodeBtn.addEventListener('click', sendCode);
  if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
  if (forgotLink) forgotLink.addEventListener('click', () => switchMode('forgot'));
  if (backToLoginLink) backToLoginLink.addEventListener('click', () => switchMode('login'));
  if (resetSendCodeBtn) resetSendCodeBtn.addEventListener('click', sendResetCode);
  if (resetBtn) resetBtn.addEventListener('click', doResetPassword);
}

const TOTAL_STEPS = 6;
let currentStep = 1;

function renderStep(step) {
  currentStep = step;
  document.querySelectorAll('.step-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.panel === String(step));
  });

  const stepItems = document.querySelectorAll('.step-item');
  const dividers = document.querySelectorAll('.step-divider');
  stepItems.forEach(el => {
    const idx = Number(el.dataset.step);
    el.classList.toggle('active', idx === step);
    el.classList.toggle('done', idx < step);
  });
  dividers.forEach((el, i) => {
    el.classList.toggle('done', i + 1 < step);
  });

  const stepCurrentEl = document.getElementById('step-current');
  if (stepCurrentEl) stepCurrentEl.textContent = step;
  const prevStepEl = document.getElementById('prev-step');
  if (prevStepEl) prevStepEl.disabled = step === 1;

  const nextBtn = document.getElementById('next-step');
  if (nextBtn) {
    if (step === TOTAL_STEPS) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'flex';
      nextBtn.innerHTML = step === TOTAL_STEPS - 1
        ? '前往生成 <i class="fas fa-arrow-right ml-1"></i>'
        : '下一步 <i class="fas fa-arrow-right ml-1"></i>';
    }
  }

  requestAnimationFrame(() => {
    if (typeof positionVolumeBubble === 'function') positionVolumeBubble();
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', function() {
    const target = this.dataset.view;
    const landingPage = document.getElementById('landing-page');

    // 创作中心：显示顶部导航
    if (target === 'short-video') {
      if (landingPage) landingPage.style.display = 'none';
      document.querySelectorAll('.sidebar-item').forEach(n => n.classList.toggle('active', n === this));
      const createTopNav = document.getElementById('createTopNav');
      if (createTopNav) createTopNav.classList.add('visible');
      // 显示短视频面板
      document.querySelectorAll('.view-panel').forEach(p => {
        p.classList.toggle('active', p.dataset.viewPanel === 'short-video');
      });
      // 隐藏资产库 Tab
      const assetTabs = document.getElementById('assetTabs');
      if (assetTabs) assetTabs.classList.remove('visible');
      return;
    }

    // 资产库：显示顶部 Tab 导航
    if (target === 'asset-library') {
      if (landingPage) landingPage.style.display = 'none';
      document.querySelectorAll('.sidebar-item').forEach(n => n.classList.toggle('active', n === this));
      const assetTabs = document.getElementById('assetTabs');
      if (assetTabs) assetTabs.classList.add('visible');
      // 默认激活"创作资产"
      document.querySelectorAll('[data-asset-tab]').forEach(t => t.classList.toggle('active', t.dataset.assetTab === 'project'));
      document.querySelectorAll('.view-panel').forEach(p => {
        p.classList.toggle('active', p.dataset.viewPanel === 'project');
      });
      // 隐藏创作中心顶部导航
      const createTopNav = document.getElementById('createTopNav');
      if (createTopNav) createTopNav.classList.remove('visible');
      return;
    }

    // 其他菜单隐藏所有顶部导航
    const createTopNav = document.getElementById('createTopNav');
    if (createTopNav) createTopNav.classList.remove('visible');
    const assetTabs = document.getElementById('assetTabs');
    if (assetTabs) assetTabs.classList.remove('visible');

    document.querySelectorAll('.sidebar-item').forEach(n => n.classList.toggle('active', n === this));

    // 首页：回到落地页
    if (target === 'home') {
      if (landingPage) landingPage.style.display = 'block';
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      return;
    }

    if (landingPage) landingPage.style.display = 'none';
    document.querySelectorAll('.view-panel').forEach(p => {
      if (p.dataset.viewPanel === target) p.classList.add('active');
      else p.classList.remove('active');
    });
  });
});

// AI 短视频视图内的模块切换（快速创作 / 自定义素材）
// 一级菜单(视频生成 / 图片生成):切换并展示对应二级子菜单,默认选中该组第一个
(function initCreationMenu() {
  const nav = document.getElementById('module-nav');
  if (!nav) return;
  const sub = nav.querySelector('.module-nav-sub');

  function activateModule(target) {
    document.querySelectorAll('#module-nav .module-nav-item').forEach(n => n.classList.toggle('active', n.dataset.module === target));
    document.querySelectorAll('[data-view-panel="short-video"] .module-content').forEach(p => {
      p.classList.toggle('active', p.dataset.moduleContent === target);
    });
  }

  function showMenu(menu) {
    nav.querySelectorAll('.module-title-item').forEach(t => t.classList.toggle('active', t.dataset.menu === menu));
    sub.querySelectorAll('.module-nav-item').forEach(it => {
      it.style.display = (it.dataset.menu === menu) ? '' : 'none';
    });
    const first = sub.querySelector('.module-nav-item[data-menu="' + menu + '"]');
    if (first) activateModule(first.dataset.module);
  }

  nav.querySelectorAll('.module-title-item').forEach(t => {
    t.addEventListener('click', function() {
      showMenu(this.dataset.menu);
    });
  });

  // 初始化:默认只显示"视频生成"组
  showMenu('video');

  // 修复:确保每个模块的预览面板作为 module-split 的第二子(避免孤儿预览框跑到页面下方)
  document.querySelectorAll('[data-view-panel="short-video"] .module-content').forEach(function(mc) {
    var ms = mc.querySelector(':scope > .module-split');
    if (!ms) return;
    var prev = mc.querySelector(':scope > .module-preview-panel') || mc.querySelector('.module-preview-panel');
    if (prev && prev.parentElement !== ms) {
      ms.appendChild(prev);
    }
  });
})();

document.querySelectorAll('#module-nav .module-nav-item').forEach(item => {
  item.addEventListener('click', function() {
    const target = this.dataset.module;
    document.querySelectorAll('#module-nav .module-nav-item').forEach(n => n.classList.toggle('active', n === this));
    document.querySelectorAll('[data-view-panel="short-video"] .module-content').forEach(p => {
      p.classList.toggle('active', p.dataset.moduleContent === target);
    });
    if (typeof applyCreateLayout === 'function') applyCreateLayout();
  });
});

// ===== 生成工具 Tab 切换 =====
(function initGenToolsMenu() {
  const nav = document.getElementById('gen-tools-nav');
  if (!nav) return;

  function showGenMenu(menu) {
    nav.querySelectorAll('.module-title-item').forEach(t => t.classList.toggle('active', t.dataset.genMenu === menu));
    document.querySelectorAll('[data-view-panel="gen-tools"] .module-content').forEach(p => {
      p.classList.toggle('active', p.dataset.genContent === menu);
    });
  }

  nav.querySelectorAll('.module-title-item').forEach(t => {
    t.addEventListener('click', function() {
      showGenMenu(this.dataset.genMenu);
    });
  });

  // 初始化默认显示角色生成
  showGenMenu('character');
})();

// ===== 生成工具详情页交互（主视图 → 多视图） =====
(function initGenDetail() {
  function renderMock(stage, label) {
    stage.classList.add('has-result');
    stage.innerHTML =
      '<div class="gen-result">' +
      '<i class="fas fa-check-circle gen-result-icon"></i>' +
      '<div class="gen-result-label">' + label + ' 已生成</div>' +
      '</div>';
  }

  // 生成主视图描述输入弹窗
  var promptModal    = document.getElementById('gen-prompt-modal');
  var promptInner    = promptModal ? promptModal.querySelector('.prompt-modal') : null;
  var promptInput    = document.getElementById('gen-prompt-input');
  var promptTitle    = document.getElementById('gen-prompt-title');
  var promptConfirm  = document.getElementById('gen-prompt-confirm');
  var currentGenerate = null;

  function closePrompt() {
    if (promptModal) promptModal.classList.remove('open');
  }
  document.querySelectorAll('[data-gen-prompt-close]').forEach(function(btn) {
    btn.addEventListener('click', closePrompt);
  });
  // 点击外部区域关闭弹窗
  if (promptModal) {
    promptModal.addEventListener('click', function(e) {
      if (e.target === promptModal) closePrompt();
    });
  }
  if (promptConfirm) {
    promptConfirm.addEventListener('click', function() {
      closePrompt();
      if (currentGenerate) currentGenerate();
    });
  }

  function bindDetail(container) {
    // 名称字数统计
    const nameInput = container.querySelector('.name-input');
    const charCount = container.querySelector('.char-count');
    if (nameInput && charCount) {
      nameInput.addEventListener('input', function() {
        charCount.textContent = nameInput.value.length + '/20';
      });
    }

    const primaryBtn = container.querySelector('.gen-primary-btn');
    const secondaryBtn = container.querySelector('.gen-secondary-btn');
    const mainStage = container.querySelector('.gen-view-stage.main');
    const subStage = container.querySelector('.gen-view-stage.sub');
    if (!primaryBtn || !mainStage) return;

    // 生成主视图
    primaryBtn.addEventListener('click', function() {
      currentGenerate = function() {
        primaryBtn.disabled = true;
        primaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
        // 显示加载弹窗
        var loadingModal = document.getElementById('loading-modal');
        if (loadingModal) loadingModal.classList.add('open');
        setTimeout(function() {
          renderMock(mainStage, primaryBtn.dataset.mainLabel || '主视图');
          primaryBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> ' + (primaryBtn.dataset.genLabel || '生成主视图');
          primaryBtn.disabled = false;
          if (secondaryBtn) secondaryBtn.disabled = false;
          // 隐藏加载弹窗
          if (loadingModal) loadingModal.classList.remove('open');
        }, 1200);
      };
      var opened = false;
      if (promptModal && promptInput) {
        promptTitle.textContent = primaryBtn.dataset.mainLabel || '生成主视图';
        promptInput.value = '';
        promptInput.placeholder = primaryBtn.dataset.prompt || '请描述角色的身份、年龄、体型、五官、发型、服装和饰品等形象特征。';
        
        // 延迟计算位置，确保按钮已渲染
        setTimeout(function() {
          var btnRect = primaryBtn.getBoundingClientRect();
          // 如果按钮不可见，使用默认位置
          if (btnRect.width === 0 || btnRect.height === 0) {
            btnRect = { left: window.innerWidth / 2 - 60, top: window.innerHeight / 2, width: 120, height: 40, bottom: window.innerHeight / 2 + 40 };
          }
          
          var modalWidth = 480;
          var modalHeight = 280;
          
          // 尝试定位在按钮上方居中
          var left = btnRect.left + (btnRect.width / 2) - (modalWidth / 2);
          var top = btnRect.top - modalHeight - 12;
          
          // 如果上方空间不够，定位在按钮下方
          if (top < 10) {
            top = btnRect.bottom + 12;
          }
          
          // 水平方向边界检查
          if (left < 10) left = 10;
          if (left + modalWidth > window.innerWidth - 10) left = window.innerWidth - modalWidth - 10;
          
          if (promptInner) {
            promptInner.style.position = 'fixed';
            promptInner.style.left = left + 'px';
            promptInner.style.top = top + 'px';
          }
          promptModal.classList.add('open');
          if (promptInput) promptInput.focus();
        }, 50);
        opened = true;
      }
      if (!opened) currentGenerate();
    });

    // 加载弹窗取消按钮
    var loadingCancelBtn = document.getElementById('loading-cancel-btn');
    if (loadingCancelBtn) {
      loadingCancelBtn.addEventListener('click', function() {
        var loadingModal = document.getElementById('loading-modal');
        if (loadingModal) loadingModal.classList.remove('open');
      });
    }

    // 创作三视图 / 多视图（依赖主视图生成后启用）
    if (secondaryBtn && subStage) {
      secondaryBtn.addEventListener('click', function() {
        secondaryBtn.disabled = true;
        secondaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
        setTimeout(function() {
          renderMock(subStage, secondaryBtn.dataset.subLabel || '多视图');
          secondaryBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> ' + (secondaryBtn.dataset.genLabel || '创作多视图');
          secondaryBtn.disabled = false;
        }, 1200);
      });
    }
  }

  document.querySelectorAll('[data-view-panel="gen-tools"] .module-content[data-gen-content]').forEach(bindDetail);
})();

// ===== 选择主视图弹窗（从创作资产选图 / 本地上传） =====
(function initPickViewModal() {
  const overlay   = document.getElementById('pick-view-modal');
  const grid      = document.getElementById('pick-grid');
  const emptyEl   = document.getElementById('pick-empty');
  const confirmBtn= document.getElementById('pick-confirm-btn');
  const uploadBtn = document.getElementById('pick-upload-btn');
  const fileInput = document.getElementById('pick-file-input');
  if (!overlay || !grid) return;

  const UPLOAD_KEY = 'yimirror_uploads';
  const isImage = (name) => /\.(png|jpe?g|gif|webp|bmp|svg|ico)$/i.test(name || '');

  let targetStage = null;
  let targetCard = null;

  function open(stage, card) {
    targetStage = stage;
    targetCard = card || null;
    renderAssets();
    overlay.classList.add('open');
  }
  function close() {
    overlay.classList.remove('open');
    targetStage = null;
    targetCard = null;
    if (confirmBtn) confirmBtn.disabled = true;
  }

  function loadUploads() {
    try {
      return JSON.parse(localStorage.getItem(UPLOAD_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
  function saveUploads(list) {
    localStorage.setItem(UPLOAD_KEY, JSON.stringify(list));
  }

  function renderAssets() {
    const assets = loadUploads().filter(u => isImage(u.name));
    grid.innerHTML = '';
    if (assets.length === 0) {
      if (emptyEl) emptyEl.style.display = assets.length === 0 ? 'flex' : 'none';
      if (confirmBtn) confirmBtn.disabled = true;
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    assets.forEach(u => {
      const card = document.createElement('div');
      card.className = 'pick-asset';
      card.dataset.assetId = u.id;
      card.innerHTML = u.thumb
        ? '<img src="' + u.thumb + '" alt="" />'
        : '<div class="pick-asset-fallback"><i class="fas fa-file-image"></i></div>' +
          '<span class="pick-asset-name"></span>';
      if (!u.thumb) card.querySelector('.pick-asset-name').textContent = u.name;
      card.addEventListener('click', function() {
        grid.querySelectorAll('.pick-asset').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        if (confirmBtn) confirmBtn.disabled = false;
      });
      grid.appendChild(card);
    });
  }

  // 确认：把选中的资产放入主视图舞台
  confirmBtn.addEventListener('click', function() {
    const sel = grid.querySelector('.pick-asset.selected');
    if (!sel || !targetStage) return;
    const asset = loadUploads().find(u => u.id === sel.dataset.assetId);
    if (!asset) { close(); return; }
    targetStage.classList.add('has-result');
    if (asset.thumb) {
      targetStage.innerHTML = '<img class="gen-view-img" src="' + asset.thumb + '" alt="主视图" />';
    } else {
      targetStage.innerHTML =
        '<div class="gen-result">' +
        '<i class="fas fa-file-image gen-result-icon"></i>' +
        '<div class="gen-result-label">' + escapeHtml(asset.name) + '</div>' +
        '</div>';
    }
    const cardForSecondary = targetCard;
    close();
    if (cardForSecondary) {
      const secBtn = cardForSecondary.querySelector('.gen-secondary-btn');
      if (secBtn) secBtn.disabled = false;
    }
  });

  // 上传并添加到创作资产
  uploadBtn.addEventListener('click', function() {
    fileInput.click();
  });

  fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    if (!file) return;
    if (!isImage(file.name)) { alert('请选择图片文件'); fileInput.value = ''; return; }
    const reader = new FileReader();
    reader.onload = function() {
      const url = reader.result;
      const uploads = loadUploads();
      const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      uploads.push({ id: id, name: file.name, size: file.size, folderId: null, thumb: url });
      saveUploads(uploads);
      fileInput.value = '';
      renderAssets();
      const card = grid.querySelector('.pick-asset[data-asset-id="' + id + '"]');
      if (card) {
        grid.querySelectorAll('.pick-asset').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        if (confirmBtn) confirmBtn.disabled = false;
      }
    };
    reader.readAsDataURL(file);
  });

  // 关闭入口
  overlay.querySelectorAll('[data-pick-close]').forEach(el => {
    el.addEventListener('click', close);
  });
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  // 事件委托：点击"选择主视图"按钮 → 打开弹窗
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-pick-view="main"]');
    if (!btn) return;
    const card = btn.closest('.gen-view-card');
    const stage = card ? card.querySelector('.gen-view-stage') : null;
    if (stage) open(stage, card);
  });
})();

// ===== 顶部 Tab 切换（创作中心 + 资产库） =====
(function initTopTabs() {
  document.querySelectorAll('.asset-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.dataset.assetTab;
      const group = this.closest('.asset-tabs');
      if (group) group.querySelectorAll('.asset-tab').forEach(t => t.classList.toggle('active', t === this));
      document.querySelectorAll('.view-panel').forEach(p => {
        p.classList.toggle('active', p.dataset.viewPanel === target);
      });
    });
  });
})();

// ===== 创作中心顶部导航（视频生成/图片生成 + 子菜单） =====
(function initCreateTopNav() {
  const nav = document.getElementById('createTopNav');
  if (!nav) return;

  // 一级菜单切换
  nav.querySelectorAll('.create-top-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const menu = this.dataset.createMenu;
      // 激活当前一级 Tab
      nav.querySelectorAll('.create-top-tab').forEach(t => t.classList.toggle('active', t === this));
      // 显示/隐藏对应的二级菜单项
      nav.querySelectorAll('.create-top-sub-item').forEach(item => {
        const show = item.dataset.menu === menu;
        item.style.display = show ? '' : 'none';
      });
      // 激活该组的第一个子菜单
      const first = nav.querySelector('.create-top-sub-item[data-menu="' + menu + '"]');
      if (first) {
        nav.querySelectorAll('.create-top-sub-item').forEach(i => i.classList.toggle('active', i === first));
        activateModule(first.dataset.createModule);
      }
    });
  });

  // 二级菜单切换
  nav.querySelectorAll('.create-top-sub-item').forEach(item => {
    item.addEventListener('click', function() {
      nav.querySelectorAll('.create-top-sub-item').forEach(i => i.classList.toggle('active', i === this));
      activateModule(this.dataset.createModule);
    });
  });

  function activateModule(target) {
    // 激活对应的模块内容
    document.querySelectorAll('[data-view-panel="short-video"] .module-content').forEach(p => {
      p.classList.toggle('active', p.dataset.moduleContent === target);
    });
    // 切换后重排左右两栏，确保新激活模块与右侧预览房间顶部对齐
    if (typeof applyCreateLayout === 'function') applyCreateLayout();
  }
})();

// ===== 项目管理 - 筛选 / 状态 / 搜索 =====
(function initProjectManager() {
  const grid = document.getElementById('pm-project-grid');
  if (!grid) return;

  const state = { type: 'all', status: 'all', keyword: '' };

  const applyFilter = () => {
    grid.querySelectorAll('.pm-project-card').forEach(card => {
      const cardType = card.dataset.pmType;
      const cardStatus = card.dataset.pmStatus;
      const title = (card.querySelector('.pm-project-title')?.textContent || '').toLowerCase();
      const typeMatch = state.type === 'all' || cardType === state.type;
      const statusMatch = state.status === 'all' || cardStatus === state.status;
      const kwMatch = !state.keyword || title.includes(state.keyword);
      card.style.display = typeMatch && statusMatch && kwMatch ? '' : 'none';
    });
  };

  document.querySelectorAll('.pm-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.pm-filter-chip').forEach(c => c.classList.toggle('active', c === chip));
      state.type = chip.dataset.pmFilter;
      applyFilter();
    });
  });

  document.querySelectorAll('.pm-status-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.pm-status-chip').forEach(c => c.classList.toggle('active', c === chip));
      state.status = chip.dataset.pmStatus;
      applyFilter();
    });
  });

  const searchInput = document.getElementById('pm-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.keyword = searchInput.value.trim().toLowerCase();
      applyFilter();
    });
  }

  // 点击项目卡片跳转到对应模块视图
  const viewByType = {
    'short-video': 'short-video',
    'short-drama': 'short-drama',
    'image-to-video': 'image-to-video',
  };
  grid.addEventListener('click', (ev) => {
    if (ev.target.closest('.pm-action-btn')) return;
    const card = ev.target.closest('.pm-project-card');
    if (!card) return;
    const view = viewByType[card.dataset.pmType];
    if (!view) return;
    const navItem = document.querySelector(`.sidebar-item[data-view="${view}"]`);
    if (navItem) navItem.click();
  });

  const newBtn = document.getElementById('pm-new-project-btn');
  if (newBtn) {
    newBtn.addEventListener('click', () => {
      const shortVideoNav = document.querySelector('.sidebar-item[data-view="short-video"]');
      if (shortVideoNav) shortVideoNav.click();
    });
  }
})();

// ===== 资产库：文件夹 + 上传管理 =====
(function initAssetLibrary() {
  const folderGrid   = document.getElementById('pm-folder-grid');
  const newFolderBtn = document.getElementById('pm-new-folder-btn');
  const uploadGrid   = document.getElementById('pm-upload-grid');
  const uploadEntry  = document.getElementById('pm-upload-entry');
  const uploadHint   = document.querySelector('.pm-upload-entry-hint');
  const breadcrumb   = document.getElementById('pm-breadcrumb');
  const backBtn      = document.getElementById('pm-back-btn');
  const crumbPath    = document.getElementById('pm-current-path');
  const toolbar      = document.getElementById('pm-toolbar');
  const projectGrid  = document.getElementById('pm-project-grid');
  if (!folderGrid || !newFolderBtn) return;

  const FOLDER_KEY = 'yimirror_folders';
  const UPLOAD_KEY = 'yimirror_uploads';

  const load = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };
  const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));
  const genId = () => 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  let folders = load(FOLDER_KEY);
  let uploads = load(UPLOAD_KEY);
  let currentFolderId = null;

  const currentFolder = () => currentFolderId === null ? null : folders.find(f => f.id === currentFolderId);

  const getUniqueName = (list, base) => {
    const names = new Set(list.map(f => f.name));
    if (!names.has(base)) return base;
    let i = 2;
    while (names.has(`${base} ${i}`)) i++;
    return `${base} ${i}`;
  };

  const fileType = (name) => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (/^(png|jpe?g|gif|webp|bmp|svg|ico)$/.test(ext)) return { icon: 'fa-file-image', cls: 'type-image' };
    if (/^(mp4|mov|avi|mkv|webm|flv)$/.test(ext)) return { icon: 'fa-file-video', cls: 'type-video' };
    if (/^(mp3|wav|flac|aac|ogg|m4a)$/.test(ext)) return { icon: 'fa-file-audio', cls: 'type-audio' };
    return { icon: 'fa-file', cls: 'type-file' };
  };

  function renderFolders() {
    folderGrid.innerHTML = '';
    folders.forEach(folder => {
      const card = document.createElement('div');
      card.className = 'pm-folder-card';
      card.dataset.folderId = folder.id;
      card.innerHTML = `
        <i class="fas fa-folder folder-icon"></i>
        <span class="pm-folder-name"></span>
        <div class="pm-folder-actions">
          <button class="pm-action-btn" title="重命名" data-folder-rename><i class="fas fa-pen"></i></button>
        </div>
      `;
      card.querySelector('.pm-folder-name').textContent = folder.name;
      folderGrid.appendChild(card);
    });
  }

  function renderUploads() {
    uploadGrid.innerHTML = '';
    const list = uploads.filter(u => u.folderId === currentFolderId);

    // 第一个位置：上传入口卡片
    const uploadCard = document.createElement('div');
    uploadCard.className = 'pm-upload-card';
    uploadCard.addEventListener('click', () => pickFiles());
    uploadCard.innerHTML =
      '<div class="pm-upload-card-inner">' +
      '<i class="fas fa-plus"></i>' +
      '<span>本地上传 / 拖拽素材</span>' +
      '</div>';
    uploadGrid.appendChild(uploadCard);

    if (currentFolderId !== null && list.length === 0) {
      uploadGrid.innerHTML += '<div class="pm-empty-tip"><i class="fas fa-folder-open"></i><span>该文件夹为空，可将文件拖拽到上方上传区域</span></div>';
      return;
    }
    list.forEach(u => {
      const t = fileType(u.name);
      const card = document.createElement('div');
      card.className = 'pm-file-card';
      card.dataset.fileId = u.id;

      if (u.thumb) {
        const img = document.createElement('img');
        img.className = 'pm-file-thumb';
        img.src = u.thumb;
        img.alt = '';
        card.appendChild(img);
      } else {
        const fb = document.createElement('div');
        fb.className = 'pm-file-fallback';
        const ic = document.createElement('i');
        ic.className = 'fas ' + t.icon + ' file-icon ' + t.cls;
        fb.appendChild(ic);
        card.appendChild(fb);
      }

      // 视频时长标签
      if (t.cls === 'type-video' && u.duration) {
        const dur = document.createElement('div');
        dur.className = 'pm-file-duration';
        dur.textContent = formatDuration(u.duration);
        card.appendChild(dur);
      }

      const actions = document.createElement('div');
      actions.className = 'pm-file-actions';
      actions.innerHTML =
        '<button class="pm-action-btn" title="下载" data-file-download><i class="fas fa-download"></i></button>' +
        '<button class="pm-action-btn danger" title="删除" data-file-delete><i class="fas fa-trash"></i></button>';
      card.appendChild(actions);

      uploadGrid.appendChild(card);
    });
  }

  function formatDuration(sec) {
    sec = Math.round(sec || 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  function renderAll() {
    const insideFolder = currentFolderId !== null;
    const folder = currentFolder();
    if (breadcrumb) breadcrumb.style.display = insideFolder ? 'flex' : 'none';
    if (crumbPath) crumbPath.textContent = insideFolder ? '/ ' + folder.name : '';
    if (toolbar) toolbar.style.display = insideFolder ? 'none' : 'flex';
    if (projectGrid) projectGrid.style.display = insideFolder ? 'none' : '';
    folderGrid.style.display = insideFolder ? 'none' : '';
    if (uploadHint) {
      uploadHint.textContent = insideFolder
        ? '点击或拖拽图片 / 视频 / 音频到此处，上传到「' + folder.name + '」'
        : '点击或拖拽图片 / 视频 / 音频到此处，快速上传到创作资产';
    }
    renderFolders();
    renderUploads();
  }

  function renameFolder(folder) {
    const card = folderGrid.querySelector(`.pm-folder-card[data-folder-id="${folder.id}"]`);
    if (!card) return;
    const nameEl = card.querySelector('.pm-folder-name');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pm-folder-name-input';
    input.value = folder.name;
    input.maxLength = 30;
    nameEl.replaceWith(input);
    input.focus();
    input.select();

    let done = false;
    const commit = () => {
      if (done) return;
      done = true;
      const newName = input.value.trim();
      if (newName && newName !== folder.name) {
        folder.name = newName;
        save(FOLDER_KEY, folders);
      }
      renderAll();
    };
    const cancel = () => {
      if (done) return;
      done = true;
      renderFolders();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });
  }

  function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    Promise.all(files.map(f => makeThumb(f))).then(results => {
      files.forEach((f, i) => uploads.push({
        id: genId(), name: f.name, size: f.size, folderId: currentFolderId,
        thumb: results[i].thumb, duration: results[i].duration
      }));
      save(UPLOAD_KEY, uploads);
      renderUploads();
      const target = currentFolder() ? '「' + currentFolder().name + '」' : '资产库';
      alert('已上传 ' + files.length + ' 个文件到' + target);
    });
  }

  function makeThumb(file) {
    const cls = fileType(file.name).cls;
    if (cls === 'type-image') return imageThumb(file).then(thumb => ({ thumb, duration: null }));
    if (cls === 'type-video') return videoThumb(file);
    return Promise.resolve({ thumb: null, duration: null });
  }

  function imageThumb(file) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(scaleToDataUrl(img, img.naturalWidth, img.naturalHeight));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function videoThumb(file) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      let settled = false;
      const finish = val => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        resolve({ thumb: val, duration: video.duration || 0 });
      };
      video.muted = true;
      video.preload = 'auto';
      video.onloadeddata = () => {
        video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
      };
      video.onseeked = () => finish(scaleToDataUrl(video, video.videoWidth, video.videoHeight));
      video.onerror = () => finish(null);
      setTimeout(() => finish(null), 4000);
      video.src = url;
    });
  }

  function scaleToDataUrl(source, w, h) {
    if (!w || !h) return null;
    const scale = Math.min(1, 360 / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    try {
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch (e) {
      return null;
    }
  }

  function pickFiles() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*';
    input.multiple = true;
    input.addEventListener('change', () => addFiles(input.files));
    input.click();
  }

  function enterFolder(id) {
    currentFolderId = id;
    renderAll();
  }

  function goRoot() {
    currentFolderId = null;
    renderAll();
  }

  newFolderBtn.addEventListener('click', () => {
    folders.push({ id: genId(), name: getUniqueName(folders, '新建文件夹') });
    save(FOLDER_KEY, folders);
    renderFolders();
  });

  folderGrid.addEventListener('click', (ev) => {
    const renameBtn = ev.target.closest('[data-folder-rename]');
    const card = ev.target.closest('.pm-folder-card');
    if (!card) return;
    const folder = folders.find(f => f.id === card.dataset.folderId);
    if (!folder) return;
    if (renameBtn) renameFolder(folder);
    else enterFolder(folder.id);
  });

  uploadGrid.addEventListener('click', (ev) => {
    const card = ev.target.closest('.pm-file-card');
    if (!card) return;
    const file = uploads.find(u => u.id === card.dataset.fileId);
    if (!file) return;
    if (ev.target.closest('[data-file-delete]')) {
      uploads = uploads.filter(u => u.id !== card.dataset.fileId);
      save(UPLOAD_KEY, uploads);
      renderUploads();
      return;
    }
    if (ev.target.closest('[data-file-download]')) {
      downloadUpload(file);
    }
  });

  function downloadUpload(file) {
    if (!file.thumb) {
      alert('该文件暂不支持下载');
      return;
    }
    const a = document.createElement('a');
    a.href = file.thumb;
    a.download = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (backBtn) backBtn.addEventListener('click', goRoot);

  if (uploadEntry) {
    uploadEntry.addEventListener('click', () => pickFiles());
    uploadEntry.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadEntry.classList.add('dragover');
    });
    uploadEntry.addEventListener('dragleave', () => uploadEntry.classList.remove('dragover'));
    uploadEntry.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadEntry.classList.remove('dragover');
      addFiles(e.dataTransfer.files);
    });
  }

  renderAll();
})();

// ===== 快速创作 - 生成预览风格 =====
const generatePreviewBtn = document.getElementById('generate-preview-btn');
const stylePromptInput = document.getElementById('style-prompt');
const previewResult = document.getElementById('preview-result');
const previewImage = document.getElementById('preview-image');

if (generatePreviewBtn && stylePromptInput && previewResult && previewImage) {
  generatePreviewBtn.addEventListener('click', () => {
    const prompt = stylePromptInput.value.trim();
    if (!prompt) {
      alert('请输入风格提示词');
      return;
    }

    generatePreviewBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    generatePreviewBtn.disabled = true;

    setTimeout(() => {
      const encodedPrompt = encodeURIComponent(prompt);
      previewImage.src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedPrompt}&image_size=square`;
      previewResult.style.display = 'grid';
      generatePreviewBtn.innerHTML = '<i class="fas fa-image"></i> 生成预览';
      generatePreviewBtn.disabled = false;
    }, 1500);
  });
}

// ===== 自定义素材模块交互 =====
// ===== 自定义素材模块交互 =====
const CM_TOTAL_STEPS = 7;
let cmCurrentStep = 1;

function renderCmStep(step) {
  cmCurrentStep = step;
  document.querySelectorAll('.cm-step-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.cmPanel === String(step));
  });

  const stepItems = document.querySelectorAll('[data-cm-step]');
  const dividers = document.querySelectorAll('#cm-stepper .step-divider');
  stepItems.forEach(el => {
    const idx = Number(el.dataset.cmStep);
    el.classList.toggle('active', idx === step);
    el.classList.toggle('done', idx < step);
  });
  dividers.forEach((el, i) => {
    el.classList.toggle('done', i + 1 < step);
  });

  const cmStepCurrentEl = document.getElementById('cm-step-current');
  if (cmStepCurrentEl) cmStepCurrentEl.textContent = step;
  const cmPrevStepEl = document.getElementById('cm-prev-step');
  if (cmPrevStepEl) cmPrevStepEl.disabled = step === 1;

  const nextBtn = document.getElementById('cm-next-step');
  if (nextBtn) {
    if (step === CM_TOTAL_STEPS) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'flex';
      nextBtn.innerHTML = step === CM_TOTAL_STEPS - 1
        ? '前往生成 <i class="fas fa-arrow-right ml-1"></i>'
        : '下一步 <i class="fas fa-arrow-right ml-1"></i>';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('cm-prev-step')?.addEventListener('click', () => {
  if (cmCurrentStep > 1) renderCmStep(cmCurrentStep - 1);
});
document.getElementById('cm-next-step')?.addEventListener('click', () => {
  if (cmCurrentStep < CM_TOTAL_STEPS) {
    // 检查余额是否充足
    if (typeof TokenManager !== 'undefined' && !TokenManager.checkBalance()) {
      return;
    }
    renderCmStep(cmCurrentStep + 1);
    // 模拟Token消耗
    if (typeof TokenManager !== 'undefined') {
      const modelSelect = document.getElementById('sd-model-select');
      const currentModel = modelSelect ? modelSelect.value : 'GPT-4o';
      const tokenAmount = Math.floor(Math.random() * 6000) + 1500;
      TokenManager.recordUsage(currentModel, 'AI短视频', tokenAmount);
    }
  }
});
document.querySelectorAll('[data-cm-step]').forEach(item => {
  item.addEventListener('click', () => {
    renderCmStep(Number(item.dataset.cmStep));
  });
});

(function initCustomMaterial() {
  const uploadZone = document.getElementById('cm-upload-zone');
  const materialList = document.getElementById('cm-material-list');
  if (uploadZone) {
    uploadZone.addEventListener('dragover', e => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files || []);
      files.forEach(addMaterialItem);
    });
    uploadZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.multiple = true;
      input.addEventListener('change', () => {
        Array.from(input.files || []).forEach(addMaterialItem);
      });
      input.click();
    });
  }

  function addMaterialItem(file) {
    if (!materialList) return;
    const isVideo = file.type.startsWith('video/');
    const url = URL.createObjectURL(file);
    const item = document.createElement('div');
    item.className = 'cm-material-item';
    item.innerHTML = `
      <div class="cm-material-thumb">
        ${isVideo
          ? `<video src="${url}" muted></video><span class="cm-material-badge"><i class="fas fa-play"></i></span>`
          : `<img src="${url}" alt="${file.name}" />`}
      </div>
      <div class="cm-material-info">
        <div class="cm-material-name"><i class="fas fa-${isVideo ? 'video text-blue-500' : 'image text-pink-500'}"></i> ${file.name}</div>
        <div class="cm-material-meta">${(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <button class="cm-material-remove" title="删除"><i class="fas fa-times"></i></button>
    `;
    materialList.appendChild(item);
  }

  if (materialList) {
    materialList.addEventListener('click', e => {
      const btn = e.target.closest('.cm-material-remove');
      if (btn) btn.closest('.cm-material-item').remove();
    });
  }

  const durationSlider = document.getElementById('cm-duration-slider');
  const durationInput = document.getElementById('cm-duration-input');
  if (durationSlider && durationInput) {
    durationSlider.addEventListener('input', () => { durationInput.value = durationSlider.value; });
    durationInput.addEventListener('input', () => {
      const v = Math.max(5, Math.min(180, Number(durationInput.value) || 5));
      durationSlider.value = v;
    });
    document.querySelectorAll('[data-target="cm-duration-input"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.delta) || 0;
        const v = Math.max(5, Math.min(180, (Number(durationInput.value) || 5) + delta));
        durationInput.value = v;
        durationSlider.value = v;
      });
    });
  }

  function positionCmVolumeBubble() {
    const slider = document.getElementById('cm-bgm-volume');
    const bubble = document.getElementById('cm-bgm-volume-bubble');
    if (!slider || !bubble) return;
    const min = Number(slider.min);
    const max = Number(slider.max);
    const value = Number(slider.value);
    const ratio = (value - min) / (max - min);
    bubble.style.left = (ratio * slider.offsetWidth) + 'px';
    bubble.textContent = value.toFixed(2);
  }
  const cmVolume = document.getElementById('cm-bgm-volume');
  if (cmVolume) {
    cmVolume.addEventListener('input', positionCmVolumeBubble);
    window.addEventListener('resize', positionCmVolumeBubble);
    requestAnimationFrame(positionCmVolumeBubble);
  }

  const cmGenerateBtn = document.getElementById('cm-generate-btn');
  if (cmGenerateBtn) {
    cmGenerateBtn.addEventListener('click', () => {
      const progress = document.getElementById('cm-progress-fill');
      const messages = document.getElementById('cm-generate-messages');
      if (messages) messages.style.display = 'none';
      cmGenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成...';
      cmGenerateBtn.disabled = true;
      progress.style.width = '0%';
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 8;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          cmGenerateBtn.innerHTML = '<i class="fas fa-check"></i> 生成完成';
          cmGenerateBtn.disabled = false;
          cmGenerateBtn.style.background = 'linear-gradient(90deg, #45E6D5 0%, #5B8CFF 50%, #8B5CFF 100%)';
          if (messages) messages.style.display = 'block';
        }
        progress.style.width = p + '%';
      }, 200);
    });
  }
})();

// ===== 文生视频：剧本/脚本/小说上传 =====
(function initScriptUpload() {
  const zone = document.getElementById('qv-script-upload-zone');
  const fileBox = document.getElementById('qv-script-file');
  const textarea = document.getElementById('qv-script-input');
  if (!zone) return;

  function showFile(name) {
    if (!fileBox) return;
    fileBox.style.display = 'flex';
    fileBox.innerHTML =
      '<i class="fas fa-file-alt text-blue-500"></i>' +
      '<span class="qv-script-file-name"></span>' +
      '<button class="qv-script-file-remove" title="移除"><i class="fas fa-times"></i></button>';
    fileBox.querySelector('.qv-script-file-name').textContent = name;
    fileBox.querySelector('.qv-script-file-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      fileBox.style.display = 'none';
      fileBox.innerHTML = '';
    });
  }

  function handleFile(file) {
    if (!file) return;
    showFile(file.name);
    if (/\.txt$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = () => {
        if (textarea) textarea.value = String(reader.result || '');
      };
      reader.readAsText(file);
    }
  }

  zone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.doc,.docx,.pdf';
    input.addEventListener('change', () => handleFile(input.files[0]));
    input.click();
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    handleFile((e.dataTransfer.files || [])[0]);
  });
})();

// ===== 图生视频模块 =====
const I2V_TOTAL_STEPS = 2;
let i2vCurrentStep = 1;

function renderI2vStep(step) {
  i2vCurrentStep = step;
  document.querySelectorAll('.i2v-step-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.i2vPanel === String(step));
  });

  const stepItems = document.querySelectorAll('[data-i2v-step]');
  const dividers = document.querySelectorAll('#i2v-stepper .step-divider');
  stepItems.forEach(el => {
    const idx = Number(el.dataset.i2vStep);
    el.classList.toggle('active', idx === step);
    el.classList.toggle('done', idx < step);
  });
  dividers.forEach((el, i) => {
    el.classList.toggle('done', i + 1 < step);
  });

  const i2vStepCurrentEl = document.getElementById('i2v-step-current');
  if (i2vStepCurrentEl) i2vStepCurrentEl.textContent = step;
  const i2vPrevStepEl = document.getElementById('i2v-prev-step');
  if (i2vPrevStepEl) i2vPrevStepEl.disabled = step === 1;

  const nextBtn = document.getElementById('i2v-next-step');
  if (nextBtn) {
    if (step === I2V_TOTAL_STEPS) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'flex';
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('i2v-prev-step')?.addEventListener('click', () => {
  if (i2vCurrentStep > 1) renderI2vStep(i2vCurrentStep - 1);
});
document.getElementById('i2v-next-step')?.addEventListener('click', () => {
  if (i2vCurrentStep < I2V_TOTAL_STEPS) {
    // 检查余额是否充足
    if (typeof TokenManager !== 'undefined' && !TokenManager.checkBalance()) {
      return;
    }
    renderI2vStep(i2vCurrentStep + 1);
    // 模拟Token消耗
    if (typeof TokenManager !== 'undefined') {
      const modelSelect = document.getElementById('sd-model-select');
      const currentModel = modelSelect ? modelSelect.value : 'GPT-4o';
      const tokenAmount = Math.floor(Math.random() * 9000) + 4000;
      TokenManager.recordUsage(currentModel, '图生视频', tokenAmount);
    }
  }
});
document.querySelectorAll('[data-i2v-step]').forEach(item => {
  item.addEventListener('click', () => {
    renderI2vStep(Number(item.dataset.i2vStep));
  });
});

(function initImageToVideo() {
  const imageUpload = document.getElementById('i2v-image-upload');
  const imageList = document.getElementById('i2v-image-list');

  if (imageUpload) {
    imageUpload.addEventListener('dragover', e => {
      e.preventDefault();
      imageUpload.classList.add('dragover');
    });
    imageUpload.addEventListener('dragleave', () => imageUpload.classList.remove('dragover'));
    imageUpload.addEventListener('drop', e => {
      e.preventDefault();
      imageUpload.classList.remove('dragover');
      Array.from(e.dataTransfer.files || []).forEach(addI2vImage);
    });
    imageUpload.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.multiple = true;
      input.addEventListener('change', () => {
        Array.from(input.files || []).forEach(addI2vImage);
      });
      input.click();
    });
  }

  function addI2vImage(file) {
    if (!imageList || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const item = document.createElement('div');
    item.className = 'cm-material-item';
    item.innerHTML = `
      <div class="cm-material-thumb"><img src="${url}" alt="${file.name}" /></div>
      <div class="cm-material-info">
        <div class="cm-material-name"><i class="fas fa-image text-pink-500"></i> ${file.name}</div>
        <div class="cm-material-meta">${(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <button class="cm-material-remove" title="删除"><i class="fas fa-times"></i></button>
    `;
    imageList.appendChild(item);
  }

  if (imageList) {
    imageList.addEventListener('click', e => {
      const btn = e.target.closest('.cm-material-remove');
      if (btn) btn.closest('.cm-material-item').remove();
    });
  }

  const i2vGenerateBtn = document.getElementById('i2v-generate-btn');
  if (i2vGenerateBtn) {
    i2vGenerateBtn.addEventListener('click', () => {
      const progress = document.getElementById('i2v-progress-fill');
      const messages = document.getElementById('i2v-generate-messages');
      if (messages) messages.style.display = 'none';
      i2vGenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成...';
      i2vGenerateBtn.disabled = true;
      progress.style.width = '0%';
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 5;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          i2vGenerateBtn.innerHTML = '<i class="fas fa-check"></i> 生成完成';
          i2vGenerateBtn.disabled = false;
          i2vGenerateBtn.style.background = 'linear-gradient(90deg, #45E6D5 0%, #5B8CFF 50%, #8B5CFF 100%)';
          if (messages) messages.style.display = 'block';
        }
        progress.style.width = p + '%';
      }, 250);
    });
  }
})();

// ===== 动作迁移模块 =====
const MT_TOTAL_STEPS = 3;
let mtCurrentStep = 1;

function renderMtStep(step) {
  mtCurrentStep = step;
  document.querySelectorAll('.mt-step-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.mtPanel === String(step));
  });

  const stepItems = document.querySelectorAll('[data-mt-step]');
  const dividers = document.querySelectorAll('#mt-stepper .step-divider');
  stepItems.forEach(el => {
    const idx = Number(el.dataset.mtStep);
    el.classList.toggle('active', idx === step);
    el.classList.toggle('done', idx < step);
  });
  dividers.forEach((el, i) => {
    el.classList.toggle('done', i + 1 < step);
  });

  document.getElementById('mt-step-current').textContent = step;
  document.getElementById('mt-prev-step').disabled = step === 1;

  const nextBtn = document.getElementById('mt-next-step');
  if (step === MT_TOTAL_STEPS) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'flex';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('mt-prev-step')?.addEventListener('click', () => {
  if (mtCurrentStep > 1) renderMtStep(mtCurrentStep - 1);
});
document.getElementById('mt-next-step')?.addEventListener('click', () => {
  if (mtCurrentStep < MT_TOTAL_STEPS) {
    // 检查余额是否充足
    if (typeof TokenManager !== 'undefined' && !TokenManager.checkBalance()) {
      return;
    }
    renderMtStep(mtCurrentStep + 1);
    // 模拟Token消耗
    if (typeof TokenManager !== 'undefined') {
      const modelSelect = document.getElementById('sd-model-select');
      const currentModel = modelSelect ? modelSelect.value : 'GPT-4o';
      const tokenAmount = Math.floor(Math.random() * 8000) + 3000;
      TokenManager.recordUsage(currentModel, '数字人', tokenAmount);
    }
  }
});
document.querySelectorAll('[data-mt-step]').forEach(item => {
  item.addEventListener('click', () => {
    renderMtStep(Number(item.dataset.mtStep));
  });
});

(function initMotionTransfer() {
  function bindUploader(zoneId, listId, accept, isVideo) {
    const zone = document.getElementById(zoneId);
    const list = document.getElementById(listId);
    if (!zone) return;

    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      Array.from(e.dataTransfer.files || []).forEach(addItem);
    });
    zone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = false;
      input.addEventListener('change', () => {
        Array.from(input.files || []).forEach(addItem);
      });
      input.click();
    });

    function addItem(file) {
      if (!list) return;
      const url = URL.createObjectURL(file);
      const item = document.createElement('div');
      item.className = 'cm-material-item';
      const iconClass = isVideo ? 'video text-blue-500' : 'image text-pink-500';
      item.innerHTML = `
        <div class="cm-material-thumb">
          ${isVideo
            ? `<video src="${url}" muted></video><span class="cm-material-badge"><i class="fas fa-play"></i></span>`
            : `<img src="${url}" alt="${file.name}" />`}
        </div>
        <div class="cm-material-info">
          <div class="cm-material-name"><i class="fas fa-${iconClass}"></i> ${file.name}</div>
          <div class="cm-material-meta">${(file.size / 1024).toFixed(1)} KB</div>
        </div>
        <button class="cm-material-remove" title="删除"><i class="fas fa-times"></i></button>
      `;
      list.appendChild(item);
    }

    if (list) {
      list.addEventListener('click', e => {
        const btn = e.target.closest('.cm-material-remove');
        if (btn) btn.closest('.cm-material-item').remove();
      });
    }
  }

  bindUploader('mt-video-upload', 'mt-video-list', 'video/mp4,video/quicktime,video/x-msvideo', true);
  bindUploader('mt-image-upload', 'mt-image-list', 'image/jpeg,image/png,image/webp', false);

  const mtGenerateBtn = document.getElementById('mt-generate-btn');
  if (mtGenerateBtn) {
    mtGenerateBtn.addEventListener('click', () => {
      const progress = document.getElementById('mt-progress-fill');
      const messages = document.getElementById('mt-generate-messages');
      if (messages) messages.style.display = 'none';
      mtGenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成...';
      mtGenerateBtn.disabled = true;
      progress.style.width = '0%';
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 4;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          mtGenerateBtn.innerHTML = '<i class="fas fa-check"></i> 生成完成';
          mtGenerateBtn.disabled = false;
          mtGenerateBtn.style.background = 'linear-gradient(90deg, #45E6D5 0%, #5B8CFF 50%, #8B5CFF 100%)';
          if (messages) messages.style.display = 'block';
        }
        progress.style.width = p + '%';
      }, 260);
    });
  }
})();

// ===== AI 短剧模块 =====
const SD_TOTAL_STEPS = 6;
let sdCurrentStep = 1;

function renderSdStep(step) {
  sdCurrentStep = step;
  document.querySelectorAll('.sd-step-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.sdPanel === String(step));
  });

  const stepItems = document.querySelectorAll('[data-sd-step]');
  const dividers = document.querySelectorAll('#sd-stepper .step-divider');
  stepItems.forEach(el => {
    const idx = Number(el.dataset.sdStep);
    el.classList.toggle('active', idx === step);
    el.classList.toggle('done', idx < step);
  });
  dividers.forEach((el, i) => {
    el.classList.toggle('done', i + 1 < step);
  });

  document.getElementById('sd-step-current').textContent = step;
  document.getElementById('sd-prev-step').disabled = step === 1;

  const nextBtn = document.getElementById('sd-next-step');
  if (step === SD_TOTAL_STEPS) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'flex';
    nextBtn.innerHTML = step === SD_TOTAL_STEPS - 1
      ? '前往合成 <i class="fas fa-arrow-right ml-1"></i>'
      : '下一步 <i class="fas fa-arrow-right ml-1"></i>';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('sd-prev-step')?.addEventListener('click', () => {
  if (sdCurrentStep > 1) renderSdStep(sdCurrentStep - 1);
});
document.getElementById('sd-next-step')?.addEventListener('click', () => {
  if (sdCurrentStep < SD_TOTAL_STEPS) renderSdStep(sdCurrentStep + 1);
});
document.querySelectorAll('[data-sd-step]').forEach(item => {
  item.addEventListener('click', () => {
    renderSdStep(Number(item.dataset.sdStep));
  });
});

(function initShortDrama() {
  // 占位：具体功能开发中
})();

// ===== AI 短剧项目管理 =====

// ===== AI 短剧项目管理 =====
const sdProjectData = {
  'sd-001': { story: '一个现代程序员林逸在加班时被神秘蓝光吸入时空隧道，穿越到古代。凭借现代编程思维，他在古代解决了一个又一个看似无解的难题，也邂逅了才女苏婉，展开了一段跨越时空的奇妙冒险。', title: '穿越之程序员在古代', episodes: 5, duration: '3 分钟', characters: ['林逸-主角-现代程序员，聪明机智', '苏婉-女主-古代才女，温婉聪慧'], style: '穿越', shots: 15, workflow: 'drama_flux.json - Runninghub', voiceConfig: '默认', bgm: '古风-悠扬.mp3' },
  'sd-002': { story: '霸总陆景琛心中藏着一个白月光，直到有一天他发现，新来的实习生竟然就是当年不辞而别的她。两人在公司里斗智斗勇，旧情复燃的同时也面临着商业对手的暗算。', title: '霸总的白月光', episodes: 8, duration: '2 分钟', characters: ['陆景琛-男主-霸道总裁', '苏念-女主-实习设计师'], style: '都市', shots: 24, workflow: 'drama_sd.json - Runninghub', voiceConfig: '默认', bgm: '抒情-温柔.mp3' },
  'sd-003': { story: '', title: '', episodes: 5, duration: '3 分钟', characters: [], style: '都市', shots: 0, workflow: 'drama_flux.json - Runninghub', voiceConfig: '默认', bgm: 'default.mp3' },
};

function loadSdProject(id, status) {
  const data = sdProjectData[id];
  if (!data) return;

  const storyTextarea = document.querySelector('[data-sd-panel="1"] textarea');
  const titleInput = document.querySelector('[data-sd-panel="1"] input[type="text"]');
  const episodesSlider = document.querySelector('[data-sd-panel="1"] input[type="range"]');
  const episodesLabel = document.querySelector('[data-sd-panel="1"] .slider-value');
  const durationSelect = document.querySelectorAll('[data-sd-panel="1"] select')[0];
  const styleSelect = document.querySelectorAll('[data-sd-panel="1"] select')[1];
  const charList = document.getElementById('sd-character-list');

  if (storyTextarea) storyTextarea.value = data.story || '';
  if (titleInput) titleInput.value = data.title || '';
  if (episodesSlider) episodesSlider.value = data.episodes || 5;
  if (episodesLabel) episodesLabel.textContent = (data.episodes || 5) + '集';
  if (durationSelect && data.duration) durationSelect.value = data.duration;
  if (styleSelect && data.style) styleSelect.value = data.style;

  // 恢复角色
  if (charList && data.characters && data.characters.length > 0) {
    charList.innerHTML = '';
    data.characters.forEach(char => {
      const parts = char.split('-');
      const name = parts[0] || '';
      const desc = parts.slice(1).join('-') || '';
      const row = document.createElement('div');
      row.className = 'sd-character-row flex items-center gap-2';
      row.innerHTML = `
        <input type="text" class="input-field flex-1" placeholder="角色名称" value="${name}" />
        <input type="text" class="input-field flex-1" placeholder="角色描述" value="${desc}" />
        <button class="btn-secondary text-xs text-red-500 sd-char-remove" title="删除"><i class="fas fa-times"></i></button>
      `;
      charList.appendChild(row);
    });
  }

  if (status === 'done' || status === 'processing') {
    renderSdStep(6);
  } else {
    renderSdStep(1);
  }
}

const sdProjectList = document.getElementById('sd-project-list');
if (sdProjectList) {
  sdProjectList.addEventListener('click', function(e) {
    const actionBtn = e.target.closest('.project-item-actions button');
    const item = e.target.closest('.project-item');
    if (!item) return;

    if (actionBtn) {
      e.stopPropagation();
      if (actionBtn.classList.contains('delete')) {
        if (confirm('确定删除该短剧项目？此操作不可恢复。')) item.remove();
      } else {
        const titleEl = item.querySelector('.project-item-title');
        const newName = prompt('重命名短剧', titleEl.textContent.trim());
        if (newName) titleEl.textContent = newName;
      }
      return;
    }

    sdProjectList.querySelectorAll('.project-item').forEach(i => i.classList.toggle('active', i === item));
    const status = item.querySelector('.project-status').classList.contains('done') ? 'done'
      : item.querySelector('.project-status').classList.contains('processing') ? 'processing' : 'draft';
    loadSdProject(item.dataset.sdProjectId, status);
  });
}

document.getElementById('sd-new-project-btn')?.addEventListener('click', function() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const id = 'sd-' + Date.now();
  sdProjectData[id] = { story: '', title: '', episodes: 5, duration: '3 分钟', characters: [], style: '都市', shots: 0, workflow: 'drama_flux.json - Runninghub', voiceConfig: '默认', bgm: 'default.mp3' };

  const item = document.createElement('div');
  item.className = 'project-item';
  item.dataset.sdProjectId = id;
  item.innerHTML = `
    <div class="project-item-actions">
      <button title="重命名"><i class="fas fa-pen"></i></button>
      <button class="delete" title="删除"><i class="fas fa-trash"></i></button>
    </div>
    <div class="project-item-title">未命名短剧 · 草稿</div>
    <div class="project-item-meta">
      <span class="project-status draft"><i class="fas fa-file"></i>草稿</span>
      <span>${mm}-${dd} ${hh}:${mi}</span>
    </div>
  `;
  if (sdProjectList) {
    sdProjectList.prepend(item);
    sdProjectList.querySelectorAll('.project-item').forEach(i => i.classList.toggle('active', i === item));
    loadSdProject(id, 'draft');
  }
});

document.getElementById('sd-project-search-input')?.addEventListener('input', function() {
  const q = this.value.trim().toLowerCase();
  if (!sdProjectList) return;
  sdProjectList.querySelectorAll('.project-item').forEach(item => {
    const title = item.querySelector('.project-item-title').textContent.toLowerCase();
    item.style.display = !q || title.includes(q) ? '' : 'none';
  });
});

// ===== 短视频项目管理 =====
const projectData = {
  'p-001': { text: '如何增加被动收入', title: '', frames: 10, workflow: 'image_flux.json - Runninghub', voice: '男声-专业（云健）', bgm: 'default.mp3', template: 'static_default' },
  'p-002': { text: 'AI 正在改变内容创作的方式', title: 'AI 改变内容创作', frames: 12, workflow: 'image_flux.json - Runninghub', voice: '女声-温柔（晓晓）', bgm: 'bgm-01.mp3', template: '模板2' },
  'p-003': { text: '', title: '', frames: 10, workflow: 'image_flux.json - Runninghub', voice: '男声-专业（云健）', bgm: 'default.mp3', template: 'static_default' },
  'p-004': { text: '程序员的一天从一杯咖啡开始……', title: '程序员的一天', frames: 8, workflow: 'image_stable_diffusion.json - Runninghub', voice: '男声-活力（小刚）', bgm: 'bgm-02.mp3', template: '模板5' },
  'p-005': { text: '通货膨胀到底是什么？为什么钱越来越不值钱？', title: '3 分钟看懂通货膨胀', frames: 15, workflow: 'image_flux.json - Runninghub', voice: '女声-知性（云希）', bgm: 'bgm-03.mp3', template: '模板7' },
};

function loadProject(id, status) {
  const data = projectData[id];
  if (!data) return;
  const textInput = document.getElementById('qv-script-input');
  const titleInput = document.querySelector('[data-panel="1"] input[type="text"]');
  const framesLabel = document.querySelector('[data-panel="1"] .whitespace-nowrap span');
  const framesSlider = document.querySelector('[data-panel="1"] input[type="range"]');
  const workflowSelect = document.getElementById('illustration-workflow');
  const voiceSelect = document.querySelector('[data-panel="3"] select');
  const bgmSelect = document.querySelector('[data-panel="4"] select');
  const currentTpl = document.getElementById('current-template-name');

  if (textInput) textInput.value = data.text;
  if (titleInput) titleInput.value = data.title;
  if (framesLabel) framesLabel.textContent = data.frames;
  if (framesSlider) framesSlider.value = data.frames;
  if (workflowSelect) workflowSelect.value = data.workflow;
  if (voiceSelect) voiceSelect.value = data.voice;
  if (bgmSelect) bgmSelect.value = data.bgm;
  if (currentTpl) currentTpl.textContent = data.template + '.html';

  document.querySelectorAll('#storyboard-type + .radio-group .template-card, .accordion [class*="template-card"]').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.template-card').forEach(card => {
    const name = card.querySelector('.template-card-footer span').textContent;
    card.classList.toggle('selected', name === data.template);
  });

  if (status === 'done' || status === 'processing') {
    renderStep(6);
  } else {
    renderStep(1);
  }
}

const projectList = document.getElementById('project-list');
if (projectList) {
projectList.addEventListener('click', function(e) {
  const actionBtn = e.target.closest('.project-item-actions button');
  const item = e.target.closest('.project-item');
  if (!item) return;

  if (actionBtn) {
    e.stopPropagation();
    if (actionBtn.classList.contains('delete')) {
      if (confirm('确定删除该项目？此操作不可恢复。')) item.remove();
    } else {
      const titleEl = item.querySelector('.project-item-title');
      const newName = prompt('重命名项目', titleEl.textContent.trim());
      if (newName) titleEl.textContent = newName;
    }
    return;
  }

  projectList.querySelectorAll('.project-item').forEach(i => i.classList.toggle('active', i === item));
  const status = item.querySelector('.project-status').classList.contains('done') ? 'done'
    : item.querySelector('.project-status').classList.contains('processing') ? 'processing' : 'draft';
  loadProject(item.dataset.projectId, status);
});

document.getElementById('new-project-btn').addEventListener('click', function() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const id = 'p-' + Date.now();
  projectData[id] = { text: '', title: '', frames: 10, workflow: 'image_flux.json - Runninghub', voice: '男声-专业（云健）', bgm: 'default.mp3', template: 'static_default' };
  const item = document.createElement('div');
  item.className = 'project-item';
  item.dataset.projectId = id;
  item.innerHTML = `
    <div class="project-item-actions">
      <button title="重命名"><i class="fas fa-pen"></i></button>
      <button class="delete" title="删除"><i class="fas fa-trash"></i></button>
    </div>
    <div class="project-item-title">未命名项目 · 草稿</div>
    <div class="project-item-meta">
      <span class="project-status draft"><i class="fas fa-file"></i>草稿</span>
      <span>${mm}-${dd} ${hh}:${mi}</span>
    </div>
  `;
  projectList.prepend(item);
  projectList.querySelectorAll('.project-item').forEach(i => i.classList.toggle('active', i === item));
  loadProject(id, 'draft');
});

document.getElementById('project-search-input').addEventListener('input', function() {
  const q = this.value.trim().toLowerCase();
  projectList.querySelectorAll('.project-item').forEach(item => {
    const title = item.querySelector('.project-item-title').textContent.toLowerCase();
    item.style.display = !q || title.includes(q) ? '' : 'none';
  });
});
} // end if (projectList)

document.getElementById('prev-step')?.addEventListener('click', () => {
  if (currentStep > 1) renderStep(currentStep - 1);
});
document.getElementById('next-step')?.addEventListener('click', () => {
  if (currentStep < TOTAL_STEPS) {
    // 检查余额是否充足
    if (typeof TokenManager !== 'undefined' && !TokenManager.checkBalance()) {
      return;
    }
    renderStep(currentStep + 1);
    // 模拟Token消耗
    if (typeof TokenManager !== 'undefined') {
      const modelSelect = document.getElementById('sd-model-select');
      const currentModel = modelSelect ? modelSelect.value : 'GPT-4o';
      const tokenAmount = Math.floor(Math.random() * 8000) + 2000; // 2000-10000
      TokenManager.recordUsage(currentModel, 'AI短视频', tokenAmount);
    }
  }
});
document.querySelectorAll('.step-item').forEach(item => {
  item.addEventListener('click', () => {
    renderStep(Number(item.dataset.step));
  });
});

const modal = document.getElementById('global-config-modal');
const openGlobalConfigBtn = document.getElementById('open-global-config');
if (openGlobalConfigBtn) {
  openGlobalConfigBtn.addEventListener('click', () => modal.classList.add('open'));
}
document.getElementById('close-global-config').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('cancel-global-config').addEventListener('click', () => modal.classList.remove('open'));
document.getElementById('save-global-config').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('open');
});

document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const target = this.dataset.tab;
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.toggle('active', t === this));
    document.querySelectorAll('.modal-tab-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.tabPanel === target);
    });
  });
});

document.querySelectorAll('.password-field .toggle-visibility').forEach(btn => {
  btn.addEventListener('click', function() {
    const input = this.parentElement.querySelector('input');
    const icon = this.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });
});

document.getElementById('add-custom-model').addEventListener('click', () => {
  const list = document.getElementById('custom-model-list');
  const item = document.createElement('div');
  item.className = 'flex items-center gap-2 p-2 border border-gray-100 rounded-lg bg-gray-50';
  item.innerHTML = `
    <i class="fas fa-cube text-gray-400"></i>
    <div class="flex-1">
      <input type="text" class="input-field" placeholder="模型标识 (例如 my-model)" style="margin-bottom:4px" />
      <input type="text" class="input-field" placeholder="Base URL" />
    </div>
    <button class="btn-secondary text-xs">测试</button>
    <button class="btn-secondary text-xs text-red-500 remove-model">删除</button>
  `;
  list.appendChild(item);
  item.querySelector('.remove-model').addEventListener('click', () => item.remove());
});

document.getElementById('custom-model-list').addEventListener('click', (e) => {
  if (e.target.textContent === '删除') e.target.closest('div.flex').remove();
});

document.getElementById('reset-global-config').addEventListener('click', () => {
  if (confirm('确定要重置所有全局配置为默认值吗？')) {
    modal.querySelectorAll('input[type="password"], input[type="text"]').forEach(i => {
      if (i.hasAttribute('data-password')) i.value = '';
    });
  }
});

document.querySelectorAll('.toggle-option').forEach(opt => {
  opt.addEventListener('click', function() {
    this.parentElement.querySelectorAll('.toggle-option').forEach(o => o.classList.remove('active'));
    this.classList.add('active');
  });
});

document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', function() {
    this.parentElement.classList.toggle('open');
  });
});

const quickGenBtn = document.getElementById('generate-btn');
if (quickGenBtn) {
  quickGenBtn.addEventListener('click', function() {
    const btn = this;
    const promptInput = document.getElementById('qv-script-input');
    const prompt = promptInput ? promptInput.value.trim() : '';
    if (!prompt) {
      alert('请输入要生成视频的文字');
      return;
    }

    const placeholder = document.getElementById('qv-preview-placeholder');
    const result = document.getElementById('qv-preview-result');
    const image = document.getElementById('qv-preview-image');
    const messages = document.getElementById('generate-messages');

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成...';
    btn.disabled = true;

    setTimeout(() => {
      if (image) {
        image.src = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent(prompt) + '&image_size=portrait_9_16';
      }
      if (placeholder) placeholder.style.display = 'none';
      if (result) result.style.display = 'block';
      if (messages) messages.style.display = 'block';
      btn.innerHTML = '<i class="fas fa-check"></i> 生成完成';
      btn.disabled = false;
    }, 1500);
  });
}

document.querySelectorAll('.param-slider').forEach(slider => {
  slider.addEventListener('input', function() {
    const suffix = this.dataset.suffix !== undefined ? this.dataset.suffix : 'x';
    const value = this.value;
    const container = this.closest('div').parentElement;
    const display = container.querySelector('.slider-value');
    if (display) display.textContent = value + suffix;
    const hint = container.querySelector('.hint-text');
    if (hint) hint.textContent = value + suffix;
  });
});

function positionVolumeBubble() {
  const slider = document.getElementById('bgm-volume');
  const bubble = document.getElementById('bgm-volume-bubble');
  if (!slider || !bubble) return;
  const min = Number(slider.min);
  const max = Number(slider.max);
  const value = Number(slider.value);
  const ratio = (value - min) / (max - min);
  const w = slider.offsetWidth;
  bubble.style.left = (ratio * w) + 'px';
  bubble.textContent = value.toFixed(2);
}
(function initVolume() {
  const slider = document.getElementById('bgm-volume');
  if (!slider) return;
  slider.addEventListener('input', positionVolumeBubble);
  window.addEventListener('resize', positionVolumeBubble);
  requestAnimationFrame(positionVolumeBubble);
})();

document.querySelectorAll('.number-input button').forEach(btn => {
  btn.addEventListener('click', function() {
    const input = this.parentElement.querySelector('input');
    const delta = this.querySelector('i').classList.contains('fa-plus') ? 1 : -1;
    const min = input.min !== '' ? Number(input.min) : -Infinity;
    const max = input.max !== '' ? Number(input.max) : Infinity;
    const next = (parseInt(input.value, 10) || 0) + delta;
    if (next < min || next > max) return;
    input.value = next;
  });
});

document.getElementById('toggle-template-gallery')?.addEventListener('click', function() {
  const gallery = document.getElementById('template-gallery');
  const arrow = this.querySelector('.gallery-arrow');
  gallery.classList.toggle('open');
  if (gallery.classList.contains('open')) {
    arrow.style.transform = 'rotate(180deg)';
  } else {
    arrow.style.transform = 'rotate(0deg)';
  }
});

document.querySelectorAll('.template-card').forEach(card => {
  card.addEventListener('click', function() {
    const group = this.parentElement;
    group.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
    this.classList.add('selected');
    const name = this.querySelector('.template-card-footer span').textContent;
    const currentName = document.getElementById('current-template-name');
    if (currentName) currentName.textContent = name + '.html';
  });
});

const storyboardHint = document.getElementById('storyboard-hint');
const storyboardHints = {
  static: '使用模板自带样式，无需 AI 生成媒体。可在模板中自定义背景图片等参数。',
  image: '每个分镜由 AI 生成配套插图，尺寸由所选 Workflow 决定。',
  video: '每个分镜由 AI 生成动态视频片段，可获得更沉浸的视觉效果（生成耗时更长）。'
};
document.querySelectorAll('input[name="storyboard-type"]').forEach(radio => {
  radio.addEventListener('change', function() {
    if (storyboardHint) storyboardHint.textContent = storyboardHints[this.value];
  });
});

// ===== 设计规范配置模块 =====
const DesignSpec = {
  data: {
    colors: {
      primary: '#5B8CFF',
      secondary: '#3b82f6',
      accent: '#ef4444',
      background: '#f8fafc',
      exclude: '#94a3b8'
    },
    fonts: {
      title: 'Noto Sans SC',
      body: 'Noto Sans SC',
      style: '简洁现代',
      size: '14px'
    },
    spacing: {
      base: '16px',
      radius: '中等圆角 (8-12px)',
      shadow: '柔和阴影',
      border: '无边框'
    },
    visual: {
      style: '极简主义',
      colorTendency: '中性色调',
      layout: '居中对称',
      icon: '线性图标'
    },
    prompts: {
      positivePrefix: 'Professional UI design, clean composition, high quality, detailed, modern aesthetic',
      negative: 'blurry, low quality, cluttered, text, watermark, distorted, ugly'
    }
  },

  styleMap: {
    '极简主义': 'minimalist, clean, simple, uncluttered',
    '现代扁平': 'modern flat design, 2D, flat illustration style',
    '拟物化': 'skeuomorphic, realistic, 3D rendered',
    '玻璃拟态': 'glass morphism, frosted glass effect, translucent',
    '暗黑模式': 'dark mode, dark theme, dark background',
    '渐变多彩': 'gradient colors, colorful, vibrant',
    '科技感': 'futuristic, tech style, cyberpunk',
    '手绘插画': 'hand drawn, sketch style, illustration'
  },

  fontStyleMap: {
    '简洁现代': 'clean modern typography, sans-serif',
    '圆润亲和': 'rounded friendly typography, soft edges',
    '专业商务': 'professional business typography, corporate style',
    '活泼创意': 'playful creative typography, fun',
    '复古优雅': 'vintage elegant typography, classic',
    '科技未来': 'futuristic tech typography, modern'
  },

  layoutMap: {
    '居中对称': 'centered symmetrical layout, balanced',
    '左对齐': 'left-aligned layout, clean reading',
    '右对齐': 'right-aligned layout',
    '卡片式': 'card-based layout, modern cards',
    '网格布局': 'grid layout, structured',
    '自由布局': 'freeform layout, creative'
  },

  iconStyleMap: {
    '线性图标': 'line icons, outline icons',
    '面性图标': 'solid icons, filled icons',
    '双色图标': 'two-color icons',
    '手绘图标': 'hand-drawn icons, sketch icons'
  },

  colorTendencyMap: {
    '暖色为主': 'warm color palette, warm tones',
    '冷色为主': 'cool color palette, cool tones',
    '中性色调': 'neutral color palette, muted tones',
    '高饱和度': 'high saturation, vibrant colors',
    '低饱和度': 'low saturation, desaturated colors'
  },

  shadowStyleMap: {
    '柔和阴影': 'soft subtle shadows, gentle depth',
    '清晰阴影': 'clear defined shadows, crisp',
    '无阴影': 'no shadows, flat design',
    '强烈阴影': 'strong dramatic shadows, deep depth'
  },

  radiusStyleMap: {
    '小圆角 (4-6px)': 'small rounded corners, sharp look',
    '中等圆角 (8-12px)': 'medium rounded corners, modern',
    '大圆角 (16-24px)': 'large rounded corners, friendly',
    '无圆角 (0px)': 'no rounded corners, sharp edges'
  },

  init: function() {
    this.bindColorPickers();
    this.bindPromptGenerator();
    this.bindImportExport();
    this.bindCopyButtons();
    this.generatePromptPreview();
  },

  bindColorPickers: function() {
    const colorPairs = [
      ['design-primary-color', 'design-primary-hex'],
      ['design-secondary-color', 'design-secondary-hex'],
      ['design-accent-color', 'design-accent-hex'],
      ['design-bg-color', 'design-bg-hex'],
      ['design-exclude-color', 'design-exclude-hex']
    ];

    colorPairs.forEach(([colorId, hexId]) => {
      const colorInput = document.getElementById(colorId);
      const hexInput = document.getElementById(hexId);
      if (!colorInput || !hexInput) return;

      colorInput.addEventListener('input', () => {
        hexInput.value = colorInput.value;
        this.updateColorData(colorId.replace('design-', '').replace('-color', ''), colorInput.value);
        this.generatePromptPreview();
      });

      hexInput.addEventListener('input', () => {
        const val = hexInput.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
          colorInput.value = val;
          this.updateColorData(colorId.replace('design-', '').replace('-color', ''), val);
          this.generatePromptPreview();
        }
      });
    });
  },

  updateColorData: function(key, value) {
    if (key === 'primary') this.data.colors.primary = value;
    else if (key === 'secondary') this.data.colors.secondary = value;
    else if (key === 'accent') this.data.colors.accent = value;
    else if (key === 'bg') this.data.colors.background = value;
    else if (key === 'exclude') this.data.colors.exclude = value;
  },

  bindPromptGenerator: function() {
    const fields = [
      'design-title-font', 'design-body-font', 'design-font-style', 'design-font-size',
      'design-spacing', 'design-radius', 'design-shadow', 'design-border',
      'design-style', 'design-color-tendency', 'design-layout', 'design-icon',
      'design-positive-prefix', 'design-negative-prompt'
    ];

    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.generatePromptPreview());
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          el.addEventListener('input', () => this.generatePromptPreview());
        }
      }
    });

    const btn = document.getElementById('generate-prompt-preview');
    if (btn) {
      btn.addEventListener('click', () => this.generatePromptPreview());
    }
  },

  hexToColorName: function(hex) {
    const colorNames = {
      '#f97316': 'orange', '#ef4444': 'red', '#3b82f6': 'blue',
      '#22c55e': 'green', '#eab308': 'yellow', '#a855f7': 'purple',
      '#ec4899': 'pink', '#06b6d4': 'cyan', '#f8fafc': 'light',
      '#1e293b': 'dark', '#94a3b8': 'gray'
    };
    return colorNames[hex.toLowerCase()] || 'custom color';
  },

  generatePromptPreview: function() {
    const colors = this.data.colors;
    const fonts = {
      title: document.getElementById('design-title-font')?.value || 'Noto Sans SC',
      body: document.getElementById('design-body-font')?.value || 'Noto Sans SC',
      style: document.getElementById('design-font-style')?.value || '简洁现代',
      size: document.getElementById('design-font-size')?.value || '14px'
    };
    const spacing = {
      base: document.getElementById('design-spacing')?.value || '16px',
      radius: document.getElementById('design-radius')?.value || '中等圆角 (8-12px)',
      shadow: document.getElementById('design-shadow')?.value || '柔和阴影',
      border: document.getElementById('design-border')?.value || '无边框'
    };
    const visual = {
      style: document.getElementById('design-style')?.value || '极简主义',
      colorTendency: document.getElementById('design-color-tendency')?.value || '中性色调',
      layout: document.getElementById('design-layout')?.value || '居中对称',
      icon: document.getElementById('design-icon')?.value || '线性图标'
    };
    const positivePrefix = document.getElementById('design-positive-prefix')?.value || '';
    const negative = document.getElementById('design-negative-prompt')?.value || '';

    let positiveParts = [];
    if (positivePrefix) positiveParts.push(positivePrefix);

    positiveParts.push(`color scheme: primary ${this.hexToColorName(colors.primary)} (${colors.primary}), secondary ${this.hexToColorName(colors.secondary)} (${colors.secondary}), accent ${this.hexToColorName(colors.accent)} (${colors.accent})`);
    positiveParts.push(`background: ${this.hexToColorName(colors.background)} (${colors.background})`);
    positiveParts.push(`typography: ${fonts.title} for titles, ${fonts.body} for body text, ${this.fontStyleMap[fonts.style] || fonts.style}, base size ${fonts.size}`);
    positiveParts.push(`layout: ${this.layoutMap[visual.layout] || visual.layout}`);
    positiveParts.push(`style: ${this.styleMap[visual.style] || visual.style}`);
    positiveParts.push(`icons: ${this.iconStyleMap[visual.icon] || visual.icon}`);
    positiveParts.push(`shadows: ${this.shadowStyleMap[spacing.shadow] || spacing.shadow}`);
    positiveParts.push(`rounded corners: ${this.radiusStyleMap[spacing.radius] || spacing.radius}`);
    positiveParts.push(`color tendency: ${this.colorTendencyMap[visual.colorTendency] || visual.colorTendency}`);
    positiveParts.push(`spacing: ${spacing.base} base unit`);

    if (spacing.border !== '无边框') {
      positiveParts.push(`borders: ${spacing.border}`);
    }

    let negativeParts = [];
    if (negative) negativeParts.push(negative);
    negativeParts.push(`avoid ${this.hexToColorName(colors.exclude)} color, ${colors.exclude}`);

    const positiveText = positiveParts.join(', ');
    const negativeText = negativeParts.join(', ');

    const positiveEl = document.getElementById('design-prompt-preview-positive');
    const negativeEl = document.getElementById('design-prompt-preview-negative');

    if (positiveEl) positiveEl.textContent = positiveText;
    if (negativeEl) negativeEl.textContent = negativeText;

    return { positive: positiveText, negative: negativeText };
  },

  bindImportExport: function() {
    const exportBtn = document.getElementById('export-design-spec');
    const importBtn = document.getElementById('import-design-spec');
    const importFile = document.getElementById('design-spec-import-file');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const specData = this.collectSpecData();
        const blob = new Blob([JSON.stringify(specData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `design-spec-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    if (importBtn) {
      importBtn.addEventListener('click', () => importFile.click());
    }

    if (importFile) {
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            this.applySpecData(data);
            this.generatePromptPreview();
            alert('设计规范导入成功！');
          } catch (err) {
            alert('导入失败：JSON格式错误');
          }
        };
        reader.readAsText(file);
        importFile.value = '';
      });
    }
  },

  collectSpecData: function() {
    return {
      version: '1.0',
      colors: {
        primary: document.getElementById('design-primary-color')?.value || '#f97316',
        secondary: document.getElementById('design-secondary-color')?.value || '#3b82f6',
        accent: document.getElementById('design-accent-color')?.value || '#ef4444',
        background: document.getElementById('design-bg-color')?.value || '#f8fafc',
        exclude: document.getElementById('design-exclude-color')?.value || '#94a3b8'
      },
      fonts: {
        title: document.getElementById('design-title-font')?.value || 'Noto Sans SC',
        body: document.getElementById('design-body-font')?.value || 'Noto Sans SC',
        style: document.getElementById('design-font-style')?.value || '简洁现代',
        size: document.getElementById('design-font-size')?.value || '14px'
      },
      spacing: {
        base: document.getElementById('design-spacing')?.value || '16px',
        radius: document.getElementById('design-radius')?.value || '中等圆角 (8-12px)',
        shadow: document.getElementById('design-shadow')?.value || '柔和阴影',
        border: document.getElementById('design-border')?.value || '无边框'
      },
      visual: {
        style: document.getElementById('design-style')?.value || '极简主义',
        colorTendency: document.getElementById('design-color-tendency')?.value || '中性色调',
        layout: document.getElementById('design-layout')?.value || '居中对称',
        icon: document.getElementById('design-icon')?.value || '线性图标'
      },
      prompts: {
        positivePrefix: document.getElementById('design-positive-prefix')?.value || '',
        negative: document.getElementById('design-negative-prompt')?.value || ''
      }
    };
  },

  applySpecData: function(data) {
    if (!data) return;

    if (data.colors) {
      var el;
      el = document.getElementById('design-primary-color'); if (el) el.setAttribute('value', data.colors.primary || '#f97316');
      el = document.getElementById('design-primary-hex'); if (el) el.setAttribute('value', data.colors.primary || '#f97316');
      el = document.getElementById('design-secondary-color'); if (el) el.setAttribute('value', data.colors.secondary || '#3b82f6');
      el = document.getElementById('design-secondary-hex'); if (el) el.setAttribute('value', data.colors.secondary || '#3b82f6');
      el = document.getElementById('design-accent-color'); if (el) el.setAttribute('value', data.colors.accent || '#ef4444');
      el = document.getElementById('design-accent-hex'); if (el) el.setAttribute('value', data.colors.accent || '#ef4444');
      el = document.getElementById('design-bg-color'); if (el) el.setAttribute('value', data.colors.background || '#f8fafc');
      el = document.getElementById('design-bg-hex'); if (el) el.setAttribute('value', data.colors.background || '#f8fafc');
      el = document.getElementById('design-exclude-color'); if (el) el.setAttribute('value', data.colors.exclude || '#94a3b8');
      el = document.getElementById('design-exclude-hex'); if (el) el.setAttribute('value', data.colors.exclude || '#94a3b8');
    }

    if (data.fonts) {
      var el;
      el = document.getElementById('design-title-font'); if (el) el.value = data.fonts.title || 'Noto Sans SC';
      el = document.getElementById('design-body-font'); if (el) el.value = data.fonts.body || 'Noto Sans SC';
      el = document.getElementById('design-font-style'); if (el) el.value = data.fonts.style || '简洁现代';
      el = document.getElementById('design-font-size'); if (el) el.value = data.fonts.size || '14px';
    }

    if (data.spacing) {
      var el;
      el = document.getElementById('design-spacing'); if (el) el.value = data.spacing.base || '16px';
      el = document.getElementById('design-radius'); if (el) el.value = data.spacing.radius || '中等圆角 (8-12px)';
      el = document.getElementById('design-shadow'); if (el) el.value = data.spacing.shadow || '柔和阴影';
      el = document.getElementById('design-border'); if (el) el.value = data.spacing.border || '无边框';
    }

    if (data.visual) {
      var el;
      el = document.getElementById('design-style'); if (el) el.value = data.visual.style || '极简主义';
      el = document.getElementById('design-color-tendency'); if (el) el.value = data.visual.colorTendency || '中性色调';
      el = document.getElementById('design-layout'); if (el) el.value = data.visual.layout || '居中对称';
      el = document.getElementById('design-icon'); if (el) el.value = data.visual.icon || '线性图标';
    }

    if (data.prompts) {
      var el;
      el = document.getElementById('design-positive-prefix'); if (el) el.value = data.prompts.positivePrefix || '';
      el = document.getElementById('design-negative-prompt'); if (el) el.value = data.prompts.negative || '';
    }
  },

  bindCopyButtons: function() {
    document.querySelectorAll('.copy-prompt-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const targetId = this.dataset.target;
        const target = document.getElementById(targetId);
        if (!target) return;

        navigator.clipboard.writeText(target.textContent).then(() => {
          const originalHTML = this.innerHTML;
          this.innerHTML = '<i class="fas fa-check"></i>已复制';
          setTimeout(() => {
            this.innerHTML = originalHTML;
          }, 2000);
        }).catch(() => {
          alert('复制失败，请手动复制');
        });
      });
    });
  },

  getPrompts: function() {
    return this.generatePromptPreview();
  }
};

// AI 短剧统一智能体对话功能
const SDChatAgent = {
  messages: [],
  currentStep: 1,
  totalSteps: 6,
  stepPhase: 'awaiting_input', // awaiting_input | analyzing | generating | reviewing | awaiting_modification
  stepArtifacts: {}, // 每个步骤最终确认的产出物
  stepData: {}, // 每个步骤的用户输入
  selectedModel: 'gpt-4o', // 当前选中的模型

  stepMeta: {
    1: { name: '剧本创作', icon: 'fa-pen-fancy', artifactName: '剧本大纲', skill: '剧本创作助手' },
    2: { name: '镜头脚本', icon: 'fa-clapperboard', artifactName: '分镜脚本', skill: '镜头脚本助手' },
    3: { name: '素材生成', icon: 'fa-palette', artifactName: '视觉素材', skill: '素材生成助手' },
    4: { name: '镜头生成', icon: 'fa-film', artifactName: '视频镜头', skill: '镜头生成助手' },
    5: { name: '配音合成', icon: 'fa-microphone', artifactName: '角色配音', skill: '配音合成助手' },
    6: { name: '后期合成', icon: 'fa-wand-magic-sparkles', artifactName: '成片', skill: '后期合成助手' }
  },

  init: function() {
    const sendBtn = document.getElementById('sd-unified-send');
    const inputField = document.getElementById('sd-unified-input');
    const clearBtn = document.getElementById('sd-unified-clear-chat');
    const suggestionChips = document.querySelectorAll('#sd-suggestion-chips .sd-suggestion-chip');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    if (inputField) {
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearChat());
    }

    // 模型选择器
    const modelSelect = document.getElementById('sd-model-select');
    if (modelSelect) {
      modelSelect.value = this.selectedModel;
      modelSelect.addEventListener('change', () => {
        this.selectedModel = modelSelect.value;
      });
    }

    suggestionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const suggestion = chip.getAttribute('data-suggestion');
        if (inputField) {
          inputField.value = suggestion;
          inputField.focus();
        }
      });
    });

    // 初始化步骤点击事件
    const progressSteps = document.querySelectorAll('.sd-progress-step');
    progressSteps.forEach(step => {
      step.addEventListener('click', () => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        if (stepNum < this.currentStep) {
          // 允许回看之前的步骤
          this.goToStep(stepNum);
        }
      });
    });
  },

  sendMessage: function() {
    const inputField = document.getElementById('sd-unified-input');
    const message = inputField.value.trim();

    if (!message) return;

    // 检查余额是否充足
    if (typeof TokenManager !== 'undefined' && !TokenManager.checkBalance()) {
      return;
    }

    this.addMessage('user', message);
    inputField.value = '';

    // 记录Token消耗
    if (typeof TokenManager !== 'undefined') {
      const modelSelect = document.getElementById('sd-model-select');
      const currentModel = modelSelect ? modelSelect.value : 'GPT-4o';
      const tokenAmount = Math.floor(Math.random() * 12000) + 5000; // 5000-17000
      TokenManager.recordUsage(currentModel, 'AI短剧', tokenAmount);
    }

    if (this.stepPhase === 'awaiting_modification') {
      // 用户在文本框中输入了修改反馈，触发重新生成
      this.stepData[this.currentStep] = message;
      this.startAnalysis(message, true);
    } else if (this.stepPhase === 'reviewing') {
      // 用户在审阅阶段追加了自然语言反馈，视为修改意见
      this.stepData[this.currentStep] = message;
      this.startAnalysis(message, true);
    } else {
      // 首次输入需求
      this.stepData[this.currentStep] = message;
      this.startAnalysis(message, false);
    }
  },

  startAnalysis: function(userMessage, isRevision) {
    this.stepPhase = 'analyzing';
    const meta = this.stepMeta[this.currentStep];
    this.showTyping();

    setTimeout(() => {
      this.hideTyping();
      const modelName = this.selectedModel || 'gpt-4o';
      const analysisText = isRevision
        ? `收到您的修改反馈。我会使用 <strong>${modelName}</strong> 重新分析并调整<strong>${meta.name}</strong>...`
        : `正在使用 <strong>${modelName}</strong> 分析您的需求。本次${meta.name}将调用「<strong>${meta.skill}</strong>」为您处理...`;
      this.addMessage('assistant', analysisText);

      // 如果不是修改，显示确认面板让用户选择参数
      if (!isRevision) {
        setTimeout(() => this.showConfirmationPanel(userMessage), 800);
      } else {
        setTimeout(() => this.startGeneration(userMessage, isRevision), 800);
      }
    }, 900);
  },

  showConfirmationPanel: function(userMessage) {
    this.stepPhase = 'confirming_params';
    const meta = this.stepMeta[this.currentStep];
    const params = this.getStepParameters(this.currentStep, userMessage);
    const intro = this.getConfirmationIntro(this.currentStep, userMessage);

    const panelHtml = `
      <div class="sd-confirmation-panel">
        <div class="sd-confirmation-header">
          <i class="fas fa-clipboard-list"></i>
          <span>${meta.artifactName}创作（待确认）</span>
          <button class="sd-panel-toggle" onclick="SDChatAgent.togglePanel(this)">
            <i class="fas fa-chevron-up"></i>
          </button>
        </div>
        <div class="sd-confirmation-body">
          <div class="sd-confirmation-intro">${intro}</div>
          ${this.renderParameterGroups(params)}
          <div class="sd-confirmation-actions">
            <button class="btn-primary sd-btn-confirm-params" onclick="SDChatAgent.confirmParameters('${this.escapeForAttr(userMessage)}')">
              <i class="fas fa-check"></i> 确认并开始生成
            </button>
          </div>
        </div>
      </div>
    `;
    this.addMessage('assistant', panelHtml);
  },

  getConfirmationIntro: function(step, message) {
    const intros = {
      1: `您要求制作${this.extractTheme(message)}的短剧，每集1分钟。这是一个长视频任务。我先确认几个关键信息：`,
      2: `剧本创作已完成。现在开始规划<strong>镜头脚本</strong>。请确认以下镜头参数：`,
      3: `镜头脚本已完成。接下来根据分镜生成<strong>视觉素材</strong>。请确认素材参数：`,
      4: `素材已就绪。现在将素材转化为<strong>动态镜头</strong>。请确认下列参数：`,
      5: `镜头生成完成。现在为角色<strong>合成配音</strong>。请确认配音参数：`,
      6: `配音已就绪。最后进行<strong>后期合成</strong>。请确认后期参数：`
    };
    return intros[step] || `请确认以下${this.stepMeta[step].name}的相关参数：`;
  },

  getStepParameters: function(step, userMessage) {
    // 根据用户需求动态生成参数
    if (step === 1) {
      return this.generateScriptParameters(userMessage);
    } else if (step === 2) {
      return this.generateShotParameters(userMessage);
    } else if (step === 3) {
      return this.generateMaterialParameters(userMessage);
    } else if (step === 4) {
      return this.generateVideoParameters(userMessage);
    } else if (step === 5) {
      return this.generateVoiceParameters(userMessage);
    } else if (step === 6) {
      return this.generatePostParameters(userMessage);
    }
    return [];
  },

  generateScriptParameters: function(userMessage) {
    const params = [];
    const msg = userMessage.toLowerCase();

    // 1. 根据题材识别剧情类型
    const genres = this.detectGenres(userMessage);
    if (genres.length > 0) {
      params.push({
        label: '剧情侧重？',
        name: 'focus',
        options: genres.map((g, i) => ({ value: g.value, label: g.label, selected: i === 0 }))
      });
    }

    // 2. 根据内容识别时代背景
    const eras = this.detectEras(userMessage);
    if (eras.length > 0) {
      params.push({
        label: '时代背景？',
        name: 'era',
        options: eras.map((e, i) => ({ value: e.value, label: e.label, selected: i === 0 }))
      });
    }

    // 3. 角色设定（根据题材推荐）
    const characters = this.suggestCharacters(userMessage);
    if (characters.length > 0) {
      params.push({
        label: '主角性格？',
        name: 'character',
        options: characters.map((c, i) => ({ value: c.value, label: c.label, selected: i === 0 }))
      });
    }

    // 4. 剧情节奏
    params.push({
      label: '剧情节奏？',
      name: 'pace',
      options: [
        { value: 'fast', label: '快节奏（紧凑刺激）', selected: msg.includes('快') || msg.includes('爽') },
        { value: 'medium', label: '中等节奏（张弛有度）', selected: !msg.includes('快') && !msg.includes('慢') },
        { value: 'slow', label: '慢节奏（细腻舒缓）', selected: msg.includes('慢') || msg.includes('温情') }
      ]
    });

    // 5. 目标受众
    params.push({
      label: '目标受众？',
      name: 'audience',
      options: [
        { value: 'youth', label: '青少年', selected: msg.includes('青春') || msg.includes('校园') },
        { value: 'adult', label: '成年人', selected: msg.includes('职场') || msg.includes('都市') },
        { value: 'family', label: '家庭向', selected: msg.includes('家庭') || msg.includes('亲子') },
        { value: 'general', label: '大众', selected: true }
      ]
    });

    // 6. 视频比例
    params.push({
      label: '视频比例？',
      name: 'ratio',
      options: [
        { value: '9:16', label: '9:16 竖屏（适合手机）', selected: true },
        { value: '16:9', label: '16:9 横屏（适合电脑）', selected: false },
        { value: '1:1', label: '1:1 方形', selected: false }
      ]
    });

    // 7. 补充信息
    params.push({
      label: '还有其他要求吗？',
      name: 'additional',
      type: 'textarea',
      placeholder: '例如：需要反转剧情、增加喜剧元素、强调某个角色...'
    });

    return params;
  },

  detectGenres: function(message) {
    const msg = message.toLowerCase();
    const genres = [];

    if (msg.includes('穿越') || msg.includes('古代') || msg.includes('现代')) {
      genres.push(
        { value: 'time-travel', label: '穿越冒险' },
        { value: 'comedy', label: '轻松喜剧' },
        { value: 'romance', label: '爱情故事' }
      );
    } else if (msg.includes('霸') || msg.includes('总裁') || msg.includes('豪门')) {
      genres.push(
        { value: 'romance', label: '浪漫爱情' },
        { value: 'career', label: '职场奋斗' },
        { value: 'revenge', label: '复仇逆袭' }
      );
    } else if (msg.includes('悬疑') || msg.includes('推理') || msg.includes('侦探')) {
      genres.push(
        { value: 'mystery', label: '悬疑推理' },
        { value: 'thriller', label: '惊悚刺激' },
        { value: 'crime', label: '犯罪侦查' }
      );
    } else if (msg.includes('校园') || msg.includes('青春') || msg.includes('学生')) {
      genres.push(
        { value: 'youth', label: '青春成长' },
        { value: 'romance', label: '校园恋爱' },
        { value: 'friendship', label: '友情励志' }
      );
    } else if (msg.includes('科幻') || msg.includes('未来') || msg.includes('机器人')) {
      genres.push(
        { value: 'scifi', label: '科幻探索' },
        { value: 'dystopia', label: '反乌托邦' },
        { value: 'adventure', label: '冒险奇遇' }
      );
    } else {
      // 默认选项
      genres.push(
        { value: 'drama', label: '剧情向' },
        { value: 'comedy', label: '喜剧向' },
        { value: 'mixed', label: '多元混合' }
      );
    }

    return genres;
  },

  detectEras: function(message) {
    const msg = message.toLowerCase();
    const eras = [];

    if (msg.includes('古代') || msg.includes('穿越')) {
      eras.push(
        { value: 'tang', label: '唐朝（开放繁荣）', selected: msg.includes('唐') },
        { value: 'song', label: '宋朝（文化昌盛）', selected: msg.includes('宋') },
        { value: 'ming', label: '明朝（权谋斗争）', selected: msg.includes('明') },
        { value: 'qing', label: '清朝（传统守旧）', selected: msg.includes('清') },
        { value: 'ancient', label: '架空古代', selected: true }
      );
    } else if (msg.includes('现代') || msg.includes('都市') || msg.includes('职场')) {
      eras.push(
        { value: 'modern', label: '现代都市', selected: true },
        { value: 'contemporary', label: '当代社会', selected: false }
      );
    } else if (msg.includes('未来') || msg.includes('科幻')) {
      eras.push(
        { value: 'near-future', label: '近未来（2050年）', selected: true },
        { value: 'far-future', label: '远未来（2200年）', selected: false },
        { value: 'scifi', label: '科幻架空', selected: false }
      );
    }

    return eras;
  },

  suggestCharacters: function(message) {
    const msg = message.toLowerCase();
    const characters = [];

    if (msg.includes('程序员') || msg.includes('码农')) {
      characters.push(
        { value: 'geek', label: '技术宅（内向专注）' },
        { value: 'witty', label: '幽默风趣' },
        { value: 'serious', label: '严肃认真' }
      );
    } else if (msg.includes('霸') || msg.includes('总裁')) {
      characters.push(
        { value: 'cold', label: '高冷霸气' },
        { value: 'gentle', label: '温柔体贴' },
        { value: 'tsundere', label: '傲娇反差' }
      );
    } else if (msg.includes('侦探') || msg.includes('推理')) {
      characters.push(
        { value: 'genius', label: '天才型（高智商）' },
        { value: 'experienced', label: '经验型（老辣）' },
        { value: 'intuitive', label: '直觉型（感性）' }
      );
    } else {
      characters.push(
        { value: 'brave', label: '勇敢果断' },
        { value: 'kind', label: '善良温和' },
        { value: 'smart', label: '聪明机智' }
      );
    }

    return characters;
  },

  generateShotParameters: function(userMessage) {
    return [
      {
        label: '镜头风格？',
        name: 'shotStyle',
        options: [
          { value: 'cinematic', label: '电影感（大片风格）', selected: true },
          { value: 'documentary', label: '纪实风（真实自然）', selected: false },
          { value: 'dynamic', label: '动感风（快速切换）', selected: false }
        ]
      },
      {
        label: '每场景镜头数？',
        name: 'shotCount',
        options: [
          { value: '3-4', label: '3-4个（简洁）', selected: false },
          { value: '4-5', label: '4-5个（适中）', selected: true },
          { value: '5-7', label: '5-7个（丰富）', selected: false }
        ]
      },
      {
        label: '镜头运动？',
        name: 'movement',
        options: [
          { value: 'static', label: '固定镜头为主', selected: false },
          { value: 'push-pull', label: '推拉镜头', selected: true },
          { value: 'dynamic', label: '摇移跟拍', selected: false }
        ]
      }
    ];
  },

  generateMaterialParameters: function(userMessage) {
    return [
      {
        label: '视觉风格？',
        name: 'visualStyle',
        options: [
          { value: 'realistic', label: '写实风格', selected: true },
          { value: 'anime', label: '动漫风格', selected: false },
          { value: '3d', label: '3D渲染', selected: false },
          { value: 'artistic', label: '艺术风格', selected: false }
        ]
      },
      {
        label: '色调偏好？',
        name: 'colorTone',
        options: [
          { value: 'bright', label: '明亮鲜艳', selected: true },
          { value: 'warm', label: '温暖柔和', selected: false },
          { value: 'cool', label: '冷色调', selected: false },
          { value: 'dark', label: '暗黑风格', selected: false }
        ]
      },
      {
        label: '生成服务？',
        name: 'service',
        options: [
          { value: 'cloud', label: 'RunningHub云端（推荐）', selected: true },
          { value: 'local', label: '本地ComfyUI', selected: false },
          { value: 'api', label: 'API模型', selected: false }
        ]
      }
    ];
  },

  generateVideoParameters: function(userMessage) {
    return [
      {
        label: '生成方式？',
        name: 'videoMethod',
        options: [
          { value: 'i2v', label: '图生视频（推荐）', selected: true },
          { value: 'motion', label: '动作迁移', selected: false },
          { value: 'effect', label: '特效合成', selected: false }
        ]
      },
      {
        label: '动态效果？',
        name: 'dynamicEffect',
        options: [
          { value: 'smooth', label: '自然流畅', selected: true },
          { value: 'intense', label: '强烈动感', selected: false },
          { value: 'subtle', label: '微妙细腻', selected: false }
        ]
      },
      {
        label: '转场效果？',
        name: 'transition',
        options: [
          { value: 'fade', label: '淡入淡出', selected: true },
          { value: 'cut', label: '直接切换', selected: false },
          { value: 'effect', label: '特效转场', selected: false }
        ]
      }
    ];
  },

  generateVoiceParameters: function(userMessage) {
    return [
      {
        label: '男主音色？',
        name: 'maleVoice',
        options: [
          { value: 'mature', label: '成熟男声', selected: true },
          { value: 'young', label: '青年男声', selected: false },
          { value: 'deep', label: '低沉磁性', selected: false }
        ]
      },
      {
        label: '女主音色？',
        name: 'femaleVoice',
        options: [
          { value: 'gentle', label: '温柔女声', selected: true },
          { value: 'sweet', label: '甜美可爱', selected: false },
          { value: 'elegant', label: '优雅知性', selected: false }
        ]
      },
      {
        label: '语速节奏？',
        name: 'speechRate',
        options: [
          { value: 'normal', label: '正常语速', selected: true },
          { value: 'fast', label: '快速紧凑', selected: false },
          { value: 'slow', label: '舒缓从容', selected: false }
        ]
      }
    ];
  },

  generatePostParameters: function(userMessage) {
    return [
      {
        label: '背景音乐？',
        name: 'bgmStyle',
        options: [
          { value: 'soothing', label: '舒缓温馨', selected: true },
          { value: 'intense', label: '激昂紧张', selected: false },
          { value: 'romantic', label: '浪漫甜蜜', selected: false },
          { value: 'suspense', label: '悬疑神秘', selected: false }
        ]
      },
      {
        label: '字幕样式？',
        name: 'subtitleStyle',
        options: [
          { value: 'simple', label: '简洁白色居中', selected: true },
          { value: 'fancy', label: '华丽描边', selected: false },
          { value: 'minimal', label: '极简透明', selected: false }
        ]
      },
      {
        label: '调色风格？',
        name: 'colorGrading',
        options: [
          { value: 'cinematic', label: '电影感', selected: true },
          { value: 'bright', label: '明亮清新', selected: false },
          { value: 'dark', label: '暗黑风格', selected: false }
        ]
      },
      {
        label: '输出格式？',
        name: 'outputFormat',
        options: [
          { value: '1080p_mp4', label: '1080p MP4（推荐）', selected: true },
          { value: '4k_mp4', label: '4K MP4', selected: false },
          { value: '1080p_mov', label: '1080p MOV', selected: false }
        ]
      }
    ];
  },

  renderParameterGroups: function(params) {
    return params.map((param, index) => {
      if (param.type === 'textarea') {
        return `
          <div class="sd-param-group">
            <div class="sd-param-label">${index + 1}. ${param.label}</div>
            <textarea class="sd-param-textarea" name="${param.name}" placeholder="${param.placeholder}"></textarea>
          </div>
        `;
      } else {
        const optionsHtml = param.options.map(opt => `
          <label class="sd-param-option">
            <input type="radio" name="${param.name}" value="${opt.value}" ${opt.selected ? 'checked' : ''}>
            <span>${opt.label}</span>
          </label>
        `).join('');
        return `
          <div class="sd-param-group">
            <div class="sd-param-label">${index + 1}. ${param.label}</div>
            <div class="sd-param-options">
              ${optionsHtml}
            </div>
          </div>
        `;
      }
    }).join('');
  },

  confirmParameters: function(userMessage) {
    const panels = document.querySelectorAll('.sd-confirmation-panel');
    const latestPanel = panels[panels.length - 1];
    if (!latestPanel) return;

    // 检查余额是否充足
    if (typeof TokenManager !== 'undefined' && !TokenManager.checkBalance()) {
      return;
    }

    const selectedParams = {};
    latestPanel.querySelectorAll('input[type="radio"]:checked').forEach(input => {
      selectedParams[input.name] = input.value;
    });
    latestPanel.querySelectorAll('textarea').forEach(textarea => {
      if (textarea.value.trim()) {
        selectedParams[textarea.name] = textarea.value.trim();
      }
    });

    // 保存用户选择的参数
    this.stepParams = this.stepParams || {};
    this.stepParams[this.currentStep] = selectedParams;

    this.addMessage('assistant', '<div class="sd-step-done"><i class="fas fa-check-circle"></i> 技能学习</div>');
    this.startGeneration(userMessage, false);
  },

  togglePanel: function(button) {
    const panel = button.closest('.sd-confirmation-panel');
    if (!panel) return;
    const body = panel.querySelector('.sd-confirmation-body');
    const icon = button.querySelector('i');
    if (body.style.display === 'none') {
      body.style.display = 'block';
      icon.className = 'fas fa-chevron-up';
    } else {
      body.style.display = 'none';
      icon.className = 'fas fa-chevron-down';
    }
  },

  openPreviewDrawer: function(step) {
    const artifact = this.stepArtifacts[step];
    if (!artifact) return;

    const drawer = document.getElementById('sd-preview-drawer');
    const mask = document.getElementById('sd-preview-drawer-mask');
    const titleEl = document.getElementById('sd-preview-drawer-title-text');
    const bodyEl = document.getElementById('sd-preview-drawer-body');
    const footerEl = document.getElementById('sd-preview-drawer-footer');
    if (!drawer || !bodyEl) return;

    const meta = this.stepMeta[step];
    const isCurrentStep = step === this.currentStep;
    const isReviewing = this.stepPhase === 'reviewing' && isCurrentStep;
    const isLast = step >= this.totalSteps;
    const nextName = !isLast ? this.stepMeta[step + 1].name : null;

    if (titleEl) titleEl.textContent = `${artifact.title} - ${isReviewing ? '审阅确认' : '查看内容'}`;

    let contentHtml = '';

    // 概要
    if (artifact.summary) {
      contentHtml += `<div class="sd-drawer-summary"><i class="fas fa-quote-left"></i> ${artifact.summary}</div>`;
    }

    // 关键参数
    if (artifact.sections && artifact.sections.length) {
      contentHtml += '<div class="sd-drawer-section"><div class="sd-drawer-section-title"><i class="fas fa-list"></i> 关键参数</div><div class="sd-drawer-sections">';
      artifact.sections.forEach(s => {
        contentHtml += `<div class="sd-drawer-row"><span class="sd-drawer-key">${s.label}</span><span class="sd-drawer-val">${s.value}</span></div>`;
      });
      contentHtml += '</div></div>';
    }

    // 用户上传文件信息
    if (artifact.source === 'user_upload' && artifact.fileName) {
      const sizeKb = (artifact.fileSize / 1024).toFixed(1);
      contentHtml += `<div class="sd-drawer-section"><div class="sd-drawer-section-title"><i class="fas fa-file-arrow-up"></i> 上传文件</div><div class="sd-drawer-file"><i class="fas fa-file-lines"></i> ${artifact.fileName} <span class="sd-file-size">(${sizeKb} KB)</span></div></div>`;
    }

    // 完整内容预览
    if (artifact.preview) {
      contentHtml += `<div class="sd-drawer-section"><div class="sd-drawer-section-title"><i class="fas fa-file-alt"></i> ${artifact.title}详细内容</div><pre class="sd-drawer-preview">${this.escapeHtml(artifact.preview)}</pre></div>`;
    }

    bodyEl.innerHTML = contentHtml;

    // 底部审阅操作按钮（只在审阅当前步骤时显示）
    if (footerEl) {
      if (isReviewing) {
        const isTextEditable = step === 1 || step === 2;
        const editButtonHtml = isTextEditable
          ? `<button class="btn-secondary sd-btn-edit-doc" onclick="SDChatAgent.handleDrawerAction('edit')">
               <i class="fas fa-edit"></i> 编辑内容
             </button>`
          : '';
        const hintText = isTextEditable
          ? '如需调整，可编辑、上传修订版或输入修改意见。'
          : '如需调整，可上传修订版或输入修改意见。';
        const renderAction = isLast ? 'render' : 'confirm';

        footerEl.innerHTML = `
          <div class="sd-drawer-review-hint">
            ${isLast
              ? '全部制作流程已完成。检查无误后即可<strong>开始渲染</strong>最终成片。' + hintText
              : `确认无误后即可进入<strong>${nextName}</strong>阶段。` + hintText}
          </div>
          <div class="sd-drawer-actions">
            <button class="${isLast ? 'btn-primary sd-btn-render' : 'btn-primary sd-btn-confirm'}" onclick="SDChatAgent.handleDrawerAction('${renderAction}')">
              ${isLast
                ? '<i class="fas fa-play"></i> 确认并开始渲染'
                : `<i class="fas fa-check"></i> 确认并进入${nextName}`}
            </button>
            ${editButtonHtml}
            <button class="btn-secondary sd-btn-upload" onclick="SDChatAgent.handleDrawerAction('upload')">
              <i class="fas fa-upload"></i> 上传修订版
            </button>
            <button class="btn-secondary sd-btn-modify" onclick="SDChatAgent.handleDrawerAction('modify')">
              <i class="fas fa-pen"></i> 修改意见
            </button>
          </div>
        `;
        footerEl.style.display = 'block';
      } else {
        footerEl.innerHTML = '';
        footerEl.style.display = 'none';
      }
    }

    drawer.classList.add('open');
    if (mask) mask.classList.add('open');
  },

  handleDrawerAction: function(action) {
    if (action === 'confirm') {
      this.closePreviewDrawer();
      setTimeout(() => this.confirmStep(), 300);
    } else if (action === 'render') {
      this.closePreviewDrawer();
      setTimeout(() => this.startRendering(), 300);
    } else if (action === 'upload') {
      this.triggerUpload();
    } else if (action === 'edit') {
      this.enterEditMode();
    } else if (action === 'modify') {
      this.closePreviewDrawer();
      setTimeout(() => this.focusInputForModification(), 300);
    }
  },

  startRendering: function() {
    this.stepPhase = 'rendering';
    this.addMessage('assistant', `
      <div class="sd-render-start">
        <div class="sd-render-title"><i class="fas fa-play-circle"></i> 开始渲染最终成片</div>
        <div class="sd-render-status" id="sd-render-status">正在初始化渲染引擎...</div>
        <div class="progress-bar">
          <div class="progress-fill" id="sd-render-bar" style="width:0%"></div>
        </div>
        <div class="sd-render-info" id="sd-render-info"></div>
      </div>
    `);
    this.simulateRender();
  },

  simulateRender: function() {
    const steps = [
      { pct: 5, status: '正在合成视频片段...', info: '加载120个镜头' },
      { pct: 15, status: '正在混音配音轨道...', info: '同步角色配音与BGM' },
      { pct: 30, status: '正在添加字幕...', info: '渲染中文字幕 · 时间轴对齐' },
      { pct: 50, status: '正在调色...', info: '应用电影级LUT' },
      { pct: 65, status: '正在合成片头片尾...', info: '标题动画 · 演职员表' },
      { pct: 80, status: '正在编码输出...', info: 'H.264 · 1080p' },
      { pct: 95, status: '正在封装文件...', info: 'MP4容器 · 校验完整性' },
      { pct: 100, status: '渲染完成！', info: '/outputs/drama_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '/final.mp4' }
    ];

    let i = 0;
    const tick = () => {
      if (i >= steps.length) {
        this.addMessage('assistant', `
          <div class="sd-render-done">
            <i class="fas fa-check-circle"></i>
            <strong>渲染成功！</strong>
            <div class="sd-render-output">输出文件：${steps[steps.length-1].info}</div>
            <button class="btn-primary" style="margin-top:10px" onclick="alert('文件已保存到：${steps[steps.length-1].info}')">
              <i class="fas fa-download"></i> 下载成片
            </button>
          </div>
        `);
        return;
      }
      const s = steps[i];
      const statusEl = document.getElementById('sd-render-status');
      const barEl = document.getElementById('sd-render-bar');
      const infoEl = document.getElementById('sd-render-info');
      if (statusEl) statusEl.textContent = s.status;
      if (barEl) barEl.style.width = s.pct + '%';
      if (infoEl) infoEl.textContent = s.info;
      i++;
      setTimeout(tick, 1200);
    };
    tick();
  },

  enterEditMode: function() {
    // 只有步骤1（剧本）和步骤2（镜头脚本）支持内联编辑
    if (this.currentStep !== 1 && this.currentStep !== 2) return;

    const previewEl = document.querySelector('.sd-drawer-preview');
    const sectionEl = previewEl ? previewEl.closest('.sd-drawer-section') : null;
    if (!previewEl || !sectionEl) return;

    const currentText = previewEl.textContent;
    const step = this.currentStep;

    // 将preview替换为可编辑的textarea
    previewEl.style.display = 'none';

    const editArea = document.createElement('div');
    editArea.className = 'sd-drawer-edit-area';
    editArea.innerHTML = `
      <textarea class="sd-drawer-editor" id="sd-drawer-editor">${this.escapeHtml(currentText)}</textarea>
      <div class="sd-drawer-edit-actions">
        <button class="btn-primary sd-btn-save-edit" onclick="SDChatAgent.saveEdit(${step})">
          <i class="fas fa-save"></i> 保存修改
        </button>
        <button class="btn-secondary sd-btn-cancel-edit" onclick="SDChatAgent.cancelEdit(${step})">
          <i class="fas fa-times"></i> 取消
        </button>
      </div>
    `;
    sectionEl.appendChild(editArea);

    // 将编辑按钮高亮
    const editBtn = document.querySelector('.sd-btn-edit-doc');
    if (editBtn) {
      editBtn.style.borderColor = '#6366f1';
      editBtn.style.color = '#4f46e5';
      editBtn.style.background = 'rgba(99, 102, 241, 0.08)';
      editBtn.querySelector('i').className = 'fas fa-edit';
      editBtn.style.pointerEvents = 'none';
    }
  },

  saveEdit: function(step) {
    const editor = document.getElementById('sd-drawer-editor');
    if (!editor) return;
    const newContent = editor.value;

    // 更新产出物的preview内容
    const artifact = this.stepArtifacts[step];
    if (artifact) {
      artifact.preview = newContent;
      artifact.source = 'user_upload';
      artifact.fileName = artifact.fileName || '（用户内联编辑）';
      artifact.summary = `用户已通过内联编辑修改内容，后续步骤将基于修改后的版本继续。`;
    }

    // 移除编辑区并重新渲染抽屉
    const editArea = document.querySelector('.sd-drawer-edit-area');
    if (editArea) editArea.remove();

    // 恢复编辑按钮
    const editBtn = document.querySelector('.sd-btn-edit-doc');
    if (editBtn) {
      editBtn.style.pointerEvents = '';
      editBtn.style.borderColor = '#334155';
      editBtn.style.color = '#10182D';
      editBtn.style.background = '#162D52';
      editBtn.querySelector('i').className = 'fas fa-edit';
    }

    // 更新抽屉body内容
    const bodyEl = document.getElementById('sd-preview-drawer-body');
    const previewEl = bodyEl ? bodyEl.querySelector('.sd-drawer-preview') : null;
    if (previewEl) {
      previewEl.textContent = newContent;
      previewEl.style.display = '';
    }

    // 同时更新卡片中的内容
    this.renderArtifact(step, artifact);
  },

  cancelEdit: function(step) {
    const editArea = document.querySelector('.sd-drawer-edit-area');
    if (editArea) editArea.remove();

    const previewEl = document.querySelector('.sd-drawer-preview');
    if (previewEl) previewEl.style.display = '';

    // 恢复编辑按钮
    const editBtn = document.querySelector('.sd-btn-edit-doc');
    if (editBtn) {
      editBtn.style.pointerEvents = '';
      editBtn.style.borderColor = '#334155';
      editBtn.style.color = '#10182D';
      editBtn.style.background = '#162D52';
      editBtn.querySelector('i').className = 'fas fa-edit';
    }
  },

  closePreviewDrawer: function() {
    const drawer = document.getElementById('sd-preview-drawer');
    const mask = document.getElementById('sd-preview-drawer-mask');
    if (drawer) drawer.classList.remove('open');
    if (mask) mask.classList.remove('open');
  },

  escapeForAttr: function(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  startGeneration: function(userMessage, isRevision) {
    this.stepPhase = 'generating';
    const meta = this.stepMeta[this.currentStep];

    const modelName = this.selectedModel || 'gpt-4o';
    this.addMessage('assistant', `<div class="sd-skill-badge"><i class="fas fa-bolt"></i> 正在使用 <strong>${modelName}</strong> 调用 <strong>${meta.skill}</strong> 生成${meta.artifactName}...</div>`);
    this.showTyping();

    setTimeout(() => {
      this.hideTyping();
      const artifact = this.generateArtifact(this.currentStep, userMessage);
      this.stepArtifacts[this.currentStep] = artifact;
      this.renderArtifact(this.currentStep, artifact);
      this.enterReview();
    }, 1800);
  },

  enterReview: function() {
    this.stepPhase = 'reviewing';
    const meta = this.stepMeta[this.currentStep];

    // 对话中只保留简短提示，操作按钮放到抽屉底部
    const hintHtml = `
      <div class="sd-review-hint">
        <i class="fas fa-clipboard-check"></i>
        <span>${meta.artifactName}已生成，请在右侧抽屉审阅并确认下一步操作</span>
        <button class="sd-btn-open-drawer" onclick="SDChatAgent.openPreviewDrawer(${this.currentStep})">
          <i class="fas fa-external-link-alt"></i> 打开审阅抽屉
        </button>
      </div>
    `;
    this.addMessage('assistant', hintHtml);
    this.updateInputPlaceholder();

    // 生成后自动打开抽屉进行审阅
    setTimeout(() => this.openPreviewDrawer(this.currentStep), 400);
  },

  focusInputForModification: function() {
    this.stepPhase = 'awaiting_modification';
    this.updateInputPlaceholder();
    const inputField = document.getElementById('sd-unified-input');
    if (inputField) inputField.focus();
    this.addMessage('assistant', '好的，请在下方输入您对当前产出物的修改意见，我会重新生成。');
  },

  triggerUpload: function() {
    let fileInput = document.getElementById('sd-artifact-upload-input');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'sd-artifact-upload-input';
      fileInput.accept = '.txt,.md,.json,.docx,.pdf,.jpg,.jpeg,.png,.mp4,.mov,.mp3,.wav';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      fileInput.addEventListener('change', e => this.handleUpload(e));
    }
    fileInput.value = '';
    fileInput.click();
  },

  handleUpload: function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const meta = this.stepMeta[this.currentStep];
    const step = this.currentStep;
    const self = this;

    const sizeKb = (file.size / 1024).toFixed(1);
    this.addMessage('user', `<div class="sd-uploaded-file"><i class="fas fa-file-arrow-up"></i> 已上传修订版：<strong>${file.name}</strong> <span class="sd-file-size">(${sizeKb} KB)</span></div>`);

    // 关闭当前抽屉，等下重新打开展示新内容
    this.closePreviewDrawer();

    // 尝试读取文件内容（文本文件）
    const isTextFile = /\.(txt|md|json|csv|log|xml|yml|yaml)$/i.test(file.name);
    const readFileContent = (callback) => {
      if (isTextFile) {
        const reader = new FileReader();
        reader.onload = e => callback(e.target.result || '');
        reader.onerror = () => callback('');
        reader.readAsText(file);
      } else {
        callback('');
      }
    };

    readFileContent(fileContent => {
      // 用用户上传的产出物覆盖本步骤的产出
      const artifact = {
        title: `${meta.artifactName}（用户修订版）`,
        source: 'user_upload',
        fileName: file.name,
        fileSize: file.size,
        summary: `已采用用户上传的 ${file.name} 作为本步骤最终版本，后续步骤将基于该文件继续。`,
        sections: [
          { label: '文件名', value: file.name },
          { label: '文件大小', value: sizeKb + ' KB' },
          { label: '文件类型', value: file.type || this.getFileExt(file.name) },
          { label: '上传时间', value: new Date().toLocaleString('zh-CN') },
          { label: '状态', value: '已采用为本步骤最终版本' }
        ],
        preview: fileContent || `[${file.name}]\n\n此文件为非文本格式（${file.type || this.getFileExt(file.name)}），无法在此预览具体内容。\n\n文件大小：${sizeKb} KB\n\n系统会将该文件作为本步骤的最终版本，后续步骤将基于此继续。`
      };
      this.stepArtifacts[step] = artifact;

      this.showTyping();
      setTimeout(() => {
        this.hideTyping();
        this.addMessage('assistant', `已收到您的修订版 <strong>${file.name}</strong>，请在右侧抽屉中查看内容并确认后续操作。`);
        this.stepPhase = 'reviewing';
        // 直接打开抽屉展示上传内容
        setTimeout(() => self.openPreviewDrawer(step), 300);
      }, 900);
    });
  },

  getFileExt: function(name) {
    const match = /\.([a-zA-Z0-9]+)$/.exec(name || '');
    return match ? match[1].toUpperCase() : '未知';
  },

  confirmStep: function() {
    const meta = this.stepMeta[this.currentStep];
    this.addMessage('assistant', `<div class="sd-step-done"><i class="fas fa-check-circle"></i> <strong>${meta.name}</strong> 已确认。</div>`);
    this.proceedToNextStep();
  },

  updateInputPlaceholder: function() {
    const inputField = document.getElementById('sd-unified-input');
    if (!inputField) return;
    const placeholders = {
      awaiting_input: '描述您的短剧创意或回答当前阶段的问题...',
      reviewing: '如需调整，可直接在此输入修改意见后发送...',
      awaiting_modification: '请输入具体的修改意见，我会重新生成...'
    };
    inputField.placeholder = placeholders[this.stepPhase] || placeholders.awaiting_input;
  },

  addMessage: function(role, content) {
    const messagesContainer = document.getElementById('sd-unified-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `sd-message sd-message-${role}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'sd-message-avatar';
    avatarDiv.innerHTML = role === 'assistant'
      ? '<i class="fas fa-robot"></i>'
      : '<i class="fas fa-user"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'sd-message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'sd-message-text';
    textDiv.innerHTML = content; // 使用 innerHTML 以支持 HTML 标签

    contentDiv.appendChild(textDiv);
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.messages.push({ role, content });
  },

  showTyping: function() {
    const messagesContainer = document.getElementById('sd-unified-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'sd-message sd-message-assistant';
    typingDiv.id = 'sd-unified-typing';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'sd-message-avatar';
    avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'sd-message-content';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'sd-message-text';
    typingIndicator.innerHTML = `
      <div class="sd-message-typing">
        <div class="sd-typing-dot"></div>
        <div class="sd-typing-dot"></div>
        <div class="sd-typing-dot"></div>
      </div>
    `;

    contentDiv.appendChild(typingIndicator);
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  hideTyping: function() {
    const typingIndicator = document.getElementById('sd-unified-typing');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  },

  proceedToNextStep: function() {
    if (this.currentStep >= this.totalSteps) {
      this.stepPhase = 'completed';
      this.addMessage('assistant', `
🎉 <strong>恭喜！所有制作流程已完成！</strong>

您的短剧已经准备就绪，包括：
✓ 完整的剧本
✓ 详细的镜头脚本
✓ 精美的视觉素材
✓ 动态视频片段
✓ 角色配音
✓ 后期合成

现在可以开始最终渲染了！
      `);
      this.updateProgress();
      return;
    }

    this.currentStep++;
    this.stepPhase = 'awaiting_input';
    this.updateProgress();
    this.addMessage('assistant', this.getStepIntroduction(this.currentStep));
    this.updateSuggestions(this.currentStep);
    this.updateInputPlaceholder();

    // 自动使用上一步的产出物作为本步骤的输入基础
    const prevArtifact = this.stepArtifacts[this.currentStep - 1];
    if (prevArtifact) {
      this.addMessage('assistant', `<div class="sd-context-note"><i class="fas fa-link"></i> 已加载上一步的<strong>${this.stepMeta[this.currentStep - 1].artifactName}</strong>作为本阶段的输入基础。</div>`);
    }

    // 如果是步骤2-6，自动生成默认参数确认面板
    if (this.currentStep >= 2 && this.currentStep <= 6) {
      setTimeout(() => {
        this.autoGenerateNextStepConfirmation();
      }, 800);
    }
  },

  autoGenerateNextStepConfirmation: function() {
    // 根据上一步的产出物，自动生成当前步骤的默认参数和确认面板
    const prevArtifact = this.stepArtifacts[this.currentStep - 1];
    let defaultMessage = '';

    // 根据步骤生成默认消息
    if (this.currentStep === 2) {
      // 镜头脚本：基于剧本生成默认镜头参数
      defaultMessage = '经典镜头配置：每场景4个镜头，以中景和近景为主，镜头运动平稳，多用推拉镜头，平视角度为主，每镜头3-5秒。';
    } else if (this.currentStep === 3) {
      // 素材生成：基于镜头脚本生成默认素材参数
      defaultMessage = '写实风格，明亮色调，使用RunningHub云端生成服务。';
    } else if (this.currentStep === 4) {
      // 镜头生成：基于素材生成默认视频参数
      defaultMessage = '图生视频方式，镜头运动自然流畅，使用淡入淡出转场效果。';
    } else if (this.currentStep === 5) {
      // 配音合成：基于视频生成默认配音参数
      defaultMessage = '男主使用成熟男声，女主使用温柔女声，语速正常，情感真挚。';
    } else if (this.currentStep === 6) {
      // 后期合成：生成默认后期参数
      defaultMessage = '背景音乐风格舒缓，字幕样式简洁白色居中，电影感调色，输出1080p MP4格式。';
    }

    // 显示自动生成的消息
    this.addMessage('assistant', `<div class="sd-auto-hint"><i class="fas fa-magic"></i> 我已根据上一步的内容，为您准备了推荐的默认参数配置。您可以直接确认使用，或者根据需要进行调整。</div>`);

    // 模拟用户输入默认消息，触发参数确认面板
    setTimeout(() => {
      this.showConfirmationPanel(defaultMessage);
    }, 500);
  },

  generateArtifact: function(step, userMessage) {
    const generators = {
      1: () => this.buildScriptArtifact(userMessage),
      2: () => this.buildShotArtifact(userMessage),
      3: () => this.buildMaterialArtifact(userMessage),
      4: () => this.buildVideoArtifact(userMessage),
      5: () => this.buildVoiceArtifact(userMessage),
      6: () => this.buildPostArtifact(userMessage)
    };
    const build = generators[step];
    return build ? build() : { title: '产出物', source: 'ai', summary: '已生成' };
  },

  buildScriptArtifact: function(message) {
    const theme = this.extractTheme(message);
    return {
      title: '剧本大纲',
      source: 'ai',
      summary: `围绕「${theme}」构建的完整剧本框架`,
      sections: [
        { label: '题材', value: theme },
        { label: '集数', value: '10 集' },
        { label: '每集时长', value: '3 分钟' },
        { label: '主要角色', value: '男主 · 女主 · 关键配角 × 2' },
        { label: '剧情结构', value: '起（1-2集） · 承（3-6集） · 转（7-8集） · 合（9-10集）' }
      ],
      preview: `第1集《相遇》\n场景1：都市清晨的写字楼下，女主匆匆奔跑，与男主意外相撞。\n场景2：咖啡厅内，男主留下一张名片。\n场景3：女主回到工位，发现同事正在议论"新任总裁"。\n\n第2集《再见》...`
    };
  },

  buildShotArtifact: function(message) {
    return {
      title: '分镜脚本',
      source: 'ai',
      summary: `${this.extractCameraStyle(message)}，${this.extractCameraMovement(message)}`,
      sections: [
        { label: '每场景镜头数', value: '3-5 个' },
        { label: '景别配比', value: '特写 30% · 中景 40% · 全景 30%' },
        { label: '运镜方式', value: this.extractCameraMovement(message) },
        { label: '拍摄角度', value: '平视为主，关键情感点使用微仰视' },
        { label: '预估总镜头数', value: '约 120 个' }
      ],
      preview: `场景1 · 写字楼下\n镜头1 [全景/固定, 3s] 都市清晨全貌，行人穿梭。\n镜头2 [中景/跟拍, 4s] 女主匆忙奔跑。\n镜头3 [特写/推镜, 2s] 手表指针特写。\n镜头4 [中景/侧拍, 3s] 与男主相撞瞬间。\n镜头5 [特写/仰视, 2s] 男主微皱眉，画面定格。`
    };
  },

  buildMaterialArtifact: function(message) {
    return {
      title: '视觉素材',
      source: 'ai',
      summary: `${this.extractStyle(message)} · ${this.extractColorTone(message)}`,
      sections: [
        { label: '风格', value: this.extractStyle(message) },
        { label: '色调', value: this.extractColorTone(message) },
        { label: '生成服务', value: this.extractService(message) },
        { label: '已生成资源', value: '场景背景 × 12 · 角色立绘 × 4 · 道具 × 8' },
        { label: '负向提示词', value: 'blurry, low quality, distorted' }
      ],
      preview: `[已生成的素材缩略图占位]\n\n- 写字楼晨景（1024×1024）\n- 咖啡厅内景（1024×1024）\n- 女主形象-通勤装（768×1024）\n- 男主形象-正装（768×1024）\n- ...`
    };
  },

  buildVideoArtifact: function(message) {
    return {
      title: '视频镜头',
      source: 'ai',
      summary: `${this.extractVideoMethod(message)} · ${this.extractDynamicEffect(message)}`,
      sections: [
        { label: '生成方式', value: this.extractVideoMethod(message) },
        { label: '动态效果', value: this.extractDynamicEffect(message) },
        { label: '已生成镜头', value: '120 / 120' },
        { label: '总时长', value: '约 30 分钟' },
        { label: '转场方式', value: '硬切为主，情感转折处使用叠化' }
      ],
      preview: `[视频片段预览占位]\n\n镜头1.mp4  3s\n镜头2.mp4  4s\n镜头3.mp4  2s\n...`
    };
  },

  buildVoiceArtifact: function(message) {
    return {
      title: '角色配音',
      source: 'ai',
      summary: `${this.extractVoiceType(message)} · ${this.extractTTSService(message)}`,
      sections: [
        { label: '音色配置', value: this.extractVoiceType(message) },
        { label: '合成服务', value: this.extractTTSService(message) },
        { label: '总台词条数', value: '186 条' },
        { label: '总时长', value: '约 28 分钟' },
        { label: '情感调节', value: '按剧本情感标注自动调整' }
      ],
      preview: `[配音音轨预览占位]\n\n01_男主_01.wav  8.2s\n02_女主_01.wav  6.5s\n03_旁白_01.wav  12.1s\n...`
    };
  },

  buildPostArtifact: function(message) {
    const prevSteps = this.stepArtifacts;
    const scriptTitle = (prevSteps[1] && prevSteps[1].title) || '剧本';
    const shotCount = (prevSteps[2] && prevSteps[2].sections) ? (prevSteps[2].sections.find(s => s.label === '预估总镜头数') || {}).value || '120' : '120';

    return {
      title: '最终成片',
      source: 'ai',
      summary: `已完成全部6步制作流程，整合${this.extractBGMStyle(message)}配乐与${this.extractColorGrading(message)}调色`,
      sections: [
        { label: '片头', value: `${scriptTitle} · 3秒标题动画` },
        { label: '正片', value: `${shotCount}个镜头 · 总时长约30分钟` },
        { label: '配音', value: this.extractVoiceType(message) || '多角色配音' },
        { label: '背景音乐', value: this.extractBGMStyle(message) },
        { label: '字幕', value: this.extractSubtitleStyle(message) + ' · 中文字幕 · 时间轴同步' },
        { label: '调色', value: this.extractColorGrading(message) },
        { label: '片尾', value: '滚动演职员表 · 5秒' },
        { label: '输出格式', value: '1080p · MP4 · H.264' },
        { label: '输出路径', value: '/outputs/drama_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '/final.mp4' }
      ],
      preview: `╔══════════════════════════════╗\n║     ${scriptTitle}        ║\n║                            ║\n║   🎬 正片开始              ║\n║                            ║\n║   第1集 → 第2集 → ...      ║\n║                            ║\n║   🎵 BGM: ${this.extractBGMStyle(message)}            ║\n║   📝 字幕: ${this.extractSubtitleStyle(message)}            ║\n║                            ║\n║   1080p MP4 · 30min        ║\n╚══════════════════════════════╝\n\n以上为最终成片预览\n实际渲染后将输出完整视频文件`
    };
  },

  renderArtifact: function(step, artifact) {
    if (!artifact) return;
    const meta = this.stepMeta[step];
    const sourceLabel = artifact.source === 'user_upload'
      ? '<span class="sd-artifact-source user"><i class="fas fa-user"></i> 用户修订版</span>'
      : '<span class="sd-artifact-source ai"><i class="fas fa-robot"></i> AI 生成</span>';

    let sectionsHtml = '';
    if (artifact.sections && artifact.sections.length) {
      sectionsHtml = '<div class="sd-artifact-sections">' +
        artifact.sections.map(s => `<div class="sd-artifact-row"><span class="sd-artifact-key">${s.label}</span><span class="sd-artifact-val">${s.value}</span></div>`).join('') +
        '</div>';
    }

    let fileInfoHtml = '';
    if (artifact.source === 'user_upload' && artifact.fileName) {
      const sizeKb = (artifact.fileSize / 1024).toFixed(1);
      fileInfoHtml = `<div class="sd-artifact-file"><i class="fas fa-file-lines"></i> ${artifact.fileName} <span class="sd-file-size">(${sizeKb} KB)</span></div>`;
    }

    const previewHtml = artifact.preview
      ? `<div class="sd-artifact-preview">
           <button class="sd-artifact-preview-header" type="button" onclick="SDChatAgent.openPreviewDrawer(${step})">
             <span><i class="fas fa-eye"></i> 内容预览</span>
             <i class="fas fa-arrow-right sd-preview-arrow"></i>
           </button>
         </div>`
      : '';

    const summaryHtml = artifact.summary ? `<div class="sd-artifact-summary">${artifact.summary}</div>` : '';

    const card = `
      <div class="sd-artifact-card">
        <div class="sd-artifact-header">
          <div class="sd-artifact-title"><i class="fas ${meta.icon}"></i> ${artifact.title}</div>
          ${sourceLabel}
        </div>
        ${summaryHtml}
        ${fileInfoHtml}
        ${sectionsHtml}
        ${previewHtml}
      </div>
    `;
    this.addMessage('assistant', card);
  },

  escapeHtml: function(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  goToStep: function(stepNum) {
    if (stepNum < 1 || stepNum > this.totalSteps) return;
    const meta = this.stepMeta[stepNum];
    const artifact = this.stepArtifacts[stepNum];
    if (artifact) {
      this.addMessage('assistant', `<div class="sd-context-note"><i class="fas fa-clock-rotate-left"></i> 回看 <strong>${meta.name}</strong> 的产出物：</div>`);
      this.renderArtifact(stepNum, artifact);
    } else {
      this.addMessage('assistant', `<div class="sd-context-note"><i class="fas fa-info-circle"></i> <strong>${meta.name}</strong> 尚未生成产出物。</div>`);
    }
  },

  updateProgress: function() {
    // 更新步骤进度显示
    const steps = document.querySelectorAll('.sd-progress-step');
    steps.forEach((step, index) => {
      const stepNum = index + 1;
      const statusEl = step.querySelector('.sd-progress-step-status');

      if (stepNum < this.currentStep) {
        step.classList.remove('active');
        step.classList.add('completed');
        if (statusEl) statusEl.textContent = '已完成';
      } else if (stepNum === this.currentStep) {
        step.classList.remove('completed');
        step.classList.add('active');
        if (statusEl) statusEl.textContent = '进行中';
      } else {
        step.classList.remove('active', 'completed');
        if (statusEl) statusEl.textContent = '待开始';
      }
    });

    // 更新当前阶段提示
    const phaseEl = document.getElementById('sd-current-phase');
    if (phaseEl) {
      const phaseNames = ['', '剧本创作', '镜头脚本', '素材生成', '镜头生成', '配音合成', '后期合成'];
      phaseEl.textContent = `当前阶段：${phaseNames[this.currentStep]}`;
    }
  },

  getStepIntroduction: function(step) {
    const introductions = {
      1: `现在让我们从<strong>剧本创作</strong>开始。请告诉我您想创作什么样的短剧？`,
      2: `太好了！剧本创作完成。现在进入<strong>镜头脚本</strong>阶段。

我会将剧本转化为详细的分镜头脚本。请告诉我：
• 每个场景的镜头数量（建议3-5个镜头为一个场景）
• 镜头景别偏好（特写、近景、中景、全景、远景）
• 镜头运动方式（固定、推拉、摇移、跟拍等）
• 拍摄角度（平视、俯视、仰视、侧面等）`,
      3: `很好！镜头脚本已经规划完成。现在进入<strong>素材生成</strong>阶段。

我会根据镜头脚本为每个镜头生成相应的视觉素材。请告诉我：
• 视觉风格（写实、插画、3D、手绘等）
• 画面色调（明亮、暗黑、温暖、冷色等）
• 生成服务选择（RunningHub云端 / 本地ComfyUI / API模型）`,
      4: `素材生成完成！现在进入<strong>镜头生成</strong>阶段。

请告诉我您需要的视频效果：
• 生成方式（图生视频 / 动作迁移 / 特效合成）
• 动态效果（镜头运动、人物动作、场景变化）
• 转场效果（淡入淡出、切换、特效转场）`,
      5: `视频片段准备就绪！现在进入<strong>配音合成</strong>阶段。

请告诉我配音需求：
• 每个角色的音色（男声/女声，音色特点）
• 语速和语调（快速/舒缓，激动/平静）
• 情感表达（开心/悲伤/愤怒/温柔等）`,
      6: `配音完成！最后进入<strong>后期合成</strong>阶段。

请告诉我后期处理需求：
• 背景音乐风格（激昂、舒缓、悬疑、浪漫等）
• 字幕样式（字体、颜色、位置）
• 调色风格（电影感、明亮、暗黑等）
• 输出格式（1080p / 4K，MP4 / MOV）`
    };

    return introductions[step] || '';
  },

  updateSuggestions: function(step) {
    const suggestionsContainer = document.getElementById('sd-suggestion-chips');
    if (!suggestionsContainer) return;

    const suggestions = {
      1: [
        { text: '霸道总裁爱上我', value: '我想创作一部现代都市霸道总裁题材的短剧，女主是一名普通职员，机缘巧合下救了男主，男主对她一见钟情。共10集，每集3分钟。' },
        { text: '穿越之程序员在古代', value: '我想创作一部古装穿越短剧，现代程序员穿越到古代，用现代知识改变命运。共15集，每集2分钟。' },
        { text: '悬疑侦探', value: '我想创作一部悬疑推理短剧，一名侦探调查一起离奇失踪案，层层剥茧发现惊人真相。共8集，每集4分钟。' },
        { text: '青春校园', value: '我想创作一部青春校园短剧，讲述一群高中生追逐梦想、友情与爱情的故事。共12集，每集3分钟。' }
      ],
      2: [
        { text: '经典影视风格', value: '经典镜头配置：每场景4个镜头，以中景和近景为主，镜头运动平稳，多用推拉镜头，平视角度为主，每镜头3-5秒。' },
        { text: '快节奏剪辑', value: '快节奏配置：每场景5-6个镜头，特写和近景为主，快速切换，镜头运动活跃，多角度拍摄，每镜头2-3秒。' },
        { text: '电影长镜头', value: '电影感配置：每场景3-4个镜头，全景和中景为主，长镜头为主，缓慢推拉，以平视和微仰视为主，每镜头5-8秒。' },
        { text: '纪实风格', value: '纪实风格：每场景3-5个镜头，自然景别分布，镜头相对固定，手持摇晃感，多用平视角度，每镜头3-6秒。' }
      ],
      3: [
        { text: '写实电影风', value: '使用写实风格生成素材，画面要求高清细腻，色调偏电影感，使用RunningHub云端服务。' },
        { text: '扁平插画风', value: '使用扁平插画风格，色彩明亮活泼，适合现代都市题材，使用API模型生成。' },
        { text: '中国水墨风', value: '使用中国风水墨画风格，适合古装题材，使用本地ComfyUI生成。' },
        { text: '赛博朋克风', value: '使用赛博朋克风格，霓虹灯光效果，暗色调，科技感强。' }
      ],
      4: [
        { text: '平稳图生视频', value: '使用图生视频，添加缓慢的推拉镜头运动，自然的转场效果，使用RunningHub云端服务。' },
        { text: '人物动作迁移', value: '使用动作迁移技术，为人物添加自然的动作和表情，使用API模型生成。' },
        { text: '特效合成', value: '添加特效合成，粒子效果、光效、氛围渲染，使用本地ComfyUI。' },
        { text: '快速剪辑', value: '快速剪辑模式，简单的淡入淡出转场，保持画面稳定。' }
      ],
      5: [
        { text: '经典男女主配音', value: '男主角使用沉稳磁性的男声，语速适中；女主角使用温柔知性的女声，语速稍慢。使用本地Edge TTS。' },
        { text: '专业旁白', value: '使用播音腔专业男声作为旁白，音色浑厚，语速稳定，情感中立。' },
        { text: '多角色配音', value: '多角色配音，每个角色使用不同音色，语速根据角色性格调整，使用API模型。' },
        { text: '青春活力', value: '青春活力风格，使用年轻化的音色，语速偏快，情感饱满。' }
      ],
      6: [
        { text: '电影级成片', value: '添加电影感配乐，白色字幕居中显示，简洁片头3秒，电影级调色，输出1080p MP4格式。' },
        { text: '社交媒体版', value: '轻快的背景音乐，彩色动态字幕，无片头片尾，明亮调色风格，适合社交媒体分享。' },
        { text: '悬疑高清版', value: '悬疑紧张配乐，暗色调色，特效字幕，5秒悬念片头，输出4K高清。' },
        { text: '极简原声版', value: '极简风格，仅添加必要字幕，无BGM，保持原声，输出1080p。' }
      ]
    };

    const stepSuggestions = suggestions[step] || [];
    suggestionsContainer.innerHTML = stepSuggestions.map(s =>
      `<button class="sd-suggestion-chip" data-suggestion="${s.value}">${s.text}</button>`
    ).join('');

    // 重新绑定点击事件
    const newChips = suggestionsContainer.querySelectorAll('.sd-suggestion-chip');
    newChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const suggestion = chip.getAttribute('data-suggestion');
        const inputField = document.getElementById('sd-unified-input');
        if (inputField) {
          inputField.value = suggestion;
          inputField.focus();
        }
      });
    });
  },


  generateScriptResponse: function(message) {
    return `很好！我理解您想创作的短剧主题了。让我为您规划一下剧本框架：

📝 **剧本大纲**
- 总集数：根据您的需求设定
- 每集时长：2-4分钟
- 核心冲突：${this.extractTheme(message)}

接下来，我会帮您：
1. 细化人物设定（性格、背景、关系）
2. 规划剧情节奏（起承转合）
3. 设计关键情节点
4. 撰写分集大纲

请告诉我您还有什么特殊要求？比如特定的场景、人物关系或者想要的结局？`;
  },

  generateShotResponse: function(message) {
    return `收到！我会根据您的要求规划镜头脚本。

🎬 **镜头脚本方案**
- 镜头风格：${this.extractCameraStyle(message)}
- 景别配比：根据您的偏好设置
- 镜头运动：${this.extractCameraMovement(message)}

分镜脚本包含：
1. 每个场景的镜头分解
2. 详细的景别和角度描述
3. 镜头运动方式（推拉摇移、固定等）
4. 每个镜头的时长和画面内容
5. 转场方式建议

我会确保镜头脚本既符合剧情需要，又便于后续素材生成。`;
  },

  generateMaterialResponse: function(message) {
    return `明白了！我会按照镜头脚本生成相应的素材。

🎨 **素材生成方案**
- 风格定位：${this.extractStyle(message)}
- 色调方案：${this.extractColorTone(message)}
- 生成服务：${this.extractService(message)}

我将为每个镜头生成：
1. 对应景别的场景背景
2. 符合镜头角度的角色素材
3. 道具和细节元素
4. 氛围渲染效果

预计生成时间：根据镜头数量，约5-15分钟。
您可以随时预览生成效果并要求调整。`;
  },

  generateVideoResponse: function(message) {
    return `好的！我会将素材转化为动态视频片段。

🎥 **视频生成方案**
- 生成方式：${this.extractVideoMethod(message)}
- 动态效果：${this.extractDynamicEffect(message)}
- 转场效果：根据剧情选择合适转场

处理流程：
1. 素材预处理和优化
2. 添加镜头运动效果
3. 生成平滑的转场
4. 输出高质量视频片段

预计处理时间：每个场景约3-8分钟。
生成后您可以预览并调整效果。`;
  },

  generateVoiceResponse: function(message) {
    return `明白！我会为角色配音。

🎤 **配音合成方案**
- 角色音色：${this.extractVoiceType(message)}
- 语速语调：根据角色性格和情感调整
- 配音服务：${this.extractTTSService(message)}

配音处理：
1. 按角色分配不同音色
2. 根据台词情感调整语气
3. 添加适当的停顿和重音
4. 确保音质清晰自然

预计合成时间：每分钟台词约30秒处理时间。
您可以试听后要求重新调整。`;
  },

  generatePostResponse: function(message) {
    return `收到！我会完成最终的后期合成。

✨ **后期合成方案**
- 背景音乐：${this.extractBGMStyle(message)}
- 字幕样式：${this.extractSubtitleStyle(message)}
- 调色风格：${this.extractColorGrading(message)}
- 输出格式：${this.extractOutputFormat(message)}

后期处理包括：
1. 添加BGM并混音平衡
2. 生成字幕并同步时间轴
3. 片头片尾制作
4. 整体调色和画面优化
5. 最终渲染输出

预计处理时间：根据时长，约10-30分钟。
完成后您将获得完整的短剧成片！`;
  },

  // 辅助函数：提取关键信息
  extractTheme: function(message) {
    if (message.includes('霸道总裁')) return '职场阶级差异与爱情';
    if (message.includes('穿越')) return '现代与古代的碰撞';
    if (message.includes('悬疑') || message.includes('侦探')) return '真相揭秘与正义伸张';
    if (message.includes('青春') || message.includes('校园')) return '成长与梦想追逐';
    return '情感与人性探索';
  },

  extractStyle: function(message) {
    if (message.includes('写实')) return '写实风格';
    if (message.includes('插画')) return '插画风格';
    if (message.includes('水墨')) return '中国水墨风';
    if (message.includes('赛博朋克')) return '赛博朋克风格';
    return '现代风格';
  },

  extractColorTone: function(message) {
    if (message.includes('明亮')) return '明亮温暖';
    if (message.includes('暗')) return '暗黑神秘';
    if (message.includes('冷')) return '冷色调';
    return '自然柔和';
  },

  extractService: function(message) {
    if (message.includes('RunningHub') || message.includes('云端')) return 'RunningHub云端';
    if (message.includes('ComfyUI') || message.includes('本地')) return '本地ComfyUI';
    if (message.includes('API')) return 'API模型';
    return 'RunningHub云端';
  },

  extractCameraStyle: function(message) {
    if (message.includes('电影')) return '电影级镜头语言';
    if (message.includes('动感') || message.includes('动作')) return '动感运镜';
    if (message.includes('舒缓')) return '舒缓流畅';
    if (message.includes('纪实')) return '纪实风格';
    return '平稳专业';
  },

  extractCameraMovement: function(message) {
    if (message.includes('推拉')) return '推拉镜头为主';
    if (message.includes('固定')) return '固定镜头为主';
    if (message.includes('摇移')) return '摇移镜头为主';
    if (message.includes('跟拍')) return '跟拍镜头为主';
    if (message.includes('手持')) return '手持摇晃效果';
    return '综合运镜方式';
  },

  extractPace: function(message) {
    if (message.includes('快')) return '快节奏剪辑';
    if (message.includes('慢') || message.includes('舒缓')) return '舒缓节奏';
    return '适中节奏';
  },

  extractVideoMethod: function(message) {
    if (message.includes('图生视频')) return '图生视频';
    if (message.includes('动作迁移')) return '动作迁移技术';
    if (message.includes('特效')) return '特效合成';
    return '图生视频';
  },

  extractDynamicEffect: function(message) {
    if (message.includes('推拉')) return '推拉镜头运动';
    if (message.includes('动作')) return '人物动作动画';
    return '缓慢镜头运动';
  },

  extractVoiceType: function(message) {
    if (message.includes('男') && message.includes('女')) return '多角色配音';
    if (message.includes('播音')) return '专业播音腔';
    if (message.includes('青春')) return '青春活力音色';
    return '自然音色';
  },

  extractTTSService: function(message) {
    if (message.includes('Edge') || message.includes('本地')) return '本地Edge TTS';
    if (message.includes('ComfyUI')) return 'ComfyUI合成';
    if (message.includes('API')) return 'API模型';
    return '本地Edge TTS';
  },

  extractBGMStyle: function(message) {
    if (message.includes('电影')) return '电影感配乐';
    if (message.includes('轻快')) return '轻快愉悦';
    if (message.includes('悬疑')) return '悬疑紧张';
    if (message.includes('无') || message.includes('不')) return '无背景音乐';
    return '温馨舒缓';
  },

  extractSubtitleStyle: function(message) {
    if (message.includes('彩色') || message.includes('动态')) return '彩色动态字幕';
    if (message.includes('简洁') || message.includes('极简')) return '简洁字幕';
    if (message.includes('特效')) return '特效字幕';
    return '白色居中字幕';
  },

  extractColorGrading: function(message) {
    if (message.includes('电影')) return '电影级调色';
    if (message.includes('明亮')) return '明亮清新';
    if (message.includes('暗') || message.includes('悬疑')) return '暗黑低饱和';
    return '自然色调';
  },

  extractOutputFormat: function(message) {
    if (message.includes('4K')) return '4K超高清 MP4';
    if (message.includes('MOV')) return '1080p MOV';
    return '1080p MP4';
  },

  clearChat: function() {
    const messagesContainer = document.getElementById('sd-unified-messages');
    if (!messagesContainer) return;

    const welcomeMessage = messagesContainer.querySelector('.sd-message-assistant');
    messagesContainer.innerHTML = '';
    if (welcomeMessage) {
      messagesContainer.appendChild(welcomeMessage);
    }

    this.messages = [];
    this.stepPhase = 'awaiting_input';
    this.updateInputPlaceholder();
  }
};

// ===== AI科转 智能体 =====
const AKZChatAgent = {
  messages: [],
  currentStep: 1,
  totalSteps: 5,
  stepPhase: 'awaiting_input',
  stepArtifacts: {},
  stepData: {},
  selectedModel: 'gpt-4o',

  stepMeta: {
    1: { name: '文档解析', icon: 'fa-file-magnifying-glass', artifactName: '文档解析报告', skill: '文档解析助手' },
    2: { name: '镜头脚本', icon: 'fa-pen-fancy', artifactName: '视频脚本', skill: '镜头脚本助手' },
    3: { name: '素材生成', icon: 'fa-palette', artifactName: '视觉素材', skill: '素材生成助手' },
    4: { name: '视频生成', icon: 'fa-video', artifactName: '短视频', skill: '视频生成助手' },
    5: { name: '后期合成', icon: 'fa-wand-magic-sparkles', artifactName: '成片', skill: '后期合成助手' }
  },

  init: function() {
    const sendBtn = document.getElementById('akz-unified-send');
    const inputField = document.getElementById('akz-unified-input');
    const clearBtn = document.getElementById('akz-unified-clear-chat');
    const suggestionChips = document.querySelectorAll('#akz-suggestion-chips .akz-suggestion-chip');
    const fileUploadArea = document.getElementById('akz-file-upload-area');
    const fileInput = document.getElementById('akz-file-input');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    if (inputField) {
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearChat());
    }

    // 文件上传区域点击
    if (fileUploadArea && fileInput) {
      fileUploadArea.addEventListener('click', () => fileInput.click());
      fileUploadArea.addEventListener('dragover', (e) => { e.preventDefault(); fileUploadArea.classList.add('akz-file-upload-dragover'); });
      fileUploadArea.addEventListener('dragleave', () => { fileUploadArea.classList.remove('akz-file-upload-dragover'); });
      fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('akz-file-upload-dragover');
        if (e.dataTransfer.files.length > 0) {
          this.handleFileUpload(e.dataTransfer.files);
        }
      });
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          this.handleFileUpload(fileInput.files);
        }
      });
    }

    suggestionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const suggestion = chip.getAttribute('data-suggestion');
        if (inputField) {
          inputField.value = suggestion;
          inputField.focus();
        }
      });
    });

    const progressSteps = document.querySelectorAll('.akz-progress-step');
    progressSteps.forEach(step => {
      step.addEventListener('click', () => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        if (stepNum < this.currentStep) {
          this.goToStep(stepNum);
        }
      });
    });
  },

  handleFileUpload: function(files) {
    const fileList = document.getElementById('akz-file-list');
    const uploadHint = document.getElementById('akz-file-upload-hint');
    if (!fileList) return;

    const allowedExts = /\.(jpg|jpeg|png|gif|bmp|webp|ppt|pptx|pdf|doc|docx)$/i;
    let validFiles = [];

    for (const file of files) {
      if (allowedExts.test(file.name)) {
        validFiles.push(file);
        const sizeKb = (file.size / 1024).toFixed(1);
        const sizeDisplay = file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
          : sizeKb + ' KB';
        const icon = this.getFileIcon(file.name);

        const fileEl = document.createElement('div');
        fileEl.className = 'akz-file-item';
        fileEl.innerHTML = `
          <i class="${icon}"></i>
          <span class="akz-file-name">${file.name}</span>
          <span class="akz-file-size">${sizeDisplay}</span>
          <button class="akz-file-remove" onclick="this.parentElement.remove(); AKZChatAgent.updateFileListVisibility();">
            <i class="fas fa-times"></i>
          </button>
        `;
        fileList.appendChild(fileEl);
      }
    }

    this.updateFileListVisibility();
    if (validFiles.length > 0) {
      this.addMessage('user', `<div class="akz-uploaded-file"><i class="fas fa-file-arrow-up"></i> 已上传 <strong>${validFiles.length}</strong> 个文档文件</div>`);

      if (this.currentStep === 1 && this.stepPhase === 'awaiting_input') {
        const fileNames = validFiles.map(f => f.name).join('、');
        this.stepData[1] = `用户上传了科技成果相关文档：${fileNames}`;
        setTimeout(() => {
          this.startAnalysis(this.stepData[1], false);
        }, 500);
      }
    }
  },

  getFileIcon: function(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
      jpg: 'fas fa-file-image', jpeg: 'fas fa-file-image', png: 'fas fa-file-image',
      gif: 'fas fa-file-image', bmp: 'fas fa-file-image', webp: 'fas fa-file-image',
      ppt: 'fas fa-file-powerpoint', pptx: 'fas fa-file-powerpoint',
      pdf: 'fas fa-file-pdf',
      doc: 'fas fa-file-word', docx: 'fas fa-file-word'
    };
    return icons[ext] || 'fas fa-file';
  },

  updateFileListVisibility: function() {
    const fileList = document.getElementById('akz-file-list');
    const uploadHint = document.getElementById('akz-file-upload-hint');
    if (!fileList || !uploadHint) return;
    if (fileList.children.length > 0) {
      fileList.style.display = 'flex';
      uploadHint.style.display = 'none';
    } else {
      fileList.style.display = 'none';
      uploadHint.style.display = 'flex';
    }
  },

  sendMessage: function() {
    const inputField = document.getElementById('akz-unified-input');
    const message = inputField.value.trim();

    if (!message) return;

    if (typeof TokenManager !== 'undefined' && !TokenManager.checkBalance()) {
      return;
    }

    this.addMessage('user', message);
    inputField.value = '';

    if (typeof TokenManager !== 'undefined') {
      const tokenAmount = Math.floor(Math.random() * 12000) + 5000;
      TokenManager.recordUsage(this.selectedModel || 'GPT-4o', 'AI科转', tokenAmount);
    }

    if (this.stepPhase === 'awaiting_modification') {
      this.stepData[this.currentStep] = message;
      this.startAnalysis(message, true);
    } else if (this.stepPhase === 'reviewing') {
      this.stepData[this.currentStep] = message;
      this.startAnalysis(message, true);
    } else {
      this.stepData[this.currentStep] = message;
      this.startAnalysis(message, false);
    }
  },

  startAnalysis: function(userMessage, isRevision) {
    this.stepPhase = 'analyzing';
    const meta = this.stepMeta[this.currentStep];
    this.showTyping();

    setTimeout(() => {
      this.hideTyping();
      const modelName = this.selectedModel || 'gpt-4o';
      const analysisText = isRevision
        ? `收到您的修改反馈。我会使用 <strong>${modelName}</strong> 重新分析并调整<strong>${meta.name}</strong>...`
        : `正在使用 <strong>${modelName}</strong> 分析您的需求。本次将调用「<strong>${meta.skill}</strong>」为您处理...`;
      this.addMessage('assistant', analysisText);

      if (!isRevision) {
        setTimeout(() => this.showConfirmationPanel(userMessage), 800);
      } else {
        setTimeout(() => this.startGeneration(userMessage, isRevision), 800);
      }
    }, 900);
  },

  showConfirmationPanel: function(userMessage) {
    this.stepPhase = 'confirming_params';
    const meta = this.stepMeta[this.currentStep];
    const params = this.getStepParameters(this.currentStep, userMessage);
    const intro = this.getConfirmationIntro(this.currentStep, userMessage);

    const panelHtml = `
      <div class="akz-confirmation-panel">
        <div class="akz-confirmation-header">
          <i class="fas fa-clipboard-list"></i>
          <span>${meta.artifactName}创作（待确认）</span>
          <button class="akz-panel-toggle" onclick="AKZChatAgent.togglePanel(this)">
            <i class="fas fa-chevron-up"></i>
          </button>
        </div>
        <div class="akz-confirmation-body">
          <div class="akz-confirmation-intro">${intro}</div>
          ${this.renderParameterGroups(params)}
          <div class="akz-confirmation-actions">
            <button class="btn-primary akz-btn-confirm-params" onclick="AKZChatAgent.confirmParameters('${this.escapeForAttr(userMessage)}')">
              <i class="fas fa-check"></i> 确认并开始生成
            </button>
          </div>
        </div>
      </div>
    `;
    this.addMessage('assistant', panelHtml);
  },

  getConfirmationIntro: function(step, message) {
    const intros = {
      1: `您提交了科技成果文档。系统将对文档进行<strong>智能解析</strong>，自动提取成果名称、核心技术、应用企业、经济数据、荣誉资质等信息颗粒，并进行结构映射、数据翻译和镜头语言分析。请确认以下分析与制作参数：`,
      2: `文档解析完成。现在开始创作<strong>视频脚本</strong>。请确认脚本参数：`,
      3: `镜头脚本完成。接下来生成<strong>视觉素材</strong>。请确认素材参数：`,
      4: `素材已就绪。现在将素材转化为<strong>短视频</strong>。请确认视频参数：`,
      5: `视频生成完成。最后进行<strong>后期合成</strong>。请确认后期参数：`
    };
    return intros[step] || `请确认以下${this.stepMeta[step].name}的相关参数：`;
  },

  getStepParameters: function(step, userMessage) {
    if (step === 1) return this.generateDocParseParams(userMessage);
    if (step === 2) return this.generateScriptParams(userMessage);
    if (step === 3) return this.generateMaterialParams(userMessage);
    if (step === 4) return this.generateVideoParams(userMessage);
    if (step === 5) return this.generatePostParams(userMessage);
    return [];
  },

  generateDocParseParams: function(userMessage) {
    return [
      {
        label: '成果所属领域？',
        name: 'field',
        options: [
          { value: 'new_material', label: '新材料', selected: this.matchField(userMessage, '材料') },
          { value: 'ai_bigdata', label: 'AI与大数据', selected: this.matchField(userMessage, '智能|AI|数据') },
          { value: 'new_energy', label: '新能源', selected: this.matchField(userMessage, '能源|电池|光伏') },
          { value: 'biomedical', label: '生物医药', selected: this.matchField(userMessage, '医疗|医药|生物') },
          { value: 'advanced_mfg', label: '先进制造', selected: this.matchField(userMessage, '制造|装备|机器人') },
          { value: 'agriculture', label: '现代农业', selected: this.matchField(userMessage, '农业|种植|养殖') }
        ]
      },
      {
        label: '展示目标？',
        name: 'goal',
        options: [
          { value: 'investor', label: '面向投资人（突出市场前景）', selected: this.matchField(userMessage, '投资|融资') },
          { value: 'exhibition', label: '展会展示（突出技术亮点）', selected: this.matchField(userMessage, '展会|展览|展示') },
          { value: 'promotion', label: '产品推广（突出应用价值）', selected: this.matchField(userMessage, '推广|产品|应用') },
          { value: 'academic', label: '学术交流（突出创新性）', selected: this.matchField(userMessage, '学术|论文|研究') }
        ]
      },
      {
        label: '视频时长？',
        name: 'duration',
        options: [
          { value: '1min', label: '约1分钟（快速展示）', selected: false },
          { value: '3min', label: '约3分钟（标准介绍）', selected: true },
          { value: '5min', label: '约5分钟（深度讲解）', selected: false }
        ]
      },
      {
        label: '视频比例？',
        name: 'ratio',
        options: [
          { value: '9:16', label: '9:16 竖屏（适合手机）', selected: true },
          { value: '16:9', label: '16:9 横屏（适合大屏）', selected: false }
        ]
      },
      {
        label: '分析粒度？',
        name: 'granularity',
        options: [
          { value: 'detailed', label: '详尽分析（全部信息颗粒）', selected: true },
          { value: 'focused', label: '聚焦核心（技术与市场为主）', selected: false }
        ]
      },
      {
        label: '数据呈现方式？',
        name: 'dataFormat',
        options: [
          { value: 'structured', label: '结构化报告（分类清晰）', selected: true },
          { value: 'narrative', label: '叙事型总结（故事化表达）', selected: false }
        ]
      },
      {
        label: '镜头语言风格？',
        name: 'visualLang',
        options: [
          { value: 'professional', label: '专业科技风（严谨权威）', selected: true },
          { value: 'commercial', label: '商业宣传风（突出价值）', selected: false },
          { value: 'educational', label: '科普教育风（通俗易懂）', selected: false }
        ]
      },
      {
        label: '还有其他要求吗？',
        name: 'additional',
        type: 'textarea',
        placeholder: '例如：需要展示专利证书、团队介绍、实验数据、应用案例等...'
      }
    ];
  },

  matchField: function(msg, pattern) {
    return new RegExp(pattern, 'i').test(msg);
  },


  generateScriptParams: function(userMessage) {
    return [
      {
        label: '脚本结构？',
        name: 'structure',
        options: [
          { value: 'problem_solution', label: '问题-方案（痛点→技术→解决）', selected: true },
          { value: 'story', label: '故事叙述（研发历程）', selected: false },
          { value: 'demo', label: '产品演示（功能展示为主）', selected: false },
          { value: 'interview', label: '专家讲解（人物主导）', selected: false }
        ]
      },
      {
        label: '旁白风格？',
        name: 'narration',
        options: [
          { value: 'professional_male', label: '专业男声', selected: true },
          { value: 'professional_female', label: '专业女声', selected: false },
          { value: 'warm_male', label: '亲切男声', selected: false },
          { value: 'elegant_female', label: '优雅女声', selected: false }
        ]
      },
      {
        label: '是否需要人物出镜？',
        name: 'host',
        options: [
          { value: 'digital_human', label: '数字人讲解', selected: true },
          { value: 'voice_only', label: '纯旁白+画面', selected: false }
        ]
      }
    ];
  },

  generateMaterialParams: function(userMessage) {
    return [
      {
        label: '视觉风格？',
        name: 'visualStyle',
        options: [
          { value: 'tech_futuristic', label: '科技未来风（蓝白配色）', selected: true },
          { value: 'clean_business', label: '简洁商务风', selected: false },
          { value: 'warm_natural', label: '自然温馨风', selected: false },
          { value: 'dark_tech', label: '深色科技风', selected: false }
        ]
      },
      {
        label: '画面比例侧重？',
        name: 'contentRatio',
        options: [
          { value: 'data_heavy', label: '数据图表为主', selected: false },
          { value: 'scene_heavy', label: '场景实拍为主', selected: false },
          { value: 'balanced', label: '图文均衡', selected: true }
        ]
      }
    ];
  },

  generateVideoParams: function(userMessage) {
    return [
      {
        label: '生成方式？',
        name: 'videoMethod',
        options: [
          { value: 'i2v', label: '图生视频（推荐）', selected: true },
          { value: 'motion', label: '动作迁移', selected: false },
          { value: 'effect', label: '特效合成', selected: false }
        ]
      },
      {
        label: '转场风格？',
        name: 'transition',
        options: [
          { value: 'smooth', label: '平滑过渡', selected: true },
          { value: 'dynamic', label: '动感切换', selected: false },
          { value: 'minimal', label: '简洁硬切', selected: false }
        ]
      },
      {
        label: '动态效果？',
        name: 'dynamicEffect',
        options: [
          { value: 'ken_burns', label: 'Ken Burns效果（缓慢推拉）', selected: true },
          { value: 'parallax', label: '视差滚动', selected: false },
          { value: 'static', label: '静态画面为主', selected: false }
        ]
      }
    ];
  },

  generatePostParams: function(userMessage) {
    return [
      {
        label: '背景音乐？',
        name: 'bgmStyle',
        options: [
          { value: 'corporate', label: '企业宣传风', selected: true },
          { value: 'tech', label: '科技电子风', selected: false },
          { value: 'inspiring', label: '励志进取风', selected: false },
          { value: 'ambient', label: '氛围舒缓风', selected: false }
        ]
      },
      {
        label: '字幕样式？',
        name: 'subtitleStyle',
        options: [
          { value: 'clean', label: '简洁白字', selected: true },
          { value: 'tech_style', label: '科技风格字幕', selected: false },
          { value: 'fancy', label: '动态字幕', selected: false }
        ]
      },
      {
        label: '输出格式？',
        name: 'outputFormat',
        options: [
          { value: '1080p_mp4', label: '1080p MP4（推荐）', selected: true },
          { value: '4k_mp4', label: '4K MP4', selected: false }
        ]
      }
    ];
  },

  renderParameterGroups: function(params) {
    return params.map((param, index) => {
      if (param.type === 'textarea') {
        return `
          <div class="akz-param-group">
            <div class="akz-param-label">${index + 1}. ${param.label}</div>
            <textarea class="akz-param-textarea" name="${param.name}" placeholder="${param.placeholder}"></textarea>
          </div>
        `;
      } else {
        const optionsHtml = param.options.map(opt => `
          <label class="akz-param-option">
            <input type="radio" name="${param.name}" value="${opt.value}" ${opt.selected ? 'checked' : ''}>
            <span>${opt.label}</span>
          </label>
        `).join('');
        return `
          <div class="akz-param-group">
            <div class="akz-param-label">${index + 1}. ${param.label}</div>
            <div class="akz-param-options">
              ${optionsHtml}
            </div>
          </div>
        `;
      }
    }).join('');
  },

  confirmParameters: function(userMessage) {
    const panels = document.querySelectorAll('.akz-confirmation-panel');
    const latestPanel = panels[panels.length - 1];
    if (!latestPanel) return;

    if (typeof TokenManager !== 'undefined' && !TokenManager.checkBalance()) {
      return;
    }

    const selectedParams = {};
    latestPanel.querySelectorAll('input[type="radio"]:checked').forEach(input => {
      selectedParams[input.name] = input.value;
    });
    latestPanel.querySelectorAll('textarea').forEach(textarea => {
      if (textarea.value.trim()) {
        selectedParams[textarea.name] = textarea.value.trim();
      }
    });

    this.stepParams = this.stepParams || {};
    this.stepParams[this.currentStep] = selectedParams;

    this.addMessage('assistant', '<div class="akz-step-done"><i class="fas fa-check-circle"></i> 参数已确认</div>');
    this.startGeneration(userMessage, false);
  },

  togglePanel: function(button) {
    const panel = button.closest('.akz-confirmation-panel');
    if (!panel) return;
    const body = panel.querySelector('.akz-confirmation-body');
    const icon = button.querySelector('i');
    if (body.style.display === 'none') {
      body.style.display = 'block';
      icon.className = 'fas fa-chevron-up';
    } else {
      body.style.display = 'none';
      icon.className = 'fas fa-chevron-down';
    }
  },

  openPreviewDrawer: function(step) {
    const artifact = this.stepArtifacts[step];
    if (!artifact) return;

    const drawer = document.getElementById('akz-preview-drawer');
    const mask = document.getElementById('akz-preview-drawer-mask');
    const titleEl = document.getElementById('akz-preview-drawer-title-text');
    const bodyEl = document.getElementById('akz-preview-drawer-body');
    const footerEl = document.getElementById('akz-preview-drawer-footer');
    if (!drawer || !bodyEl) return;

    const isCurrentStep = step === this.currentStep;
    const isReviewing = this.stepPhase === 'reviewing' && isCurrentStep;
    const isLast = step >= this.totalSteps;
    const nextName = !isLast ? this.stepMeta[step + 1].name : null;

    if (titleEl) titleEl.textContent = `${artifact.title} - ${isReviewing ? '审阅确认' : '查看内容'}`;

    let contentHtml = '';

    if (artifact.summary) {
      contentHtml += `<div class="akz-drawer-summary"><i class="fas fa-quote-left"></i> ${artifact.summary}</div>`;
    }

    if (artifact.sections && artifact.sections.length) {
      contentHtml += '<div class="akz-drawer-section"><div class="akz-drawer-section-title"><i class="fas fa-list"></i> 关键参数</div><div class="akz-drawer-sections">';
      artifact.sections.forEach(s => {
        contentHtml += `<div class="akz-drawer-row"><span class="akz-drawer-key">${s.label}</span><span class="akz-drawer-val">${s.value}</span></div>`;
      });
      contentHtml += '</div></div>';
    }

    if (artifact.source === 'user_upload' && artifact.fileName) {
      const sizeKb = (artifact.fileSize / 1024).toFixed(1);
      contentHtml += `<div class="akz-drawer-section"><div class="akz-drawer-section-title"><i class="fas fa-file-arrow-up"></i> 上传文件</div><div class="akz-drawer-file"><i class="fas fa-file-lines"></i> ${artifact.fileName} <span class="akz-file-size">(${sizeKb} KB)</span></div></div>`;
    }

    if (artifact.preview) {
      contentHtml += `<div class="akz-drawer-section"><div class="akz-drawer-section-title"><i class="fas fa-file-alt"></i> ${artifact.title}详细内容</div><pre class="akz-drawer-preview">${this.escapeHtml(artifact.preview)}</pre></div>`;
    }

    bodyEl.innerHTML = contentHtml;

    if (footerEl) {
      if (isReviewing) {
        const isTextEditable = step === 2 || step === 3;
        const editButtonHtml = isTextEditable
          ? `<button class="btn-secondary akz-btn-edit-doc" onclick="AKZChatAgent.handleDrawerAction('edit')">
               <i class="fas fa-edit"></i> 编辑内容
             </button>`
          : '';
        const hintText = isTextEditable
          ? '如需调整，可编辑、上传修订版或输入修改意见。'
          : '如需调整，可上传修订版或输入修改意见。';
        const renderAction = isLast ? 'render' : 'confirm';

        footerEl.innerHTML = `
          <div class="akz-drawer-review-hint">
            ${isLast
              ? '全部制作流程已完成。检查无误后即可<strong>开始渲染</strong>最终成片。' + hintText
              : `确认无误后即可进入<strong>${nextName}</strong>阶段。` + hintText}
          </div>
          <div class="akz-drawer-actions">
            <button class="${isLast ? 'btn-primary akz-btn-render' : 'btn-primary akz-btn-confirm'}" onclick="AKZChatAgent.handleDrawerAction('${renderAction}')">
              ${isLast
                ? '<i class="fas fa-play"></i> 确认并开始渲染'
                : `<i class="fas fa-check"></i> 确认并进入${nextName}`}
            </button>
            ${editButtonHtml}
            <button class="btn-secondary akz-btn-upload" onclick="AKZChatAgent.handleDrawerAction('upload')">
              <i class="fas fa-upload"></i> 上传修订版
            </button>
            <button class="btn-secondary akz-btn-modify" onclick="AKZChatAgent.handleDrawerAction('modify')">
              <i class="fas fa-pen"></i> 修改意见
            </button>
          </div>
        `;
        footerEl.style.display = 'block';
      } else {
        footerEl.innerHTML = '';
        footerEl.style.display = 'none';
      }
    }

    drawer.classList.add('open');
    if (mask) mask.classList.add('open');
  },

  handleDrawerAction: function(action) {
    if (action === 'confirm') {
      this.closePreviewDrawer();
      setTimeout(() => this.confirmStep(), 300);
    } else if (action === 'render') {
      this.closePreviewDrawer();
      setTimeout(() => this.startRendering(), 300);
    } else if (action === 'upload') {
      this.triggerUpload();
    } else if (action === 'edit') {
      this.enterEditMode();
    } else if (action === 'modify') {
      this.closePreviewDrawer();
      setTimeout(() => this.focusInputForModification(), 300);
    }
  },

  startRendering: function() {
    this.stepPhase = 'rendering';
    this.addMessage('assistant', `
      <div class="akz-render-start">
        <div class="akz-render-title"><i class="fas fa-play-circle"></i> 开始渲染最终成片</div>
        <div class="akz-render-status" id="akz-render-status">正在初始化渲染引擎...</div>
        <div class="progress-bar">
          <div class="progress-fill" id="akz-render-bar" style="width:0%"></div>
        </div>
        <div class="akz-render-info" id="akz-render-info"></div>
      </div>
    `);
    this.simulateRender();
  },

  simulateRender: function() {
    const steps = [
      { pct: 5, status: '正在合成视频片段...', info: '加载素材与镜头' },
      { pct: 15, status: '正在生成旁白配音...', info: 'TTS合成讲解语音' },
      { pct: 30, status: '正在添加字幕...', info: '渲染中文字幕 · 时间轴对齐' },
      { pct: 50, status: '正在调色...', info: '应用科技风格LUT' },
      { pct: 65, status: '正在合成BGM...', info: '背景音乐混音' },
      { pct: 80, status: '正在编码输出...', info: 'H.264 · 1080p' },
      { pct: 95, status: '正在封装文件...', info: 'MP4容器 · 校验完整性' },
      { pct: 100, status: '渲染完成！', info: '/outputs/tech_video_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '/final.mp4' }
    ];

    let i = 0;
    const tick = () => {
      if (i >= steps.length) {
        this.addMessage('assistant', `
          <div class="akz-render-done">
            <i class="fas fa-check-circle"></i>
            <strong>渲染成功！</strong>
            <div class="akz-render-output">输出文件：${steps[steps.length-1].info}</div>
            <button class="btn-primary" style="margin-top:10px" onclick="alert('文件已保存到：${steps[steps.length-1].info}')">
              <i class="fas fa-download"></i> 下载成片
            </button>
          </div>
        `);
        return;
      }
      const s = steps[i];
      const statusEl = document.getElementById('akz-render-status');
      const barEl = document.getElementById('akz-render-bar');
      const infoEl = document.getElementById('akz-render-info');
      if (statusEl) statusEl.textContent = s.status;
      if (barEl) barEl.style.width = s.pct + '%';
      if (infoEl) infoEl.textContent = s.info;
      i++;
      setTimeout(tick, 1200);
    };
    tick();
  },

  enterEditMode: function() {
    if (this.currentStep !== 2 && this.currentStep !== 3) return;

    const previewEl = document.querySelector('.akz-drawer-preview');
    const sectionEl = previewEl ? previewEl.closest('.akz-drawer-section') : null;
    if (!previewEl || !sectionEl) return;

    const currentText = previewEl.textContent;
    const step = this.currentStep;

    previewEl.style.display = 'none';

    const editArea = document.createElement('div');
    editArea.className = 'akz-drawer-edit-area';
    editArea.innerHTML = `
      <textarea class="akz-drawer-editor" id="akz-drawer-editor">${this.escapeHtml(currentText)}</textarea>
      <div class="akz-drawer-edit-actions">
        <button class="btn-primary akz-btn-save-edit" onclick="AKZChatAgent.saveEdit(${step})">
          <i class="fas fa-save"></i> 保存修改
        </button>
        <button class="btn-secondary akz-btn-cancel-edit" onclick="AKZChatAgent.cancelEdit(${step})">
          <i class="fas fa-times"></i> 取消
        </button>
      </div>
    `;
    sectionEl.appendChild(editArea);

    const editBtn = document.querySelector('.akz-btn-edit-doc');
    if (editBtn) {
      editBtn.style.borderColor = '#6366f1';
      editBtn.style.color = '#4f46e5';
      editBtn.style.background = 'rgba(99, 102, 241, 0.08)';
      editBtn.querySelector('i').className = 'fas fa-edit';
      editBtn.style.pointerEvents = 'none';
    }
  },

  saveEdit: function(step) {
    const editor = document.getElementById('akz-drawer-editor');
    if (!editor) return;
    const newContent = editor.value;

    const artifact = this.stepArtifacts[step];
    if (artifact) {
      artifact.preview = newContent;
      artifact.source = 'user_upload';
      artifact.fileName = artifact.fileName || '（用户内联编辑）';
      artifact.summary = `用户已通过内联编辑修改内容，后续步骤将基于修改后的版本继续。`;
    }

    const editArea = document.querySelector('.akz-drawer-edit-area');
    if (editArea) editArea.remove();

    const editBtn = document.querySelector('.akz-btn-edit-doc');
    if (editBtn) {
      editBtn.style.pointerEvents = '';
      editBtn.style.borderColor = '#334155';
      editBtn.style.color = '#10182D';
      editBtn.style.background = '#162D52';
      editBtn.querySelector('i').className = 'fas fa-edit';
    }

    const bodyEl = document.getElementById('akz-preview-drawer-body');
    const previewEl = bodyEl ? bodyEl.querySelector('.akz-drawer-preview') : null;
    if (previewEl) {
      previewEl.textContent = newContent;
      previewEl.style.display = '';
    }

    this.renderArtifact(step, artifact);
  },

  cancelEdit: function(step) {
    const editArea = document.querySelector('.akz-drawer-edit-area');
    if (editArea) editArea.remove();

    const previewEl = document.querySelector('.akz-drawer-preview');
    if (previewEl) previewEl.style.display = '';

    const editBtn = document.querySelector('.akz-btn-edit-doc');
    if (editBtn) {
      editBtn.style.pointerEvents = '';
      editBtn.style.borderColor = '#334155';
      editBtn.style.color = '#10182D';
      editBtn.style.background = '#162D52';
      editBtn.querySelector('i').className = 'fas fa-edit';
    }
  },

  closePreviewDrawer: function() {
    const drawer = document.getElementById('akz-preview-drawer');
    const mask = document.getElementById('akz-preview-drawer-mask');
    if (drawer) drawer.classList.remove('open');
    if (mask) mask.classList.remove('open');
  },

  escapeForAttr: function(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  startGeneration: function(userMessage, isRevision) {
    this.stepPhase = 'generating';
    const meta = this.stepMeta[this.currentStep];

    const modelName = this.selectedModel || 'gpt-4o';
    this.addMessage('assistant', `<div class="akz-skill-badge"><i class="fas fa-bolt"></i> 正在使用 <strong>${modelName}</strong> 调用 <strong>${meta.skill}</strong> 生成${meta.artifactName}...</div>`);
    this.showTyping();

    setTimeout(() => {
      this.hideTyping();
      const artifact = this.generateArtifact(this.currentStep, userMessage);
      this.stepArtifacts[this.currentStep] = artifact;
      this.renderArtifact(this.currentStep, artifact);
      this.enterReview();
    }, 1800);
  },

  enterReview: function() {
    this.stepPhase = 'reviewing';
    const meta = this.stepMeta[this.currentStep];

    const hintHtml = `
      <div class="akz-review-hint">
        <i class="fas fa-clipboard-check"></i>
        <span>${meta.artifactName}已生成，请在右侧抽屉审阅并确认下一步操作</span>
        <button class="akz-btn-open-drawer" onclick="AKZChatAgent.openPreviewDrawer(${this.currentStep})">
          <i class="fas fa-external-link-alt"></i> 打开审阅抽屉
        </button>
      </div>
    `;
    this.addMessage('assistant', hintHtml);
    this.updateInputPlaceholder();

    setTimeout(() => this.openPreviewDrawer(this.currentStep), 400);
  },

  focusInputForModification: function() {
    this.stepPhase = 'awaiting_modification';
    this.updateInputPlaceholder();
    const inputField = document.getElementById('akz-unified-input');
    if (inputField) inputField.focus();
    this.addMessage('assistant', '好的，请在下方输入您对当前产出物的修改意见，我会重新生成。');
  },

  triggerUpload: function() {
    let fileInput = document.getElementById('akz-artifact-upload-input');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'akz-artifact-upload-input';
      fileInput.accept = '.txt,.md,.json,.docx,.pdf,.jpg,.jpeg,.png,.mp4,.mov,.mp3,.wav';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      fileInput.addEventListener('change', e => this.handleUpload(e));
    }
    fileInput.value = '';
    fileInput.click();
  },

  handleUpload: function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const meta = this.stepMeta[this.currentStep];
    const step = this.currentStep;
    const self = this;

    const sizeKb = (file.size / 1024).toFixed(1);
    this.addMessage('user', `<div class="akz-uploaded-file"><i class="fas fa-file-arrow-up"></i> 已上传修订版：<strong>${file.name}</strong> <span class="akz-file-size">(${sizeKb} KB)</span></div>`);

    this.closePreviewDrawer();

    const isTextFile = /\.(txt|md|json|csv|log|xml|yml|yaml)$/i.test(file.name);
    const readFileContent = (callback) => {
      if (isTextFile) {
        const reader = new FileReader();
        reader.onload = e => callback(e.target.result || '');
        reader.onerror = () => callback('');
        reader.readAsText(file);
      } else {
        callback('');
      }
    };

    readFileContent(fileContent => {
      const artifact = {
        title: `${meta.artifactName}（用户修订版）`,
        source: 'user_upload',
        fileName: file.name,
        fileSize: file.size,
        summary: `已采用用户上传的 ${file.name} 作为本步骤最终版本，后续步骤将基于该文件继续。`,
        sections: [
          { label: '文件名', value: file.name },
          { label: '文件大小', value: sizeKb + ' KB' },
          { label: '文件类型', value: file.type || this.getFileExt(file.name) },
          { label: '上传时间', value: new Date().toLocaleString('zh-CN') },
          { label: '状态', value: '已采用为本步骤最终版本' }
        ],
        preview: fileContent || `[${file.name}]\n\n此文件为非文本格式，无法在此预览具体内容。\n\n文件大小：${sizeKb} KB\n\n系统会将该文件作为本步骤的最终版本，后续步骤将基于此继续。`
      };
      this.stepArtifacts[step] = artifact;
      this.showTyping();
      setTimeout(() => {
        this.hideTyping();
        this.addMessage('assistant', `已收到您的修订版 <strong>${file.name}</strong>，请在右侧抽屉中查看内容并确认后续操作。`);
        this.stepPhase = 'reviewing';
        setTimeout(() => self.openPreviewDrawer(step), 300);
      }, 900);
    });
  },

  getFileExt: function(name) {
    const match = /\.([a-zA-Z0-9]+)$/.exec(name || '');
    return match ? match[1].toUpperCase() : '未知';
  },

  confirmStep: function() {
    const meta = this.stepMeta[this.currentStep];
    this.addMessage('assistant', `<div class="akz-step-done"><i class="fas fa-check-circle"></i> <strong>${meta.name}</strong> 已确认。</div>`);
    this.proceedToNextStep();
  },

  updateInputPlaceholder: function() {
    const inputField = document.getElementById('akz-unified-input');
    if (!inputField) return;
    const placeholders = {
      awaiting_input: '描述您的科技成果或回答当前阶段的问题...',
      reviewing: '如需调整，可直接在此输入修改意见后发送...',
      awaiting_modification: '请输入具体的修改意见，我会重新生成...'
    };
    inputField.placeholder = placeholders[this.stepPhase] || placeholders.awaiting_input;
  },

  addMessage: function(role, content) {
    const messagesContainer = document.getElementById('akz-unified-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `akz-message akz-message-${role}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'akz-message-avatar';
    avatarDiv.innerHTML = role === 'assistant'
      ? '<i class="fas fa-flask"></i>'
      : '<i class="fas fa-user"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'akz-message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'akz-message-text';
    textDiv.innerHTML = content;

    contentDiv.appendChild(textDiv);
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.messages.push({ role, content });
  },

  showTyping: function() {
    const messagesContainer = document.getElementById('akz-unified-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'akz-message akz-message-assistant';
    typingDiv.id = 'akz-unified-typing';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'akz-message-avatar';
    avatarDiv.innerHTML = '<i class="fas fa-flask"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'akz-message-content';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'akz-message-text';
    typingIndicator.innerHTML = `
      <div class="akz-message-typing">
        <div class="akz-typing-dot"></div>
        <div class="akz-typing-dot"></div>
        <div class="akz-typing-dot"></div>
      </div>
    `;

    contentDiv.appendChild(typingIndicator);
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  hideTyping: function() {
    const typingIndicator = document.getElementById('akz-unified-typing');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  },

  proceedToNextStep: function() {
    if (this.currentStep >= this.totalSteps) {
      this.stepPhase = 'completed';
      this.addMessage('assistant', `
🎉 <strong>恭喜！所有制作流程已完成！</strong>

您的科技成果转化短视频已经准备就绪，包括：
✓ 文档解析与内容提炼
✓ 完整的视频脚本
✓ 精美的视觉素材
✓ 动态视频片段
✓ 专业旁白配音
✓ 后期合成

现在可以开始最终渲染了！
      `);
      this.updateProgress();
      return;
    }

    this.currentStep++;
    this.stepPhase = 'awaiting_input';
    this.updateProgress();
    this.addMessage('assistant', this.getStepIntroduction(this.currentStep));
    this.updateSuggestions(this.currentStep);
    this.updateInputPlaceholder();

    const prevArtifact = this.stepArtifacts[this.currentStep - 1];
    if (prevArtifact) {
      this.addMessage('assistant', `<div class="akz-context-note"><i class="fas fa-link"></i> 已加载上一步的<strong>${this.stepMeta[this.currentStep - 1].artifactName}</strong>作为本阶段的输入基础。</div>`);
    }

    if (this.currentStep >= 2 && this.currentStep <= 5) {
      setTimeout(() => {
        this.autoGenerateNextStepConfirmation();
      }, 800);
    }
  },

  autoGenerateNextStepConfirmation: function() {
    let defaultMessage = '';

    if (this.currentStep === 2) {
      defaultMessage = '使用问题-方案结构，专业男声旁白，结合数字人讲解。';
    } else if (this.currentStep === 3) {
      defaultMessage = '科技未来风，图文均衡，使用自有AI引擎生成素材。';
    } else if (this.currentStep === 4) {
      defaultMessage = '图生视频方式，使用平滑过渡和Ken Burns效果。';
    } else if (this.currentStep === 5) {
      defaultMessage = '企业宣传风背景音乐，简洁白字字幕，科技风格调色，输出1080p MP4格式。';
    }

    this.addMessage('assistant', `<div class="akz-auto-hint"><i class="fas fa-magic"></i> 我已根据上一步的内容，为您准备了推荐的默认参数配置。您可以直接确认使用，或者根据需要进行调整。</div>`);

    setTimeout(() => {
      this.showConfirmationPanel(defaultMessage);
    }, 500);
  },

  generateArtifact: function(step, userMessage) {
    const generators = {
      1: () => this.buildDocParseArtifact(userMessage),
      2: () => this.buildScriptArtifact(userMessage),
      3: () => this.buildMaterialArtifact(userMessage),
      4: () => this.buildVideoArtifact(userMessage),
      5: () => this.buildPostArtifact(userMessage)
    };
    const build = generators[step];
    return build ? build() : { title: '产出物', source: 'ai', summary: '已生成' };
  },

  buildDocParseArtifact: function(message) {
    const field = this.extractField(message);
    const goal = this.extractGoal(message);
    const duration = this.extractDuration(message);
    const visualLang = this.extractVisualLang(message);

    return {
      title: '文档解析报告',
      source: 'ai',
      summary: `已完成文档上传与智能解析，共提取 15+ 项信息颗粒，涵盖「${field}」领域科技成果`,
      sections: [
        { label: '成果名称', value: this.extractAchievementName(message) },
        { label: '所属领域', value: field },
        { label: '文档类型', value: '包含文字、图片、数据图表等内容' },
        { label: '核心技术', value: this.extractCoreTech(message) },
        { label: '应用企业/场景', value: this.extractApplication(message) },
        { label: '经济数据', value: '已提取相关市场与财务指标' },
        { label: '荣誉资质', value: '已提取专利、奖项等资质信息' },
        { label: '创新指数', value: '高（具备显著的技术创新性）' },
        { label: '场景映射', value: '6 个场景（开场→痛点→方案→亮点→应用→收尾）' },
        { label: '镜头语言风格', value: visualLang },
        { label: '视频时长建议', value: duration }
      ],
      preview: `═══════════════════════════════════\n  科技成果文档解析报告\n═══════════════════════════════════\n\n【文档解析】\n• 成果名称：${this.extractAchievementName(message)}\n• 所属领域：${field}\n• 核心技术：${this.extractCoreTech(message)}\n• 应用企业/场景：${this.extractApplication(message)}\n• 经济数据：已完成关键指标提取\n• 荣誉资质：已完成专利与奖项梳理\n\n【结构映射】\n• 将文档内容映射为视频场景：\n  场景1（开场）→ 成果背景引入\n  场景2（痛点）→ 行业需求与技术挑战\n  场景3（方案）→ 核心技术原理展示\n  场景4（亮点）→ 性能数据与对比优势\n  场景5（应用）→ 实际落地案例\n  场景6（收尾）→ 市场前景与联系方式\n• 叙事主线：以"${goal}"为导向\n\n【数据翻译】\n• 将专业技术指标转化为大众可理解的视频语言\n• 关键数据可视化方案已规划\n\n【镜头语言】\n• 风格定位：${visualLang}\n• 视觉基调：科技蓝 + 数据可视化\n• 推荐时长：${duration}\n\n═══════════════════════════════════\n以上信息颗粒将用于后续镜头脚本`
    };
  },

  buildScriptArtifact: function(message) {
    const structure = this.extractStructure(message);
    return {
      title: '视频脚本',
      source: 'ai',
      summary: `采用「${structure}」结构，约${this.extractDuration(message)}视频脚本`,
      sections: [
        { label: '脚本结构', value: structure },
        { label: '旁白风格', value: this.extractNarration(message) },
        { label: '出镜方式', value: this.extractHost(message) },
        { label: '预估段落', value: '5-8 个段落' },
        { label: '预估字数', value: '约 800-1200 字' }
      ],
      preview: `【视频脚本】\n\n[开场 15s]\n画面：科技感动态背景 + 标题文字\n旁白：在${this.extractField(message)}领域，一项革命性的技术正在改变行业格局...\n\n[痛点 20s]\n画面：数据图表 + 场景实拍\n旁白：传统技术面临的效率瓶颈与成本挑战...\n\n[技术方案 45s]\n画面：3D产品展示 + 工作原理动画\n旁白：我们的核心技术突破在于...\n\n[应用展示 60s]\n画面：实际应用场景 + 对比数据\n旁白：在实际应用中，该技术已经...\n\n[总结 15s]\n画面：团队合影 + 联系方式\n旁白：让我们携手共创科技未来...`
    };
  },

  buildMaterialArtifact: function(message) {
    const style = this.extractVisualStyle(message);
    return {
      title: '视觉素材',
      source: 'ai',
      summary: `${style} · 图文均衡布局`,
      sections: [
        { label: '视觉风格', value: style },
        { label: '配色方案', value: '科技蓝+白+深灰为主色调' },
        { label: '生成引擎', value: '自有AI引擎' },
        { label: '已生成资源', value: '背景模板 × 8 · 图标元素 × 20 · 数据图表 × 5' }
      ],
      preview: `[已生成素材列表]\n\n- 科技感动态背景（1920×1080）× 4\n- 数据图表模板（柱状图/折线图/饼图）× 5\n- 图标元素包（科技/创新/环保/医疗等）× 20\n- 文字排版模板 × 8\n- 转场动画预设 × 6`
    };
  },

  buildVideoArtifact: function(message) {
    const method = this.extractVideoMethod(message);
    return {
      title: '短视频片段',
      source: 'ai',
      summary: `${method} · ${this.extractDynamicEffect(message)}`,
      sections: [
        { label: '生成方式', value: method },
        { label: '动态效果', value: this.extractDynamicEffect(message) },
        { label: '转场风格', value: this.extractTransition(message) },
        { label: '已生成片段', value: '8-12 个场景片段' },
        { label: '总时长', value: `约 ${this.extractDuration(message)}` }
      ],
      preview: `[视频片段预览占位]\n\n场景1_开场.mp4  15s\n场景2_痛点.mp4  20s\n场景3_技术方案.mp4  45s\n场景4_应用展示.mp4  60s\n场景5_总结.mp4  15s`
    };
  },

  buildPostArtifact: function(message) {
    const prevSteps = this.stepArtifacts;
    const duration = this.extractDuration(message);

    return {
      title: '最终成片',
      source: 'ai',
      summary: `已完成全部5步制作流程，${this.extractBGMStyle(message)}配乐 + 科技风格调色`,
      sections: [
        { label: '片头', value: '科技感标题动画 · 3秒' },
        { label: '正片', value: `8-12个场景 · 总时长约${duration}` },
        { label: '旁白', value: this.extractNarration(message) || '专业配音' },
        { label: '背景音乐', value: this.extractBGMStyle(message) },
        { label: '字幕', value: '中文字幕 · 时间轴同步' },
        { label: '调色', value: '科技风格LUT' },
        { label: '片尾', value: '联系方式+二维码 · 5秒' },
        { label: '输出格式', value: '1080p · MP4 · H.264' },
        { label: '输出路径', value: '/outputs/tech_video_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '/final.mp4' }
      ],
      preview: `╔══════════════════════════════╗\n║     科技成果展示视频        ║\n║                            ║\n║   🎬 科技感动态片头         ║\n║   📊 数据可视化展示         ║\n║   🎯 核心技术解析           ║\n║   🌟 应用场景呈现           ║\n║                            ║\n║   🎵 BGM: ${this.extractBGMStyle(message)}       ║\n║                            ║\n║   1080p MP4 · ${duration}        ║\n╚══════════════════════════════╝\n\n以上为最终成片预览\n实际渲染后将输出完整视频文件`
    };
  },

  renderArtifact: function(step, artifact) {
    if (!artifact) return;
    const meta = this.stepMeta[step];
    const sourceLabel = artifact.source === 'user_upload'
      ? '<span class="akz-artifact-source user"><i class="fas fa-user"></i> 用户修订版</span>'
      : '<span class="akz-artifact-source ai"><i class="fas fa-robot"></i> AI 生成</span>';

    let sectionsHtml = '';
    if (artifact.sections && artifact.sections.length) {
      sectionsHtml = '<div class="akz-artifact-sections">' +
        artifact.sections.map(s => `<div class="akz-artifact-row"><span class="akz-artifact-key">${s.label}</span><span class="akz-artifact-val">${s.value}</span></div>`).join('') +
        '</div>';
    }

    let fileInfoHtml = '';
    if (artifact.source === 'user_upload' && artifact.fileName) {
      const sizeKb = (artifact.fileSize / 1024).toFixed(1);
      fileInfoHtml = `<div class="akz-artifact-file"><i class="fas fa-file-lines"></i> ${artifact.fileName} <span class="akz-file-size">(${sizeKb} KB)</span></div>`;
    }

    const previewHtml = artifact.preview
      ? `<div class="akz-artifact-preview">
           <button class="akz-artifact-preview-header" type="button" onclick="AKZChatAgent.openPreviewDrawer(${step})">
             <span><i class="fas fa-eye"></i> 内容预览</span>
             <i class="fas fa-arrow-right akz-preview-arrow"></i>
           </button>
         </div>`
      : '';

    const summaryHtml = artifact.summary ? `<div class="akz-artifact-summary">${artifact.summary}</div>` : '';

    const card = `
      <div class="akz-artifact-card">
        <div class="akz-artifact-header">
          <div class="akz-artifact-title"><i class="fas ${meta.icon}"></i> ${artifact.title}</div>
          ${sourceLabel}
        </div>
        ${summaryHtml}
        ${fileInfoHtml}
        ${sectionsHtml}
        ${previewHtml}
      </div>
    `;
    this.addMessage('assistant', card);
  },

  escapeHtml: function(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  goToStep: function(stepNum) {
    if (stepNum < 1 || stepNum > this.totalSteps) return;
    const meta = this.stepMeta[stepNum];
    const artifact = this.stepArtifacts[stepNum];
    if (artifact) {
      this.addMessage('assistant', `<div class="akz-context-note"><i class="fas fa-clock-rotate-left"></i> 回看 <strong>${meta.name}</strong> 的产出物：</div>`);
      this.renderArtifact(stepNum, artifact);
    } else {
      this.addMessage('assistant', `<div class="akz-context-note"><i class="fas fa-info-circle"></i> <strong>${meta.name}</strong> 尚未生成产出物。</div>`);
    }
  },

  updateProgress: function() {
    const steps = document.querySelectorAll('.akz-progress-step');
    steps.forEach((step, index) => {
      const stepNum = index + 1;
      const statusEl = step.querySelector('.akz-progress-step-status');

      if (stepNum < this.currentStep) {
        step.classList.remove('active');
        step.classList.add('completed');
        if (statusEl) statusEl.textContent = '已完成';
      } else if (stepNum === this.currentStep) {
        step.classList.remove('completed');
        step.classList.add('active');
        if (statusEl) statusEl.textContent = '进行中';
      } else {
        step.classList.remove('active', 'completed');
        if (statusEl) statusEl.textContent = '待开始';
      }
    });

    const phaseEl = document.getElementById('akz-current-phase');
    if (phaseEl) {
      const phaseNames = ['', '文档解析', '镜头脚本', '素材生成', '视频生成', '后期合成'];
      phaseEl.textContent = `当前阶段：${phaseNames[this.currentStep]}`;
    }
  },

  getStepIntroduction: function(step) {
    const introductions = {
      1: `现在让我们从<strong>文档解析</strong>开始。请上传您的科技成果相关文档（支持图片、PPT、PDF、Word格式），或直接描述您要展示的科技成果。

系统将对文档进行深度分析：
• 提取成果名称、核心技术、应用企业、经济数据、荣誉资质等全部信息颗粒
• 进行结构映射与数据翻译
• 生成镜头语言建议

以上流程将自动完成，您只需确认分析维度即可。`,
      2: `文档解析完成！现在进入<strong>镜头脚本</strong>阶段。

请告诉我您对视频脚本的偏好：
• 脚本结构（问题-方案型 / 故事叙述型 / 产品演示型）
• 旁白风格（专业严谨 / 通俗易懂 / 激情澎湃）
• 是否需要数字人出镜讲解`,
      3: `镜头脚本完成！现在进入<strong>素材生成</strong>阶段。

请告诉我视觉风格偏好：
• 视觉风格（科技未来风 / 简洁商务风 / 自然温馨风）
• 数据展示方式（图表动画 / 信息图 / 3D演示）
• 系统将使用自有AI引擎自动生成素材`,
      4: `素材准备就绪！现在进入<strong>视频生成</strong>阶段。

请告诉我视频制作偏好：
• 生成方式（图生视频 / 动作迁移 / 特效合成）
• 转场风格（平滑过渡 / 动感切换 / 简洁硬切）
• 动态效果（Ken Burns缓慢推拉 / 视差滚动 / 静态画面）`,
      5: `视频片段生成完成！最后进入<strong>后期合成</strong>阶段。

请告诉我后期处理需求：
• 背景音乐风格（企业宣传风 / 科技电子风 / 励志进取风）
• 字幕样式（简洁白字 / 科技风格 / 动态字幕）
• 输出格式（1080p / 4K）`
    };

    return introductions[step] || '';
  },

  updateSuggestions: function(step) {
    const suggestionsContainer = document.getElementById('akz-suggestion-chips');
    if (!suggestionsContainer) return;

    const suggestions = {
      1: [
        { text: '新材料成果展示', value: '我有一项新材料领域的科研成果，研发了一种高强度的碳纤维复合材料，想在展会上用短视频展示其性能优势和应用前景。' },
        { text: '智能农业系统', value: '我们团队研发出了一套智能农业监测系统，通过AI视觉识别病虫害，需要制作一个3分钟的产品介绍短视频。' },
        { text: '新能源电池技术', value: '我有一份关于新型电池技术的专利文档，能量密度提升了40%，想制作一个短视频向投资人展示技术优势。' },
        { text: '医疗AI系统推广', value: '我们开发了一套医疗影像AI辅助诊断系统，已通过临床验证，需要制作短视频向医院推广。' }
      ],
      2: [
        { text: '问题-方案型', value: '使用问题-方案结构，先展示行业痛点，再引出技术方案，专业男声旁白，数字人讲解。' },
        { text: '故事叙述型', value: '以研发故事为主线，从灵感来源到技术突破，亲切男声旁白，纯画面+配音。' },
        { text: '产品演示型', value: '以产品功能展示为主，直观呈现技术优势，优雅女声旁白，数字人出镜。' }
      ],
      3: [
        { text: '科技未来风', value: '科技未来风，蓝白配色为主，数据图表展示关键指标。' },
        { text: '简洁商务风', value: '简洁商务风，白色为主色调，信息图+场景实拍。' },
        { text: '深色科技风', value: '深色科技风，深蓝+霓虹色，3D产品演示。' }
      ],
      4: [
        { text: '平滑图生视频', value: '图生视频方式，使用平滑过渡和Ken Burns效果，自然流畅的视觉体验。' },
        { text: '动感展示', value: '图生视频+特效合成，动感切换转场，视差滚动效果，富有视觉冲击力。' },
        { text: '简洁静态', value: '图生视频为主，简洁硬切转场，静态画面配合旁白，突出内容本身。' }
      ],
      5: [
        { text: '企业宣传级', value: '企业宣传风背景音乐，简洁白字字幕居中，科技风格调色，输出1080p MP4格式。' },
        { text: '展会展示版', value: '科技电子风BGM，动态科技感字幕，高对比度调色，适合大屏展示，输出4K MP4。' },
        { text: '社交媒体版', value: '轻快进取风BGM，动态字幕，明亮调色，适合手机竖屏观看，输出1080p MP4。' }
      ]
    };

    const stepSuggestions = suggestions[step] || [];
    suggestionsContainer.innerHTML = stepSuggestions.map(s =>
      `<button class="akz-suggestion-chip" data-suggestion="${s.value}">${s.text}</button>`
    ).join('');

    const newChips = suggestionsContainer.querySelectorAll('.akz-suggestion-chip');
    const inputField = document.getElementById('akz-unified-input');
    newChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const suggestion = chip.getAttribute('data-suggestion');
        if (inputField) {
          inputField.value = suggestion;
          inputField.focus();
        }
      });
    });
  },

  clearChat: function() {
    const messagesContainer = document.getElementById('akz-unified-messages');
    if (!messagesContainer) return;

    const welcomeMessage = messagesContainer.querySelector('.akz-message-assistant');
    messagesContainer.innerHTML = '';
    if (welcomeMessage) {
      messagesContainer.appendChild(welcomeMessage);
    }

    this.messages = [];
    this.stepPhase = 'awaiting_input';
    this.updateInputPlaceholder();
  },

  // 辅助提取函数
  extractField: function(m) { if (/材料|碳纤维|复合/i.test(m)) return '新材料'; if (/智能|AI|数据|算法/i.test(m)) return 'AI与大数据'; if (/能源|电池|光伏|储能/i.test(m)) return '新能源'; if (/医疗|医药|生物|临床/i.test(m)) return '生物医药'; if (/制造|装备|机器人|自动化/i.test(m)) return '先进制造'; if (/农业|种植|养殖|农产品/i.test(m)) return '现代农业'; return '高新科技'; },
  extractGoal: function(m) { if (/投资|融资/i.test(m)) return '面向投资人'; if (/展会|展览/i.test(m)) return '展会展示'; if (/推广|产品|应用/i.test(m)) return '产品推广'; return '学术交流'; },
  extractDuration: function(m) { if (/1.*分钟|快速/i.test(m)) return '约1分钟'; if (/5.*分钟|深度/i.test(m)) return '约5分钟'; return '约3分钟'; },
  extractTarget: function(m) { if (/投资/i.test(m)) return '投资人'; if (/医院/i.test(m)) return '医疗机构'; if (/企业/i.test(m)) return '企业客户'; return '专业观众'; },
  extractHighlight: function(m) { if (/应用|场景/i.test(m)) return '应用场景展示'; if (/性能|对比/i.test(m)) return '性能优势对比'; return '技术突破创新'; },
  extractStructure: function(m) { if (/故事/i.test(m)) return '故事叙述型'; if (/演示|产品/i.test(m)) return '产品演示型'; return '问题-方案型'; },
  extractNarration: function(m) { if (/亲切|男/i.test(m)) return '亲切男声'; if (/优雅|女/i.test(m)) return '优雅女声'; if (/专业.*女/i.test(m)) return '专业女声'; return '专业男声'; },
  extractHost: function(m) { if (/纯旁白|配音|不出镜/i.test(m)) return '纯旁白+画面'; return '数字人讲解'; },
  extractVisualStyle: function(m) { if (/商务/i.test(m)) return '简洁商务风'; if (/深色|暗/i.test(m)) return '深色科技风'; if (/温馨|自然/i.test(m)) return '自然温馨风'; return '科技未来风'; },
  extractVideoMethod: function(m) { if (/动作迁移/i.test(m)) return '动作迁移'; if (/特效/i.test(m)) return '特效合成'; return '图生视频'; },
  extractDynamicEffect: function(m) { if (/视差/i.test(m)) return '视差滚动'; if (/静态/i.test(m)) return '静态画面'; return 'Ken Burns效果'; },
  extractTransition: function(m) { if (/动感/i.test(m)) return '动感切换'; if (/硬切|简洁/i.test(m)) return '简洁硬切'; return '平滑过渡'; },
  extractService: function(m) { return '自有AI引擎'; },
  extractBGMStyle: function(m) { if (/科技.*电子|电子/i.test(m)) return '科技电子风'; if (/励志|进取/i.test(m)) return '励志进取风'; if (/舒缓|氛围/i.test(m)) return '氛围舒缓风'; return '企业宣传风'; },
  extractAchievementName: function(m) { if (/碳纤维|复合/i.test(m)) return '高强度碳纤维复合材料'; if (/监测|农业/i.test(m)) return 'AI视觉农业监测系统'; if (/电池|储能|能量/i.test(m)) return '新型高能量密度电池技术'; if (/医疗|影像|诊断/i.test(m)) return '医疗影像AI辅助诊断系统'; if (/制造|装备|机器人/i.test(m)) return '智能制造成套装备'; return '待确认的科技成果'; },
  extractCoreTech: function(m) { if (/碳纤维|复合/i.test(m)) return '纳米增强碳纤维编织工艺'; if (/AI|视觉|识别/i.test(m)) return '深度学习视觉识别算法'; if (/电池|能量密度/i.test(m)) return '固态电解质界面优化技术'; if (/医疗|影像/i.test(m)) return '多模态医学影像融合分析引擎'; if (/制造|机器人/i.test(m)) return '自适应柔性装配系统'; return '待提取的核心技术'; },
  extractApplication: function(m) { if (/碳纤维|航空/i.test(m)) return '航空航天 / 新能源汽车'; if (/农业/i.test(m)) return '智慧农业示范基地'; if (/电池|新能源/i.test(m)) return '新能源汽车 / 储能电站'; if (/医疗|医院/i.test(m)) return '三甲医院影像科 / 体检中心'; return '多行业应用场景'; },
  extractVisualLang: function(m) { if (/商业|宣传/i.test(m)) return '商业宣传风'; if (/科普|教育/i.test(m)) return '科普教育风'; return '专业科技风'; }
};

// ===== Token消耗管理模块 =====
const TokenManager = {
  STORAGE_KEY: 'aurora_token_data',
  QUOTA_LIMIT: 9999000, // 默认500token额度 = ¥0.5 (用于测试余额不足)
  TOKEN_TO_MONEY_RATE: 1000, // 1000 tokens = ¥1

  // 将tokens转换为金额
  tokensToMoney: function(tokens) {
    return (tokens / this.TOKEN_TO_MONEY_RATE).toFixed(2);
  },

  // 格式化金额显示
  formatMoney: function(tokens) {
    return '¥' + this.tokensToMoney(tokens);
  },

  // 格式化数字
  formatNumber: function(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // 初始化Token数据
  init: function() {
    let data = this.getData();
    if (!data) {
      data = this.createEmptyData();
      this.saveData(data);
    } else if (data.quotaLimit < this.QUOTA_LIMIT) {
      data.quotaLimit = this.QUOTA_LIMIT;
      data.totalTokens = 0;
      data.todayTokens = 0;
      data.monthlyTokens = 0;
      data.history = [];
      data.byModel = {};
      data.byModule = {};
      data.callCount = { byModel: {}, byModule: {} };
      this.saveData(data);
    }
    this.refreshDashboard();
    this.bindEvents();
  },

  // 创建空数据结构
  createEmptyData: function() {
    return {
      totalTokens: 0,
      todayTokens: 0,
      monthlyTokens: 0,
      quotaLimit: this.QUOTA_LIMIT,
      lastResetDate: new Date().toISOString().split('T')[0],
      lastResetMonth: new Date().toISOString().slice(0, 7),
      history: [],
      byModel: {},
      byModule: {},
      callCount: { byModel: {}, byModule: {} }
    };
  },

  // 从localStorage获取数据
  getData: function() {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (!json) return null;
      const data = JSON.parse(json);

      // 检查是否需要重置今日/本月数据
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      if (data.lastResetDate !== today) {
        data.todayTokens = 0;
        data.lastResetDate = today;
      }

      if (data.lastResetMonth !== thisMonth) {
        data.monthlyTokens = 0;
        data.lastResetMonth = thisMonth;
      }

      return data;
    } catch (e) {
      console.error('读取Token数据失败:', e);
      return null;
    }
  },

  // 保存数据到localStorage
  saveData: function(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('保存Token数据失败:', e);
    }
  },

  // 检查余额是否充足（至少1元）
  checkBalance: function() {
    const data = this.getData() || this.createEmptyData();
    const remaining = Math.max(0, data.quotaLimit - data.totalTokens);
    const remainingMoney = remaining / this.TOKEN_TO_MONEY_RATE;

    if (remainingMoney < 1) {
      alert('账户余额不足1元，无法生成任务。请充值后再试。');
      return false;
    }
    return true;
  },

  // 记录Token消耗
  recordUsage: function(model, module, tokens) {
    const data = this.getData() || this.createEmptyData();

    // 更新总计
    data.totalTokens += tokens;
    data.todayTokens += tokens;
    data.monthlyTokens += tokens;

    // 更新按模型分类
    data.byModel[model] = (data.byModel[model] || 0) + tokens;
    data.callCount.byModel[model] = (data.callCount.byModel[model] || 0) + 1;

    // 更新按模块分类
    data.byModule[module] = (data.byModule[module] || 0) + tokens;
    data.callCount.byModule[module] = (data.callCount.byModule[module] || 0) + 1;

    // 添加历史记录
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    data.history.unshift({
      time: timeStr,
      model: model,
      module: module,
      tokens: tokens,
      timestamp: now.getTime()
    });

    // 只保留最近100条记录
    if (data.history.length > 100) {
      data.history = data.history.slice(0, 100);
    }

    this.saveData(data);
    this.refreshDashboard();
  },

  // 刷新仪表板
  refreshDashboard: function() {
    const data = this.getData() || this.createEmptyData();

    // 更新头部余额显示
    const headerBalance = document.getElementById('header-token-balance');
    if (headerBalance) {
      const remaining = Math.max(0, data.quotaLimit - data.totalTokens);
      headerBalance.textContent = this.formatMoney(remaining);
    }

    // 更新历史记录
    this.renderHistory(data);
  },

  // 渲染历史记录
  renderHistory: function(data) {
    const container = document.getElementById('tk-history-list');
    if (!container) return;

    if (data.history.length === 0) {
      container.innerHTML = `
        <div class="tk-empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无消耗记录</p>
        </div>
      `;
      return;
    }

    let html = '';
    data.history.forEach(item => {
      const iconColors = {
        'GPT-4o': 'bg-green-50 text-green-500',
        'GPT-4 Turbo': 'bg-green-50 text-green-500',
        'Claude 3 Opus': 'bg-purple-50 text-purple-500',
        'Claude 3 Sonnet': 'bg-purple-50 text-purple-500',
        'DeepSeek Chat': 'bg-blue-50 text-blue-500',
        'Qwen Max': 'bg-orange-50 text-orange-500',
        'Moonshot v1': 'bg-pink-50 text-pink-500'
      };

      const iconColor = iconColors[item.model] || 'bg-gray-50 text-gray-500';

      html += `
        <div class="tk-history-item">
          <div class="tk-history-left">
            <div class="tk-history-icon ${iconColor}">
              <i class="fas fa-brain"></i>
            </div>
            <div class="tk-history-info">
              <div class="tk-history-model">${item.model}</div>
              <div class="tk-history-meta">
                <span><i class="fas fa-clock"></i> ${item.time}</span>
              </div>
            </div>
          </div>
          <div class="tk-history-tokens">${this.formatMoney(item.tokens)}</div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  // 充值：设置配额并清空消费记录
  recharge: function(quotaTokens) {
    const data = this.getData() || this.createEmptyData();
    data.quotaLimit = quotaTokens;
    data.totalTokens = 0;
    data.todayTokens = 0;
    data.monthlyTokens = 0;
    data.history = [];
    data.byModel = {};
    data.byModule = {};
    data.callCount = { byModel: {}, byModule: {} };
    this.saveData(data);
    this.refreshDashboard();
  },

  // 清除所有记录
  clearAll: function() {
    if (confirm('确定要清除所有消费记录吗？此操作不可撤销。')) {
      localStorage.removeItem(this.STORAGE_KEY);
      const data = this.createEmptyData();
      this.saveData(data);
      this.refreshDashboard();
      alert('记录已清除');
    }
  },

  // 绑定事件
  bindEvents: function() {
    const clearBtn = document.getElementById('tk-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAll());
    }

    // 绑定Token余额显示点击事件
    const balanceDisplay = document.getElementById('token-balance-display');
    if (balanceDisplay) {
      balanceDisplay.addEventListener('click', () => this.openDetailModal());
    }

    // 绑定模态框关闭事件
    const closeBtn = document.getElementById('close-token-detail');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDetailModal());
    }

    const closeFooterBtn = document.getElementById('close-token-detail-footer');
    if (closeFooterBtn) {
      closeFooterBtn.addEventListener('click', () => this.closeDetailModal());
    }

    // 点击遮罩层关闭
    const modalOverlay = document.getElementById('token-detail-modal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeDetailModal();
        }
      });
    }
  },

  // 打开详情模态框
  openDetailModal: function() {
    const modal = document.getElementById('token-detail-modal');
    if (modal) {
      modal.classList.add('open');
      this.refreshDashboard();
    }
  },

  // 关闭详情模态框
  closeDetailModal: function() {
    const modal = document.getElementById('token-detail-modal');
    if (modal) {
      modal.classList.remove('open');
    }
  }
};

// ===== 落地页 =====
function openGalleryLightbox(item) {
  const img = item.querySelector('img');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('gallery-lightbox-img');
  const caption = document.getElementById('gallery-lightbox-caption');
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = img ? img.src : '';
  lightboxImg.alt = img ? img.alt : '';
  if (caption) caption.textContent = img ? img.alt : '';
  lightbox.classList.add('open');
}

function closeGalleryLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) lightbox.classList.remove('open');
}

function initLanding() {
  const landingPage = document.getElementById('landing-page');
  if (!landingPage) return;

  landingPage.addEventListener('click', e => {
    const gallery = e.target.closest('.lp-template-card');
    if (gallery) {
      openGalleryLightbox(gallery);
    }
  });

  // 首页快捷入口：跳转到对应菜单
  landingPage.addEventListener('click', e => {
    const entry = e.target.closest('.lp-entry');
    if (!entry) return;
    const view = entry.dataset.lpView;
    const navItem = document.querySelector(`.sidebar-item[data-view="${view}"]`);
    if (navItem) navItem.click();
    const tab = entry.dataset.lpTab;
    if (tab) {
      const tabEl = document.querySelector(`.asset-tab[data-asset-tab="${tab}"]`);
      if (tabEl) tabEl.click();
    }
    const menu = entry.dataset.lpMenu;
    if (menu) {
      const menuEl = document.querySelector(`.create-top-tab[data-create-menu="${menu}"]`);
      if (menuEl) menuEl.click();
    }
  });

  const closeBtn = document.getElementById('gallery-lightbox-close');
  const backdrop = document.getElementById('gallery-lightbox-backdrop');
  if (closeBtn) closeBtn.addEventListener('click', closeGalleryLightbox);
  if (backdrop) backdrop.addEventListener('click', closeGalleryLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeGalleryLightbox();
  });
}

// 开放平台入口（跳转页暂未开发）
const openPlatformBtn = document.getElementById('open-platform-btn');
if (openPlatformBtn) {
  openPlatformBtn.addEventListener('click', () => {
    alert('开放平台正在建设中，敬请期待');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initLanding();
  DesignSpec.init();
  SDChatAgent.init();
  AKZChatAgent.init();
  TokenManager.init();

  // ===== 参考生视频交互 =====
  (function initRef2vid() {
    // 声音配置按钮切换
    document.querySelectorAll('.ref2vid-voice-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.ref2vid-voice-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      });
    });

    // 缩略图点击 → 添加 @标签
    document.querySelectorAll('.ref2vid-thumb-item').forEach(thumb => {
      thumb.addEventListener('click', function() {
        const label = this.querySelector('.ref2vid-thumb-label').textContent;
        const tagsContainer = document.getElementById('ref2vid-prompt-tags');
        const existing = tagsContainer.querySelectorAll('.ref2vid-tag');
        const tagText = '@' + label;
        for (const t of existing) { if (t.textContent === tagText) return; }
        const span = document.createElement('span');
        span.className = 'ref2vid-tag';
        span.textContent = tagText;
        tagsContainer.appendChild(span);
      });
    });

    // 底部设置项下拉
    function updateDDLabel(item, val) {
      const valueEl = item.querySelector('.ref2vid-setting-value');
      if (valueEl) {
        valueEl.textContent = val;
        valueEl.dataset.label = val;
      }
      item.querySelectorAll('.ref2vid-dd-option').forEach(o => {
        o.classList.toggle('active', o.dataset.val === val);
      });
    }

    document.querySelectorAll('.ref2vid-dropdown').forEach(item => {
      const trigger = item;
      const menu = item.querySelector('.ref2vid-dropdown-menu');

      // 点击项头 → 展开/收起
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.ref2vid-dropdown').forEach(d => d.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });

      // 点击选项 → 选中并收起
      if (menu) {
        menu.addEventListener('click', function(e) {
          const opt = e.target.closest('.ref2vid-dd-option');
          if (opt) {
            e.stopPropagation();
            updateDDLabel(item, opt.dataset.val);
            item.classList.remove('open');
          }
        });
      }
    });

    // 点击面板外部 → 收起所有下拉
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.ref2vid-dropdown')) {
        document.querySelectorAll('.ref2vid-dropdown').forEach(d => d.classList.remove('open'));
      }
    });

    // 生成按钮点击
    const genBtn = document.getElementById('ref2vid-generate-btn');
    if (genBtn) {
      genBtn.addEventListener('click', function() {
        const originalHTML = this.innerHTML;
        this.textContent = '生成中...';
        this.style.opacity = '0.7';
        this.style.pointerEvents = 'none';
        setTimeout(() => { this.innerHTML = originalHTML; this.style.opacity = '1'; this.style.pointerEvents = ''; }, 3000);
      });
    }
  })();

  // 类别选择器通用绑定：将所选标签追加到对应模块的提示词输入框
  function bindCategorySelector(moduleSelector, promptInputId) {
    document.querySelectorAll(moduleSelector + ' .i2v-category-item').forEach(item => {
      const btn = item.querySelector('.i2v-category-btn');
      const panel = item.querySelector('.i2v-category-panel');
      if (!btn) return;

      // 点击类别按钮 → 展开/收起
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.i2v-category-item').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });

      // 点击选项 → 选中并添加到提示词
      if (panel) {
        panel.addEventListener('click', function(e) {
          const opt = e.target.closest('.i2v-option-btn');
          if (opt) {
            e.stopPropagation();
            const value = opt.dataset.value;
            opt.classList.toggle('active');
            const promptInput = document.getElementById(promptInputId);
            if (promptInput) {
              if (opt.classList.contains('active')) {
                if (promptInput.value && !promptInput.value.endsWith('，') && !promptInput.value.endsWith(',')) {
                  promptInput.value += '，';
                }
                promptInput.value += value;
              } else {
                promptInput.value = promptInput.value
                  .replace('，' + value, '')
                  .replace(value + '，', '')
                  .replace(value, '')
                  .trim();
              }
            }
          }
        });
      }
    });
  }

  // ===== 图生视频交互 =====
  (function initI2V() {
    bindCategorySelector('[data-module-content="image-to-video"]', 'i2v-prompt-input');

    // 点击外部关闭所有类别面板
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.i2v-category-item')) {
        document.querySelectorAll('.i2v-category-item').forEach(i => i.classList.remove('open'));
      }
    });

    // 生成按钮点击
    const i2vGenBtn = document.getElementById('i2v-generate-btn');
    if (i2vGenBtn) {
      i2vGenBtn.addEventListener('click', function() {
        const originalHTML = this.innerHTML;
        this.textContent = '生成中...';
        this.style.opacity = '0.7';
        this.style.pointerEvents = 'none';
        setTimeout(() => { this.innerHTML = originalHTML; this.style.opacity = '1'; this.style.pointerEvents = ''; }, 3000);
      });
    }
  })();

  // ===== 文生视频交互 =====
  bindCategorySelector('[data-module-content="quick-create"]', 'qv-script-input');

  // ===== 文生图交互 =====
  bindCategorySelector('[data-module-content="text-to-image"]', 't2i-prompt');

  // ===== 图生图交互 =====
  bindCategorySelector('[data-module-content="img-to-img"]', 'i2i-prompt');

  // ===== 预览面板筛选标签交互 =====
  document.querySelectorAll('.preview-filter-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabs = this.parentElement.querySelectorAll('.preview-filter-tab');
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ===== 创作中心：注入全局独立预览面板（不与左侧操作联动） =====
  initCreatePreviewRoom();
});

/**
 * 创作中心全局独立预览面板：
 * 注入到 module-content-wrapper 内末尾（始终显示，不与左侧模块切换联动）。
 * 中栏为大图作品列表(hover 显示 下载/重新编辑/删除)，最右为缩略图导航(点击滚动定位)。
 */
function initCreatePreviewRoom() {
  var wrapper = document.querySelector('[data-view-panel="short-video"] .module-content-wrapper');
  if (!wrapper) return;

  // 修复：四个模块内容因历史编辑导致游离在 module-content-wrapper 之外，
  // 将它们移回 wrapper 内，保证与右侧预览房间处于同一网格、顶部对齐。
  ['custom-material', 'image-to-video', 'text-to-image', 'img-to-img'].forEach(function (key) {
    var mc = document.querySelector('[data-view-panel="short-video"] .module-content[data-module-content="' + key + '"]');
    if (mc && mc.parentElement !== wrapper) {
      wrapper.appendChild(mc);
    }
  });

  if (wrapper.querySelector('.create-preview-room')) return;

  var demoWorks = [
    {
      kind: 'video', title: '图生视频', model: 'Wan 3.0 Prime', res: '480P', ratio: '16:9',
      prompt: '大院刚开始养了一个小狗，后来又养了一个猫咪，它们在院子里追逐玩耍。',
      thumb: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cute%20puppy%20dog%20closeup%20photo&image_size=square',
      big: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cute%20puppy%20playing%20in%20courtyard%20cinematic%20lighting&image_size=landscape_16_9',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      ai: true
    },
    {
      kind: 'video', title: '参考生视频', model: 'Wan 3.0 Prime', res: '480P', ratio: '9:16',
      prompt: '@图片1 @图片2 小狗和小猫是好朋友，他们一起抓老鼠。',
      thumb: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Orange%20tabby%20cat%20closeup%20photo&image_size=square',
      big: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cat%20and%20dog%20playing%20together%20cinematic%20scene&image_size=landscape_16_9',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      ai: true
    },
    {
      kind: 'image', title: '文生图', model: 'Wan 3.0 Prime', res: '480P', ratio: '1:1',
      prompt: '一座未来主义城市天际线，暮色降临，霓虹灯倒映在雨后街道。',
      thumb: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Futuristic%20city%20skyline%20neon%20rainy%20street&image_size=square',
      big: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Futuristic%20city%20skyline%20neon%20lights%20rainy%20street%20reflection&image_size=landscape_4_3',
      ai: true
    },
    {
      kind: 'image', title: '图生图', model: 'Wan 3.0 Prime', res: '480P', ratio: '4:3',
      prompt: '保留首帧人物形象，将背景更换为春天盛开的樱花林。',
      thumb: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Cherry%20blossom%20park%20portrait%20spring&image_size=square',
      big: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Portrait%20cherry%20blossom%20park%20spring%20sunlight&image_size=portrait_4_3',
      ai: true
    },
    {
      kind: 'video', title: '文生视频', model: 'Wan 3.0 Prime', res: '1080P', ratio: '16:9',
      prompt: '一列高铁穿过雪山与森林，镜头跟随飞驰的列车穿过隧道。',
      thumb: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=High%20speed%20train%20snowy%20mountain%20forest%20aerial&image_size=square',
      big: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=High%20speed%20train%20passing%20through%20snowy%20mountains%20cinematic&image_size=landscape_16_9',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      ai: false
    }
  ];

  var room = document.createElement('div');
  room.className = 'create-preview-room';

  // 中栏：大图作品 + 筛选标签
  var stage = document.createElement('div');
  stage.className = 'create-preview-stage';

  var tabs = document.createElement('div');
  tabs.className = 'preview-stage-tabs';
  var tabsDef = [
    { k: 'all', label: '全部' }, { k: 'video', label: '视频' },
    { k: 'image', label: '图片' }
  ];
  tabsDef.forEach(function(t, idx) {
    var b = document.createElement('button');
    b.className = 'preview-stage-tab' + (idx === 0 ? ' active' : '');
    b.dataset.filter = t.k;
    b.textContent = t.label;
    tabs.appendChild(b);
  });
  stage.appendChild(tabs);

  var list = document.createElement('div');
  list.className = 'create-preview-list';
  demoWorks.forEach(function(w) {
    var item = document.createElement('div');
    item.className = 'pv-item ' + w.kind;
    item.dataset.ai = w.ai ? '1' : '0';

    var media = document.createElement('div');
    media.className = 'pv-item-media';

    // 视频作品:用 video 元素,鼠标移入自动播放
    var player = null;
    if (w.kind === 'video' && w.video) {
      player = document.createElement('video');
      player.className = 'pv-item-video';
      player.src = w.video;
      player.poster = w.big;
      player.muted = true;
      player.loop = true;
      player.playsInline = true;
      player.preload = 'metadata';
      player.setAttribute('muted', '');
      player.setAttribute('playsinline', '');
      // 视频源加载失败时回退显示封面大图
      player.addEventListener('error', function() {
        if (!media.querySelector('img')) {
          var fb = document.createElement('img');
          fb.src = w.big;
          fb.alt = w.prompt;
          media.appendChild(fb);
        }
      });
      media.appendChild(player);
    } else {
      var img = document.createElement('img');
      img.src = w.big;
      img.alt = w.prompt;
      media.appendChild(img);
    }

    var actions = document.createElement('div');
    actions.className = 'pv-item-actions';
    var btnDefs = [
      { label: '下载', icon: 'fas fa-download' },
      { label: '重新编辑', icon: 'fas fa-pen' },
      { label: '删除', icon: 'fas fa-trash-alt', danger: true }
    ];
    btnDefs.forEach(function(bd) {
      var btn = document.createElement('button');
      btn.className = 'pv-action-btn' + (bd.danger ? ' danger' : '');
      btn.innerHTML = '<i class="' + bd.icon + '"></i>' + bd.label;
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (bd.label === '删除') { item.style.display = 'none'; }
        else { alert('已触发操作：' + bd.label); }
      });
      actions.appendChild(btn);
    });
    media.appendChild(actions);

    // 鼠标移入视频自动播放,移出暂停
    if (player) {
      media.addEventListener('mouseenter', function() {
        player.muted = true;
        var p = player.play();
        if (p && p.catch) p.catch(function(){});
      });
      media.addEventListener('mouseleave', function() {
        player.pause();
      });
      item.addEventListener('mouseenter', function() {
        player.muted = true;
        var p = player.play();
        if (p && p.catch) p.catch(function(){});
      });
      item.addEventListener('mouseleave', function() {
        player.pause();
      });
    }

    var info = document.createElement('div');
    info.className = 'pv-item-info';
    info.innerHTML =
      '<span class="pv-item-title"><i class="fas ' + (w.kind === 'video' ? 'fa-film' : 'fa-image') + '"></i>' + w.title + '</span>' +
      '<span class="pv-item-tag">' + w.model + '</span>' +
      '<span class="pv-item-tag">' + w.res + '</span>' +
      '<span class="pv-item-tag">' + w.ratio + '</span>';
    var prompt = document.createElement('div');
    prompt.className = 'pv-item-prompt';
    prompt.textContent = w.prompt;
    if (w.ai) {
      var aiTag = document.createElement('span');
      aiTag.className = 'pv-ai-badge';
      aiTag.textContent = 'AI生成';
      info.appendChild(aiTag);
    }

    item.appendChild(media);
    item.appendChild(info);
    item.appendChild(prompt);
    list.appendChild(item);
  });
  stage.appendChild(list);

  // 最右：缩略图导航列
  var nav = document.createElement('div');
  nav.className = 'create-preview-nav';
  demoWorks.forEach(function(w, idx) {
    var t = document.createElement('div');
    t.className = 'pv-nav-thumb' + (idx === 0 ? ' active' : '');
    var im = document.createElement('img');
    im.src = w.thumb;
    im.alt = w.title;
    t.appendChild(im);
    t.addEventListener('click', function() {
      nav.querySelectorAll('.pv-nav-thumb').forEach(n => n.classList.remove('active'));
      t.classList.add('active');
      // 滚动中栏对应作品到可视区域
      var stageList = stage.querySelectorAll('.pv-item');
      var target = stageList[idx];
      if (target) {
        stage.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' });
      }
    });
    nav.appendChild(t);
  });

  room.appendChild(stage);
  room.appendChild(nav);
  wrapper.appendChild(room);

  // 中栏筛选标签交互
  stage.querySelectorAll('.preview-stage-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var f = this.dataset.filter;
      stage.querySelectorAll('.preview-stage-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      list.querySelectorAll('.pv-item').forEach(function(it) {
        var show = (f === 'all') ||
          (f === 'mine') || (f === 'ai' && it.dataset.ai === '1') ||
          (f === 'video' && it.classList.contains('video')) ||
          (f === 'image' && it.classList.contains('image'));
        it.style.display = show ? '' : 'none';
      });
    });
  });

  applyCreateLayout();
}

/**
 * 内联强制创作中心左右两栏布局（不依赖外部 CSS 层叠结果）：
 * 外层 grid 420px + 1fr，左列操作模块，右列预览房间，高度受限于视口，互不撑开。
 */
function applyCreateLayout() {
  var wrap = document.querySelector('[data-view-panel="short-video"] .module-content-wrapper');
  if (!wrap) return;
  var st = wrap.style;
  st.height = 'calc(100vh - 170px)';
  st.maxHeight = 'calc(100vh - 170px)';
  st.minHeight = '0';
  st.overflow = 'hidden';
  st.display = 'grid';
  st.gridTemplateColumns = '420px 1fr';
  st.gap = '12px';
  st.alignItems = 'start';
  st.alignContent = 'start';
  st.justifyContent = 'start';
  st.padding = '0';
  Array.prototype.slice.call(wrap.children).forEach(function(ch) {
    ch.style.boxSizing = 'border-box';
    if (ch.classList && ch.classList.contains('module-content')) {
      var prev = ch.querySelector('.module-preview-panel');
      if (prev) prev.style.display = 'none';
      var split = ch.querySelector('.module-split');
      if (split) {
        split.style.height = 'auto';
        split.style.minHeight = '0';
        split.style.gridTemplateColumns = '420px';
        split.style.alignItems = 'start';
      }
      if (ch.classList.contains('active')) {
        ch.style.display = 'block';
        ch.style.gridColumn = '1';
        ch.style.gridRow = '1';
        ch.style.width = '420px';
        ch.style.maxWidth = '420px';
        ch.style.minWidth = '0';
        ch.style.alignSelf = 'start';
        ch.style.justifySelf = 'stretch';
        ch.style.maxHeight = '100%';
        ch.style.minHeight = '0';
        ch.style.overflowY = 'auto';
        ch.style.position = 'relative';
        ch.style.top = '0';
        ch.style.marginTop = '0';
        ch.style.paddingTop = '0';
        var inp = ch.querySelector('.module-input-panel');
        if (inp) {
          inp.style.height = 'auto';
          inp.style.minHeight = '0';
          inp.style.alignSelf = 'start';
          inp.style.justifyContent = 'flex-start';
          inp.style.alignItems = 'flex-start';
          inp.style.marginTop = '0';
          inp.style.paddingTop = '0';
        }
        var refCont = ch.querySelector('.ref2vid-container');
        if (refCont) {
          refCont.style.alignSelf = 'flex-start';
          refCont.style.justifyContent = 'flex-start';
          refCont.style.marginTop = '0';
        }
      } else {
        ch.style.display = 'none';
      }
    } else if (ch.classList && ch.classList.contains('create-preview-room')) {
      ch.style.gridColumn = '2';
      ch.style.gridRow = '1';
      ch.style.height = '100%';
      ch.style.maxHeight = '100%';
      ch.style.minHeight = '0';
      ch.style.overflow = 'hidden';
      ch.style.alignSelf = 'stretch';
      ch.style.margin = '0';
    }
  });
}
