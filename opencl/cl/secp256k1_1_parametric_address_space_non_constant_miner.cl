// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE
// ADDRESS_SPACE_CONSTANT
// APPEND_ADDRESS_SPACE

#include "secp256k1.h"
#include "secp256k1_miner_implementation.h"
#include "secp256k1_memory_pool_implementation.h"


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
//#pragma unroll
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
