const content = document.querySelector('#content');
const backdrop = document.querySelector('.backdrop');
const motion = document.querySelector('.motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const home = new URL(document.body.dataset.home, location.href);
const base = document.createElement('base');
base.href = location.href;
document.head.prepend(base);
let request;
const pagePath = pathname => pathname.replace(/index\.html$/, '').replace(/\/$/, '');

function setMotion(playing) {
  backdrop.querySelector('iframe')?.remove();
  if (playing) {
    const video = document.createElement('iframe');
    video.title = 'ModquesDance by Sadaf Sadri';
    video.allow = 'autoplay; fullscreen';
    video.src = 'https://player.vimeo.com/video/1170328955?title=0&byline=0&portrait=0&muted=1&autoplay=1&autopause=0&loop=1&background=1';
    video.tabIndex = -1;
    backdrop.append(video);
  }
  motion.textContent = playing ? 'Pause backdrop' : 'Play backdrop';
  motion.dataset.playing = String(playing);
}

setMotion(!reducedMotion.matches);
reducedMotion.addEventListener('change', event => setMotion(!event.matches));
motion.addEventListener('click', () => setMotion(motion.dataset.playing !== 'true'));

function markCurrent(url) {
  for (const link of document.querySelectorAll('.projects a, .info a')) {
    if (pagePath(new URL(link.href).pathname) === pagePath(url.pathname)) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

async function openPage(url, push) {
  request?.abort();
  const controller = new AbortController();
  request = controller;
  try {
    const isHome = pagePath(url.pathname) === pagePath(home.pathname);
    let project = null;
    if (!isHome) {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Could not open project');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      project = page.querySelector('.project');
      if (!project) throw new Error('Missing project');
      for (const item of project.querySelectorAll('[src], [poster], [href]')) {
        for (const attribute of ['src', 'poster', 'href']) {
          if (item.hasAttribute(attribute)) {
            item.setAttribute(attribute, new URL(item.getAttribute(attribute), response.url).href);
          }
        }
      }
    }
    if (controller.signal.aborted) return;
    if (push && url.href !== location.href) {
      const address = new URL(url);
      address.pathname = address.pathname.replace(/index\.html$/, '');
      history.pushState(null, '', address);
    }
    content.replaceChildren(...(project ? [project] : []));
    const heading = content.querySelector('h1');
    document.title = heading ? heading.textContent + ' | Sadaf Sadri' : 'Sadaf Sadri Portfolio';
    markCurrent(url);
    scrollTo(0, 0);
    (heading || document.querySelector('.site-title')).focus({ preventScroll: true });
  } catch (error) {
    if (!controller.signal.aborted) location.assign(url);
  }
}

markCurrent(new URL(location.href));
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-page]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || location.protocol === 'file:') return;
  event.preventDefault();
  openPage(new URL(link.href), true);
});
addEventListener('popstate', () => openPage(new URL(location.href), false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && content.querySelector('.project')) openPage(home, true);
});
