use std::hash::pedersen_hash;

fn main(
    // private
    voter_id: Field,
    secret_key: Field,
    vote: Field,

    // public
    voter_commitment: pub Field,
    vote_hash: Field,
) {
    // 1. verify voter id
    let computed_commitment = pedersen_hash([voter_id, secret_key]);
    assert(computed_commitment == voter_commitment);

    // 2. verify the vote
    assert(vote * (vote - 1) == 0);

    // 3. verify the vote hash
    let computed_vote_hash = pedersen_hash([voter_id, vote]);
    assert(computed_vote_hash == vote_hash)
}

// #[test]
// fn test_main() {
//     main(1, 2);

//     // Uncomment to make test fail
//     // main(1, 1);
// }
