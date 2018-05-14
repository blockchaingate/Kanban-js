// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_CONSTANT
// ADDRESS_SPACE
// APPEND_ADDRESS_SPACE




void APPEND_ADDRESS_SPACE(memoryCopy)(unsigned char* destination, ADDRESS_SPACE const unsigned char* source, int amount);
void APPEND_ADDRESS_SPACE(memoryCopy_to__global)(__global unsigned char* destination, ADDRESS_SPACE const unsigned char* source, int amount);

void APPEND_ADDRESS_SPACE(memorySet) (unsigned char* destination, unsigned char value, int amountToSet);


void APPEND_ADDRESS_SPACE(memoryPool_write_ge_asOutput)(
  ADDRESS_SPACE const secp256k1_ge* input, unsigned int argumentIndex, __global unsigned char* memoryPool
);


//******From field_10x26_impl.h******
/** Set a field element equal to 32-byte big endian value. If successful, the resulting field element is normalized. */
int APPEND_ADDRESS_SPACE(secp256k1_fe_set_b32)(secp256k1_fe *r, ADDRESS_SPACE const unsigned char *a);
//******end of field_10x26_impl.h******


//******From field.h******

/** Compare two field elements. Requires both inputs to be normalized */
int APPEND_ADDRESS_SPACE(secp256k1_fe_cmp_var)(const secp256k1_fe *a, ADDRESS_SPACE const secp256k1_fe *b); //original name: secp256k1_fe_cmp_var

/** Adds a field element to another. The result has the sum of the inputs' magnitudes as magnitude. */
void APPEND_ADDRESS_SPACE(secp256k1_fe_add)(secp256k1_fe *r, ADDRESS_SPACE const secp256k1_fe *a); //original name: secp256k1_fe_add

/** Sets a field element to be the product of two others. Requires the inputs' magnitudes to be at most 8.
 *  The output magnitude is 1 (but not guaranteed to be normalized). */
void APPEND_ADDRESS_SPACE(secp256k1_fe_mul)(secp256k1_fe *r, const secp256k1_fe *a, ADDRESS_SPACE const secp256k1_fe *b);

/** If flag is true, set *r equal to *a; otherwise leave it. Constant-time. */
void APPEND_ADDRESS_SPACE(secp256k1_fe_storage_cmov)(secp256k1_fe_storage *r, ADDRESS_SPACE const secp256k1_fe_storage *a, int flag);
void APPEND_ADDRESS_SPACE(secp256k1_fe_storage_cmov_to__global)(__global secp256k1_fe_storage *r, ADDRESS_SPACE const secp256k1_fe_storage *a, int flag);

/** Convert a field element to the storage type. */
void APPEND_ADDRESS_SPACE(secp256k1_fe_to_storage)(secp256k1_fe_storage *r, ADDRESS_SPACE const secp256k1_fe *a);
void APPEND_ADDRESS_SPACE(secp256k1_fe_to__global__storage)(__global secp256k1_fe_storage *r, ADDRESS_SPACE const secp256k1_fe *a);

/** Convert a field element back from the storage type. */
void APPEND_ADDRESS_SPACE(secp256k1_fe_from_storage)(secp256k1_fe *r, ADDRESS_SPACE const secp256k1_fe_storage *a);

/** Convert a field element back from the storage type. */
void APPEND_ADDRESS_SPACE(secp256k1_fe_from_storage__to__global)(__global secp256k1_fe *r, ADDRESS_SPACE const secp256k1_fe_storage *a);

//******end of field.h******


//******From field_10x26_impl.h******
void APPEND_ADDRESS_SPACE(secp256k1_fe_copy__to__global)(__global secp256k1_fe* output, ADDRESS_SPACE const secp256k1_fe* input);
//******End of field_10x26_impl.h******


//******From group.h******
/** Set r equal to the sum of a and b (with b given in affine coordinates). This is more efficient
    than secp256k1_gej_add_var. It is identical to secp256k1_gej_add_ge but without constant-time
    guarantee, and b is allowed to be infinity. If rzr is non-NULL, r->z = a->z * *rzr (a cannot be infinity in that case). */
void APPEND_ADDRESS_SPACE(secp256k1_gej_add_ge_var)(secp256k1_gej *r, const secp256k1_gej *a, ADDRESS_SPACE const secp256k1_ge *b, secp256k1_fe *rzr);

/** Convert a group element to the storage type. */
void APPEND_ADDRESS_SPACE(secp256k1_ge_to_storage)(secp256k1_ge_storage *r, ADDRESS_SPACE const secp256k1_ge *a);
void APPEND_ADDRESS_SPACE(secp256k1_ge_to__global__storage)(__global secp256k1_ge_storage *r, ADDRESS_SPACE const secp256k1_ge *a);

/** Convert a group element back from the storage type. */
void APPEND_ADDRESS_SPACE(secp256k1_ge_from_storage)(secp256k1_ge *r, ADDRESS_SPACE const secp256k1_ge_storage *a);
void APPEND_ADDRESS_SPACE(secp256k1_ge_from_storage_to__global)(__global secp256k1_ge *r, ADDRESS_SPACE const secp256k1_ge_storage *a);

//******End of group.h******

//******From group_impl.h******
/** If flag is true, set *r equal to *a; otherwise leave it. Constant-time. */
void APPEND_ADDRESS_SPACE(secp256k1_ge_storage_cmov)(secp256k1_ge_storage *r, ADDRESS_SPACE const secp256k1_ge_storage *a, int flag);
void APPEND_ADDRESS_SPACE(secp256k1_ge_storage_cmov__to__global)(__global secp256k1_ge_storage *r, ADDRESS_SPACE const secp256k1_ge_storage *a, int flag);
void APPEND_ADDRESS_SPACE(secp256k1_ge_copy__to__global)(__global secp256k1_ge* output, ADDRESS_SPACE const secp256k1_ge* input);

//******end of group_impl.h******

//******From scalar.h******
/** Compute the inverse of a scalar (modulo the group order). */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse)(secp256k1_scalar *r, ADDRESS_SPACE const secp256k1_scalar *a);

/** Compute the inverse of a scalar (modulo the group order), without constant-time guarantee. */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse_var)(secp256k1_scalar *r, ADDRESS_SPACE const secp256k1_scalar *a);

/** Multiply a and b (without taking the modulus!), divide by 2**shift, and round to the nearest integer. Shift must be at least 256. */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_mul_shift_var)(
  secp256k1_scalar *r, 
  const secp256k1_scalar *a, 
  const secp256k1_scalar *b, 
  unsigned int shift
);

void APPEND_ADDRESS_SPACE(secp256k1_scalar_copy__to__global)(__global secp256k1_scalar* output, ADDRESS_SPACE secp256k1_scalar* input);

/** Multiply two scalars (modulo the group order). */
void APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(secp256k1_scalar *r, const secp256k1_scalar *a, ADDRESS_SPACE const secp256k1_scalar *b);

//******End of scalar.h******

void APPEND_ADDRESS_SPACE(secp256k1_gej_copy__to__global)(__global secp256k1_gej* output, ADDRESS_SPACE const secp256k1_gej* input);


//******From scalar_8x32_impl.h******
int APPEND_ADDRESS_SPACE(secp256k1_scalar_is_zero)(ADDRESS_SPACE const secp256k1_scalar *a);

void APPEND_ADDRESS_SPACE(secp256k1_scalar_get_b32)(unsigned char *bin, ADDRESS_SPACE const secp256k1_scalar* a);

void APPEND_ADDRESS_SPACE(secp256k1_scalar_mul_512)(
  uint32_t *l, 
  const secp256k1_scalar *a, 
  ADDRESS_SPACE const secp256k1_scalar *b
);
//******end of scalar_8x32_impl.h******
