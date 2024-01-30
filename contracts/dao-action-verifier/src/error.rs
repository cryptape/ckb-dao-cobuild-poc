use crate::error_code::ErrorCode;
use ckb_std::error::SysError;

#[derive(Debug)]
pub enum Error {
    CkbStd(SysError),
}

impl From<Error> for ErrorCode {
    fn from(err: Error) -> ErrorCode {
        match err {
            Error::CkbStd(err) => match err {
                SysError::IndexOutOfBound => ErrorCode::IndexOutOfBound,
                SysError::ItemMissing => ErrorCode::ItemMissing,
                SysError::LengthNotEnough(_) => ErrorCode::LengthNotEnough,
                SysError::Encoding => ErrorCode::Encoding,
                SysError::Unknown(_) => ErrorCode::Unknown,
            },
        }
    }
}

impl From<Error> for i8 {
    fn from(err: Error) -> i8 {
        ErrorCode::from(err) as i8
    }
}

impl From<SysError> for Error {
    fn from(err: SysError) -> Self {
        Error::CkbStd(err)
    }
}

#[macro_export]
macro_rules! trace_error {
    ($err:expr, $message:literal) => {{
        let err = $crate::error::Error::from($err);
        #[cfg(debug_assertions)]
        ckb_std::debug!("{}:{} {:?} {}", file!(), line!(), err, $message);
        err
    }};
}
