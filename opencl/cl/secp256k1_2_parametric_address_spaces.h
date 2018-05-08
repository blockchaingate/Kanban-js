// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_CONSTANT
// ADDRESS_SPACE_ONE
// ADDRESS_SPACE_TWO
// APPEND_ADDRESS_SPACE
// APPEND_ADDRESS_SPACE_ONE
// APPEND_ADDRESS_SPACE_TWO


//******From ecdsa.h******
char APPEND_ADDRESS_SPACE(secp256k1_ecdsa_sig_verify)(
  ADDRESS_SPACE_ONE const secp256k1_ecmult_context *ctx, 
  ADDRESS_SPACE_TWO const secp256k1_scalar* r, 
  ADDRESS_SPACE_TWO const secp256k1_scalar* s, 
  ADDRESS_SPACE_TWO const secp256k1_ge *pubkey, 
  ADDRESS_SPACE_TWO const secp256k1_scalar *message, 
  unsigned char* comments
);
//******End of ecdsa.h******
