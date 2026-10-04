export function setupNavigation(root = document) {
  const menu = root.querySelector('.site-menu');
  if (!menu) return;
  const toggle = menu.querySelector('summary');
  menu.addEventListener('toggle', () => {
    toggle.setAttribute('aria-label', menu.open ? '메뉴 닫기' : '메뉴 열기');
  });
  root.addEventListener('click', (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      toggle.focus();
    }
  });
}
