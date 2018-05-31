// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE
// ADDRESS_SPACE_CONSTANT
// APPEND_ADDRESS_SPACE

#include "secp256k1.h"

//******From ecmult_impl.h******
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

void APPEND_ADDRESS_SPACE(secp256k1_ge_globalz_set_table_gej)(
  size_t len, 
  ADDRESS_SPACE secp256k1_ge *r,
  secp256k1_fe *globalz,
  __global const secp256k1_gej *a,
  __global const secp256k1_fe *zr
) {
  size_t i = len - 1;
  secp256k1_fe zs, globalToLocalFE1;
  secp256k1_gej globalToLocal1;
  secp256k1_ge globalToLocalGE1;

  if (len > 0) {
    /* The z of the final point gives us the "global Z" for the table. */
    r[i].x = a[i].x;
    r[i].y = a[i].y;
    *globalz = a[i].z;
    r[i].infinity = 0;
    zs = zr[i];

    /* Work our way backwards, using the z-ratios to scale the x/y values. */
    while (i > 0) {
      if (i != len - 1) {
        secp256k1_fe_copy__from__global(&globalToLocalFE1, &zr[i]);
        secp256k1_fe_mul(&zs, &zs, &globalToLocalFE1);
      }
      i--;
      secp256k1_gej_copy__from__global(&globalToLocal1, &a[i]);
      secp256k1_ge_set_gej_zinv(&globalToLocalGE1, &globalToLocal1, &zs);
      r[i] = globalToLocalGE1;
    }
  }
}

/** Fill a table 'pre' with precomputed odd multiples of a.
 *
 *  There are two versions of this function:
 *  - secp256k1_ecmult_odd_multiples_table_globalz_windowa which brings its
 *    resulting point set to a single constant Z denominator, stores the X and Y
 *    coordinates as ge_storage points in pre, and stores the global Z in rz.
 *    It only operates on tables sized for WINDOW_A wnaf multiples.
 *  - secp256k1_ecmult_odd_multiples_table_storage_var, which converts its
 *    resulting point set to actual affine points, and stores those in pre.
 *    It operates on tables of any size, but uses heap-allocated temporaries.
 *
 *  To compute a*P + b*G, we compute a table for P using the first function,
 *  and for G using the second (which requires an inverse, but it only needs to
 *  happen once).
 */
void APPEND_ADDRESS_SPACE(secp256k1_ecmult_odd_multiples_table_globalz_windowa)(
  ADDRESS_SPACE secp256k1_ge *pre,
  secp256k1_fe *globalz,
  const secp256k1_gej *a,
  __global unsigned char* memoryPool
) {
  __global secp256k1_gej* prej = (__global secp256k1_gej*) checked_malloc(sizeof_secp256k1_gej() * ECMULT_TABLE_SIZE(WINDOW_A), memoryPool);
  __global secp256k1_fe* zr =    (__global secp256k1_fe* ) checked_malloc(sizeof_secp256k1_fe()  * ECMULT_TABLE_SIZE(WINDOW_A), memoryPool);

  /* Compute the odd multiples in Jacobian form. */
  secp256k1_ecmult_odd_multiples_table(ECMULT_TABLE_SIZE(WINDOW_A), prej, zr, a/*, memoryPool*/);
  /* Bring them to the same Z denominator. */
  APPEND_ADDRESS_SPACE(secp256k1_ge_globalz_set_table_gej)(ECMULT_TABLE_SIZE(WINDOW_A), pre, globalz, prej, zr);
}

//******end of ecmult_impl.h******


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







/* Code from: https://github.com/Fruneng/opencl_sha_al_im
 */

void APPEND_ADDRESS_SPACE(sha256GPU_inner)(
  ADDRESS_SPACE unsigned char* result, 
  unsigned int length, 
  ADDRESS_SPACE const char* message
) {
  int t, currentIndex, lomc;
  int stop, mmod;
  uint32_t i, item, total;
  uint32_t W[80], A, B, C, D, E, F, G, H, T1, T2;
  uint32_t digest[8];

  //uint32_t num_keys = data_info[1];
  //printf("theLength: %u num_keys:%u\n", theLength, total);
  int current_pad;


  total = length % 64 >= 56 ? 2 : 1 + length / 64;
  //printf("theLength: %u total:%u\n", theLength, total);
  digest[0] = H0;
  digest[1] = H1;
  digest[2] = H2;
  digest[3] = H3;
  digest[4] = H4;
  digest[5] = H5;
  digest[6] = H6;
  digest[7] = H7;
  currentIndex = 0;
  for (item = 0; item < total; item ++) {
    A = digest[0];
    B = digest[1];
    C = digest[2];
    D = digest[3];
    E = digest[4];
    F = digest[5];
    G = digest[6];
    H = digest[7];
#pragma unroll
    for (t = 0; t < 80; t ++) {
      W[t] = 0x00000000;
    }
    lomc = length + 0 - currentIndex;
    if (lomc > 0){
      current_pad = (lomc) > 64 ? 64: (lomc);
    } else {
      current_pad = - 1;    
    }
    //  printf("current_pad: %d\n",current_pad);
    if (current_pad > 0) {
      i = current_pad;
      stop = i / 4;
    //    printf("i:%d, stop: %d msg_pad:%d\n",i,stop, msg_pad);
      for (t = 0 ; t < stop ; t++) {
        W[t] = ((unsigned char)  message[currentIndex]) << 24;
        currentIndex ++;
        W[t] |= ((unsigned char) message[currentIndex]) << 16;
        currentIndex ++;
        W[t] |= ((unsigned char) message[currentIndex]) << 8;
        currentIndex ++;
        W[t] |= (unsigned char)  message[currentIndex];
        currentIndex ++;
        //printf("W[%u]: %u\n",t,W[t]);
      }
      mmod = i % 4;
      if (mmod == 3) {
        W[t] = ((unsigned char)  message[currentIndex]) << 24;
	      currentIndex++;
        W[t] |= ((unsigned char) message[currentIndex]) << 16;
	      currentIndex++;
        W[t] |= ((unsigned char) message[currentIndex]) << 8;
	      currentIndex++;
        W[t] |=  ((unsigned char) 0x80) ;
      } else if (mmod == 2) {
        W[t] = ((unsigned char)  message[currentIndex]) << 24;
	      currentIndex++;
        W[t] |= ((unsigned char) message[currentIndex]) << 16;
	      currentIndex++;
        W[t] |=  0x8000 ;
      } else if (mmod == 1) {
        W[t] = ((unsigned char)  message[currentIndex]) << 24;
	      currentIndex++;
        W[t] |=  0x800000 ;
      } else /*if (mmod == 0)*/ {
        W[t] =  0x80000000 ;
      }      
      if (current_pad < 56){
        W[15] = length * 8 ;
        //printf("theLength avlue 2 :w[15] :%u\n", W[15]);
      }
    } else if(current_pad < 0){
      if (length % 64 == 0)
        W[0] = 0x80000000;
      W[15] = length * 8;
      //printf("theLength avlue 3 :w[15] :%u\n", W[15]);
    }
    for (t = 0; t < 64; t++) {
      if (t >= 16)
        W[t] = gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16];
      T1 = H + sigma1(E) + ch(E, F, G) + K[t] + W[t];
      T2 = sigma0(A) + maj(A, B, C);
      H = G; G = F; F = E; E = D + T1; D = C; C = B; B = A; A = T1 + T2;
    }
    digest[0] += A;
    digest[1] += B;
    digest[2] += C;
    digest[3] += D;
    digest[4] += E;
    digest[5] += F;
    digest[6] += G;
    digest[7] += H;
  }
  //result[messageIndex] = ((unsigned char) theLength);
  //return;
  for (t = 0; t < 8; t ++) {
    for (i = 0; i < 4; i ++) {
      result[t * 4 + i] = (unsigned char) (digest[t] >> ((3 - i) * 8) );
    }
  }  
}
