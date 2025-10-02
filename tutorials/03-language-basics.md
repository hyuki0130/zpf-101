# Chapter 3: Noir 언어 기초

## 🎯 학습 목표
- Noir의 데이터 타입 이해
- 함수 정의 및 사용
- 제어 흐름 (조건문, 반복문)
- 구조체와 메서드
- 연산자 사용법

## 📊 데이터 타입

### 1. Field (기본 타입)

**Field**는 Noir의 가장 기본적인 타입입니다.

```rust
fn main(x: Field) {
    let y: Field = x + 1;
    assert(y == x + 1);
}
```

**특징:**
- 유한체(Finite Field)의 원소
- 매우 큰 범위의 정수 표현 가능
- 모든 Noir 타입의 기반

### 2. 정수 타입

Noir는 다양한 크기의 부호 있는/없는 정수를 지원합니다.

```rust
fn main() {
    let unsigned: u8 = 255;
    let signed: i8 = -128;

    // 다양한 크기
    let small: u8 = 100;      // 0 ~ 255
    let medium: u32 = 1000;   // 0 ~ 4,294,967,295
    let large: u64 = 10000;   // 매우 큰 범위
}
```

**사용 가능한 정수 타입:**

| 타입 | 범위 | 비트 수 |
|------|------|---------|
| `u8` | 0 ~ 255 | 8 |
| `u16` | 0 ~ 65,535 | 16 |
| `u32` | 0 ~ 4,294,967,295 | 32 |
| `u64` | 0 ~ 2^64 - 1 | 64 |
| `i8` | -128 ~ 127 | 8 |
| `i16` | -32,768 ~ 32,767 | 16 |
| `i32` | -2^31 ~ 2^31 - 1 | 32 |
| `i64` | -2^63 ~ 2^63 - 1 | 64 |

**타입 변환:**

```rust
fn main() {
    let x: Field = 10;
    let y: u32 = x as u32;  // Field → u32
    let z: Field = y as Field;  // u32 → Field
}
```

### 3. Boolean (불리언)

```rust
fn main() {
    let is_valid: bool = true;
    let is_greater = 10 > 5;  // true

    assert(is_valid);
    assert(is_greater);
}
```

**주의:** Noir에는 `&&`, `||` 논리 연산자가 없습니다. 대신 비트 연산자 `&`, `|`를 사용합니다.

```rust
fn main() {
    let a = true;
    let b = false;

    let and_result = a & b;  // false
    let or_result = a | b;   // true
}
```

### 4. 배열 (Arrays)

배열은 같은 타입의 값들을 고정된 크기로 모아놓은 것입니다.

```rust
fn main() {
    // 배열 선언
    let arr: [Field; 3] = [1, 2, 3];

    // 같은 값으로 초기화
    let zeros: [Field; 5] = [0; 5];  // [0, 0, 0, 0, 0]

    // 인덱싱
    let first = arr[0];  // 1
    let second = arr[1]; // 2

    assert(first == 1);
}
```

**가변 배열:**

```rust
fn main() {
    let mut arr = [1, 2, 3];
    arr[0] = 10;
    assert(arr[0] == 10);
}
```

**배열 메서드:**

```rust
fn example_array_methods() {
    let arr = [1, 2, 3, 4, 5];

    // 길이
    let length = arr.len();  // 5

    // 정렬
    let sorted = arr.sort();

    // 매핑
    let doubled = arr.map(|x| x * 2);  // [2, 4, 6, 8, 10]

    // 폴딩 (누적)
    let sum = arr.fold(0, |acc, x| acc + x);  // 15
}
```

### 5. 슬라이스 (Slices)

슬라이스는 동적 크기의 배열입니다.

```rust
fn main() -> pub u32 {
    let mut slice: [Field] = &[0; 2];

    // 요소 추가
    let new_slice = slice.push_back(6);
    let newer_slice = new_slice.push_front(1);

    // 길이 반환
    newer_slice.len()  // 4
}
```

**슬라이스 메서드:**
- `push_back(element)`: 끝에 추가
- `push_front(element)`: 앞에 추가
- `pop_back()`: 끝에서 제거하고 반환
- `pop_front()`: 앞에서 제거하고 반환
- `len()`: 길이 반환

### 6. 튜플 (Tuples)

서로 다른 타입의 값들을 묶을 수 있습니다.

```rust
fn main() {
    let tuple: (Field, bool, u32) = (1, true, 100);

    // 구조 분해
    let (x, y, z) = tuple;

    // 인덱싱
    let first = tuple.0;   // 1
    let second = tuple.1;  // true

    assert(first == 1);
    assert(second);
}
```

### 7. 구조체 (Structs)

관련된 데이터를 묶어서 사용자 정의 타입을 만듭니다.

```rust
struct Point {
    x: Field,
    y: Field,
}

fn main() {
    let p = Point { x: 10, y: 20 };

    assert(p.x == 10);
    assert(p.y == 20);
}
```

**구조체 메서드:**

```rust
struct Rectangle {
    width: Field,
    height: Field,
}

impl Rectangle {
    // 메서드
    fn area(self) -> Field {
        self.width * self.height
    }

    // 연관 함수 (생성자)
    fn new(width: Field, height: Field) -> Self {
        Rectangle { width, height }
    }
}

fn main() {
    let rect = Rectangle::new(5, 10);
    let area = rect.area();
    assert(area == 50);
}
```

## 🔧 함수

### 함수 정의

```rust
fn add(x: Field, y: Field) -> Field {
    x + y
}

fn main() {
    let result = add(5, 10);
    assert(result == 15);
}
```

**주요 특징:**
- `fn` 키워드로 정의
- 매개변수는 타입 명시 필수
- 반환 타입은 `->` 다음에 지정
- 마지막 표현식이 자동으로 반환됨 (세미콜론 없음)

### 가시성 (Visibility)

```rust
// 패키지 외부에서 접근 가능
pub fn public_function() -> Field {
    1
}

// 같은 크레이트 내에서만 접근 가능
pub(crate) fn crate_function() -> Field {
    2
}

// 기본: 패키지 내부에서만 접근 가능
fn private_function() -> Field {
    3
}
```

### 람다 함수

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];

    // 람다 함수 사용
    let doubled = arr.map(|x| x * 2);
    let sum = arr.fold(0, |acc, x| acc + x);
}
```

## 🎮 제어 흐름

### 1. If 표현식

```rust
fn main(x: Field) {
    let result = if x > 10 {
        1
    } else if x > 5 {
        2
    } else {
        3
    };

    assert(result <= 3);
}
```

**특징:**
- 괄호 `()` 불필요
- 표현식이므로 값을 반환할 수 있음

### 2. For 루프

```rust
fn main() {
    let mut sum = 0;

    // 0부터 9까지 (10 제외)
    for i in 0..10 {
        sum += i;
    }

    // 0부터 10까지 (10 포함)
    for i in 0..=10 {
        sum += i;
    }

    assert(sum == 55);
}
```

**제약 사항:**
- 루프 횟수는 컴파일 타임에 결정되어야 함
- 인덱스는 `u64` 타입

### 3. While 루프 (Unconstrained에서만)

```rust
unconstrained fn count_up() -> Field {
    let mut i = 0;

    while i < 10 {
        i += 1;
    }

    i
}
```

### 4. Loop (Unconstrained에서만)

```rust
unconstrained fn infinite_until_break() {
    let mut i = 0;

    loop {
        i += 1;
        if i == 10 {
            break;
        }
    }
}
```

## ➗ 연산자

### 1. 산술 연산자

```rust
fn arithmetic() {
    let a = 10;
    let b = 3;

    let sum = a + b;        // 13
    let diff = a - b;       // 7
    let product = a * b;    // 30
    let quotient = a / b;   // 3
    let remainder = a % b;  // 1
}
```

### 2. 비교 연산자

```rust
fn comparison(x: Field, y: Field) {
    let is_equal = x == y;
    let is_not_equal = x != y;
    let is_less = x < y;
    let is_less_or_equal = x <= y;
    let is_greater = x > y;
    let is_greater_or_equal = x >= y;
}
```

### 3. 비트 연산자

```rust
fn bitwise() {
    let a: u8 = 0b1010;  // 10
    let b: u8 = 0b1100;  // 12

    let and = a & b;     // 0b1000 = 8
    let or = a | b;      // 0b1110 = 14
    let xor = a ^ b;     // 0b0110 = 6
    let left = a << 1;   // 0b10100 = 20
    let right = a >> 1;  // 0b0101 = 5
}
```

### 4. 복합 할당 연산자

```rust
fn compound_assignment() {
    let mut x = 10;

    x += 5;  // x = x + 5
    x -= 3;  // x = x - 3
    x *= 2;  // x = x * 2
    x /= 4;  // x = x / 4
    x %= 3;  // x = x % 3
}
```

## 🔒 Assert와 제약 조건

### Assert

```rust
fn main(x: Field) {
    // 기본 assert
    assert(x > 0);

    // 에러 메시지와 함께
    assert(x < 100, "x must be less than 100");

    // 포맷 문자열 사용
    assert(x != 50, f"x is {x}, but should not be 50");
}
```

### Static Assert (컴파일 타임)

```rust
fn main() {
    let x = 2;
    let y = 4;

    // 컴파일 타임에 검증
    static_assert(x + x == y, "expected 2 + 2 to equal 4");
}
```

## 🎓 실습 예제

### 예제 1: 최댓값 찾기

```rust
fn max(a: Field, b: Field) -> Field {
    if a > b {
        a
    } else {
        b
    }
}

fn main() {
    let result = max(10, 20);
    assert(result == 20);
}
```

### 예제 2: 배열 합계

```rust
fn sum_array(arr: [Field; 5]) -> Field {
    let mut total = 0;

    for i in 0..5 {
        total += arr[i];
    }

    total
}

fn main() {
    let numbers = [1, 2, 3, 4, 5];
    let result = sum_array(numbers);
    assert(result == 15);
}
```

### 예제 3: 구조체를 사용한 포인트 거리

```rust
struct Point {
    x: Field,
    y: Field,
}

impl Point {
    fn distance_squared(self, other: Point) -> Field {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        dx * dx + dy * dy
    }
}

fn main() {
    let p1 = Point { x: 0, y: 0 };
    let p2 = Point { x: 3, y: 4 };

    let dist_sq = p1.distance_squared(p2);
    assert(dist_sq == 25);  // 3^2 + 4^2 = 25
}
```

### 예제 4: 범위 내 값 확인

```rust
fn is_in_range(value: Field, min: Field, max: Field) -> bool {
    (value >= min) & (value <= max)
}

fn main(value: Field, min: pub Field, max: pub Field) {
    let in_range = is_in_range(value, min, max);
    assert(in_range);
}
```

`Prover.toml`:
```toml
value = "50"
min = "0"
max = "100"
```

## 💡 베스트 프랙티스

### 1. Field vs 정수 타입 선택

```rust
// ✅ 좋은 예: 암호학적 연산에는 Field 사용
fn hash_like(x: Field) -> Field {
    x * x + x + 1
}

// ✅ 좋은 예: 일반 산술에는 정수 타입 사용
fn count_items(items: [u32; 10]) -> u32 {
    items.len() as u32
}
```

### 2. 효율적인 회로 작성

```rust
// ❌ 나쁜 예: 루프 안에 복잡한 로직
fn inefficient(arr: [Field; 100]) -> Field {
    let mut result = 0;
    for i in 0..100 {
        result += arr[i] * arr[i] + arr[i];  // 많은 제약 조건 생성
    }
    result
}

// ✅ 좋은 예: 간단한 로직 사용
fn efficient(arr: [Field; 100]) -> Field {
    let mut result = 0;
    for i in 0..100 {
        result += arr[i];  // 적은 제약 조건
    }
    result
}
```

### 3. 타입 안전성

```rust
// ✅ 명시적 타입 사용
fn calculate(x: Field, y: Field) -> Field {
    x + y
}

// ✅ 타입 변환 명시
fn convert(x: Field) -> u32 {
    x as u32
}
```

## 🔍 트레이트 (Traits)

트레이트는 타입이 구현해야 하는 메서드들을 정의합니다.

```rust
trait Area {
    fn area(self) -> Field;
}

struct Rectangle {
    width: Field,
    height: Field,
}

impl Area for Rectangle {
    fn area(self) -> Field {
        self.width * self.height
    }
}

struct Circle {
    radius: Field,
}

impl Area for Circle {
    fn area(self) -> Field {
        // 간단히 πr^2를 근사
        3 * self.radius * self.radius
    }
}

fn main() {
    let rect = Rectangle { width: 5, height: 10 };
    let circle = Circle { radius: 3 };

    assert(rect.area() == 50);
    assert(circle.area() == 27);
}
```

## 🎯 제네릭 (Generics)

### 제네릭 함수

```rust
fn identity<T>(x: T) -> T {
    x
}

fn main() {
    let a: Field = identity(10);
    let b: u32 = identity(20);

    assert(a == 10);
    assert(b == 20);
}
```

### 제네릭 구조체

```rust
struct Pair<T> {
    first: T,
    second: T,
}

fn main() {
    let pair = Pair { first: 10, second: 20 };
    assert(pair.first == 10);
}
```

### 숫자 제네릭 (배열 크기)

```rust
fn sum_generic<let N: u32>(arr: [Field; N]) -> Field {
    let mut total = 0;
    for i in 0..N {
        total += arr[i];
    }
    total
}

fn main() {
    let arr1 = [1, 2, 3];
    let arr2 = [1, 2, 3, 4, 5];

    let sum1 = sum_generic(arr1);  // N = 3
    let sum2 = sum_generic(arr2);  // N = 5

    assert(sum1 == 6);
    assert(sum2 == 15);
}
```

## ✅ 체크리스트

다음 내용을 직접 코드로 작성해보세요:

- [ ] 다양한 데이터 타입 사용
- [ ] 구조체 정의 및 메서드 구현
- [ ] 배열 조작 (map, fold)
- [ ] 제어 흐름 (if, for)
- [ ] 함수 정의 및 호출
- [ ] 트레이트 구현
- [ ] 제네릭 함수 작성

## 🚀 다음 단계

이제 ZKP의 핵심인 증명 생성과 검증 방법을 배워봅시다!

👉 [Chapter 4: 증명 생성과 검증](./04-proof-generation.md)

## 📚 참고 자료

- [Noir 데이터 타입 공식 문서](https://noir-lang.org/docs/noir/concepts/data_types)
- [Noir 함수 문서](https://noir-lang.org/docs/noir/concepts/functions)
- [Noir 제어 흐름](https://noir-lang.org/docs/noir/concepts/control_flow)
