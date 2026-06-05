# Coin Dash

Vercel에 올리기 쉬운 작은 브라우저 게임입니다. 방향키 또는 `A`/`D`로 바구니를 움직여 30초 동안 코인을 모읍니다.

닉네임을 입력하면 상단에 바로 표시되고, 점수를 저장하면 랭킹에 높은 점수순으로 정렬됩니다. Firebase를 연결하지 않아도 브라우저 로컬 저장소에 랭킹이 저장됩니다.

Firebase 사용량을 줄이기 위해 페이지를 열 때는 Firebase SDK를 불러오지 않습니다. 점수를 저장할 때만 Firebase를 불러오고, Firestore에는 `leaderboards/coinDash` 문서 1개만 사용합니다. 이 문서 안에 상위 10개 점수만 배열로 저장해서 다운로드와 저장 공간을 작게 유지합니다.

## 실행

```bash
npm run dev
```

설치 없이 확인하려면 VS Code Live Server 같은 정적 서버로 `index.html`을 열어도 됩니다.

## Firebase 연결

1. Firebase 콘솔에서 웹 앱을 만들고 Firestore Database를 활성화합니다.
2. `src/firebase-config.js`의 값을 Firebase 웹 앱 설정값으로 교체합니다.
3. Firestore 문서 경로는 `leaderboards/coinDash`를 사용합니다.
4. 테스트용 규칙 예시는 아래와 같습니다. 실제 운영 전에는 더 엄격한 규칙으로 바꾸는 것을 권장합니다.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboards/coinDash {
      allow get: if true;
      allow list: if false;
      allow create, update: if request.resource.data.keys().hasOnly(["scores", "updatedAt"])
        && request.resource.data.scores is list
        && request.resource.data.scores.size() <= 10;
    }
  }
}
```

더 줄이고 싶다면 Firebase 연결값을 비워두면 됩니다. 그러면 랭킹은 로컬 저장소만 사용하고 Firebase 다운로드, 읽기, 쓰기는 발생하지 않습니다.

## Vercel 배포

GitHub 저장소에 올린 뒤 Vercel에서 Import Project를 선택하면 됩니다.

- Framework Preset: Other
- Build Command: 비워두거나 `npm run build`
- Output Directory: 비워두기
