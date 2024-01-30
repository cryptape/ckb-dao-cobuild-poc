#[cfg_attr(test, allow(dead_code))]
#[repr(i8)]
pub enum ErrorCode {
    IndexOutOfBound = 16,
    ItemMissing = 17,
    LengthNotEnough = 18,
    Encoding = 19,
    Unknown = 20,
}
