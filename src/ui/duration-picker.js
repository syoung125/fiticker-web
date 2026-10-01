import {
  minuteOptions,
  splitDuration,
  wheelIndex,
  WHEEL_ROW_HEIGHT,
} from '../domain/duration-picker.js';
import { el } from './dom.js';

function createWheel(container, unit, onChange) {
  let values = [];
  let selected = 0;

  function paint() {
    [...container.children].forEach((option, index) => {
      option.setAttribute('aria-selected', String(index === selected));
    });
    container.setAttribute('aria-activedescendant', `${container.id}-${selected}`);
  }

  function select(index, notify = true) {
    selected = Math.max(0, Math.min(values.length - 1, index));
    container.scrollTop = selected * WHEEL_ROW_HEIGHT;
    paint();
    if (notify) onChange();
  }

  container.addEventListener('scroll', () => {
    const index = wheelIndex(container.scrollTop, values.length);
    if (index !== selected) {
      selected = index;
      paint();
      onChange();
    }
  });
  container.addEventListener('click', (event) => {
    const option = event.target.closest('[role="option"]');
    if (option) select(Number(option.dataset.index));
  });
  container.addEventListener('keydown', (event) => {
    const keys = {
      ArrowUp: selected - 1,
      ArrowDown: selected + 1,
      PageUp: selected - 5,
      PageDown: selected + 5,
      Home: 0,
      End: values.length - 1,
      Enter: selected,
      ' ': selected,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(keys[event.key]);
  });

  return {
    reset(options, value) {
      values = options;
      container.replaceChildren(
        ...values.map((number, index) => {
          const option = el('div', 'wheel-option', `${number} ${unit}`);
          option.id = `${container.id}-${index}`;
          option.dataset.index = index;
          option.setAttribute('role', 'option');
          return option;
        }),
      );
      select(values.indexOf(value), false);
    },
    value() {
      // Read the visible selection even when Save precedes the last scroll event.
      return values[wheelIndex(container.scrollTop, values.length)];
    },
  };
}

export function createDurationPicker(root) {
  const status = root.querySelector('[data-duration-status]');
  const clear = root.querySelector('[data-duration-clear]');
  let entered = false;
  const hours = createWheel(root.querySelector('#hours-wheel'), '시간', changed);
  const minutes = createWheel(root.querySelector('#minutes-wheel'), '분', changed);

  function updateStatus() {
    status.textContent = entered ? `${hours.value()}시간 ${minutes.value()}분 선택` : '시간 미입력';
    root.classList.toggle('has-duration', entered);
    clear.disabled = !entered;
  }
  function changed() {
    entered = true;
    updateStatus();
  }
  function set(total) {
    const initial = splitDuration(total);
    entered = initial.entered;
    hours.reset(
      Array.from({ length: 24 }, (_, index) => index),
      initial.hours,
    );
    minutes.reset(minuteOptions(initial.minutes), initial.minutes);
    updateStatus();
  }
  clear.addEventListener('click', () => set(null));

  return {
    set,
    read() {
      const hour = hours.value();
      const minute = minutes.value();
      // Save can run before the final scroll event is delivered.
      const hasValue = entered || hour !== 0 || minute !== 0;
      return { hours: hasValue ? String(hour) : '', mins: hasValue ? String(minute) : '' };
    },
  };
}
