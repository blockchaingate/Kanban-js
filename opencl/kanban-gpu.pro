TEMPLATE = app
CONFIG += console c++11
CONFIG -= app_bundle
CONFIG -= qt

SOURCES += \
main.cpp \
    gpu.cpp \
    server.cpp \
    miscellaneous.cpp \
    test.cpp

LIBS+=-lOpenCL

HEADERS += \
    gpu.h \
    server.h \
    logging.h \
    miscellaneous.h \
    cl/secp256k1_opencl.h

DISTFILES += \
    cl/testBuffer.cl
