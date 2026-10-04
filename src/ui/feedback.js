import { FEEDBACK_EMAIL, feedbackMailto } from '../domain/feedback.js';
const form = document.querySelector('#feedback-form');
const topic = document.querySelector('#feedback-topic');
const message = document.querySelector('#feedback-message');
const status = document.querySelector('#feedback-status');
const key = 'fiticker.feedback-draft.v1';
try {
  const draft = JSON.parse(sessionStorage.getItem(key));
  if (typeof draft?.message === 'string') message.value = draft.message.slice(0, 1000);
  if ([...topic.options].some((option) => option.value === draft?.topic)) topic.value = draft.topic;
} catch {
  /* Writing feedback must work even when storage is unavailable. */
}
form.addEventListener('input', () => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ topic: topic.value, message: message.value }));
  } catch {
    /* Keep the current draft in the form. */
  }
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const url = feedbackMailto(topic.value, message.value);
    window.location.href = url;
    status.textContent =
      '메일 앱에서 전송을 마무리해 주세요. 열리지 않으면 아래 주소로 직접 보내실 수 있어요.';
  } catch (error) {
    status.textContent = error.message;
    message.focus();
  }
});
document.querySelector('#copy-feedback-email').onclick = async () => {
  try {
    await navigator.clipboard.writeText(FEEDBACK_EMAIL);
    status.textContent = '이메일 주소를 복사했어요.';
  } catch {
    status.textContent = `이메일 주소를 직접 복사해 주세요: ${FEEDBACK_EMAIL}`;
  }
};
