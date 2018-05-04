// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_CONSTANT
// ADDRESS_SPACE
// APPEND_ADDRESS_SPACE


void APPEND_ADDRESS_SPACE(memoryCopy)(unsigned char* destination, const unsigned char* source, int amount);

void APPEND_ADDRESS_SPACE(memorySet) (unsigned char* destination, unsigned char value, int amountToSet);


//******From field.h******

/** Compare two field elements. Requires both inputs to be normalized */
int APPEND_ADDRESS_SPACE(secp256k1_fe_cmp_var)(const secp256k1_fe *a, ADDRESS_SPACE const secp256k1_fe *b); //original name: secp256k1_fe_cmp_var

/** Adds a field element to another. The result has the sum of the inputs' magnitudes as magnitude. */
void APPEND_ADDRESS_SPACE(secp256k1_fe_add)(secp256k1_fe *r, ADDRESS_SPACE const secp256k1_fe *a); //original name: secp256k1_fe_add

//******end of field.h******


//******From group.h******
/** Set r equal to the sum of a and b (with b given in affine coordinates). This is more efficient
    than secp256k1_gej_add_var. It is identical to secp256k1_gej_add_ge but without constant-time
    guarantee, and b is allowed to be infinity. If rzr is non-NULL, r->z = a->z * *rzr (a cannot be infinity in that case). */
void APPEND_ADDRESS_SPACE(secp256k1_gej_add_ge_var)(secp256k1_gej *r, const secp256k1_gej *a, ADDRESS_SPACE const secp256k1_ge *b, secp256k1_fe *rzr);

//******End of group.h******

//******From scalar.h******
/** Compute the inverse of a scalar (modulo the group order). */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse)(secp256k1_scalar *r, ADDRESS_SPACE const secp256k1_scalar *a);

/** Compute the inverse of a scalar (modulo the group order), without constant-time guarantee. */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse_var)(secp256k1_scalar *r, ADDRESS_SPACE const secp256k1_scalar *a);

/** Multiply a and b (without taking the modulus!), divide by 2**shift, and round to the nearest integer. Shift must be at least 256. */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_mul_shift_var)(secp256k1_scalar *r, const secp256k1_scalar *a, const secp256k1_scalar *b, unsigned int shift);
//******End of scalar.h******


//******From scalar_8x32_impl.h******
int APPEND_ADDRESS_SPACE(secp256k1_scalar_is_zero)(ADDRESS_SPACE const secp256k1_scalar *a);

void APPEND_ADDRESS_SPACE(secp256k1_scalar_mul_512)(
  uint32_t *l, 
  const secp256k1_scalar *a, 
  ADDRESS_SPACE const secp256k1_scalar *b
);
//******end of scalar_8x32_impl.h******


//******From ecmult_impl.h******
void APPEND_ADDRESS_SPACE(secp256k1_ecmult_context_build)(secp256k1_ecmult_context *output, const secp256k1_callback *cb);

//******End of ecmult_impl.h******
