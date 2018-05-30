/* Code from: https://github.com/Fruneng/opencl_sha_al_im
 */
#ifndef uint32_t
#define uint32_t unsigned int
#endif
#define H0 0x6a09e667
#define H1 0xbb67ae85
#define H2 0x3c6ef372
#define H3 0xa54ff53a
#define H4 0x510e527f
#define H5 0x9b05688c
#define H6 0x1f83d9ab
#define H7 0x5be0cd19
uint32_t rotr(uint32_t x, int n) {
  if (n < 32) return (x >> n) | (x << (32 - n));
  return x;
}
uint32_t ch(uint32_t x, uint32_t y, uint32_t z) {
  return (x & y) ^ (~x & z);
}
uint32_t maj(uint32_t x, uint32_t y, uint32_t z) {
  return (x & y) ^ (x & z) ^ (y & z);
}
uint32_t sigma0(uint32_t x) {
  return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
}
uint32_t sigma1(uint32_t x) {
  return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
}
uint32_t gamma0(uint32_t x) {
  return rotr(x, 7) ^ rotr(x, 18) ^ (x >> 3);
}
uint32_t gamma1(uint32_t x) {
  return rotr(x, 17) ^ rotr(x, 19) ^ (x >> 10);
}

__constant uint32_t K[64] = {
0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

unsigned int memoryPool_read_uinT(__global const unsigned char* memoryPoolPointer) {
  return
  (unsigned int) ( ((unsigned int) memoryPoolPointer[0]) << 24) +
  (unsigned int) ( ((unsigned int) memoryPoolPointer[1]) << 16) +
  (unsigned int) ( ((unsigned int) memoryPoolPointer[2]) <<  8) +
  (unsigned int) (  (unsigned int) memoryPoolPointer[3]       ) ;
}

unsigned int memoryPool_read_uint_from_four_byteS(
  unsigned char byte3, 
  unsigned char byte2, 
  unsigned char byte1, 
  unsigned char byte0 
) {
  return
  (unsigned int) ( ((unsigned int) byte3) << 24) +
  (unsigned int) ( ((unsigned int) byte2) << 16) +
  (unsigned int) ( ((unsigned int) byte1) <<  8) +
  (unsigned int) (  (unsigned int) byte0       ) ;
}

#pragma GCC optimize ("unroll-loops")
unsigned int memoryPool__local_read_uint(const unsigned char* memoryPoolPointer) {
  return
  (unsigned int) ( ((unsigned int) memoryPoolPointer[0]) << 24) +
  (unsigned int) ( ((unsigned int) memoryPoolPointer[1]) << 16) +
  (unsigned int) ( ((unsigned int) memoryPoolPointer[2]) <<  8) +
  (unsigned int) (  (unsigned int) memoryPoolPointer[3]       ) ;
}

__kernel void sha256GPU(
  __global unsigned char* result, 
  __global const unsigned char* offsets, 
  __global const unsigned char* messageLengths, 
  __global const char* plain_key,
  unsigned char messageIndexByteHighest,
  unsigned char messageIndexByteHigher ,
  unsigned char messageIndexByteLower  ,
  unsigned char messageIndexByteLowest
) {
  int t, currentIndex, lomc;
  int stop, mmod;
  uint32_t i, item, total;
  uint32_t W[80], A, B, C, D, E, F, G, H, T1, T2;
  uint32_t digest[8];
  unsigned int messageIndex = memoryPool_read_uint_from_four_byteS(
    messageIndexByteHighest,
    messageIndexByteHigher ,
    messageIndexByteLower  ,
    messageIndexByteLowest
  );
  //printf("DEBUG message index: %d\n", messageIndex);
  //printf(
  //  "%d%d%d%d",
  //  (unsigned int) messageIndexByte3,
  //  (unsigned int) messageIndexByte2,
  //  (unsigned int) messageIndexByte1,
  //  (unsigned int) messageIndexByte0
  //);
  //if (messageIndex > 120000) {
  //  std::cout
  //  << "Message index too big " << messageIndex << ", message index char: "
  //  << messageIndexChar
  //  << std::endl;
  //  assert(false);
  //}
  //std::cout
  //<< "DEBUG: Got to here, message index: " << messageIndex << ", message index char: "
  //<< messageIndexChar << std::endl;


  //uint32_t num_keys = data_info[1];
  //printf("theLength: %u num_keys:%u\n", theLength, total);
  int current_pad;

  uint32_t offset;
  uint32_t theLength;
  offset = memoryPool_read_uinT(& (offsets[4 * messageIndex]));
  //std::cout << "DEBUG: Got to here, offset: " << offset << std::endl;
  theLength = memoryPool_read_uinT(&(messageLengths[4 * messageIndex]));

  total = theLength % 64 >= 56 ? 2 : 1 + theLength / 64;
  //printf("theLength: %u total:%u\n", theLength, total);
  digest[0] = H0;
  digest[1] = H1;
  digest[2] = H2;
  digest[3] = H3;
  digest[4] = H4;
  digest[5] = H5;
  digest[6] = H6;
  digest[7] = H7;
  currentIndex = offset;
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
    lomc = theLength + offset - currentIndex;
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
        W[t] = ((unsigned char)  plain_key[currentIndex]) << 24;
        currentIndex ++;
        W[t] |= ((unsigned char) plain_key[currentIndex]) << 16;
        currentIndex ++;
        W[t] |= ((unsigned char) plain_key[currentIndex]) << 8;
        currentIndex ++;
        W[t] |= (unsigned char)  plain_key[currentIndex];
        currentIndex ++;
        //printf("W[%u]: %u\n",t,W[t]);
      }
      mmod = i % 4;
      if (mmod == 3) {
        W[t] = ((unsigned char)  plain_key[currentIndex]) << 24;
	      currentIndex++;
        W[t] |= ((unsigned char) plain_key[currentIndex]) << 16;
	      currentIndex++;
        W[t] |= ((unsigned char) plain_key[currentIndex]) << 8;
	      currentIndex++;
        W[t] |=  ((unsigned char) 0x80) ;
      } else if (mmod == 2) {
        W[t] = ((unsigned char)  plain_key[currentIndex]) << 24;
	      currentIndex++;
        W[t] |= ((unsigned char) plain_key[currentIndex]) << 16;
	      currentIndex++;
        W[t] |=  0x8000 ;
      } else if (mmod == 1) {
        W[t] = ((unsigned char)  plain_key[currentIndex]) << 24;
	      currentIndex++;
        W[t] |=  0x800000 ;
      } else /*if (mmod == 0)*/ {
        W[t] =  0x80000000 ;
      }      
      if (current_pad < 56){
        W[15] = theLength * 8 ;
        //printf("theLength avlue 2 :w[15] :%u\n", W[15]);
      }
    } else if(current_pad < 0){
      if (theLength % 64 == 0)
        W[0] = 0x80000000;
      W[15] = theLength * 8;
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
  uint32_t resultOffset = messageIndex * 32;
  //return;
  for (t = 0; t < 8; t ++) {
    for (i = 0; i < 4; i ++) {
      result[resultOffset + t * 4 + i] = (unsigned char) (digest[t] >> ((3 - i) * 8) );
    }
  }  
}
