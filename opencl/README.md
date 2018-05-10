# Kanban openCL code


## The secp256k1 library.  
This is the cryptography library of Kanban, and includes signature and hashing code.
Our library is a fork of Pieter Wuille's sipa library https://github.com/sipa/secp256k1. 
As of May 2018, the sipa library is the crypto library used in bitcoin core.


### Modifications made to secp256k1
We have made significant modifications to the library, in order to run it both on the CPU and on the GPU. 


As of May 2018, the goals of the modifications are the following.

1)  Port the code to openCL, while keeping it valid vanilla C/CPP.
    More precisely, we commit that our code shall compile/build
    both as a CPP and an openCL program (within our setup).
    - Our C build target is any vanilla CPP compiler.
    - Our openCL build target is openCL 1.1 or 1.2 on all devices 
      we can test. 
2)  Refactor (or write new) tests and benchmarks to match our 
    system's setup.
3)  Introduce cosmetic changes to match FA's variable/class naming 
    style. The primary aim of Step 4 is to introduce our team
    to the inner workings of the code, while trying to
    preserve the code's original aesthetics. 

Further comments.

1)  We will refactor to openCL 2.0 when we are confident 
    hardware support for it is good. 
    In other words, we have no plan to refactor to openCL 2.0 
    in the foreseeable future.
    For example, at the time of writing (May 2018), my work machine
    NVidia Quadro K2000 + stock Ubuntu supports only openCL 1.1. 
2)  Henceforth, we will try to keep FA's comments 
    in the double-forward slash style, so as to distinguish from 
    Pieter Wuille's comments written in the multi-line comment style.
     
    This is deliberate: our fork from secp256k1 is significant
    and it is important to distinguish modified from non-modified 
    snippets of code. 
