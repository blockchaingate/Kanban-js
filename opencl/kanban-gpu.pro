TEMPLATE = app
CONFIG += console c++11
CONFIG -= app_bundle
CONFIG -= qt

SOURCES += \
main.cpp \
    gpu.cpp \
    server.cpp \
    miscellaneous.cpp

LIBS+=-lOpenCL

HEADERS += \
    cl/sha256GPU.cl \
    gpu.h \
    server.h \
    logging.h \
    miscellaneous.h

DISTFILES += \
    cl/secp256k1.cl \
    cl/testBuffer.cl
