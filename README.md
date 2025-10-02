# Noir Zero-Knowledge Proof 101 🔐

> Noir를 사용한 Zero-Knowledge Proof 완벽 가이드 (한글)

## 📖 소개

이 저장소는 Noir를 사용하여 Zero-Knowledge Proof 애플리케이션을 개발하는 방법을 처음부터 끝까지 배우는 종합 튜토리얼입니다.

**Noir**는 Zero-Knowledge Proof 회로를 쉽게 작성할 수 있는 도메인 특화 언어(DSL)로, 프라이버시를 보호하면서도 계산의 정확성을 증명할 수 있는 강력한 도구입니다.

## 🎯 학습 목표

이 튜토리얼을 완료하면 다음을 할 수 있습니다:

- ✅ Zero-Knowledge Proof의 개념과 동작 원리 이해
- ✅ Noir 언어로 회로(circuit) 작성
- ✅ 증명 생성 및 검증
- ✅ 웹 브라우저에서 실행되는 ZKP 애플리케이션 개발
- ✅ 블록체인과 통합

## 📚 튜토리얼 목차

### [Chapter 1: 설치 가이드](./tutorial/01-installation.md)
- Noir와 Zero-Knowledge Proof 개념
- Noir/Nargo 설치
- Barretenberg 백엔드 설치
- 개발 환경 구축

### [Chapter 2: 첫 프로젝트 생성과 기본 회로](./tutorial/02-first-project.md)
- Nargo로 프로젝트 생성
- 회로의 기본 구조 이해
- Private vs Public 입력
- Witness 개념
- 컴파일 및 실행

### [Chapter 3: Noir 언어 기초](./tutorial/03-language-basics.md)
- 데이터 타입 (Field, 정수, 배열, 구조체)
- 함수와 제어 흐름
- 연산자 사용법
- 트레이트와 제네릭
- Assert와 제약 조건

### [Chapter 4: 증명 생성과 검증](./tutorial/04-proof-generation.md)
- ZKP 동작 원리
- Barretenberg를 사용한 증명 생성
- 검증 키 이해
- Solidity 검증 계약 생성
- 실전 예제 (나이 검증, 투표 시스템)

### [Chapter 5: 실전 웹 애플리케이션](./tutorial/05-web-application.md)
- NoirJS 소개
- 브라우저 기반 ZKP 앱 개발
- 나이 검증 웹 앱 구축
- 블록체인 통합
- 배포 및 최적화

## 🚀 빠른 시작

### 필수 요구사항

- **Node.js** 18+
- **npm** 또는 **yarn**
- 터미널 (bash, zsh)

### 설치

```bash
# 1. Noir 설치
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
source ~/.zshrc  # 또는 source ~/.bashrc
noirup

# 2. Barretenberg 설치
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/next/barretenberg/bbup/install | bash
source ~/.bashrc
bbup

# 3. 설치 확인
nargo --version
bb --version
```

### 첫 번째 프로젝트

```bash
# 프로젝트 생성
nargo new hello_noir
cd hello_noir

# 회로 작성 (src/main.nr)
# fn main(x: Field, y: pub Field) {
#     assert(x != y);
# }

# 입력값 준비 (Prover.toml)
# x = "1"
# y = "2"

# 컴파일 및 실행
nargo compile
nargo execute

# 증명 생성
bb prove -b ./target/hello_noir.json -w ./target/hello_noir.gz --write-vk -o ./target

# 증명 검증
bb verify -p ./target/proof -k ./target/vk
```

## 💡 주요 예제

### 예제 1: 나이 검증

```rust
fn main(age: Field, min_age: pub Field) {
    assert(age >= min_age);
}
```

**용도**: 정확한 나이를 공개하지 않고 최소 나이 요구사항을 만족함을 증명

### 예제 2: 비밀번호 검증

```rust
fn simple_hash(password: Field) -> Field {
    password * password + password + 1
}

fn main(password: Field, expected_hash: pub Field) {
    let hash = simple_hash(password);
    assert(hash == expected_hash);
}
```

**용도**: 비밀번호를 공개하지 않고 올바른 비밀번호를 알고 있음을 증명

### 예제 3: 범위 증명

```rust
fn main(value: Field, min: pub Field, max: pub Field) {
    assert(value >= min);
    assert(value <= max);
}
```

**용도**: 정확한 값을 공개하지 않고 특정 범위 내에 있음을 증명

## 🛠️ 주요 명령어

### Nargo 명령어

```bash
nargo new <project>      # 새 프로젝트 생성
nargo check              # 문법 검증
nargo compile            # 회로 컴파일
nargo execute            # 회로 실행 (witness 생성)
nargo test               # 테스트 실행
nargo info               # 회로 정보 확인
```

### Barretenberg 명령어

```bash
bb prove                 # 증명 생성
bb verify                # 증명 검증
bb write_vk              # 검증 키 생성
bb contract              # Solidity 계약 생성
```

## 📂 프로젝트 구조

```
zpf-101/
├── README.md                    # 이 파일
├── tutorial/                    # 튜토리얼 문서
│   ├── 01-installation.md
│   ├── 02-first-project.md
│   ├── 03-language-basics.md
│   ├── 04-proof-generation.md
│   └── 05-web-application.md
└── examples/                    # 예제 코드 (여기에 실습 프로젝트 추가)
    ├── hello_world/
    ├── age_verification/
    └── voting_system/
```

## 🎓 Zero-Knowledge Proof란?

Zero-Knowledge Proof(영지식 증명)는 어떤 정보를 공개하지 않으면서도 그 정보를 알고 있다는 사실을 증명하는 암호학적 방법입니다.

### 3가지 핵심 속성

1. **완전성 (Completeness)**: 진실한 증명자는 항상 검증자를 설득할 수 있음
2. **건전성 (Soundness)**: 거짓 증명자는 검증자를 속일 수 없음
3. **영지식성 (Zero-Knowledge)**: 증명 자체는 비밀 정보를 노출하지 않음

### 실생활 예시

- 🎂 나이가 18세 이상임을 증명하되, 정확한 나이는 공개하지 않음
- 🔑 비밀번호를 알고 있음을 증명하되, 비밀번호 자체는 노출하지 않음
- 💰 계좌 잔고가 충분함을 증명하되, 정확한 금액은 숨김

## 🌟 주요 특징

### Noir의 장점

- 🦀 **Rust-like 문법**: 배우기 쉬움
- 🔧 **백엔드 독립적**: 다양한 증명 시스템 지원
- ⚡ **빠른 컴파일**: 효율적인 ACIR 생성
- 🌐 **웹 지원**: NoirJS로 브라우저에서 실행
- 🔗 **블록체인 통합**: Solidity 검증 계약 자동 생성

### 사용 사례

- 🗳️ 익명 투표 시스템
- 🏦 프라이빗 금융 거래
- 🎫 신원 확인 (KYC)
- 🎮 게임 로직 보호
- 🔐 비밀 멤버십 증명

## 📖 참고 자료

### 공식 문서
- [Noir 공식 문서](https://noir-lang.org/docs/)
- [Barretenberg 문서](https://barretenberg.aztec.network)
- [Noir GitHub](https://github.com/noir-lang/noir)

### 커뮤니티
- [Noir Discord](https://discord.gg/JtqzkdeQ6G)
- [Noir Forum](https://forum.aztec.network/c/noir/7)
- [Twitter @NoirLang](https://twitter.com/NoirLang)

### 추가 학습 자료
- [Awesome Noir](https://github.com/noir-lang/awesome-noir)
- [ZK Learning Resources](https://zkp.science)

## 🤝 기여하기

이 튜토리얼에 기여하고 싶으시다면:

1. 이 저장소를 Fork
2. 새 브랜치 생성 (`git checkout -b feature/improvement`)
3. 변경사항 커밋 (`git commit -am 'Add new tutorial'`)
4. 브랜치에 푸시 (`git push origin feature/improvement`)
5. Pull Request 생성

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## ❓ FAQ

### Q: Noir를 배우려면 암호학 지식이 필요한가요?
A: 아니요! 기본적인 프로그래밍 지식만 있으면 됩니다. 암호학은 자연스럽게 배우게 됩니다.

### Q: Noir는 어떤 블록체인과 호환되나요?
A: Ethereum, Polygon, Arbitrum 등 EVM 호환 체인 모두 지원합니다.

### Q: 증명 생성에 얼마나 걸리나요?
A: 간단한 회로는 1-2초, 복잡한 회로는 수십 초 정도 소요됩니다.

### Q: 프로덕션에서 사용할 수 있나요?
A: Noir는 활발히 개발 중이며, 많은 프로젝트에서 이미 사용하고 있습니다. 하지만 감사를 거친 후 사용을 권장합니다.

## 🎉 시작하기

준비되셨나요? [Chapter 1: 설치 가이드](./tutorial/01-installation.md)로 시작하세요!

---

**만든 이**: Noir 커뮤니티 기여자들
**마지막 업데이트**: 2025-10-03

질문이나 피드백이 있으시면 [Issues](https://github.com/noir-lang/noir/issues)에 남겨주세요! 🚀
