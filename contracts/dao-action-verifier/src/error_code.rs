#[cfg_attr(test, allow(dead_code))]
#[derive(Copy, Clone, Debug)]
#[repr(i8)]
pub enum ErrorCode {
    IndexOutOfBound = 16,
    ItemMissing = 17,
    LengthNotEnough = 18,
    Encoding = 19,
    Unknown = 20,

    // custom errors
    DuplicatedActionData = 64,
    InvalidActionDataSchema = 65,
    NotCoverred = 66,
    NotFound = 67,
    NotMatched = 68,
    InvalidHeaderDepIndex = 69,
}
