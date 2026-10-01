# MOVE DIARY

한 주의 움직임을 한 장에 담는 모바일 웹. 날짜별 운동을 입력하고 1080 × 1920 PNG로 저장합니다.

## 기능
- 월요일 시작 주간 캘린더와 주 이동
- 하루 한 기록: 8개 운동 종류, 기타 운동명, 선택 운동 시간·사진·30자 메모
- 기록 수정·삭제와 자동 주간 합계
- 최대 7일 기록을 담는 전용 Story 이미지 및 지원 기기에서 이미지 공유
- 사진 리사이즈 및 이미지 생성은 기기에서 처리. 서버 전송 및 기록 저장 없음

새로고침하면 입력한 모든 기록이 사라집니다. 시간 미입력 운동도 횟수에는 포함합니다. 주 제목은 해당 주 목요일의 월과 주차를 사용합니다.

## 로컬 실행 및 테스트
Node.js 22+, Python 3 사용. 설치할 패키지는 없습니다.

```sh
npm start
# http://localhost:4173
npm test
```

## GitHub Pages
저장소 Settings → Pages → Deploy from a branch → main / (root) → Save.
상대 경로를 사용하므로 프로젝트 하위 경로에서도 작동합니다. 외부 의존성은 Google Fonts뿐이며 시스템 글꼴로 대체할 수 있습니다.

## 구조
- index.html / style.css: 반응형 편집·미리보기 화면
- app.js: 입력과 메모리 상태
- domain.js: 주간 날짜, 입력 검증, 합계
- image.js: 사진 처리 및 Canvas 이미지 템플릿
- tests/domain.test.js: 주 경계 및 합계·검증 회귀 테스트
