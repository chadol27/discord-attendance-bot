# Discord Attendance

`discord.js` + TypeScript 기반 디스코드 출석체크 봇.

서버 채널 메시지 기준 하루 1회 출석 기록. `/출석확인` 명령어로 출석 기록 조회.

## Features

- `messageCreate` 이벤트 기반 자동 출석체크
- 하루 1회만 출석 처리
- 출석 횟수, 출석률, 연속 출석일수 계산
- 일일 출석 순서 점수 누적
- `/출석확인` 슬래시 명령어 지원
- `/출석확인 유저:@user`로 다른 유저 기록 확인 가능
- embed 메시지로 출석 결과와 조회 결과 출력
- JSON 파일 기반 간단 DB 사용

## Database

DB 저장 위치:

```txt
${DB_PATH}/database.json
```

저장 구조:

```json
{
  "guild_id": {
    "score": {
      "last_score": 100,
      "last_calculate": "2026-06-03"
    },
    "members": {
      "member_id": {
        "last_check": "2026-06-03",
        "check_start_date": "2026-05-30",
        "check_count": 5,
        "in_a_row": 5,
        "score": 100
      }
    }
  }
}
```

날짜 형식: `YYYY-MM-DD`

점수는 서버별로 매일 첫 출석자에게 100점을 지급하고, 같은 날 다음 출석자는 마지막 지급 점수의 90%를 반올림한 점수를 지급합니다. 연속 출석이 5일 이상이면 지급 점수에 20% 보너스를 반올림해 더하고, 지급된 점수는 멤버의 `score`에 누적됩니다.

## Environment

필수 환경 변수:

- `DISCORD_TOKEN`: 디스코드 봇 토큰
- `DB_PATH`: `database.json`을 저장할 디렉터리 경로

예시:

```env
DISCORD_TOKEN=your_discord_bot_token
DB_PATH=./database
```

## Setup

```bash
npm install
```

개발 실행:

```bash
npm run dev
```

프로덕션 실행:

```bash
npm run build
npm start
```

## Scripts

- `npm run dev`: TypeScript 소스 직접 실행
- `npm run build`: `dist/`로 빌드
- `npm start`: 빌드된 봇 실행
- `npm run typecheck`: 타입 체크만 실행

## Commands

- `/출석확인`: 내 출석 기록 확인
- `/출석확인 유저:@user`: 지정한 유저의 출석 기록 확인

## Project Structure

- `src/index.ts`: 봇 엔트리포인트, 클라이언트 생성, 명령어 등록
- `src/attendance.ts`: 출석체크 이벤트와 명령어 처리
- `src/commands.ts`: 슬래시 명령어 정의
- `src/embeds.ts`: embed 응답 생성
- `src/date.ts`: 날짜 포맷과 날짜 계산
- `src/database.ts`: JSON DB 읽기/쓰기
