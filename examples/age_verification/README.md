# Age Verification - 나이 검증 ZKP 예제

이 예제는 Zero-Knowledge Proof를 사용하여 실제 나이를 공개하지 않고 최소 나이 요구사항을 만족함을 증명합니다.

## 🎯 시나리오

**사용자**: "저는 18세 이상입니다" (실제 나이는 비밀)
**서비스**: "증명이 유효합니다. 서비스를 이용하세요!" (실제 나이를 모름)

## 📁 프로젝트 구조

```
age_verification/
├── src/
│   └── main.nr          # Noir 회로 코드
├── Prover.toml          # 사용자의 비밀 입력값
├── Nargo.toml           # 프로젝트 설정
└── target/              # 컴파일 결과물
    ├── age_verification.json  # ACIR 바이트코드
    ├── age_verification.gz    # Witness 파일
    ├── vk                     # 검증 키
    └── proof                  # 생성된 증명
```

## 🔐 회로 설명

`src/main.nr`:
```rust
fn main(age: u8, min_age: pub u8) {
    assert(age >= min_age);
}
```

- **Private 입력**: `age` - 사용자의 실제 나이 (비밀)
- **Public 입력**: `min_age` - 서비스의 최소 나이 요구사항 (공개)
- **증명**: "age >= min_age를 만족하는 age 값을 알고 있습니다"

## 🚀 실행 방법

### 1단계: 입력값 설정

`Prover.toml`에 실제 데이터를 입력합니다:
```toml
age = "25"        # 비밀: 실제 나이
min_age = "18"    # 공개: 최소 나이 요구사항
```

### 2단계: 컴파일

```bash
nargo compile
```

**생성되는 파일**: `target/age_verification.json` (ACIR 바이트코드)

### 3단계: Witness 생성

```bash
nargo execute
```

**생성되는 파일**: `target/age_verification.gz` (모든 중간 계산값)

이 단계에서 회로가 실제로 실행되어 `25 >= 18` 조건이 만족되는지 확인합니다.

### 4단계: 검증 키 생성 (⚠️ 중요!)

```bash
bb write_vk -b ./target/age_verification.json -o ./target
```

**생성되는 파일**: `target/vk` (검증 키)

**왜 필요한가?**
- 증명 생성 전에 검증 키가 필요합니다
- 한 번만 생성하면 계속 재사용 가능
- 회로가 변경되지 않는 한 다시 생성할 필요 없음

### 5단계: 증명 생성

```bash
bb prove -b ./target/age_verification.json -w ./target/age_verification.gz -o ./target
```

**생성되는 파일**: `target/proof` (약 2KB 크기의 증명)

**대안 (검증 키 동시 생성)**:
```bash
bb prove -b ./target/age_verification.json -w ./target/age_verification.gz --write_vk -o ./target
```

**참고**: 플래그는 언더스코어(`_`)를 사용합니다: `--write_vk` (하이픈이 아님!)

### 6단계: 증명 검증

```bash
bb verify -p ./target/proof -k ./target/vk
```

**성공 시 출력**:
```
Proof verification successful!
```

## 🔍 오류 해결

### ❌ "Unable to open file: ./target/vk"

**원인**: 검증 키가 생성되지 않았습니다.

**해결 방법**:
```bash
# 방법 1: 검증 키 먼저 생성
bb write_vk -b ./target/age_verification.json -o ./target

# 방법 2: 증명 생성 시 --write-vk 플래그 사용
bb prove -b ./target/age_verification.json -w ./target/age_verification.gz --write-vk -o ./target
```

## 🎭 역할 구분

### 증명자 (Prover) - 사용자/클라이언트
1. `Prover.toml`에 실제 데이터 입력
2. `nargo execute`로 Witness 생성
3. `bb prove`로 증명 생성
4. **서버에 전송**: `proof` 파일만

### 검증자 (Verifier) - 서버/백엔드
1. `vk` (검증 키) 보관
2. 사용자로부터 `proof` 수신
3. `bb verify`로 검증
4. ✅ 유효성 확인 (실제 나이는 모름!)

## 🌐 전체 워크플로우

```
[클라이언트]                              [서버]
     |                                      |
1. age=25 입력 (Prover.toml)                |
     |                                      |
2. nargo execute → witness.gz              |
     |                                      |
3. bb prove → proof                        |
     |                                      |
4. POST /verify { proof, min_age: 18 }     |
     |                                5. bb verify
     |                                   → Valid ✓
     |                                      |
6. ← { verified: true }                    |
     |                                      |
  서비스 접근 허용!                          |
```

## 🧪 테스트

### 성공 케이스 (age >= min_age)
```toml
age = "25"
min_age = "18"
```
→ 증명 생성 성공, 검증 성공

### 실패 케이스 (age < min_age)
```toml
age = "15"
min_age = "18"
```
→ `nargo execute` 단계에서 실패 (assert 실패)

## 📊 파일 크기

- `age_verification.json`: ~1.2 KB (ACIR 바이트코드)
- `age_verification.gz`: ~60 B (Witness)
- `vk`: ~500 B (검증 키)
- `proof`: ~2 KB (생성된 증명)

## 🔒 보안 특성

### 공개 가능한 것
- ✅ `proof` - 증명 파일
- ✅ `vk` - 검증 키
- ✅ `age_verification.json` - 회로 바이트코드
- ✅ `min_age` - 공개 입력값

### 절대 공개하면 안 되는 것
- ❌ `Prover.toml` - 비밀 입력값
- ❌ `age_verification.gz` - Witness 파일
- ❌ 실제 `age` 값

## 🎓 학습 포인트

1. **Witness 생성**: 회로를 실제로 실행하여 모든 중간값 계산
2. **증명 생성**: 암호학적 변환을 통해 비밀을 숨김
3. **검증**: 비밀을 알지 못해도 증명의 유효성 확인 가능
4. **검증 키**: 증명 생성 전에 반드시 필요 (최신 bb 버전)

## 🚀 다음 단계

이 예제를 이해했다면:
1. `age` 값을 바꿔가며 테스트
2. `min_age < age` 케이스로 실패 케이스 테스트
3. 생성된 `proof` 파일 크기 확인
4. [Chapter 5: 웹 애플리케이션](../../tutorials/05-web-application.md)에서 실제 앱 구현

## 📚 참고 자료

- [Noir 공식 문서](https://noir-lang.org)
- [Barretenberg 문서](https://barretenberg.aztec.network)
- [Chapter 4: 증명 생성과 검증](../../tutorials/04-proof-generation.md)
