// ===== 登录模块 =====
const MOCK_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: '管理员' },
  { username: 'user1', password: '123456',  role: '普通用户' },
  { username: 'demo',  password: 'demo',    role: '演示账号' }
];

let currentUser = null;

const loginOverlay   = document.getElementById('login-overlay');
const loginUsername  = document.getElementById('login-username');
const loginPassword  = document.getElementById('login-password');
const loginError     = document.getElementById('login-error');
const loginBtn       = document.getElementById('login-btn');
const userArea       = document.getElementById('user-area');
const currentUsername = document.getElementById('current-username');
const logoutBtn      = document.getElementById('logout-btn');

function doLogin() {
  const name = loginUsername.value.trim();
  const pwd  = loginPassword.value;
  if (!name || !pwd) {
    loginError.textContent = '请输入用户名和密码';
    return;
  }
  const account = MOCK_ACCOUNTS.find(a => a.username === name && a.password === pwd);
  if (!account) {
    loginError.textContent = '用户名或密码错误';
    loginPassword.value = '';
    return;
  }
  currentUser = account;
  loginOverlay.style.display = 'none';
  userArea.style.display = 'flex';
  currentUsername.textContent = account.username;
  loginError.textContent = '';
  loginPassword.value = '';
}

function doLogout() {
  currentUser = null;
  loginOverlay.style.display = 'flex';
  userArea.style.display = 'none';
  loginUsername.value = '';
  loginPassword.value = '';
  loginError.textContent = '';
  loginUsername.focus();
}

loginBtn.addEventListener('click', doLogin);
loginPassword.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
loginUsername.addEventListener('keydown', e => { if (e.key === 'Enter') loginPassword.focus(); });
logoutBtn.addEventListener('click', doLogout);

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

  document.getElementById('step-current').textContent = step;
  document.getElementById('prev-step').disabled = step === 1;

  const nextBtn = document.getElementById('next-step');
  if (step === TOTAL_STEPS) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'flex';
    nextBtn.innerHTML = step === TOTAL_STEPS - 1
      ? '前往生成 <i class="fas fa-arrow-right ml-1"></i>'
      : '下一步 <i class="fas fa-arrow-right ml-1"></i>';
  }

  requestAnimationFrame(() => {
    if (typeof positionVolumeBubble === 'function') positionVolumeBubble();
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.top-nav-item').forEach(item => {
  item.addEventListener('click', function() {
    const target = this.dataset.view;
    document.querySelectorAll('.top-nav-item').forEach(n => n.classList.toggle('active', n === this));
    document.querySelectorAll('.view-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.viewPanel === target);
    });
  });
});

document.querySelectorAll('.module-nav-item').forEach(item => {
  item.addEventListener('click', function() {
    const target = this.dataset.module;
    document.querySelectorAll('.module-nav-item').forEach(n => n.classList.toggle('active', n === this));
    document.querySelectorAll('.module-content').forEach(p => {
      p.classList.toggle('active', p.dataset.moduleContent === target);
    });
  });
});

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

  document.getElementById('cm-step-current').textContent = step;
  document.getElementById('cm-prev-step').disabled = step === 1;

  const nextBtn = document.getElementById('cm-next-step');
  if (step === CM_TOTAL_STEPS) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'flex';
    nextBtn.innerHTML = step === CM_TOTAL_STEPS - 1
      ? '前往生成 <i class="fas fa-arrow-right ml-1"></i>'
      : '下一步 <i class="fas fa-arrow-right ml-1"></i>';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('cm-prev-step')?.addEventListener('click', () => {
  if (cmCurrentStep > 1) renderCmStep(cmCurrentStep - 1);
});
document.getElementById('cm-next-step')?.addEventListener('click', () => {
  if (cmCurrentStep < CM_TOTAL_STEPS) renderCmStep(cmCurrentStep + 1);
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
          cmGenerateBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
          if (messages) messages.style.display = 'block';
        }
        progress.style.width = p + '%';
      }, 200);
    });
  }
})();

// ===== 数字人口播模块 =====
const DA_TOTAL_STEPS = 4;
let daCurrentStep = 1;

function renderDaStep(step) {
  daCurrentStep = step;
  document.querySelectorAll('.da-step-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.daPanel === String(step));
  });

  const stepItems = document.querySelectorAll('[data-da-step]');
  const dividers = document.querySelectorAll('#da-stepper .step-divider');
  stepItems.forEach(el => {
    const idx = Number(el.dataset.daStep);
    el.classList.toggle('active', idx === step);
    el.classList.toggle('done', idx < step);
  });
  dividers.forEach((el, i) => {
    el.classList.toggle('done', i + 1 < step);
  });

  document.getElementById('da-step-current').textContent = step;
  document.getElementById('da-prev-step').disabled = step === 1;

  const nextBtn = document.getElementById('da-next-step');
  if (step === DA_TOTAL_STEPS) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'flex';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('da-prev-step')?.addEventListener('click', () => {
  if (daCurrentStep > 1) renderDaStep(daCurrentStep - 1);
});
document.getElementById('da-next-step')?.addEventListener('click', () => {
  if (daCurrentStep < DA_TOTAL_STEPS) renderDaStep(daCurrentStep + 1);
});
document.querySelectorAll('[data-da-step]').forEach(item => {
  item.addEventListener('click', () => {
    renderDaStep(Number(item.dataset.daStep));
  });
});

(function initDigitalAvatar() {
  const avatarList = document.getElementById('da-avatar-list');
  const avatarUpload = document.getElementById('da-avatar-upload');

  if (avatarList) {
    avatarList.addEventListener('click', e => {
      const card = e.target.closest('.da-avatar-card');
      if (!card) return;
      avatarList.querySelectorAll('.da-avatar-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  }

  if (avatarUpload) {
    avatarUpload.addEventListener('dragover', e => { e.preventDefault(); avatarUpload.classList.add('dragover'); });
    avatarUpload.addEventListener('dragleave', () => avatarUpload.classList.remove('dragover'));
    avatarUpload.addEventListener('drop', e => {
      e.preventDefault();
      avatarUpload.classList.remove('dragover');
      Array.from(e.dataTransfer.files || []).forEach(addAvatarCard);
    });
    avatarUpload.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.multiple = true;
      input.addEventListener('change', () => {
        Array.from(input.files || []).forEach(addAvatarCard);
      });
      input.click();
    });
  }

  function addAvatarCard(file) {
    if (!avatarList || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const card = document.createElement('div');
    card.className = 'da-avatar-card';
    card.innerHTML = `
      <div class="da-avatar-preview">
        <img src="${url}" alt="${file.name}" />
        <div class="da-avatar-check"><i class="fas fa-check"></i></div>
      </div>
      <div class="da-avatar-name">${file.name}</div>
    `;
    avatarList.appendChild(card);
  }

  const speedSlider = document.getElementById('da-speed');
  const speedBubble = document.getElementById('da-speed-bubble');
  function positionSpeedBubble() {
    if (!speedSlider || !speedBubble) return;
    const min = Number(speedSlider.min);
    const max = Number(speedSlider.max);
    const value = Number(speedSlider.value);
    const ratio = (value - min) / (max - min);
    speedBubble.style.left = (ratio * speedSlider.offsetWidth) + 'px';
    speedBubble.textContent = value.toFixed(1) + 'x';
  }
  if (speedSlider) {
    speedSlider.addEventListener('input', positionSpeedBubble);
    window.addEventListener('resize', positionSpeedBubble);
    requestAnimationFrame(positionSpeedBubble);
  }

  document.querySelectorAll('.da-mode-card').forEach(card => {
    card.addEventListener('click', function() {
      const target = this.dataset.daMode;
      document.querySelectorAll('.da-mode-card').forEach(c => c.classList.toggle('active', c === this));
      document.querySelectorAll('.da-mode-content').forEach(p => {
        p.classList.toggle('active', p.dataset.daModeContent === target);
      });
    });
  });

  const daCustomUpload = document.getElementById('da-custom-upload');
  const daMaterialList = document.getElementById('da-material-list');
  if (daCustomUpload) {
    daCustomUpload.addEventListener('dragover', e => {
      e.preventDefault();
      daCustomUpload.classList.add('dragover');
    });
    daCustomUpload.addEventListener('dragleave', () => daCustomUpload.classList.remove('dragover'));
    daCustomUpload.addEventListener('drop', e => {
      e.preventDefault();
      daCustomUpload.classList.remove('dragover');
      Array.from(e.dataTransfer.files || []).forEach(addDaMaterial);
    });
    daCustomUpload.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.multiple = true;
      input.addEventListener('change', () => {
        Array.from(input.files || []).forEach(addDaMaterial);
      });
      input.click();
    });
  }

  function addDaMaterial(file) {
    if (!daMaterialList || !file.type.startsWith('image/')) return;
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
    daMaterialList.appendChild(item);
  }

  if (daMaterialList) {
    daMaterialList.addEventListener('click', e => {
      const btn = e.target.closest('.cm-material-remove');
      if (btn) btn.closest('.cm-material-item').remove();
    });
  }

  const aiNarrateBtn = document.getElementById('da-ai-narrate');
  const narrationTextarea = document.getElementById('da-narration');
  if (aiNarrateBtn && narrationTextarea) {
    aiNarrateBtn.addEventListener('click', () => {
      aiNarrateBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-orange-500 mr-1"></i> 生成中...';
      aiNarrateBtn.disabled = true;
      setTimeout(() => {
        narrationTextarea.value = '大家好，欢迎来到我的直播间！今天为大家介绍一款超值好物，它不仅品质出众，更有独特的设计理念，让您在使用过程中感受到与众不同的体验。现在下单还有专属优惠，机会难得，赶紧行动吧！';
        aiNarrateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles text-orange-500 mr-1"></i> AI 创作旁白';
        aiNarrateBtn.disabled = false;
      }, 1500);
    });
  }

  const daGenerateBtn = document.getElementById('da-generate-btn');
  if (daGenerateBtn) {
    daGenerateBtn.addEventListener('click', () => {
      const progress = document.getElementById('da-progress-fill');
      const messages = document.getElementById('da-generate-messages');
      if (messages) messages.style.display = 'none';
      daGenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成...';
      daGenerateBtn.disabled = true;
      progress.style.width = '0%';
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 6;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
          daGenerateBtn.innerHTML = '<i class="fas fa-check"></i> 生成完成';
          daGenerateBtn.disabled = false;
          daGenerateBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
          if (messages) messages.style.display = 'block';
        }
        progress.style.width = p + '%';
      }, 220);
    });
  }
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

  document.getElementById('i2v-step-current').textContent = step;
  document.getElementById('i2v-prev-step').disabled = step === 1;

  const nextBtn = document.getElementById('i2v-next-step');
  if (step === I2V_TOTAL_STEPS) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = 'flex';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('i2v-prev-step')?.addEventListener('click', () => {
  if (i2vCurrentStep > 1) renderI2vStep(i2vCurrentStep - 1);
});
document.getElementById('i2v-next-step')?.addEventListener('click', () => {
  if (i2vCurrentStep < I2V_TOTAL_STEPS) renderI2vStep(i2vCurrentStep + 1);
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
          i2vGenerateBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
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
  if (mtCurrentStep < MT_TOTAL_STEPS) renderMtStep(mtCurrentStep + 1);
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
          mtGenerateBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
          if (messages) messages.style.display = 'block';
        }
        progress.style.width = p + '%';
      }, 260);
    });
  }
})();

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
  const textInput = document.querySelector('[data-panel="1"] textarea');
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

document.getElementById('prev-step').addEventListener('click', () => {
  if (currentStep > 1) renderStep(currentStep - 1);
});
document.getElementById('next-step').addEventListener('click', () => {
  if (currentStep < TOTAL_STEPS) renderStep(currentStep + 1);
});
document.querySelectorAll('.step-item').forEach(item => {
  item.addEventListener('click', () => {
    renderStep(Number(item.dataset.step));
  });
});

const modal = document.getElementById('global-config-modal');
document.getElementById('open-global-config').addEventListener('click', () => modal.classList.add('open'));
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

document.getElementById('generate-btn').addEventListener('click', function() {
  const btn = this;
  const progress = document.querySelector('.progress-fill');
  const messages = document.querySelectorAll('.success-tag');

  messages.forEach(msg => msg.style.display = 'none');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成...';
  btn.disabled = true;
  progress.style.width = '0%';

  let p = 0;
  const interval = setInterval(() => {
    p += Math.random() * 8;
    if (p >= 100) {
      p = 100;
      clearInterval(interval);
      btn.innerHTML = '<i class="fas fa-check"></i> 生成完成';
      btn.disabled = false;
      btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      messages.forEach(msg => msg.style.display = 'flex');
    }
    progress.style.width = p + '%';
  }, 200);
});

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
      primary: '#f97316',
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

document.addEventListener('DOMContentLoaded', () => {
  DesignSpec.init();
});
