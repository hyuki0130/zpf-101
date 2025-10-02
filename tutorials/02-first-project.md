# Chapter 2: 첫 프로젝트 생성과 기본 회로

## 🎯 학습 목표
- Nargo를 사용한 프로젝트 생성
- Noir 회로(circuit)의 기본 구조 이해
- 첫 번째 회로 컴파일 및 실행
- Witness 개념 이해

## 📦 새 프로젝트 생성

### 프로젝트 생성 명령어

```bash
nargo new hello_world
cd hello_world
```

이 명령어는 다음과 같은 디렉토리 구조를 생성합니다:

```
hello_world/
├── Nargo.toml          # 프로젝트 설정 파일
└── src/
    └── main.nr         # 메인 회로 코드
```

### Nargo.toml 파일

```toml
[package]
name = "hello_world"
type = "bin"
authors = [""]
compiler_version = ">=0.25.0"

[dependencies]
```

**주요 필드:**
- `name`: 프로젝트 이름
- `type`: 프로젝트 타입 (`bin`, `lib`, `contract`)
- `compiler_version`: 필요한 최소 컴파일러 버전
- `dependencies`: 외부 라이브러리 의존성

## 🔍 첫 번째 회로 이해하기

### 기본 생성된 코드 (src/main.nr)

```rust
fn main(x: Field, y: pub Field) {
    assert(x != y);
}
```

### 코드 분석

#### 1. main 함수
```rust
fn main(x: Field, y: pub Field)
```

- **`fn main`**: 회로의 진입점 (entry point)
- **매개변수**: 회로의 입력값들
  - `x: Field` - **Private** 입력 (기본값)
  - `y: pub Field` - **Public** 입력 (`pub` 키워드 사용)

#### 2. Field 타입

**Field**는 Noir의 기본 타입으로, 유한체(Finite Field)의 원소를 나타냅니다.

- 암호학적 연산의 기본 단위
- 매우 큰 소수를 법으로 하는 정수
- 모든 Noir 타입의 기본 구성 요소

#### 3. Private vs Public

| 구분 | Private | Public |
|------|---------|--------|
| 키워드 | (기본값) | `pub` |
| 증명자(Prover) | 알고 있음 ✅ | 알고 있음 ✅ |
| 검증자(Verifier) | 모름 ❌ | 알고 있음 ✅ |
| 용도 | 비밀 정보 | 공개 정보 |

**예시:**
- Private: 비밀번호, 개인키, 정확한 나이
- Public: 해시값, 공개키, "18세 이상" 여부

#### 4. assert 문

```rust
assert(x != y);
```

- **제약 조건(constraint)**을 생성
- 조건이 거짓이면 증명 생성 실패
- 회로의 핵심 로직을 구성

## 💾 입력값 준비하기

### Prover.toml 파일 생성

프로젝트 루트에 `Prover.toml` 파일을 생성합니다:

```bash
# 파일 위치: hello_world/Prover.toml
```

```toml
x = "1"
y = "2"
```

**설명:**
- Private 입력 `x = 1`
- Public 입력 `y = 2`
- Field 타입은 문자열로 표현

### 다양한 값 형식

```toml
# 10진수
x = "1"

# 16진수
x = "0x01"

# 큰 숫자
x = "123456789012345678901234567890"
```

## 🔨 컴파일하기

### 1. 회로 검증

먼저 회로에 문법 오류가 없는지 확인합니다:

```bash
nargo check
```

**출력 예시:**
```
[hello_world] Constraint system successfully built!
```

### 2. 회로 컴파일

```bash
nargo compile
```

**생성되는 파일:**
```
target/
└── hello_world.json    # ACIR 바이트코드
```

**ACIR (Abstract Circuit Intermediate Representation):**
- Noir 코드가 컴파일된 중간 표현
- 백엔드 독립적인 회로 설명
- JSON 형식으로 저장

## ▶️ 회로 실행하기

### Execute 명령어

```bash
nargo execute
```

**이 명령어가 하는 일:**
1. `Prover.toml`에서 입력값 읽기
2. 회로 실행
3. **Witness** 생성
4. 제약 조건 검증

**성공 시 출력:**
```
[hello_world] Circuit witness successfully solved
```

**생성되는 파일:**
```
target/
├── hello_world.json
└── hello_world.gz      # Witness 파일 (압축됨)
```

### Witness란?

**Witness**는 회로의 모든 중간 계산 값들을 포함하는 데이터입니다.

```
입력 (x=1, y=2)
    ↓
회로 실행 (x != y 검증)
    ↓
Witness (모든 중간값 포함)
    ↓
증명 생성에 사용
```

## 🧪 실습 예제

### 예제 1: 값 수정 테스트

**1) 같은 값 입력하기**

`Prover.toml`:
```toml
x = "1"
y = "1"
```

```bash
nargo execute
```

**예상 결과:** 에러 발생 (x != y 조건 위반)

**2) 다른 값 입력하기**

`Prover.toml`:
```toml
x = "100"
y = "200"
```

```bash
nargo execute
```

**예상 결과:** 성공

### 예제 2: 간단한 덧셈 회로

`src/main.nr`:
```rust
fn main(x: Field, y: Field, sum: pub Field) {
    assert(x + y == sum);
}
```

`Prover.toml`:
```toml
x = "5"
y = "10"
sum = "15"
```

```bash
nargo check
nargo execute
```

**회로 설명:**
- Private 입력: `x`, `y` (비밀로 유지)
- Public 입력: `sum` (공개)
- 검증: x + y가 sum과 같은지 확인
- **의미**: "sum은 두 비밀 숫자의 합입니다" 증명 (숫자 자체는 공개하지 않음)

### 예제 3: 범위 검증

`src/main.nr`:
```rust
fn main(age: Field, min_age: pub Field) {
    assert(age >= min_age);
}
```

`Prover.toml`:
```toml
age = "25"
min_age = "18"
```

```bash
nargo check
nargo execute
```

**회로 설명:**
- Private: `age` (정확한 나이는 비밀)
- Public: `min_age` (최소 나이 요구사항)
- 검증: 나이가 최소 요구사항을 만족하는지
- **의미**: "나는 18세 이상입니다" 증명 (정확한 나이는 공개하지 않음)

## 📊 회로 정보 확인

### nargo info 명령어

회로의 복잡도를 확인할 수 있습니다:

```bash
nargo info
```

**출력 예시:**
```
+-----------------------+----------+--------+
| Package               | ACIR Opcodes | Backend Circuit Size |
+-----------------------+----------+--------+
| hello_world           | 1        | 1     |
+-----------------------+----------+--------+
```

**의미:**
- **ACIR Opcodes**: 회로의 연산 개수
- **Circuit Size**: 백엔드에서의 회로 크기
- 숫자가 작을수록 효율적인 회로

## 🎓 핵심 개념 정리

### 1. 회로 개발 워크플로우

```
코드 작성 (main.nr)
    ↓
입력 준비 (Prover.toml)
    ↓
검증 (nargo check)
    ↓
컴파일 (nargo compile) → ACIR 생성
    ↓
실행 (nargo execute) → Witness 생성
    ↓
증명 생성 (다음 챕터에서)
```

### 2. Noir의 핵심 원칙

1. **제약 조건 기반**: `assert`로 회로의 로직 정의
2. **명시적 타입**: 모든 변수는 타입 지정 필요
3. **불변성**: 기본적으로 변수는 불변 (mutable은 `mut` 키워드 필요)
4. **컴파일 타임 크기**: 배열 크기 등은 컴파일 시점에 결정

### 3. Private vs Public 선택 가이드

**Private으로 해야 하는 경우:**
- 개인정보 (나이, 소득, 위치 등)
- 인증 정보 (비밀번호, 개인키 등)
- 민감한 비즈니스 로직의 입력값

**Public으로 해야 하는 경우:**
- 검증자가 알아야 하는 정보
- 계산 결과
- 제3자가 확인해야 하는 값

## ✅ 체크리스트

다음 작업들을 직접 수행해보세요:

- [ ] `hello_world` 프로젝트 생성
- [ ] 기본 회로 컴파일 및 실행
- [ ] 다른 입력값으로 테스트
- [ ] 덧셈 회로 예제 실행
- [ ] 범위 검증 회로 예제 실행
- [ ] `nargo info`로 회로 정보 확인

## 🚀 다음 단계

이제 Noir 언어의 기본 문법과 데이터 타입에 대해 자세히 알아봅시다!

👉 [Chapter 3: Noir 언어 기초](./03-language-basics.md)

## 💡 문제 해결

### 오류: "Could not resolve dependency"
- `Nargo.toml`의 의존성 확인
- `nargo check` 먼저 실행

### 오류: "Circuit execution failed"
- `Prover.toml`의 입력값 확인
- `assert` 조건이 만족되는지 확인
- 타입이 올바른지 확인

### 오류: "Could not find witness file"
- `nargo execute`를 먼저 실행했는지 확인
- `target/` 디렉토리 존재 확인
