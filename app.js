const filterButtons = document.querySelectorAll('[data-filter]');
filterButtons.forEach(button => button.addEventListener('click', () => {
  filterButtons.forEach(item => {
    const active = item === button;
    item.classList.toggle('selected', active);
    item.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-category]').forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
  });
}));
document.querySelector('.copy-email').addEventListener('click', async () => {
  const status = document.querySelector('.copy-status');
  try {
    await navigator.clipboard.writeText('tiago11914@gmail.com');
    status.textContent = 'Correo copiado.';
  } catch {
    status.textContent = 'Puedes seleccionar y copiar el correo de arriba.';
  }
});
const progress = document.querySelector('.progress');
function updateProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = (available > 0 ? window.scrollY / available * 100 : 0) + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();
document.getElementById('year').textContent = new Date().getFullYear();

// Public repository gallery with a local snapshot for offline/rate-limited visits.
(() => {
  const folders = document.getElementById('repo-folders');
  const search = document.getElementById('repo-search');
  const status = document.getElementById('repo-status');
  let repos = [];
  let live = false;
  function render() {
    const term = search.value.trim().toLocaleLowerCase('es');
    const matches = repos.filter(repo => `${repo.name} ${repo.language || ''}`.toLocaleLowerCase('es').includes(term));
    const openGroups = Array.from(folders.querySelectorAll('details')).filter(item => item.open).map(item => item.dataset.group);
    const first = folders.childElementCount === 0;
    folders.replaceChildren();
    for (const [fork, label] of [[false, 'Repositorios'], [true, 'Forks y proyectos derivados']]) {
      const group = matches.filter(repo => Boolean(repo.fork) === fork);
      if (!group.length) continue;
      const details = document.createElement('details');
      details.className = 'repo-folder';
      details.dataset.group = String(fork);
      details.open = Boolean(term) || (!first && openGroups.includes(String(fork)));
      const summary = document.createElement('summary');
      summary.textContent = `▱ ${label} (${group.length})`;
      const grid = document.createElement('div');
      grid.className = 'repo-grid';
      for (const repo of group) {
        const card = document.createElement('article'); card.className = 'repo-card';
        const title = document.createElement('h3'); title.textContent = repo.name;
        const description = document.createElement('p'); description.textContent = repo.description || 'Explora el código y los archivos del proyecto.';
        const language = document.createElement('small'); language.textContent = repo.language || 'Repositorio público';
        const link = document.createElement('a'); link.textContent = 'Abrir proyecto ↗';
        link.href = 'https://github.com/smorenorave/' + encodeURIComponent(repo.name);
        link.target = '_blank'; link.rel = 'noopener noreferrer'; link.setAttribute('aria-label', `Abrir ${repo.name} en GitHub`);
        card.append(title, description, language, link); grid.append(card);
      }
      details.append(summary, grid); folders.append(details);
    }
    status.textContent = (matches.length ? `${matches.length} repositorios públicos` : 'No hay proyectos que coincidan con tu búsqueda.') + (live ? ' · Actualizados desde GitHub' : ' · Vista guardada');
  }
  search.addEventListener('input', render);
  async function load() {
    try {
      const local = await fetch('repos.json'); if (!local.ok) throw new Error('snapshot');
      repos = await local.json(); render();
    } catch { status.textContent = 'Consultando los proyectos en GitHub…'; }
    try {
      const current = [];
      for (let page = 1; ; page++) {
        const response = await fetch(`https://api.github.com/users/smorenorave/repos?per_page=100&sort=updated&page=${page}`, {signal: AbortSignal.timeout(10000)});
        if (!response.ok) throw new Error('GitHub unavailable');
        const batch = await response.json(); if (!Array.isArray(batch)) throw new Error('Invalid response');
        current.push(...batch); if (batch.length < 100) break;
      }
      repos = current; live = true; render();
    } catch {
      if (!repos.length) status.textContent = 'No se pudieron cargar los proyectos. Puedes verlos en el enlace a mi perfil.';
    }
  }
  load();
})();
