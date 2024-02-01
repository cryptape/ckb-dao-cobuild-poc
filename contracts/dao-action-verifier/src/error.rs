use crate::error_code::ErrorCode;
use ckb_std::error::SysError;

#[derive(Debug)]
pub enum Error {
    CkbStdSysError(SysError),
    InvalidActionDataSchema(molecule::error::VerificationError),
    Custom(ErrorCode),
}

impl From<Error> for ErrorCode {
    fn from(err: Error) -> ErrorCode {
        match err {
            Error::CkbStdSysError(err) => match err {
                SysError::IndexOutOfBound => ErrorCode::IndexOutOfBound,
                SysError::ItemMissing => ErrorCode::ItemMissing,
                SysError::LengthNotEnough(_) => ErrorCode::LengthNotEnough,
                SysError::Encoding => ErrorCode::Encoding,
                SysError::Unknown(_) => ErrorCode::Unknown,
            },
            Error::InvalidActionDataSchema(_) => ErrorCode::InvalidActionDataSchema,
            Error::Custom(code) => code,
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
        Error::CkbStdSysError(err)
    }
}

impl From<molecule::error::VerificationError> for Error {
    fn from(err: molecule::error::VerificationError) -> Self {
        Error::InvalidActionDataSchema(err)
    }
}

impl From<ErrorCode> for Error {
    fn from(code: ErrorCode) -> Self {
        Error::Custom(code)
    }
}

#[macro_export]
macro_rules! trace_error {
    ($err:expr) => {{
        let err = $crate::error::Error::from($err);
        #[cfg(debug_assertions)]
        ckb_std::debug!("{}:{} {:?}", file!(), line!(), err);
        err
    }};
    ($err:expr, $message:expr) => {{
        let err = $crate::error::Error::from($err);
        #[cfg(debug_assertions)]
        ckb_std::debug!("{}:{} {:?} {}", file!(), line!(), err, $message);
        err
    }};
    ($err:expr, $format:literal, $($args:expr),+) => {{
        let err = $crate::error::Error::from($err);
        #[cfg(debug_assertions)]
        ckb_std::debug!("{}:{} {:?} {}", file!(), line!(), err, core::format_args!($format, $($args), +));
        err
    }};
}
