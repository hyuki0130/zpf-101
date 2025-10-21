import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import { ethers } from 'ethers';
import circuit from '../circuit/target/circuit.json';

// Verifier 계약 주소 (Sepolia 테스트넷)
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
        // Backend 초기화 (Keccak ZK - bb.js 0.87.0)
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
            // console.log('📊 Public Input:', input, '→', hex);
            return hex;
        });
        // console.log('📊 Public Inputs 전체:', publicInputsBytes32);
        // console.log('📊 proof 전체:', proof);

        // 7. 증명을 16진수 문자열로 변환
        const proofHex = '0x' + Array.from(proof.proof)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        // console.log('🔐 Proof 크기:', proofHex.length / 2, 'bytes');
        // console.log('🔐 Proof Hex 전체:\n', proofHex);

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

        // 온체인 검증 (블록체인) - Keccak ZK oracle hash
        console.log('🔒 온체인용 증명 생성 중 (Keccak ZK)...');
        const proof = await backend.generateProof(witness, { keccak : true });
        console.log('✅ 증명 생성 완료');
        // console.log('ProofData 전체:', proof);
        // console.log('증명 크기 (proof.proof):', proof.proof.length, 'bytes');
        // console.log('공개 입력 (publicInputs):', proof.publicInputs);

        // 2. 검증 방식에 따라 분기
        let isValid = false;
            
        console.log(`🔍 ${verifyMode} 검증 중...`);
        if (verifyMode === 'offchain') {
            isValid = await backend.verifyProof(proof, { keccak : true });
        } else if (verifyMode === 'onchain') {
            isValid = await verifyOnChain(proof, proof.publicInputs);
        }
        console.log(`✅ ${verifyMode} 검증 완료: ${isValid}`);

        if (isValid) {
            showResult(
                `✅ ${verifyMode} 검증 성공!\n\n` +
                `🎉 블록체인에서 ${minAge}세 이상임이 검증되었습니다!\n\n` +
                `📊 증명 크기: ${(proof.proof.length / 1024).toFixed(2)} KB\n` +
                `🔐 당신의 실제 나이(${age}세)는 비밀로 유지됩니다.\n\n` +
                `🔗 검증 위치: Sepolia 블록체인\n` +
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
