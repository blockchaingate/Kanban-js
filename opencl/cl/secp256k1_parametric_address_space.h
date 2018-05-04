// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_INPUTS 
// ADDRESS_SPACE_CONTEXT
// ADDRESS_SPACE_CONSTANT
// APPEND_ADDRESS_SPACE
// APPEND_ADDRESS_SPACE_INPUTS
// DO_RESERVE_STATIC_CONST


void APPEND_ADDRESS_SPACE(memoryCopy)(unsigned char* destination, const unsigned char* source, int amount);

void APPEND_ADDRESS_SPACE(memorySet) (unsigned char* destination, unsigned char value, int amountToSet);

//******From ecdsa.h******
int APPEND_ADDRESS_SPACE(secp256k1_ecdsa_sig_verify)(
  ADDRESS_SPACE_CONTEXT const secp256k1_ecmult_context *ctx, 
  ADDRESS_SPACE_INPUTS const secp256k1_scalar* r, 
  ADDRESS_SPACE_INPUTS const secp256k1_scalar* s, 
  ADDRESS_SPACE_INPUTS const secp256k1_ge *pubkey, 
  ADDRESS_SPACE_INPUTS const secp256k1_scalar *message
);
//******End of ecdsa.h******


//******From group.h******
//******End of group.h******

//******From scalar.h******
/** Compute the inverse of a scalar (modulo the group order). */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse)(secp256k1_scalar *r, ADDRESS_SPACE_INPUTS const secp256k1_scalar *a);

/** Compute the inverse of a scalar (modulo the group order), without constant-time guarantee. */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse_var)(secp256k1_scalar *r, ADDRESS_SPACE_INPUTS const secp256k1_scalar *a);

/** Multiply a and b (without taking the modulus!), divide by 2**shift, and round to the nearest integer. Shift must be at least 256. */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_mul_shift_var)(secp256k1_scalar *r, const secp256k1_scalar *a, const secp256k1_scalar *b, unsigned int shift);
//******End of scalar.h******


//******From scalar_8x32_impl.h******
int APPEND_ADDRESS_SPACE(secp256k1_scalar_is_zero)(ADDRESS_SPACE_INPUTS const secp256k1_scalar *a);

void APPEND_ADDRESS_SPACE(secp256k1_scalar_mul_512)(
  uint32_t *l, 
  const secp256k1_scalar *a, 
  ADDRESS_SPACE_INPUTS const secp256k1_scalar *b
);
//******end of scalar_8x32_impl.h******


//******From ecmult_impl.h******
void APPEND_ADDRESS_SPACE(secp256k1_ecmult_context_build)(secp256k1_ecmult_context *output, const secp256k1_callback *cb);

//******End of ecmult_impl.h******
