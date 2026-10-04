export const FEEDBACK_EMAIL = 'gogumang.dev@gmail.com';
export function feedbackMailto(topic, message) {
  const content = message.trim();
  if (!content) throw new Error('의견을 입력해 주세요.');
  if (content.length > 1000) throw new Error('의견은 1,000자까지 입력할 수 있어요.');
  const subject = `[Fiticker] ${topic}`;
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
}
