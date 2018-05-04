// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_INPUTS 
// ADDRESS_SPACE_CONTEXT
// APPEND_ADDRESS_SPACE
// APPEND_ADDRESS_SPACE_INPUTS
// DO_RESERVE_STATIC_CONST

#include "../opencl/cl/secp256k1.h"


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

//******From field_10x26_impl.h******

void APPEND_ADDRESS_SPACE(secp256k1_fe_add)(secp256k1_fe *r, ADDRESS_SPACE_CONTEXT const secp256k1_fe *a) {
#ifdef VERIFY
    secp256k1_fe_verify(a);
#endif
    r->n[0] += a->n[0];
    r->n[1] += a->n[1];
    r->n[2] += a->n[2];
    r->n[3] += a->n[3];
    r->n[4] += a->n[4];
    r->n[5] += a->n[5];
    r->n[6] += a->n[6];
    r->n[7] += a->n[7];
    r->n[8] += a->n[8];
    r->n[9] += a->n[9];
#ifdef VERIFY
    r->magnitude += a->magnitude;
    r->normalized = 0;
    secp256k1_fe_verify(r);
#endif
}


int APPEND_ADDRESS_SPACE(secp256k1_fe_cmp_var)(const secp256k1_fe *a, ADDRESS_SPACE_CONTEXT const secp256k1_fe *b) {
    int i;
#ifdef VERIFY
    VERIFY_CHECK(a->normalized);
    VERIFY_CHECK(b->normalized);
    secp256k1_fe_verify(a);
    secp256k1_fe_verify(b);
#endif
    for (i = 9; i >= 0; i--) {
        if (a->n[i] > b->n[i]) {
            return 1;
        }
        if (a->n[i] < b->n[i]) {
            return -1;
        }
    }
    return 0;
}

static void APPEND_ADDRESS_SPACE(secp256k1_fe_mul_inner)(uint32_t *r, const uint32_t *a, ADDRESS_SPACE_CONTEXT const uint32_t * b) {
    uint64_t c, d;
    uint64_t u0, u1, u2, u3, u4, u5, u6, u7, u8;
    uint32_t t9, t1, t0, t2, t3, t4, t5, t6, t7;
    const uint32_t M = 0x3FFFFFFUL, R0 = 0x3D10UL, R1 = 0x400UL;

    VERIFY_BITS(a[0], 30);
    VERIFY_BITS(a[1], 30);
    VERIFY_BITS(a[2], 30);
    VERIFY_BITS(a[3], 30);
    VERIFY_BITS(a[4], 30);
    VERIFY_BITS(a[5], 30);
    VERIFY_BITS(a[6], 30);
    VERIFY_BITS(a[7], 30);
    VERIFY_BITS(a[8], 30);
    VERIFY_BITS(a[9], 26);
    VERIFY_BITS(b[0], 30);
    VERIFY_BITS(b[1], 30);
    VERIFY_BITS(b[2], 30);
    VERIFY_BITS(b[3], 30);
    VERIFY_BITS(b[4], 30);
    VERIFY_BITS(b[5], 30);
    VERIFY_BITS(b[6], 30);
    VERIFY_BITS(b[7], 30);
    VERIFY_BITS(b[8], 30);
    VERIFY_BITS(b[9], 26);

    /** [... a b c] is a shorthand for ... + a<<52 + b<<26 + c<<0 mod n.
     *  px is a shorthand for sum(a[i]*b[x-i], i=0..x).
     *  Note that [x 0 0 0 0 0 0 0 0 0 0] = [x*R1 x*R0].
     */

    d  = (uint64_t)a[0] * b[9]
       + (uint64_t)a[1] * b[8]
       + (uint64_t)a[2] * b[7]
       + (uint64_t)a[3] * b[6]
       + (uint64_t)a[4] * b[5]
       + (uint64_t)a[5] * b[4]
       + (uint64_t)a[6] * b[3]
       + (uint64_t)a[7] * b[2]
       + (uint64_t)a[8] * b[1]
       + (uint64_t)a[9] * b[0];
    /* VERIFY_BITS(d, 64); */
    /* [d 0 0 0 0 0 0 0 0 0] = [p9 0 0 0 0 0 0 0 0 0] */
    t9 = d & M; d >>= 26;
    VERIFY_BITS(t9, 26);
    VERIFY_BITS(d, 38);
    /* [d t9 0 0 0 0 0 0 0 0 0] = [p9 0 0 0 0 0 0 0 0 0] */

    c  = (uint64_t)a[0] * b[0];
    VERIFY_BITS(c, 60);
    /* [d t9 0 0 0 0 0 0 0 0 c] = [p9 0 0 0 0 0 0 0 0 p0] */
    d += (uint64_t)a[1] * b[9]
       + (uint64_t)a[2] * b[8]
       + (uint64_t)a[3] * b[7]
       + (uint64_t)a[4] * b[6]
       + (uint64_t)a[5] * b[5]
       + (uint64_t)a[6] * b[4]
       + (uint64_t)a[7] * b[3]
       + (uint64_t)a[8] * b[2]
       + (uint64_t)a[9] * b[1];
    VERIFY_BITS(d, 63);
    /* [d t9 0 0 0 0 0 0 0 0 c] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
    u0 = d & M; d >>= 26; c += u0 * R0;
    VERIFY_BITS(u0, 26);
    VERIFY_BITS(d, 37);
    VERIFY_BITS(c, 61);
    /* [d u0 t9 0 0 0 0 0 0 0 0 c-u0*R0] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
    t0 = c & M; c >>= 26; c += u0 * R1;
    VERIFY_BITS(t0, 26);
    VERIFY_BITS(c, 37);
    /* [d u0 t9 0 0 0 0 0 0 0 c-u0*R1 t0-u0*R0] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
    /* [d 0 t9 0 0 0 0 0 0 0 c t0] = [p10 p9 0 0 0 0 0 0 0 0 p0] */

    c += (uint64_t)a[0] * b[1]
       + (uint64_t)a[1] * b[0];
    VERIFY_BITS(c, 62);
    /* [d 0 t9 0 0 0 0 0 0 0 c t0] = [p10 p9 0 0 0 0 0 0 0 p1 p0] */
    d += (uint64_t)a[2] * b[9]
       + (uint64_t)a[3] * b[8]
       + (uint64_t)a[4] * b[7]
       + (uint64_t)a[5] * b[6]
       + (uint64_t)a[6] * b[5]
       + (uint64_t)a[7] * b[4]
       + (uint64_t)a[8] * b[3]
       + (uint64_t)a[9] * b[2];
    VERIFY_BITS(d, 63);
    /* [d 0 t9 0 0 0 0 0 0 0 c t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */
    u1 = d & M; d >>= 26; c += u1 * R0;
    VERIFY_BITS(u1, 26);
    VERIFY_BITS(d, 37);
    VERIFY_BITS(c, 63);
    /* [d u1 0 t9 0 0 0 0 0 0 0 c-u1*R0 t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */
    t1 = c & M; c >>= 26; c += u1 * R1;
    VERIFY_BITS(t1, 26);
    VERIFY_BITS(c, 38);
    /* [d u1 0 t9 0 0 0 0 0 0 c-u1*R1 t1-u1*R0 t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */
    /* [d 0 0 t9 0 0 0 0 0 0 c t1 t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */

    c += (uint64_t)a[0] * b[2]
       + (uint64_t)a[1] * b[1]
       + (uint64_t)a[2] * b[0];
    VERIFY_BITS(c, 62);
    /* [d 0 0 t9 0 0 0 0 0 0 c t1 t0] = [p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    d += (uint64_t)a[3] * b[9]
       + (uint64_t)a[4] * b[8]
       + (uint64_t)a[5] * b[7]
       + (uint64_t)a[6] * b[6]
       + (uint64_t)a[7] * b[5]
       + (uint64_t)a[8] * b[4]
       + (uint64_t)a[9] * b[3];
    VERIFY_BITS(d, 63);
    /* [d 0 0 t9 0 0 0 0 0 0 c t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    u2 = d & M; d >>= 26; c += u2 * R0;
    VERIFY_BITS(u2, 26);
    VERIFY_BITS(d, 37);
    VERIFY_BITS(c, 63);
    /* [d u2 0 0 t9 0 0 0 0 0 0 c-u2*R0 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    t2 = c & M; c >>= 26; c += u2 * R1;
    VERIFY_BITS(t2, 26);
    VERIFY_BITS(c, 38);
    /* [d u2 0 0 t9 0 0 0 0 0 c-u2*R1 t2-u2*R0 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    /* [d 0 0 0 t9 0 0 0 0 0 c t2 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */

    c += (uint64_t)a[0] * b[3]
       + (uint64_t)a[1] * b[2]
       + (uint64_t)a[2] * b[1]
       + (uint64_t)a[3] * b[0];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 t9 0 0 0 0 0 c t2 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    d += (uint64_t)a[4] * b[9]
       + (uint64_t)a[5] * b[8]
       + (uint64_t)a[6] * b[7]
       + (uint64_t)a[7] * b[6]
       + (uint64_t)a[8] * b[5]
       + (uint64_t)a[9] * b[4];
    VERIFY_BITS(d, 63);
    /* [d 0 0 0 t9 0 0 0 0 0 c t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    u3 = d & M; d >>= 26; c += u3 * R0;
    VERIFY_BITS(u3, 26);
    VERIFY_BITS(d, 37);
    /* VERIFY_BITS(c, 64); */
    /* [d u3 0 0 0 t9 0 0 0 0 0 c-u3*R0 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    t3 = c & M; c >>= 26; c += u3 * R1;
    VERIFY_BITS(t3, 26);
    VERIFY_BITS(c, 39);
    /* [d u3 0 0 0 t9 0 0 0 0 c-u3*R1 t3-u3*R0 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    /* [d 0 0 0 0 t9 0 0 0 0 c t3 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */

    c += (uint64_t)a[0] * b[4]
       + (uint64_t)a[1] * b[3]
       + (uint64_t)a[2] * b[2]
       + (uint64_t)a[3] * b[1]
       + (uint64_t)a[4] * b[0];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 0 t9 0 0 0 0 c t3 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    d += (uint64_t)a[5] * b[9]
       + (uint64_t)a[6] * b[8]
       + (uint64_t)a[7] * b[7]
       + (uint64_t)a[8] * b[6]
       + (uint64_t)a[9] * b[5];
    VERIFY_BITS(d, 62);
    /* [d 0 0 0 0 t9 0 0 0 0 c t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    u4 = d & M; d >>= 26; c += u4 * R0;
    VERIFY_BITS(u4, 26);
    VERIFY_BITS(d, 36);
    /* VERIFY_BITS(c, 64); */
    /* [d u4 0 0 0 0 t9 0 0 0 0 c-u4*R0 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    t4 = c & M; c >>= 26; c += u4 * R1;
    VERIFY_BITS(t4, 26);
    VERIFY_BITS(c, 39);
    /* [d u4 0 0 0 0 t9 0 0 0 c-u4*R1 t4-u4*R0 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 t9 0 0 0 c t4 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */

    c += (uint64_t)a[0] * b[5]
       + (uint64_t)a[1] * b[4]
       + (uint64_t)a[2] * b[3]
       + (uint64_t)a[3] * b[2]
       + (uint64_t)a[4] * b[1]
       + (uint64_t)a[5] * b[0];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 0 0 t9 0 0 0 c t4 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)a[6] * b[9]
       + (uint64_t)a[7] * b[8]
       + (uint64_t)a[8] * b[7]
       + (uint64_t)a[9] * b[6];
    VERIFY_BITS(d, 62);
    /* [d 0 0 0 0 0 t9 0 0 0 c t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    u5 = d & M; d >>= 26; c += u5 * R0;
    VERIFY_BITS(u5, 26);
    VERIFY_BITS(d, 36);
    /* VERIFY_BITS(c, 64); */
    /* [d u5 0 0 0 0 0 t9 0 0 0 c-u5*R0 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    t5 = c & M; c >>= 26; c += u5 * R1;
    VERIFY_BITS(t5, 26);
    VERIFY_BITS(c, 39);
    /* [d u5 0 0 0 0 0 t9 0 0 c-u5*R1 t5-u5*R0 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 t9 0 0 c t5 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */

    c += (uint64_t)a[0] * b[6]
       + (uint64_t)a[1] * b[5]
       + (uint64_t)a[2] * b[4]
       + (uint64_t)a[3] * b[3]
       + (uint64_t)a[4] * b[2]
       + (uint64_t)a[5] * b[1]
       + (uint64_t)a[6] * b[0];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 0 0 0 t9 0 0 c t5 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)a[7] * b[9]
       + (uint64_t)a[8] * b[8]
       + (uint64_t)a[9] * b[7];
    VERIFY_BITS(d, 61);
    /* [d 0 0 0 0 0 0 t9 0 0 c t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    u6 = d & M; d >>= 26; c += u6 * R0;
    VERIFY_BITS(u6, 26);
    VERIFY_BITS(d, 35);
    /* VERIFY_BITS(c, 64); */
    /* [d u6 0 0 0 0 0 0 t9 0 0 c-u6*R0 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    t6 = c & M; c >>= 26; c += u6 * R1;
    VERIFY_BITS(t6, 26);
    VERIFY_BITS(c, 39);
    /* [d u6 0 0 0 0 0 0 t9 0 c-u6*R1 t6-u6*R0 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 t9 0 c t6 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */

    c += (uint64_t)a[0] * b[7]
       + (uint64_t)a[1] * b[6]
       + (uint64_t)a[2] * b[5]
       + (uint64_t)a[3] * b[4]
       + (uint64_t)a[4] * b[3]
       + (uint64_t)a[5] * b[2]
       + (uint64_t)a[6] * b[1]
       + (uint64_t)a[7] * b[0];
    /* VERIFY_BITS(c, 64); */
    VERIFY_CHECK(c <= 0x8000007C00000007ULL);
    /* [d 0 0 0 0 0 0 0 t9 0 c t6 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)a[8] * b[9]
       + (uint64_t)a[9] * b[8];
    VERIFY_BITS(d, 58);
    /* [d 0 0 0 0 0 0 0 t9 0 c t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    u7 = d & M; d >>= 26; c += u7 * R0;
    VERIFY_BITS(u7, 26);
    VERIFY_BITS(d, 32);
    /* VERIFY_BITS(c, 64); */
    VERIFY_CHECK(c <= 0x800001703FFFC2F7ULL);
    /* [d u7 0 0 0 0 0 0 0 t9 0 c-u7*R0 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    t7 = c & M; c >>= 26; c += u7 * R1;
    VERIFY_BITS(t7, 26);
    VERIFY_BITS(c, 38);
    /* [d u7 0 0 0 0 0 0 0 t9 c-u7*R1 t7-u7*R0 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 0 t9 c t7 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */

    c += (uint64_t)a[0] * b[8]
       + (uint64_t)a[1] * b[7]
       + (uint64_t)a[2] * b[6]
       + (uint64_t)a[3] * b[5]
       + (uint64_t)a[4] * b[4]
       + (uint64_t)a[5] * b[3]
       + (uint64_t)a[6] * b[2]
       + (uint64_t)a[7] * b[1]
       + (uint64_t)a[8] * b[0];
    /* VERIFY_BITS(c, 64); */
    VERIFY_CHECK(c <= 0x9000007B80000008ULL);
    /* [d 0 0 0 0 0 0 0 0 t9 c t7 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)a[9] * b[9];
    VERIFY_BITS(d, 57);
    /* [d 0 0 0 0 0 0 0 0 t9 c t7 t6 t5 t4 t3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    u8 = d & M; d >>= 26; c += u8 * R0;
    VERIFY_BITS(u8, 26);
    VERIFY_BITS(d, 31);
    /* VERIFY_BITS(c, 64); */
    VERIFY_CHECK(c <= 0x9000016FBFFFC2F8ULL);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 t5 t4 t3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    r[3] = t3;
    VERIFY_BITS(r[3], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 t5 t4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[4] = t4;
    VERIFY_BITS(r[4], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 t5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[5] = t5;
    VERIFY_BITS(r[5], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[6] = t6;
    VERIFY_BITS(r[6], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[7] = t7;
    VERIFY_BITS(r[7], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    r[8] = c & M; c >>= 26; c += u8 * R1;
    VERIFY_BITS(r[8], 26);
    VERIFY_BITS(c, 39);
    /* [d u8 0 0 0 0 0 0 0 0 t9+c-u8*R1 r8-u8*R0 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 0 0 t9+c r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    c   += d * R0 + t9;
    VERIFY_BITS(c, 45);
    /* [d 0 0 0 0 0 0 0 0 0 c-d*R0 r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[9] = c & (M >> 4); c >>= 22; c += d * (R1 << 4);
    VERIFY_BITS(r[9], 22);
    VERIFY_BITS(c, 46);
    /* [d 0 0 0 0 0 0 0 0 r9+((c-d*R1<<4)<<22)-d*R0 r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 -d*R1 r9+(c<<22)-d*R0 r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    d    = c * (R0 >> 4) + t0;
    VERIFY_BITS(d, 56);
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 t1 d-c*R0>>4] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[0] = d & M; d >>= 26;
    VERIFY_BITS(r[0], 26);
    VERIFY_BITS(d, 30);
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 t1+d r0-c*R0>>4] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    d   += c * (R1 >> 4) + t1;
    VERIFY_BITS(d, 53);
    VERIFY_CHECK(d <= 0x10000003FFFFBFULL);
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 d-c*R1>>4 r0-c*R0>>4] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [r9 r8 r7 r6 r5 r4 r3 t2 d r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[1] = d & M; d >>= 26;
    VERIFY_BITS(r[1], 26);
    VERIFY_BITS(d, 27);
    VERIFY_CHECK(d <= 0x4000000ULL);
    /* [r9 r8 r7 r6 r5 r4 r3 t2+d r1 r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    d   += t2;
    VERIFY_BITS(d, 27);
    /* [r9 r8 r7 r6 r5 r4 r3 d r1 r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[2] = d;
    VERIFY_BITS(r[2], 27);
    /* [r9 r8 r7 r6 r5 r4 r3 r2 r1 r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
}

void APPEND_ADDRESS_SPACE(secp256k1_fe_mul)(secp256k1_fe *r, const secp256k1_fe *a, ADDRESS_SPACE_CONTEXT const secp256k1_fe *b) {
#ifdef VERIFY
    VERIFY_CHECK(a->magnitude <= 8);
    VERIFY_CHECK(b->magnitude <= 8);
    secp256k1_fe_verify(a);
    secp256k1_fe_verify(b);
    VERIFY_CHECK(r != b);
#endif
    APPEND_ADDRESS_SPACE(secp256k1_fe_mul_inner)(r->n, a->n, b->n);
#ifdef VERIFY
    r->magnitude = 1;
    r->normalized = 0;
    secp256k1_fe_verify(r);
#endif
}
//******End of field_10x26_impl.h******


//******From group_impl.h******

void APPEND_ADDRESS_SPACE(secp256k1_gej_add_ge_var)(secp256k1_gej *r, const secp256k1_gej *a, ADDRESS_SPACE_CONTEXT const secp256k1_ge *b, secp256k1_fe *rzr) {
    /* 8 mul, 3 sqr, 4 normalize, 12 mul_int/add/negate */
    secp256k1_fe z12, u1, u2, s1, s2, h, i, i2, h2, h3, t;
    if (a->infinity) {
        VERIFY_CHECK(rzr == NULL);
        APPEND_ADDRESS_SPACE(secp256k1_gej_set_ge)(r, b);
        return;
    }
    if (b->infinity) {
        if (rzr != NULL) {
            secp256k1_fe_set_int(rzr, 1);
        }
        *r = *a;
        return;
    }
    r->infinity = 0;

    secp256k1_fe_sqr(&z12, &a->z);
    u1 = a->x; secp256k1_fe_normalize_weak(&u1);
    //Multiplication order matters due to openCL 1.2's address space restrictions
    APPEND_ADDRESS_SPACE(secp256k1_fe_mul)(&u2, &z12, &b->x);
    s1 = a->y; secp256k1_fe_normalize_weak(&s1);
    //Multiplication order matters due to openCL 1.2's address space restrictions
    APPEND_ADDRESS_SPACE(secp256k1_fe_mul)(&s2, &z12, &b->y); 
    secp256k1_fe_mul(&s2, &s2, &a->z);
    secp256k1_fe_negate(&h, &u1, 1); 
    secp256k1_fe_add(&h, &u2);
    secp256k1_fe_negate(&i, &s1, 1); 
    secp256k1_fe_add(&i, &s2);
    if (secp256k1_fe_normalizes_to_zero_var(&h)) {
        if (secp256k1_fe_normalizes_to_zero_var(&i)) {
            secp256k1_gej_double_var(r, a, rzr);
        } else {
            if (rzr != NULL) {
                secp256k1_fe_set_int(rzr, 0);
            }
            r->infinity = 1;
        }
        return;
    }
    secp256k1_fe_sqr(&i2, &i);
    secp256k1_fe_sqr(&h2, &h);
    secp256k1_fe_mul(&h3, &h, &h2);
    if (rzr != NULL) {
        *rzr = h;
    }
    secp256k1_fe_mul(&r->z, &a->z, &h);
    secp256k1_fe_mul(&t, &u1, &h2);
    r->x = t; secp256k1_fe_mul_int(&r->x, 2); 
    secp256k1_fe_add(&r->x, &h3); 
    secp256k1_fe_negate(&r->x, &r->x, 3); 
    secp256k1_fe_add(&r->x, &i2);
    secp256k1_fe_negate(&r->y, &r->x, 5); 
    secp256k1_fe_add(&r->y, &t); 
    secp256k1_fe_mul(&r->y, &r->y, &i);
    secp256k1_fe_mul(&h3, &h3, &s1); 
    secp256k1_fe_negate(&h3, &h3, 1);
    secp256k1_fe_add(&r->y, &h3);
}
//******end of group_impl.h******


//******From ecmult_gen_impl.h******

#ifdef DO_RESERVE_STATIC_CONST
/** Generator for secp256k1, value 'g' defined in
 *  "Standards for Efficient Cryptography" (SEC2) 2.7.1.
 */
___static__constant secp256k1_ge secp256k1_ge_const_g = SECP256K1_GE_CONST(
    0x79BE667EUL, 0xF9DCBBACUL, 0x55A06295UL, 0xCE870B07UL,
    0x029BFCDBUL, 0x2DCE28D9UL, 0x59F2815BUL, 0x16F81798UL,
    0x483ADA77UL, 0x26A3C465UL, 0x5DA4FBFCUL, 0x0E1108A8UL,
    0xFD17B448UL, 0xA6855419UL, 0x9C47D08FUL, 0xFB10D4B8UL
);
#endif 

void APPEND_ADDRESS_SPACE(secp256k1_ecmult_context_build)(
  secp256k1_ecmult_context *output, 
  const secp256k1_callback *cb
) {
  secp256k1_gej gj;

  if (output->pre_g != NULL) {
    return;
  }

  /* get the generator */
  //openCL note: secp256k1_ge_const_g is always in the __constant address space.
  secp256k1_gej_set_ge__constant(&gj, &secp256k1_ge_const_g);

  output->pre_g = (secp256k1_ge_storage (*)[]) checked_malloc(cb, sizeof((*output->pre_g)[0]) * ECMULT_TABLE_SIZE(WINDOW_G));
  /* precompute the tables with odd multiples */
  secp256k1_ecmult_odd_multiples_table_storage_var(ECMULT_TABLE_SIZE(WINDOW_G), *output->pre_g, &gj, cb);
}

void APPEND_ADDRESS_SPACE(secp256k1_ecmult_gen_context_build)(
  secp256k1_ecmult_gen_context *ctx, 
  const secp256k1_callback* cb
) {
  secp256k1_ge prec[1024];
  secp256k1_gej gj;
  secp256k1_gej nums_gej;
  int i, j;

  if (ctx->prec != NULL) {
    return;
  }
  ctx->prec = (secp256k1_ge_storage (*)[64][16])checked_malloc(cb, sizeof(*ctx->prec));

  /* get the generator */
  //openCL note: secp256k1_ge_const_g is always in the __constant address space.
  secp256k1_gej_set_ge__constant(&gj, &secp256k1_ge_const_g);

  /* Construct a group element with no known corresponding scalar (nothing up my sleeve). */
  {
    //The line below does not compile in openCL 1.2
    //static const unsigned char nums_b32[33] = "The scalar for this x is unknown";
    secp256k1_fe nums_x;
    secp256k1_ge nums_ge;
    
    //The line below does not compile in openCL 1.2
    //VERIFY_CHECK(secp256k1_fe_set_b32(&nums_x, nums_b32));
    VERIFY_CHECK(secp256k1_ge_set_xo_var(&nums_ge, &nums_x, 0));
    secp256k1_gej_set_ge(&nums_gej, &nums_ge);
    /* Add G to make the bits in x uniformly distributed. */
    secp256k1_gej_add_ge_var__constant__constant__global(&nums_gej, &nums_gej, &secp256k1_ge_const_g, NULL);
  }

  /* compute prec. */
  {
    secp256k1_gej precj[1024]; /* Jacobian versions of prec. */
    secp256k1_gej gbase;
    secp256k1_gej numsbase;
    gbase = gj; /* 16^j * G */
    numsbase = nums_gej; /* 2^j * nums. */
    for (j = 0; j < 64; j++) {
      /* Set precj[j*16 .. j*16+15] to (numsbase, numsbase + gbase, ..., numsbase + 15*gbase). */
      precj[j*16] = numsbase;
      for (i = 1; i < 16; i++) {
        secp256k1_gej_add_var(&precj[j*16 + i], &precj[j*16 + i - 1], &gbase, NULL);
      }
      /* Multiply gbase by 16. */
      for (i = 0; i < 4; i++) {
        secp256k1_gej_double_var(&gbase, &gbase, NULL);
      }
      /* Multiply numbase by 2. */
      secp256k1_gej_double_var(&numsbase, &numsbase, NULL);
      if (j == 62) {
        /* In the last iteration, numsbase is (1 - 2^j) * nums instead. */
        secp256k1_gej_neg(&numsbase, &numsbase);
        secp256k1_gej_add_var(&numsbase, &numsbase, &nums_gej, NULL);
      }
    }
    secp256k1_ge_set_all_gej_var(1024, prec, precj, cb);
  }
  for (j = 0; j < 64; j++) {
    for (i = 0; i < 16; i++) {
      secp256k1_ge_to_storage(&(*ctx->prec)[j][i], &prec[j*16 + i]);
    }
  }
  secp256k1_ecmult_gen_blind(ctx, NULL);
}
//******end of ecmult_gen_impl.h******


//******From ecmult_impl.h******

void APPEND_ADDRESS_SPACE(secp256k1_ecmult)(ADDRESS_SPACE_CONTEXT const secp256k1_ecmult_context *ctx, secp256k1_gej *r, const secp256k1_gej *a, const secp256k1_scalar *na, const secp256k1_scalar *ng) {
    secp256k1_ge pre_a[ECMULT_TABLE_SIZE(WINDOW_A)];
    secp256k1_ge tmpa;
    secp256k1_fe Z;
    int wnaf_na[256];
    int bits_na;
    int wnaf_ng[256];
    int bits_ng;
    int i;
    int bits;

    /* build wnaf representation for na. */
    bits_na     = secp256k1_ecmult_wnaf(wnaf_na,     256, na,      WINDOW_A);
    bits = bits_na;

    /* Calculate odd multiples of a.
     * All multiples are brought to the same Z 'denominator', which is stored
     * in Z. Due to secp256k1' isomorphism we can do all operations pretending
     * that the Z coordinate was 1, use affine addition formulae, and correct
     * the Z coordinate of the result once at the end.
     * The exception is the precomputed G table points, which are actually
     * affine. Compared to the base used for other points, they have a Z ratio
     * of 1/Z, so we can use secp256k1_gej_add_zinv_var, which uses the same
     * isomorphism to efficiently add with a known Z inverse.
     */
    secp256k1_ecmult_odd_multiples_table_globalz_windowa(pre_a, &Z, a);

#ifdef USE_ENDOMORPHISM
    for (i = 0; i < ECMULT_TABLE_SIZE(WINDOW_A); i++) {
        secp256k1_ge_mul_lambda(&pre_a_lam[i], &pre_a[i]);
    }

    /* split ng into ng_1 and ng_128 (where gn = gn_1 + gn_128*2^128, and gn_1 and gn_128 are ~128 bit) */
    secp256k1_scalar_split_128(&ng_1, &ng_128, ng);

    /* Build wnaf representation for ng_1 and ng_128 */
    bits_ng_1   = secp256k1_ecmult_wnaf(wnaf_ng_1,   129, &ng_1,   WINDOW_G);
    bits_ng_128 = secp256k1_ecmult_wnaf(wnaf_ng_128, 129, &ng_128, WINDOW_G);
    if (bits_ng_1 > bits) {
        bits = bits_ng_1;
    }
    if (bits_ng_128 > bits) {
        bits = bits_ng_128;
    }
#else
    bits_ng     = secp256k1_ecmult_wnaf(wnaf_ng,     256, ng,      WINDOW_G);
    if (bits_ng > bits) {
        bits = bits_ng;
    }
#endif

    secp256k1_gej_set_infinity(r);

    for (i = bits - 1; i >= 0; i--) {
        int n;
        secp256k1_gej_double_var(r, r, NULL);
#ifdef USE_ENDOMORPHISM
        if (i < bits_na_1 && (n = wnaf_na_1[i])) {
            ECMULT_TABLE_GET_GE(&tmpa, pre_a, n, WINDOW_A);
            secp256k1_gej_add_ge_var(r, r, &tmpa, NULL);
        }
        if (i < bits_na_lam && (n = wnaf_na_lam[i])) {
            ECMULT_TABLE_GET_GE(&tmpa, pre_a_lam, n, WINDOW_A);
            secp256k1_gej_add_ge_var(r, r, &tmpa, NULL);
        }
        if (i < bits_ng_1 && (n = wnaf_ng_1[i])) {
            ECMULT_TABLE_GET_GE_STORAGE(&tmpa, *ctx->pre_g, n, WINDOW_G);
            secp256k1_gej_add_zinv_var(r, r, &tmpa, &Z);
        }
        if (i < bits_ng_128 && (n = wnaf_ng_128[i])) {
            ECMULT_TABLE_GET_GE_STORAGE(&tmpa, *ctx->pre_g_128, n, WINDOW_G);
            secp256k1_gej_add_zinv_var(r, r, &tmpa, &Z);
        }
#else
        if (i < bits_na && (n = wnaf_na[i])) {
            ECMULT_TABLE_GET_GE(&tmpa, pre_a, n, WINDOW_A);
            secp256k1_gej_add_ge_var(r, r, &tmpa, NULL);
        }
        if (i < bits_ng && (n = wnaf_ng[i])) {
            ECMULT_TABLE_GET_GE_STORAGE(&tmpa, *ctx->pre_g, n, WINDOW_G);
            secp256k1_gej_add_zinv_var(r, r, &tmpa, &Z);
        }
#endif
    }

    if (!r->infinity) {
        secp256k1_fe_mul(&r->z, &r->z, &Z);
    }
}

//******end of ecmult_impl.h******


//******From ecmult_gen_impl.h******

/* Setup blinding values for secp256k1_ecmult_gen. */
void APPEND_ADDRESS_SPACE(secp256k1_ecmult_gen_blind)(secp256k1_ecmult_gen_context *ctx, const unsigned char *seed32) {
    secp256k1_scalar b;
    secp256k1_gej gb;
    secp256k1_fe s;
    unsigned char nonce32[32];
    secp256k1_rfc6979_hmac_sha256_t rng;
    int retry;
    unsigned char keydata[64] = {0};
    if (seed32 == NULL) {
        /* When seed is NULL, reset the initial point and blinding value. */
        //Note: secp256k1_ge_const_g is in the __constant address space
        secp256k1_gej_set_ge__constant(&ctx->initial, &secp256k1_ge_const_g);
        secp256k1_gej_neg(&ctx->initial, &ctx->initial);
        secp256k1_scalar_set_int(&ctx->blind, 1);
    }
    /* The prior blinding value (if not reset) is chained forward by including it in the hash. */
    secp256k1_scalar_get_b32(nonce32, &ctx->blind);
    /** Using a CSPRNG allows a failure free interface, avoids needing large amounts of random data,
     *   and guards against weak or adversarial seeds.  This is a simpler and safer interface than
     *   asking the caller for blinding values directly and expecting them to retry on failure.
     */
    memoryCopy(keydata, nonce32, 32);
    if (seed32 != NULL) {
      memoryCopy(keydata + 32, seed32, 32);
    }
    secp256k1_rfc6979_hmac_sha256_initialize(&rng, keydata, seed32 ? 64 : 32);
    memorySet(keydata, 0, sizeof(keydata));
    /* Retry for out of range results to achieve uniformity. */
    do {
        secp256k1_rfc6979_hmac_sha256_generate(&rng, nonce32, 32);
        retry = !secp256k1_fe_set_b32(&s, nonce32);
        retry |= secp256k1_fe_is_zero(&s);
    } while (retry);
    /* Randomize the projection to defend against multiplier sidechannels. */
    secp256k1_gej_rescale(&ctx->initial, &s);
    secp256k1_fe_clear(&s);
    do {
        secp256k1_rfc6979_hmac_sha256_generate(&rng, nonce32, 32);
        secp256k1_scalar_set_b32(&b, nonce32, &retry);
        /* A blinding value of 0 works, but would undermine the projection hardening. */
        retry |= secp256k1_scalar_is_zero(&b);
    } while (retry);
    secp256k1_rfc6979_hmac_sha256_finalize(&rng);
    memorySet(nonce32, 0, 32);
    secp256k1_ecmult_gen(ctx, &gb, &b);
    secp256k1_scalar_negate(&b, &b);
    ctx->blind = b;
    ctx->initial = gb;
    secp256k1_scalar_clear(&b);
    secp256k1_gej_clear(&gb);
}
//******end of ecmult_gen_impl.h******


//******From scalar_8x32_impl.h******
static void APPEND_ADDRESS_SPACE(secp256k1_scalar_get_b32)(unsigned char *bin, ADDRESS_SPACE_INPUTS const secp256k1_scalar* a) {
    bin[0] = a->d[7] >> 24; bin[1] = a->d[7] >> 16; bin[2] = a->d[7] >> 8; bin[3] = a->d[7];
    bin[4] = a->d[6] >> 24; bin[5] = a->d[6] >> 16; bin[6] = a->d[6] >> 8; bin[7] = a->d[6];
    bin[8] = a->d[5] >> 24; bin[9] = a->d[5] >> 16; bin[10] = a->d[5] >> 8; bin[11] = a->d[5];
    bin[12] = a->d[4] >> 24; bin[13] = a->d[4] >> 16; bin[14] = a->d[4] >> 8; bin[15] = a->d[4];
    bin[16] = a->d[3] >> 24; bin[17] = a->d[3] >> 16; bin[18] = a->d[3] >> 8; bin[19] = a->d[3];
    bin[20] = a->d[2] >> 24; bin[21] = a->d[2] >> 16; bin[22] = a->d[2] >> 8; bin[23] = a->d[2];
    bin[24] = a->d[1] >> 24; bin[25] = a->d[1] >> 16; bin[26] = a->d[1] >> 8; bin[27] = a->d[1];
    bin[28] = a->d[0] >> 24; bin[29] = a->d[0] >> 16; bin[30] = a->d[0] >> 8; bin[31] = a->d[0];
}

int APPEND_ADDRESS_SPACE(secp256k1_scalar_is_zero)(ADDRESS_SPACE_INPUTS const secp256k1_scalar *a) {
    return (a->d[0] | a->d[1] | a->d[2] | a->d[3] | a->d[4] | a->d[5] | a->d[6] | a->d[7]) == 0;
}

void APPEND_ADDRESS_SPACE(secp256k1_scalar_mul_512)(
  uint32_t *l, 
  const secp256k1_scalar *a, 
  ADDRESS_SPACE_INPUTS const secp256k1_scalar *b
) {
    /* 96 bit accumulator. */
    uint32_t c0 = 0, c1 = 0, c2 = 0;

    /* l[0..15] = a[0..7] * b[0..7]. */
    muladd_fast(a->d[0], b->d[0]);
    extract_fast(l[0]);
    muladd(a->d[0], b->d[1]);
    muladd(a->d[1], b->d[0]);
    extract(l[1]);
    muladd(a->d[0], b->d[2]);
    muladd(a->d[1], b->d[1]);
    muladd(a->d[2], b->d[0]);
    extract(l[2]);
    muladd(a->d[0], b->d[3]);
    muladd(a->d[1], b->d[2]);
    muladd(a->d[2], b->d[1]);
    muladd(a->d[3], b->d[0]);
    extract(l[3]);
    muladd(a->d[0], b->d[4]);
    muladd(a->d[1], b->d[3]);
    muladd(a->d[2], b->d[2]);
    muladd(a->d[3], b->d[1]);
    muladd(a->d[4], b->d[0]);
    extract(l[4]);
    muladd(a->d[0], b->d[5]);
    muladd(a->d[1], b->d[4]);
    muladd(a->d[2], b->d[3]);
    muladd(a->d[3], b->d[2]);
    muladd(a->d[4], b->d[1]);
    muladd(a->d[5], b->d[0]);
    extract(l[5]);
    muladd(a->d[0], b->d[6]);
    muladd(a->d[1], b->d[5]);
    muladd(a->d[2], b->d[4]);
    muladd(a->d[3], b->d[3]);
    muladd(a->d[4], b->d[2]);
    muladd(a->d[5], b->d[1]);
    muladd(a->d[6], b->d[0]);
    extract(l[6]);
    muladd(a->d[0], b->d[7]);
    muladd(a->d[1], b->d[6]);
    muladd(a->d[2], b->d[5]);
    muladd(a->d[3], b->d[4]);
    muladd(a->d[4], b->d[3]);
    muladd(a->d[5], b->d[2]);
    muladd(a->d[6], b->d[1]);
    muladd(a->d[7], b->d[0]);
    extract(l[7]);
    muladd(a->d[1], b->d[7]);
    muladd(a->d[2], b->d[6]);
    muladd(a->d[3], b->d[5]);
    muladd(a->d[4], b->d[4]);
    muladd(a->d[5], b->d[3]);
    muladd(a->d[6], b->d[2]);
    muladd(a->d[7], b->d[1]);
    extract(l[8]);
    muladd(a->d[2], b->d[7]);
    muladd(a->d[3], b->d[6]);
    muladd(a->d[4], b->d[5]);
    muladd(a->d[5], b->d[4]);
    muladd(a->d[6], b->d[3]);
    muladd(a->d[7], b->d[2]);
    extract(l[9]);
    muladd(a->d[3], b->d[7]);
    muladd(a->d[4], b->d[6]);
    muladd(a->d[5], b->d[5]);
    muladd(a->d[6], b->d[4]);
    muladd(a->d[7], b->d[3]);
    extract(l[10]);
    muladd(a->d[4], b->d[7]);
    muladd(a->d[5], b->d[6]);
    muladd(a->d[6], b->d[5]);
    muladd(a->d[7], b->d[4]);
    extract(l[11]);
    muladd(a->d[5], b->d[7]);
    muladd(a->d[6], b->d[6]);
    muladd(a->d[7], b->d[5]);
    extract(l[12]);
    muladd(a->d[6], b->d[7]);
    muladd(a->d[7], b->d[6]);
    extract(l[13]);
    muladd_fast(a->d[7], b->d[7]);
    extract_fast(l[14]);
    VERIFY_CHECK(c1 == 0);
    l[15] = c0;
}

static void APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(
  secp256k1_scalar *r, 
  const secp256k1_scalar *a, 
  ADDRESS_SPACE_INPUTS const secp256k1_scalar *b
) {
    uint32_t l[16];
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul_512)(l, a, b);
    secp256k1_scalar_reduce_512(r, l);
}

static void APPEND_ADDRESS_SPACE(secp256k1_scalar_sqr_512)(uint32_t *l, ADDRESS_SPACE_INPUTS const secp256k1_scalar *a) {
    /* 96 bit accumulator. */
    uint32_t c0 = 0, c1 = 0, c2 = 0;

    /* l[0..15] = a[0..7]^2. */
    muladd_fast(a->d[0], a->d[0]);
    extract_fast(l[0]);
    muladd2(a->d[0], a->d[1]);
    extract(l[1]);
    muladd2(a->d[0], a->d[2]);
    muladd(a->d[1], a->d[1]);
    extract(l[2]);
    muladd2(a->d[0], a->d[3]);
    muladd2(a->d[1], a->d[2]);
    extract(l[3]);
    muladd2(a->d[0], a->d[4]);
    muladd2(a->d[1], a->d[3]);
    muladd(a->d[2], a->d[2]);
    extract(l[4]);
    muladd2(a->d[0], a->d[5]);
    muladd2(a->d[1], a->d[4]);
    muladd2(a->d[2], a->d[3]);
    extract(l[5]);
    muladd2(a->d[0], a->d[6]);
    muladd2(a->d[1], a->d[5]);
    muladd2(a->d[2], a->d[4]);
    muladd(a->d[3], a->d[3]);
    extract(l[6]);
    muladd2(a->d[0], a->d[7]);
    muladd2(a->d[1], a->d[6]);
    muladd2(a->d[2], a->d[5]);
    muladd2(a->d[3], a->d[4]);
    extract(l[7]);
    muladd2(a->d[1], a->d[7]);
    muladd2(a->d[2], a->d[6]);
    muladd2(a->d[3], a->d[5]);
    muladd(a->d[4], a->d[4]);
    extract(l[8]);
    muladd2(a->d[2], a->d[7]);
    muladd2(a->d[3], a->d[6]);
    muladd2(a->d[4], a->d[5]);
    extract(l[9]);
    muladd2(a->d[3], a->d[7]);
    muladd2(a->d[4], a->d[6]);
    muladd(a->d[5], a->d[5]);
    extract(l[10]);
    muladd2(a->d[4], a->d[7]);
    muladd2(a->d[5], a->d[6]);
    extract(l[11]);
    muladd2(a->d[5], a->d[7]);
    muladd(a->d[6], a->d[6]);
    extract(l[12]);
    muladd2(a->d[6], a->d[7]);
    extract(l[13]);
    muladd_fast(a->d[7], a->d[7]);
    extract_fast(l[14]);
    VERIFY_CHECK(c1 == 0);
    l[15] = c0;
}

static void APPEND_ADDRESS_SPACE(secp256k1_scalar_sqr)(secp256k1_scalar *r, ADDRESS_SPACE_INPUTS const secp256k1_scalar *a) {
    uint32_t l[16];
    APPEND_ADDRESS_SPACE(secp256k1_scalar_sqr_512)(l, a);
    secp256k1_scalar_reduce_512(r, l);
}
//******end of scalar_8x32_impl.h******


//******From scalar_impl.h******

void APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse)(secp256k1_scalar *r, ADDRESS_SPACE_INPUTS const secp256k1_scalar *x) {
    secp256k1_scalar *t;
    int i;
    /* First compute x ^ (2^N - 1) for some values of N. */
    secp256k1_scalar x2, x3, x4, x6, x7, x8, x15, x30, x60, x120, x127;

    APPEND_ADDRESS_SPACE(secp256k1_scalar_sqr)(&x2,  x);
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(&x2, &x2,  x);

    secp256k1_scalar_sqr(&x3, &x2);
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(&x3, &x3,  x);

    secp256k1_scalar_sqr(&x4, &x3);
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(&x4, &x4,  x);

    secp256k1_scalar_sqr(&x6, &x4);
    secp256k1_scalar_sqr(&x6, &x6);
    secp256k1_scalar_mul(&x6, &x6, &x2);

    secp256k1_scalar_sqr(&x7, &x6);
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(&x7, &x7,  x);

    secp256k1_scalar_sqr(&x8, &x7);
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(&x8, &x8,  x);

    secp256k1_scalar_sqr(&x15, &x8);
    for (i = 0; i < 6; i++) {
        secp256k1_scalar_sqr(&x15, &x15);
    }
    secp256k1_scalar_mul(&x15, &x15, &x7);

    secp256k1_scalar_sqr(&x30, &x15);
    for (i = 0; i < 14; i++) {
        secp256k1_scalar_sqr(&x30, &x30);
    }
    secp256k1_scalar_mul(&x30, &x30, &x15);

    secp256k1_scalar_sqr(&x60, &x30);
    for (i = 0; i < 29; i++) {
        secp256k1_scalar_sqr(&x60, &x60);
    }
    secp256k1_scalar_mul(&x60, &x60, &x30);

    secp256k1_scalar_sqr(&x120, &x60);
    for (i = 0; i < 59; i++) {
        secp256k1_scalar_sqr(&x120, &x120);
    }
    secp256k1_scalar_mul(&x120, &x120, &x60);

    secp256k1_scalar_sqr(&x127, &x120);
    for (i = 0; i < 6; i++) {
        secp256k1_scalar_sqr(&x127, &x127);
    }
    secp256k1_scalar_mul(&x127, &x127, &x7);

    /* Then accumulate the final result (t starts at x127). */
    t = &x127;
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 4; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x3); /* 111 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 4; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x3); /* 111 */
    for (i = 0; i < 3; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x2); /* 11 */
    for (i = 0; i < 4; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x3); /* 111 */
    for (i = 0; i < 5; i++) { /* 00 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x3); /* 111 */
    for (i = 0; i < 4; i++) { /* 00 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x2); /* 11 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 5; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x4); /* 1111 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 3; i++) { /* 00 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 4; i++) { /* 000 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 10; i++) { /* 0000000 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x3); /* 111 */
    for (i = 0; i < 4; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x3); /* 111 */
    for (i = 0; i < 9; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x8); /* 11111111 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 3; i++) { /* 00 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 3; i++) { /* 00 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 5; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x4); /* 1111 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 5; i++) { /* 000 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x2); /* 11 */
    for (i = 0; i < 4; i++) { /* 00 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x2); /* 11 */
    for (i = 0; i < 2; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 8; i++) { /* 000000 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x2); /* 11 */
    for (i = 0; i < 3; i++) { /* 0 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(t, t, &x2); /* 11 */
    for (i = 0; i < 3; i++) { /* 00 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 6; i++) { /* 00000 */
        secp256k1_scalar_sqr(t, t);
    }
    APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(t, t, x); /* 1 */
    for (i = 0; i < 8; i++) { /* 00 */
        secp256k1_scalar_sqr(t, t);
    }
    secp256k1_scalar_mul(r, t, &x6); /* 111111 */
}

void APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse_var)(secp256k1_scalar *r, ADDRESS_SPACE_INPUTS const secp256k1_scalar *x) {
  APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse)(r, x);
}
//******end of scalar_impl.h******


//******From ecdsa_impl.h******

#ifdef DO_RESERVE_STATIC_CONST
/** Group order for secp256k1 defined as 'n' in "Standards for Efficient Cryptography" (SEC2) 2.7.1
 *  sage: for t in xrange(1023, -1, -1):
 *     ..   p = 2**256 - 2**32 - t
 *     ..   if p.is_prime():
 *     ..     print '%x'%p
 *     ..     break
 *   'fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f'
 *  sage: a = 0
 *  sage: b = 7
 *  sage: F = FiniteField (p)
 *  sage: '%x' % (EllipticCurve ([F (a), F (b)]).order())
 *   'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'
 */
___static__constant secp256k1_fe secp256k1_ecdsa_const_order_as_fe = SECP256K1_FE_CONST(
    0xFFFFFFFFUL, 0xFFFFFFFFUL, 0xFFFFFFFFUL, 0xFFFFFFFEUL,
    0xBAAEDCE6UL, 0xAF48A03BUL, 0xBFD25E8CUL, 0xD0364141UL
);

/** Difference between field and order, values 'p' and 'n' values defined in
 *  "Standards for Efficient Cryptography" (SEC2) 2.7.1.
 *  sage: p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
 *  sage: a = 0
 *  sage: b = 7
 *  sage: F = FiniteField (p)
 *  sage: '%x' % (p - EllipticCurve ([F (a), F (b)]).order())
 *   '14551231950b75fc4402da1722fc9baee'
 */
___static__constant secp256k1_fe secp256k1_ecdsa_const_p_minus_order = SECP256K1_FE_CONST(
    0, 0, 0, 1, 0x45512319UL, 0x50B75FC4UL, 0x402DA172UL, 0x2FC9BAEEUL
);
#endif

int APPEND_ADDRESS_SPACE(secp256k1_ecdsa_sig_verify)(
  ADDRESS_SPACE_CONTEXT const secp256k1_ecmult_context *ctx, 
  ADDRESS_SPACE_INPUTS const secp256k1_scalar *sigr, 
  ADDRESS_SPACE_INPUTS const secp256k1_scalar *sigs, 
  ADDRESS_SPACE_INPUTS const secp256k1_ge *pubkey, 
  ADDRESS_SPACE_INPUTS const secp256k1_scalar *message
) {
  unsigned char c[32];
  secp256k1_scalar sn, u1, u2;
  secp256k1_fe xr;
  secp256k1_gej pubkeyj;
  secp256k1_gej pr;
  logGPU << "DEBUG: verifying. Context is: " << ctx << Logger::endL;
  if (APPEND_ADDRESS_SPACE(secp256k1_scalar_is_zero)(sigr) || APPEND_ADDRESS_SPACE(secp256k1_scalar_is_zero)(sigs)) {
    return 0;
  }

  APPEND_ADDRESS_SPACE(secp256k1_scalar_inverse_var)(&sn, sigs);
  APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(&u1, &sn, message);
  APPEND_ADDRESS_SPACE(secp256k1_scalar_mul)(&u2, &sn, sigr);
  APPEND_ADDRESS_SPACE_INPUTS(secp256k1_gej_set_ge)(&pubkeyj, pubkey);

  APPEND_ADDRESS_SPACE(secp256k1_ecmult)(ctx, &pr, &pubkeyj, &u2, &u1);
  if (secp256k1_gej_is_infinity(&pr)) {
    return 0;
  }
  APPEND_ADDRESS_SPACE(secp256k1_scalar_get_b32)(c, sigr);
  secp256k1_fe_set_b32(&xr, c);

  /** We now have the recomputed R point in pr, and its claimed x coordinate (modulo n)
   *  in xr. Naively, we would extract the x coordinate from pr (requiring a inversion modulo p),
   *  compute the remainder modulo n, and compare it to xr. However:
   *
   *        xr == X(pr) mod n
   *    <=> exists h. (xr + h * n < p && xr + h * n == X(pr))
   *    [Since 2 * n > p, h can only be 0 or 1]
   *    <=> (xr == X(pr)) || (xr + n < p && xr + n == X(pr))
   *    [In Jacobian coordinates, X(pr) is pr.x / pr.z^2 mod p]
   *    <=> (xr == pr.x / pr.z^2 mod p) || (xr + n < p && xr + n == pr.x / pr.z^2 mod p)
   *    [Multiplying both sides of the equations by pr.z^2 mod p]
   *    <=> (xr * pr.z^2 mod p == pr.x) || (xr + n < p && (xr + n) * pr.z^2 mod p == pr.x)
   *
   *  Thus, we can avoid the inversion, but we have to check both cases separately.
   *  secp256k1_gej_eq_x implements the (xr * pr.z^2 mod p == pr.x) test.
   */
  logGPU << "DEBUG: got to the real part. \nXr = " << toStringSecp256k1_FieldElement(xr) << Logger::endL;
  if (secp256k1_gej_eq_x_var(&xr, &pr)) {
    /* xr.x == xr * xr.z^2 mod p, so the signature is valid. */
    return 1;
  }
  logGPU << "DEBUG: secp256k1_ecdsa_const_p_minus_order= "
         << toStringSecp256k1_FieldElement(secp256k1_ecdsa_const_p_minus_order) << Logger::endL;
  //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
  if (secp256k1_fe_cmp_var__constant__constant__global(&xr, &secp256k1_ecdsa_const_p_minus_order) >= 0) {
    /* xr + p >= n, so we can skip testing the second case. */
    logGPU << "Signature not valid. " << Logger::endL;
    return 0;
  }
  //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
  secp256k1_fe_add__constant__constant__global(&xr, &secp256k1_ecdsa_const_order_as_fe);
  if (secp256k1_gej_eq_x_var(&xr, &pr)) {
    /* (xr + n) * pr.z^2 mod p == pr.x, so the signature is valid. */
    return 1;
  }
  return 0;
}

int APPEND_ADDRESS_SPACE(secp256k1_ecdsa_sig_recover)(const secp256k1_ecmult_context *ctx, const secp256k1_scalar *sigr, const secp256k1_scalar* sigs, secp256k1_ge *pubkey, const secp256k1_scalar *message, int recid) {
  unsigned char brx[32];
  secp256k1_fe fx;
  secp256k1_ge x;
  secp256k1_gej xj;
  secp256k1_scalar rn, u1, u2;
  secp256k1_gej qj;

  if (secp256k1_scalar_is_zero(sigr) || secp256k1_scalar_is_zero(sigs)) {
    return 0;
  }

  secp256k1_scalar_get_b32(brx, sigr);
  VERIFY_CHECK(secp256k1_fe_set_b32(&fx, brx)); /* brx comes from a scalar, so is less than the order; certainly less than p */
  if (recid & 2) {
    //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
    if (secp256k1_fe_cmp_var__constant__constant__global(&fx, &secp256k1_ecdsa_const_p_minus_order) >= 0) {
      return 0;
    }
    //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
    secp256k1_fe_add__constant__constant__global(&fx, &secp256k1_ecdsa_const_order_as_fe);
  }
  if (!secp256k1_ge_set_xo_var(&x, &fx, recid & 1)) {
    return 0;
  }
  secp256k1_gej_set_ge(&xj, &x);
  secp256k1_scalar_inverse_var(&rn, sigr);
  secp256k1_scalar_mul(&u1, &rn, message);
  secp256k1_scalar_negate(&u1, &u1);
  secp256k1_scalar_mul(&u2, &rn, sigs);
  secp256k1_ecmult(ctx, &qj, &xj, &u2, &u1);
  secp256k1_ge_set_gej_var(pubkey, &qj);
  return !secp256k1_gej_is_infinity(&qj);
}
//******end of ecdsa_impl.h******
