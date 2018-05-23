// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_CONSTANT
// ADDRESS_SPACE
// APPEND_ADDRESS_SPACE

//******From field_10x26.h******
void secp256k1_fe_copy__from__global(secp256k1_fe* output, __global const secp256k1_fe* input);
//******end of field_10x26.h******


//******From group_impl.h******
void APPEND_ADDRESS_SPACE(secp256k1_ge_copy)(ADDRESS_SPACE secp256k1_ge* output, const secp256k1_ge* input);

//******end of group_impl.h******
