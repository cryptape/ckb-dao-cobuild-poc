use ckb_auth_rs::CkbAuthError;
use ckb_std::{debug, error::SysError};

/// Error
#[repr(i8)]
pub enum Error {
    IndexOutOfBound = 1,
    ItemMissing,
    LengthNotEnough,
    Encoding,
    // Add customized errors here...
    CkbAuthLoadError,
    CkbAuthError,
}

impl From<SysError> for Error {
    fn from(err: SysError) -> Self {
        use SysError::*;
        match err {
            IndexOutOfBound => Self::IndexOutOfBound,
            ItemMissing => Self::ItemMissing,
            LengthNotEnough(_) => Self::LengthNotEnough,
            Encoding => Self::Encoding,
            Unknown(err_code) => panic!("unexpected sys error {}", err_code),
        }
    }
}

impl From<CkbAuthError> for Error {
    fn from(err: CkbAuthError) -> Self {
        debug!("ckb auth error: {:?}", err);
        match err {
            CkbAuthError::RunDLError => Error::CkbAuthError,
            _ => Error::CkbAuthLoadError,
        }
    }
}
