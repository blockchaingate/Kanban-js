#define WINDOW_A 5
#define WINDOW_G 14

/** The number of entries a table with precomputed multiples needs to have. */
#define ECMULT_TABLE_SIZE(w) (1 << ((w)-2))

#define ECMULT_TABLE_GET(r,pre,n,w,neg) do { \
  if ((n) > 0) \
    *(r) = (pre)[((n)-1)/2]; \
  else \
    (neg)((r), &(pre)[(-(n)-1)/2]); \
} while(0)


#define ECMULT_TABLE_GET_GEJ(r,pre,n,w) ECMULT_TABLE_GET((r),(pre),(n),(w),ECNegateProjective)
#define ECMULT_TABLE_GET_GE(r,pre,n,w)  ECMULT_TABLE_GET((r),(pre),(n),(w),ECNegatePoint)

//Representations of large integers modulo
//theFieldPrime = 2^256 - 2^32 - 977 
//Each large integer X is represented as:
//X = sum(i=0..9, n[i]*2^(26*i) ) mod theFieldPrime
//For example, the integer
//7 * 2^52 + 5 * 2^26 + 3
//is represented by 
//n[0] = 3, n[1] = 5, n[2] = 7
//(all remaining elements are zero). 
typedef struct {
  unsigned int n[10];
} fieldElement;

typedef struct {
  fieldElement x;
  fieldElement y;
  int infinity; // whether this represents the point at infinity
} ECPoint;

//The eliptic curve has equation:
// Y^2 = X^3 + 7
//Usually, this is projectivized to:
// Set Y = y'/z, X = x'/z
// (y'/z)^2 = (x'/z)^3 +7     (clear denominators ...)
// z y'^2 = x'^3 + 7 z^3
//
//Alternatively, we may transform as follows:
// Set Y = y/z^3, X= x/z^2
//
// (y/z^3)^2 = (x/z^2)^3 +7     (clear denominators ...)
// y^2 = x^3 + 7 z^6
//
//We call this latter transformation "projective" for short, even though it's a misnomer.
typedef struct {
  fieldElement x; // actual X: x/z^2
  fieldElement y; // actual Y: y/z^3
  fieldElement z;
  int infinity; // whether this represents the point at infinity
} ECProjectivePoint;

typedef struct {
	ECProjectivePoint a;
	char wnaf_na[257];  //wnaf = windowed non-adjacent form
	short bits_na;
	short wnaf_ng_1[129];
	short bits_ng_1;
	short wnaf_ng_128[129];
	short bits_ng_128;
} ECMultiplicationParametersDevice;

typedef struct {
  // For accelerating the computation of a*P + b*G:
  ECPoint precomputedGeneratorProducts[ECMULT_TABLE_SIZE(WINDOW_G)];    // odd multiples of the generator
  ECPoint precomputedGeneratorProducts_128[ECMULT_TABLE_SIZE(WINDOW_G)]; // odd multiples of 2^128*generator
  // For accelerating the computation of a*G:
  // To harden against timing attacks, use the following mechanism:
  // * Break up the multiplicand into groups of 4 bits, called n_0, n_1, n_2, ..., n_63.
  // * Compute sum((n_i + 1) * 16^i * G, i = 0..63).
  // * Subtract sum(1 * 16^i * G, i = 0..63).
  // For each i, and each of the 16 possible values of n_i, ((n_i + 1) * 16^i * G) is
  // precomputed (call it precprecomputed(i, n_i), as well as - sum(1 * 16^i * G) (called fin).
  // The formula now becomes sum(precprecomputed(i, n_i), i = 0..63) + fin.
  // To make memory access uniform, the bytes of prec(i, n_i) are sliced per value of n_i.
  unsigned char precomputed[64][sizeof(ECPoint)][16]; // prec[j][k][i] = k'th byte of (16^j * (i+1) * G)
  ECPoint fin; // -(sum(precprecomputed[j][0], j=0..63))
} secp256k1_ecmult_consts_t;

typedef struct {
  unsigned char v[32];
} base32_t;
    
void MakeInfinity(ECProjectivePoint* output) {
  output->infinity = 1;
}
void ECNegateProjective(ECProjectivePoint *r, __global const ECProjectivePoint *a);
void ECNegatePoint(ECPoint *r, __constant const ECPoint *a);

void ECPrecomputeMultiplicationTable(__global ECProjectivePoint *pre, __global ECProjectivePoint *a, int w);
void ECDoubleProjective(ECProjectivePoint *r, ECProjectivePoint *a);
void ECAddProjective_Global(__global ECProjectivePoint *r, const ECProjectivePoint *a, __global const ECProjectivePoint *b);
void ECAddProjective_Local(ECProjectivePoint *pr, const ECProjectivePoint *pa, const ECProjectivePoint *pb);
void secp256k1_gej_add_ge(ECProjectivePoint *r, const ECProjectivePoint *a, const ECPoint *b);

void fieldElementNormalize(fieldElement *r);    
void ECMultiplyFieldElements(fieldElement* output, const fieldElement* inputLeft, const fieldElement* inputRight);
void ECMultiplyFieldElementByInt(fieldElement *inputOutput, int inputInt);
void secp256k1_fe_add(fieldElement *r, const fieldElement *a);
void ECSquareFieldElement(fieldElement *r, const fieldElement *a);
void ECNegateFieldElement(fieldElement *r, const fieldElement *a, int m);
int ECIsZeroFieldElement(const fieldElement *a);
void ConvertFieldElementToBase32(unsigned char *r, const fieldElement *a);
void secp256k1_gej_get_x(fieldElement *r, const ECProjectivePoint *a);
void secp256k1_fe_inv_var(fieldElement *r, const fieldElement *a);

__kernel void ECPrecomputeMultiplicationTable(__global ECProjectivePoint *outputPrecomputed, __global ECProjectivePoint *pa, int w) {
  int ind = get_global_id(0);
  int sz = (1 << (w-2));
  ECProjectivePoint a = pa[ind];
  outputPrecomputed[ind * sz] = a;
  ECProjectivePoint d; ECDoubleProjective(&d, &a);
  for (int i = 1; i < sz; i ++) {
    ECAddProjective_Global(&outputPrecomputed[ind * sz + i], &d, &outputPrecomputed[ind * sz + i - 1]);
  }
}

__kernel void test_ecmult_table_precomp_gej(__global ECProjectivePoint *pre, __global ECProjectivePoint *pa, int w) {
  int ind = get_global_id(0);
  pre[ind] = pa[ind];
  // pre[ind].infinity = 2;
}

/*
  
  
*/

__kernel void secp256k1_ecmult(
  __global ECProjectivePoint *ppre_a, 
  __global ECMultiplicationParametersDevice* pParams, 
  __constant const secp256k1_ecmult_consts_t *multiplicationConstants,
  __global base32_t* output
) {
  int computationIndex = get_global_id(0);
  int windowSize = (1 << (WINDOW_A - 2));

  ECMultiplicationParametersDevice params = pParams[computationIndex];
  __global ECProjectivePoint *pre_a = &ppre_a[computationIndex * windowSize];
  __global base32_t *currentOutput = &output[computationIndex];
  
  ECProjectivePoint r;
  MakeInfinity(&r);
  ECProjectivePoint currentProjectivePoint;
  ECPoint currentPoint;

  short bits = max(params.bits_na, params.bits_ng_1);
  bits = max(bits, params.bits_ng_128);
  for (int i = bits - 1; i >= 0; i --) {
    ECDoubleProjective(&r, &r);
    int n;
    if (i < params.bits_na && (n = params.wnaf_na[i])) {
      ECMULT_TABLE_GET_GEJ(&currentProjectivePoint, pre_a, n, WINDOW_A);
      ECAddProjective_Local(&r, &r, &currentProjectivePoint);
    }
    if (i < params.bits_ng_1 && (n = params.wnaf_ng_1[i])) {
      ECMULT_TABLE_GET_GE(&currentPoint, multiplicationConstants->precomputedGeneratorProducts, n, WINDOW_G);
      secp256k1_gej_add_ge(&r, &r, &currentPoint);
    }
    if (i < params.bits_ng_128 && (n = params.wnaf_ng_128[i])) {
      ECMULT_TABLE_GET_GE(&currentPoint, multiplicationConstants->precomputedGeneratorProducts_128, n, WINDOW_G);
      secp256k1_gej_add_ge(&r, &r, &currentPoint);
    }
  }
	fieldElement xr; 
  secp256k1_gej_get_x(&xr, &r);
	fieldElementNormalize(&xr);
  base32_t b32;
	ConvertFieldElementToBase32(b32.v, &xr);
  *currentOutput = b32;
}
                      
void ECNegateProjective(ECProjectivePoint* output, __global const ECProjectivePoint* input) {
  output->infinity = input->infinity;
  output->x = input->x;
  output->y = input->y;
  output->z = input->z;
  fieldElementNormalize(&output->y);
  ECNegateFieldElement(&output->y, &output->y, 1);
}

void ECNegatePoint(ECPoint* output, __constant const ECPoint* input) {
  output->infinity = input->infinity;
  output->x = input->x;
  output->y = input->y;
  fieldElementNormalize(&output->y);
  ECNegateFieldElement(&output->y, &output->y, 1);
}

typedef unsigned int uint32_t;
typedef unsigned long uint64_t;

/*
Reduces modulo 
2^256 - 2^32 - 977
Ensures each element of the input is of magnitude smaller than 2^26.
If some input has more than 26 bits, carries over the extra bits to
the higher order terms.
*/
void fieldElementNormalize(fieldElement* inputOutput) {
//    fog("normalize in: ", inputOutput);
  uint32_t c;
  c = inputOutput->n[0];
  uint32_t t0 = c & 0x3FFFFFFUL; //If inputOutput->n[0] is larger than 2^26, this line reduces mod 2^26
  c = (c >> 26) + inputOutput->n[1]; //If inputOutput->n[0] is larger than 2^26,  c >> 26 contains the carry-over bits, which are added to the next term 
  uint32_t t1 = c & 0x3FFFFFFUL;
  c = (c >> 26) + inputOutput->n[2];
  uint32_t t2 = c & 0x3FFFFFFUL;
  c = (c >> 26) + inputOutput->n[3];
  uint32_t t3 = c & 0x3FFFFFFUL;
  c = (c >> 26) + inputOutput->n[4];
  uint32_t t4 = c & 0x3FFFFFFUL;
  c = (c >> 26) + inputOutput->n[5];
  uint32_t t5 = c & 0x3FFFFFFUL;
  c = (c >> 26) + inputOutput->n[6];
  uint32_t t6 = c & 0x3FFFFFFUL;
  c = (c >> 26) + inputOutput->n[7];
  uint32_t t7 = c & 0x3FFFFFFUL;
  c = (c >> 26) + inputOutput->n[8];
  uint32_t t8 = c & 0x3FFFFFFUL;
  c = (c >> 26) + inputOutput->n[9];
  uint32_t t9 = c & 0x03FFFFFUL;
  c >>= 22; //c now contains the final carry-over bits. 
  //Here, our number is now represented as c*2^256 + t9 * 2^{26*9} + t8 * 2^{26*8} + ...,
  //where t8, t7,... are between 0 and 2^26 (not inclusive)
  //and t9 is between 0 and 2^22 (not inclusive). Note that this means that the final term t9*2^{26*9} is smaller than
  //2^22 *  2^{26*9} = 2^{22+26*9} = 2^256
  //In our finite field, we have that 2^256 = 2^32 + 977. 
  //Therefore, we can replace c*2^256 by c * (2^32 + 977)
/*    
  inputOutput->n[0] = t0; 
  inputOutput->n[1] = t1; 
  inputOutput->n[2] = t2; 
  inputOutput->n[3] = t3; 
  inputOutput->n[4] = t4;
  inputOutput->n[5] = t5; 
  inputOutput->n[6] = t6; 
  inputOutput->n[7] = t7; 
  inputOutput->n[8] = t8; 
  inputOutput->n[9] = t9;
  fog("         tm1: ", inputOutput);
    fprintf(stderr, "out c= %08lx\n", (unsigned long)c);
  */

  // The following code will not modify the t's if c is initially 0.
  uint32_t d = c * 0x3D1UL + t0; // 0x3D1UL equals 977
  t0 = d & 0x3FFFFFFUL;
  d = (d >> 26) + t1 + c*0x40; // 0x40 equals 2^6. Since this is the second digit in our 2^26 number system, the digit c * 2^6 corresponds to the number c * 2^6 * 2^26 = c* 2^32 
  t1 = d & 0x3FFFFFFUL;
  d = (d >> 26) + t2;
  t2 = d & 0x3FFFFFFUL;
  d = (d >> 26) + t3;
  t3 = d & 0x3FFFFFFUL;
  d = (d >> 26) + t4;
  t4 = d & 0x3FFFFFFUL;
  d = (d >> 26) + t5;
  t5 = d & 0x3FFFFFFUL;
  d = (d >> 26) + t6;
  t6 = d & 0x3FFFFFFUL;
  d = (d >> 26) + t7;
  t7 = d & 0x3FFFFFFUL;
  d = (d >> 26) + t8;
  t8 = d & 0x3FFFFFFUL;
  d = (d >> 26) + t9;
  t9 = d & 0x03FFFFFUL;
/*    
  inputOutput->n[0] = t0; 
  inputOutput->n[1] = t1; 
  inputOutput->n[2] = t2; 
  inputOutput->n[3] = t3; 
  inputOutput->n[4] = t4;
  inputOutput->n[5] = t5; 
  inputOutput->n[6] = t6; 
  inputOutput->n[7] = t7; 
  inputOutput->n[8] = t8; 
  inputOutput->n[9] = t9;
    fog("         tm2: ", inputOutput); 
*/

    // Subtract p if result >= (2^256 - 2^32 - 977)
  uint64_t low = ((uint64_t) t1 << 26) | t0;
  uint64_t mask = - (long)((t9 < 0x03FFFFFUL) | (t8 < 0x3FFFFFFUL) | (t7 < 0x3FFFFFFUL) | (t6 < 0x3FFFFFFUL) | (t5 < 0x3FFFFFFUL) | (t4 < 0x3FFFFFFUL) | (t3 < 0x3FFFFFFUL) | (t2 < 0x3FFFFFFUL) | (low < 0xFFFFEFFFFFC2FUL));
  t9 &= mask;
  t8 &= mask;
  t7 &= mask;
  t6 &= mask;
  t5 &= mask;
  t4 &= mask;
  t3 &= mask;
  t2 &= mask;
  low -= (~mask & 0xFFFFEFFFFFC2FUL);

  // push internal variables back
  inputOutput->n[0] = low & 0x3FFFFFFUL; 
  inputOutput->n[1] = (low >> 26) & 0x3FFFFFFUL; 
  inputOutput->n[2] = t2; 
  inputOutput->n[3] = t3; 
  inputOutput->n[4] = t4;
  inputOutput->n[5] = t5; 
  inputOutput->n[6] = t6; 
  inputOutput->n[7] = t7; 
  inputOutput->n[8] = t8; 
  inputOutput->n[9] = t9;
/*    fog("         out: ", inputOutput);*/
}

void static inline ECSetFieldElementToInt32(fieldElement *output, int input) {
  output->n[0] = input;
  output->n[1] = output->n[2] = output->n[3] = output->n[4] = output->n[5] = output->n[6] = output->n[7] = output->n[8] = output->n[9] = 0;
}

// TODO: not constant time!
int ECIsZeroFieldElement(const fieldElement *a) {
#ifdef VERIFY
  assert(a->normalized);
#endif
  return (a->n[0] == 0 && a->n[1] == 0 && a->n[2] == 0 && 
          a->n[3] == 0 && a->n[4] == 0 && a->n[5] == 0 && 
          a->n[6] == 0 && a->n[7] == 0 && a->n[8] == 0 && a->n[9] == 0);
}

int static inline ECIsOddFieldElement(const fieldElement *a) {
  return a->n[0] & 1;
}

// TODO: not constant time!
int ECAreEqualFieldElements(const fieldElement *a, const fieldElement *b) {
#ifdef VERIFY
  assert(a->normalized);
  assert(b->normalized);
#endif
  return (a->n[0] == b->n[0] && a->n[1] == b->n[1] && a->n[2] == b->n[2] && a->n[3] == b->n[3] && a->n[4] == b->n[4] &&
          a->n[5] == b->n[5] && a->n[6] == b->n[6] && a->n[7] == b->n[7] && a->n[8] == b->n[8] && a->n[9] == b->n[9]);
}

void secp256k1_fe_set_b32(fieldElement *output, const unsigned char *input) {
  output->n[0] = output->n[1] = output->n[2] = output->n[3] = output->n[4] = 0;
  output->n[5] = output->n[6] = output->n[7] = output->n[8] = output->n[9] = 0;
  for (int i = 0; i < 32; i ++) {
    for (int j = 0; j < 4; j ++) {
      int limb = (8 * i + 2 * j) / 26;
      int shift = (8 * i + 2 * j) % 26;
      output->n[limb] |= (uint32_t)((output[31-i] >> (2*j)) & 0x3) << shift;
    }
  }
}

/** Convert a field element to a 32-byte big endian value. Requires the input to be normalized */
void ConvertFieldElementToBase32(unsigned char *r, const fieldElement *a) {
  for (int i = 0; i < 32; i ++) {
    int c = 0;
    for (int j = 0; j < 4; j ++) {
      int limb = (8 * i + 2 * j) / 26;
      int shift = (8 * i + 2 * j) % 26;
      c |= ((a->n[limb] >> shift) & 0x3) << (2 * j);
    }
    r[31 - i] = c;
  }
}

void ECNegateFieldElement(fieldElement *r, const fieldElement *a, int m) {
#ifdef VERIFY
  assert(a->magnitude <= m);
  r->magnitude = m + 1;
  r->normalized = 0;
#endif
  r->n[0] = 0x3FFFC2FUL * (m + 1) - a->n[0];
  r->n[1] = 0x3FFFFBFUL * (m + 1) - a->n[1];
  r->n[2] = 0x3FFFFFFUL * (m + 1) - a->n[2];
  r->n[3] = 0x3FFFFFFUL * (m + 1) - a->n[3];
  r->n[4] = 0x3FFFFFFUL * (m + 1) - a->n[4];
  r->n[5] = 0x3FFFFFFUL * (m + 1) - a->n[5];
  r->n[6] = 0x3FFFFFFUL * (m + 1) - a->n[6];
  r->n[7] = 0x3FFFFFFUL * (m + 1) - a->n[7];
  r->n[8] = 0x3FFFFFFUL * (m + 1) - a->n[8];
  r->n[9] = 0x03FFFFFUL * (m + 1) - a->n[9];
}

void ECMultiplyFieldElementByInt(fieldElement *inputOutput, int inputInt) {
#ifdef VERIFY
  r->magnitude *= inputInt;
  r->normalized = 0;
#endif
  inputOutput->n[0] *= inputInt;
  inputOutput->n[1] *= inputInt;
  inputOutput->n[2] *= inputInt;
  inputOutput->n[3] *= inputInt;
  inputOutput->n[4] *= inputInt;
  inputOutput->n[5] *= inputInt;
  inputOutput->n[6] *= inputInt;
  inputOutput->n[7] *= inputInt;
  inputOutput->n[8] *= inputInt;
  inputOutput->n[9] *= inputInt;
}

void secp256k1_fe_add(fieldElement *elementToAddInto, const fieldElement *other) {
#ifdef VERIFY
  elementToAddInto->magnitude += other->magnitude;
  elementToAddInto->normalized = 0;
#endif
  elementToAddInto->n[0] += other->n[0];
  elementToAddInto->n[1] += other->n[1];
  elementToAddInto->n[2] += other->n[2];
  elementToAddInto->n[3] += other->n[3];
  elementToAddInto->n[4] += other->n[4];
  elementToAddInto->n[5] += other->n[5];
  elementToAddInto->n[6] += other->n[6];
  elementToAddInto->n[7] += other->n[7];
  elementToAddInto->n[8] += other->n[8];
  elementToAddInto->n[9] += other->n[9];
}

void ECMultiplyFieldElementsInner(uint32_t *output, const uint32_t *a, const uint32_t *b) {
  uint64_t c = (uint64_t)a[0] * b[0];
  uint32_t t0 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[0] * b[1] +
          (uint64_t)a[1] * b[0];
  uint32_t t1 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[0] * b[2] +
          (uint64_t)a[1] * b[1] +
          (uint64_t)a[2] * b[0];
  uint32_t t2 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[0] * b[3] +
          (uint64_t)a[1] * b[2] +
          (uint64_t)a[2] * b[1] +
          (uint64_t)a[3] * b[0];
  uint32_t t3 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[0] * b[4] +
          (uint64_t)a[1] * b[3] +
          (uint64_t)a[2] * b[2] +
          (uint64_t)a[3] * b[1] +
          (uint64_t)a[4] * b[0];
  uint32_t t4 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[0] * b[5] +
          (uint64_t)a[1] * b[4] +
          (uint64_t)a[2] * b[3] +
          (uint64_t)a[3] * b[2] +
          (uint64_t)a[4] * b[1] +
          (uint64_t)a[5] * b[0];
  uint32_t t5 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[0] * b[6] +
          (uint64_t)a[1] * b[5] +
          (uint64_t)a[2] * b[4] +
          (uint64_t)a[3] * b[3] +
          (uint64_t)a[4] * b[2] +
          (uint64_t)a[5] * b[1] +
          (uint64_t)a[6] * b[0];
  uint32_t t6 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[0] * b[7] +
          (uint64_t)a[1] * b[6] +
          (uint64_t)a[2] * b[5] +
          (uint64_t)a[3] * b[4] +
          (uint64_t)a[4] * b[3] +
          (uint64_t)a[5] * b[2] +
          (uint64_t)a[6] * b[1] +
          (uint64_t)a[7] * b[0];
  uint32_t t7 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[0] * b[8] +
          (uint64_t)a[1] * b[7] +
          (uint64_t)a[2] * b[6] +
          (uint64_t)a[3] * b[5] +
          (uint64_t)a[4] * b[4] +
          (uint64_t)a[5] * b[3] +
          (uint64_t)a[6] * b[2] +
          (uint64_t)a[7] * b[1] +
          (uint64_t)a[8] * b[0];
  uint32_t t8 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[0] * b[9] +
          (uint64_t)a[1] * b[8] +
          (uint64_t)a[2] * b[7] +
          (uint64_t)a[3] * b[6] +
          (uint64_t)a[4] * b[5] +
          (uint64_t)a[5] * b[4] +
          (uint64_t)a[6] * b[3] +
          (uint64_t)a[7] * b[2] +
          (uint64_t)a[8] * b[1] +
          (uint64_t)a[9] * b[0];
  uint32_t t9 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[1] * b[9] +
            (uint64_t)a[2] * b[8] +
            (uint64_t)a[3] * b[7] +
            (uint64_t)a[4] * b[6] +
            (uint64_t)a[5] * b[5] +
            (uint64_t)a[6] * b[4] +
            (uint64_t)a[7] * b[3] +
            (uint64_t)a[8] * b[2] +
            (uint64_t)a[9] * b[1];
  uint32_t t10 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[2] * b[9] +
          (uint64_t)a[3] * b[8] +
          (uint64_t)a[4] * b[7] +
          (uint64_t)a[5] * b[6] +
          (uint64_t)a[6] * b[5] +
          (uint64_t)a[7] * b[4] +
          (uint64_t)a[8] * b[3] +
          (uint64_t)a[9] * b[2];
  uint32_t t11 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[3] * b[9] +
          (uint64_t)a[4] * b[8] +
          (uint64_t)a[5] * b[7] +
          (uint64_t)a[6] * b[6] +
          (uint64_t)a[7] * b[5] +
          (uint64_t)a[8] * b[4] +
          (uint64_t)a[9] * b[3];
  uint32_t t12 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[4] * b[9] +
          (uint64_t)a[5] * b[8] +
          (uint64_t)a[6] * b[7] +
          (uint64_t)a[7] * b[6] +
          (uint64_t)a[8] * b[5] +
          (uint64_t)a[9] * b[4];
  uint32_t t13 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[5] * b[9] +
          (uint64_t)a[6] * b[8] +
          (uint64_t)a[7] * b[7] +
          (uint64_t)a[8] * b[6] +
          (uint64_t)a[9] * b[5];
  uint32_t t14 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[6] * b[9] +
          (uint64_t)a[7] * b[8] +
          (uint64_t)a[8] * b[7] +
          (uint64_t)a[9] * b[6];
  uint32_t t15 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[7] * b[9] +
          (uint64_t)a[8] * b[8] +
          (uint64_t)a[9] * b[7];
  uint32_t t16 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[8] * b[9] +
          (uint64_t)a[9] * b[8];
  uint32_t t17 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)a[9] * b[9];
  uint32_t t18 = c & 0x3FFFFFFUL; c = c >> 26;
  uint32_t t19 = c;

  c = t0 + (uint64_t)t10 * 0x3D10UL;
  t0 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t1 + (uint64_t) t10 * 0x400UL + (uint64_t)t11 * 0x3D10UL;
  t1 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t2 + (uint64_t)t11 * 0x400UL + (uint64_t)t12 * 0x3D10UL;
  t2 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t3 + (uint64_t)t12 * 0x400UL + (uint64_t)t13 * 0x3D10UL;
  output[3] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t4 + (uint64_t)t13 * 0x400UL + (uint64_t)t14 * 0x3D10UL;
  output[4] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t5 + (uint64_t)t14 * 0x400UL + (uint64_t)t15 * 0x3D10UL;
  output[5] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t6 + (uint64_t)t15 * 0x400UL + (uint64_t)t16 * 0x3D10UL;
  output[6] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t7 + (uint64_t)t16 * 0x400UL + (uint64_t)t17 * 0x3D10UL;
  output[7] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t8 + (uint64_t)t17 * 0x400UL + (uint64_t)t18 * 0x3D10UL;
  output[8] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t9 + (uint64_t)t18 * 0x400UL + (uint64_t)t19 * 0x1000003D10UL; // 0x1000003D10UL equals 2^4*(2^{32} + 977)  
  output[9] = c & 0x03FFFFFUL; c = c >> 22;
  uint64_t d = t0 + c * 0x3D1UL;
  output[0] = d & 0x3FFFFFFUL; d = d >> 26;
  d = d + t1 + c*0x40;
  output[1] = d & 0x3FFFFFFUL; d = d >> 26;
  output[2] = t2 + d;
}

void ECSquareFieldElement_Inner(uint32_t* output, const uint32_t* input) {
  uint64_t c = (uint64_t)input[0] * input[0];
  uint32_t t0 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[0]*2) * input[1];
  uint32_t t1 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[0]*2) * input[2] +
          (uint64_t)input[1] * input[1];
  uint32_t t2 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[0]*2) * input[3] +
          (uint64_t)(input[1]*2) * input[2];
  uint32_t t3 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[0]*2) * input[4] +
          (uint64_t)(input[1]*2) * input[3] +
          (uint64_t)input[2] * input[2];
  uint32_t t4 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[0]*2) * input[5] +
          (uint64_t)(input[1]*2) * input[4] +
          (uint64_t)(input[2]*2) * input[3];
  uint32_t t5 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[0]*2) * input[6] +
          (uint64_t)(input[1]*2) * input[5] +
          (uint64_t)(input[2]*2) * input[4] +
          (uint64_t)input[3] * input[3];
  uint32_t t6 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[0]*2) * input[7] +
          (uint64_t)(input[1]*2) * input[6] +
          (uint64_t)(input[2]*2) * input[5] +
          (uint64_t)(input[3]*2) * input[4];
  uint32_t t7 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[0]*2) * input[8] +
          (uint64_t)(input[1]*2) * input[7] +
          (uint64_t)(input[2]*2) * input[6] +
          (uint64_t)(input[3]*2) * input[5] +
          (uint64_t)input[4] * input[4];
  uint32_t t8 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[0]*2) * input[9] +
          (uint64_t)(input[1]*2) * input[8] +
          (uint64_t)(input[2]*2) * input[7] +
          (uint64_t)(input[3]*2) * input[6] +
          (uint64_t)(input[4]*2) * input[5];
  uint32_t t9 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[1]*2) * input[9] +
          (uint64_t)(input[2]*2) * input[8] +
          (uint64_t)(input[3]*2) * input[7] +
          (uint64_t)(input[4]*2) * input[6] +
          (uint64_t)input[5] * input[5];
  uint32_t t10 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[2]*2) * input[9] +
          (uint64_t)(input[3]*2) * input[8] +
          (uint64_t)(input[4]*2) * input[7] +
          (uint64_t)(input[5]*2) * input[6];
  uint32_t t11 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[3]*2) * input[9] +
          (uint64_t)(input[4]*2) * input[8] +
          (uint64_t)(input[5]*2) * input[7] +
          (uint64_t)input[6] * input[6];
  uint32_t t12 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[4]*2) * input[9] +
          (uint64_t)(input[5]*2) * input[8] +
          (uint64_t)(input[6]*2) * input[7];
  uint32_t t13 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[5]*2) * input[9] +
          (uint64_t)(input[6]*2) * input[8] +
          (uint64_t)input[7] * input[7];
  uint32_t t14 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[6]*2) * input[9] +
          (uint64_t)(input[7]*2) * input[8];
  uint32_t t15 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[7]*2) * input[9] +
          (uint64_t)input[8] * input[8];
  uint32_t t16 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)(input[8]*2) * input[9];
  uint32_t t17 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + (uint64_t)input[9] * input[9];
  uint32_t t18 = c & 0x3FFFFFFUL; c = c >> 26;
  uint32_t t19 = c;

  c = t0 + (uint64_t)t10 * 0x3D10UL;
  t0 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t1 + (uint64_t)t10*0x400UL + (uint64_t)t11 * 0x3D10UL;
  t1 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t2 + (uint64_t)t11*0x400UL + (uint64_t)t12 * 0x3D10UL;
  t2 = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t3 + (uint64_t)t12*0x400UL + (uint64_t)t13 * 0x3D10UL;
  output[3] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t4 + (uint64_t)t13*0x400UL + (uint64_t)t14 * 0x3D10UL;
  output[4] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t5 + (uint64_t)t14*0x400UL + (uint64_t)t15 * 0x3D10UL;
  output[5] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t6 + (uint64_t)t15*0x400UL + (uint64_t)t16 * 0x3D10UL;
  output[6] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t7 + (uint64_t)t16*0x400UL + (uint64_t)t17 * 0x3D10UL;
  output[7] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t8 + (uint64_t)t17*0x400UL + (uint64_t)t18 * 0x3D10UL;
  output[8] = c & 0x3FFFFFFUL; c = c >> 26;
  c = c + t9 + (uint64_t)t18*0x400UL + (uint64_t)t19 * 0x1000003D10UL; // 0x1000003D10UL equals 2^4*(2^{32} + 977)
  output[9] = c & 0x03FFFFFUL; c = c >> 22;
  uint64_t d = t0 + c * 0x3D1UL;
  output[0] = d & 0x3FFFFFFUL; d = d >> 26;
  d = d + t1 + c*0x40;
  output[1] = d & 0x3FFFFFFUL; d = d >> 26;
  output[2] = t2 + d;
}

void ECMultiplyFieldElements(fieldElement* output, const fieldElement* inputLeft, const fieldElement* inputRight) {
  ECMultiplyFieldElementsInner(output->n, inputLeft->n, inputRight->n, );
}

void ECSquareFieldElement(fieldElement* output, const fieldElement* input) {
#ifdef VERIFY
  assert(input->magnitude <= 8);
  output->magnitude = 1;
  output->normalized = 0;
#endif
  ECSquareFieldElement_Inner(r->n, a->n);
}

void ECDoubleProjective(ECProjectivePoint *output, ECProjectivePoint *input) {
  fieldElement t5 = input->y;
  fieldElementNormalize(&t5);
  if (input->infinity || ECIsZeroFieldElement(&t5)) {
      output->infinity = 1;
      return;
  }
  fieldElement t1, t2, t3, t4;
  ECMultiplyFieldElements(&output->z, &t5, &input->z);
  ECMultiplyFieldElementByInt(&output->z, 2);       // Z' = 2*Y*Z (2)
  ECSquareFieldElement(&t1, &input->x);
  ECMultiplyFieldElementByInt(&t1, 3);         // T1 = 3*X^2 (3)
  ECSquareFieldElement(&t2, &t1);           // T2 = 9*X^4 (1)
  ECSquareFieldElement(&t3, &t5);
  ECMultiplyFieldElementByInt(&t3, 2);         // T3 = 2*Y^2 (2)
  ECSquareFieldElement(&t4, &t3);
  ECMultiplyFieldElementByInt(&t4, 2);         // T4 = 8*Y^4 (2)
  ECMultiplyFieldElements(&t3, &input->x, &t3);    // T3 = 2*X*Y^2 (1)
  output->x = t3;
  ECMultiplyFieldElementByInt(&output->x, 4);       // X' = 8*X*Y^2 (4)
  ECNegateFieldElement(&output->x, &output->x, 4); // X' = -8*X*Y^2 (5)
  secp256k1_fe_add(&output->x, &t2);         // X' = 9*X^4 - 8*X*Y^2 (6)
  ECNegateFieldElement(&t2, &t2, 1);     // T2 = -9*X^4 (2)
  ECMultiplyFieldElementByInt(&t3, 6);         // T3 = 12*X*Y^2 (6)
  secp256k1_fe_add(&t3, &t2);           // T3 = 12*X*Y^2 - 9*X^4 (8)
  ECMultiplyFieldElements(&output->y, &t1, &t3);    // Y' = 36*X^3*Y^2 - 27*X^6 (1)
  ECNegateFieldElement(&t2, &t4, 2);     // T2 = -8*Y^4 (3)
  secp256k1_fe_add(&output->y, &t2);         // Y' = 36*X^3*Y^2 - 27*X^6 - 8*Y^4 (4)
  output->infinity = 0;
}

void ECAddProjective_Global(__global ECProjectivePoint *output, const ECProjectivePoint* left, __global const ECProjectivePoint* right) {
  ECProjectivePoint b, r;
  b = *right;
  ECAddProjective_Local(&r, left, &b);
  *output = r;
}

void ECAddProjective_Local(ECProjectivePoint* output, const ECProjectivePoint* left, const ECProjectivePoint* right) {
  if (left->infinity) {
    *output = *right;
    return;
  }
  if (right->infinity) {
    *output = *left;
    return;
  }
  
  ECProjectivePoint a = *left;
  ECProjectivePoint b = *right;
  ECProjectivePoint r;
  
  r.infinity = 0;
  fieldElement z22; ECSquareFieldElement(&z22, &b.z);
  fieldElement z12; ECSquareFieldElement(&z12, &a.z);
  fieldElement u1; ECMultiplyFieldElements(&u1, &a.x, &z22);
  fieldElement u2; ECMultiplyFieldElements(&u2, &b.x, &z12);
  fieldElement s1; ECMultiplyFieldElements(&s1, &a.y, &z22); ECMultiplyFieldElements(&s1, &s1, &b.z);
  fieldElement s2; ECMultiplyFieldElements(&s2, &b.y, &z12); ECMultiplyFieldElements(&s2, &s2, &a.z);
  fieldElementNormalize(&u1);
  fieldElementNormalize(&u2);
  if (ECAreEqualFieldElements(&u1, &u2)) {
    fieldElementNormalize(&s1);
    fieldElementNormalize(&s2);
    if (ECAreEqualFieldElements(&s1, &s2)) {
        ECDoubleProjective(&r, &a);
    } else {
        r.infinity = 1;
    }
    return;
  }
  fieldElement h; ECNegateFieldElement(&h, &u1, 1); secp256k1_fe_add(&h, &u2);
  fieldElement i; ECNegateFieldElement(&i, &s1, 1); secp256k1_fe_add(&i, &s2);
  fieldElement i2; ECSquareFieldElement(&i2, &i);
  fieldElement h2; ECSquareFieldElement(&h2, &h);
  fieldElement h3; ECMultiplyFieldElements(&h3, &h, &h2);
  ECMultiplyFieldElements(&r.z, &a.z, &b.z); ECMultiplyFieldElements(&r.z, &r.z, &h);
  fieldElement t; ECMultiplyFieldElements(&t, &u1, &h2);
  r.x = t; ECMultiplyFieldElementByInt(&r.x, 2); secp256k1_fe_add(&r.x, &h3); ECNegateFieldElement(&r.x, &r.x, 3); secp256k1_fe_add(&r.x, &i2);
  ECNegateFieldElement(&r.y, &r.x, 5); secp256k1_fe_add(&r.y, &t); ECMultiplyFieldElements(&r.y, &r.y, &i);
  ECMultiplyFieldElements(&h3, &h3, &s1); ECNegateFieldElement(&h3, &h3, 1);
  secp256k1_fe_add(&r.y, &h3);
  
  *output = r;
}

void secp256k1_gej_add_ge(ECProjectivePoint *r, const ECProjectivePoint *a, const ECPoint *b) {
  if (a->infinity) {
    r->infinity = b->infinity;
    r->x = b->x;
    r->y = b->y;
    ECSetFieldElementToInt32(&r->z, 1);
    return;
  }
  if (b->infinity) {
    *r = *a;
    return;
  }
  r->infinity = 0;
  fieldElement z12; ECSquareFieldElement(&z12, &a->z);
  fieldElement u1 = a->x; fieldElementNormalize(&u1);
  fieldElement u2; ECMultiplyFieldElements(&u2, &b->x, &z12);
  fieldElement s1 = a->y; fieldElementNormalize(&s1);
  fieldElement s2; ECMultiplyFieldElements(&s2, &b->y, &z12); ECMultiplyFieldElements(&s2, &s2, &a->z);
  fieldElementNormalize(&u1);
  fieldElementNormalize(&u2);
  if (ECAreEqualFieldElements(&u1, &u2)) {
    fieldElementNormalize(&s1);
    fieldElementNormalize(&s2);
    if (ECAreEqualFieldElements(&s1, &s2)) {
      ECDoubleProjective(r, a);
    } else {
      r->infinity = 1;
    }
    return;
  }
  fieldElement h; ECNegateFieldElement(&h, &u1, 1); secp256k1_fe_add(&h, &u2);
  fieldElement i; ECNegateFieldElement(&i, &s1, 1); secp256k1_fe_add(&i, &s2);
  fieldElement i2; ECSquareFieldElement(&i2, &i);
  fieldElement h2; ECSquareFieldElement(&h2, &h);
  fieldElement h3; ECMultiplyFieldElements(&h3, &h, &h2);
  r->z = a->z; ECMultiplyFieldElements(&r->z, &r->z, &h);
  fieldElement t; ECMultiplyFieldElements(&t, &u1, &h2);
  r->x = t; ECMultiplyFieldElementByInt(&r->x, 2); secp256k1_fe_add(&r->x, &h3); ECNegateFieldElement(&r->x, &r->x, 3); secp256k1_fe_add(&r->x, &i2);
  ECNegateFieldElement(&r->y, &r->x, 5); secp256k1_fe_add(&r->y, &t); ECMultiplyFieldElements(&r->y, &r->y, &i);
  ECMultiplyFieldElements(&h3, &h3, &s1); ECNegateFieldElement(&h3, &h3, 1);
  secp256k1_fe_add(&r->y, &h3);
}

void secp256k1_gej_get_x(fieldElement *r, const ECProjectivePoint *a) {
  fieldElement zi2; secp256k1_fe_inv_var(&zi2, &a->z); ECSquareFieldElement(&zi2, &zi2);
  ECMultiplyFieldElements(r, &a->x, &zi2);
}

void secp256k1_fe_inv(fieldElement *r, const fieldElement *a) {
  // The binary representation of (p - 2) has 5 blocks of 1s, with lengths in
  // { 1, 2, 22, 223 }. Use an addition chain to calculate 2^n - 1 for each block:
  // [1], [2], 3, 6, 9, 11, [22], 44, 88, 176, 220, [223]

  fieldElement x2;
  ECSquareFieldElement(&x2, a);
  ECMultiplyFieldElements(&x2, &x2, a);

  fieldElement x3;
  ECSquareFieldElement(&x3, &x2);
  ECMultiplyFieldElements(&x3, &x3, a);

  fieldElement x6 = x3;
  for (int j=0; j<3; j++) ECSquareFieldElement(&x6, &x6);
  ECMultiplyFieldElements(&x6, &x6, &x3);

  fieldElement x9 = x6;
  for (int j=0; j<3; j++) ECSquareFieldElement(&x9, &x9);
  ECMultiplyFieldElements(&x9, &x9, &x3);

  fieldElement x11 = x9;
  for (int j=0; j<2; j++) ECSquareFieldElement(&x11, &x11);
  ECMultiplyFieldElements(&x11, &x11, &x2);

  fieldElement x22 = x11;
  for (int j=0; j<11; j++) ECSquareFieldElement(&x22, &x22);
  ECMultiplyFieldElements(&x22, &x22, &x11);

  fieldElement x44 = x22;
  for (int j=0; j<22; j++) ECSquareFieldElement(&x44, &x44);
  ECMultiplyFieldElements(&x44, &x44, &x22);

  fieldElement x88 = x44;
  for (int j=0; j<44; j++) ECSquareFieldElement(&x88, &x88);
  ECMultiplyFieldElements(&x88, &x88, &x44);

  fieldElement x176 = x88;
  for (int j=0; j<88; j++) ECSquareFieldElement(&x176, &x176);
  ECMultiplyFieldElements(&x176, &x176, &x88);

  fieldElement x220 = x176;
  for (int j=0; j<44; j++) ECSquareFieldElement(&x220, &x220);
  ECMultiplyFieldElements(&x220, &x220, &x44);

  fieldElement x223 = x220;
  for (int j=0; j<3; j++) ECSquareFieldElement(&x223, &x223);
  ECMultiplyFieldElements(&x223, &x223, &x3);

  // The final result is then assembled using a sliding window over the blocks.

  fieldElement t1 = x223;
  for (int j=0; j<23; j++) ECSquareFieldElement(&t1, &t1);
  ECMultiplyFieldElements(&t1, &t1, &x22);
  for (int j=0; j<5; j++) ECSquareFieldElement(&t1, &t1);
  ECMultiplyFieldElements(&t1, &t1, a);
  for (int j=0; j<3; j++) ECSquareFieldElement(&t1, &t1);
  ECMultiplyFieldElements(&t1, &t1, &x2);
  for (int j=0; j<2; j++) ECSquareFieldElement(&t1, &t1);
  ECMultiplyFieldElements(r, &t1, a);
}

void secp256k1_fe_inv_var(fieldElement *r, const fieldElement *a) {
  secp256k1_fe_inv(r, a);
}

