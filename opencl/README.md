# Kanban openCL code


## The secp256k1 library.  
This is the cryptography library of Kanban, and includes signature and hashing code.
Our library is a fork of Pieter Wuille's library https://github.com/sipa/secp256k1. 
As of May 2018, this is one of the development branches of the library used in bitcoin core.

### Modifications made to secp256k1
We have made significant modifications to the library, in order to run it both on the CPU and on the GPU. 

As of May 2018, the goals of the modifications are the following.

1)  Port the code to openCL, while keeping it valid vanilla C/C++.
    More precisely, we commit that our code shall compile/build
    both as a C++ and an openCL program (within our setup).
    - Our C++ build target is the default gcc C++ compiler on as many distributions as possible.
    - Our openCL build target is openCL 1.1 or 1.2 on all devices 
      we can test. 
2)  Refactor (or write new) tests and benchmarks to match our 
    system's setup.
3)  Introduce cosmetic changes to match FA's variable/class naming 
    style. The primary aim of Step 3 is to introduce our team
    to the inner workings of the code, while trying to
    preserve the code's original aesthetics. 

Further comments.

1)  openCL 1.2 requires strict separation between "out-of-GPU" memory addresses and
    "in-GPU" memory addresses. 
    In particular, functions that operate on both "in-GPU" addresses and "out-of-GPU"
    addresses need separate versions for each function argument address space combination.
    Except for the __constant memory address space, 
    this problem is addressed in openCL 2.0 using the generic address space.
    However, as of May 2018, openCL 2.0 is not properly supported on many platforms 
    (including my work machine as well as the latest RADEON GPU series). 
    That is why this is not an acceptable solution.

    We have therefore decided to replicate each function argument address space combination
    with a system of macros. The macros emulate what in C++ is usually achieved with templates.
     

2)  We have chosen to collapse the library in fewer files. 
    This was an ad-hoc decision which we used to minimize our
    work on point 1). Where applicable, 
    we have noted the origin of each piece of code
    in our version. 
    The original library structure may be restored in the future.

3)  We will refactor to openCL 2.0 when we are confident 
    hardware support for it is good. 
    In other words, we have no plan to refactor to openCL 2.0 
    in the foreseeable future.
    For example, at the time of writing (May 2018), my work machine
    NVidia Quadro K2000 + stock Ubuntu supports only openCL 1.1. 

    Please note that whenever the openCL 2.0 drivers work, 
    our code gets automatically all benefits associated with it.
    In other words, our use of openCL 1.1 should not incur any computational performance penalty.

4)  Henceforth, we will try to keep FA's comments 
    in the double-forward slash style, so as to distinguish from 
    secp256k1's comments written in the multi-line comment style.
     
    This is deliberate: our fork from secp256k1 is significant
    and it is important to distinguish modified from non-modified 
    snippets of code. 
