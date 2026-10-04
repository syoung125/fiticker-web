import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { feedbackMailto, FEEDBACK_EMAIL } from '../src/domain/feedback.js';
import { setupNavigation } from '../src/ui/navigation.js';

test('all pages have direct navigation within the project and their own screen content', () => {
  for (const [file, page] of [
    ['index.html', 'home'],
    ['weekly/index.html', 'weekly'],
    ['feedback/index.html', 'feedback'],
  ]) {
    const html = readFileSync(file, 'utf8');
    assert.ok(html.includes(`data-page="${page}"`));
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert.ok(html.includes('class="site-menu"'));
    assert.ok(html.includes('gogumang.dev@gmail.com') === (page === 'feedback'));
    for (const [, link] of html.matchAll(/href="(\.\.?\/[^"#]*)"/g)) {
      assert.ok(existsSync(resolve(dirname(file), link, 'index.html')), `${file}: ${link}`);
    }
    assert.equal(html.includes('id="calendar"'), page === 'weekly');
    assert.equal(html.includes('id="feedback-form"'), page === 'feedback');
    assert.equal(html.includes('id="home-title"'), page === 'home');
  }
});
test('feedback mail includes the recipient and safely encoded user content without sending it', () => {
  const url = new URL(feedbackMailto('불편한 점', ' 첫 줄 & ? #\n둘째 줄 '));
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, FEEDBACK_EMAIL);
  assert.equal(url.searchParams.get('subject'), '[Fiticker] 불편한 점');
  assert.equal(url.searchParams.get('body'), '첫 줄 & ? #\n둘째 줄');
  assert.throws(() => feedbackMailto('기타', '   '));
  assert.throws(() => feedbackMailto('기타', '가'.repeat(1001)));
});
test('header navigation closes outside or on Escape and restores keyboard focus', () => {
  const handlers = {},
    menuHandlers = {},
    attributes = {};
  let focused = false;
  const toggle = {
    setAttribute: (key, value) => {
      attributes[key] = value;
    },
    focus: () => {
      focused = true;
    },
  };
  const inside = {};
  const menu = {
    open: true,
    querySelector: () => toggle,
    addEventListener: (key, fn) => {
      menuHandlers[key] = fn;
    },
    contains: (target) => target === inside,
  };
  setupNavigation({
    querySelector: () => menu,
    addEventListener: (key, fn) => {
      handlers[key] = fn;
    },
  });
  menuHandlers.toggle();
  assert.equal(attributes['aria-label'], '메뉴 닫기');
  handlers.click({ target: inside });
  assert.equal(menu.open, true);
  handlers.keydown({ key: 'Escape' });
  assert.equal(menu.open, false);
  assert.equal(focused, true);
  menu.open = true;
  handlers.click({ target: {} });
  assert.equal(menu.open, false);
  menuHandlers.toggle();
  assert.equal(attributes['aria-label'], '메뉴 열기');
});
