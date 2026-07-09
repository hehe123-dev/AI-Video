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
