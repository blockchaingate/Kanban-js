/**********************************************************************
 * Copyright (c) 2018 FA Enterprise System                            *
 * Distributed under the MIT software license.                        *
 * This file is a fork (modified copy) of                             *
 * Pieter Wuille's sipa library (https://github.com/sipa/secp256k1).  *
 **********************************************************************/
/**********************************************************************
 * Copyright (c) 2013, 2014 Pieter Wuille                             *
 * Distributed under the MIT software license, see                    *
 * http://www.opensource.org/licenses/mit-license.php.                *
 **********************************************************************/

/**********************************************************************
Please see the file opencl/README.md for technical notes on this code.
 **********************************************************************/

#ifndef SECP256k1_H_header
#define SECP256k1_H_header

//******From util.h******
#ifdef VERIFY
#define VERIFY_CHECK CHECK
#define VERIFY_SETUP(stmt) do { stmt; } while(0)
#else
#ifndef VERIFY_CHECK
  #define VERIFY_CHECK(cond) do { (void)(cond); } while(0)
#endif
#define VERIFY_SETUP(stmt)
#endif

#ifndef MACRO_USE_openCL
#define ___static__constant static const
#define __constant 
#define __global
#endif

//Memory pool format: in the notes before the definition of memoryPool_Initialize.

#define MACRO_numberOfOutputs 4
#define MACRO_MessageLogSize 500

__global void* checked_malloc(unsigned int size, __global unsigned char* memoryPool);
void memoryPool_writeUINT(unsigned int numberToWrite, __global unsigned char* memoryPoolPointer);
void memoryPool_writeString(__constant const char* message, __global unsigned char* memoryPool);
void memoryPool_writeCurrentSizeAsOutput(unsigned int argumentIndex, __global unsigned char* memoryPool);

unsigned int memoryPool_readUINT(__global const unsigned char *memoryPoolPointer);
unsigned int memoryPool_readPoolSize(__global const unsigned char* memoryPool);

unsigned int memoryPool_readNumberReservedBytesExcludingLog();
unsigned int memoryPool_readNumberReservedBytesIncludingLog();

//Memory pool format: in the notes before the definition of memoryPool_Initialize.
void memoryPool_Initialize(unsigned int totalSize, __global unsigned char* memoryPool);

void assertFalse(__constant const char* errorMessage, __global unsigned char *memoryPool);

void memoryPool_freeMemory(void* any);
void memoryPool_freeMemory__global(__global void* any);


//removed:
//#if defined(SECP256K1_BUILD) && defined(VERIFY)
//# define SECP256K1_RESTRICT
//#else
//# if (!defined(__STDC_VERSION__) || (__STDC_VERSION__ < 199901L) )
//#  if SECP256K1_GNUC_PREREQ(3,0)
//#   define SECP256K1_RESTRICT __restrict__
//#  elif (defined(_MSC_VER) && _MSC_VER >= 1400)
//#   define SECP256K1_RESTRICT __restrict
//#  else
//#   define SECP256K1_RESTRICT
//#  endif
//# else
//#define SECP256K1_RESTRICT
//# endif
//#endif

//******end of util.h******



///////////////////////
///////////////////////
#include "../opencl/cl/secp256k1_set_1_address_space__default.h"
#include "../opencl/cl/secp256k1_data_structures_parametric_address_space.h"
///////////////////////
///////////////////////



//******From field_10x26.h******

/* Unpacks a constant into a overlapping multi-limbed FE element. */
#define SECP256K1_FE_CONST_INNER(d7, d6, d5, d4, d3, d2, d1, d0) { \
    (d0) & 0x3FFFFFFUL, \
    (((uint32_t)d0) >> 26) | (((uint32_t)(d1) & 0xFFFFFUL) << 6), \
    (((uint32_t)d1) >> 20) | (((uint32_t)(d2) & 0x3FFFUL) << 12), \
    (((uint32_t)d2) >> 14) | (((uint32_t)(d3) & 0xFFUL) << 18), \
    (((uint32_t)d3) >> 8) | (((uint32_t)(d4) & 0x3UL) << 24), \
    (((uint32_t)d4) >> 2) & 0x3FFFFFFUL, \
    (((uint32_t)d4) >> 28) | (((uint32_t)(d5) & 0x3FFFFFUL) << 4), \
    (((uint32_t)d5) >> 22) | (((uint32_t)(d6) & 0xFFFFUL) << 10), \
    (((uint32_t)d6) >> 16) | (((uint32_t)(d7) & 0x3FFUL) << 16), \
    (((uint32_t)d7) >> 10) \
}

#ifdef VERIFY
#define SECP256K1_FE_CONST(d7, d6, d5, d4, d3, d2, d1, d0) {SECP256K1_FE_CONST_INNER((d7), (d6), (d5), (d4), (d3), (d2), (d1), (d0)), 1, 1}
#else
#define SECP256K1_FE_CONST(d7, d6, d5, d4, d3, d2, d1, d0) {SECP256K1_FE_CONST_INNER((d7), (d6), (d5), (d4), (d3), (d2), (d1), (d0))}
#endif

#define SECP256K1_FE_STORAGE_CONST(d7, d6, d5, d4, d3, d2, d1, d0) {{ (d0), (d1), (d2), (d3), (d4), (d5), (d6), (d7) }}
#define SECP256K1_FE_STORAGE_CONST_GET(d) d.n[7], d.n[6], d.n[5], d.n[4],d.n[3], d.n[2], d.n[1], d.n[0]

void secp256k1_fe_copy__from__global(secp256k1_fe* output, __global const secp256k1_fe* input);

//******end of field_10x26.h******


//******From field.h******
/** Field element module.
 *
 *  Field elements can be represented in several ways, but code accessing
 *  it (and implementations) need to take certain properties into account.
 *  - Each field element can be normalized or not.
 *  - Each field element has a magnitude, which represents how far away
 *    its representation is from normalization. Normalized elements
 *    always have a magnitude of 1, but a magnitude of 1 doesn't imply
 *    normality.
 */

/** Normalize a field element. */
void secp256k1_fe_normalize(secp256k1_fe* inputOutput); //original name: secp256k1_fe_normalize

/** Weakly normalize a field element: reduce it magnitude to 1, but don't fully normalize. */
void secp256k1_fe_normalize_weak(secp256k1_fe* inputOutput); //original name: secp256k1_fe_normalize_weak

/** Normalize a field element, without constant-time guarantee. */
void secp256k1_fe_normalize_var(secp256k1_fe* inputOutput); //original name: secp256k1_fe_normalize_var

/** Verify whether a field element represents zero i.e. would normalize to a zero value. The field
 *  implementation may optionally normalize the input, but this should not be relied upon. */
int secp256k1_fe_normalizes_to_zero(secp256k1_fe *inputOutput); // original name: secp256k1_fe_normalizes_to_zero

/** Verify whether a field element represents zero i.e. would normalize to a zero value. The field
 *  implementation may optionally normalize the input, but this should not be relied upon. */
int secp256k1_fe_normalizes_to_zero_var(secp256k1_fe *inputOutput); // original name: secp256k1_fe_normalizes_to_zero_var

/** Set a field element equal to a small integer. Resulting field element is normalized. */
void secp256k1_fe_set_int(secp256k1_fe *r, int a); //original name: secp256k1_fe_set_int

/** Verify whether a field element is zero. Requires the input to be normalized. */
int secp256k1_fe_is_zero(const secp256k1_fe *a); //original name: secp256k1_fe_is_zero

/** Check the "oddness" of a field element. Requires the input to be normalized. */
int secp256k1_fe_is_odd(const secp256k1_fe *a); //original name: secp256k1_fe_is_odd

/** Compare two field elements. Requires magnitude-1 inputs. */
int secp256k1_fe_equal_var(const secp256k1_fe *a, const secp256k1_fe *b); //original name: secp256k1_fe_equal_var

/** Set a field element equal to 32-byte big endian value. If successful, the resulting field element is normalized. */
int secp256k1_fe_set_b32(secp256k1_fe *r, const unsigned char *a); //original name: secp256k1_fe_set_b32

/** Convert a field element to a 32-byte big endian value. Requires the input to be normalized */
void secp256k1_fe_get_b32(unsigned char *r, const secp256k1_fe *a); //original name: secp256k1_fe_get_b32

/** Set a field element equal to the additive inverse of another. Takes a maximum magnitude of the input
 *  as an argument. The magnitude of the output is one higher. */
void secp256k1_fe_negate(secp256k1_fe *r, const secp256k1_fe *a, int m); //original name: secp256k1_fe_negate

/** Multiplies the passed field element with a small integer constant. Multiplies the magnitude by that
 *  small integer. */
void secp256k1_fe_mul_int(secp256k1_fe *r, int a); //original name: secp256k1_fe_mul_int

/** Sets a field element to be the square of another. Requires the input's magnitude to be at most 8.
 *  The output magnitude is 1 (but not guaranteed to be normalized). */
void secp256k1_fe_sqr(secp256k1_fe *r, const secp256k1_fe *a); //original name: secp256k1_fe_sqr

/** Sets a field element to be the (modular) square root (if any exist) of another. Requires the
 *  input's magnitude to be at most 8. The output magnitude is 1 (but not guaranteed to be
 *  normalized). Return value indicates whether a square root was found. */
int secp256k1_fe_sqrt_var(secp256k1_fe *r, const secp256k1_fe *a); //original name: secp256k1_fe_sqrt_var

/** Sets a field element to be the (modular) inverse of another. Requires the input's magnitude to be
 *  at most 8. The output magnitude is 1 (but not guaranteed to be normalized). */
void secp256k1_fe_inv(secp256k1_fe *r, const secp256k1_fe *a); //original name: secp256k1_fe_inv

/** Potentially faster version of secp256k1_fe_inv, without constant-time guarantee. */
void secp256k1_fe_inv_var(secp256k1_fe *r, const secp256k1_fe *a); //original name: secp256k1_fe_inv_var

/** Calculate the (modular) inverses of a batch of field elements. Requires the inputs' magnitudes to be
 *  at most 8. The output magnitudes are 1 (but not guaranteed to be normalized). The inputs and
 *  outputs must not overlap in memory. */
void secp256k1_fe_inv_all_var(size_t len, __global secp256k1_fe *r, __global const secp256k1_fe *a);

/** If flag is true, set *r equal to *a; otherwise leave it. Constant-time. */
void secp256k1_fe_cmov(secp256k1_fe *r, const secp256k1_fe *a, int flag); //original name: secp256k1_fe_cmov
//******end of field.h******


//******From scalar_8x32.h******

/** A scalar modulo the group order of the secp256k1 curve. */
typedef struct {
    uint32_t d[8];
} secp256k1_scalar;

#define SECP256K1_SCALAR_CONST(d7, d6, d5, d4, d3, d2, d1, d0) {{(d0), (d1), (d2), (d3), (d4), (d5), (d6), (d7)}}
//******end of scalar_8x32.h******


//******From group.h******

#define SECP256K1_GE_CONST(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {SECP256K1_FE_CONST((a),(b),(c),(d),(e),(f),(g),(h)), SECP256K1_FE_CONST((i),(j),(k),(l),(m),(n),(o),(p)), 0}
#define SECP256K1_GE_CONST_INFINITY {SECP256K1_FE_CONST(0, 0, 0, 0, 0, 0, 0, 0), SECP256K1_FE_CONST(0, 0, 0, 0, 0, 0, 0, 0), 1}

#define SECP256K1_GEJ_CONST(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {SECP256K1_FE_CONST((a),(b),(c),(d),(e),(f),(g),(h)), SECP256K1_FE_CONST((i),(j),(k),(l),(m),(n),(o),(p)), SECP256K1_FE_CONST(0, 0, 0, 0, 0, 0, 0, 1), 0}
#define SECP256K1_GEJ_CONST_INFINITY {SECP256K1_FE_CONST(0, 0, 0, 0, 0, 0, 0, 0), SECP256K1_FE_CONST(0, 0, 0, 0, 0, 0, 0, 0), SECP256K1_FE_CONST(0, 0, 0, 0, 0, 0, 0, 0), 1}

#define SECP256K1_GE_STORAGE_CONST(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {SECP256K1_FE_STORAGE_CONST((a),(b),(c),(d),(e),(f),(g),(h)), SECP256K1_FE_STORAGE_CONST((i),(j),(k),(l),(m),(n),(o),(p))}

#define SECP256K1_GE_STORAGE_CONST_GET(t) SECP256K1_FE_STORAGE_CONST_GET(t.x), SECP256K1_FE_STORAGE_CONST_GET(t.y)

/** Set a group element equal to the point with given X and Y coordinates */
void secp256k1_ge_set_xy(secp256k1_ge *r, const secp256k1_fe *x, const secp256k1_fe *y);

/** Set a group element (affine) equal to the point with the given X coordinate, and given oddness
 *  for Y. Return value indicates whether the result is valid. */
int secp256k1_ge_set_xo_var(secp256k1_ge *r, const secp256k1_fe *x, int odd);

/** Check whether a group element is the point at infinity. */
int secp256k1_ge_is_infinity(const secp256k1_ge *a);

/** Check whether a group element is valid (i.e., on the curve). */
int secp256k1_ge_is_valid_var(const secp256k1_ge *a);

void secp256k1_ge_neg(secp256k1_ge *r, const secp256k1_ge *a);

/** Set a group element equal to another which is given in jacobian coordinates */
void secp256k1_ge_set_gej(secp256k1_ge *r, secp256k1_gej *a);

/** Set a batch of group elements equal to the inputs given in jacobian coordinates */
void secp256k1_ge_set_all_gej_var(
  size_t len, 
  secp256k1_ge *outputPoints, 
  const secp256k1_gej *outputPointsJacobian,
  __global unsigned char* memoryPool
);

/** Set a batch of group elements equal to the inputs given in jacobian
 *  coordinates (with known z-ratios). zr must contain the known z-ratios such
 *  that mul(a[i].z, zr[i+1]) == a[i+1].z. zr[0] is ignored. */
void secp256k1_ge_set_table_gej_var(size_t len, __global secp256k1_ge *r, __global const secp256k1_gej *a, __global const secp256k1_fe *zr);

/** Bring a batch inputs given in jacobian coordinates (with known z-ratios) to
 *  the same global z "denominator". zr must contain the known z-ratios such
 *  that mul(a[i].z, zr[i+1]) == a[i+1].z. zr[0] is ignored. The x and y
 *  coordinates of the result are stored in r, the common z coordinate is
 *  stored in globalz. */
void secp256k1_ge_globalz_set_table_gej(
  size_t len, secp256k1_ge *r,
  secp256k1_fe *globalz, 
  __global const secp256k1_gej *a, 
  __global const secp256k1_fe *zr
);

/** Set a group element (jacobian) equal to the point at infinity. */
void secp256k1_gej_set_infinity(secp256k1_gej *r);

/** Compare the X coordinate of a group element (jacobian). */
int secp256k1_gej_eq_x_var(const secp256k1_fe *x, const secp256k1_gej *a);

/** Set r equal to the inverse of a (i.e., mirrored around the X axis) */
void secp256k1_gej_neg(secp256k1_gej *r, const secp256k1_gej *a);

/** Check whether a group element is the point at infinity. */
int secp256k1_gej_is_infinity(const secp256k1_gej *a);

/** Set r equal to the double of a. If rzr is not-NULL, r->z = a->z * *rzr (where infinity means an implicit z = 0).
 * a may not be zero. Constant time. */
void secp256k1_gej_double_nonzero(secp256k1_gej *r, const secp256k1_gej *a, secp256k1_fe *rzr);

/** Set r equal to the double of a. If rzr is not-NULL, r->z = a->z * *rzr (where infinity means an implicit z = 0). */
void secp256k1_gej_double_var(secp256k1_gej *r, const secp256k1_gej *a, secp256k1_fe *rzr);

/** Set r equal to the sum of a and b. If rzr is non-NULL, r->z = a->z * *rzr (a cannot be infinity in that case). */
void secp256k1_gej_add_var(secp256k1_gej *r, const secp256k1_gej *a, const secp256k1_gej *b, secp256k1_fe *rzr);

/** Set r equal to the sum of a and b (with b given in affine coordinates, and not infinity). */
void secp256k1_gej_add_ge(secp256k1_gej *r, const secp256k1_gej *a, const secp256k1_ge *b);

/** Set r equal to the sum of a and b (with the inverse of b's Z coordinate passed as bzinv). */
void secp256k1_gej_add_zinv_var(secp256k1_gej *r, const secp256k1_gej *a, const secp256k1_ge *b, const secp256k1_fe *bzinv);

#ifdef USE_ENDOMORPHISM
/** Set r to be equal to lambda times a, where lambda is chosen in a way such that this is very fast. */
void secp256k1_ge_mul_lambda(secp256k1_ge *r, const secp256k1_ge *a);
#endif

/** Clear a secp256k1_gej to prevent leaking sensitive information. */
void secp256k1_gej_clear(secp256k1_gej *r);

/** Clear a secp256k1_ge to prevent leaking sensitive information. */
void secp256k1_ge_clear(secp256k1_ge *r);

/** Rescale a jacobian point by b which must be non-zero. Constant-time. */
void secp256k1_gej_rescale(secp256k1_gej *r, const secp256k1_fe *b);

//******end of group.h******



//******From ecmult.h******

/* optimal for 128-bit and 256-bit exponents. */
#define WINDOW_A 5

/** larger numbers may result in slightly better performance, at the cost of
    exponentially larger precomputed tables. */
//#ifdef USE_ENDOMORPHISM
///** Two tables for window size 15: 1.375 MiB. */
//#define WINDOW_G 15
//#else
/** One table for window size 16: 1.375 MiB. */
#define WINDOW_G 16
//#endif

/** The number of entries a table with precomputed multiples needs to have. */
#define ECMULT_TABLE_SIZE(w) (1 << ((w)-2))
//ECMULT_TABLE_SIZE(WINDOW_A) equals 2^3 = 8
//ECMULT_TABLE_SIZE(WINDOW_G) equals 2^14 = 16384

typedef struct {
  /* For accelerating the computation of a*P + b*G: */
  //Size when constructed: ECMULT_TABLE_SIZE(WINDOW_G)
  __global secp256k1_ge_storage (*pre_g)[];    /* odd multiples of the generator */
} secp256k1_ecmult_context;

//static void secp256k1_ecmult_context_clone(secp256k1_ecmult_context *dst,
//                                           const secp256k1_ecmult_context *src, const secp256k1_callback *cb);
int secp256k1_ecmult_context_is_built(const secp256k1_ecmult_context *ctx);

/** Double multiply: R = na*A + ng*G */
void secp256k1_ecmult(
  __global const secp256k1_ecmult_context *ctx, 
  secp256k1_gej *r, 
  const secp256k1_gej *a, 
  const secp256k1_scalar *na, 
  const secp256k1_scalar *ng,
  __global unsigned char* memoryPool
);
//******end of ecmult.h******


//******Content from ecmult_gen.h******

typedef struct {
    /* For accelerating the computation of a*G:
     * To harden against timing attacks, use the following mechanism:
     * * Break up the multiplicand into groups of 4 bits, called n_0, n_1, n_2, ..., n_63.
     * * Compute sum(n_i * 16^i * G + U_i, i=0..63), where:
     *   * U_i = U * 2^i (for i=0..62)
     *   * U_i = U * (1-2^63) (for i=63)
     *   where U is a point with no known corresponding scalar. Note that sum(U_i, i=0..63) = 0.
     * For each i, and each of the 16 possible values of n_i, (n_i * 16^i * G + U_i) is
     * precomputed (call it prec(i, n_i)). The formula now becomes sum(prec(i, n_i), i=0..63).
     * None of the resulting prec group elements have a known scalar, and neither do any of
     * the intermediate sums while computing a*G.
     */
    __global secp256k1_ge_storage* prec; /* old_prec[j][i] = prec[16 * j + i] */
    //original version:
    //__global secp256k1_ge_storage (*prec)[64][16]; /* prec[j][i] = 16^j * i * G + U_i */
    secp256k1_scalar blind;
    secp256k1_gej initial;
} secp256k1_ecmult_gen_context;

void secp256k1_ecmult_gen_context_init(secp256k1_ecmult_gen_context* ctx);
void secp256k1_ecmult_gen_context_clear(secp256k1_ecmult_gen_context* ctx);
int secp256k1_ecmult_gen_context_is_built(const secp256k1_ecmult_gen_context* ctx);

void secp256k1_ecmult_gen_blind(__global secp256k1_ecmult_gen_context *ctx, const unsigned char *seed32);

void secp256k1_ecmult_gen_context_build(__global secp256k1_ecmult_gen_context* ctx, __global unsigned char* memoryPool);

/** Multiply with the generator: R = a*G */
void secp256k1_ecmult_gen(__global const secp256k1_ecmult_gen_context* ctx, secp256k1_gej *r, const secp256k1_scalar *a);

//******end of ecmult_gen.h******


void secp256k1_scalar_copy__from__global(secp256k1_scalar* output, __global const secp256k1_scalar* input);

//******From ecmult_impl.h******
void secp256k1_ecmult_context_build(__global secp256k1_ecmult_context *output, __global unsigned char* memoryPool);
void secp256k1_gej_copy__from__global(secp256k1_gej* output, __global const secp256k1_gej* input);
//******End of ecmult_impl.h******


//******From ecdsa.h******
int secp256k1_ecdsa_sig_parse(secp256k1_scalar *r, secp256k1_scalar *s, const unsigned char *sig, size_t size);
int secp256k1_ecdsa_sig_serialize(unsigned char *sig, size_t *size, const secp256k1_scalar *r, const secp256k1_scalar *s);
int secp256k1_ecdsa_sig_sign(__global const secp256k1_ecmult_gen_context *ctx, secp256k1_scalar* r, secp256k1_scalar* s, const secp256k1_scalar *seckey, const secp256k1_scalar *message, const secp256k1_scalar *nonce, int *recid);
int secp256k1_ecdsa_sig_recover(
  __global const secp256k1_ecmult_context *ctx, 
  const secp256k1_scalar* r, 
  const secp256k1_scalar* s, 
  secp256k1_ge *pubkey, 
  const secp256k1_scalar *message, 
  int recid,
  __global unsigned char* memoryPool
);

char secp256k1_ecdsa_sig_verify(
  __global const secp256k1_ecmult_context *ctx, 
  __global const secp256k1_scalar* r, 
  __global const secp256k1_scalar* s, 
  __global const secp256k1_ge *pubkey, 
  __global const secp256k1_scalar *message, 
  __global unsigned char* comments, 
  __global unsigned char* memoryPool
);

//******end of ecdsa.h******


///////////////////////
///////////////////////
#include "../opencl/cl/secp256k1_set_1_address_space__global.h"
#include "../opencl/cl/secp256k1_1_parametric_address_space.h"
///////////////////////
#include "../opencl/cl/secp256k1_set_1_address_space__constant.h"
#include "../opencl/cl/secp256k1_1_parametric_address_space.h"
///////////////////////
#include "../opencl/cl/secp256k1_set_1_address_space__default.h"
#include "../opencl/cl/secp256k1_1_parametric_address_space.h"
///////////////////////
///////////////////////


#endif //SECP256k1_H_header
