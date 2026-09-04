# nohjs79-glitch.github.io

NOHJS 가 내는 앱들의 **개인정보처리방침**과 **`app-ads.txt`** 를 올리는 자리.
GitHub Pages 로 게시된다 — <https://nohjs79-glitch.github.io>

---

## ⚠ 저장소 이름을 바꾸면 안 된다

이름이 정확히 **`nohjs79-glitch.github.io`** 여야 한다.

| 저장소 이름 | 주소 | `app-ads.txt` 가 놓이는 자리 |
|---|---|---|
| **`nohjs79-glitch.github.io`** | `https://nohjs79-glitch.github.io/` | ✅ `…/app-ads.txt` — **루트** |
| 그 밖의 이름 (예: `site`) | `https://nohjs79-glitch.github.io/site/` | ❌ `…/site/app-ads.txt` — **루트가 아니다** |

**광고 회사(AdMob 등)는 스토어에 적힌 개발자 웹사이트의 「도메인 루트」에서만** `app-ads.txt` 를 찾는다.
한 칸이라도 아래로 내려가면 **찾지 못하고, 광고 단가가 떨어진다.**

---

## 파일 구조

```
/app-ads.txt            ← 모든 앱 공용. 루트에 있어야 한다
/.nojekyll              ← 빈 파일. Jekyll 처리를 끈다
/index.html             ← 개발자 소개 + 앱 목록 (스토어의 「개발자 웹사이트」)
/site.json              ← 개발자 정보와 앱 목록. 여기가 원본이다
/chemiline/privacy.md   ← 게시본 원문(마크다운)
/chemiline/privacy.html ← 위에서 만들어진 것. 손으로 고치지 않는다
/tools/build.mjs        ← md → html + index 만들기
```

⚠ **`.nojekyll` 이 없으면** GitHub 이 Jekyll 로 처리하면서 `_` 로 시작하는 파일을 무시하고,
빌드 단계가 하나 끼어들어 배포가 느려지고 예상 못 한 변형이 생긴다. **정적 파일 그대로 올린다.**

---

## 새 앱을 더하는 법 — 셋이면 끝난다

1. **폴더를 만든다** — `앱이름/`
2. **처리방침 원문을 넣는다** — `앱이름/privacy.md`
   (앱 저장소의 초안을 복사하고 **빈칸을 다 채운다**)
3. **`site.json` 에 한 줄 더한다**

```json
{ "id": "앱이름", "name": "표시 이름", "tagline": "한 줄 소개" }
```

그리고:

```bash
node tools/build.mjs
```

`앱이름/privacy.html` 이 만들어지고 `index.html` 에 목록이 추가된다.

### ⚠ `app-ads.txt` 는 앱마다 만들지 않는다

**루트의 하나를 모든 앱이 같이 쓴다.** 게시자 ID 가 같은 AdMob 계정이면 그것으로 충분하다.
다른 광고 네트워크를 더할 때만 **줄을 추가**한다 — 파일을 나누지 않는다.

### ⚠ 빈칸이 남으면 빌드가 멈춘다

`privacy.md` 에 `[ 이름을 적으세요 ]` 같은 자리가 남아 있으면 `build.mjs` 가 오류를 내고 멈춘다.
**그게 그대로 웹에 뜨는 사고를 막는 유일한 장치다.**

---

## 게시

**Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**

첫 배포는 몇 분 걸린다. 배포 뒤 아래 둘이 열리는지 확인한다.

- <https://nohjs79-glitch.github.io/app-ads.txt>
- <https://nohjs79-glitch.github.io/chemiline/privacy.html>

⚠ **Play Console 「스토어 등록정보 → 웹사이트」에 `https://nohjs79-glitch.github.io` 를 넣어야**
광고 회사가 `app-ads.txt` 를 찾아온다. **파일만 올려서는 안 된다.**

---

## 줄바꿈

`.gitattributes` 가 **모든 파일을 LF 로** 못박는다.
`app-ads.txt` 가 CRLF 로 들어가면 크롤러가 못 읽는다 — 윈도우에서 작업하므로 특히 조심한다.
