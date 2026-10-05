# 개발 가이드

[서비스 소개](../README.md) · [유지보수 가이드](maintenance.md)

이 저장소는 수정 가능한 전체 개발 프로젝트입니다. 원본은 `src/`와 `index.html`에 있으며, `dist/`는 빌드할 때 만들어지는 배포 결과물입니다. **`dist/`와 `node_modules/`는 Git에 올리지 않습니다.** 필요한 버전은 `package-lock.json`으로 재현합니다.

## 처음 실행하기

Node.js 22.12 이상(22 LTS 권장)과 Git이 필요합니다. Python, API 키, 환경변수, 백엔드 설정은 필요하지 않습니다.

```sh
git clone https://github.com/syoung125/fiticker-web.git
cd fiticker-web
# nvm을 쓴다면: nvm install && nvm use
npm ci
npm run dev
```

`http://127.0.0.1:5173`을 열고 코드를 수정하세요. 개발 서버가 변경 사항을 자동 반영합니다. 운동 기록은 같은 탭에서 새로고침해도 유지됩니다. 직접 추가한 운동 종목은 브라우저에 저장됩니다.

## 명령어

| 명령어                 | 하는 일                                      |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | 개발 서버 실행                               |
| `npm start`            | 개발 서버 실행 (`dev`와 동일)                |
| `npm test`             | 날짜·합계·검증 및 이미지 생성 계약 테스트    |
| `npm run format`       | 원본 코드 및 문서 포맷 정리                  |
| `npm run format:check` | 포맷 검사                                    |
| `npm run build`        | `dist/`에 배포용 파일 생성                   |
| `npm run preview`      | 빌드 결과를 `http://127.0.0.1:4174`에서 확인 |
| `npm run check`        | 포맷 검사 → 테스트 → 빌드                    |

## 프로젝트 구조

```text
fiticker-web/
├── index.html                 # 서비스 소개 홈
├── weekly/index.html          # 위클리 기록·스티커·입력 모달
├── feedback/index.html        # 의견 보내기
├── src/
│   ├── main.js                # 앱과 스타일 진입점
│   ├── app.js                 # 상태, 입력 이벤트, 주 이동, 내보내기 연결
│   ├── domain/workouts.js     # 운동 종류, 날짜, 합계, 입력 검증
│   ├── media/
│   │   ├── stickers.js        # 스티커 종류·Canvas 이미지 생성
│   │   ├── photo.js           # 이전 사진 처리 구현
│   │   └── poster.js          # 현재 UI에서 사용하지 않는 이전 포스터 구현
│   ├── ui/
│   │   ├── dom.js             # DOM 생성 공통 함수
│   │   └── render-editor.js   # 합계·캘린더·기록 입력 렌더링
│   └── styles/main.css        # 색상, 레이아웃, 모바일 스타일
├── public/favicon.svg         # 그대로 복사되는 정적 파일
├── tests/                     # 자동 테스트
├── docs/maintenance.md        # 수정 위치·데이터 구조·배포 안내
├── .github/workflows/deploy.yml # 검사 및 Pages 자동 배포
├── vite.config.js             # 개발 서버와 빌드 설정
├── package.json               # 실행 명령과 의존성
└── package-lock.json          # 설치 버전 고정
```

## 수정해서 배포하기

1. `src/` 또는 `index.html`을 수정하고 `npm run dev`로 확인합니다.
2. `npm run format`과 `npm run check`를 실행합니다.
3. GitHub `main` 브랜치에 커밋을 올립니다.
4. GitHub의 **Actions → Verify and deploy**가 검사·빌드 후 `dist/`만 Pages에 배포합니다. PR에서는 검사와 빌드만 수행합니다.

GitHub **Settings → Pages → Source**는 **GitHub Actions**를 사용합니다. 실패한 검사나 빌드는 배포로 이어지지 않습니다. 수동으로 빌드 파일을 Git에 추가할 필요가 없습니다.

[Vite 공식 GitHub Pages 배포 안내](https://vite.dev/guide/static-deploy.html#github-pages)를 기반으로 구성했습니다. `base: './'`를 사용해 프로젝트 하위 경로에서도 정적 파일 경로가 유지됩니다.

## 현재 MVP 범위

- 월요일 시작 주간 캘린더와 이전/다음 주 이동
- 하루 한 기록: 기본·더보기 운동 종류, 직접 추가한 종목, 선택 운동 시간·30자 메모
- 수정·삭제, 주간 운동 횟수와 총 운동 시간
- 요약·캘린더·주간 기록 스티커의 PNG 복사와 저장
- 운동 기록은 브라우저에서 처리하고 서버로 전송하지 않음

기록은 현재 탭의 세션 저장소에 보관되어 새로고침해도 유지됩니다. 탭을 닫으면 사라질 수 있습니다. 시간 미입력 운동도 횟수에는 포함하며, 주 제목은 해당 주 목요일의 월과 주차를 사용합니다. 글꼴은 Google Fonts에서 불러오며 실패하면 시스템 글꼴로 이미지 생성을 계속합니다.

## 검증 범위

자동 테스트는 날짜 경계·합계·입력 검증·Canvas 출력 크기와 글꼴 실패 처리를 검사합니다. Canvas 테스트는 출력 계약을 검사하며 실제 픽셀이나 기기별 다운로드 동작을 보장하지 않습니다. 배포 전 실제 모바일 브라우저에서 이미지 저장을 확인하는 절차는 [유지보수 가이드](maintenance.md)에 있습니다.

## 페이지 구조

- `/`: Fiticker 소개와 위클리 서비스 시작
- `/weekly/`: 운동 기록과 스티커 만들기
- `/feedback/`: 의견 작성 후 메일 앱으로 전달

서비스 도메인은 `https://fiticker.com`이며 위 경로를 루트 기준으로 제공합니다. Vite의 다중 HTML 진입점으로 각 경로에 실제 `index.html`을 빌드하므로 직접 접속과 새로고침에 별도 서버 리라이트가 필요하지 않습니다. 페이지별 코드는 `src/main.js`에서 필요한 경우에만 불러옵니다. 공통 헤더 메뉴는 세 HTML에서 동일하게 유지하세요.

의견 페이지는 서버에 의견을 수집하지 않습니다. `gogumang.dev@gmail.com`으로 보내는 메일을 작성해 메일 앱에서 최종 전송합니다. 주소 변경 시 `feedback/index.html`과 `src/domain/feedback.js`를 함께 수정하세요.
