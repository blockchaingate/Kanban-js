// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE
// ADDRESS_SPACE_CONSTANT
// APPEND_ADDRESS_SPACE

#include "secp256k1.h"

void APPEND_ADDRESS_SPACE(secp256k1_ge_set_all_gej_var)(
  size_t len,
  ADDRESS_SPACE secp256k1_ge *outputPoints,
  ADDRESS_SPACE const secp256k1_gej *inputPointsJacobian,
  __global unsigned char* memoryPool
) {
  __global secp256k1_fe *az;
  __global secp256k1_fe *azi;
  secp256k1_fe globalToLocal1;
  secp256k1_gej globalToLocalProjective;
  size_t i;
  size_t count = 0;
  az = (__global secp256k1_fe *) checked_malloc(sizeof_secp256k1_fe() * len, memoryPool);
  //memoryPool_write_uint_asOutput(inputPointsJacobian[0].x.n[0], 2, memoryPool);

  for (i = 0; i < len; i++) {
    if (!inputPointsJacobian[i].infinity) {
      az[count++] = inputPointsJacobian[i].z;
    }
  }

  azi = (__global secp256k1_fe *) checked_malloc(sizeof_secp256k1_fe() * count, memoryPool);
  secp256k1_fe_inv_all_var(count, azi, az);
  memoryPool_freeMemory__global(az);

  count = 0;
  secp256k1_ge globalToLocalBuffer;
  for (i = 0; i < len; i ++) {
    outputPoints[i].infinity = inputPointsJacobian[i].infinity;
    if (!inputPointsJacobian[i].infinity) {
      secp256k1_fe_copy__from__global(&globalToLocal1, &azi[count ++]);
      APPEND_ADDRESS_SPACE(secp256k1_gej_copy)(&globalToLocalProjective, &inputPointsJacobian[i]);
      
      secp256k1_ge_set_gej_zinv(&globalToLocalBuffer , &globalToLocalProjective, &globalToLocal1);

      APPEND_ADDRESS_SPACE(secp256k1_ge_copy)(&outputPoints[i], &globalToLocalBuffer);
    }
  }
  memoryPool_freeMemory__global(azi);
//  int usedForCompilerWarning;
//  return;
}

//******From field_10x26.h******
void APPEND_ADDRESS_SPACE(secp256k1_fe_copy__to__parametric)(ADDRESS_SPACE secp256k1_fe* output, const secp256k1_fe* input){
  output->n[0] = input->n[0];
  output->n[1] = input->n[1];
  output->n[2] = input->n[2];
  output->n[3] = input->n[3];
  output->n[4] = input->n[4];
  output->n[5] = input->n[5];
  output->n[6] = input->n[6];
  output->n[7] = input->n[7];
  output->n[8] = input->n[8];
  output->n[9] = input->n[9];
}
//******end of field_10x26.h******


//******From group_impl.h******
void APPEND_ADDRESS_SPACE(secp256k1_ge_copy)(ADDRESS_SPACE secp256k1_ge* output, const secp256k1_ge* input) {
  output->infinity = input->infinity;
  APPEND_ADDRESS_SPACE(secp256k1_fe_copy__to__parametric)(&output->x, &input->x);
  APPEND_ADDRESS_SPACE(secp256k1_fe_copy__to__parametric)(&output->y, &input->y);
}
//******end of group_impl.h******
