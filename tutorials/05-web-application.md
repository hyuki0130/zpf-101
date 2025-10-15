# Chapter 5: 실전 웹 애플리케이션

## 🎯 학습 목표
- NoirJS를 사용한 브라우저 기반 ZKP 애플리케이션 개발
- 프론트엔드에서 증명 생성 및 검증
- 실전 나이 검증 애플리케이션 구축
- 배포 및 최적화

## ⚠️ 버전 호환성 (중요!)

이 튜토리얼에서 사용하는 **검증된 버전 조합**:

| 도구/패키지 | 버전 | 비고 |
|-------------|------|------|
| nargo | 1.0.0-beta.9 | `noirup --version 1.0.0-beta.9` |
| @noir-lang/noir_js | 1.0.0-beta.9 | Noir 실행 라이브러리 |
| @aztec/bb.js | 0.87.0 | Barretenberg 백엔드 |
| vite | ^7.1.10 | 개발 서버 |
| vite-plugin-node-polyfills | ^0.24.0 | Buffer polyfill |

**⚠️ 주의사항:**
- 모든 버전이 정확히 일치해야 합니다!
- nargo 버전과 JS 라이브러리 버전 불일치 시 "Failed to deserialize circuit" 에러 발생
- 다른 버전 사용 시 예상치 못한 에러 발생 가능

## 🌐 NoirJS 소개

**NoirJS**는 웹 브라우저에서 Noir 회로를 실행할 수 있게 해주는 JavaScript/TypeScript 라이브러리입니다.

### 주요 특징

- 🌍 **브라우저에서 실행**: 서버 없이 클라이언트 측에서 증명 생성
- 🔒 **프라이버시 보호**: 민감한 데이터가 브라우저를 벗어나지 않음
- ⚡ **빠른 검증**: 밀리초 단위의 증명 검증
- 📦 **쉬운 통합**: npm 패키지로 제공

### 아키텍처

```
┌─────────────────────────────────────┐
│         웹 브라우저                  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  프론트엔드 (React/Vue/등)   │  │
│  └────────────┬─────────────────┘  │
│               │                     │
│               ↓                     │
│  ┌──────────────────────────────┐  │
│  │        Noir.js               │  │
│  │  - Witness 생성              │  │
│  │  - 회로 실행                 │  │
│  └────────────┬─────────────────┘  │
│               │                     │
│               ↓                     │
│  ┌──────────────────────────────┐  │
│  │    Barretenberg.js           │  │
│  │  - 증명 생성                 │  │
│  │  - 증명 검증                 │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 📦 프로젝트 설정

### 1. 프로젝트 초기화

```bash
# 새 디렉토리 생성
mkdir noir-age-app
cd noir-age-app

# Noir 프로젝트 생성
nargo new circuit
cd circuit

# 웹 프로젝트 초기화
cd ..
npm init -y
```

### 2. 필요한 패키지 설치

```bash
npm install @noir-lang/noir_js@1.0.0-beta.9 @aztec/bb.js@0.87.0
npm install --save-dev vite vite-plugin-node-polyfills
```

**패키지 설명:**
- `@noir-lang/noir_js@1.0.0-beta.9`: Noir 회로 실행
- `@aztec/bb.js@0.87.0`: Barretenberg 백엔드 (증명 생성/검증)
- `vite`: 빠른 개발 서버 및 빌드 도구
- `vite-plugin-node-polyfills`: 브라우저용 Node.js polyfills (Buffer 등)

**⚠️ 버전 호환성 중요!**
- nargo와 JavaScript 패키지 버전이 정확히 일치해야 합니다
- nargo 1.0.0-beta.9 사용 권장: `noirup --version 1.0.0-beta.9`

### 3. 프로젝트 구조

```
noir-age-app/
├── circuit/
│   ├── src/
│   │   └── main.nr          # Noir 회로
│   ├── Nargo.toml
│   └── target/
│       └── circuit.json     # 컴파일된 회로
├── src/
│   ├── index.html
│   └── index.js
├── package.json
└── vite.config.js
```

## 🔨 나이 검증 앱 만들기

### Step 1: 회로 작성

`circuit/src/main.nr`:
```rust
fn main(age: u8, min_age: pub u8) {
    assert(age >= min_age);
}
```

**타입 선택:**
- `u8` 사용 (0-255): 나이에 적합하고 효율적
- `Field`보다 작은 타입으로 증명 크기 감소

**회로 컴파일:**
```bash
cd circuit
nargo compile
cd ..
```

컴파일 성공 시 `circuit/target/circuit.json` 생성

### Step 2: HTML 작성

`src/index.html`:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zero-Knowledge 나이 검증</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }

        h1 {
            text-align: center;
            margin-bottom: 30px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }

        input {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
        }

        button {
            width: 100%;
            padding: 15px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 18px;
            cursor: pointer;
            transition: background 0.3s;
        }

        button:hover {
            background: #45a049;
        }

        button:disabled {
            background: #cccccc;
            cursor: not-allowed;
        }

        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
            display: none;
        }

        .result.success {
            background: rgba(76, 175, 80, 0.3);
            border: 2px solid #4CAF50;
        }

        .result.error {
            background: rgba(244, 67, 54, 0.3);
            border: 2px solid #f44336;
        }

        .loading {
            text-align: center;
            margin-top: 20px;
        }

        .info {
            background: rgba(255, 255, 255, 0.2);
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Zero-Knowledge 나이 검증</h1>

        <div class="info">
            <strong>💡 어떻게 작동하나요?</strong><br>
            이 앱은 당신의 실제 나이를 공개하지 않고도 최소 나이 요구사항을 만족한다는 것을 증명합니다.
            모든 계산은 브라우저에서만 이루어지며, 당신의 나이는 절대 서버로 전송되지 않습니다!
        </div>

        <form id="ageForm">
            <div class="form-group">
                <label for="age">당신의 나이 (비밀):</label>
                <input type="number" id="age" required min="1" max="150"
                       placeholder="예: 25">
            </div>

            <div class="form-group">
                <label for="minAge">최소 나이 요구사항 (공개):</label>
                <input type="number" id="minAge" required min="1" max="150"
                       value="18" placeholder="예: 18">
            </div>

            <button type="submit" id="submitBtn">
                증명 생성 및 검증
            </button>
        </form>

        <div class="loading" id="loading" style="display: none;">
            <p>⏳ 증명 생성 중...</p>
        </div>

        <div class="result" id="result"></div>
    </div>

    <script type="module" src="./index.js"></script>
</body>
</html>
```

### Step 3: JavaScript 로직 작성

`src/index.js`:
```javascript
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import circuit from '../circuit/target/circuit.json';

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
        // backend 초기화 (circuit.bytecode 사용)
        backend = new UltraHonkBackend(circuit.bytecode);
        // Noir 초기화
        noir = new Noir(circuit, backend);

        console.log('✅ Noir 초기화 완료');
    } catch (error) {
        console.error('❌ Noir 초기화 실패:', error);
        showResult('초기화 실패: ' + error.message, false);
    }
}

// 폼 제출 핸들러
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const age = parseInt(document.getElementById('age').value);
    const minAge = parseInt(document.getElementById('minAge').value);

    // 입력값 검증
    if (age < minAge) {
        showResult(`❌ 나이가 최소 요구사항(${minAge}세)을 만족하지 않습니다.`, false);
        return;
    }

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

        // 2. 증명 생성
        console.log('🔒 증명 생성 중...');
        const proof = await backend.generateProof(witness);

        console.log('✅ 증명 생성 완료');
        console.log('증명 크기:', proof.proof.length, 'bytes');

        // 3. 증명 검증
        console.log('🔍 증명 검증 중...');
        const isValid = await backend.verifyProof(proof);

        if (isValid) {
            showResult(
                `✅ 검증 성공!\n\n` +
                `🎉 당신의 정확한 나이를 공개하지 않고도, ${minAge}세 이상임을 증명했습니다!\n\n` +
                `📊 증명 크기: ${(proof.proof.length / 1024).toFixed(2)} KB\n` +
                `🔐 당신의 실제 나이(${age}세)는 비밀로 유지됩니다.`,
                true
            );
        } else {
            showResult('❌ 증명 검증 실패', false);
        }

    } catch (error) {
        console.error('오류:', error);
        showResult('❌ 오류 발생: ' + error.message, false);
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

### Step 4: Vite 설정

`vite.config.js`:
```javascript
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    root: 'src',
    plugins: [
        nodePolyfills(),
    ],
    optimizeDeps: {
        esbuildOptions: {
            target: 'esnext',
        },
        exclude: ['@noir-lang/noirc_abi', '@noir-lang/acvm_js', '@aztec/bb.js'],
    },
    build: {
        target: 'esnext',
    },
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
});
```

**주요 설정 설명:**
- `root: 'src'`: src 디렉토리를 루트로 설정
- `nodePolyfills()`: Buffer 등 Node.js polyfills 자동 추가
- `exclude`: WASM을 사용하는 패키지는 번들링 제외 (중요!)
- `COOP/COEP 헤더`: SharedArrayBuffer 사용을 위한 보안 헤더

### Step 5: package.json 스크립트

`package.json`:
```json
{
  "name": "noir-age-app",
  "version": "1.0.0",
  "type": "commonjs",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@aztec/bb.js": "0.87.0",
    "@noir-lang/noir_js": "1.0.0-beta.9"
  },
  "devDependencies": {
    "vite": "^7.1.10",
    "vite-plugin-node-polyfills": "^0.24.0"
  }
}
```

**중요한 변경사항:**
- `type: "commonjs"`: CommonJS 모듈 시스템 사용
- `@aztec/bb.js@0.87.0`: 공식 Barretenberg 백엔드 (이전: @noir-lang/backend_barretenberg)
- `@noir-lang/noir_js@1.0.0-beta.9`: Noir JS 라이브러리
- 버전 고정: `^` 제거하여 정확한 버전 사용 (호환성 보장)

### Step 6: 실행

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속!

**브라우저 콘솔에서 확인:**
```
✅ Noir 초기화 완료
📝 Witness 생성 중...
✅ Witness 생성 완료
🔒 증명 생성 중...
✅ 증명 생성 완료
증명 크기: xxxxx bytes
🔍 증명 검증 중...
```

## ⚠️ 문제 해결 (Troubleshooting)

### 1. "Buffer is not defined" 에러

**원인**: Node.js Buffer polyfill 누락

**해결**:
```bash
npm install vite-plugin-node-polyfills --save-dev
```

vite.config.js에 추가:
```javascript
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [nodePolyfills()],
});
```

### 2. "main.worker.js does not exist" 에러

**원인**: @aztec/bb.js가 Web Worker를 사용하는데 Vite가 번들링하면서 경로가 깨짐

**해결**: vite.config.js의 `optimizeDeps.exclude`에 추가
```javascript
exclude: ['@noir-lang/noirc_abi', '@noir-lang/acvm_js', '@aztec/bb.js']
```

### 3. "Failed to deserialize circuit" 에러

**원인**: nargo 버전과 JavaScript 라이브러리 버전 불일치

**해결**:
```bash
# nargo 버전 확인
nargo --version

# 일치하는 버전 설치
noirup --version 1.0.0-beta.9
npm install @noir-lang/noir_js@1.0.0-beta.9 @aztec/bb.js@0.87.0

# circuit 재컴파일
cd circuit && nargo compile && cd ..
```

### 4. COOP/COEP 헤더 관련 에러

**원인**: SharedArrayBuffer 사용을 위한 보안 헤더 누락

**해결**: vite.config.js에 추가
```javascript
server: {
    headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
    },
}
```

## 🚀 고급 기능 추가

### 1. 여러 조건 검증

더 복잡한 회로를 만들어봅시다.

`circuit/src/main.nr`:
```rust
fn main(
    age: Field,
    country_code: Field,
    min_age: pub Field,
    allowed_country: pub Field,
) {
    // 나이 검증
    assert(age >= min_age);

    // 국가 코드 검증
    assert(country_code == allowed_country);
}
```

### 2. 증명 내보내기/가져오기

증명을 저장하고 재사용할 수 있습니다.

```javascript
// 증명을 Base64로 인코딩
function encodeProof(proof) {
    const proofArray = Array.from(proof.proof);
    const base64 = btoa(String.fromCharCode(...proofArray));
    return base64;
}

// Base64에서 증명 디코딩
function decodeProof(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return { proof: bytes };
}

// 사용 예시
const encodedProof = encodeProof(proof);
localStorage.setItem('myProof', encodedProof);

// 나중에 불러오기
const savedProof = localStorage.getItem('myProof');
const decodedProof = decodeProof(savedProof);
const isValid = await backend.verifyProof(decodedProof);
```

### 3. 진행률 표시

```javascript
async function generateProofWithProgress(inputs) {
    const steps = [
        { name: 'Witness 생성', progress: 0 },
        { name: '증명 생성', progress: 50 },
        { name: '검증', progress: 90 },
    ];

    updateProgress(steps[0].name, steps[0].progress);
    const { witness } = await noir.execute(inputs);

    updateProgress(steps[1].name, steps[1].progress);
    const proof = await backend.generateProof(witness);

    updateProgress(steps[2].name, steps[2].progress);
    const isValid = await backend.verifyProof(proof);

    updateProgress('완료', 100);

    return { proof, isValid };
}

function updateProgress(step, percent) {
    console.log(`${step}: ${percent}%`);
    // UI 업데이트 로직
}
```

## 🔗 블록체인 통합

### Smart Contract 통합 예제

```javascript
import { ethers } from 'ethers';

// Solidity 검증 계약 ABI
const verifierABI = [
    "function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool)"
];

async function verifyOnChain(proof, publicInputs) {
    // MetaMask 연결
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = provider.getSigner();

    // 검증 계약 연결
    const verifierAddress = "0x..."; // 배포된 계약 주소
    const verifier = new ethers.Contract(verifierAddress, verifierABI, signer);

    // 온체인 검증
    const isValid = await verifier.verify(proof.proof, publicInputs);

    return isValid;
}
```

## 📊 성능 최적화

### 1. Worker 사용

증명 생성을 별도 스레드에서 수행:

`worker.js`:
```javascript
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';

self.onmessage = async (e) => {
    const { circuit, inputs } = e.data;

    const backend = new UltraHonkBackend(circuit.bytecode);
    const noir = new Noir(circuit, backend);

    const { witness } = await noir.execute(inputs);
    const proof = await backend.generateProof(witness);
    const isValid = await backend.verifyProof(proof);

    self.postMessage({ proof, isValid });
};
```

`main.js`:
```javascript
const worker = new Worker(new URL('./worker.js', import.meta.url), {
    type: 'module'
});

worker.onmessage = (e) => {
    const { proof, isValid } = e.data;
    console.log('증명 완료:', isValid);
};

worker.postMessage({ circuit, inputs });
```

### 2. 캐싱

```javascript
class ProofCache {
    constructor() {
        this.cache = new Map();
    }

    getKey(inputs) {
        return JSON.stringify(inputs);
    }

    get(inputs) {
        return this.cache.get(this.getKey(inputs));
    }

    set(inputs, proof) {
        this.cache.set(this.getKey(inputs), proof);
    }
}

const cache = new ProofCache();

async function generateProofCached(inputs) {
    const cached = cache.get(inputs);
    if (cached) {
        console.log('캐시된 증명 사용');
        return cached;
    }

    const proof = await generateProof(inputs);
    cache.set(inputs, proof);
    return proof;
}
```

## 🎨 실전 예제: 투표 DApp

### 회로

`circuit/src/main.nr`:
```rust
use std::hash::pedersen_hash;

fn main(
    voter_id: Field,
    vote: Field,
    voter_commitment: pub Field,
) {
    // 투표자 신원 검증
    let commitment = pedersen_hash([voter_id]);
    assert(commitment == voter_commitment);

    // 투표 유효성 검증 (0 또는 1)
    assert(vote * (vote - 1) == 0);
}
```

### 프론트엔드

```javascript
// 투표 제출
async function submitVote(voterId, vote) {
    // 커밋먼트 생성
    const commitment = await generateCommitment(voterId);

    // 증명 생성
    const inputs = {
        voter_id: voterId,
        vote: vote,
        voter_commitment: commitment,
    };

    const { witness } = await noir.execute(inputs);
    const proof = await backend.generateProof(witness);

    // 블록체인에 제출
    await submitToBlockchain(proof, commitment);

    return '투표가 성공적으로 제출되었습니다!';
}
```

## ✅ 배포하기

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 빌드
npm run build

# 배포
vercel
```

### Netlify 배포

```bash
# 빌드
npm run build

# Netlify CLI로 배포
npx netlify-cli deploy --prod --dir=dist
```

## 🔍 디버깅 팁

### 1. 콘솔 로깅

```javascript
noir.execute(inputs).then(result => {
    console.log('Witness:', result.witness);
    console.log('Return value:', result.returnValue);
});
```

### 2. 에러 핸들링

```javascript
try {
    const { witness } = await noir.execute(inputs);
} catch (error) {
    if (error.message.includes('assertion failed')) {
        console.error('제약 조건 위반:', error);
    } else {
        console.error('알 수 없는 오류:', error);
    }
}
```

## ✅ 완성 체크리스트

- [ ] nargo 버전 확인 (1.0.0-beta.9 권장)
- [ ] 패키지 설치 (@noir-lang/noir_js@1.0.0-beta.9, @aztec/bb.js@0.87.0)
- [ ] vite-plugin-node-polyfills 설치
- [ ] 회로 작성 및 컴파일
- [ ] HTML/CSS 작성
- [ ] JavaScript 로직 구현 (UltraHonkBackend 사용)
- [ ] vite.config.js 설정 (exclude, COOP/COEP 헤더)
- [ ] 로컬에서 테스트
- [ ] 브라우저 콘솔에서 로그 확인
- [ ] 증명 생성 확인
- [ ] 증명 검증 확인
- [ ] 배포

## 🚀 다음 단계

축하합니다! 이제 Noir를 사용한 Zero-Knowledge Proof 애플리케이션을 만들 수 있습니다!

### 더 배울 내용:
- Recursive proofs (증명의 증명)
- zkSNARK vs zkSTARK
- 고급 암호학 프리미티브
- 최적화 기법

## 📚 추가 리소스

- [Noir 공식 튜토리얼](https://noir-lang.org/docs/tutorials/noirjs_app) - 이 튜토리얼의 기반
- [NoirJS API 문서](https://noir-lang.org/docs/tooling/noir_js)
- [Barretenberg 문서](https://barretenberg.aztec.network)
- [@aztec/bb.js GitHub](https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg/ts)
- [예제 프로젝트](https://github.com/noir-lang/awesome-noir)
- [Noir Discord](https://discord.gg/JtqzkdeQ6G)

### 실습 예제

이 저장소의 `examples/noir-age-app/` 디렉토리에서 완성된 코드를 확인할 수 있습니다:

```bash
cd examples/noir-age-app
npm install
npm run dev
```

## 💡 프로젝트 아이디어

1. **익명 투표 시스템**
2. **프라이빗 경매**
3. **신원 확인 (KYC without revealing identity)**
4. **비밀 멤버십 증명**
5. **프라이빗 토큰 전송**

---

이것으로 Noir Zero-Knowledge Proof 튜토리얼을 마칩니다! 🎉

질문이나 피드백은 [Noir Forum](https://forum.aztec.network/c/noir/7)에서 나눠주세요.
