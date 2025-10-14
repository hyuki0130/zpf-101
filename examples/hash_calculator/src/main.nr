use std::hash::pedersen_hash;

fn main(
    voter_id: Field,
    secret_key: Field,
    vote: Field,
) -> pub (Field, Field) {
    let voter_commitment = pedersen_hash([voter_id, secret_key]);
    let vote_hash = pedersen_hash([voter_id, vote]);

    (voter_commitment, vote_hash)
}

#[test]
fn test_hash() {
    let (commitment, vote_hash) = main(12345, 67890, 1);
    std::println(commitment);
    std::println(vote_hash);
}
