# Chapter 6: Solidity Verifier와 온체인 검증

## 🎯 학습 목표
- Barretenberg CLI를 사용한 Verification Key 생성
- Solidity Verifier 계약 생성 및 배포
- 이더리움 온체인에서 ZKP 검증
- 웹 애플리케이션과 스마트 계약 통합

## 📋 사전 요구사항

이 튜토리얼을 시작하기 전에:
- Chapter 5 완료 (웹 애플리케이션 구축)
- `noir-age-app` 예제 실행 가능
- Barretenberg CLI 설치

### Barretenberg CLI 설치 (v0.87.0)

**방법 1: packages 디렉토리에서 설치 (권장)**

이 저장소에는 호환성이 검증된 bb CLI v0.87.0-nightly 바이너리가 포함되어 있습니다:

```bash
# 프로젝트 루트로 이동
cd /path/to/zkp-101

# barretenberg 압축 해제
cd packages
tar -xzf barretenberg-v0.87.0-nightly-arm64-darwin.tar.gz

# bb 바이너리를 PATH에 추가
sudo cp barretenberg/bb /usr/local/bin/
sudo chmod +x /usr/local/bin/bb

# 설치 확인
bb --version
# 출력: v0.87.0-nightly
```

**방법 2: 공식 설치 스크립트 (최신 버전)**

```bash
# Mac/Linux:
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/cpp/installation/install | bash

# 설치 확인
which bb
bb --version
```

**⚠️ 버전 호환성 주의:**
- bb CLI v0.87.0 ↔ bb.js v0.87.0 호환
- 버전이 다르면 proof 검증 실패할 수 있음

## 🌐 온체인 검증이란?

### 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                         클라이언트                            │
│                                                               │
│  1. 비밀 입력 (age = 25)                                      │
│  2. noir.execute() → Witness 생성                            │
│  3. backend.generateProof() → ZKP 생성 (증명)                │
│     ↓                                                         │
│     증명 데이터: [bytes...] (약 14KB)                         │
│     공개 입력: [min_age = 18]                                 │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           │ 트랜잭션 전송
                           │ (증명 + 공개 입력)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    이더리움 블록체인                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Verifier Contract (Solidity)              │    │
│  │                                                     │    │
│  │  function verify(                                   │    │
│  │      bytes calldata proof,                         │    │
│  │      bytes32[] calldata publicInputs               │    │
│  │  ) external view returns (bool)                    │    │
│  │                                                     │    │
│  │  4. 타원곡선 페어링 연산 (precompiles 사용)         │    │
│  │  5. 검증 결과: true/false                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ✅ 검증 결과가 블록체인에 영구 기록                          │
└─────────────────────────────────────────────────────────────┘
```

### 왜 온체인 검증인가?

**장점:**
- 🔒 **신뢰성**: 블록체인에서 검증 → 누구나 확인 가능
- 🌍 **탈중앙화**: 중앙 서버 없이 검증
- 📝 **투명성**: 검증 로직이 공개된 스마트 계약
- 🔗 **조합성**: DeFi, DAO 등 다른 계약과 연동

**단점:**
- 💰 **Gas 비용**: 검증에 가스 소모 (최적화 필요)
- ⏱️ **속도**: 블록 생성 시간만큼 대기

## 🔨 실습: 나이 검증 온체인 검증

### Step 1: 프로젝트 준비

기존 `noir-age-app`을 사용합니다:

```bash
cd examples/noir-age-app
```

프로젝트 구조:
```
noir-age-app/
├── circuit/
│   ├── src/
│   │   └── main.nr          # 이미 작성됨
│   ├── Nargo.toml
│   └── target/
│       └── circuit.json     # 이미 컴파일됨
├── contracts/               # ← 새로 만들 디렉토리
│   └── Verifier.sol        # ← 생성할 파일
├── src/
│   ├── index.html
│   └── index.js
└── package.json
```

### Step 2: Verification Key 생성

**Verification Key (VK)란?**
- 증명을 검증하기 위한 공개 키
- 회로에서 한 번만 생성
- Solidity Verifier 계약 생성 시 필요

```bash
# contracts 디렉토리 생성
mkdir -p contracts

# Verification Key 생성 (bb CLI v0.87.0)
cd circuit
bb write_vk \
  -b ./target/circuit.json \
  -o ./target/vk \
  --oracle_hash keccak

cd ..
```

**명령어 설명:**
- `bb write_vk`: Verification Key 생성 명령
- `-b ./target/circuit.json`: 컴파일된 회로 파일
- `-o ./target/vk`: 출력 파일 경로
- `--oracle_hash keccak`: Keccak 해시 사용 (이더리움 호환, EVM precompile 활용)

**출력:**
```
circuit/target/vk/vk  # Verification Key 파일 생성됨
```

**⚠️ Oracle Hash 옵션:**
- `--oracle_hash keccak`: EVM 최적화, 낮은 gas 비용 (권장)
- 옵션 생략 시: Poseidon2 기본값 (ZK 친화적이지만 onchain 검증 비용 높음)

**💡 bb CLI v0.87.0 참고:**
- UltraHonk proving scheme이 기본값이므로 `-s ultra_honk` 옵션 불필요
- `--zk` 옵션 없이도 정상적으로 작동

### Step 3: Solidity Verifier 생성

```bash
# Solidity Verifier 계약 생성 (bb CLI v0.87.0)
bb write_solidity_verifier \
  -k ./circuit/target/vk/vk \
  -o ./contracts/Verifier-Keccak.sol
```

**명령어 설명:**
- `bb write_solidity_verifier`: Solidity verifier 생성
- `-k ./circuit/target/vk/vk`: Verification Key 파일 경로
- `-o ./contracts/Verifier-Keccak.sol`: 출력 파일 경로

**생성된 파일 확인:**
```bash
cat contracts/Verifier-Keccak.sol
# 약 2,050줄의 Solidity 코드
```

생성된 `Verifier-Keccak.sol` 구조:
```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.21;

// UltraHonk 검증 키 라이브러리
library HonkVerificationKey {
    function loadVerificationKey() internal pure returns (Honk.VerificationKey memory) {
        // 검증 키 데이터 (회로마다 다름)
    }
}

// 기본 Honk 검증기 (추상 계약)
abstract contract BaseZKHonkVerifier is IVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs)
        public view returns (bool verified) {
        // 타원곡선 페어링 연산
        // Sumcheck 프로토콜
        // Shplemini 검증
    }
}

// 최종 구현체
contract HonkVerifier is BaseZKHonkVerifier {
    function loadVerificationKey() internal pure override returns (Honk.VerificationKey memory) {
        return HonkVerificationKey.loadVerificationKey();
    }
}
```

**특징:**
- 약 2,000줄의 복잡한 코드 (타원곡선 암호학)
- `verify()` 함수만 외부에서 호출하면 됩니다
- 나머지는 내부 검증 로직입니다

### Step 4: Remix에서 배포

**Remix IDE 사용:**

1. **Remix 열기**: https://remix.ethereum.org/

2. **파일 생성**:
   - 좌측 File Explorer에서 새 파일 생성
   - 이름: `Verifier.sol`
   - 생성된 `contracts/Verifier.sol` 내용을 복사해서 붙여넣기

3. **컴파일** (중요!):
   - 좌측 "Solidity Compiler" 탭 클릭
   - Compiler version: `0.8.30+` 선택 (pragma solidity >=0.8.21)
   - **Optimization 활성화** (필수!)
     - ☑ Enable optimization
     - **Runs: 1** ← EIP-170 (24KB 제한) 때문에 최소값 필요!
   - "Compile Verifier.sol" 버튼 클릭

   **⚠️ EIP-170 제한:**
   - 이더리움은 계약 크기를 24KB로 제한합니다
   - HonkVerifier는 매우 큰 계약이므로 Runs: 1 필수
   - 그래도 실패하면 아래 트러블슈팅 참고

4. **배포** (Sepolia 테스트넷):
   - 좌측 "Deploy & Run Transactions" 탭 클릭
   - Environment: **`Injected Provider - MetaMask`** 선택
   - MetaMask에서 **Sepolia 네트워크** 선택 확인
   - Gas limit: **8000000** 입력 (큰 계약이라 많이 필요)
   - Contract: `HonkVerifier` 선택 (드롭다운에서 찾기)
   - "Deploy" 버튼 클릭
   - MetaMask 팝업 → 트랜잭션 승인

   **💡 배포 시간:** 약 30초~1분 소요
   **💰 예상 비용:** 0.05~0.1 Sepolia ETH

5. **계약 주소 복사**:
   - 배포 후 "Deployed Contracts" 섹션에서 계약 주소 확인
   - 예시: `0x9912F1D99715245B9C10c8a5CC408417890b39cC`
   - 이 주소를 메모해두고 웹 앱 코드에서 사용합니다!

   **🔍 Etherscan에서 확인:**
   ```
   https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
   ```

### Step 5: 증명 생성 및 검증 (CLI)

**5.1 Witness 생성 및 증명 생성 (CLI 방식)**

```bash
# Prover.toml 파일 생성
cat > circuit/Prover.toml << EOF
age = "25"
min_age = "18"
EOF

# Witness 생성
cd circuit
nargo execute witness
cd ..

# 증명 생성 (bb CLI v0.87.0)
bb prove \
  -b ./circuit/target/circuit.json \
  -w ./circuit/target/witness.gz \
  -o ./circuit/target/proof \
  --oracle_hash keccak
```

**출력:**
```
circuit/target/proof/proof  # 증명 파일 생성됨
circuit/target/proof/public_inputs  # 공개 입력 파일
```

**💡 Proof 크기:**
- Keccak oracle hash 사용 시: 약 14,592 bytes (~14.2 KB)
- Poseidon2 기본값 사용 시: 약 14,592 bytes (동일)

**5.2 증명 데이터 확인**

```bash
# 증명 파일을 hex로 변환 (Remix에서 사용하기 위해)
xxd -p circuit/target/proof | tr -d '\n' > circuit/target/proof.hex

# 내용 확인
cat circuit/target/proof.hex
```

### Step 6: Remix에서 증명 검증

**6.1 공개 입력 준비**

우리 회로에서 공개 입력은 `min_age`입니다:
```
min_age = 18
```

이를 `bytes32` 형식으로 변환:
```
0x0000000000000000000000000000000000000000000000000000000000000012
```

**6.2 Remix에서 verify 함수 호출**

1. Deployed Contracts에서 `HonkVerifier` 확장
2. `verify` 함수 찾기
3. 입력값:
   - `proof`: `0x` + (proof.hex 내용)
   - `publicInputs`: `["0x0000000000000000000000000000000000000000000000000000000000000012"]`
4. "call" 버튼 클릭

**결과:**
```
✅ bool: true
```

성공! 온체인에서 증명이 검증되었습니다!

## 🌐 웹 앱과 통합

이제 웹 애플리케이션에서 생성한 증명을 온체인으로 보내봅시다.

### Step 7: 웹3 라이브러리 설치

```bash
npm install ethers
```

**설치할 패키지:**
- `ethers`: v6.x (최신 버전)
- `@aztec/bb.js`: v0.87.0
- `@noir-lang/noir_js`: v1.0.0-beta.9

### Step 8: 온체인 검증 코드 추가

`src/index.js` 전체 코드:

```javascript
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import { ethers } from 'ethers';
import circuit from '../circuit/target/circuit.json';

// Verifier 계약 주소 (Sepolia 테스트넷) - 본인이 배포한 주소로 변경!
const VERIFIER_ADDRESS = '0x9A8BF6f5A1aF9D914658Adaf5c47C92B728BaBf8';

// Verifier ABI (verify 함수만 필요)
const VERIFIER_ABI = [
    "function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool)"
];

// DOM 요소
const form = document.getElementById('ageForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const resultDiv = document.getElementById('result');

// Noir 인스턴스 초기화
let noir;
let backend;

async function initNoir() {
    try {
        // Backend 초기화 (Keccak oracle hash - bb.js v0.87.0)
        backend = new UltraHonkBackend(circuit.bytecode, { keccak: true });

        // Noir 초기화
        noir = new Noir(circuit, backend);

        console.log('✅ Noir 초기화 완료');
    } catch (error) {
        console.error('❌ Noir 초기화 실패:', error);
        showResult('초기화 실패: ' + error.message, false);
    }
}

// 온체인 검증 함수
async function verifyOnChain(proof) {
    try {
        // 1. MetaMask 설치 확인
        if (!window.ethereum) {
            throw new Error('MetaMask가 설치되어 있지 않습니다.\nhttps://metamask.io 에서 설치해주세요.');
        }

        // 2. Provider 연결
        const provider = new ethers.BrowserProvider(window.ethereum);

        // 3. 계정 연결 요청
        console.log('🔗 MetaMask 연결 중...');
        await provider.send("eth_requestAccounts", []);

        // 4. 네트워크 확인
        const network = await provider.getNetwork();
        console.log('📡 현재 네트워크:', network.name, 'Chain ID:', network.chainId);

        if (network.chainId !== 11155111n) { // Sepolia
            throw new Error(
                `잘못된 네트워크입니다!\n\n` +
                `현재: ${network.name} (Chain ID: ${network.chainId})\n` +
                `필요: Sepolia (Chain ID: 11155111)\n\n` +
                `MetaMask에서 Sepolia 네트워크로 변경해주세요.`
            );
        }

        // 5. Verifier 계약 연결
        const verifier = new ethers.Contract(VERIFIER_ADDRESS, VERIFIER_ABI, provider);
        console.log('📝 Verifier 계약 주소:', VERIFIER_ADDRESS);

        // 6. 공개 입력을 bytes32로 변환
        const publicInputsBytes32 = proof.publicInputs.map(input => {
            // number를 16진수 문자열로 변환 후 32바이트로 패딩
            const hex = typeof input === 'number'
                ? '0x' + input.toString(16).padStart(64, '0')
                : ethers.zeroPadValue(ethers.toBeHex(input), 32);
            return hex;
        });

        // 7. 증명을 16진수 문자열로 변환
        const proofHex = '0x' + Array.from(proof.proof)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // 8. 온체인 검증 호출
        console.log('🔗 블록체인에서 검증 중...');
        const isValid = await verifier.verify(proofHex, publicInputsBytes32);

        console.log('✅ 온체인 검증 결과:', isValid);
        return isValid;

    } catch (error) {
        console.error('❌ 온체인 검증 오류:', error);

        // 사용자 친화적인 에러 메시지
        if (error.message.includes('user rejected')) {
            throw new Error('사용자가 MetaMask 연결을 거부했습니다.');
        } else if (error.message.includes('network') || error.message.includes('네트워크')) {
            throw error; // 네트워크 에러는 그대로 전달
        } else if (error.code === 'CALL_EXCEPTION') {
            throw new Error('계약 호출 실패. 증명 데이터를 확인해주세요.');
        } else {
            throw new Error(`온체인 검증 실패: ${error.message}`);
        }
    }
}

// 폼 제출 핸들러
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const age = parseInt(document.getElementById('age').value);
    const minAge = parseInt(document.getElementById('minAge').value);
    const verifyMode = document.getElementById('verifyMode').value;

    console.log('📋 선택된 검증 방식:', verifyMode);

    // UI 업데이트
    submitBtn.disabled = true;
    loading.style.display = 'block';
    resultDiv.style.display = 'none';

    try {
        // 1. Witness 생성
        console.log('📝 Witness 생성 중...');
        const { witness } = await noir.execute({
            age: age.toString(),
            min_age: minAge.toString()
        });
        console.log('✅ Witness 생성 완료');

        // 2. 증명 생성 (Keccak oracle hash)
        console.log('🔒 온체인용 증명 생성 중 (Keccak)...');
        const proof = await backend.generateProof(witness, { keccak: true });
        console.log('✅ 증명 생성 완료');

        // 3. 검증 방식에 따라 분기
        let isValid = false;

        console.log(`🔍 ${verifyMode} 검증 중...`);
        if (verifyMode === 'offchain') {
            isValid = await backend.verifyProof(proof, { keccak: true });
        } else if (verifyMode === 'onchain') {
            isValid = await verifyOnChain(proof);
        }
        console.log(`✅ ${verifyMode} 검증 완료: ${isValid}`);

        if (isValid) {
            showResult(
                `✅ ${verifyMode} 검증 성공!\n\n` +
                `🎉 블록체인에서 ${minAge}세 이상임이 검증되었습니다!\n\n` +
                `📊 증명 크기: ${(proof.proof.length / 1024).toFixed(2)} KB\n` +
                `🔐 당신의 실제 나이(${age}세)는 비밀로 유지됩니다.\n\n` +
                `🔗 검증 위치: Sepolia 블록체인\n`,
                true
            );
        } else {
            showResult(`❌ ${verifyMode} 검증 실패`, false);
        }

    } catch (error) {
        console.error('오류:', error);
        // "Cannot satisfy constraint" 에러 처리
        if (error.message && error.message.includes('Cannot satisfy constraint')) {
            showResult(
                `❌ 증명 생성 실패!\n\n` +
                `입력하신 나이(${age}세)가 최소 요구사항(${minAge}세)을 만족하지 않습니다.\n\n` +
                `제로 지식 증명은 참인 명제만 증명할 수 있습니다.`,
                false
            );
        } else {
            showResult('❌ 오류 발생:\n\n' + error.message, false);
        }
    } finally {
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
});

// 결과 표시 함수
function showResult(message, success) {
    resultDiv.textContent = message;
    resultDiv.className = 'result ' + (success ? 'success' : 'error');
    resultDiv.style.display = 'block';
}

// 페이지 로드 시 초기화
initNoir();
```

**핵심 포인트:**
- `backend = new UltraHonkBackend(circuit.bytecode, { keccak: true })`: Keccak oracle hash 사용
- `generateProof(witness, { keccak: true })`: 증명 생성 시에도 keccak 옵션 명시
- `verifyProof(proof, { keccak: true })`: 오프체인 검증 시에도 keccak 옵션 명시
- `verifyOnChain(proof)`: 온체인 검증 함수는 proof 객체만 받음 (publicInputs는 proof 내부에 있음)

### Step 9: HTML에 검증 방식 선택 추가

`src/index.html`에 select box 추가:

```html
<div class="form-group">
    <label for="verifyMode">검증 방식:</label>
    <select id="verifyMode">
        <option value="offchain">오프체인 (브라우저 로컬 - 빠름, 무료)</option>
        <option value="onchain">온체인 (블록체인 - 느림, Gas 발생, MetaMask 필요)</option>
    </select>
</div>
```

**CSS 추가** (선택적, `src/index.html`의 `<style>` 태그 안에):

```css
select {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    background: white;
    cursor: pointer;
}

select:focus {
    outline: 2px solid #4CAF50;
}
```

### Step 10: 테스트

```bash
npm run dev
```

**테스트 시나리오:**

#### 1. 오프체인 검증 (로컬 검증)
- 검증 방식 선택: **"오프체인"** 선택
- 나이: 25, 최소 나이: 18 입력
- "증명 생성 및 검증" 버튼 클릭
- **결과**: 브라우저에서만 검증 (빠르고, 가스 비용 없음)
- **콘솔 출력**:
  ```
  ✅ Noir 초기화 완료
  📝 Witness 생성 중...
  ✅ Witness 생성 완료
  🔒 증명 생성 중...
  ✅ 증명 생성 완료
  📋 선택된 검증 방식: offchain
  🔍 오프체인 검증 중...
  ✅ 오프체인 검증 결과: true
  ```

#### 2. 온체인 검증 (블록체인)
- 검증 방식 선택: **"온체인"** 선택
- 나이: 25, 최소 나이: 18 입력
- "증명 생성 및 검증" 버튼 클릭
- MetaMask 팝업 → 계정 연결 승인
- **결과**: 블록체인에서 검증 (느리지만, 신뢰성 높음)
- **콘솔 출력**:
  ```
  ✅ Noir 초기화 완료
  📝 Witness 생성 중...
  ✅ Witness 생성 완료
  🔒 증명 생성 중...
  ✅ 증명 생성 완료
  📋 선택된 검증 방식: onchain
  🔗 온체인 검증 중...
  ✅ 온체인 검증 결과: true
  ```

#### 3. 검증 실패 케이스
- 나이: 15, 최소 나이: 18 입력
- 검증 방식: 오프체인 또는 온체인 상관없음
- **결과**: Witness 생성 단계에서 실패 (constraint 불만족)
- 검증 단계까지 가지 않음

**검증 방식 비교:**

| 항목 | 오프체인 (로컬) | 온체인 (블록체인) |
|------|----------------|-------------------|
| **실행 위치** | 브라우저 | 이더리움 네트워크 |
| **속도** | ⚡ 빠름 (~1초) | 🐢 느림 (~10초) |
| **비용** | 💚 무료 | 💰 Gas 비용 발생 |
| **신뢰성** | 클라이언트만 확인 | 블록체인에 영구 기록 |
| **사용 사례** | 개발/테스트 | 프로덕션/DeFi/DAO |
| **필요 도구** | 브라우저만 | MetaMask + 이더 |
| **결과 공유** | 불가능 (로컬) | 가능 (트랜잭션 해시) |

## 📊 Gas 비용 분석

**Remix VM에서 Gas 측정:**

| 작업 | Gas 비용 | 설명 |
|------|----------|------|
| 계약 배포 | ~2,000,000 | 한 번만 |
| verify() 호출 | ~250,000-350,000 | 증명마다 |

**실제 네트워크 예상 비용 (2024년 기준):**
- Ethereum Mainnet: $10-30 per verification
- Polygon: $0.01-0.1 per verification
- Optimism/Arbitrum: $0.5-2 per verification

**최적화 팁:**
- Batch verification: 여러 증명을 한 번에 검증
- Layer 2 사용: Polygon, Optimism 등
- Recursive proofs: 여러 증명을 하나로 압축

## 🔍 트러블슈팅

### 1. "bb: command not found"

**해결:**
```bash
# Barretenberg CLI 설치
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/master/barretenberg/cpp/installation/install | bash

# 또는 수동 설치
# https://github.com/AztecProtocol/aztec-packages/releases
```

### 2. "Compiler version mismatch"

Remix에서 컴파일 실패 시:
- Verifier.sol의 `pragma solidity` 버전 확인
- Remix에서 해당 버전 선택

### 3. "Invalid proof" 에러

**원인**: 증명 데이터 형식 문제

**체크리스트:**
- `--oracle_hash keccak` 플래그 사용 확인
- 공개 입력 순서 확인
- bytes32 변환 확인

### 4. "Contract code size exceeds 24576 bytes" (EIP-170)

**원인**: HonkVerifier가 이더리움 계약 크기 제한(24KB)을 초과

**해결 방법 (순서대로 시도):**

1. **Optimization Runs를 1로 설정** (가장 효과적!)
   ```
   Remix → Solidity Compiler
   ☑ Enable optimization
   Runs: 1  ← 배포 크기 최소화
   ```

2. **via-ir 컴파일러 사용**
   ```
   Advanced Configurations 펼치기
   ☑ Enable via-ir
   ```

3. **그래도 실패하면:**
   - **Layer 2 사용**: Arbitrum (48KB), Optimism 등
   - **오프체인 검증만**: 학습용으로는 충분합니다
   - **다른 백엔드**: Nargo.toml에서 `proving_scheme = "plonk"` 시도

**참고:**
- [EIP-170 설명](https://eips.ethereum.org/EIPS/eip-170)
- HonkVerifier는 최신/강력하지만 크기가 큼

### 5. "Wrong network" 또는 네트워크 관련 에러

**원인**: Sepolia가 아닌 다른 네트워크에 연결됨

**해결**:
```
MetaMask → 네트워크 드롭다운 → Sepolia 선택
또는
웹 앱 콘솔에서 Chain ID 확인: 11155111이어야 함
```

### 6. MetaMask 연결 실패

```javascript
// MetaMask 설치 확인
if (!window.ethereum) {
    alert('MetaMask를 설치해주세요!');
    return;
}

// 계정 연결
await window.ethereum.request({ method: 'eth_requestAccounts' });
```

## 🚀 실전 예제: DeFi 나이 검증

### 사용 사례

**AdultOnlyDeFi 계약**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IHonkVerifier {
    function verify(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external view returns (bool);
}

contract AdultOnlyDeFi {
    IHonkVerifier public verifier;
    uint256 public constant MIN_AGE = 18;

    mapping(address => bool) public verified;

    constructor(address _verifier) {
        verifier = IHonkVerifier(_verifier);
    }

    // 나이 검증하고 서비스 이용 허가
    function verifyAge(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external {
        // 공개 입력이 MIN_AGE인지 확인
        require(
            publicInputs[0] == bytes32(MIN_AGE),
            "Public input must be MIN_AGE"
        );

        // ZKP 검증
        require(
            verifier.verify(proof, publicInputs),
            "Invalid age proof"
        );

        // 사용자 승인
        verified[msg.sender] = true;
    }

    // 성인 전용 기능
    function adultOnlyFunction() external view {
        require(verified[msg.sender], "Age verification required");
        // 실제 로직...
    }
}
```

**배포 및 사용:**
```bash
# 1. HonkVerifier 배포 (0xVerifierAddress)
# 2. AdultOnlyDeFi 배포 (0xVerifierAddress)
# 3. 사용자가 증명 제출
# 4. verifyAge() 호출 → verified[user] = true
# 5. adultOnlyFunction() 사용 가능
```

## 📚 다양한 네트워크 배포

### Polygon Mumbai (테스트넷)

```javascript
// Remix 설정
Environment: Injected Provider - MetaMask
Network: Polygon Mumbai

// 또는 Hardhat으로 배포
npx hardhat run scripts/deploy.js --network mumbai
```

### Optimism Goerli (테스트넷)

```javascript
// MetaMask에 Optimism Goerli 추가
Network Name: Optimism Goerli
RPC URL: https://goerli.optimism.io
Chain ID: 420
```

## ✅ 완성 체크리스트

### 계약 배포
- [ ] Barretenberg CLI 설치 확인
- [ ] Verification Key 생성 (`bb write_vk`)
- [ ] Solidity Verifier 생성 (`bb write_solidity_verifier`)
- [ ] Remix에서 컴파일 (Runs: 1, optimization 활성화)
- [ ] Sepolia 테스트넷에 배포
- [ ] Etherscan에서 계약 확인

### 웹 앱 통합
- [ ] ethers.js v6 설치
- [ ] VERIFIER_ADDRESS를 실제 주소로 설정
- [ ] Sepolia Chain ID 확인 로직 추가
- [ ] 온체인 검증 함수 구현
- [ ] select box로 검증 방식 선택 UI

### 테스트
- [ ] 오프체인 검증 테스트 (빠름)
- [ ] MetaMask 연결 테스트
- [ ] Sepolia 네트워크 전환 테스트
- [ ] 온체인 검증 테스트 (느림, Gas 소모)
- [ ] 브라우저 콘솔 로그 확인

## 🎓 학습 요약

이번 튜토리얼에서 배운 내용:

1. **Verification Key 생성**: `bb write_vk`로 검증 키 생성
2. **Solidity Verifier**: HonkVerifier 자동 생성 (약 2,000줄)
3. **EIP-170 제한**: 24KB 계약 크기 제한과 해결 방법
4. **Sepolia 배포**: 테스트넷에 실제 계약 배포
5. **온체인 검증**: 이더리움 블록체인에서 ZKP 검증
6. **Web3 통합**: ethers.js v6로 브라우저 ↔ 블록체인 연결
7. **네트워크 관리**: Chain ID 확인, 네트워크 전환
8. **실전 활용**: DeFi, DAO 등에서 프라이버시 보호

## 📝 핵심 정보

### 배포된 계약 정보 (예시)
```
Contract: HonkVerifier
Address: 0x9912F1D99715245B9C10c8a5CC408417890b39cC
Network: Sepolia Testnet (Chain ID: 11155111)
Etherscan: https://sepolia.etherscan.io/address/0x9912F1D99715245B9C10c8a5CC408417890b39cC
```

### 주요 명령어
```bash
# VK 생성 (bb CLI v0.87.0)
bb write_vk \
  -b ./circuit/target/circuit.json \
  -o ./circuit/target/vk \
  --oracle_hash keccak

# Verifier 생성
bb write_solidity_verifier \
  -k ./circuit/target/vk/vk \
  -o ./contracts/Verifier-Keccak.sol

# 증명 생성
bb prove \
  -b ./circuit/target/circuit.json \
  -w ./circuit/target/witness.gz \
  -o ./circuit/target/proof \
  --oracle_hash keccak

# 증명 검증
bb verify \
  -p ./circuit/target/proof/proof \
  -k ./circuit/target/vk/vk \
  --oracle_hash keccak

# 회로 재컴파일 (필요 시)
cd circuit && nargo compile && cd ..

# 또는 build.sh 스크립트 사용 (권장!)
cd circuit && ./build.sh
```

### 오프체인 vs 온체인

| 항목 | 오프체인 (브라우저) | 온체인 (블록체인) |
|------|-------------------|-------------------|
| **속도** | ⚡ 매우 빠름 (~1초) | 🐢 느림 (~10-30초) |
| **비용** | 💚 무료 | 💰 Gas 비용 (~$0.01-0.1) |
| **신뢰성** | 개인 검증 | 공개 검증 (블록체인 기록) |
| **사용처** | 개발/테스트 | 프로덕션/DeFi/DAO |
| **필요 도구** | 브라우저만 | MetaMask + 테스트 ETH |

## 🚀 다음 단계

- Chapter 7: Recursive Proofs (증명의 증명)
- Chapter 8: 고급 회로 패턴
- Chapter 9: 프로덕션 배포 가이드

## 📚 추가 리소스

- [Barretenberg 공식 문서](https://barretenberg.aztec.network/)
- [Solidity Verifier 가이드](https://barretenberg.aztec.network/docs/how_to_guides/how-to-solidity-verifier/)
- [Noir 스마트 계약 통합](https://noir-lang.org/docs/how_to/how-to-solidity-verifier)
- [EVM Precompiles](https://www.evm.codes/precompiled)

---

축하합니다! 이제 Zero-Knowledge Proof를 블록체인에 통합할 수 있습니다! 🎉
