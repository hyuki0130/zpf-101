fn main(age: u8, min_age: pub u8) {
    assert(age >= min_age);
}

#[test]
fn test_main() {
    main(3, 2);

    // Uncomment to make test fail
    // main(1, 1);
}
