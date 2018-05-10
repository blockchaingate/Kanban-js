TEMPLATE = app
CONFIG += console c++11
CONFIG -= app_bundle
CONFIG -= qt

SOURCES += \
    main.cpp \
    gpu.cpp \
    server.cpp \
    miscellaneous.cpp \
    test.cpp \
    cl/secp256k1_to_string_methods.cpp \
    secp256k1_interface.cpp \
    cl/secp256k1_cpp.cpp

LIBS+=-lOpenCL

HEADERS += \
    gpu.h \
    server.h \
    logging.h \
    miscellaneous.h \
    cl/secp256k1.h \
    cl/secp256k1_cpp.h \
    secp256k1_interface.h

DISTFILES += \
    cl/testBuffer.cl
