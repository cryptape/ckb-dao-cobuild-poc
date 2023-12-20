#[cfg_attr(test, allow(dead_code))]
#[repr(i8)]
pub enum Error {
    IndexOutOfBound = 1,
    ItemMissing = 2,
    LengthNotEnough = 3,
    Encoding = 4,
    // Add customized errors here...
    PublicKeyFormatError = 5,
    SignatureFormatError = 6,
    SignatureVerifyingError = 7,
    WitnessLayoutError = 8,
    SealFormatError = 9,
    ChallengeUnmatchError = 10,
    ClientDataFormatError = 11,
    PublicKeyHashUnmatchError = 12,
}
