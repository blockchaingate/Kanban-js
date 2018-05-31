// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_CONSTANT
// ADDRESS_SPACE
// APPEND_ADDRESS_SPACE

//******From field_10x26.h******
void secp256k1_fe_copy__from__global(secp256k1_fe* output, __global const secp256k1_fe* input);
//******end of field_10x26.h******

//******From ecmult_impl.h******
void APPEND_ADDRESS_SPACE(secp256k1_ecmult_odd_multiples_table_globalz_windowa)(
  ADDRESS_SPACE secp256k1_ge *pre,
  secp256k1_fe *globalz,
  const secp256k1_gej *a,
  __global unsigned char* memoryPool
);
//******end of ecmult_impl.h******

//******From group_impl.h******
void APPEND_ADDRESS_SPACE(secp256k1_ge_copy)(ADDRESS_SPACE secp256k1_ge* output, const secp256k1_ge* input);
/** Bring a batch inputs given in jacobian coordinates (with known z-ratios) to
 *  the same global z "denominator". zr must contain the known z-ratios such
 *  that mul(a[i].z, zr[i+1]) == a[i+1].z. zr[0] is ignored. The x and y
 *  coordinates of the result are stored in r, the common z coordinate is
 *  stored in globalz. */
void APPEND_ADDRESS_SPACE(secp256k1_ge_globalz_set_table_gej)(
  size_t len, 
  ADDRESS_SPACE secp256k1_ge *r,
  secp256k1_fe *globalz, 
  __global const secp256k1_gej *a, 
  __global const secp256k1_fe *zr
);

//******end of group_impl.h******


void APPEND_ADDRESS_SPACE(sha256GPU_inner)(
  ADDRESS_SPACE unsigned char* result, 
  unsigned int length, 
  ADDRESS_SPACE const char* message
);