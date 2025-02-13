# ReLease
ReLease의 백엔드 레포지토리입니다

## 🖤 커밋 메시지 컨벤션

<aside>
### 1. 커밋 유형 지정

- 커밋 유형은 영어로 작성한 후, : 로 제목과 분리


    | 커밋 유형 | 의미 |
    | --- | --- |
    | feat | 새로운 기능 추가 |
    | mod | 기존에 존재하는 기능에서 변경 사항 추가 |
    | fix | 버그 수정 |
    | docs | 문서 수정 |
    | refactor | 코드 리팩토링 |
    | test | 테스트 코드, 리팩토링 테스트 코드 추가 |
    | chore | 패키지 매니저 수정, 그 외 기타 수정 ex) .gitignore |
    | comment | 필요한 주석 추가 및 변경 |
    | rename | 파일 또는 폴더 명을 수정하거나 옮기는 작업만인 경우 |
    | remove | 파일을 삭제하는 작업만 수행한 경우 |
    | !BREAKING CHANGE | 커다란 API 변경의 경우 |
    | !HOTFIX | 급하게 치명적인 버그를 고쳐야 하는 경우 |

### 2. 제목과 본문을 빈행으로 분리

- 커밋 유형 이후 제목과 본문은 한글로 작성하여 내용이 잘 전달될 수 있도록 할 것
- 본문에는 변경한 내용과 이유 설명 (어떻게보다는 무엇 & 왜를 설명)

### 3. 끝에는 `.` 금지

### 4. 제목은 50자 이내로 할 것

### 6. 여러가지 항목이 있다면 글머리 기호를 통해 가독성 높이기

```
- 변경 내용 1
- 변경 내용 2
- 변경 내용 3
```

### 🖤 한 커밋에는 한 가지 문제만!

- 추적 가능하게 유지해주기
- 너무 많은 문제를 한 커밋에 담으면 추적하기 어려움

### 바람직한 커밋

```
feat::프로필에 모국어 설정 기능 추가
    - lang 클릭 시 언어 목록 모달 띄워줌
design::시간표 레이아웃 수정
    - 요일 별 행 너비가 안 맞는 문제 해결
```
