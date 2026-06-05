# Coin Dash

Vercel에 올리기 쉬운 작은 브라우저 게임입니다. 방향키 또는 `A`/`D`로 바구니를 움직여 30초 동안 코인을 모읍니다.

닉네임을 입력하면 상단에 바로 표시되고, 점수를 저장하면 랭킹에 높은 점수순으로 정렬됩니다. Firebase를 연결하지 않아도 브라우저 로컬 저장소에 랭킹이 저장됩니다.

## Firebase 사용량 최소화

이 게임은 Firebase Realtime Database를 사용합니다.

- 페이지를 열 때는 Firebase SDK를 불러오지 않습니다.
- 점수 저장 버튼을 누를 때만 Firebase를 불러옵니다.
- Realtime Database에는 `/leaderboards/coinDash/scores` 한 경로만 사용합니다.
- 상위 10개 점수만 배열로 저장합니다.
- Firebase 설정값을 비워두면 Firebase 사용량은 0이고 로컬 랭킹만 사용합니다.

## 실행

```bash
npm run dev
```

설치 없이 확인하려면 VS Code Live Server 같은 정적 서버로 `index.html`을 열어도 됩니다.

## Firebase Realtime Database 연결

1. Firebase 콘솔에서 프로젝트를 만듭니다.
2. 웹 앱을 추가하고 Firebase config를 복사합니다.
3. Realtime Database를 만듭니다.
4. `src/firebase-config.js`의 값을 Firebase 웹 앱 설정값으로 교체합니다.
5. 특히 `databaseURL` 값이 들어가야 합니다.

저장 경로는 아래 하나만 사용합니다.

```txt
/leaderboards/coinDash/scores
```

## Realtime Database Rules

Firebase 콘솔의 Realtime Database > Rules에 아래 규칙을 넣으면 됩니다.

```json
{
  "rules": {
    "leaderboards": {
      "coinDash": {
        "scores": {
          ".read": true,
          ".write": "!newData.hasChild('10')",
          "$index": {
            ".validate": "$index.matches(/^[0-9]$/) && newData.hasChildren(['name', 'score', 'createdAt']) && newData.child('name').isString() && newData.child('name').val().length <= 16 && newData.child('score').isNumber() && newData.child('score').val() >= 0 && newData.child('score').val() <= 10000 && newData.child('createdAt').isNumber()"
          }
        }
      }
    }
  }
}
```

## Vercel 배포

GitHub 저장소에 올린 뒤 Vercel에서 Import Project를 선택하면 됩니다.

- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `public`
