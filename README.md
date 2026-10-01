# MOVE DIARY

한 주의 운동 기록을 1080 × 1920 이미지 한 장으로 만드는 모바일 웹입니다.

**[웹사이트](https://syoung125.github.io/move-diary/)** · **[유지보수 가이드](docs/maintenance.md)**

이 저장소는 수정 가능한 전체 개발 프로젝트입니다. 원본은 `src/`와 `index.html`에 있으며, `dist/`는 빌드할 때 만들어지는 배포 결과물입니다. **`dist/`와 `node_modules/`는 Git에 올리지 않습니다.** 필요한 버전은 `package-lock.json`으로 재현합니다.

## 처음 실행하기

Node.js 22.12 이상(22 LTS 권장)과 Git이 필요합니다. Python, API 키, 환경변수, 백엔드 설정은 필요하지 않습니다.

```sh
git clone https://github.com/syoung125/move-diary.git
cd move-diary
# nvm을 쓴다면: nvm install && nvm use
npm ci
npm run dev
```

`http://127.0.0.1:5173`을 열고 코드를 수정하세요. 개발 서버가 변경 사항을 자동 반영합니다. 브라우저 새로고침이 발생하면 메모리에 있던 운동 기록이 초기화됩니다.

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
move-diary/
├── index.html                 # 편집·미리보기·입력 모달 화면 구조
├── src/
│   ├── main.js                # 앱과 스타일 진입점
│   ├── app.js                 # 상태, 입력 이벤트, 주 이동, 내보내기 연결
│   ├── domain/workouts.js     # 운동 종류, 날짜, 합계, 입력 검증
│   ├── media/
│   │   ├── photo.js           # 업로드 사진 크기 조정
│   │   └── poster.js          # 1080 × 1920 공유 이미지 레이아웃
│   ├── ui/
│   │   ├── dom.js             # DOM 생성 공통 함수
│   │   └── render-editor.js   # 합계·캘린더·운동 카드 렌더링
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
- 하루 한 기록: 8개 운동 종류, 기타 운동명, 선택 운동 시간·사진·30자 메모
- 수정·삭제, 주간 운동 횟수와 총 운동 시간
- 최대 7일 기록을 담는 Story PNG 및 지원 기기의 이미지 공유
- 사진과 기록은 기기 안에서만 처리하고 서버로 전송하지 않음

기록은 현재 탭의 메모리에만 있습니다. **새로고침하면 사라집니다.** 시간 미입력 운동도 횟수에는 포함하며, 주 제목은 해당 주 목요일의 월과 주차를 사용합니다. 글꼴은 Google Fonts에서 불러오며 실패하면 시스템 글꼴로 이미지 생성을 계속합니다.

## 검증 범위

자동 테스트는 날짜 경계·합계·입력 검증·Canvas 출력 크기와 글꼴 실패 처리를 검사합니다. Canvas 테스트는 출력 계약을 검사하며 실제 픽셀이나 기기별 다운로드 동작을 보장하지 않습니다. 배포 전 실제 모바일 브라우저에서 사진 입력과 이미지 저장을 확인하는 절차는 [유지보수 가이드](docs/maintenance.md)에 있습니다.
