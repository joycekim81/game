# 테트리스 (입문용 프로젝트)

HTML, CSS, JavaScript만 사용하는 브라우저 테트리스 게임입니다.  
빌드 도구나 외부 라이브러리 없이 동작하며, 프론트엔드 입문 수강생을 위한 학습용 프로젝트로 제작되었습니다.

## 프로젝트 소개

이 프로젝트는 테트리스의 핵심 메커니즘을 단계적으로 구현합니다.

- 10×20 게임 보드와 7가지 테트로미노(I, O, T, S, Z, J, L)
- 자동 낙하, 충돌 판정, 키보드 조작
- 줄 삭제, 점수, 게임 오버, 재시작

코드는 `index.html`(구조), `style.css`(스타일), `script.js`(로직) 세 파일로 분리되어 있어 각 역할을 쉽게 파악할 수 있습니다.

## 실행 방법

### 로컬에서 실행

1. 이 저장소를 클론하거나 폴더를 에디터(Cursor, VS Code 등)로 엽니다.
2. `index.html`을 브라우저에서 엽니다.
   - 파일 탐색기에서 `index.html` 더블클릭
   - 또는 주소창에 로컬 경로 입력  
     예: `file:///C:/dev/game/index.html`
3. **시작** 버튼을 누른 뒤 키보드로 블록을 조작합니다.

> 로컬 웹 서버(Live Server 등)를 사용해도 됩니다. 이 프로젝트는 서버 API가 필요하지 않습니다.

### 온라인에서 실행 (GitHub Pages)

배포가 완료되면 아래 주소로 접속합니다.

```
https://joycekim81.github.io/game/
```

자세한 배포 절차는 [GitHub Pages 배포 방법](#github-pages-배포-방법)을 참고하세요.

## 조작법

| 키 | 동작 |
|---|---|
| ← (`ArrowLeft`) | 왼쪽 이동 |
| → (`ArrowRight`) | 오른쪽 이동 |
| ↓ (`ArrowDown`) | 한 칸 빠르게 내리기 |
| ↑ (`ArrowUp`) | 블록 회전 (시계 방향) |
| `Space` | 즉시 낙하 (hard drop) |

- 모든 조작은 `canMove()` 충돌 판정을 통과할 때만 적용됩니다.
- 회전 후 벽이나 고정 블록과 겹치면 회전은 취소됩니다.
- 게임 오버 상태에서는 키보드 조작이 비활성화됩니다.

## 구현 기능

| 기능 | 설명 |
|---|---|
| 보드 렌더링 | CSS Grid 기반 10×20 셀 |
| 블록 시스템 | I, O, T, S, Z, J, L 정의 및 색상 구분 |
| 자동 낙하 | `setInterval`로 일정 간격(800ms) 낙하 |
| 충돌 판정 | `canMove(piece, dx, dy, matrix)` — 벽·바닥·고정 블록 |
| 키보드 조작 | 좌우 이동, 소프트/하드 드롭, 회전 |
| 줄 삭제 | 가득 찬 줄 제거 후 위 블록 하강 |
| 점수 | 삭제 줄 수에 따라 100 / 300 / 500 / 800점 |
| 게임 오버 | 새 블록 스폰 불가 시 종료 |
| 재시작 | 보드·점수·타이머·상태 초기화 |

## 점수 규칙

| 한 번에 삭제한 줄 수 | 점수 |
|---|---|
| 1줄 | 100점 |
| 2줄 | 300점 |
| 3줄 | 500점 |
| 4줄 | 800점 |

## 품질 점검 방법

배포 전 아래 항목을 순서대로 확인합니다.

### 1. 파일 연결 확인

1. 브라우저에서 `index.html`을 엽니다.
2. 개발자 도구(F12) → **Network** 탭에서 `style.css`, `script.js`가 **200** 상태로 로드되는지 확인합니다.
3. **Elements** 탭에서 보드·점수·버튼이 스타일이 적용된 상태로 보이는지 확인합니다.

### 2. 콘솔 에러 확인

1. 개발자 도구 → **Console** 탭을 엽니다.
2. 페이지 로드 직후 빨간 에러가 없는지 확인합니다.
3. **시작** → 조작 → 줄 삭제 → 게임 오버 → **재시작**까지 진행하며 에러가 없는지 확인합니다.

### 3. 기능 체크리스트

- [ ] 시작 후 블록이 자동으로 내려온다
- [ ] 화살표·Space 키가 정상 동작한다
- [ ] 줄이 삭제되면 점수가 오른다
- [ ] 보드가 가득 차면 게임 오버 메시지가 표시된다
- [ ] 재시작 후 점수 0, 빈 보드, 타이머 중지 상태로 돌아간다
- [ ] 재시작 → 시작을 반복해도 낙하 속도가 빨라지지 않는다

### 4. GitHub Pages 배포 후 확인

- 배포 URL에서 게임이 로컬과 동일하게 동작하는지 확인합니다.
- CSS·JS 경로가 깨지지 않았는지 Network 탭으로 재확인합니다.

## GitHub Pages 배포 방법

### 사전 조건

- GitHub 계정
- 프로젝트 파일이 GitHub 저장소에 push된 상태

### 1. 저장소 생성 및 push

```bash
git init
git add index.html style.css script.js README.md
git commit -m "Add tetris game for GitHub Pages"
git branch -M main
git remote add origin https://github.com/joycekim81/game.git
git push -u origin main
```

### 2. GitHub Pages 설정

1. GitHub 저장소 → **Settings** → **Pages**
2. **Build and deployment** → **Source**: `Deploy from a branch`
3. **Branch**: `main` / **Folder**: `/ (root)`
4. **Save** 클릭

### 3. 배포 확인

- 1~2분 후 https://joycekim81.github.io/game/ 에 접속합니다.
- `index.html`이 저장소 루트에 있으므로 별도 경로 설정 없이 바로 게임이 열립니다.

### 배포 시 주의사항

- `style.css`, `script.js`는 `index.html`과 **같은 폴더(저장소 루트)** 에 두세요.
- 상대 경로(`href="style.css"`, `src="script.js"`)를 사용하므로 서브폴더 배포 시 경로를 수정해야 합니다.
- 이 프로젝트는 빌드 단계가 없으므로 push만으로 배포됩니다.

## 파일 구조

```
game/
├── index.html   # 페이지 구조
├── style.css    # 스타일
├── script.js    # 게임 로직
└── README.md    # 프로젝트 안내
```

## 라이선스

학습용 프로젝트입니다. 자유롭게 수정·배포하여 사용할 수 있습니다.
