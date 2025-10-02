# Chapter 1: Noir 설치 가이드

## 🎯 학습 목표
- Noir와 Zero-Knowledge Proof의 개념 이해
- Noir 개발 환경 구축
- Barretenberg 백엔드 설치

## 📚 Noir란?

**Noir**는 Zero-Knowledge Proof 프로그램을 안전하고 원활하게 작성하기 위한 도메인 특화 언어(DSL)입니다.

### 주요 특징
- **프라이버시 보호**: 입력 데이터를 모두 공개하지 않고도 계산의 정확성을 증명
- **백엔드 독립적**: 다양한 증명 시스템과 호환
- **Solidity 통합**: 블록체인 검증을 위한 Solidity verifier 생성 가능
- **ACIR 컴파일**: 중간 언어(ACIR)로 컴파일되어 다양한 백엔드 지원

### Zero-Knowledge Proof란?

ZKP는 어떤 정보(witness)를 공개하지 않으면서도 그 정보를 알고 있다는 사실을 증명하는 암호학적 방법입니다.

**실생활 예시:**
- 나이가 18세 이상임을 증명하되, 정확한 나이는 공개하지 않음
- 비밀번호를 알고 있음을 증명하되, 비밀번호 자체는 노출하지 않음
- 계좌 잔고가 충분함을 증명하되, 정확한 금액은 숨김

## 🛠️ 설치 과정

### 1. Noir 설치 (noirup)

Noir는 `noirup`이라는 설치 스크립트를 통해 설치합니다.

```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
```

**이 명령어가 하는 일:**
- `noirup` 설치 스크립트를 다운로드
- `~/.nargo/bin` 디렉토리에 Noir 바이너리 설치
- 쉘 설정 파일(`.bashrc` 또는 `.zshrc`)에 PATH 추가

**설치 후 필수 단계:**

```bash
# zsh 사용자
source ~/.zshrc

# bash 사용자
source ~/.bashrc

# 또는 새 터미널 세션 시작
```

### 2. Nargo 설치

`noirup`을 실행하여 Nargo를 설치합니다:

```bash
noirup
```

**Nargo란?**
- Noir의 패키지 매니저이자 컴파일러
- Rust의 Cargo와 유사한 역할
- 프로젝트 생성, 컴파일, 테스트 등을 담당

**설치 확인:**

```bash
nargo --version
```

예상 출력:
```
nargo version = 1.0.0-beta.13
noirc version = 1.0.0-beta.13+6e469c3004209a8b107e7707306e25c80a110fd6
```

### 3. Barretenberg 백엔드 설치

Zero-Knowledge Proof를 실제로 생성하고 검증하려면 백엔드가 필요합니다.

**Barretenberg란?**
- 최적화된 타원 곡선 라이브러리
- PLONK SNARK prover 구현체
- Aztec Protocol에서 개발
- Noir와 긴밀하게 통합되도록 설계됨

**설치 명령어:**

```bash
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/next/barretenberg/bbup/install | bash
```

**설치 후:**

```bash
# 설정 리로드
source ~/.bashrc  # 또는 source ~/.zshrc

# bbup 실행
bbup
```

`bbup`은 자동으로 Nargo 버전을 감지하고 호환되는 Barretenberg 버전을 설치합니다.

**설치 확인:**

```bash
bb --version
```

## 🔍 설치 구조 이해

### 디렉토리 구조

```
~/.nargo/
  └── bin/
      └── nargo          # Noir 컴파일러 및 패키지 매니저

~/.bb/
  ├── bbup              # Barretenberg 설치 스크립트
  └── bin/
      └── bb            # Barretenberg 백엔드 바이너리
```

### 역할 분담

| 도구 | 역할 |
|------|------|
| **Noir/Nargo** | 회로(circuit) 작성 및 컴파일, ACIR 생성 |
| **Barretenberg** | 증명(proof) 생성 및 검증, 검증자 계약 생성 |

## ✅ 설치 점검

다음 명령어들이 모두 정상적으로 실행되는지 확인하세요:

```bash
# 1. Nargo 버전 확인
nargo --version

# 2. Barretenberg 버전 확인
bb --version

# 3. Nargo 도움말
nargo --help
```

## 🚀 다음 단계

설치가 완료되었다면, 다음 챕터로 이동하여 첫 번째 Noir 프로젝트를 만들어봅시다!

👉 [Chapter 2: 첫 프로젝트 생성과 기본 회로](./02-first-project.md)

## 📖 참고 자료

- [Noir 공식 문서](https://noir-lang.org/docs/)
- [Barretenberg 문서](https://barretenberg.aztec.network)
- [Noir GitHub](https://github.com/noir-lang)
- [Noir Discord 커뮤니티](https://discord.gg/JtqzkdeQ6G)
