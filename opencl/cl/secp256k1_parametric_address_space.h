// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_INPUTS 
// ADDRESS_SPACE_CONTEXT
// APPEND_ADDRESS_SPACE
// DO_RESERVE_STATIC_CONST

void APPEND_ADDRESS_SPACE(memoryCopy)(unsigned char* destination, const unsigned char* source, int amount) {
  int i;
  for (i = 0; i < amount; i ++){
    destination[i] = source[i];
  }
}

void APPEND_ADDRESS_SPACE(memorySet) (unsigned char* destination, unsigned char value, int amountToSet){
  int i;
  for (i = 0; i < amountToSet; i ++){
    destination[i] = value;
  }
}

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
/** Set a group element (jacobian) equal to another which is given in affine coordinates. */
void APPEND_ADDRESS_SPACE(secp256k1_gej_set_ge)(
  secp256k1_gej *r, 
  ADDRESS_SPACE_CONTEXT const secp256k1_ge *a
);
//******End of group.h******


//******From ecmult_impl.h******
void APPEND_ADDRESS_SPACE(secp256k1_ecmult_context_build)(secp256k1_ecmult_context *output, const secp256k1_callback *cb);

//******End of ecmult_impl.h******
