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
        // backend 초기화
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