# Chapter 4: 증명 생성과 검증

## 🎯 학습 목표
- Zero-Knowledge Proof의 동작 원리 이해
- Barretenberg를 사용한 증명 생성
- 증명 검증 프로세스
- 검증 키(Verification Key) 이해
- 실전 증명 생성 워크플로우

## 🔐 Zero-Knowledge Proof 동작 원리

### ZKP의 3가지 속성

1. **완전성 (Completeness)**
   - 진실한 증명자는 항상 검증자를 설득할 수 있음
   - 올바른 입력이면 증명 생성 성공

2. **건전성 (Soundness)**
   - 거짓 증명자는 검증자를 속일 수 없음
   - 잘못된 입력으로는 유효한 증명 생성 불가

3. **영지식성 (Zero-Knowledge)**
   - 증명 자체는 비밀 정보를 노출하지 않음
   - 검증자는 증명이 유효하다는 것만 확인 가능

### ZKP 워크플로우

```
┌─────────────┐
│  Noir 코드   │  회로 작성
│  (main.nr)  │
└──────┬──────┘
       │
       │ nargo compile
       ↓
┌─────────────┐
│    ACIR     │  중간 표현
│  (.json)    │
└──────┬──────┘
       │
       │ + Prover.toml (입력값)
       ↓
┌─────────────┐
│   Witness   │  모든 중간 계산값
│    (.gz)    │
└──────┬──────┘
       │
       │ bb prove
       ↓
┌─────────────┐
│    Proof    │  영지식 증명
│             │
└──────┬──────┘
       │
       │ bb verify
       ↓
┌─────────────┐
│   Valid ✓   │  검증 완료
└─────────────┘
```

## 🛠️ Barretenberg 사용하기

### 기본 명령어

Barretenberg(`bb`)는 다음 주요 기능을 제공합니다:

| 명령어 | 설명 |
|--------|------|
| `bb prove` | 증명 생성 |
| `bb verify` | 증명 검증 |
| `bb write_vk` | 검증 키 생성 |
| `bb contract` | Solidity 검증 계약 생성 |

## 📝 증명 생성 실습

### 예제: 나이 검증 회로

**1단계: 회로 작성**

`src/main.nr`:
```rust
fn main(age: Field, min_age: pub Field) {
    assert(age >= min_age);
}
```

**의미:**
- Private: `age` (실제 나이는 비밀)
- Public: `min_age` (최소 나이 요구사항)
- 증명: "나는 최소 나이 요구사항을 만족합니다"

**2단계: 입력값 준비**

`Prover.toml`:
```toml
age = "25"
min_age = "18"
```

**3단계: 컴파일**

```bash
nargo compile
```

생성되는 파일:
```
target/
└── age_verification.json    # ACIR 바이트코드
```

**4단계: Witness 생성**

```bash
nargo execute
```

생성되는 파일:
```
target/
├── age_verification.json
└── age_verification.gz      # Witness 파일
```

**5단계: 검증 키 생성** ⚠️ (증명 생성 전 필수!)

```bash
bb write_vk -b ./target/age_verification.json -o ./target
```

**왜 먼저 필요한가?**
- 최신 `bb` 버전에서는 증명 생성 시 검증 키가 필요
- 회로 구조에 대한 정보를 포함
- 한 번 생성하면 재사용 가능

**처음 실행 시:**
```
Scheme is: ultra_honk, num threads: 14
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  256k  100  256k    0     0   609k      0 --:--:-- --:--:-- --:--:--  609k
VK saved to "./target/vk"
```

**다운로드 내역**: CRS (Common Reference String) 파일 (한 번만 다운로드, 이후 캐시 사용)

생성되는 파일:
```
target/
├── age_verification.json
├── age_verification.gz
└── vk                        # 검증 키
```

**6단계: 증명 생성**

**방법 1: 검증 키를 이미 생성한 경우**
```bash
bb prove -b ./target/age_verification.json -w ./target/age_verification.gz -o ./target
```

**방법 2: 검증 키와 증명을 동시에 생성**
```bash
bb prove -b ./target/age_verification.json -w ./target/age_verification.gz --write_vk -o ./target
```

**명령어 분석:**
- `-b`: 바이트코드 파일 경로 (ACIR)
- `-w`: Witness 파일 경로
- `-o`: 출력 디렉토리
- `--write_vk`: 검증 키도 함께 생성 (선택사항)

생성되는 파일:
```
target/
├── age_verification.json
├── age_verification.gz
├── vk                        # 검증 키 (이미 있거나 --write_vk로 생성)
└── proof                     # 생성된 증명!
```

**7단계: 증명 검증**

```bash
bb verify -p ./target/proof -k ./target/vk
```

**성공 출력:**
```
Proof verification successful!
```

## 🔑 검증 키 (Verification Key) 이해

### 검증 키란?

검증 키는 증명을 검증하기 위해 필요한 공개 정보입니다.

**특징:**
- 회로 구조에 대한 정보 포함
- 한 번 생성하면 재사용 가능
- 블록체인 검증에 필수

### 키 생성 옵션

```bash
# 별도로 검증 키만 생성 (권장)
bb write_vk -b ./target/circuit.json -o ./target

# 증명 생성과 동시에 검증 키 생성
bb prove -b ./target/circuit.json -w ./target/circuit.gz --write_vk -o ./target
```

**참고**: 언더스코어(`_`)를 사용합니다: `--write_vk` (하이픈이 아님!)

## 🎭 Public Inputs 이해

### Public Inputs의 역할

Public 입력값은 증명의 일부로 포함됩니다.

**예제로 이해하기:**

```rust
fn main(secret: Field, hash: pub Field) {
    // secret의 제곱이 hash와 같은지 검증
    assert(secret * secret == hash);
}
```

`Prover.toml`:
```toml
secret = "5"
hash = "25"
```

**증명의 의미:**
- "나는 제곱하면 25가 되는 어떤 수를 알고 있습니다"
- 검증자는 25(hash)를 알지만, 5(secret)는 모름
- 증명에는 hash 값이 포함되어 있음

### Proof 파일 구조

증명 파일의 첫 부분에는 public inputs가 포함됩니다:

```
[public input 1]
[public input 2]
...
[proof data]
```

## 🔄 완전한 워크플로우 예제

### 예제: 비밀번호 해시 검증

**시나리오:**
- 사용자가 비밀번호를 알고 있음을 증명
- 비밀번호 자체는 공개하지 않음
- 해시값만 공개

**1. 회로 작성**

`src/main.nr`:
```rust
// 간단한 해시 함수 (실제로는 더 복잡한 해시 사용)
fn simple_hash(password: Field) -> Field {
    password * password + password + 1
}

fn main(password: Field, expected_hash: pub Field) {
    let hash = simple_hash(password);
    assert(hash == expected_hash);
}
```

**2. 입력값 계산**

먼저 예상 해시를 계산합니다:
- password = 12345
- hash = 12345 * 12345 + 12345 + 1 = 152415846

`Prover.toml`:
```toml
password = "12345"
expected_hash = "152415846"
```

**3. 전체 명령어 실행**

```bash
# 컴파일
nargo compile

# Witness 생성
nargo execute

# 검증 키 생성
bb write_vk -b ./target/password_check.json -o ./target

# 증명 생성
bb prove -b ./target/password_check.json \
         -w ./target/password_check.gz \
         -o ./target

# 증명 검증
bb verify -p ./target/proof -k ./target/vk
```

**4. 검증 성공!**

검증자는:
- ✅ 증명이 유효함을 확인
- ✅ expected_hash가 152415846임을 알고 있음
- ❌ password가 12345인지는 모름

## 🌐 블록체인 검증 (Solidity Verifier)

### Solidity 검증 계약 생성

Noir 증명을 블록체인에서 검증할 수 있습니다.

```bash
bb contract -o ./target
```

생성되는 파일:
```
target/
└── contract.sol              # Solidity 검증 계약
```

### 검증 계약 구조

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UltraVerifier {
    function verify(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external view returns (bool) {
        // 증명 검증 로직
        // ...
        return true;
    }
}
```

### 사용 예시

```solidity
contract MyDApp {
    UltraVerifier verifier;

    function verifyAge(bytes calldata proof, uint256 minAge) external {
        bytes32[] memory publicInputs = new bytes32[](1);
        publicInputs[0] = bytes32(minAge);

        require(
            verifier.verify(proof, publicInputs),
            "Age verification failed"
        );

        // 검증 성공 후 로직
    }
}
```

## 🧪 실전 예제: 투표 시스템

### 요구사항

익명 투표 시스템을 만듭니다:
- 투표자는 자신의 신원을 공개하지 않음
- 유효한 투표권이 있음을 증명
- 중복 투표 방지

### 회로 구성

`src/main.nr`:
```rust
use std::hash::pedersen_hash;

fn main(
    // Private inputs
    voter_id: Field,
    secret_key: Field,
    vote: Field,

    // Public inputs
    voter_commitment: pub Field,
    vote_hash: pub Field,
) {
    // 1. 투표자 신원 검증
    let computed_commitment = pedersen_hash([voter_id, secret_key]);
    assert(computed_commitment == voter_commitment);

    // 2. 투표 선택 검증 (0 또는 1만 가능)
    assert(vote * (vote - 1) == 0);

    // 3. 투표 해시 검증
    let computed_vote_hash = pedersen_hash([voter_id, vote]);
    assert(computed_vote_hash == vote_hash);
}
```

### 입력값 예시

`Prover.toml`:
```toml
voter_id = "12345"
secret_key = "67890"
vote = "1"
voter_commitment = "0x0539222e70963aab30360452087fa38862c31537d679aa427324eb8622d34243"
vote_hash = "0x0a2117377b0ea781202c90d57ddc28c4a98ad83879c0bc1132cca576ff99e9bf"
```

**계산 방법:**
- `voter_commitment = pedersen_hash([12345, 67890])`
- `vote_hash = pedersen_hash([12345, 1])`

### 증명 생성 및 검증

```bash
# 컴파일
nargo compile

# 실행
nargo execute

# 검증 키 생성
bb write_vk -b ./target/voting.json -o ./target

# 증명 생성
bb prove -b ./target/voting.json -w ./target/voting.gz -o ./target

# 검증
bb verify -p ./target/proof -k ./target/vk
```

**이 시스템의 장점:**
- 🔒 투표자 신원 보호
- ✅ 유효한 투표권 증명
- 🚫 중복 투표 방지 (vote_hash로 추적)
- 🌐 블록체인에 증명 저장 가능

## 📊 증명 크기와 성능

### 증명 크기

일반적인 증명 크기:
- **PLONK 증명**: ~2KB
- **UltraPlonk 증명**: ~2-4KB

**장점:**
- 상수 크기 (회로 복잡도와 무관)
- 빠른 검증 시간
- 블록체인에 적합

### 성능 비교

| 회로 복잡도 | 증명 생성 시간 | 검증 시간 |
|-------------|----------------|-----------|
| 간단 (< 1K gates) | ~1초 | ~수 ms |
| 중간 (1K-10K gates) | ~수 초 | ~수 ms |
| 복잡 (> 10K gates) | ~수십 초 | ~수 ms |

**최적화 팁:**
- 루프 최소화
- Field 연산 선호
- Unconstrained 함수 활용

## 🎯 Unconstrained 함수 활용

복잡한 계산을 증명 밖에서 수행하여 효율성 향상:

```rust
// Unconstrained: 증명에 포함되지 않음
unconstrained fn complex_computation(x: Field) -> Field {
    // 복잡한 계산
    let mut result = x;
    for i in 0..1000 {
        result = result * result + i as Field;
    }
    result
}

fn main(input: Field, output: pub Field) {
    // unsafe 블록에서 호출
    let computed = unsafe {
        complex_computation(input)
    };

    // 결과만 제약 조건으로 검증
    assert(computed == output);
}
```

**장점:**
- 증명 생성 시간 단축
- 회로 크기 감소
- 복잡한 로직 처리 가능

**주의사항:**
- 결과는 반드시 검증 필요
- 보안 주석 필수

## ✅ 실습 체크리스트

다음 작업들을 직접 수행해보세요:

- [ ] 간단한 회로 작성 (덧셈 검증)
- [ ] Witness 생성 (`nargo execute`)
- [ ] 검증 키 생성 (`bb write_vk`) ⚠️ 증명 생성 전 필수!
- [ ] 증명 생성 (`bb prove`)
- [ ] 증명 검증 (`bb verify`)
- [ ] 나이 검증 회로 실행
- [ ] 비밀번호 해시 회로 실행
- [ ] Solidity 검증 계약 생성
- [ ] `nargo info`로 회로 크기 확인

## 🚀 다음 단계

이제 실제 웹 애플리케이션을 만들어봅시다!

👉 [Chapter 5: 실전 웹 애플리케이션](./05-web-application.md)

## 📚 참고 자료

- [Barretenberg 공식 문서](https://barretenberg.aztec.network)
- [PLONK 논문](https://eprint.iacr.org/2019/953)
- [Noir 표준 라이브러리](https://noir-lang.org/docs/noir/standard_library)

## 💡 자주 묻는 질문

**Q: 증명 파일을 공유해도 안전한가요?**
A: 네! 증명 파일은 비밀 정보를 포함하지 않습니다. 공개해도 안전합니다.

**Q: 같은 입력으로 여러 번 증명을 만들면?**
A: 매번 다른 증명이 생성됩니다. 이는 무작위성(randomness)이 포함되기 때문입니다.

**Q: 검증 키를 여러 번 생성해야 하나요?**
A: 아니요. 회로가 변경되지 않는 한 한 번만 생성하면 됩니다.

**Q: Public input이 많으면 증명 크기가 커지나요?**
A: 네, public input은 증명에 포함되므로 약간 커집니다. 하지만 여전히 효율적입니다.

**Q: Nargo와 bb의 차이는?**
A: Nargo는 회로 작성 및 컴파일, bb는 증명 생성 및 검증을 담당합니다.

**Q: bb가 네트워크 통신을 하는 이유는?**
A: 처음 실행 시 CRS (Common Reference String) 파일을 다운로드합니다. 이는 ZKP에 필요한 공개 암호학 파라미터로, 한 번만 다운로드되고 `~/.bb-crs`에 캐시됩니다. 이후에는 완전히 로컬에서 동작합니다.

**Q: "Unable to open file: ./target/vk" 오류가 발생하면?**
A: 증명 생성 전에 검증 키를 먼저 생성해야 합니다. `bb write_vk -b ./target/circuit.json -o ./target` 명령을 먼저 실행하거나, `bb prove`에 `--write_vk` 플래그를 추가하세요.
